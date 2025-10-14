import express from "express";
import { createBook,
  getBooks,
  getOneBook,
  updateBook,
  deleteBook
 } from "../controllers/api/admin/book.controller.js";
import {validateBookUpload} from "../middlewares/validateBookFields.js";
import { upload_field, validateAndSaveFiles } from "../middlewares/storage.middleware.js";
import restrictTo from '../middlewares/restrictTo.middleware.js';
import protect  from "../middlewares/protect.middleware.js";

import {validateBookUpdate} from "../middlewares/updateValidation.middleware.js"
const bookRouter = express.Router();
bookRouter.get('/allBooks',getBooks)
bookRouter.get('/oneBook/:ID',protect,restrictTo('admin'),getOneBook)
bookRouter.patch('/update/:ID', protect,
 restrictTo('admin'),
   upload_field,
   validateBookUpdate,
  updateBook
)
bookRouter.delete('/delete/:ID',protect,restrictTo('admin'),deleteBook)

bookRouter.post(
  "/create",
  protect,restrictTo('admin','author'),
  upload_field,
  validateBookUpload,
  validateAndSaveFiles,
  createBook
);

export default bookRouter;
