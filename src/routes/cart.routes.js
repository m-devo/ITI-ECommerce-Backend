import { Router } from 'express';
import { CartController } from '../controllers/api/cart/cart.controller.js';
import { updateBookSchema, modifyBookSchema } from '../validations/cart.validation.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.get('/', CartController.getUserCart);
router.put('/update', validate(updateBookSchema), CartController.updateBooksInCart);
router.put('/increment', validate(modifyBookSchema), CartController.incrementItemQuantity);
router.put('/decrement', validate(modifyBookSchema), CartController.decrementItemQuantity);
router.delete('/remove', validate(modifyBookSchema), CartController.removeItemFromCart);
router.delete('/clear', CartController.clearCart);

router.post('/abandoned-cart', CartController.AbandonedCartReminder);

export default router;