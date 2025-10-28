import mongoose from "mongoose";

const authorRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      maxlength: 500,
    },

    idCard: {
      type: String,
      required: true,
    },

    selfie: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuthorRequest", authorRequestSchema);
