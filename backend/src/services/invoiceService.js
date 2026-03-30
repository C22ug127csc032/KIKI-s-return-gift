import PDFDocument from 'pdfkit';
import Order from '../models/Order.js';
import OfflineSale from '../models/OfflineSale.js';
import AppSetting from '../models/AppSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const drawLine = (doc, y, color = '#D7DCE2') => {
  doc
    .moveTo(48, y)
    .lineTo(doc.page.width - 48, y)
    .lineWidth(1)
    .strokeColor(color)
    .stroke();
};

const fitTextInBox = (doc, text, x, y, width, options = {}) => {
  const {
    maxFontSize = 18,
    minFontSize = 10,
    lineGap = 2,
    color = '#FFFFFF',
    font = 'Helvetica-Bold',
  } = options;

  let fontSize = maxFontSize;
  while (fontSize > minFontSize) {
    const height = doc.heightOfString(text, { width, align: 'center', lineGap });
    if (height <= fontSize * 2.4) break;
    fontSize -= 1;
  }

  doc
    .fillColor(color)
    .font(font)
    .fontSize(fontSize)
    .text(text, x, y, { width, align: 'center', lineGap });
};

const generateInvoicePDF = (doc, data, settings) => {
  const {
    items,
    customerName,
    customerPhone,
    customerAddress,
    subtotal,
    tax,
    totalAmount,
    invoiceNumber,
    date,
  } = data;

  const storeName = settings?.storeName || "KIKI'S RETURN GIFT STORE";
  const storeAddress = settings?.storeAddress || '';
  const gstNumber = settings?.gstNumber || '';
  const supportEmail = settings?.supportEmail || '';
  const taxRate = settings?.gstPercentage || 0;

  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 96;
  const summaryBoxWidth = 196;

  doc.rect(0, 0, pageWidth, doc.page.height).fill('#FFF8F4');

  doc
    .roundedRect(36, 28, pageWidth - 72, 92, 16)
    .fill('#FFFFFF');

  doc
    .roundedRect(36, 28, pageWidth - 72, 92, 16)
    .fillOpacity(0.88)
    .fill('#FFF1EB')
    .fillOpacity(1);

  doc
    .roundedRect(36, 28, pageWidth - 72, 92, 16)
    .strokeColor('#FBCFE8')
    .lineWidth(1)
    .stroke();

  doc
    .fillColor('#111827')
    .font('Helvetica-Bold')
    .fontSize(24)
    .text(storeName, 56, 52, { width: contentWidth - 160 });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#6B7280')
    .text(storeAddress || 'Premium gifts and memorable celebrations', 56, 84, {
      width: contentWidth - 220,
    });

  if (gstNumber) {
    doc
      .fontSize(10)
      .fillColor('#9A3412')
      .text(`GST No: ${gstNumber}`, 56, 99, { width: 220 });
  }

  doc
    .roundedRect(pageWidth - 212, 40, 148, 70, 18)
    .fill('#E11D48');

  doc
    .fillColor('#FFE4E6')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('INVOICE', pageWidth - 190, 56, { width: 104, align: 'center' });

  fitTextInBox(doc, invoiceNumber, pageWidth - 196, 74, 116, {
    maxFontSize: 15,
    minFontSize: 10,
    lineGap: 0,
    color: '#FFFFFF',
  });

  let y = 152;

  doc
    .roundedRect(36, y, pageWidth - 72, 132, 16)
    .fill('#FFFFFF');

  doc
    .roundedRect(36, y, pageWidth - 72, 132, 16)
    .strokeColor('#FCE7F3')
    .lineWidth(1)
    .stroke();

  doc
    .fillColor('#BE123C')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Billed To', 56, y + 20);

  doc
    .fontSize(11)
    .text('Invoice Details', pageWidth - 220, y + 20);

  doc
    .fillColor('#1F2937')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(customerName || 'Customer', 56, y + 44, { width: 240 });

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('#4B5563');

  let customerY = y + 68;
  if (customerPhone) {
    doc.text(`Phone: ${customerPhone}`, 56, customerY, { width: 250 });
    customerY += 18;
  }
  if (customerAddress) {
    doc.text(`Address: ${customerAddress}`, 56, customerY, { width: 260 });
  }

  doc
    .fillColor('#4B5563')
    .font('Helvetica')
    .fontSize(10.5)
    .text(`Invoice No: ${invoiceNumber}`, pageWidth - 220, y + 46, { width: 150, align: 'left' })
    .text(`Date: ${formatDate(date)}`, pageWidth - 220, y + 66, { width: 150, align: 'left' });

  if (gstNumber) {
    doc.text(`GST Reg: ${gstNumber}`, pageWidth - 220, y + 86, { width: 150, align: 'left' });
  }

  y += 164;

  doc
    .fillColor('#BE123C')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Items', 40, y);

  const tableTop = y + 24;
  const itemX = 56;
  const qtyX = 348;
  const priceX = 404;
  const totalX = 482;
  const rowHeight = 30;

  doc
    .roundedRect(36, tableTop, pageWidth - 72, 32, 10)
    .fill('#FFF1F2');

  doc
    .fillColor('#9F1239')
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .text('Description', itemX, tableTop + 10, { width: 250 })
    .text('Qty', qtyX, tableTop + 10, { width: 32, align: 'right' })
    .text('Price', priceX, tableTop + 10, { width: 60, align: 'right' })
    .text('Amount', totalX, tableTop + 10, { width: 74, align: 'right' });

  let rowY = tableTop + 42;
  doc.font('Helvetica').fontSize(10).fillColor('#1F2937');

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc
        .roundedRect(36, rowY - 7, pageWidth - 72, rowHeight, 8)
        .fill('#FFFFFF');
      doc.fillColor('#1F2937');
    } else {
      doc
        .roundedRect(36, rowY - 7, pageWidth - 72, rowHeight, 8)
        .fill('#FFFDFB');
      doc.fillColor('#1F2937');
    }

    const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);

    doc.text(item.name || 'Item', itemX, rowY, { width: 240 });
    doc.text(String(item.quantity || 0), qtyX, rowY, { width: 32, align: 'right' });
    doc.text(formatCurrency(item.price), priceX, rowY, { width: 60, align: 'right' });
    doc.text(formatCurrency(itemTotal), totalX, rowY, { width: 74, align: 'right' });

    rowY += rowHeight;
  });

  const summaryTop = rowY + 18;
  drawLine(doc, summaryTop - 8);

  doc
    .roundedRect(pageWidth - summaryBoxWidth - 36, summaryTop + 8, summaryBoxWidth, tax > 0 ? 118 : 92, 14)
    .fill('#FFFFFF');

  doc
    .roundedRect(pageWidth - summaryBoxWidth - 36, summaryTop + 8, summaryBoxWidth, tax > 0 ? 118 : 92, 14)
    .strokeColor('#FBCFE8')
    .lineWidth(1)
    .stroke();

  const labelX = pageWidth - summaryBoxWidth - 12;
  const valueWidth = 92;

  doc
    .fillColor('#4B5563')
    .font('Helvetica')
    .fontSize(10.5)
    .text('Subtotal', labelX, summaryTop + 24, { width: 90 })
    .text(formatCurrency(subtotal), pageWidth - 132, summaryTop + 24, { width: valueWidth, align: 'right' });

  let summaryY = summaryTop + 48;
  if (tax > 0) {
    doc
      .text(`GST${taxRate ? ` (${taxRate}%)` : ''}`, labelX, summaryY, { width: 90 })
      .text(formatCurrency(tax), pageWidth - 132, summaryY, { width: valueWidth, align: 'right' });
    summaryY += 24;
  }

  drawLine(doc, summaryY + 4, '#E5E7EB');

  doc
    .fillColor('#BE123C')
    .font('Helvetica-Bold')
    .fontSize(12.5)
    .text('Total Due', labelX, summaryY + 16, { width: 90 })
    .text(formatCurrency(totalAmount), pageWidth - 132, summaryY + 16, { width: valueWidth, align: 'right' });

  const footerY = doc.page.height - 82;
  drawLine(doc, footerY, '#D7DCE2');

  doc
    .fillColor('#6B7280')
    .font('Helvetica')
    .fontSize(9.5)
    .text('Thank you for choosing us for your gifting needs.', 48, footerY + 18, {
      width: contentWidth,
      align: 'center',
    });

  if (supportEmail) {
    doc.text(`Support: ${supportEmail}`, 48, footerY + 34, {
      width: contentWidth,
      align: 'center',
    });
  }
};

export const generateOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.user.role !== 'admin' && order.user?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }

  const settings = await AppSetting.findOne();
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.invoiceNumber}.pdf`);

  doc.pipe(res);
  generateInvoicePDF(doc, {
    invoiceNumber: order.invoiceNumber || order.orderNumber,
    date: order.createdAt,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.tax,
    totalAmount: order.totalAmount,
  }, settings);
  doc.end();
});

export const generateOfflineSaleInvoice = asyncHandler(async (req, res) => {
  const sale = await OfflineSale.findById(req.params.id);
  if (!sale) throw new ApiError(404, 'Sale not found');

  const settings = await AppSetting.findOne();
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.invoiceNumber}.pdf`);

  doc.pipe(res);
  generateInvoicePDF(doc, {
    invoiceNumber: sale.invoiceNumber,
    date: sale.createdAt,
    customerName: sale.customerName,
    customerPhone: sale.phone,
    customerAddress: sale.address,
    items: sale.items,
    subtotal: sale.subtotal,
    tax: sale.tax,
    totalAmount: sale.totalAmount,
  }, settings);
  doc.end();
});
