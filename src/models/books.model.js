// import { required } from "joi";
import mongoose from "mongoose";
// import validator from validator

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    // author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Author", required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    bookImage: { type: String, required: true },
    averageRating: { type: Number, default: 0 },
    // isBookofTheDay: {type: Boolean, default:false, index: true},
    featuredAt: { type: Date, index: true },
    reviewCount: { type: Number, default: 0 },
    recomendedBooks: [{ // for recommendations engine 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    }],
    descriptionVector: { //for smart search
        type: [Number]
    },

}, { timestamps: true })

bookSchema.index({ title: "text", description: "text", category: "text", author: "text" });


export const Book = mongoose.model("Book", bookSchema)