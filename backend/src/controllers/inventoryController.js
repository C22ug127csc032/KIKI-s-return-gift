import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';

export const getInventoryMovements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.product) filter.product = req.query.product;
  if (req.query.type) filter.type = req.query.type;
  const [movements, total] = await Promise.all([
    InventoryMovement.find(filter)
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    InventoryMovement.countDocuments(filter),
  ]);
  sendPaginatedResponse(res, 'Movements fetched', movements, page, limit, total);
});

export const adjustStock = asyncHandler(async (req, res) => {
  const { productId, quantity, type, note } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  const previousStock = product.stock;
  if (type === 'IN') product.stock += quantity;
  else if (type === 'OUT') {
    if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');
    product.stock -= quantity;
  } else if (type === 'ADJUST') {
    product.stock = quantity;
  }
  await product.save();
  await InventoryMovement.create({
    product: product._id,
    type,
    quantity,
    previousStock,
    newStock: product.stock,
    reason: 'Manual adjustment',
    referenceModel: 'Manual',
    note,
    createdBy: req.user._id,
  });
  sendResponse(res, 200, 'Stock adjusted', product);
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  }).populate('category', 'name');
  sendResponse(res, 200, 'Low stock products fetched', products);
});
