import mongoose from 'mongoose';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/validation.js';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || PHONE_REGEX.test(value),
        message: 'Phone number must be exactly 10 digits',
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) => !value || EMAIL_REGEX.test(value),
        message: 'Enter a valid email address',
      },
    },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
