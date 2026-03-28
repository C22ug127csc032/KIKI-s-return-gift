export const getProductSellingPrice = (product) => {
  const basePrice = Number(product?.price || 0);
  const discountPercentage = Math.min(Math.max(Number(product?.discountPercentage || 0), 0), 100);
  const discounted = basePrice - (basePrice * discountPercentage) / 100;
  return Math.round(discounted * 100) / 100;
};

