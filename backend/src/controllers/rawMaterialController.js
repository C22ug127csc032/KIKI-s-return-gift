import RawMaterial from '../models/RawMaterial.js';
import RawMaterialMovement from '../models/RawMaterialMovement.js';
import Supplier from '../models/Supplier.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

const rawMaterialPopulate = [{ path: 'supplier', select: 'name contactPerson phone' }];
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureUniqueRawMaterialName = async (name, rawMaterialId = null) => {
  const normalizedName = name?.trim();
  if (!normalizedName) throw new ApiError(400, 'Raw material name is required');

  const filter = {
    name: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i'),
  };

  if (rawMaterialId) filter._id = { $ne: rawMaterialId };

  const existingMaterial = await RawMaterial.findOne(filter).select('_id name');
  if (existingMaterial) {
    throw new ApiError(409, 'A raw material with this name already exists');
  }

  return normalizedName;
};

export const getRawMaterials = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) filter.name = new RegExp(req.query.search, 'i');
  if (req.query.supplier) filter.supplier = req.query.supplier;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  const rawMaterials = await RawMaterial.find(filter).populate(rawMaterialPopulate).sort({ createdAt: -1 });
  sendResponse(res, 200, 'Raw materials fetched', rawMaterials);
});

export const createRawMaterial = asyncHandler(async (req, res) => {
  const supplierId = req.body.supplier || undefined;
  const itemsInput = Array.isArray(req.body.items) ? req.body.items : [req.body];

  if (!itemsInput.length) throw new ApiError(400, 'At least one raw material item is required');
  if (!supplierId) throw new ApiError(400, 'Supplier is required');

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) throw new ApiError(404, 'Supplier not found');

  const createdMaterials = [];

  for (const item of itemsInput) {
    const normalizedName = await ensureUniqueRawMaterialName(item.name);

    const payload = {
      supplier: supplierId,
      name: normalizedName,
      unit: item.unit || 'pcs',
      stock: Number(item.stock) || 0,
      purchasePrice: Number(item.purchasePrice) || 0,
      lowStockThreshold: Number(item.lowStockThreshold) || 0,
      isActive: item.isActive === undefined ? true : item.isActive,
    };

    const rawMaterial = await RawMaterial.create(payload);
    await rawMaterial.populate(rawMaterialPopulate);

    if (payload.stock > 0) {
      await RawMaterialMovement.create({
        rawMaterial: rawMaterial._id,
        supplier: rawMaterial.supplier || undefined,
        type: 'PURCHASE',
        quantity: payload.stock,
        previousStock: 0,
        newStock: payload.stock,
        unitPrice: payload.purchasePrice,
        totalAmount: payload.stock * payload.purchasePrice,
        note: 'Opening stock',
        createdBy: req.user?._id,
      });
    }

    createdMaterials.push(rawMaterial);
  }

  sendResponse(res, 201, 'Raw materials created', createdMaterials);
});

export const updateRawMaterial = asyncHandler(async (req, res) => {
  const rawMaterial = await RawMaterial.findById(req.params.id);
  if (!rawMaterial) throw new ApiError(404, 'Raw material not found');

  if (req.body.supplier) {
    const supplier = await Supplier.findById(req.body.supplier);
    if (!supplier) throw new ApiError(404, 'Supplier not found');
  }

  ['supplier', 'unit', 'purchasePrice', 'lowStockThreshold', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) rawMaterial[field] = field === 'supplier' ? (req.body[field] || undefined) : req.body[field];
  });

  if (req.body.name !== undefined) {
    rawMaterial.name = await ensureUniqueRawMaterialName(req.body.name, req.params.id);
  }

  if (req.body.supplier === '') {
    throw new ApiError(400, 'Supplier is required');
  }

  await rawMaterial.save();
  await rawMaterial.populate(rawMaterialPopulate);
  sendResponse(res, 200, 'Raw material updated', rawMaterial);
});

export const deleteRawMaterial = asyncHandler(async (req, res) => {
  const rawMaterial = await RawMaterial.findById(req.params.id);
  if (!rawMaterial) throw new ApiError(404, 'Raw material not found');
  await rawMaterial.deleteOne();
  sendResponse(res, 200, 'Raw material deleted');
});

