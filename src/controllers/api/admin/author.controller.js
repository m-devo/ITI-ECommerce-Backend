import AuthorRequest from "../../../models/AuthorRequest.js";
import express from "express"
import mongoose from "mongoose"
import fs from 'fs'
import path from 'path'
import ApiError from "../../../utils/ApiError.js"
import ApiResponse from "../../../utils/ApiResponse.js"
import catchAsync from "../../../utils/catchAsync.js"
import s3 from "../../../../config/s3config.js"
import { uploadToS3 } from "../../../utils/uploadToS3.js";

import {handleAuthorFiles} from "../../../middlewares/authorUpload.middleware.js"


export const createAuthorRequest = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized: User not logged in.");

  const { fullName, bio } = req.body;

  const existingRequest = await AuthorRequest.findOne({ user: userId }).sort({ createdAt: -1 });
  if (existingRequest && existingRequest.status === "pending") {
    throw new ApiError(400, "You already have a pending author request.");
  }

  if (!req.savedFiles?.idCard || !req.savedFiles?.selfie) {
    throw new ApiError(400, "Both ID card and selfie are required.");
  }

  const newRequest = await AuthorRequest.create({
    user: userId,
    fullName,
    bio,
    idCard: req.savedFiles.idCard,
    selfie: req.savedFiles.selfie,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newRequest, "Author request created successfully."));
});


export const updateAuthorRequest = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized.");

  const { requestId } = req.params;
  const request = await AuthorRequest.findOne({ _id: requestId, user: userId });
  if (!request) throw new ApiError(404, "Request not found or permission denied.");
  if (request.status !== "pending")
    throw new ApiError(400, "Only pending requests can be edited.");
  if (req.body.status)
    throw new ApiError(400, "You cannot change the request status manually.");

  const savedFiles = await handleAuthorFiles(req.files, userId, false);


  const deleteFile = async (oldUrl) => {
    if (!oldUrl) return;
    try {
      const key = oldUrl.split(".amazonaws.com/")[1];
      if (key)
        await s3
          .deleteObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: key })
          .promise();
    } catch (err) {
      console.error("Failed to delete old file:", err.message);
    }
  };

  if (savedFiles.idCard && request.idCard) await deleteFile(request.idCard);
  if (savedFiles.selfie && request.selfie) await deleteFile(request.selfie);

  const updatedRequest = await AuthorRequest.findByIdAndUpdate(
    requestId,
    { ...req.body, ...savedFiles },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedRequest, "Author request updated successfully."));
});


export const getAuthorRequest = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized: User not logged in.");

  const lastRequest = await AuthorRequest.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .exec();

  if (!lastRequest)
    throw new ApiError(404, "No author request found for this user.");

  return res
    .status(200)
    .json(new ApiResponse(200, lastRequest, "Author request retrieved successfully."));
});


export const getAllAuthorRequests = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = {};
  if (status) {
    const allowedStatuses = ["pending", "approved", "rejected"];
    if (!allowedStatuses.includes(status.toLowerCase())) {
      throw new ApiError(
        400,
        "Invalid status filter. Allowed values: pending, approved, rejected."
      );
    }
    filter.status = status.toLowerCase();
  }

  const totalRequests = await AuthorRequest.countDocuments(filter);

  const requests = await AuthorRequest.find(filter)
    .populate("user", "name email role")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const responseData = {
    totalRequests,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalRequests / limit),
    results: requests.length,
    data: requests,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Author requests retrieved successfully."));
});

export const updateAuthorRequestStatus = catchAsync(async (req, res, next) => {
  const { requestId } = req.params;
  const { status, adminNote } = req.body;
  const adminId = req.user?._id;

  if (!adminId) throw new ApiError(401, "Unauthorized");

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const allowedStatuses = ["pending", "approved", "rejected"];
  if (!allowedStatuses.includes(status.toLowerCase())) {
    throw new ApiError(400, "Invalid status. Allowed: pending, approved, rejected");
  }

  const request = await AuthorRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }


  const updateFields = {
    status: status.toLowerCase(),
    reviewedBy: adminId,
    reviewedAt: new Date(),
  };

  if (adminNote) updateFields.adminNote = adminNote;

  const updated = await AuthorRequest.findByIdAndUpdate(requestId, updateFields, { new: true });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Author request status updated successfully."));
});