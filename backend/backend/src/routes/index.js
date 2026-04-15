import express from 'express';
import { getInventoryMovements, adjustStock, getLowStockProducts } from '../controllers/inventoryController.js';
import { createOfflineSale, getOfflineSales, getOfflineSaleById } from '../controllers/offlineSaleController.js';
import { createProductPurchase, getProductPurchases } from '../controllers/productPurchaseController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { getHeroSection, updateHeroSection } from '../controllers/heroSectionController.js';
import { getThemeSetting, updateThemeSetting } from '../controllers/themeSettingController.js';
import { generateOfflineSaleInvoice } from '../services/invoiceService.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { uploadSettingsMedia } from '../config/cloudinary.js';
import { publicApiLimiter } from '../middlewares/rateLimiters.js';

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

export const productPurchaseRouter = express.Router();
productPurchaseRouter.get('/', protect, adminOnly, getProductPurchases);
productPurchaseRouter.post('/', protect, adminOnly, createProductPurchase);

export const settingsRouter = express.Router();
settingsRouter.get('/', publicApiLimiter, getSettings);
settingsRouter.put(
  '/',
  protect,
  adminOnly,
  uploadSettingsMedia.fields([{ name: 'qrImage', maxCount: 1 }]),
  updateSettings
);

export const heroSectionRouter = express.Router();
heroSectionRouter.get('/', publicApiLimiter, getHeroSection);
heroSectionRouter.put(
  '/',
  protect,
  adminOnly,
  uploadSettingsMedia.fields([
    { name: 'slideImage0', maxCount: 1 },
    { name: 'slideImage1', maxCount: 1 },
    { name: 'slideImage2', maxCount: 1 },
  ]),
  updateHeroSection
);

export const themeSettingRouter = express.Router();
themeSettingRouter.get('/', publicApiLimiter, getThemeSetting);
themeSettingRouter.put('/', protect, adminOnly, updateThemeSetting);
