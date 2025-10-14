import { Book } from "./../../models/books.model.js";

//  Basic Text Search
export const searchBooks = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) return res.status(400).json({ message: "Missing search query" });

        const results = await Book.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
