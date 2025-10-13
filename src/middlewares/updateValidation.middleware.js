import Book from '../models/bookSchema.js';

const validateBookUpdate = async (req, res, next) => {
  const { title, author, price, stock, descrption } = req.body;
  const bookFile = req.files?.book?.[0];
  const imageFile = req.files?.image?.[0];

  const MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024; // 6GB
  const errors = [];

  if (title !== undefined && !title.trim())
    errors.push('Title cannot be empty');
  if (author !== undefined && !author.trim())
    errors.push('Author cannot be empty');
  if (descrption !== undefined && !descrption.trim())
    errors.push('Description cannot be empty');

  if (price !== undefined) {
    if (isNaN(price)) errors.push('Price must be a number');
    else if (Number(price) <= 0)
      errors.push('Price must be a positive number');
  }

  if (stock !== undefined) {
    if (isNaN(stock)) errors.push('Stock must be a number');
    else if (Number(stock) < 0)
      errors.push('Stock must be a positive number or zero');
  }

  if (bookFile && bookFile.size > MAX_FILE_SIZE)
    errors.push('Book file size exceeds 6GB');
  if (imageFile && imageFile.size > MAX_FILE_SIZE)
    errors.push('Image file size exceeds 6GB');

  if (title && author) {
    const existingBook = await Book.findOne({ title, author });
    if (existingBook && existingBook._id.toString() !== req.params.ID) {
      errors.push(
        `This author already has a book titled "${title}". Please choose a different title.`
      );
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      errors,
    });
  }

  next();
};

export { validateBookUpdate };
