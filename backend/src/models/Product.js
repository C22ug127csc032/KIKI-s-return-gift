import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    images: [{ url: String, publicId: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    occasion: { type: String, trim: true },
    sku: { type: String, unique: true, sparse: true },
    featured: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    bom: [
      {
        rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
        quantity: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

productSchema.pre('insertMany', function (next, docs) {
  docs.forEach((doc, index) => {
    if (!doc.slug && doc.name) {
      doc.slug = `${slugify(doc.name, { lower: true, strict: true })}-${Date.now()}-${index}`;
    }
  });
  next();
});

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

productSchema.virtual('discountedPrice').get(function () {
  const discount = Math.min(Math.max(Number(this.discountPercentage || 0), 0), 100);
  const discounted = Number(this.price || 0) - (Number(this.price || 0) * discount) / 100;
  return Math.round(discounted * 100) / 100;
});

productSchema.virtual('hasDiscount').get(function () {
  return Number(this.discountPercentage || 0) > 0;
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
