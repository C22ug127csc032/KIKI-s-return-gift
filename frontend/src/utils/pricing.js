const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

const getSafeRate = (value) => {
  const rate = Number(value || 0);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return Math.min(rate, 100);
};

export const getTaxRates = (product = {}) => {
  const cgstRate = getSafeRate(product?.cgstRate);
  const sgstRate = getSafeRate(product?.sgstRate);
  const igstRate = getSafeRate(product?.igstRate);
  const gstRate = cgstRate + sgstRate + igstRate;

  return {
    cgstRate,
    sgstRate,
    igstRate,
    gstRate: gstRate || getSafeRate(product?.gstRate),
  };
};

export const calculatePricing = ({
  basePrice = 0,
  discountPercentage = 0,
  cgstRate = 0,
  sgstRate = 0,
  igstRate = 0,
  quantity = 1,
}) => {
  const safeBasePrice = roundCurrency(basePrice);
  const safeDiscountPercentage = getSafeRate(discountPercentage);
  const safeQty = Math.max(Number(quantity || 0), 0);
  const safeCgstRate = getSafeRate(cgstRate);
  const safeSgstRate = getSafeRate(sgstRate);
  const safeIgstRate = getSafeRate(igstRate);

  const discountAmountPerUnit = roundCurrency((safeBasePrice * safeDiscountPercentage) / 100);
  const taxableUnitPrice = roundCurrency(safeBasePrice - discountAmountPerUnit);
  const cgstAmountPerUnit = roundCurrency((taxableUnitPrice * safeCgstRate) / 100);
  const sgstAmountPerUnit = roundCurrency((taxableUnitPrice * safeSgstRate) / 100);
  const igstAmountPerUnit = roundCurrency((taxableUnitPrice * safeIgstRate) / 100);
  const gstAmountPerUnit = roundCurrency(cgstAmountPerUnit + sgstAmountPerUnit + igstAmountPerUnit);
  const totalUnitPrice = roundCurrency(taxableUnitPrice + gstAmountPerUnit);

  return {
    basePrice: safeBasePrice,
    discountPercentage: safeDiscountPercentage,
    discountAmountPerUnit,
    taxableUnitPrice,
    cgstRate: safeCgstRate,
    sgstRate: safeSgstRate,
    igstRate: safeIgstRate,
    gstRate: roundCurrency(safeCgstRate + safeSgstRate + safeIgstRate),
    cgstAmountPerUnit,
    sgstAmountPerUnit,
    igstAmountPerUnit,
    gstAmountPerUnit,
    totalUnitPrice,
    discountAmount: roundCurrency(discountAmountPerUnit * safeQty),
    taxableAmount: roundCurrency(taxableUnitPrice * safeQty),
    cgstAmount: roundCurrency(cgstAmountPerUnit * safeQty),
    sgstAmount: roundCurrency(sgstAmountPerUnit * safeQty),
    igstAmount: roundCurrency(igstAmountPerUnit * safeQty),
    gstAmount: roundCurrency(gstAmountPerUnit * safeQty),
    totalAmount: roundCurrency(totalUnitPrice * safeQty),
  };
};

export const getMrpPrice = (productOrMrp, fallbackPrice = 0) => {
  if (typeof productOrMrp === 'object' && productOrMrp !== null) {
    if (productOrMrp.mrp !== undefined && productOrMrp.mrp !== null && productOrMrp.mrp !== '') {
      return roundCurrency(productOrMrp.mrp || 0);
    }
    if (productOrMrp.basePrice !== undefined && productOrMrp.basePrice !== null && productOrMrp.basePrice !== '') {
      return calculatePricing({
        basePrice: productOrMrp.basePrice,
        discountPercentage: 0,
        cgstRate: productOrMrp.cgstRate,
        sgstRate: productOrMrp.sgstRate,
        igstRate: productOrMrp.igstRate,
      }).totalUnitPrice;
    }
    return roundCurrency(productOrMrp.mrp || productOrMrp.price || 0);
  }
  return roundCurrency(productOrMrp || fallbackPrice || 0);
};

export const getGstRate = (productOrRate) => {
  if (typeof productOrRate === 'object' && productOrRate !== null) {
    return getTaxRates(productOrRate).gstRate;
  }
  const rate = typeof productOrRate === 'object' && productOrRate !== null
    ? Number(productOrRate.gstRate || 0)
    : Number(productOrRate || 0);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return Math.min(rate, 100);
};

export const getSellingPrice = (productOrPrice, discountPercentage = 0) => {
  if (typeof productOrPrice === 'object' && productOrPrice !== null) {
    if (productOrPrice.basePrice !== undefined && productOrPrice.basePrice !== null && productOrPrice.basePrice !== '') {
      return calculatePricing({
        basePrice: productOrPrice.basePrice,
        discountPercentage: productOrPrice.discountPercentage,
        cgstRate: productOrPrice.cgstRate,
        sgstRate: productOrPrice.sgstRate,
        igstRate: productOrPrice.igstRate,
      }).totalUnitPrice;
    }
    if (productOrPrice.mrp !== undefined && productOrPrice.mrp !== null && productOrPrice.mrp !== '') {
      return roundCurrency(productOrPrice.price || 0);
    }

    const basePrice = Number(productOrPrice.price || 0);
    const discount = Math.min(Math.max(Number(productOrPrice.discountPercentage || 0), 0), 100);
    return roundCurrency(basePrice - (basePrice * discount) / 100);
  }

  const basePrice = Number(productOrPrice || 0);
  const discount = Math.min(Math.max(Number(discountPercentage || 0), 0), 100);
  return roundCurrency(basePrice - (basePrice * discount) / 100);
};

export const getDiscountPercentage = (productOrMrp, maybeSellingPrice = 0) => {
  if (typeof productOrMrp === 'object' && productOrMrp !== null) {
    if (productOrMrp.basePrice !== undefined && productOrMrp.basePrice !== null && productOrMrp.basePrice !== '') {
      return Math.round(getSafeRate(productOrMrp.discountPercentage || 0));
    }
    if (productOrMrp.mrp !== undefined && productOrMrp.mrp !== null && productOrMrp.mrp !== '') {
      const mrp = Number(productOrMrp.mrp || 0);
      const sellingPrice = Number(productOrMrp.price || 0);
      if (mrp <= 0 || sellingPrice >= mrp) return 0;
      return Math.round(((mrp - sellingPrice) / mrp) * 100);
    }

    return Math.round(Math.min(Math.max(Number(productOrMrp.discountPercentage || 0), 0), 100));
  }

  const mrp = Number(productOrMrp || 0);
  const sellingPrice = Number(maybeSellingPrice || 0);
  if (mrp <= 0 || sellingPrice >= mrp) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

export const getDiscountedPrice = getSellingPrice;

export const getTaxableAmount = (amountOrProduct, maybeGstRate = 0) => {
  const totalAmount = typeof amountOrProduct === 'object' && amountOrProduct !== null
    ? getSellingPrice(amountOrProduct)
    : Number(amountOrProduct || 0);
  const gstRate = typeof amountOrProduct === 'object' && amountOrProduct !== null
    ? getGstRate(amountOrProduct)
    : getGstRate(maybeGstRate);
  if (gstRate <= 0) return roundCurrency(totalAmount);
  return roundCurrency(totalAmount / (1 + gstRate / 100));
};

export const getGstAmount = (amountOrProduct, maybeGstRate = 0) => (
  roundCurrency(getSellingPrice(typeof amountOrProduct === 'object' && amountOrProduct !== null ? amountOrProduct : { price: amountOrProduct }) - getTaxableAmount(amountOrProduct, maybeGstRate))
);
