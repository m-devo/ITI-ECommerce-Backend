import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true},
    cartItems: [{
        book: {type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true},
        quantity: {type: Number, required:true},
    }],
    lastUpdateAt:{ type: Date, default: Date.now},
    reminderSent: {type: Boolean, default: false}
}
, {timestamps: true}
)

cartSchema.pre("save", function(next) {
        if(this.isModified("cartItems")) {
            this.lastUpdateAt = new Date();
            this.reminderSent = false
    }
    next()
    
})

export const Cart = mongoose.model("Cart", cartSchema);