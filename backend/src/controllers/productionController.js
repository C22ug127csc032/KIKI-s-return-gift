import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import RawMaterial from '../models/RawMaterial.js';
import RawMaterialMovement from '../models/RawMaterialMovement.js';
import ProductionBatch from '../models/ProductionBatch.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

export const getProductionBatches = asyncHandler(async (req, res) => {
  const batches = await ProductionBatch.find()
    .populate('product', 'name sku')
    .populate('materialsUsed.rawMaterial', 'name unit')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit) || 50);
  sendResponse(res, 200, 'Production batches fetched', batches);
});

export const createProductionBatch = asyncHandler(async (req, res) => {
  const { productId, quantityProduced, note } = req.body;
  const qty = Number(quantityProduced);
  if (!qty || qty <= 0) throw new ApiError(400, 'Quantity produced must be greater than 0');

  const product = await Product.findById(productId).populate('bom.rawMaterial');
  if (!product) throw new ApiError(404, 'Product not found');
  if (!product.bom?.length) throw new ApiError(400, 'This product has no BOM configured');

  const materialsUsed = [];

  for (const item of product.bom) {
    const rawMaterial = await RawMaterial.findById(item.rawMaterial._id);
    if (!rawMaterial) throw new ApiError(404, `Raw material not found for BOM item`);

    const quantityNeeded = Number(item.quantity) * qty;
    if (rawMaterial.stock < quantityNeeded) {
      throw new ApiError(400, `Insufficient stock for ${rawMaterial.name}. Required ${quantityNeeded} ${rawMaterial.unit}, available ${rawMaterial.stock} ${rawMaterial.unit}`);
    }

    const previousStock = rawMaterial.stock;
    rawMaterial.stock -= quantityNeeded;
    await rawMaterial.save();

    await RawMaterialMovement.create({
      rawMaterial: rawMaterial._id,
      supplier: rawMaterial.supplier || undefined,
      product: product._id,
      type: 'USAGE',
      quantity: quantityNeeded,
      previousStock,
      newStock: rawMaterial.stock,
      unitPrice: rawMaterial.purchasePrice,
      totalAmount: quantityNeeded * (rawMaterial.purchasePrice || 0),
      note: note || `Used for ${product.name}`,
      createdBy: req.user._id,
    });

    materialsUsed.push({
      rawMaterial: rawMaterial._id,
      quantityPerUnit: Number(item.quantity),
      quantityUsed: quantityNeeded,
      unit: rawMaterial.unit,
    });
  }

  const previousProductStock = product.stock;
  product.stock += qty;
  await product.save();

  await InventoryMovement.create({
    product: product._id,
    type: 'IN',
    quantity: qty,
    previousStock: previousProductStock,
    newStock: product.stock,
    reason: 'Production batch',
    referenceModel: 'Manual',
    note,
    createdBy: req.user._id,
  });

  const batch = await ProductionBatch.create({
    product: product._id,
    quantityProduced: qty,
    materialsUsed,
    note,
    createdBy: req.user._id,
  });

  await batch.populate([
    { path: 'product', select: 'name sku' },
    { path: 'materialsUsed.rawMaterial', select: 'name unit' },
    { path: 'createdBy', select: 'name' },
  ]);

  sendResponse(res, 201, 'Production batch created', batch);
});
