import mongoose from 'mongoose';

const occasionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    iconKey: { type: String, default: 'gift', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Occasion = mongoose.model('Occasion', occasionSchema);
export default Occasion;
