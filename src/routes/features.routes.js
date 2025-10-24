import express from "express";
import featuresController from "../controllers/api/features/book.features.controller.js";
import protect from "../middlewares/protect.middleware.js";
import restrictTo from "../middlewares/restrictTo.middleware.js";
const featuresRouter = express.Router();

featuresRouter.post("/:id/manual-book-of-the-day",
// POST Book of the Day By Admin

    protect, 
    restrictTo("admin"),
    featuresController.setBookofTheDay
)

featuresRouter.get("/bookOftheDay", 
    featuresController.getBookOfTHeDay
)

featuresRouter.get("/homepage", 
    featuresController.cachehomeData
);
export default featuresRouter;