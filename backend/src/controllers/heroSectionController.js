import HeroSection from '../models/HeroSection.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { cloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/apiError.js';

const defaultSlides = [
  {
    order: 0,
    tag: 'Wedding & Haldi',
    mobileTag: 'Wedding Gifts',
    titleLineOne: 'Perfect Gifts',
    titleLineTwo: 'for Every',
    titleLineThree: 'Celebration',
    subtitle: 'Curated return gifts for weddings, birthdays, pooja, and every special occasion. Premium quality, affordable prices.',
    buttonText: 'Shop Gifts',
    buttonLink: '/shop?occasion=Wedding',
    badgeOneLabel: 'Gift Ready',
    badgeOneValue: 'Elegant Packing',
    badgeTwoLabel: 'Premium Picks',
    badgeTwoValue: 'Curated Daily',
    image: '',
    imagePublicId: '',
  },
  {
    order: 1,
    tag: 'Birthday & Anniversary',
    mobileTag: 'Birthday Gifts',
    titleLineOne: 'Celebrate Every',
    titleLineTwo: 'Special',
    titleLineThree: 'Occasion',
    subtitle: 'From sweet hampers to luxury boxes - find the perfect birthday return gift for every age and taste.',
    buttonText: 'Shop Gifts',
    buttonLink: '/shop?occasion=Birthday',
    badgeOneLabel: '50+ Varieties',
    badgeOneValue: 'For All Ages',
    badgeTwoLabel: '100% Quality',
    badgeTwoValue: 'Assured',
    image: '',
    imagePublicId: '',
  },
  {
    order: 2,
    tag: 'Pooja & Diwali',
    mobileTag: 'Pooja Gifts',
    titleLineOne: 'Bless Every',
    titleLineTwo: 'Home with',
    titleLineThree: 'Joy & Love',
    subtitle: 'Handpicked pooja and Diwali return gifts with traditional charm - thoughtful, affordable and delivered pan-India.',
    buttonText: 'Shop Gifts',
    buttonLink: '/shop?occasion=Diwali',
    badgeOneLabel: 'Pan India',
    badgeOneValue: 'Delivery Available',
    badgeTwoLabel: '500+ Customers',
    badgeTwoValue: 'Happy & Loved',
    image: '',
    imagePublicId: '',
  },
];

const uploadImageBuffer = (buffer, folder, transformation = undefined) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const normalizeSlides = (slides = []) =>
  defaultSlides.map((defaultSlide, index) => {
    const incomingSlide = slides.find((slide) => Number(slide.order) === index) || slides[index] || {};
    return {
      ...defaultSlide,
      ...incomingSlide,
      order: index,
      image: incomingSlide.image || defaultSlide.image,
      imagePublicId: incomingSlide.imagePublicId || defaultSlide.imagePublicId,
    };
  });

const ensureHeroSection = async () => {
  let heroSection = await HeroSection.findOne();
  if (!heroSection) {
    heroSection = await HeroSection.create({ slides: defaultSlides });
  } else if (!heroSection.slides?.length) {
    heroSection.slides = defaultSlides;
    await heroSection.save();
  }
  return heroSection;
};

export const getHeroSection = asyncHandler(async (_req, res) => {
  const heroSection = await ensureHeroSection();
  sendResponse(res, 200, 'Hero section fetched', heroSection);
});

export const updateHeroSection = asyncHandler(async (req, res) => {
  const heroSection = await ensureHeroSection();
  let slidesPayload = req.body.slides;

  if (typeof slidesPayload === 'string') {
    try {
      slidesPayload = JSON.parse(slidesPayload);
    } catch {
      throw new ApiError(400, 'Hero slides payload is invalid');
    }
  }

  if (!Array.isArray(slidesPayload) || !slidesPayload.length) {
    throw new ApiError(400, 'Hero slides are required');
  }

  const currentSlides = normalizeSlides(heroSection.slides);
  const nextSlides = normalizeSlides(slidesPayload).map((slide, index) => ({
    ...currentSlides[index],
    ...slide,
    order: index,
  }));

  for (let index = 0; index < nextSlides.length; index += 1) {
    const shouldRemoveImage = Boolean(nextSlides[index].removeImage);
    const imageFile = req.files?.[`slideImage${index}`]?.[0];

    if (shouldRemoveImage && currentSlides[index]?.imagePublicId) {
      await cloudinary.uploader.destroy(currentSlides[index].imagePublicId);
      nextSlides[index].image = '';
      nextSlides[index].imagePublicId = '';
    }

    if (imageFile) {
      if (!shouldRemoveImage && currentSlides[index]?.imagePublicId) {
        await cloudinary.uploader.destroy(currentSlides[index].imagePublicId);
      }

      const uploadedImage = await uploadImageBuffer(imageFile.buffer, 'kikis-store/hero', [
        { width: 2200, height: 1400, crop: 'limit', quality: 'auto' },
      ]);

      nextSlides[index].image = uploadedImage.secure_url;
      nextSlides[index].imagePublicId = uploadedImage.public_id;
    }

    delete nextSlides[index].removeImage;
  }

  heroSection.slides = nextSlides;
  await heroSection.save();

  sendResponse(res, 200, 'Hero section updated', heroSection);
});
