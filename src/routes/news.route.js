import express from "express";
import newsServiceController from "../controllers/api/news/news.controller.js";
// import protect from "../middlewares/protect.middleware.js"
// import restrictTo from "../middlewares/restrictTo.middleware.js"

const newsRouter = express.Router();

newsRouter.post("/weeklynews", 
    // protect,
    // restrictTo("admin"),
    newsServiceController
);

export default newsRouter;