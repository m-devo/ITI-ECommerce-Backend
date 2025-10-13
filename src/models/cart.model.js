import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true, 
        required: true
    },
    items: [{ 
        bookId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'books',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity can not be less than 1.'],
            default: 1
        }
    }]
    }, {
        timestamps: true
})

export const Cart = mongoose.model("Cart", cartSchema);