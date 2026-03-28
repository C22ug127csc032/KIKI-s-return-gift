import express from 'express';
import {
  createOrder, getMyOrders, getOrderById, getOrderByNumber,
  getAllOrders, updateOrderStatus, uploadPaymentScreenshot, uploadPaymentScreenshotByOrderNumber,
} from '../controllers/orderController.js';
import { protect, adminOnly, optionalAuth } from '../middlewares/auth.js';
import { uploadPayment } from '../config/cloudinary.js';
import { generateOrderInvoice } from '../services/invoiceService.js';

const router = express.Router();

router.post('/', optionalAuth, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/number/:orderNumber', getOrderByNumber);
router.put('/number/:orderNumber/payment-screenshot', optionalAuth, uploadPayment.single('screenshot'), uploadPaymentScreenshotByOrderNumber);
router.get('/:id', protect, getOrderById);
router.get('/:id/invoice', protect, generateOrderInvoice);

// Admin
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/payment-screenshot', protect, adminOnly, uploadPayment.single('screenshot'), uploadPaymentScreenshot);

export default router;
