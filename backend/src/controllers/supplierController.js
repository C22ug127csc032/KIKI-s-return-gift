import Supplier from '../models/Supplier.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

export const getSuppliers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { contactPerson: new RegExp(req.query.search, 'i') },
      { phone: new RegExp(req.query.search, 'i') },
    ];
  }
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  const suppliers = await Supplier.find(filter).sort({ createdAt: -1 });
  sendResponse(res, 200, 'Suppliers fetched', suppliers);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  sendResponse(res, 201, 'Supplier created', supplier);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  sendResponse(res, 200, 'Supplier updated', supplier);
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  await supplier.deleteOne();
  sendResponse(res, 200, 'Supplier deleted');
});
