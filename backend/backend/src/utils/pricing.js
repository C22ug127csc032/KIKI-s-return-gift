const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

const getSafeRate = (value) => {
  const rate = Number(value || 0);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return Math.min(rate, 100);
};

export const getProductTaxRates = (product = {}) => {
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

export const calculateLinePricing = ({
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

export const getProductMrp = (product) => {
  if (product?.mrp !== undefined && product?.mrp !== null && product?.mrp !== '') {
    return roundCurrency(product.mrp || 0);
  }
  if (product?.basePrice !== undefined && product?.basePrice !== null && product?.basePrice !== '') {
    const pricing = calculateLinePricing({
      basePrice: product.basePrice,
      discountPercentage: 0,
      cgstRate: product.cgstRate,
      sgstRate: product.sgstRate,
      igstRate: product.igstRate,
    });
    return pricing.totalUnitPrice;
  }
  return roundCurrency(product?.price || 0);
};

export const getProductGstRate = (product) => {
  return getProductTaxRates(product).gstRate;
};

export const getProductSellingPrice = (product) => {
  if (product?.mrp !== undefined && product?.mrp !== null && product?.mrp !== '') {
    const pricing = calculateLinePricing({
      basePrice: product.mrp,
      discountPercentage: product.discountPercentage,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
    });
    return pricing.taxableUnitPrice;
  }
  if (product?.price !== undefined && product?.price !== null && product?.price !== '') {
    return roundCurrency(product?.price || 0);
  }
  if (product?.basePrice !== undefined && product?.basePrice !== null && product?.basePrice !== '') {
    const pricing = calculateLinePricing({
      basePrice: product.basePrice,
      discountPercentage: product.discountPercentage,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
    });
    return pricing.taxableUnitPrice;
  }

  const basePrice = Number(product?.price || 0);
  const discountPercentage = Math.min(Math.max(Number(product?.discountPercentage || 0), 0), 100);
  return roundCurrency(basePrice - (basePrice * discountPercentage) / 100);
};

export const getProductDiscountPercentage = (product) => {
  if (product?.mrp !== undefined && product?.mrp !== null) {
    const mrp = Number(product?.mrp || 0);
    const sellingPrice = Number(getProductSellingPrice(product) || 0);
    if (mrp <= 0 || sellingPrice >= mrp) return 0;
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
  }
  if (product?.basePrice !== undefined && product?.basePrice !== null && product?.basePrice !== '') {
    return Math.round(getSafeRate(product?.discountPercentage || 0));
  }

  return Math.round(Math.min(Math.max(Number(product?.discountPercentage || 0), 0), 100));
};

export const getTaxableAmountFromInclusive = (amount, gstRate = 0) => {
  const grossAmount = roundCurrency(amount);
  const safeRate = getProductGstRate({ gstRate });
  if (safeRate <= 0) return grossAmount;
  return roundCurrency(grossAmount / (1 + safeRate / 100));
};

export const getGstAmountFromInclusive = (amount, gstRate = 0) => (
  roundCurrency(roundCurrency(amount) - getTaxableAmountFromInclusive(amount, gstRate))
);

