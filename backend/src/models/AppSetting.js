import mongoose from 'mongoose';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/validation.js';

const appSettingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "KIKI'S RETURN GIFT STORE" },
    storeTagline: { type: String, default: 'Perfect Gifts for Every Occasion' },
    storeAddress: { type: String },
    supportEmail: {
      type: String,
      validate: {
        validator: (value) => !value || EMAIL_REGEX.test(value),
        message: 'Enter a valid email address',
      },
    },
    supportPhone: {
      type: String,
      validate: {
        validator: (value) => !value || PHONE_REGEX.test(value),
        message: 'Phone number must be exactly 10 digits',
      },
    },
    whatsappNumber: { type: String },
    bankAccountName: { type: String },
    bankAccountNumber: { type: String },
    bankIFSC: { type: String },
    bankBranch: { type: String },
    upiId: { type: String },
    upiQrImage: { type: String },
    upiQrPublicId: { type: String },
    gstPercentage: { type: Number, default: 0 },
    gstNumber: { type: String },
    paymentInstructions: {
      type: String,
      default:
        'Please complete your payment via UPI or bank transfer. After payment, share the screenshot on WhatsApp.',
    },
    heroTag: { type: String, default: 'Wedding & Haldi' },
    heroTitleLineOne: { type: String, default: 'Perfect Gifts' },
    heroTitleLineTwo: { type: String, default: 'for Every' },
    heroTitleLineThree: { type: String, default: 'Celebration' },
    heroSubtitle: {
      type: String,
      default:
        'Curated return gifts for weddings, birthdays, pooja, and every special occasion. Premium quality, affordable prices.',
    },
    heroButtonText: { type: String, default: 'Shop Gifts' },
    heroButtonLink: { type: String, default: '/shop?occasion=Wedding' },
    heroImage: { type: String },
    heroImagePublicId: { type: String },
    logoUrl: { type: String },
    currency: { type: String, default: '₹' },
  },
  { timestamps: true }
);

const AppSetting = mongoose.model('AppSetting', appSettingSchema);
export default AppSetting;
