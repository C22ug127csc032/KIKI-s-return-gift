const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getDisplayProductName = (productOrName, supplierName = '') => {
  const rawName = typeof productOrName === 'object' && productOrName !== null
    ? String(productOrName.name || '')
    : String(productOrName || '');
  const rawSupplier = typeof productOrName === 'object' && productOrName !== null
    ? String(productOrName.supplier?.name || supplierName || '')
    : String(supplierName || '');

  const trimmedName = rawName.trim();
  const trimmedSupplier = rawSupplier.trim();
  if (!trimmedSupplier) return trimmedName;

  const supplierPattern = escapeRegex(trimmedSupplier);
  return trimmedName
    .replace(new RegExp(`\\s*-\\s*${supplierPattern}$`, 'i'), '')
    .replace(new RegExp(`\\s*\\(\\s*${supplierPattern}\\s*\\)$`, 'i'), '')
    .trim();
};
