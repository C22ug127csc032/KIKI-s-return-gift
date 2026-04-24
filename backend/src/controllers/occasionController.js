import Occasion from '../models/Occasion.js';
import Product from '../models/Product.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { defaultOccasionConfig, occasionIconKeys } from '../utils/occasionIcons.js';

export const defaultOccasionNames = defaultOccasionConfig.map((occasion) => occasion.name);

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeOccasionName = (value = '') => String(value || '')
  .trim()
  .replace(/\s+/g, ' ')
  .split(' ')
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
  .join(' ');

const normalizeOccasionIconKey = (value = '') => {
  const normalizedKey = String(value || '').trim().toLowerCase() || 'gift';
  if (!occasionIconKeys.includes(normalizedKey)) {
    throw new ApiError(400, 'Selected occasion icon is invalid');
  }
  return normalizedKey;
};

const ensureUniqueOccasionName = async (name, occasionId = null) => {
  const normalizedName = normalizeOccasionName(name);
  if (!normalizedName) throw new ApiError(400, 'Occasion name is required');

  const filter = { name: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i') };
  if (occasionId) filter._id = { $ne: occasionId };

  const existingOccasion = await Occasion.findOne(filter).select('_id name');
  if (existingOccasion) throw new ApiError(409, 'An occasion with this name already exists');
  return normalizedName;
};

export const ensureDefaultOccasions = async () => {
  const existingCount = await Occasion.countDocuments();
  if (existingCount === 0) {
    await Occasion.insertMany(defaultOccasionConfig);
    return;
  }

  await Promise.all(defaultOccasionConfig.map(({ name, iconKey }) => (
    Occasion.updateOne(
      { name: new RegExp(`^${escapeRegex(name)}$`, 'i') },
      { $setOnInsert: { name, iconKey, isActive: true } },
      { upsert: true }
    )
  )));
};

export const getOccasions = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
  const occasions = await Occasion.find(filter).sort({ name: 1 });
  sendResponse(res, 200, 'Occasions fetched', occasions);
});

export const getAdminOccasions = asyncHandler(async (req, res) => {
  const occasions = await Occasion.find({}).sort({ name: 1 });
  sendResponse(res, 200, 'Occasions fetched', occasions);
});

export const createOccasion = asyncHandler(async (req, res) => {
  const name = await ensureUniqueOccasionName(req.body.name);
  const iconKey = normalizeOccasionIconKey(req.body.iconKey);
  const occasion = await Occasion.create({ name, iconKey });
  sendResponse(res, 201, 'Occasion created', occasion);
});

export const updateOccasion = asyncHandler(async (req, res) => {
  const occasion = await Occasion.findById(req.params.id);
  if (!occasion) throw new ApiError(404, 'Occasion not found');

  const previousName = occasion.name;
  if (req.body.name !== undefined) {
    occasion.name = await ensureUniqueOccasionName(req.body.name, req.params.id);
  }
  if (req.body.iconKey !== undefined) {
    occasion.iconKey = normalizeOccasionIconKey(req.body.iconKey);
  }
  if (req.body.isActive !== undefined) {
    occasion.isActive = req.body.isActive === true || req.body.isActive === 'true';
  }
  await occasion.save();

  if (occasion.name !== previousName) {
    const affectedProducts = await Product.find({
      $or: [
        { occasion: previousName },
        { occasions: previousName },
      ],
    });

    await Promise.all(affectedProducts.map(async (product) => {
      const currentOccasions = product.occasions?.length
        ? product.occasions
        : (product.occasion === previousName ? [previousName] : []);
      const nextOccasions = currentOccasions.map((item) => (
        item === previousName ? occasion.name : item
      ));
      product.occasions = Array.from(new Set(nextOccasions.filter(Boolean)));
      product.occasion = product.occasions[0] || (product.occasion === previousName ? occasion.name : product.occasion);
      await product.save();
    }));
  }

  sendResponse(res, 200, 'Occasion updated', occasion);
});

export const deleteOccasion = asyncHandler(async (req, res) => {
  const occasion = await Occasion.findById(req.params.id);
  if (!occasion) throw new ApiError(404, 'Occasion not found');

  const products = await Product.find({
    $or: [
      { occasion: occasion.name },
      { occasions: occasion.name },
    ],
  });

  await Promise.all(products.map(async (product) => {
    product.occasions = (product.occasions || []).filter((item) => item !== occasion.name);
    product.occasion = product.occasions[0] || (product.occasion === occasion.name ? '' : product.occasion);
    await product.save();
  }));

  await occasion.deleteOne();
  sendResponse(res, 200, 'Occasion deleted');
});
