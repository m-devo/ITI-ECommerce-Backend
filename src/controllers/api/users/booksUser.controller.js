import Book from "../../../models/bookSchema.js";
import { Review } from "../../../models/reviews.model.js";
import ApiError from "../../../utils/ApiError.js"
import ApiResponse from "../../../utils/ApiResponse.js"
import catchAsync from "../../../utils/catchAsync.js"
import mongoose from "mongoose";
import SummarizerManager from "node-summarizer";
export const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const books = await Book.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "book",
          as: "reviews",
        },
      },

      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $round: [{ $avg: "$reviews.rating" }, 1] },
              0,
            ],
          },
        },
      },

      {
        $project: {
          _id: 1,
          title: 1,
          author: 1,
          category: 1,
          price: 1,
          imagePath: 1,
          uploadedAt: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
      { $sort: { uploadedAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    const totalBooks = await Book.countDocuments({ isDeleted: false });

    res.status(200).json({
      success: true,
      currentPage: Number(page),
      totalPages: Math.ceil(totalBooks / limit),
      totalBooks,
      books,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid book ID" });
    }

    const book = await Book.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), isDeleted: false } },

      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "book",
          as: "reviews",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $round: [{ $avg: "$reviews.rating" }, 1] },
              0,
            ],
          },
        },
      },

      {
        $project: {
          __v: 0,
          isDeleted: 0,
          bookPath: 0,
          uploadedAt: 0,
          "reviews.__v": 0,
          "reviews.updatedAt": 0,
          "reviews.book": 0,
        },
      },
      {
        $addFields: {
          reviews: {
            $map: {
              input: "$reviews",
              as: "r",
              in: {
                user: "$$r.user",
                rating: "$$r.rating",
                comment: { $ifNull: ["$$r.comment", ""] },
                createdAt: "$$r.createdAt",
              },
            },
          },
        },
      },
    ]);

    if (!book.length) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.status(200).json({
      success: true,
      book: book[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

