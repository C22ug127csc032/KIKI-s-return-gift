import Supplier from '../models/Supplier.js';
import ProductPurchase from '../models/ProductPurchase.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendPaginatedResponse, sendResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripSupplierFromProductName = (productName = '', supplierName = '') => {
  const trimmedName = String(productName || '').trim();
  const trimmedSupplier = String(supplierName || '').trim();
  if (!trimmedSupplier) return trimmedName;

  const supplierPattern = escapeRegex(trimmedSupplier);
  return trimmedName
    .replace(new RegExp(`\\s*-\\s*${supplierPattern}$`, 'i'), '')
    .replace(new RegExp(`\\s*\\(\\s*${supplierPattern}\\s*\\)$`, 'i'), '')
    .trim();
};

export const createProductPurchase = asyncHandler(async (req, res) => {
  const {
    supplierId,
    productName,
    quantity,
    purchasePrice,
    invoiceNumber,
    purchaseDate,
    note,
  } = req.body;

  const normalizedQuantity = Number(quantity);
  const normalizedPurchasePrice = Number(purchasePrice);

  if (!supplierId) throw new ApiError(400, 'Supplier is required');
  if (!productName?.trim()) throw new ApiError(400, 'Product name is required');
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    throw new ApiError(400, 'Quantity must be greater than 0');
  }
  if (!Number.isFinite(normalizedPurchasePrice) || normalizedPurchasePrice < 0) {
    throw new ApiError(400, 'Purchase rate must be a valid number');
  }

  const supplier = await Supplier.findById(supplierId);

  if (!supplier || !supplier.isActive) throw new ApiError(404, 'Supplier not found');

  const cleanProductName = stripSupplierFromProductName(productName, supplier.name);
  if (!cleanProductName) throw new ApiError(400, 'Product name is required');

  const totalAmount = Number((normalizedQuantity * normalizedPurchasePrice).toFixed(2));

  const purchase = await ProductPurchase.create({
    supplier: supplier._id,
    productName: cleanProductName,
    quantity: normalizedQuantity,
    purchasePrice: normalizedPurchasePrice,
    totalAmount,
    invoiceNumber: invoiceNumber?.trim() || '',
    purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
    note,
    createdBy: req.user._id,
  });

  await purchase.populate([
    { path: 'supplier', select: 'name phone' },
    { path: 'linkedProduct', select: 'name sku stock' },
    { path: 'createdBy', select: 'name' },
  ]);

  sendResponse(res, 201, 'Product purchase recorded', purchase);
});

export const getProductPurchases = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // Heal stale purchase links left behind when a linked product was deleted.
  const purchasesWithLinks = await ProductPurchase.find({ linkedProduct: { $ne: null } })
    .select('_id linkedProduct')
    .populate('linkedProduct', '_id');
  const stalePurchaseIds = purchasesWithLinks
    .filter((purchase) => !purchase.linkedProduct)
    .map((purchase) => purchase._id);
  if (stalePurchaseIds.length) {
    await ProductPurchase.updateMany({ _id: { $in: stalePurchaseIds } }, { linkedProduct: null });
  }

  if (req.query.supplier) filter.supplier = req.query.supplier;
  if (req.query.linkedProduct) filter.linkedProduct = req.query.linkedProduct;
  if (req.query.unlinked === 'true') filter.quantity = { $gt: 0 };
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    const supplierMatches = await Supplier.find({ name: regex }).select('_id');
    filter.$or = [
      { productName: regex },
      { invoiceNumber: regex },
      { note: regex },
      { supplier: { $in: supplierMatches.map((item) => item._id) } },
    ];
  }

  const [purchases, total] = await Promise.all([
    ProductPurchase.find(filter)
      .populate('supplier', 'name phone')
      .populate('linkedProduct', 'name sku stock')
      .populate('createdBy', 'name')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProductPurchase.countDocuments(filter),
  ]);

  sendPaginatedResponse(res, 'Product purchases fetched', purchases, page, limit, total);
});
