import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    items: [{ 
        bookId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity can not be less than 1.'],
            default: 1
        },
        price: {type: Number, required: true, min: [0, 'Price can not be negative.']}
    }],
    billingData: [{
        fullName: String,
        address: String,
        city: String,
        postalCode: String,
        country: String,
        phone: String,
        _id: false
    }],
    paymentMethod: {type: String, required: true},
    totalPrice: { type: Number, required: true},
    totalItems: { type: Number, required: true},
    status: {type: String, enum :["pending", "paid", "cancelled", "completed"], default: "pending"}

},{timestamps: true});

export const Order = mongoose.model("Order", orderSchema)