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

const drawLine = (doc, x1, y1, x2, y2, color = '#D8DEE9', width = 1) => {
  doc
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .lineWidth(width)
    .strokeColor(color)
    .stroke();
};

const drawSoftBackground = (doc) => {
  const { width, height } = doc.page;

  doc.rect(0, 0, width, height).fill('#FFFDFC');

  doc.save();
  doc.fillOpacity(0.55);
  doc.circle(86, 72, 82).fill('#F9D3E1');
  doc.circle(width - 88, 90, 110).fill('#D6F2F2');
  doc.circle(120, height - 110, 104).fill('#E5F5D9');
  doc.circle(width - 100, height - 96, 118).fill('#E2E7FF');
  doc.fillOpacity(0.22);
  doc.circle(width / 2, 128, 72).fill('#F5D0FE');
  doc.restore();

  const glitterLines = [
    [32, 118, 192, 82],
    [doc.page.width - 210, 132, doc.page.width - 42, 96],
    [54, height - 148, 214, height - 106],
    [doc.page.width - 236, height - 172, doc.page.width - 54, height - 122],
  ];

  glitterLines.forEach(([x1, y1, x2, y2]) => {
    drawLine(doc, x1, y1, x2, y2, '#D6B35E', 1.2);
  });
};

const drawHeader = (doc, settings, invoiceNumber) => {
  const { width } = doc.page;
  const storeName = settings?.storeName || "KIKI'S RETURN GIFT STORE";
  const storeTagline = settings?.storeTagline || 'Premium gifts and memorable celebrations';
  const supportPhone = settings?.supportPhone || settings?.whatsappNumber || '';

  doc
    .roundedRect(34, 28, width - 68, 118, 24)
    .fillOpacity(0.96)
    .fill('#FFFFFF')
    .fillOpacity(1);

  doc
    .roundedRect(34, 28, width - 68, 118, 24)
    .strokeColor('#F3C4D7')
    .lineWidth(1)
    .stroke();

  doc
    .roundedRect(50, 44, 126, 88, 22)
    .fill('#FFF6E7');

  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(34)
    .text('K', 92, 56);

  doc
    .font('Helvetica-Oblique')
    .fontSize(24)
    .text("iki's", 122, 72);

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('RETURN GIFT STORE', 184, 60, { width: 220 });

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('#5B6472')
    .text(storeName, 184, 88, { width: 230 })
    .text(storeTagline, 184, 104, { width: 230 });

  if (supportPhone) {
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#111111')
      .text(`Call / WhatsApp: ${supportPhone}`, 184, 121, { width: 240 });
  }

  doc
    .roundedRect(width - 208, 42, 142, 90, 24)
    .fill('#E11D48');

  doc
    .fillColor('#FFE9F1')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('INVOICE', width - 188, 58, { width: 102, align: 'center' });

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(invoiceNumber, width - 194, 82, { width: 114, align: 'center' });
};

const drawInfoCards = (doc, data, settings, topY) => {
  const { width } = doc.page;
  const cardWidth = (width - 84) / 2;
  const leftX = 34;
  const rightX = leftX + cardWidth + 16;
  const cardHeight = 136;

  const {
    customerName,
    customerPhone,
    customerAddress,
    invoiceNumber,
    date,
  } = data;

  doc.roundedRect(leftX, topY, cardWidth, cardHeight, 20).fill('#FFFFFF');
  doc.roundedRect(leftX, topY, cardWidth, cardHeight, 20).strokeColor('#EADFE5').lineWidth(1).stroke();
  doc.roundedRect(rightX, topY, cardWidth, cardHeight, 20).fill('#FFFFFF');
  doc.roundedRect(rightX, topY, cardWidth, cardHeight, 20).strokeColor('#D6EEE8').lineWidth(1).stroke();

  doc.fillColor('#BE123C').font('Helvetica-Bold').fontSize(11).text('BILLED TO', leftX + 20, topY + 18);
  doc.fillColor('#0891B2').text('INVOICE DETAILS', rightX + 20, topY + 18);

  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(15).text(customerName || 'Customer', leftX + 20, topY + 42, { width: cardWidth - 40 });
  doc.font('Helvetica').fontSize(10.5).fillColor('#4B5563');
  let customerY = topY + 68;
  if (customerPhone) {
    doc.text(`Phone: ${customerPhone}`, leftX + 20, customerY, { width: cardWidth - 40 });
    customerY += 18;
  }
  if (customerAddress) {
    doc.text(`Address: ${customerAddress}`, leftX + 20, customerY, { width: cardWidth - 40 });
  }

  const detailRows = [
    ['Invoice No', invoiceNumber],
    ['Date', formatDate(date)],
    ['GST Number', settings?.gstNumber || 'Not set'],
    ['GST (%)', String(settings?.gstPercentage ?? 0)],
  ];

  let detailY = topY + 44;
  detailRows.forEach(([label, value]) => {
    doc.fillColor('#6B7280').font('Helvetica').fontSize(10).text(label, rightX + 20, detailY, { width: 92 });
    doc.fillColor('#111827').font('Helvetica-Bold').text(value, rightX + 118, detailY, { width: cardWidth - 138, align: 'right' });
    detailY += 22;
  });

  return topY + cardHeight + 24;
};

