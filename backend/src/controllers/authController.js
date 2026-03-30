import User from '../models/User.js';
import Product from '../models/Product.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { generateToken } from '../middlewares/auth.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(400, 'Email already registered');
  const user = await User.create({ name, email, password, phone });
  const token = generateToken(user._id);
  sendResponse(res, 201, 'Registration successful', { user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');
  const token = generateToken(user._id);
  sendResponse(res, 200, 'Login successful', { user, token });
});

export const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, 'Profile fetched', req.user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, ...(addresses && { addresses }) },
    { new: true, runValidators: true }
  );
  sendResponse(res, 200, 'Profile updated', user);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  sendResponse(res, 200, 'Password changed successfully');
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { isActive: true },
    populate: { path: 'category', select: 'name slug' },
  });
  sendResponse(res, 200, 'Wishlist fetched', user?.wishlist || []);
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');

  const user = await User.findById(req.user._id);
  const exists = user.wishlist.some((item) => item.toString() === product._id.toString());
  if (!exists) {
    user.wishlist.push(product._id);
    await user.save();
  }

  const populatedUser = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { isActive: true },
    populate: { path: 'category', select: 'name slug' },
  });

  sendResponse(res, 200, 'Added to wishlist', populatedUser?.wishlist || []);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((item) => item.toString() !== req.params.productId);
  await user.save();

  const populatedUser = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { isActive: true },
    populate: { path: 'category', select: 'name slug' },
  });

  sendResponse(res, 200, 'Removed from wishlist', populatedUser?.wishlist || []);
});
