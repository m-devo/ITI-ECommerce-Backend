import mongoose from "mongoose";

const orderShema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    books: [{
        book: {type: mongoose.Schema.Types.ObjectId, ref: "Book"},
        quantity: Number,
        price: Number,
    }],
    totalPrice: { type: Number, required: true},
    status: {type: String, enum :["pending", "paid", "cancelled"], default: "pending"}

},{timestamps: true});

export const Order = mongoose.model("Order", orderShema)