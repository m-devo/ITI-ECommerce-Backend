import express from "express";
import {subscribeToNewsletter, unsubscribeFromNewsletter}  from "../controllers/api/news/news.controller.js";
import { isAuth } from '../middlewares/isAuth.middleware.js'; 
const newsRouter = express.Router();

newsRouter.post('/subscribe', subscribeToNewsletter);

newsRouter.patch('/unsubscribe', isAuth, unsubscribeFromNewsletter);


export default newsRouter;