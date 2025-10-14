import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    cartItems: [{
        book: {type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true},
        quantity: Number
    }],
    lastUpdateAt: Date,
    reminderSent: Boolean
})

export const Cart = mongoose.model("Cart", cartSchema);