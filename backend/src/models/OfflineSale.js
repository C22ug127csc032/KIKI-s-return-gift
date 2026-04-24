import mongoose from 'mongoose';
import { PHONE_REGEX } from '../utils/validation.js';

const offlineSaleSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: {
      type: String,
      validate: {
        validator: (value) => !value || PHONE_REGEX.test(value),
        message: 'Phone number must be exactly 10 digits',
      },
    },
    address: { type: String },
    gstMode: {
      type: String,
      enum: ['with_gst', 'without_gst'],
      default: 'with_gst',
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        basePrice: { type: Number, default: 0 },
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        price: Number,
        originalPrice: Number,
        gstRate: { type: Number, default: 0 },
        cgstRate: { type: Number, default: 0 },
        sgstRate: { type: Number, default: 0 },
        igstRate: { type: Number, default: 0 },
        taxableAmount: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        quantity: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    invoiceNumber: { type: String, unique: true },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const OfflineSale = mongoose.model('OfflineSale', offlineSaleSchema);
export default OfflineSale;
