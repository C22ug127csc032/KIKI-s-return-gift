import Category from '../models/Category.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';
import { cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads');

const buildCategoryImageUrl = (req, file) => {
  if (!file) return { imageUrl: null, imagePublicId: null };
  if (file.path?.startsWith('http')) {
    return { imageUrl: file.path, imagePublicId: file.filename || null };
  }
  return {
    imageUrl: `${req.protocol}://${req.get('host')}/uploads/categories/${file.filename}`,
    imagePublicId: null,
  };
};

const removeLocalCategoryImage = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('/uploads/categories/')) return;
  const fileName = imageUrl.split('/uploads/categories/')[1];
  if (!fileName) return;
  const filePath = path.join(uploadsRoot, 'categories', fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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
  const { name, description } = req.body;
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
  if (name) category.name = name;
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
