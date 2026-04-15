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
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        originalPrice: Number,
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
