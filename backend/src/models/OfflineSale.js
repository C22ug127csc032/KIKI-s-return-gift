import mongoose from 'mongoose';

const offlineSaleSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
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