const buildInvoiceRows = (items = []) => items.map((item, index) => {
  const quantity = Number(item.quantity || 0);
  const price = Number(item.price || 0);
  const originalPrice = Number(item.originalPrice || 0);
  const amount = quantity * price;
  const perUnitDiscount = originalPrice > price ? originalPrice - price : 0;
  const discountAmount = perUnitDiscount * quantity;
  const discountPercent = originalPrice > price && originalPrice > 0
    ? Math.round((perUnitDiscount / originalPrice) * 100)
    : 0;

  return {
    sno: index + 1,
    description: item.name || 'Item',
    quantity,
    rate: originalPrice > price ? originalPrice : price,
    discountAmount,
    discountPercent,
    amount,
  };
});

const drawItemsTable = (doc, rows, startY) => {
  const tableX = 34;
  const tableWidth = doc.page.width - 68;
  const rowHeight = 28;
  const columns = [
    { key: 'sno', label: '#', x: tableX + 14, width: 26, align: 'left' },
    { key: 'description', label: 'Item Description', x: tableX + 48, width: 210, align: 'left' },
    { key: 'quantity', label: 'Qty', x: tableX + 266, width: 34, align: 'right' },
    { key: 'rate', label: 'Rate', x: tableX + 314, width: 74, align: 'right' },
    { key: 'discountAmount', label: 'Discount', x: tableX + 394, width: 84, align: 'right' },
    { key: 'amount', label: 'Amount', x: tableX + 458, width: 72, align: 'right' },
  ];

  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text('Invoice Items', tableX, startY);

  const headerY = startY + 18;
  doc.roundedRect(tableX, headerY, tableWidth, 34, 12).fill('#F8E9EF');

  doc.fillColor('#9F1239').font('Helvetica-Bold').fontSize(10.5);
  columns.forEach((column) => {
    doc.text(column.label, column.x, headerY + 11, { width: column.width, align: column.align });
  });

  let y = headerY + 42;
  doc.font('Helvetica').fontSize(10).fillColor('#1F2937');

  rows.forEach((row, index) => {
    const fill = index % 2 === 0 ? '#FFFFFF' : '#FFFCFD';
    doc.roundedRect(tableX, y - 6, tableWidth, rowHeight, 10).fill(fill);

    columns.forEach((column) => {
      const rawValue = row[column.key];
      const text = column.key === 'rate' || column.key === 'amount'
        ? formatCurrency(rawValue)
        : column.key === 'discountAmount'
          ? (row.discountAmount > 0 ? `${row.discountPercent}% (${formatCurrency(row.discountAmount)})` : formatCurrency(0))
          : String(rawValue);
      doc.fillColor(column.key === 'discountAmount' && Number(rawValue) > 0 ? '#BE123C' : '#1F2937');
      doc.text(text, column.x, y + 2, { width: column.width, align: column.align });
    });

    y += rowHeight;
  });

  return y + 8;
};

const drawSummary = (doc, data, rows, startY, settings) => {
  const { width } = doc.page;
  const boxWidth = 214;
  const boxX = width - boxWidth - 34;
  const boxHeight = 132;
  const taxRate = settings?.gstPercentage || 0;
  const totalDiscount = rows.reduce((sum, row) => sum + Number(row.discountAmount || 0), 0);
  const grossSubtotal = Number(data.subtotal || 0) + totalDiscount;

  doc.roundedRect(boxX, startY, boxWidth, boxHeight, 18).fill('#FFFFFF');
  doc.roundedRect(boxX, startY, boxWidth, boxHeight, 18).strokeColor('#E7D9E1').lineWidth(1).stroke();

  const summaryRows = [
    ['Subtotal', formatCurrency(grossSubtotal)],
    ['Discount', totalDiscount > 0 ? `- ${formatCurrency(totalDiscount)}` : formatCurrency(0)],
    [`GST${taxRate ? ` (${taxRate}%)` : ''}`, formatCurrency(data.tax)],
  ];

  let y = startY + 20;
  summaryRows.forEach(([label, value]) => {
    doc.fillColor('#4B5563').font('Helvetica').fontSize(10.5).text(label, boxX + 16, y, { width: 80 });
    doc.fillColor(label === 'Discount' && totalDiscount > 0 ? '#BE123C' : '#111827').font('Helvetica-Bold').text(value, boxX + 108, y, { width: 88, align: 'right' });
    y += 24;
  });

  drawLine(doc, boxX + 14, y + 2, boxX + boxWidth - 14, y + 2, '#D9DEE6');

  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text('Total Due', boxX + 16, y + 16, { width: 80 });
  doc.fillColor('#E11D48').fontSize(13.5).text(formatCurrency(data.totalAmount), boxX + 90, y + 14, { width: 106, align: 'right' });
};

const drawFooter = (doc, settings) => {
  const footerY = doc.page.height - 70;
  drawLine(doc, 34, footerY, doc.page.width - 34, footerY, '#DADCE4');

  const footerParts = [
    'Thank you for choosing KIKI\'S RETURN GIFT STORE.',
    settings?.supportEmail ? `Support: ${settings.supportEmail}` : null,
    settings?.whatsappNumber ? `WhatsApp: ${settings.whatsappNumber}` : null,
  ].filter(Boolean);

  doc
    .fillColor('#6B7280')
    .font('Helvetica')
    .fontSize(9.5)
    .text(footerParts.join('   |   '), 46, footerY + 18, {
      width: doc.page.width - 92,
      align: 'center',
    });
};

const generateInvoicePDF = (doc, data, settings) => {
  drawSoftBackground(doc);
  drawHeader(doc, settings, data.invoiceNumber);

  let y = drawInfoCards(doc, data, settings, 164);
  const rows = buildInvoiceRows(data.items);
  y = drawItemsTable(doc, rows, y);
  drawSummary(doc, data, rows, y, settings);
  drawFooter(doc, settings);
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
