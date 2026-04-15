import OfflineSale from '../models/OfflineSale.js';
import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AppSetting from '../models/AppSetting.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { generateInvoiceNumber } from '../utils/generators.js';
import { getProductMrp, getProductSellingPrice } from '../utils/pricing.js';
import { isValidPhone, normalizePhone } from '../utils/validation.js';

export const createOfflineSale = asyncHandler(async (req, res) => {
  const { customerName, address, items, notes } = req.body;
  const phone = normalizePhone(req.body.phone);
  if (phone && !isValidPhone(phone)) throw new ApiError(400, 'Phone number must be exactly 10 digits');
  const settings = await AppSetting.findOne();
  const taxRate = settings?.gstPercentage || 0;

  const saleItems = [];
  let subtotal = 0;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(404, `Product not found: ${item.product}`);
    if (product.stock < item.quantity) throw new ApiError(400, `Insufficient stock for ${product.name}`);
    const sellingPrice = getProductSellingPrice(product);
    saleItems.push({
      product: product._id,
      name: product.name,
      price: sellingPrice,
      originalPrice: getProductMrp(product),
      quantity: item.quantity,
    });
    subtotal += sellingPrice * item.quantity;
  }

  const tax = Math.round(subtotal * taxRate / 100 * 100) / 100;
  const totalAmount = subtotal + tax;

  const sale = await OfflineSale.create({
    customerName, phone, address,
    items: saleItems,
    subtotal, tax, totalAmount,
    invoiceNumber: await generateInvoiceNumber(OfflineSale, 'K-OF'),
    notes,
    createdBy: req.user._id,
  });

  for (const item of saleItems) {
    const product = await Product.findById(item.product);
    const previousStock = product.stock;
    product.stock -= item.quantity;
    await product.save();
    await InventoryMovement.create({
      product: product._id, type: 'OUT', quantity: item.quantity,
      previousStock, newStock: product.stock,
      reason: 'Offline sale', referenceModel: 'OfflineSale', referenceId: sale._id,
      createdBy: req.user._id,
    });
  }

  sendResponse(res, 201, 'Offline sale created', sale);
});

export const getOfflineSales = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { customerName: new RegExp(req.query.search, 'i') },
      { invoiceNumber: new RegExp(req.query.search, 'i') },
    ];
  }
  const [sales, total] = await Promise.all([
    OfflineSale.find(filter).populate('createdBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    OfflineSale.countDocuments(filter),
  ]);
  sendPaginatedResponse(res, 'Offline sales fetched', sales, page, limit, total);
});

export const getOfflineSaleById = asyncHandler(async (req, res) => {
  const sale = await OfflineSale.findById(req.params.id).populate('createdBy', 'name');
  if (!sale) throw new ApiError(404, 'Sale not found');
  sendResponse(res, 200, 'Sale fetched', sale);
});
