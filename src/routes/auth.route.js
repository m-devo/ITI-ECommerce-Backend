import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  verifyDeviceLogin,
  logoutUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/api/auth/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.get("/profile", verifyToken , getUserProfile);

// register a new user
userRouter.post("/register", registerUser);
// login user
userRouter.post("/login", loginUser);
// verify email
userRouter.get("/verify/:token", verifyEmail);
// verify new device login
userRouter.get("/verify-device/:token", verifyDeviceLogin);
// logout user
userRouter.post("/logout", verifyToken, logoutUser);
// forgot password
userRouter.post("/forgot-password", forgotPassword);
// reset password
userRouter.post("/reset-password/:token", resetPassword);

export default userRouter;
