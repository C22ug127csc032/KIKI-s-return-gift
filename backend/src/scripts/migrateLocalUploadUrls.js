import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { normalizeLocalUploadUrl } from '../utils/uploadPaths.js';

dotenv.config();

const LOCAL_UPLOAD_URL_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\/uploads\//i;
const DRY_RUN = process.argv.includes('--dry-run');

const shouldNormalize = (url) => typeof url === 'string' && LOCAL_UPLOAD_URL_PATTERN.test(url);

const migrateCategories = async () => {
  const categories = await Category.find({ image: LOCAL_UPLOAD_URL_PATTERN });
  let updated = 0;

  for (const category of categories) {
    if (!shouldNormalize(category.image)) continue;
    category.image = normalizeLocalUploadUrl(category.image);
    updated += 1;
    if (!DRY_RUN) await category.save();
  }

  return updated;
};

const migrateProducts = async () => {
  const products = await Product.find({ 'images.url': LOCAL_UPLOAD_URL_PATTERN });
  let updated = 0;

  for (const product of products) {
    let changed = false;
    product.images.forEach((image) => {
      if (!shouldNormalize(image.url)) return;
      image.url = normalizeLocalUploadUrl(image.url);
      changed = true;
    });

    if (!changed) continue;
    updated += 1;
    if (!DRY_RUN) await product.save();
  }

  return updated;
};

const migrateOrders = async () => {
  const orders = await Order.find({ 'items.image': LOCAL_UPLOAD_URL_PATTERN });
  let updated = 0;

  for (const order of orders) {
    let changed = false;
    order.items.forEach((item) => {
      if (!shouldNormalize(item.image)) return;
      item.image = normalizeLocalUploadUrl(item.image);
      changed = true;
    });

    if (!changed) continue;
    updated += 1;
    if (!DRY_RUN) await order.save();
  }

  return updated;
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
  if (DRY_RUN) console.log('Dry run enabled. No documents will be saved.');

  const [categories, products, orders] = await Promise.all([
    migrateCategories(),
    migrateProducts(),
    migrateOrders(),
  ]);

  console.log(`Categories ${DRY_RUN ? 'to update' : 'updated'}: ${categories}`);
  console.log(`Products ${DRY_RUN ? 'to update' : 'updated'}: ${products}`);
  console.log(`Orders ${DRY_RUN ? 'to update' : 'updated'}: ${orders}`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
