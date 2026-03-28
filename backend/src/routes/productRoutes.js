import express from 'express';
import {
  getProducts, getAdminProducts, getProductBySlug, getProductById,
  createProduct, updateProduct, deleteProduct, getFeaturedProducts,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { uploadProduct } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/admin/all', protect, adminOnly, getAdminProducts);
router.get('/admin/:id', protect, adminOnly, getProductById);
router.get('/:slug', getProductBySlug);
router.post('/', protect, adminOnly, uploadProduct.array('images', 5), createProduct);
router.put('/:id', protect, adminOnly, uploadProduct.array('images', 5), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
