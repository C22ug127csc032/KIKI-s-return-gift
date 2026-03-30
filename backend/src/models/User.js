import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { EMAIL_REGEX, PHONE_REGEX } from '../utils/validation.js';

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => EMAIL_REGEX.test(value),
        message: 'Enter a valid email address',
      },
    },
    password: { type: String, required: true, minlength: 6 },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || PHONE_REGEX.test(value),
        message: 'Phone number must be exactly 10 digits',
      },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
