import { mongoose } from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "this email is not a valid !",
    },
  },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "author"], default: "user" },
  token: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  activeSessionToken: { type: String, default: null },
  pendingDeviceToken: { type: String, default: null },
  pendingDeviceTokenExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  isSubscribedToNewsService: {type: Boolean},

});

export const User = mongoose.model("User", userSchema);
