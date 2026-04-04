import express from 'express';
import { getInventoryMovements, adjustStock, getLowStockProducts } from '../controllers/inventoryController.js';
import { createOfflineSale, getOfflineSales, getOfflineSaleById } from '../controllers/offlineSaleController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { generateOfflineSaleInvoice } from '../services/invoiceService.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { uploadSettingsMedia } from '../config/cloudinary.js';

export const inventoryRouter = express.Router();
inventoryRouter.get('/movements', protect, adminOnly, getInventoryMovements);
inventoryRouter.post('/adjust', protect, adminOnly, adjustStock);
inventoryRouter.get('/low-stock', protect, adminOnly, getLowStockProducts);

export const offlineSaleRouter = express.Router();
offlineSaleRouter.post('/', protect, adminOnly, createOfflineSale);
offlineSaleRouter.get('/', protect, adminOnly, getOfflineSales);
offlineSaleRouter.get('/:id', protect, adminOnly, getOfflineSaleById);
offlineSaleRouter.get('/:id/invoice', protect, adminOnly, generateOfflineSaleInvoice);

export const dashboardRouter = express.Router();
dashboardRouter.get('/stats', protect, adminOnly, getDashboardStats);

export const settingsRouter = express.Router();
settingsRouter.get('/', getSettings);
settingsRouter.put(
  '/',
  protect,
  adminOnly,
  uploadSettingsMedia.fields([
    { name: 'qrImage', maxCount: 1 },
    { name: 'heroImage', maxCount: 1 },
  ]),
  updateSettings
);
