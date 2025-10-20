import express from "express";
import { createReview } from "../controllers/review/aiReview.controller.js";
import { uploadAudio } from "../middlewares/uploadAudio.js";
import { verifyToken } from "../middlewares/auth.middleware.js";


const router = express.Router();


//  The same endpoint can handle both text and audio reviews
router.post("/", verifyToken, uploadAudio.single("audio"), createReview);

export default router;

uploadAudio.single("audio")