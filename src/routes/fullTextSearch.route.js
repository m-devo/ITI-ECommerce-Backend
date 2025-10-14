import express from "express";
import { searchBooks, suggestBooks, facetSearch } from "./../controllers/search/fullTextSearch.js";

const router = express.Router();

// 1. Basic Text Search
router.get("/", searchBooks);

// 2. Suggestions / Autocomplete
router.get("/suggest", suggestBooks);

// 3. Faceted Search (Filtering)
router.get("/facets", facetSearch);

export default router;
/////////////////////////////////

