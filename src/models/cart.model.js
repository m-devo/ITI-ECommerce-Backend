import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true, 
        required: true
    },
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
        }
    }]
    }, {
        timestamps: true
})

cartSchema.pre("save", function(next) {
        if(this.isModified("items")) {
            this.lastUpdateAt = new Date();
            this.reminderSent = false
    }
    next()
    
})

export const Cart = mongoose.model("Cart", cartSchema);