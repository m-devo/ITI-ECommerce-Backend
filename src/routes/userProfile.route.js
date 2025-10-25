import { Router } from 'express';
import { UserController } from '../controllers/api/user/user.controller.js';

const router = Router();

router.get('/profile', UserController.getUserProfile);
router.get('/orders', UserController.getUserOrders);
router.get('/books', UserController.getUserBooks);

export default router;