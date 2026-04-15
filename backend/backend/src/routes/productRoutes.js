import express from 'express';
import {
  getProducts, getAdminProducts, getProductBySlug, getProductById,
  createProduct, updateProduct, updateProductBom, deleteProduct, getFeaturedProducts,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { uploadProduct } from '../config/cloudinary.js';
import { publicApiLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

router.get('/', publicApiLimiter, getProducts);
router.get('/featured', publicApiLimiter, getFeaturedProducts);
router.get('/admin/all', protect, adminOnly, getAdminProducts);
router.get('/admin/:id', protect, adminOnly, getProductById);
router.put('/:id/bom', protect, adminOnly, updateProductBom);
router.get('/:slug', publicApiLimiter, getProductBySlug);
router.post('/', protect, adminOnly, uploadProduct.array('images', 5), createProduct);
router.put('/:id', protect, adminOnly, uploadProduct.array('images', 5), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
