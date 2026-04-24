import mongoose from 'mongoose';

const rawMaterialSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    name: { type: String, required: true, trim: true },
    unit: {
      type: String,
      required: true,
      enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'set', 'roll'],
      default: 'pcs',
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    purchasePrice: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rawMaterialSchema.index({ name: 1 });
rawMaterialSchema.index({ supplier: 1 });

const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);
export default RawMaterial;
