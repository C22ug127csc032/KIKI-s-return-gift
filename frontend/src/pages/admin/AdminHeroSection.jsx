import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiImage, FiSave, FiTrash2 } from 'react-icons/fi';
import api from '../../api/api.js';
import { PageLoader } from '../../components/ui/index.jsx';
import FloatingField from '../../components/forms/FloatingField.jsx';
import heroImage1 from '../../assets/hero-1.jpg';
import heroImage2 from '../../assets/hero-2.jpg';
import heroImage3 from '../../assets/hero-3.jpg';

const defaultSlides = [
  {
    order: 0,
    tag: 'Wedding & Haldi',
    mobileTag: 'Wedding Gifts',
    titleLineOne: 'Perfect Gifts',
    titleLineTwo: 'for Every Celebration',
    titleLineThree: '',
    subtitle: 'Curated return gifts for weddings, birthdays, pooja, and every special occasion. Premium quality, affordable prices.',
    buttonText: 'Shop Gifts',
    buttonLink: '/shop?occasion=Wedding',
    badgeOneLabel: 'Gift Ready',
    badgeOneValue: 'Elegant Packing',
    badgeTwoLabel: 'Premium Picks',
    badgeTwoValue: 'Curated Daily',
    image: '',
    fallbackImage: heroImage1,
  },
  {
    order: 1,
    tag: 'Birthday & Anniversary',
    mobileTag: 'Birthday Gifts',
    titleLineOne: 'Celebrate Every',
    titleLineTwo: 'Special Occasion',
    titleLineThree: '',
    subtitle: 'From sweet hampers to luxury boxes - find the perfect birthday return gift for every age and taste.',
    buttonText: 'Shop Gifts',
    buttonLink: '/shop?occasion=Birthday',
    badgeOneLabel: '50+ Varieties',
    badgeOneValue: 'For All Ages',
    badgeTwoLabel: '100% Quality',
    badgeTwoValue: 'Assured',
    image: '',
    fallbackImage: heroImage2,
  },
  {
    order: 2,
    tag: 'Pooja & Diwali',
    mobileTag: 'Pooja Gifts',
    titleLineOne: 'Bless Every',
    titleLineTwo: 'Home with Joy & Love',
    titleLineThree: '',
    subtitle: 'Handpicked pooja and Diwali return gifts with traditional charm - thoughtful, affordable and delivered pan-India.',
    buttonText: 'Shop Gifts',
    buttonLink: '/shop?occasion=Diwali',
    badgeOneLabel: 'Pan India',
    badgeOneValue: 'Delivery Available',
    badgeTwoLabel: '500+ Customers',
    badgeTwoValue: 'Happy & Loved',
    image: '',
    fallbackImage: heroImage3,
  },
];

const mergeSlides = (slides = []) =>
  defaultSlides.map((defaultSlide, index) => ({
    ...defaultSlide,
    ...(slides.find((slide) => Number(slide.order) === index) || slides[index] || {}),
    order: index,
  }));

export default function AdminHeroSection() {
  const [slides, setSlides] = useState(defaultSlides);
  const [imageFiles, setImageFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSlideIndex, setSavingSlideIndex] = useState(null);

  useEffect(() => {
    document.title = 'Hero Section - Admin';
    api.get('/hero-section')
      .then((response) => {
        setSlides(mergeSlides(response.data.data?.slides || []));
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSlide = (index, key, value) => {
    setSlides((current) => current.map((slide, slideIndex) => (
      slideIndex === index ? { ...slide, [key]: value } : slide
    )));
  };

  const handleFileChange = (index, file) => {
    setImageFiles((current) => ({ ...current, [index]: file || null }));
  };

  const buildSlidePayload = (slide) => ({
    order: slide.order,
    tag: slide.tag,
    mobileTag: slide.mobileTag,
    titleLineOne: slide.titleLineOne,
    titleLineTwo: slide.titleLineTwo,
    titleLineThree: slide.titleLineThree,
    subtitle: slide.subtitle,
    buttonText: slide.buttonText,
    buttonLink: slide.buttonLink,
    badgeOneLabel: slide.badgeOneLabel,
    badgeOneValue: slide.badgeOneValue,
    badgeTwoLabel: slide.badgeTwoLabel,
    badgeTwoValue: slide.badgeTwoValue,
    image: slide.image,
    removeImage: Boolean(slide.removeImage),
  });

  const handleSaveSlide = async (index) => {
    setSavingSlideIndex(index);
    try {
      const formData = new FormData();
      formData.append('slideIndex', String(index));
      formData.append('slide', JSON.stringify(buildSlidePayload(slides[index])));

      const file = imageFiles[index];
      if (file) {
        formData.append(`slideImage${index}`, file);
      }

      const response = await api.put('/hero-section', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSlides(mergeSlides(response.data.data?.slides || []));
      setImageFiles((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      toast.success(`Slide ${index + 1} updated`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update slide ${index + 1}`);
    } finally {
      setSavingSlideIndex(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Hero Section</h1>
        <p className="mt-1 text-sm text-gray-500">Manage the homepage hero image and centered title text for each slide.</p>
      </div>

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <section key={slide.order} className="admin-card space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Slide {index + 1}</h2>
                <p className="text-sm text-gray-500">Replace the hero image and update the three title lines shown on the homepage.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <FiImage size={14} /> Full Image Control
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Hero Image</label>
                  <img
                    src={slide.image || slide.fallbackImage}
                    alt={`Hero slide ${index + 1}`}
                    className="mb-3 h-56 w-full rounded-2xl border border-gray-200 object-cover"
                  />
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2.5 py-1 font-medium ${slide.image ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {slide.image ? 'Uploaded image active' : 'Using original project image'}
                    </span>
                    {slide.image ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateSlide(index, 'image', '');
                          updateSlide(index, 'removeImage', true);
                          handleFileChange(index, null);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-600 transition-colors hover:bg-red-100"
                      >
                        <FiTrash2 size={12} /> Remove Uploaded Image
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const nextFile = e.target.files?.[0] || null;
                      handleFileChange(index, nextFile);
                      if (nextFile) updateSlide(index, 'removeImage', false);
                    }}
                    className="input-field text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:text-brand-600"
                  />
                  <p className="mt-2 text-xs text-gray-400">Upload a full hero banner image. Removing it will automatically restore the original built-in slide image.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Title Line 1" value={slide.titleLineOne} onChange={(value) => updateSlide(index, 'titleLineOne', value)} />
                  <Field label="Title Line 2" value={slide.titleLineTwo} onChange={(value) => updateSlide(index, 'titleLineTwo', value)} />
                  <Field label="Title Line 3" value={slide.titleLineThree} onChange={(value) => updateSlide(index, 'titleLineThree', value)} />
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  The homepage hero now shows only the centered title with fixed Shop and WhatsApp buttons.
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSlide(index)}
                disabled={savingSlideIndex !== null}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiSave size={16} />
                {savingSlideIndex === index ? `Saving Slide ${index + 1}...` : `Save Slide ${index + 1}`}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <FloatingField label={label} value={value || ''} onChange={(e) => onChange(e.target.value)} />
  );
}
