import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiImage, FiSave, FiTrash2 } from 'react-icons/fi';
import api from '../../api/api.js';
import { PageLoader } from '../../components/ui/index.jsx';
import heroImage1 from '../../assets/hero-1.jpg';
import heroImage2 from '../../assets/hero-2.jpg';
import heroImage3 from '../../assets/hero-3.jpg';

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
    fallbackImage: heroImage1,
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
    fallbackImage: heroImage2,
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
  const [saving, setSaving] = useState(false);

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

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('slides', JSON.stringify(slides.map((slide) => ({
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
      }))));

      Object.entries(imageFiles).forEach(([index, file]) => {
        if (file) formData.append(`slideImage${index}`, file);
      });

      const response = await api.put('/hero-section', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSlides(mergeSlides(response.data.data?.slides || []));
      setImageFiles({});
      toast.success('Hero section updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update hero section');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Hero Section</h1>
        <p className="mt-1 text-sm text-gray-500">Manage the full homepage hero slides, including complete images and all visible content.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {slides.map((slide, index) => (
          <section key={slide.order} className="admin-card space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Slide {index + 1}</h2>
                <p className="text-sm text-gray-500">Replace the full hero image and update the slide content from here.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <FiImage size={14} /> Full Image Control
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Tag" value={slide.tag} onChange={(value) => updateSlide(index, 'tag', value)} />
                  <Field label="Mobile Tag" value={slide.mobileTag} onChange={(value) => updateSlide(index, 'mobileTag', value)} />
                  <Field label="Button Text" value={slide.buttonText} onChange={(value) => updateSlide(index, 'buttonText', value)} />
                  <Field label="Button Link" value={slide.buttonLink} onChange={(value) => updateSlide(index, 'buttonLink', value)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Title Line 1" value={slide.titleLineOne} onChange={(value) => updateSlide(index, 'titleLineOne', value)} />
                  <Field label="Title Line 2" value={slide.titleLineTwo} onChange={(value) => updateSlide(index, 'titleLineTwo', value)} />
                  <Field label="Title Line 3" value={slide.titleLineThree} onChange={(value) => updateSlide(index, 'titleLineThree', value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Subtitle</label>
                  <textarea
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(index, 'subtitle', e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Badge 1 Label" value={slide.badgeOneLabel} onChange={(value) => updateSlide(index, 'badgeOneLabel', value)} />
                  <Field label="Badge 1 Value" value={slide.badgeOneValue} onChange={(value) => updateSlide(index, 'badgeOneValue', value)} />
                  <Field label="Badge 2 Label" value={slide.badgeTwoLabel} onChange={(value) => updateSlide(index, 'badgeTwoLabel', value)} />
                  <Field label="Badge 2 Value" value={slide.badgeTwoValue} onChange={(value) => updateSlide(index, 'badgeTwoValue', value)} />
                </div>
              </div>
            </div>
          </section>
        ))}

        <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
          <FiSave size={16} />
          {saving ? 'Saving...' : 'Save Hero Section'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </div>
  );
}
