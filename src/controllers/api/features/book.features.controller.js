import bookService from "../../../services/book.service.js";
import Book from "../../../models/bookSchema.js"
import cacheService from "../../../services/cache.service.js";

import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js"; 
import catchAsync from "../../../utils/catchAsync.js";

// POST book of the day
const setBookofTheDay = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "Book ID is required");
    }
    const book = await bookService.bookOfTheDay(id);

    res.status(200).json(new ApiResponse(200, { book }, "Book of the day has been set successfully"));
});


// GET book of the day
const getBookOfTHeDay = catchAsync(async (req, res, next) => {
    const bookOfTheDay = await Book.findOne({ featuredAt: { $exists: true, $ne: null } });

    if (!bookOfTheDay) {
        throw new ApiError(404, "No book of the day found");
    }

    res.status(200).json(new ApiResponse(200, { book: bookOfTheDay }, "Book of the day retrieved successfully"));
});


const cachehomeData = catchAsync(async (req, res, next) => {
    const cacheKey = "homepage"; 
    const cacheData = await cacheService.get(cacheKey);

    if (cacheData) {
        console.log("Cache Hit: Serving home data from Redis");
        return res.status(200).json(new ApiResponse(200, cacheData, "Data retrieved from cache"));
    }
    
    console.log("Cache Miss: Fetching home data from database");
    const [latestBooks, featuredBook] = await Promise.all([
        Book.find().sort({ createdAt: -1 }).limit(5),
        Book.findOne({ featuredAt: { $exists: true, $ne: null } })
    ]);

    const homeData = { latestBooks, featuredBook }; 
    
    // Set data in cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, homeData, 600);

    return res.status(200).json(new ApiResponse(200, homeData, "Data retrieved from database"));
});

export default {setBookofTheDay, getBookOfTHeDay, cachehomeData};