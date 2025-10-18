import express from "express"
import mongoose from "mongoose"
import fs from 'fs'
import path from 'path'
import Book from '../../../models/bookSchema.js'
import ApiError from "../../../utils/ApiError.js"
import ApiResponse from "../../../utils/ApiResponse.js"
import catchAsync from "../../../utils/catchAsync.js"

const getBooks  = catchAsync(async (req, res, next) => {
  const { limit = 10, page = 1, author, category, minPrice, maxPrice, title } = req.query;
  const skip = (page - 1) * limit;
  const filter = { isDeleted: false }; 

  if (author) filter.author = { $regex: author, $options: "i" }; 
  if (category) filter.category = { $regex: category, $options: "i" };
  if (title) filter.title = { $regex: title, $options: "i" };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const books = await Book.find(filter, { "__v": 0 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  if (!books.length) {
    return res.status(404).json(new ApiResponse(404, [], 'No books found'));
  }

  return res.status(200).json(new ApiResponse(200, books, 'Books fetched successfully'));
});

const getOneBook = catchAsync(async (req, res, next) => {
  const { ID } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ID)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid Book ID.'));
  }

  const book = await Book.findOne({ _id: ID, isDeleted: false }, { "__v": 0 });

  if (!book) {
    return res.status(404).json(new ApiResponse(404, null, 'Book not found'));
  }

  return res.status(200).json(new ApiResponse(200, book, 'Book fetched successfully'));
});


const createBook = catchAsync(async(req,res,next)=>{
    const {title,author,stock,descrption,price,category} = req.body
    const { imagePath, bookPath } = req.savedFiles || {}

  const newBook = await Book.create({
    title,
    author,
    price,
    descrption,
    stock,
    bookPath,
    imagePath,
    category,
    isDeleted: false 
  });
    return res
    .status(201)
    .json(new ApiResponse(201, newBook, 'Book created successfully'));

})

const updateBook = catchAsync(async (req, res, next) => {
  const { ID } = req.params;
  if (!mongoose.Types.ObjectId.isValid(ID)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Invalid Book ID. Please provide a valid ID.'));
  }

  const book = await Book.findById(ID);
  if (!book) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, 'Book not found'));
  }

  const fieldsToUpdate = ['title', 'author', 'price', 'stock', 'descrption','category'];
  fieldsToUpdate.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      book[field] = req.body[field];
    }
  });
  if (req.files?.book?.[0]) {
    const bookFile = req.files.book[0];

    if (book.bookPath && fs.existsSync(book.bookPath)) {
      fs.unlinkSync(book.bookPath);
    }

    const newBookPath = path.join('uploads', 'books', `${Date.now()}-${bookFile.originalname.replace(/\s+/g, '_')}`);
    fs.writeFileSync(newBookPath, bookFile.buffer);
    book.bookPath = newBookPath;
  }

  if (req.files?.image?.[0]) {
    const imageFile = req.files.image[0];

    if (book.imagePath && fs.existsSync(book.imagePath)) {
      fs.unlinkSync(book.imagePath);
    }

    const newImagePath = path.join('public', 'images', `${Date.now()}-${imageFile.originalname.replace(/\s+/g, '_')}`);
    fs.writeFileSync(newImagePath, imageFile.buffer);
    book.imagePath = newImagePath;
  }

  await book.save();

  return res
    .status(200)
    .json(new ApiResponse(200, book, 'Book updated successfully'));
});


const deleteBook =catchAsync(async (req, res, next) => {
  const { ID }  = req.params;

  if (!mongoose.Types.ObjectId.isValid(ID)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Invalid Book ID.'));
  }

  const book = await Book.findById(ID);
  if (!book || book.isDeleted) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, 'Book not found'));
  }

  book.isDeleted = true;
  await book.save();

  return res
    .status(200)
    .json(new ApiResponse(200, book, 'Book marked as deleted.'));
});




export {
  createBook,
  getBooks,
  getOneBook,
  updateBook,
  deleteBook
}















