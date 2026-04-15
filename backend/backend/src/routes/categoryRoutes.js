import express from 'express';
import {
  getCategories, getAllActiveCategories, getCategoryById,
  createCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { uploadCategory } from '../config/cloudinary.js';
import { publicApiLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

router.get('/', publicApiLimiter, getCategories);
router.get('/all', publicApiLimiter, getAllActiveCategories);
router.get('/:id', publicApiLimiter, getCategoryById);
router.post('/', protect, adminOnly, uploadCategory.single('image'), createCategory);
router.put('/:id', protect, adminOnly, uploadCategory.single('image'), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;
