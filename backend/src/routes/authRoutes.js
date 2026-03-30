import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many requests' });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

export default router;
