import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'kikis-store/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const paymentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'kikis-store/payments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
});

const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'kikis-store/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 600, height: 400, crop: 'fill', quality: 'auto' }],
  },
});

const qrStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'kikis-store/qr',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const categoryUploadDir = path.resolve(__dirname, '../../uploads/categories');
fs.mkdirSync(categoryUploadDir, { recursive: true });
const productUploadDir = path.resolve(__dirname, '../../uploads/products');
fs.mkdirSync(productUploadDir, { recursive: true });

const localProductStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const localCategoryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, categoryUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (file.mimetype?.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

export const uploadProduct = multer({ storage: localProductStorage, fileFilter: imageFileFilter });
export const uploadPayment = multer({ storage: paymentStorage });
export const uploadCategory = multer({ storage: localCategoryStorage, fileFilter: imageFileFilter });
export const uploadQR = multer({ storage: qrStorage });
export const uploadSettingsMedia = multer({ storage: multer.memoryStorage(), fileFilter: imageFileFilter });
export { cloudinary };
