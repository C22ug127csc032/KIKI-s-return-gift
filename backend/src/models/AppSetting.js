import mongoose from 'mongoose';

const appSettingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "KIKI'S RETURN GIFT STORE" },
    storeTagline: { type: String, default: 'Perfect Gifts for Every Occasion' },
    storeAddress: { type: String },
    supportEmail: { type: String },
    supportPhone: { type: String },
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
    logoUrl: { type: String },
    currency: { type: String, default: '₹' },
  },
  { timestamps: true }
);

const AppSetting = mongoose.model('AppSetting', appSettingSchema);
export default AppSetting;
