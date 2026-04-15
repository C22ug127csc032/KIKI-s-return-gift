const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

export const getProductMrp = (product) => roundCurrency(product?.mrp || product?.price || 0);

export const getProductSellingPrice = (product) => {
  if (product?.mrp !== undefined && product?.mrp !== null) {
    return roundCurrency(product?.price || 0);
  }

  const basePrice = Number(product?.price || 0);
  const discountPercentage = Math.min(Math.max(Number(product?.discountPercentage || 0), 0), 100);
  return roundCurrency(basePrice - (basePrice * discountPercentage) / 100);
};

export const getProductDiscountPercentage = (product) => {
  if (product?.mrp !== undefined && product?.mrp !== null) {
    const mrp = Number(product?.mrp || 0);
    const sellingPrice = Number(product?.price || 0);
    if (mrp <= 0 || sellingPrice >= mrp) return 0;
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
  }

  return Math.round(Math.min(Math.max(Number(product?.discountPercentage || 0), 0), 100));
};

