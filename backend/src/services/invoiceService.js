import PDFDocument from 'pdfkit';
import Order from '../models/Order.js';
import OfflineSale from '../models/OfflineSale.js';
import AppSetting from '../models/AppSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';

const generateInvoicePDF = (doc, data, settings) => {
  const { invoice, items, customerName, customerPhone, customerAddress, subtotal, tax, totalAmount, invoiceNumber, date } = data;
  const storeName = settings?.storeName || "KIKI'S RETURN GIFT STORE";
  const storeAddress = settings?.storeAddress || '';
  const gstNumber = settings?.gstNumber || '';

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill('#FF6B35');
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text(storeName, 40, 20);
  if (storeAddress) doc.fontSize(9).font('Helvetica').text(storeAddress, 40, 48);
  if (gstNumber) doc.text(`GST: ${gstNumber}`, 40, 60);

  // Invoice details
  doc.fillColor('#333').fontSize(18).font('Helvetica-Bold').text('INVOICE', 40, 100);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Invoice No: ${invoiceNumber}`, 40, 125);
  doc.text(`Date: ${new Date(date).toLocaleDateString('en-IN')}`, 40, 140);

  // Customer info
  doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 40, 170);
  doc.font('Helvetica').fontSize(10);
  doc.text(customerName, 40, 188);
  if (customerPhone) doc.text(`Phone: ${customerPhone}`, 40, 203);
  if (customerAddress) doc.text(`Address: ${customerAddress}`, 40, 218, { width: 250 });

  // Table header
  const tableTop = 280;
  doc.rect(40, tableTop, doc.page.width - 80, 25).fill('#FF6B35');
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  doc.text('Item', 50, tableTop + 7);
  doc.text('Qty', 320, tableTop + 7);
  doc.text('Price', 370, tableTop + 7);
  doc.text('Total', 440, tableTop + 7);

  // Table rows
  let y = tableTop + 35;
  doc.fillColor('#333').font('Helvetica').fontSize(10);
  items.forEach((item, i) => {
    if (i % 2 === 0) doc.rect(40, y - 5, doc.page.width - 80, 22).fill('#FFF5F0');
    doc.fillColor('#333');
    doc.text(item.name, 50, y, { width: 260 });
    doc.text(String(item.quantity), 320, y);
    doc.text(`₹${item.price}`, 370, y);
    doc.text(`₹${item.price * item.quantity}`, 440, y);
    y += 25;
  });

  // Totals
  y += 10;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke('#ddd');
  y += 15;
  doc.text(`Subtotal:`, 370, y);
  doc.text(`₹${subtotal}`, 440, y);
  if (tax > 0) {
    y += 20;
    const taxRate = settings?.gstPercentage || 0;
    doc.text(`GST (${taxRate}%):`, 370, y);
    doc.text(`₹${tax}`, 440, y);
  }
  y += 20;
  doc.rect(350, y - 5, doc.page.width - 390, 28).fill('#FF6B35');
  doc.fillColor('white').font('Helvetica-Bold').fontSize(13);
  doc.text(`Total: ₹${totalAmount}`, 360, y + 2);

  // Footer
  doc.fillColor('#888').fontSize(9).font('Helvetica');
  doc.text('Thank you for shopping with us! 🎁', 40, doc.page.height - 60, { align: 'center', width: doc.page.width - 80 });
  if (settings?.supportEmail) doc.text(`Support: ${settings.supportEmail}`, 40, doc.page.height - 45, { align: 'center', width: doc.page.width - 80 });
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
