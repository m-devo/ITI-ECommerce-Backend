import { Router } from 'express';
import { getUsers, registerUser, loginUser, verifyEmail } from '../api/v1/auth/authController.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify/:token', verifyEmail);

export default router;
