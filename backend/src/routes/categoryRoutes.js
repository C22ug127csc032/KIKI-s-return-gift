import express from 'express';
import {
  getCategories, getAllActiveCategories, getCategoryById,
  createCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { uploadCategory } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/all', getAllActiveCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, adminOnly, uploadCategory.single('image'), createCategory);
router.put('/:id', protect, adminOnly, uploadCategory.single('image'), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;
