import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/authRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import supplierRoutes from './src/routes/supplierRoutes.js';
import rawMaterialRoutes from './src/routes/rawMaterialRoutes.js';
import productionRoutes from './src/routes/productionRoutes.js';
import { inventoryRouter, offlineSaleRouter, dashboardRouter, productPurchaseRouter, settingsRouter, heroSectionRouter, themeSettingRouter } from './src/routes/index.js';
import errorHandler from './src/middlewares/errorHandler.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const normalizeOrigin = (value = '') => String(value || '').replace(/\/+$/, '');

const parseTrustProxy = () => {
  const value = process.env.TRUST_PROXY;
  if (value === undefined) return process.env.NODE_ENV === 'production' ? 1 : false;
  if (value === 'true') return 1;
  if (value === 'false') return false;
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
};

// Security & parsing
app.set('trust proxy', parseTrustProxy());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigin = normalizeOrigin(process.env.CLIENT_URL || 'http://localhost:5173');
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', store: "KIKI'S RETURN GIFT STORE" }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRouter);
app.use('/api/offline-sales', offlineSaleRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/product-purchases', productPurchaseRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/hero-section', heroSectionRouter);
app.use('/api/theme-settings', themeSettingRouter);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

export default app;
