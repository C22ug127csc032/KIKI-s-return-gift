export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildSortQuery = (sortBy, allowedFields = {}) => {
  if (!sortBy) return { createdAt: -1 };
  const sorts = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    ...allowedFields,
  };
  return sorts[sortBy] || { createdAt: -1 };
};

export const buildSearchQuery = (search, fields) => {
  if (!search) return {};
  const regex = new RegExp(search, 'i');
  return { $or: fields.map((f) => ({ [f]: regex })) };
};
