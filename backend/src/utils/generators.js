const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateSequentialNumber = async (Model, fieldName, prefix, options = {}) => {
  const safePrefix = prefix || 'K-ORDER NO';
  const fieldRegex = new RegExp(`^${escapeRegExp(safePrefix)}-`);
  const { padLength = 4, filter = {} } = options;
  const baseFilter = { ...filter, [fieldName]: fieldRegex };

  let sequence = await Model.countDocuments(baseFilter) + 1;
  let generatedNumber = `${safePrefix}-${String(sequence).padStart(padLength, '0')}`;

  while (await Model.exists({ [fieldName]: generatedNumber })) {
    sequence += 1;
    generatedNumber = `${safePrefix}-${String(sequence).padStart(padLength, '0')}`;
  }

  return generatedNumber;
};

export const generateOrderNumber = async (Model, options = {}) => generateSequentialNumber(
  Model,
  'orderNumber',
  'K-ORDER NO',
  options
);

export const generateInvoiceNumber = async (Model, prefix, options = {}) => {
  return generateSequentialNumber(Model, 'invoiceNumber', prefix || 'K-ON', options);
};
