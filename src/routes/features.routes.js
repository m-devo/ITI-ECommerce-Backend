import express from "express";
import featuresController from "../controllers/api/features/book.features.controller.js";
const featuresRouter = express.Router();

featuresRouter.post("/:id/manual-book-of-the-day",
// POST Book of the Day By Admin

    // protect, 
    // restrictTo("admin"),
    featuresController.setBookofTheDay
)

featuresRouter.get("/bookOftheDay", 
    // protect, 
    // restrictTo("admin"),
    featuresController.getBookOfTHeDay
)

featuresRouter.get("/homepage", 
    featuresController.cachehomeData
);
export default featuresRouter;