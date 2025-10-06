// import { Router } from 'express';
// import { UserController } from '../controllers/api/admin/user.controller.js';
// // import { objectId } from '../../validations/objectId.validation.js';
// // import { validate } from '../middlewares/validate.middleware.js';

// const router = Router();

// router.get('/', UserController.getAllUsers);

// router.get(
//     '/:id',
//     // validate(objectId),
//     UserController.getUserById
// );

// export default router;

import express from "express";
import {
  getUsers,
  registerUser,
  loginUser,
  verifyEmail,
} from "../controller/authController.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

// User routes
// get all users
userRouter.get("/api/users", verifyToken, getUsers);
// register a new user
userRouter.post("/api/users/register", registerUser);
// login user
userRouter.post("/api/users/login", loginUser);
// verify email
userRouter.get("/api/users/verify/:token", verifyEmail);

export default userRouter;
