import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductPurchase from '../models/ProductPurchase.js';
import InventoryMovement from '../models/InventoryMovement.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination, buildSortQuery } from '../utils/pagination.js';
import { cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProductDiscountPercentage } from '../utils/pricing.js';
import { buildLocalUploadPath, getLocalUploadFileName } from '../utils/uploadPaths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads');

const buildProductImage = (req, file) => {
  if (!file) return null;
  if (file.path?.startsWith('http')) {
    return { url: file.path, publicId: file.filename || null };
  }
  return {
    url: buildLocalUploadPath('products', file.filename),
    publicId: null,
  };
};

const removeLocalProductImage = (imageUrl) => {
  const fileName = getLocalUploadFileName(imageUrl, 'products');
  if (!fileName) return;
  const filePath = path.join(uploadsRoot, 'products', path.basename(fileName));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseOccasions = (value) => {
  if (value === undefined) return undefined;
  if (!value) return [];

  const parsed = typeof value === 'string' ? (() => {
    try {
      return JSON.parse(value);
    } catch {
      return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  })() : value;

  if (!Array.isArray(parsed)) return [];

  return [...new Set(parsed.map((item) => String(item).trim()).filter(Boolean))];
};

const ensureUniqueProductName = async (name, productId = null) => {
  if (!name?.trim()) return;

  const filter = {
    name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
  };

  if (productId) filter._id = { $ne: productId };

  const existingProduct = await Product.findOne(filter).select('_id name');
  if (existingProduct) {
    throw new ApiError(409, 'A product with this name already exists');
  }
};

const buildProductFilter = (query) => {
  const filter = { isActive: true, isVisibleToUsers: { $ne: false } };
  if (query.category) filter.category = query.category;
  if (query.occasion) {
    const occasionRegex = new RegExp(query.occasion, 'i');
    const occasionFilter = [
      { occasions: occasionRegex },
      { occasion: occasionRegex },
    ];
    if (filter.$and) filter.$and.push({ $or: occasionFilter });
    else filter.$and = [{ $or: occasionFilter }];
  }
  if (query.featured === 'true') filter.featured = true;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.search) {
    const searchFilter = [
      { name: new RegExp(query.search, 'i') },
      { description: new RegExp(query.search, 'i') },
    ];
    if (filter.$and) filter.$and.push({ $or: searchFilter });
    else filter.$or = searchFilter;
  }
  return filter;
};

const parseBom = (value) => {
  if (value === undefined) return undefined;
  if (!value) return [];
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item) => item.rawMaterial && Number(item.quantity) > 0)
    .map((item) => ({
      rawMaterial: item.rawMaterial,
      quantity: Number(item.quantity),
    }));
};

export const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildProductFilter(req.query);
  const sort = buildSortQuery(req.query.sortBy);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('supplier', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  sendPaginatedResponse(res, 'Products fetched', products, page, limit, total);
});

