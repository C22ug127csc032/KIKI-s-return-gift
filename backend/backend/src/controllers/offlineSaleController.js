import OfflineSale from '../models/OfflineSale.js';
import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { generateInvoiceNumber } from '../utils/generators.js';
import {
  calculateLinePricing,
  getProductGstRate,
  getProductMrp,
  getProductSellingPrice,
  getProductTaxRates,
  getTaxableAmountFromInclusive,
} from '../utils/pricing.js';
import { isValidPhone, normalizePhone } from '../utils/validation.js';

export const createOfflineSale = asyncHandler(async (req, res) => {
  const { customerName, address, items, notes } = req.body;
  const gstMode = req.body.gstMode === 'without_gst' ? 'without_gst' : 'with_gst';
  const phone = normalizePhone(req.body.phone);
  if (phone && !isValidPhone(phone)) throw new ApiError(400, 'Phone number must be exactly 10 digits');

  const saleItems = [];
  let subtotal = 0;
  let tax = 0;
  let totalAmount = 0;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(404, `Product not found: ${item.product}`);
    if (product.stock < item.quantity) throw new ApiError(400, `Insufficient stock for ${product.name}`);
    const productSellingPrice = getProductSellingPrice(product);
    const taxRates = getProductTaxRates(product);
    const sellingPrice = item.sellingPrice === '' || item.sellingPrice === undefined
      ? productSellingPrice
      : Number(item.sellingPrice);
    const discountPercentage = item.discountPercentage === '' || item.discountPercentage === undefined
      ? Number(product.discountPercentage || 0)
      : Number(item.discountPercentage);
    const basePrice = Number.isFinite(sellingPrice)
      ? Number(sellingPrice || 0)
      : Number(product.basePrice ?? getTaxableAmountFromInclusive(productSellingPrice, getProductGstRate(product)));
    const cgstRate = gstMode === 'with_gst'
      ? Number(item.cgstRate ?? taxRates.cgstRate ?? 0)
      : 0;
    const sgstRate = gstMode === 'with_gst'
      ? Number(item.sgstRate ?? taxRates.sgstRate ?? 0)
      : 0;
    const igstRate = gstMode === 'with_gst'
      ? Number(item.igstRate ?? taxRates.igstRate ?? 0)
      : 0;
    const pricing = calculateLinePricing({
      basePrice,
      discountPercentage,
      cgstRate,
      sgstRate,
      igstRate,
      quantity: item.quantity,
    });
    saleItems.push({
      product: product._id,
      name: product.name,
      basePrice: pricing.basePrice,
      discountPercentage: pricing.discountPercentage,
      discountAmount: pricing.discountAmount,
      price: pricing.taxableAmount / Math.max(Number(item.quantity || 0), 1),
      originalPrice: getProductMrp(product),
      gstRate: pricing.gstRate,
      cgstRate: pricing.cgstRate,
      sgstRate: pricing.sgstRate,
      igstRate: pricing.igstRate,
      taxableAmount: pricing.taxableAmount,
      gstAmount: pricing.gstAmount,
      cgstAmount: pricing.cgstAmount,
      sgstAmount: pricing.sgstAmount,
      igstAmount: pricing.igstAmount,
      totalAmount: pricing.totalAmount,
      quantity: item.quantity,
    });
    subtotal += pricing.taxableAmount;
    tax += pricing.gstAmount;
    totalAmount += pricing.totalAmount;
  }

  const sale = await OfflineSale.create({
    customerName, phone, address,
    gstMode,
    items: saleItems,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    invoiceNumber: await generateInvoiceNumber(OfflineSale, 'K-OF', {
      padLength: gstMode === 'without_gst' ? 3 : 4,
      filter: { gstMode },
    }),
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
