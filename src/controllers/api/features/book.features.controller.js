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
    const [bestSellers, featuredBook, categorySummary] = await Promise.all([
      Book.find({ 
            isDeleted: false, 
            reviewCount: { $gt: 0 } 
          })
          .sort({ reviewCount: -1, averageRating: -1 }) 
          .limit(4), 
        Book.findOne({ featuredAt: { $exists: true, $ne: null } }),

    Book.aggregate([
      { 
        $match: { 
          isDeleted: false, 
          category: { $ne: null, $exists: true, $ne: "" } 
        } 
      },
      
      { 
        $group: { 
          _id: "$category", 
          bookCount: { $sum: 1 }, 
          imagePath: { $first: "$imagePath" } 
        } 
      },
      
      {
        $addFields: {
          imagePath: {
            $ifNull: [ "$imagePath", "assets/images/category-design.avif" ]
          }
        }
      },
      
      { $sort: { bookCount: -1 } }, 
      
      { $limit: 3 },

      {
        $project: {
          _id: 0, 
          category: '$_id', 
          count: '$bookCount',
          imagePath: '$imagePath'
        }
      }
    ])
]);

const homeData = { bestSellers, featuredBook, categorySummary }; 
    
    // Set data in cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, homeData, 600);

    return res.status(200).json(new ApiResponse(200, homeData, "Data retrieved from database"));
});

export default {setBookofTheDay, getBookOfTHeDay, cachehomeData};