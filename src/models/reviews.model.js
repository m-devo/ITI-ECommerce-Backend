import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    audioUrl: { type: String, trim: true },
    // AI transcription of the audio
    transcription: { type: String, trim: true },
    // //  language detection or chosen language
    // language: { type: String, enum: ["en", "ar"], default: "en" }

}, { timestamps: true })

export const Review = mongoose.model("Review", reviewSchema);