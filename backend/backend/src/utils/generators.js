export const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `KKS-${year}${month}${day}-${random}`;
};

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const generateInvoiceNumber = async (Model, prefix) => {
  const safePrefix = prefix || 'K-ON';
  const prefixRegex = new RegExp(`^${escapeRegExp(safePrefix)}-`);

  let sequence = await Model.countDocuments({ invoiceNumber: prefixRegex }) + 1;
  let invoiceNumber = `${safePrefix}-${String(sequence).padStart(4, '0')}`;

  while (await Model.exists({ invoiceNumber })) {
    sequence += 1;
    invoiceNumber = `${safePrefix}-${String(sequence).padStart(4, '0')}`;
  }

  return invoiceNumber;
};
