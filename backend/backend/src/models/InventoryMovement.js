import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['IN', 'OUT', 'ADJUST'], required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number },
    newStock: { type: Number },
    reason: { type: String },
    referenceModel: { type: String, enum: ['Order', 'OfflineSale', 'Manual'] },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    note: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1 });
inventoryMovementSchema.index({ createdAt: -1 });

const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
export default InventoryMovement;
