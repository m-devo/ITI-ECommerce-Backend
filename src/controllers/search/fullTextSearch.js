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

//  Faceted Search (Filtering)
export const facetSearch = async (req, res) => {
    try {
        const { author, minPrice, maxPrice } = req.query;

        const filter = {};

        if (author) filter.author = author;
        if (minPrice || maxPrice) {
            filter.price = {
                ...(minPrice && { $gte: Number(minPrice) }),
                ...(maxPrice && { $lte: Number(maxPrice) }),
            };
        }

        const results = await Book.find(filter);
        return res.status(200).json(new ApiResponse(200, results, "Searched Books"))
    } catch (error) {
        throw new ApiError(500, 'Server Error')
    }
};
