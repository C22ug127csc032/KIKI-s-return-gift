import mongoose from 'mongoose';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/validation.js';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  basePrice: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
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
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  availableStockAtOrder: { type: Number, default: 0, min: 0 },
  fulfilledQuantity: { type: Number, default: 0, min: 0 },
  backorderQuantity: { type: Number, default: 0, min: 0 },
  hasStockIssue: { type: Boolean, default: false },
  stockIssueMessage: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    customerName: { type: String, required: true },
    customerEmail: {
      type: String,
      validate: {
        validator: (value) => !value || EMAIL_REGEX.test(value),
        message: 'Enter a valid email address',
      },
    },
    customerPhone: {
      type: String,
      required: true,
      validate: {
        validator: (value) => PHONE_REGEX.test(value),
        message: 'Phone number must be exactly 10 digits',
      },
    },
    customerAddress: { type: String, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    paymentScreenshot: { type: String },
    paymentScreenshotPublicId: { type: String },
    customerNotes: { type: String },
    adminNotes: { type: String },
    hasStockIssue: { type: Boolean, default: false },
    whatsappMessage: { type: String },
    whatsappRedirectedAt: { type: Date },
    source: { type: String, enum: ['website', 'whatsapp', 'offline'], default: 'website' },
    invoiceNumber: { type: String },
    statusHistory: [
      {
        status: String,
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
