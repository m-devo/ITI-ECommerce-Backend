import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    details: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    status: { type: String, enum: ["new", "inProgress", "resolved", "closed"], default: "new"},
    replies: [{ sender: {type: mongoose.Schema.Types.ObjectId,ref: "User", required: true }, 
    message: {type: String, required: true}, 
    createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

complaintSchema.index({ user: 1, status: 1 });

export const Complaint = mongoose.model("Complaint", complaintSchema);