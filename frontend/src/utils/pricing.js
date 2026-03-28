export const getDiscountedPrice = (price, discountPercentage = 0) => {
  const basePrice = Number(price || 0);
  const discount = Math.min(Math.max(Number(discountPercentage || 0), 0), 100);
  const discounted = basePrice - (basePrice * discount) / 100;
  return Math.round(discounted * 100) / 100;
};