export const getAdminProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { sku: new RegExp(req.query.search, 'i') },
    ];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.featured !== undefined) filter.featured = req.query.featured === 'true';
  if (req.query.lowStock === 'true') {
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }
  const sort = buildSortQuery(req.query.sortBy, {
    'stock-asc': { stock: 1 },
    'stock-desc': { stock: -1 },
    'category-asc': { category: 1 },
    'category-desc': { category: -1 },
    'featured-asc': { featured: 1 },
    'featured-desc': { featured: -1 },
  });
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .populate('sourcePurchase', 'productName quantity purchasePrice purchaseDate')
      .populate('bom.rawMaterial', 'name unit')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  sendPaginatedResponse(res, 'Products fetched', products, page, limit, total);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  let product = await Product.findOne({ slug, isActive: true })
    .populate('category', 'name slug')
    .populate('supplier', 'name');
  if (!product && mongoose.Types.ObjectId.isValid(slug)) {
    product = await Product.findOne({ _id: slug, isActive: true })
      .populate('category', 'name slug')
      .populate('supplier', 'name');
  }
  if (product && product.isVisibleToUsers === false) product = null;
  if (!product) throw new ApiError(404, 'Product not found');
  const related = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isActive: true,
    isVisibleToUsers: { $ne: false },
  }).limit(4)
    .populate('category', 'name slug')
    .populate('supplier', 'name');
  sendResponse(res, 200, 'Product fetched', { product, related });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('supplier', 'name')
    .populate('bom.rawMaterial', 'name unit');
  if (!product) throw new ApiError(404, 'Product not found');
  sendResponse(res, 200, 'Product fetched', product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, mrp, price, stock, category, supplier, occasion, sku, featured, lowStockThreshold, isActive, sourcePurchase } = req.body;
  const images = req.files?.map((file) => buildProductImage(req, file)).filter(Boolean) || [];
  const bom = parseBom(req.body.bom);
  const occasions = parseOccasions(req.body.occasions ?? occasion);
  const normalizedMrp = mrp === undefined || mrp === '' ? null : Number(mrp);
  const sellingPrice = Number(price);
  let resolvedName = name;
  let resolvedStock = stock;
  let resolvedSupplier = supplier || null;
  let purchaseRecord = null;

  if (sourcePurchase) {
    purchaseRecord = await ProductPurchase.findById(sourcePurchase).populate('supplier', '_id');
    if (!purchaseRecord) throw new ApiError(404, 'Selected bought product was not found');
    if (purchaseRecord.linkedProduct) throw new ApiError(409, 'This bought product is already linked to a catalog product');
    resolvedName = purchaseRecord.productName;
    resolvedStock = purchaseRecord.quantity;
    resolvedSupplier = purchaseRecord.supplier?._id || null;
  }

  if (!sourcePurchase) throw new ApiError(400, 'Please select a bought product first');

  await ensureUniqueProductName(resolvedName);
  if (Number.isNaN(sellingPrice) || sellingPrice < 0) throw new ApiError(400, 'Selling price must be a valid number');
  if (normalizedMrp !== null && (Number.isNaN(normalizedMrp) || normalizedMrp < 0)) throw new ApiError(400, 'MRP must be a valid number');
  if (normalizedMrp !== null && sellingPrice > normalizedMrp) throw new ApiError(400, 'Selling price cannot be greater than MRP');

  const product = await Product.create({
    name: resolvedName,
    description,
    mrp: normalizedMrp,
    price: sellingPrice,
    discountPercentage: normalizedMrp ? getProductDiscountPercentage({ mrp: normalizedMrp, price: sellingPrice }) : 0,
    stock: resolvedStock,
    category,
    supplier: resolvedSupplier,
    sourcePurchase: sourcePurchase || null,
    occasion: occasions?.[0] || occasion || '',
    occasions,
    sku,
    featured: featured === 'true' || featured === true,
    lowStockThreshold,
    isVisibleToUsers: true,
    isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
    images,
    bom,
  });

  if (purchaseRecord) {
    purchaseRecord.linkedProduct = product._id;
    await purchaseRecord.save();
    await InventoryMovement.create({
      product: product._id,
      type: 'IN',
      quantity: Number(product.stock || 0),
      previousStock: 0,
      newStock: Number(product.stock || 0),
      reason: 'Initial stock from bought product',
      referenceModel: 'Purchase',
      referenceId: purchaseRecord._id,
      note: purchaseRecord.note || '',
      createdBy: req.user?._id,
    });
  }

  await product.populate([
    { path: 'category', select: 'name slug' },
    { path: 'supplier', select: 'name' },
    { path: 'sourcePurchase', select: 'productName quantity purchasePrice purchaseDate' },
    { path: 'bom.rawMaterial', select: 'name unit' },
  ]);
  sendResponse(res, 201, 'Product created', product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  if (req.body.name !== undefined) await ensureUniqueProductName(req.body.name, req.params.id);
  const fields = ['name', 'description', 'stock', 'category', 'supplier', 'sku', 'featured', 'lowStockThreshold', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] === undefined) return;
    if (f === 'supplier') {
      product[f] = req.body[f] || null;
      return;
    }
    product[f] = req.body[f];
  });
  if (req.body.occasions !== undefined || req.body.occasion !== undefined) {
    const occasions = parseOccasions(req.body.occasions ?? req.body.occasion);
    product.occasions = occasions;
    product.occasion = occasions?.[0] || '';
  }
  if (req.body.mrp !== undefined) product.mrp = req.body.mrp === '' ? null : Number(req.body.mrp);
  if (req.body.price !== undefined) product.price = Number(req.body.price);
  if (Number(product.price) < 0 || Number.isNaN(Number(product.price))) throw new ApiError(400, 'Selling price must be a valid number');
  if (product.mrp !== null && (Number.isNaN(Number(product.mrp)) || Number(product.mrp) < 0)) throw new ApiError(400, 'MRP must be a valid number');
  if (product.mrp !== null && Number(product.price) > Number(product.mrp)) throw new ApiError(400, 'Selling price cannot be greater than MRP');
  product.discountPercentage = product.mrp ? getProductDiscountPercentage(product) : 0;
  if (req.body.bom !== undefined) product.bom = parseBom(req.body.bom);
  if (req.files?.length) {
    for (const img of product.images) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
      else removeLocalProductImage(img.url);
    }
    product.images = req.files.map((file) => buildProductImage(req, file)).filter(Boolean);
  }
  await product.save();
  await product.populate([
    { path: 'category', select: 'name slug' },
    { path: 'supplier', select: 'name' },
    { path: 'sourcePurchase', select: 'productName quantity purchasePrice purchaseDate' },
    { path: 'bom.rawMaterial', select: 'name unit' },
  ]);
  sendResponse(res, 200, 'Product updated', product);
});

export const updateProductBom = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  product.bom = parseBom(req.body.bom);
  await product.save();
  await product.populate([
    { path: 'category', select: 'name slug' },
    { path: 'bom.rawMaterial', select: 'name unit' },
  ]);

  sendResponse(res, 200, 'BOM updated', product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  for (const img of product.images) {
    if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    else removeLocalProductImage(img.url);
  }
  await product.deleteOne();
  sendResponse(res, 200, 'Product deleted');
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true, isActive: true, isVisibleToUsers: { $ne: false } })
    .populate('category', 'name slug')
    .populate('supplier', 'name')
    .limit(8)
    .sort({ createdAt: -1 });
  sendResponse(res, 200, 'Featured products fetched', products);
});
