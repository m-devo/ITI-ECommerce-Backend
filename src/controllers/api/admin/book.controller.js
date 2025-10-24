import express from "express"
import mongoose from "mongoose"
import fs from 'fs'
import path from 'path'
import Book from '../../../models/bookSchema.js'
import ApiError from "../../../utils/ApiError.js"
import ApiResponse from "../../../utils/ApiResponse.js"
import catchAsync from "../../../utils/catchAsync.js"
import s3 from "../../../../config/s3config.js"

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
// 

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
    const {title,author,stock,description,price,category} = req.body
    const { imagePath, bookPath } = req.savedFiles || {}

  const newBook = await Book.create({
    title,
    author,
    price,
    description,
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
  try {
    const { ID } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ID)) {
      return res.status(400).json(new ApiResponse(400, null, 'Invalid Book ID.'));
    }

    const book = await Book.findById(ID);
    if (!book) {
      return res.status(404).json(new ApiResponse(404, null, 'Book not found'));
    }

    const extractKeyFromUrl = (url) => {
      try {
        const parts = url.split('.amazonaws.com/');
        return parts[1] || url;
      } catch {
        return url;
      }
    };

    const fieldsToUpdate = ['title', 'author', 'price', 'stock', 'description', 'category'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        book[field] = req.body[field];
      }
    });


    if (req.files?.book?.[0]) {
      const bookFile = req.files.book[0];
      console.log('New book file received:', bookFile.originalname);

      if (book.bookPath) {
        const oldBookKey = extractKeyFromUrl(book.bookPath);
        console.log('Deleting old book file from S3:', oldBookKey);
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldBookKey,
          }).promise();
          console.log('Old book deleted successfully');
        } catch (err) {
          console.error('Failed to delete old book:', err.message);
        }
      }

      try {
        console.log('Uploading new book file...');
        const uploadBook = await s3.upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `books/${Date.now()}-${bookFile.originalname}`,
          Body: bookFile.buffer,
          ContentType: bookFile.mimetype,
        }).promise();

        console.log('New book uploaded:', uploadBook.Location);
        book.bookPath = uploadBook.Location; 
      } catch (err) {
        console.error('Failed to upload new book:', err.message);
      }
    }
    if (req.files?.image?.[0]) {
      const imageFile = req.files.image[0];
      console.log('New image file received:', imageFile.originalname);

      if (book.imagePath) {
        const oldImageKey = extractKeyFromUrl(book.imagePath);
        console.log('Deleting old image from S3:', oldImageKey);
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldImageKey,
          }).promise();
          console.log('Old image deleted successfully');
        } catch (err) {
          console.error('Failed to delete old image:', err.message);
        }
      }

      try {
        console.log('Uploading new image...');
        const uploadImage = await s3.upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `images/${Date.now()}-${imageFile.originalname}`,
          Body: imageFile.buffer,
          ContentType: imageFile.mimetype,
        }).promise();

        console.log('New image uploaded:', uploadImage.Location);
        book.imagePath = uploadImage.Location; 
      } catch (err) {
        console.error('Failed to upload new image:', err.message);
      }
    }

    await book.save();
    console.log('Book updated in database successfully');

    return res.status(200).json(new ApiResponse(200, book, 'Book updated successfully'));
  } catch (error) {
    console.error('Error in updateBook:', error);
    return res.status(500).json(new ApiResponse(500, null, 'Error updating book'));
  }
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















