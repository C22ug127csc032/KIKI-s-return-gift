import Supplier from '../models/Supplier.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/validation.js';

const validateSupplierPayload = (payload) => {
  if (payload.phone !== undefined) {
    payload.phone = normalizePhone(payload.phone);
    if (payload.phone && !isValidPhone(payload.phone)) {
      throw new ApiError(400, 'Phone number must be exactly 10 digits');
    }
  }

  if (payload.email !== undefined) {
    payload.email = normalizeEmail(payload.email);
    if (payload.email && !isValidEmail(payload.email)) {
      throw new ApiError(400, 'Enter a valid email address');
    }
  }

  return payload;
};

const ensureUniqueSupplierFields = async (payload, supplierId = null) => {
  const excludeCurrent = supplierId ? { _id: { $ne: supplierId } } : {};

  if (payload.phone) {
    const existingPhone = await Supplier.findOne({ ...excludeCurrent, phone: payload.phone }).select('_id name phone');
    if (existingPhone) {
      throw new ApiError(409, 'A supplier with this phone number already exists');
    }
  }

  if (payload.email) {
    const existingEmail = await Supplier.findOne({ ...excludeCurrent, email: payload.email }).select('_id name email');
    if (existingEmail) {
      throw new ApiError(409, 'A supplier with this email already exists');
    }
  }
};

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
  const payload = validateSupplierPayload({ ...req.body });
  await ensureUniqueSupplierFields(payload);
  const supplier = await Supplier.create(payload);
  sendResponse(res, 201, 'Supplier created', supplier);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const payload = validateSupplierPayload({ ...req.body });
  await ensureUniqueSupplierFields(payload, req.params.id);
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  sendResponse(res, 200, 'Supplier updated', supplier);
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  await supplier.deleteOne();
  sendResponse(res, 200, 'Supplier deleted');
});
