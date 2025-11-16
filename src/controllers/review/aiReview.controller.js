import { Review } from "./../../models/reviews.model.js";
import { transcribeAudio } from "../../utils/speechToText.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import { cleanText, containsBadWords } from "../../utils/profanityFilter.js";

export const createReview = async (req, res) => {
    try {
        // console.log("📩 Incoming review data:", req.body);
        // console.log("🎧 Uploaded file:", req.file);
        // console.log("👤 Authenticated user:", req.currentUser);

        const { book, rating } = req.body;
        let { comment } = req.body;

        const user = req.currentUser.id; // من verifyToken middleware
        let audioUrl = null;
        let transcription = null;

        if (comment) {
            if (containsBadWords(String(comment))) {
                comment = cleanText(String(comment));
            };
        }


        // If the user uploaded an audio file
        if (req.file) {
            const audioPath = req.file.path;

            // Use AI to transcribe audio
            transcription = await transcribeAudio(audioPath);
            if (containsBadWords(transcription)) {
                transcription = cleanText(transcription);
            };

            audioUrl = audioPath; // Save file path
        }

        // Save to MongoDB
        const review = await Review.create({
            user,
            book,
            rating,
            comment,
            audioUrl,
            transcription,
        });

        res.status(201).json(new ApiResponse(201, review, "Review created successfully"));
    } catch (error) {
        console.error("Error creating review:", error);
        throw new ApiError(500, error.message);
    }
};

// get all reviews for book
export const getReviewsByBook = async (req, res) => {
    try {
        const { bookId } = req.params;

        const reviews = await Review.find({ book: bookId })
            .populate("user", "firstName email")
            .populate("book", "title author")
            .sort({ createdAt: -1 });

        if (!reviews.length) {
            return res.status(404).json(new ApiError(404, "No reviews found for this book"));
        }

        res.status(200).json(new ApiResponse(200, reviews, "Reviews retrieved successfully"));
    } catch (err) {
        console.error("Error fetching reviews by book:", err);
        throw new ApiError(500, err.message);
    }
}

// get all reviews for book
export const getReviewsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.find({ user: userId })
            .populate("user", "firstName email")
            .populate("book", "title author")
            .sort({ createdAt: -1 });
        if (!reviews.length) {
            return res.status(404).json(new ApiError(404, "No reviews found for this user"));
        }

        res.status(200).json(new ApiResponse(200, reviews, "User reviews retrieved successfully"));
    } catch (err) {
        console.error("Error fetching reviews by user:", err);
        throw new ApiError(500, err.message);
    }
}

// update review
export const updateReview = async (req, res) => {
    try {
        console.log(req.body);

        const reviewId = req.params.id; // review ID from URL
        const currentUser = req.currentUser; // from verifyToken middleware
        const { rating } = req.body || {}; // new data
        let { comment } = req.body;
        const review = await Review.findById(reviewId);

        if (!review) {
            throw new ApiError(404, "Review not found");
        }

        if (review.user.toString() !== currentUser.id.toString()) {
            throw new ApiError(403, "You can only edit your own reviews");
        }

        if (rating !== undefined && rating !== null) {
            review.rating = rating;
        }

        // Handle text or audio comment
        if (comment) {
            if (containsBadWords(comment)) {
                comment = cleanText(comment);
            };

            review.comment = comment;
        }
        if (req.file) {
            // Transcribe the audio
            const transcript = await transcribeAudio(req.file.path);
            if (!transcript) throw new ApiError(500, "Audio transcription failed");
            if (containsBadWords(transcript)) {
                transcript = cleanText(transcript);
            };
            review.transcription = transcript;
            review.audioUrl = req.file.path; // optional: save file path
        }

        await review.save();

        res.status(200).json(new ApiResponse(200, review, "Review updated successfully"));
    } catch (err) {
        console.error("❌ Error updating review:", err);
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError(500, err.message);
    }
}

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params; // review ID from URL
        const currentUser = req.currentUser; // from verifyToken middleware

        const review = await Review.findById(id);
        if (!review) {
            throw new ApiError(404, "Review not found");
        }

        if (review.user.toString() !== currentUser.id) {
            throw new ApiError(403, "You are not allowed to delete this review");
        }

        // Delete the review
        await Review.findByIdAndDelete(id);

        res.status(200).json(new ApiResponse(200, null, "Review deleted successfully"));
    } catch (err) {
        console.error("Error deleting review:", err);
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError(500, err.message);
    }
}