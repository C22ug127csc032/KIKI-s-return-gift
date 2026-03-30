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
import { inventoryRouter, offlineSaleRouter, dashboardRouter, settingsRouter } from './src/routes/index.js';
import errorHandler from './src/middlewares/errorHandler.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security & parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
app.use('/api/settings', settingsRouter);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

export default app;
