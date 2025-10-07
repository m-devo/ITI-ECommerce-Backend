import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  logoutUser,
} from "../controllers/api/auth/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

// register a new user
userRouter.post("/register", registerUser);
// login user
userRouter.post("/login", loginUser);
// verify email
userRouter.get("/verify/:token", verifyEmail);
// logout user
userRouter.post("/logout", verifyToken, logoutUser);

export default userRouter;
