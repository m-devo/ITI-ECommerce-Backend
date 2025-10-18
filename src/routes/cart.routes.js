import { Router } from 'express';
import { CartController } from '../controllers/api/cart/cart.controller.js';
import { updateBookSchema, bookIdParamSchema } from '../validations/cart.validation.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.get('/', CartController.getUserCart);
router.put('/update', validate(updateBookSchema), CartController.updateBooksInCart);
router.put('/items/:bookId/increment', validate(bookIdParamSchema), CartController.incrementItemQuantity);
router.put('/items/:bookId/decrement', validate(bookIdParamSchema), CartController.decrementItemQuantity);
router.delete('/items/:bookId', validate(bookIdParamSchema), CartController.removeItemFromCart);
router.delete('/clear', CartController.clearCart);

router.post('/abandoned-cart', CartController.AbandonedCartReminder);

export default router;