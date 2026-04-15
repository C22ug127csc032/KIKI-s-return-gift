import Category from '../models/Category.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildLocalUploadPath, getLocalUploadFileName } from '../utils/uploadPaths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads');

const buildCategoryImageUrl = (req, file) => {
  if (!file) return { imageUrl: null, imagePublicId: null };
  if (file.path?.startsWith('http')) {
    return { imageUrl: file.path, imagePublicId: file.filename || null };
  }
  return {
    imageUrl: buildLocalUploadPath('categories', file.filename),
    imagePublicId: null,
  };
};

const removeLocalCategoryImage = (imageUrl) => {
  const fileName = getLocalUploadFileName(imageUrl, 'categories');
  if (!fileName) return;
  const filePath = path.join(uploadsRoot, 'categories', path.basename(fileName));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureUniqueCategoryName = async (name, categoryId = null) => {
  const normalizedName = name?.trim();
  if (!normalizedName) throw new ApiError(400, 'Category name is required');

  const filter = { name: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i') };
  if (categoryId) filter._id = { $ne: categoryId };

  const existingCategory = await Category.findOne(filter).select('_id name');
  if (existingCategory) {
    throw new ApiError(409, 'A category with this name already exists');
  }

  return normalizedName;
};

export const getCategories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;
  const [categories, total] = await Promise.all([
    Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);
  sendPaginatedResponse(res, 'Categories fetched', categories, page, limit, total);
});

export const getAllActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  sendResponse(res, 200, 'Categories fetched', categories);
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  sendResponse(res, 200, 'Category fetched', category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = await ensureUniqueCategoryName(req.body.name);
  const { description } = req.body;
  const { imageUrl, imagePublicId } = buildCategoryImageUrl(req, req.file);
  const category = await Category.create({ name, description, image: imageUrl, imagePublicId });
  sendResponse(res, 201, 'Category created', category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  const { name, description, isActive } = req.body;
  if (req.file) {
    if (category.imagePublicId) await cloudinary.uploader.destroy(category.imagePublicId);
    else removeLocalCategoryImage(category.image);
    const { imageUrl, imagePublicId } = buildCategoryImageUrl(req, req.file);
    category.image = imageUrl;
    category.imagePublicId = imagePublicId;
  }
  if (name !== undefined) category.name = await ensureUniqueCategoryName(name, req.params.id);
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;
  await category.save();
  sendResponse(res, 200, 'Category updated', category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (category.imagePublicId) await cloudinary.uploader.destroy(category.imagePublicId);
  else removeLocalCategoryImage(category.image);
  await category.deleteOne();
  sendResponse(res, 200, 'Category deleted');
});