export const purchaseRawMaterial = asyncHandler(async (req, res) => {
  const supplierId = req.body.supplierId || undefined;
  const note = req.body.note;
  const itemsInput = Array.isArray(req.body.items) ? req.body.items : (
    req.body.rawMaterialId ? [{
      rawMaterialId: req.body.rawMaterialId,
      quantity: req.body.quantity,
      purchasePrice: req.body.purchasePrice,
    }] : []
  );

  if (!itemsInput.length) throw new ApiError(400, 'At least one raw material item is required');
  if (!supplierId) throw new ApiError(400, 'Supplier is required');

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) throw new ApiError(404, 'Supplier not found');

  const updatedMaterials = [];

  for (const item of itemsInput) {
    const qty = Number(item.quantity);
    const price = Number(item.purchasePrice);
    if (!item.rawMaterialId) throw new ApiError(400, 'Raw material is required for each item');
    if (!qty || qty <= 0) throw new ApiError(400, 'Quantity must be greater than 0');
    if (price < 0) throw new ApiError(400, 'Purchase price cannot be negative');

    const rawMaterial = await RawMaterial.findById(item.rawMaterialId);
    if (!rawMaterial) throw new ApiError(404, 'Raw material not found');

    if (supplier) rawMaterial.supplier = supplier._id;

    const previousStock = rawMaterial.stock;
    rawMaterial.stock += qty;
    rawMaterial.purchasePrice = price;
    await rawMaterial.save();

    await RawMaterialMovement.create({
      rawMaterial: rawMaterial._id,
      supplier: rawMaterial.supplier || undefined,
      type: 'PURCHASE',
      quantity: qty,
      previousStock,
      newStock: rawMaterial.stock,
      unitPrice: price,
      totalAmount: qty * price,
      note,
      createdBy: req.user._id,
    });

    await rawMaterial.populate(rawMaterialPopulate);
    updatedMaterials.push(rawMaterial);
  }

  sendResponse(res, 200, 'Raw materials purchased', updatedMaterials);
});

export const adjustRawMaterialStock = asyncHandler(async (req, res) => {
  const { rawMaterialId, quantity, type, note } = req.body;
  const qty = Number(quantity);
  if (qty < 0) throw new ApiError(400, 'Quantity cannot be negative');

  const rawMaterial = await RawMaterial.findById(rawMaterialId);
  if (!rawMaterial) throw new ApiError(404, 'Raw material not found');

  const previousStock = rawMaterial.stock;
  if (type === 'IN') rawMaterial.stock += qty;
  else if (type === 'OUT') {
    if (rawMaterial.stock < qty) throw new ApiError(400, 'Insufficient raw material stock');
    rawMaterial.stock -= qty;
  } else if (type === 'ADJUST') rawMaterial.stock = qty;
  else throw new ApiError(400, 'Invalid adjustment type');

  await rawMaterial.save();

  await RawMaterialMovement.create({
    rawMaterial: rawMaterial._id,
    supplier: rawMaterial.supplier || undefined,
    type: 'ADJUST',
    quantity: qty,
    previousStock,
    newStock: rawMaterial.stock,
    unitPrice: rawMaterial.purchasePrice,
    totalAmount: qty * (rawMaterial.purchasePrice || 0),
    note,
    createdBy: req.user._id,
  });

  await rawMaterial.populate(rawMaterialPopulate);
  sendResponse(res, 200, 'Raw material stock adjusted', rawMaterial);
});

export const getRawMaterialMovements = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.rawMaterial) filter.rawMaterial = req.query.rawMaterial;
  if (req.query.type) filter.type = req.query.type;
  const movements = await RawMaterialMovement.find(filter)
    .populate('rawMaterial', 'name unit')
    .populate('supplier', 'name')
    .populate('product', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit) || 50);
  sendResponse(res, 200, 'Raw material movements fetched', movements);
});

export const getRawMaterialPurchaseSummary = asyncHandler(async (req, res) => {
  const matchStage = { type: 'PURCHASE' };
  if (req.query.rawMaterial) matchStage.rawMaterial = req.query.rawMaterial;
  if (req.query.supplier) matchStage.supplier = req.query.supplier;

  const summary = await RawMaterialMovement.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          rawMaterial: '$rawMaterial',
          supplier: '$supplier',
        },
        totalPurchasedQty: { $sum: '$quantity' },
        totalSpend: { $sum: { $ifNull: ['$totalAmount', 0] } },
        latestUnitPrice: { $first: '$unitPrice' },
        lastPurchasedAt: { $first: '$createdAt' },
        purchaseCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'rawmaterials',
        localField: '_id.rawMaterial',
        foreignField: '_id',
        as: 'rawMaterial',
      },
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id.supplier',
        foreignField: '_id',
        as: 'supplier',
      },
    },
    { $unwind: '$rawMaterial' },
    {
      $addFields: {
        supplier: { $arrayElemAt: ['$supplier', 0] },
      },
    },
    {
      $project: {
        _id: 0,
        rawMaterialId: '$rawMaterial._id',
        rawMaterialName: '$rawMaterial.name',
        unit: '$rawMaterial.unit',
        currentTotalStock: '$rawMaterial.stock',
        supplierId: '$supplier._id',
        supplierName: '$supplier.name',
        totalPurchasedQty: 1,
        totalSpend: 1,
        latestUnitPrice: 1,
        purchaseCount: 1,
        lastPurchasedAt: 1,
      },
    },
    { $sort: { rawMaterialName: 1, supplierName: 1, lastPurchasedAt: -1 } },
  ]);

  sendResponse(res, 200, 'Raw material purchase summary fetched', summary);
});
