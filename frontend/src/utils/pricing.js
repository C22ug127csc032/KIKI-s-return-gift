const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

export const getMrpPrice = (productOrMrp, fallbackPrice = 0) => {
  if (typeof productOrMrp === 'object' && productOrMrp !== null) {
    return roundCurrency(productOrMrp.mrp || productOrMrp.price || 0);
  }
  return roundCurrency(productOrMrp || fallbackPrice || 0);
};

export const getSellingPrice = (productOrPrice, discountPercentage = 0) => {
  if (typeof productOrPrice === 'object' && productOrPrice !== null) {
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
