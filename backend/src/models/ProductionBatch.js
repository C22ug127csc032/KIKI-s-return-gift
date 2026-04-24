import mongoose from 'mongoose';

const productionBatchSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantityProduced: { type: Number, required: true, min: 1 },
    materialsUsed: [
      {
        rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
        quantityPerUnit: { type: Number, required: true, min: 0 },
        quantityUsed: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true },
      },
    ],
    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productionBatchSchema.index({ product: 1, createdAt: -1 });

const ProductionBatch = mongoose.model('ProductionBatch', productionBatchSchema);
export default ProductionBatch;
