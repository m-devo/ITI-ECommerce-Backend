

import Book from '../models/bookSchema.js';

const validateBookUpload = async (req, res, next) => {
    const { title, author, price, stock, descrption } = req.body;
    const bookFile = req.files?.book?.[0];
    const imageFile = req.files?.image?.[0];

    const MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024; // 6GB
    const errors = [];
    if (!descrption) errors.push('Description is required');
    if (!title) errors.push('Title is required');
    if (!author) errors.push('Author is required');
    if (!price) errors.push('Price is required');
    if (!stock) errors.push('Stock is required');

    if (price && (isNaN(price) || Number(price) <= 0))
        errors.push('Price must be a positive number');
    if (stock && (isNaN(stock) || Number(stock) < 0))
        errors.push('Stock must be a positive number');

    if (bookFile && bookFile.size > MAX_FILE_SIZE)
        errors.push('Book file size exceeds 6GB');
    if (imageFile && imageFile.size > MAX_FILE_SIZE)
        errors.push('Image file size exceeds 6GB');


    if (title && author) {
        const existingBook = await Book.findOne({ title, author });
        if (existingBook) {
            errors.push(
                `This author already has a book titled "${title}". Please choose a different title.`
            );
        }
    }


    if (errors.length > 0) {
        return res.status(400).json({
            statusCode: 400,
            success: false,
            errors
        });
    }

    next();
};

export { validateBookUpload };
