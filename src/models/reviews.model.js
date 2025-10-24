import mongoose from "mongoose";
import Book from "../models/bookSchema.js"

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

//  Function: Recalculate book ratings
async function recalcBookRating(bookId, ReviewModel) {
    const stats = await ReviewModel.aggregate([
        { $match: { book: bookId } },
        {
            $group: {
                _id: "$book",
                avgRating: { $avg: "$rating" },
                numReviews: { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        await Book.findByIdAndUpdate(bookId, {
            averageRating: Number(stats[0].avgRating.toFixed(1)),
            reviewCount: stats[0].numReviews,
        });
    } else {
        await Book.findByIdAndUpdate(bookId, {
            averageRating: 0,
            reviewCount: 0,
        });
    }
}


//  Middleware — after save
reviewSchema.post("save", async function () {
    try { await recalcBookRating(this.book, this.constructor); }
    catch (err) { console.error('recalc error', err); }
});


//  Middleware — after remove
reviewSchema.post("remove", async function () {
    try { await recalcBookRating(this.book, this.constructor); }
    catch (err) { console.error('recalc error', err); }
});

// handle findOneAndDelete / findOneAndUpdate
reviewSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        try { await recalcBookRating(doc.book, this.model); }
        catch (e) { console.error("recalc after delete failed:", e); }
    }
});

reviewSchema.post("findOneAndUpdate", async function (doc) {
    if (doc) {
        try { await recalcBookRating(doc.book, this.model); }
        catch (e) { console.error("recalc after update failed:", e); }
    }
});



export const Review = mongoose.model("Review", reviewSchema);