import mongoose from 'mongoose';

const productPurchaseSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    invoiceNumber: { type: String, trim: true },
    purchaseDate: { type: Date, default: Date.now },
    note: { type: String, trim: true },
    linkedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

productPurchaseSchema.index({ purchaseDate: -1 });
productPurchaseSchema.index({ supplier: 1, purchaseDate: -1 });
productPurchaseSchema.index({ productName: 1, purchaseDate: -1 });

const ProductPurchase = mongoose.model('ProductPurchase', productPurchaseSchema);
export default ProductPurchase;
