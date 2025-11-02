import express from "express";
import { createReview, getReviewsByBook, getReviewsByUser, updateReview, deleteReview } from "../controllers/review/aiReview.controller.js";
import { uploadAudio } from "../middlewares/uploadAudio.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import restrictTo from "../middlewares/restrictTo.middleware.js";
import protect from "../middlewares/protect.middleware.js";

const router = express.Router();


// add review The same endpoint can handle both text and audio reviews
router.post("/add", verifyToken, uploadAudio.single("audio"), createReview);

//  Get all reviews by Book
router.get("/book/:bookId", getReviewsByBook);

//  Get all reviews by User
router.get("/user/:userId", getReviewsByUser);

// edit review
router.put("/edit/:id", verifyToken, uploadAudio.single("audio"), updateReview);

// Delete review (only owner or admin)
router.delete("/delete/:id", verifyToken, protect, restrictTo('admin', 'user', 'author'), deleteReview);


export default router;

