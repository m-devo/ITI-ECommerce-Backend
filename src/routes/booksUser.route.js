import { Router } from 'express';
import {getAllBooks, getBookById,
   // getBookSummary
} from "../controllers/api/users/booksUser.controller.js"
const router = Router();


router.get('/books',getAllBooks)

router.get("/books/:id", getBookById);
//router.get("/books/:id/summary", getBookSummary);

export default router;