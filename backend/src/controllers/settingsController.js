import AppSetting from '../models/AppSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { cloudinary } from '../config/cloudinary.js';

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await AppSetting.findOne();
  if (!settings) settings = await AppSetting.create({});
  sendResponse(res, 200, 'Settings fetched', settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await AppSetting.findOne();
  if (!settings) settings = new AppSetting();
  const fields = [
    'storeName', 'storeTagline', 'storeAddress', 'supportEmail', 'supportPhone',
    'whatsappNumber', 'bankAccountName', 'bankAccountNumber', 'bankIFSC', 'bankBranch',
    'upiId', 'gstPercentage', 'gstNumber', 'paymentInstructions', 'currency',
  ];
  fields.forEach((f) => { if (req.body[f] !== undefined) settings[f] = req.body[f]; });
  if (req.file) {
    if (settings.upiQrPublicId) await cloudinary.uploader.destroy(settings.upiQrPublicId);
    settings.upiQrImage = req.file.path;
    settings.upiQrPublicId = req.file.filename;
  }
  await settings.save();
  sendResponse(res, 200, 'Settings updated', settings);
});
