import { Review } from "./../../models/reviews.model.js";
import { transcribeAudio } from "../../utils/speechToText.js";

export const createReview = async (req, res) => {
    try {
        console.log("📩 Incoming review data:", req.body);
        console.log("🎧 Uploaded file:", req.file);
        console.log("👤 Authenticated user:", req.user);

        const { user, book, rating, comment, language } = req.body;

        let audioUrl = null;
        let transcription = null;

        let newReviewData = {
            user,
            book,
            rating,
            comment,
        };

        // If the user uploaded an audio file
        if (req.file) {
            const audioPath = req.file.path;

            // Use AI to transcribe audio
            transcription = await transcribeAudio(audioPath);

            audioUrl = audioPath; // Save file path
        }

        // Save to MongoDB
        const review = await Review.create({
            user:user,
            book,
            rating,
            comment,
            audioUrl,
            transcription,
            language
        });

        res.status(201).json({
            message: req.file,
            reviews:review
        });
    } catch (error) {
        console.error("Error creating review:", error);
        console.log("req.user:", req.user);

         res.status(500).json({ error: error.message })
    }
};
