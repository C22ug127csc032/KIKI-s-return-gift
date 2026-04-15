import User from '../models/User.js';
import Product from '../models/Product.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { generateToken } from '../middlewares/auth.js';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/validation.js';
import { sendEmail, canSendEmail } from '../services/emailService.js';
import crypto from 'crypto';

const buildResetPasswordUrl = (role, token) => {
  const clientUrl = process.env.CLIENT_URL || 'https://kiki.ematixsolutions.com';
  return role === 'admin'
    ? `${clientUrl}/admin/reset-password/${token}`
    : `${clientUrl}/reset-password/${token}`;
};

const buildResetEmail = ({ name, role, resetUrl }) => {
  const title = role === 'admin' ? 'Admin Password Reset' : 'Password Reset';
  const intro = role === 'admin'
    ? 'We received a request to reset your admin account password.'
    : 'We received a request to reset your account password.';

  return {
    subject: `${title} - KIKI'S RETURN GIFT STORE`,
    text: `Hello ${name},\n\n${intro}\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 15 minutes.\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <div style="background: #e11d48; color: white; padding: 20px 24px; border-radius: 16px 16px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">${title}</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">KIKI'S RETURN GIFT STORE</p>
        </div>
        <div style="border: 1px solid #f3f4f6; border-top: 0; padding: 24px; border-radius: 0 0 16px 16px; background: #ffffff;">
          <p style="margin-top: 0;">Hello ${name},</p>
          <p>${intro}</p>
          <p>Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #e11d48; color: white; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 700;">
              Reset Password
            </a>
          </p>
          <p style="word-break: break-all; color: #6b7280; font-size: 13px;">${resetUrl}</p>
          <p style="margin-bottom: 0; color: #6b7280;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  };
};

export const register = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  if (!isValidEmail(email)) throw new ApiError(400, 'Enter a valid email address');
  if (phone && !isValidPhone(phone)) throw new ApiError(400, 'Phone number must be exactly 10 digits');
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(400, 'Email already registered');
  const user = await User.create({ name, email, password, phone });
  const token = generateToken(user._id);
  sendResponse(res, 201, 'Registration successful', { user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);
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
  const { name, addresses } = req.body;
  const phone = normalizePhone(req.body.phone);
  if (phone && !isValidPhone(phone)) throw new ApiError(400, 'Phone number must be exactly 10 digits');
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

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const role = req.body.role === 'admin' ? 'admin' : 'user';

  if (!isValidEmail(email)) throw new ApiError(400, 'Enter a valid email address');
  if (!canSendEmail()) {
    throw new ApiError(503, 'Password reset email service is not configured');
  }

  const user = await User.findOne({ email, role, isActive: true });

  if (!user) {
    return sendResponse(res, 200, 'If an account exists for this email, a reset link has been sent');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const resetUrl = buildResetPasswordUrl(role, rawToken);

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const emailContent = buildResetEmail({ name: user.name, role, resetUrl });
  try {
    await sendEmail({ to: user.email, ...emailContent });
  } catch (error) {
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    throw new ApiError(503, 'Unable to send reset email right now. Please try again later.');
  }

  sendResponse(res, 200, 'If an account exists for this email, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token) throw new ApiError(400, 'Reset token is required');
  if (!newPassword || String(newPassword).length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  sendResponse(res, 200, 'Password reset successful');
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
