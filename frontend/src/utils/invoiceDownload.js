import toast from 'react-hot-toast';

const getSafeInvoiceCode = (value) => String(value || 'invoice').replace(/[^a-zA-Z0-9-_]/g, '-');

export const downloadInvoiceFile = (blob, invoiceCode) => {
  const invoiceBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/octet-stream' });
  const extension = invoiceBlob.type === 'application/pdf' ? 'pdf' : 'html';
  const fileName = `invoice-${getSafeInvoiceCode(invoiceCode)}.${extension}`;
  const url = URL.createObjectURL(invoiceBlob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const showInvoiceDownloadError = async (error) => {
  if (error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const parsed = JSON.parse(text);
      toast.error(parsed.message || 'Unable to download invoice');
      return;
    } catch {
      // Fall back to the generic toast below.
    }
  }

  toast.error(error.response?.data?.message || 'Unable to download invoice');
};
