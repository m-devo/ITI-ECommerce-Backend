import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utils/ApiError.js";
import { uploadToS3 } from "../utils/uploadToS3.js"; 
import catchAsync from "../utils/catchAsync.js";
import AuthorRequest from "../models/AuthorRequest.js";


export const checkAuthorRequestEligibility = catchAsync(async (req, res, next) => {
  const loggedUserId = req.user?._id?.toString();
  if (!loggedUserId) throw new ApiError(401, "Unauthorized: User not logged in");

  const requestedUserId =
   req.params?.userId?.toString()||
    req.body?.user?.toString() ||
    req.body?.userId?.toString() 
   
  if (requestedUserId && requestedUserId !== loggedUserId) {
    throw new ApiError(401, "You are not allowed to create request for another user.");
  }
  const requests = await AuthorRequest.find({ user: loggedUserId }).sort({ createdAt: -1 });

  if (requests.length > 0) {
    const latest = requests[0];
    if (latest.status === "approved") {
      throw new ApiError(400, "You are already an approved author.");
    }
    if (latest.status === "pending") {
      throw new ApiError(400, "You already have a pending request.");
    }

    const rejectedCount = requests.filter(r => r.status === "rejected").length;
    if (rejectedCount >= 2) {
      throw new ApiError(400, "Maximum author request attempts reached.");
    }
  }

  next();
});


export const checkAuthorRequestOwnership = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized: User not logged in");

  const { requestId } = req.params;
  const request = await AuthorRequest.findById(requestId);
  if (!request) throw new ApiError(404, "Request not found");

  if (request.user.toString() !== userId.toString()) {
    throw new ApiError(401, "You can only edit your own request");
  }

  req.authorRequest = request; 
  next();
});


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedFields = ["idCard", "selfie"];
  if (!allowedFields.includes(file.fieldname)) {
    return cb(new ApiError(400, "Invalid field name"));
  }
  if (!file.mimetype.startsWith("image/")) {
    return cb(new ApiError(400, `${file.fieldname} must be an image`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

export const uploadAuthorRequestFiles = (req, res, next) => {
  const handler = upload.fields([
    { name: "idCard", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]);
  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "File upload error" });
    }
    next();
  });
};

export const validateAndSaveAuthorFiles = async (req, res, next) => {
  try {
    const idCard = req.files?.idCard?.[0];
    const selfie = req.files?.selfie?.[0];

    if (!idCard || !selfie) throw new ApiError(400, "Both ID card and selfie are required.");

    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const folder = `authorRequests/${userId}`;
    const idCardUrl = await uploadToS3(idCard.buffer, idCard.originalname, folder);
    const selfieUrl = await uploadToS3(selfie.buffer, selfie.originalname, folder);

    req.savedFiles = { idCard: idCardUrl, selfie: selfieUrl };
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Error uploading files to S3" });
  }
};

export const handleAuthorFiles = async (files, userId, isCreate = true) => {
  if (!files) files = {};
  const { idCard, selfie } = files;

  if (isCreate && (!idCard?.[0] || !selfie?.[0])) {
    throw new ApiError(400, "Both ID card and selfie are required.");
  }

  const folder = `authorRequests/${userId}`;
  const savedFiles = {};
  if (idCard?.[0]) savedFiles.idCard = await uploadToS3(idCard[0].buffer, idCard[0].originalname, folder);
  if (selfie?.[0]) savedFiles.selfie = await uploadToS3(selfie[0].buffer, selfie[0].originalname, folder);

  return savedFiles;
};
