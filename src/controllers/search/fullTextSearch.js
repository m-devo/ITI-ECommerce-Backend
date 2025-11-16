import  Book  from "../../models/bookSchema.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

//  Basic Text Search
export const searchBooks = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) return res.status(400).json({ message: "Missing search query" });

        const results = await Book.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });

        res.status(200).json(new ApiResponse(200, results, "Searched Books"))
    } catch (error) {
        throw new ApiError(500, 'Server Error')
    }
};

// Suggest / Autocomplete
export const suggestBooks = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) return res.status(400).json({ message: "Missing query" });

        const suggestions = await Book.find(
            { title: { $regex: query, $options: "i" } }
        )
            .limit(5)
            .select("title author");

        return res.status(200).json(new ApiResponse(200, suggestions, "Searched Books"))

    } catch (error) {
        throw new ApiError(500, 'Server Error')
    }
};

// Faceted Search (Filtering) 
export const facetSearch = async (req, res) => {
    try {
        const { author, minPrice, maxPrice, category, page = 1, limit = 10, sort } = req.query;

        const filter = { isDeleted: false };
        
        if (author) filter.author = author;
        if (category) filter.category = category;
        
        if (minPrice || maxPrice) {
            filter.price = {
                ...(minPrice && { $gte: Number(minPrice) }),
                ...(maxPrice && { $lte: Number(maxPrice) }),
            };
        }
        
        const skip = (Number(page) - 1) * Number(limit);

        const sortStage = {};
        if (sort) {
            const [field, order] = sort.split(':'); 
            sortStage[field] = order === 'asc' ? 1 : -1; 
        } else {
            sortStage['createdAt'] = -1; 
        }

        const results = await Book.aggregate([
            { $match: filter },
            {
                $facet: {
                    "books": [
                        { $sort: sortStage }, 
                        { $skip: skip },
                        { $limit: Number(limit) }
                    ],
                    "totalBooks": [
                        { $count: "count" }
                    ],
                    "categories": [
                        { $group: { _id: "$category", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    "authors": [
                        { $group: { _id: "$author", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 20 }
                    ]
                }
            }
        ]);

        const books = results[0].books;
        const totalBooks = results[0].totalBooks[0] ? results[0].totalBooks[0].count : 0;
        
        const facets = {
            categories: results[0].categories,
            authors: results[0].authors
        };

        return res.status(200).json(new ApiResponse(200, {
            books: books,
            facets: facets,
            currentPage: Number(page),
            totalPages: Math.ceil(totalBooks / limit),
            totalBooks
        }, "Searched Books"))

    } catch (error) {
        console.error("Error in facetSearch:", error);
        throw new ApiError(500, 'Server Error: ' + error.message)
    }
}