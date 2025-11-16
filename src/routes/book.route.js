import express from "express";
import {
  createBook,
  getBooks,
  getOneBook,
  updateBook,
  deleteBook,
  updateBookAuthor
} from "../controllers/api/admin/book.controller.js";
import { validateBookUpload } from "../middlewares/validateBookFields.js";
import { upload_field, validateAndSaveFiles } from "../middlewares/storage.middleware.js";
import restrictTo from '../middlewares/restrictTo.middleware.js';
import protect from "../middlewares/protect.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js"

import { validateBookUpdate } from "../middlewares/updateValidation.middleware.js"
import { verify } from "crypto";
const bookRouter = express.Router();
bookRouter.get('/allBooks' ,protect,restrictTo('admin'),getBooks)
bookRouter.get('/oneBook/:ID', protect, restrictTo('admin'), getOneBook)
bookRouter.patch('/update/:ID', verifyToken, protect,
  restrictTo('admin'),
  upload_field,
  validateBookUpdate,
  updateBook
)

bookRouter.patch('/update/:ID', verifyToken, protect,
  restrictTo('author'),
  upload_field,
  validateBookUpdate,
  updateBookAuthor
)
bookRouter.delete('/delete/:ID', protect, restrictTo('admin'), deleteBook)

bookRouter.post(
  "/create",
  verifyToken,
  protect, restrictTo('admin', 'author'),
  upload_field,
  validateBookUpload,
  validateAndSaveFiles,
  createBook
);

export default bookRouter;
