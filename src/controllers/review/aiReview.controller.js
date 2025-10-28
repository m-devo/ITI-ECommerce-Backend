import { Review } from "./../../models/reviews.model.js";
import { transcribeAudio } from "../../utils/speechToText.js";

export const createReview = async (req, res) => {
    try {
        console.log("📩 Incoming review data:", req.body);
        console.log("🎧 Uploaded file:", req.file);
        console.log("👤 Authenticated user:", req.currentUser);

        const { book, rating, comment } = req.body;

        const user = req.currentUser.id; // من verifyToken middleware
        let audioUrl = null;
        let transcription = null;


        // If the user uploaded an audio file
        if (req.file) {
            const audioPath = req.file.path;

            // Use AI to transcribe audio
            transcription = await transcribeAudio(audioPath);

            audioUrl = audioPath; // Save file path
        }

        // Save to MongoDB
        const review = await Review.create({
            user: req.currentUser.id,
            book,
            rating,
            comment,
            audioUrl,
            transcription,
        });

        res.status(201).json({
            message: req.file,
            reviews: review
        });
    } catch (error) {
        console.error("Error creating review:", error);
        console.log("req.user:", req.user);

        res.status(500).json({ error: error.message })
    }
};

// get all reviews for book
export const getReviewsByBook = async (req, res) => {

    try {
        const { bookId } = req.params;

        // bookId
        const reviews = await Review.find({ book: bookId })
            .populate("user", "firstName email")
            .populate("book", "title author")
            .sort({ createdAt: -1 });

        if (!reviews.length) {
            return res.status(404).json({ message: "No reviews found for this book" });
        }

        res.status(200).json(reviews);

    } catch (err) {
        console.error("Error fetching reviews by book:", err);
        res.status(500).json({ error: err.message });
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
            return res.status(404).json({ message: "No reviews found for this User" });
        }

        res.status(200).json(reviews);



    } catch (err) {
        console.error("Error fetching reviews by user:", err);
        res.status(500).json({ error: err.message });
    }
}

// update review 
export const updateReview = async (req, res) => {
    try {
        console.log(req.body);

        const reviewId = req.params.id; // review ID from URL
        const currentUser = req.currentUser; // from verifyToken middleware
        const { rating, comment } = req.body || {}; // new data

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ status: "fail", message: "Review not found" });
        }

        if (review.user.toString() !== currentUser.id.toString()) {
            return res.status(403).json({ status: "fail", message: "You can only edit your own reviews" });
        }

        if (rating !== undefined && rating !== null) {
            review.rating = rating;
        }

        // 4. Handle text or audio comment
        if (comment) {
            review.comment = comment;
        }
        if (req.file) {
            // Transcribe the audio
            const transcript = await transcribeAudio(req.file.path);
            if (!transcript)
                return res.status(500).json({ message: "Audio transcription failed" });
            review.transcription = transcript;
            review.audioUrl = req.file.path; // optional: save file path
        };

        await review.save();

        res.json({
            status: "success",
            message: "Review updated successfully",
            review,
        });
    } catch (err) {
        console.error("❌ Error updating review:", err);
        res.status(500).json({ error: err.message });
    }
}

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params; // review ID from URL
        const currentUser = req.currentUser; // from verifyToken middleware

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                status: "fail",
                message: "Review not found",
            });
        }

        if (review.user.toString() !== currentUser.id) {
            return res.status(403).json({
                status: "fail",
                message: "You are not allowed to delete this review",
            });
        }

        // Delete the review
        await Review.findByIdAndDelete(id);

        res.status(200).json({
            status: "success",
            message: "Review deleted successfully",
        });


    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({
            status: "error",
            message: err,
        });
    }
}