import AppSetting from '../models/AppSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { cloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/apiError.js';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/validation.js';

const uploadImageBuffer = (buffer, folder, transformation = undefined) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await AppSetting.findOne();
  if (!settings) settings = await AppSetting.create({});
  sendResponse(res, 200, 'Settings fetched', settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await AppSetting.findOne();
  if (!settings) settings = new AppSetting();
  if (req.body.supportEmail !== undefined) {
    req.body.supportEmail = normalizeEmail(req.body.supportEmail);
    if (req.body.supportEmail && !isValidEmail(req.body.supportEmail)) {
      throw new ApiError(400, 'Enter a valid support email address');
    }
  }
  if (req.body.supportPhone !== undefined) {
    req.body.supportPhone = normalizePhone(req.body.supportPhone);
    if (req.body.supportPhone && !isValidPhone(req.body.supportPhone)) {
      throw new ApiError(400, 'Support phone number must be exactly 10 digits');
    }
  }
  const fields = [
    'storeName', 'storeTagline', 'storeAddress', 'supportEmail', 'supportPhone',
    'whatsappNumber', 'bankAccountName', 'bankAccountNumber', 'bankIFSC', 'bankBranch',
    'upiId', 'gstPercentage', 'gstNumber', 'paymentInstructions', 'currency',
    'footerCtaTitle', 'footerCtaSubtitle', 'footerCtaButtonText',
    'footerBrandTitle', 'footerBrandSubtitle', 'footerDescription', 'footerContactAddress',
    'footerInstagramUrl', 'footerFacebookUrl', 'footerCopyrightText', 'footerBottomText',
  ];
  fields.forEach((f) => { if (req.body[f] !== undefined) settings[f] = req.body[f]; });
  const qrFile = req.files?.qrImage?.[0];
  if (qrFile) {
    if (settings.upiQrPublicId) await cloudinary.uploader.destroy(settings.upiQrPublicId);
    const uploadedQr = await uploadImageBuffer(qrFile.buffer, 'kikis-store/qr');
    settings.upiQrImage = uploadedQr.secure_url;
    settings.upiQrPublicId = uploadedQr.public_id;
  }
  await settings.save();
  sendResponse(res, 200, 'Settings updated', settings);
});
