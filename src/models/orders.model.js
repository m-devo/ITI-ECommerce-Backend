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
    billingData: {
        type: { 
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            country: { type: String, required: true },
            state: { type: String, required: true },
            city: { type: String, required: true }
        }, 
        required: true,
        _id: false
    },
    paymentMethod: {type: String, required: true},
    totalPrice: { type: Number, required: true},
    totalItems: { type: Number, required: true},
    status: {type: String, enum :["pending", "paid", "cancelled", "completed"], default: "pending"},
    paymentTransactionId: { type: String, default: null}

},{timestamps: true});

orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema)