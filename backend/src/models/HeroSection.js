import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    tag: { type: String, default: '' },
    mobileTag: { type: String, default: '' },
    titleLineOne: { type: String, default: '' },
    titleLineTwo: { type: String, default: '' },
    titleLineThree: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '' },
    badgeOneLabel: { type: String, default: '' },
    badgeOneValue: { type: String, default: '' },
    badgeTwoLabel: { type: String, default: '' },
    badgeTwoValue: { type: String, default: '' },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
  },
  { _id: false }
);

const heroSectionSchema = new mongoose.Schema(
  {
    slides: {
      type: [heroSlideSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const HeroSection = mongoose.model('HeroSection', heroSectionSchema);

export default HeroSection;
