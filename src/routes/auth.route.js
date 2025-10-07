import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
} from "../controllers/api/auth/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

// register a new user
userRouter.post("/register", registerUser);
// login user
userRouter.post("/login", loginUser);
// verify email
userRouter.get("/verify/:token", verifyEmail);

export default userRouter;
