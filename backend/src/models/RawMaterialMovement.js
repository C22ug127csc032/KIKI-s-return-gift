import mongoose from 'mongoose';

const rawMaterialMovementSchema = new mongoose.Schema(
  {
    rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    type: { type: String, enum: ['PURCHASE', 'USAGE', 'ADJUST'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    previousStock: { type: Number, default: 0 },
    newStock: { type: Number, default: 0 },
    unitPrice: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

rawMaterialMovementSchema.index({ rawMaterial: 1, createdAt: -1 });

const RawMaterialMovement = mongoose.model('RawMaterialMovement', rawMaterialMovementSchema);
export default RawMaterialMovement;
