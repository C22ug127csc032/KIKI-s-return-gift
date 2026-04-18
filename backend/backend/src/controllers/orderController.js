import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AppSetting from '../models/AppSetting.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination, buildSortQuery } from '../utils/pagination.js';
import { generateOrderNumber, generateInvoiceNumber } from '../utils/generators.js';
import {
  calculateLinePricing,
  getProductGstRate,
  getProductMrp,
  getProductSellingPrice,
  getProductTaxRates,
  getTaxableAmountFromInclusive,
} from '../utils/pricing.js';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/validation.js';

const formatMessageAmount = (value) => Number(value || 0).toFixed(2);

const formatDiscountPercentage = (value) => Number(value || 0)
  .toFixed(2)
  .replace(/\.?0+$/, '');

const formatMultilineText = (value) => String(value || '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .join(', ');

const calculateOrderDiscountSummary = (order) => {
  const mrpTotal = order.items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const originalPrice = Number(item.originalPrice || item.price || 0);
    return sum + (originalPrice * quantity);
  }, 0);
  const grandTotal = Number(order.totalAmount || 0);
  const taxableSubtotal = Number(order.subtotal || Math.max(grandTotal - Number(order.tax || 0), 0));
  const gst = Number(order.tax || Math.max(grandTotal - taxableSubtotal, 0));
  const cgst = order.items.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0);
  const sgst = order.items.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0);
  const igst = order.items.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0);
  const discount = Math.max(mrpTotal - grandTotal, 0);
  const discountPercentage = mrpTotal > 0 ? (discount / mrpTotal) * 100 : 0;

  return {
    mrpTotal: mrpTotal || grandTotal,
    discount,
    discountPercentage: formatDiscountPercentage(discountPercentage),
    taxableSubtotal,
    gst,
    cgst,
    sgst,
    igst,
    grandTotal,
  };
};

const buildWhatsAppMessage = (order, settings) => {
  const totals = calculateOrderDiscountSummary(order);
  const itemsText = order.items
    .map((i, index) => {
      const quantity = Number(i.quantity || 0);
      const unitMrp = Number(i.originalPrice || i.price || 0);
      const lineMrp = unitMrp * quantity;
      const lineTotal = Number(i.totalAmount || (Number(i.price || 0) * Number(i.quantity || 0)));
      const lines = [
        `${index + 1}. ${i.name}`,
        `Qty: ${quantity}`,
        `Unit MRP: Rs.${formatMessageAmount(unitMrp)}`,
        `Line MRP: Rs.${formatMessageAmount(lineMrp)}`,
        `Discount: Rs.${formatMessageAmount(i.discountAmount || 0)}`,
        `Taxable Amount: Rs.${formatMessageAmount(i.taxableAmount || 0)}`,
        `CGST: Rs.${formatMessageAmount(i.cgstAmount || 0)}`,
        `SGST: Rs.${formatMessageAmount(i.sgstAmount || 0)}`,
        `IGST: Rs.${formatMessageAmount(i.igstAmount || 0)}`,
        `Line Total: Rs.${formatMessageAmount(lineTotal)}`,
      ];

      if (i.hasStockIssue && i.stockIssueMessage) {
        lines.push(`Stock Note: ${i.stockIssueMessage}`);
      }

      return lines.join('\n');
    })
    .join('\n\n');

  return `*New Order - ${settings?.storeName || "KIKI'S RETURN GIFT STORE"}*\n\n` +
    `Order No: ${order.orderNumber}\n` +
    (order.invoiceNumber ? `Invoice No: ${order.invoiceNumber}\n` : '') +
    `Name: ${order.customerName}\n` +
    `Phone: ${order.customerPhone}\n` +
    `Address: ${formatMultilineText(order.customerAddress)}\n\n` +
    `*Items:*\n${itemsText}\n\n` +
    `*Summary:*\n` +
    `MRP Total: Rs.${formatMessageAmount(totals.mrpTotal)}\n` +
    `Discount (${totals.discountPercentage}%): - Rs.${formatMessageAmount(totals.discount)}\n` +
    `Taxable Amount: Rs.${formatMessageAmount(totals.taxableSubtotal)}\n` +
    `CGST: Rs.${formatMessageAmount(totals.cgst)}\n` +
    `SGST: Rs.${formatMessageAmount(totals.sgst)}\n` +
    `IGST: Rs.${formatMessageAmount(totals.igst)}\n` +
    `GST: Rs.${formatMessageAmount(totals.gst)}\n` +
    `*Grand Total: Rs.${formatMessageAmount(totals.grandTotal)}*\n\n` +
    (order.customerNotes ? `Notes: ${formatMultilineText(order.customerNotes)}\n\n` : '') +
    `Please confirm this order. Thank you!`;
};

const buildPaymentInfo = (settings) => ({
  whatsappNumber: settings?.whatsappNumber || process.env.STORE_WHATSAPP_NUMBER || '',
  upiId: settings?.upiId || '',
  upiQrImage: settings?.upiQrImage || '',
  bankAccountName: settings?.bankAccountName || '',
  bankAccountNumber: settings?.bankAccountNumber || '',
  bankIFSC: settings?.bankIFSC || '',
  bankBranch: settings?.bankBranch || '',
  gstPercentage: settings?.gstPercentage ?? 0,
  gstNumber: settings?.gstNumber || '',
  paymentInstructions: settings?.paymentInstructions || '',
});

export const createOrder = asyncHandler(async (req, res) => {
  const { customerName, customerAddress, items, customerNotes } = req.body;
  const customerEmail = normalizeEmail(req.body.customerEmail);
  const customerPhone = normalizePhone(req.body.customerPhone);
  if (!isValidPhone(customerPhone)) throw new ApiError(400, 'Phone number must be exactly 10 digits');
  if (customerEmail && !isValidEmail(customerEmail)) throw new ApiError(400, 'Enter a valid email address');
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Please add at least one item to place an order');

  const orderItems = [];
  let subtotal = 0;
  let tax = 0;
  let totalAmount = 0;
  let hasStockIssue = false;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) throw new ApiError(400, `Product not found: ${item.product}`);
    const requestedQuantity = Math.max(Number(item.quantity) || 0, 1);
    const availableStockAtOrder = Math.max(Number(product.stock || 0), 0);
    const fulfilledQuantity = Math.min(availableStockAtOrder, requestedQuantity);
    const backorderQuantity = Math.max(requestedQuantity - fulfilledQuantity, 0);
    const hasItemStockIssue = backorderQuantity > 0;
    const sellingPrice = getProductSellingPrice(product);
    const taxRates = getProductTaxRates(product);
    const basePrice = Number(product.basePrice ?? getTaxableAmountFromInclusive(sellingPrice, getProductGstRate(product)));
    const pricing = calculateLinePricing({
      basePrice,
      discountPercentage: product.discountPercentage || 0,
      cgstRate: taxRates.cgstRate,
      sgstRate: taxRates.sgstRate,
      igstRate: taxRates.igstRate,
      quantity: requestedQuantity,
    });
    hasStockIssue ||= hasItemStockIssue;
    orderItems.push({
      product: product._id,
      name: product.name,
      basePrice: pricing.basePrice,
      discountPercentage: pricing.discountPercentage,
      discountAmount: pricing.discountAmount,
      price: sellingPrice,
      originalPrice: getProductMrp(product),
      gstRate: pricing.gstRate,
      cgstRate: pricing.cgstRate,
      sgstRate: pricing.sgstRate,
      igstRate: pricing.igstRate,
      taxableAmount: pricing.taxableAmount,
      gstAmount: pricing.gstAmount,
      cgstAmount: pricing.cgstAmount,
      sgstAmount: pricing.sgstAmount,
      igstAmount: pricing.igstAmount,
      totalAmount: pricing.totalAmount,
      quantity: requestedQuantity,
      image: product.images?.[0]?.url || '',
      availableStockAtOrder,
      fulfilledQuantity,
      backorderQuantity,
      hasStockIssue: hasItemStockIssue,
      stockIssueMessage: hasItemStockIssue
        ? `${backorderQuantity} item(s) need manual confirmation because only ${availableStockAtOrder} were in stock when this order was placed.`
        : '',
    });
    subtotal += pricing.taxableAmount;
    tax += pricing.gstAmount;
    totalAmount += pricing.totalAmount;
  }

  const settings = await AppSetting.findOne();

  const order = await Order.create({
    orderNumber: await generateOrderNumber(Order),
    invoiceNumber: await generateInvoiceNumber(Order, 'K-ON'),
    user: req.user?._id || null,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items: orderItems,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    source: 'whatsapp',
    customerNotes,
    hasStockIssue,
  });

  for (const item of orderItems) {
    if (!item.fulfilledQuantity) continue;
    const product = await Product.findById(item.product);
    if (!product) continue;
    const previousStock = product.stock;
    product.stock = Math.max(Number(product.stock || 0) - Number(item.fulfilledQuantity || 0), 0);
    await product.save();
    await InventoryMovement.create({
      product: product._id,
      type: 'OUT',
      quantity: item.fulfilledQuantity,
      previousStock,
      newStock: product.stock,
      reason: item.hasStockIssue ? 'Order placed with stock issue' : 'Order placed',
      referenceModel: 'Order',
      referenceId: order._id,
      createdBy: req.user?._id,
    });
  }

  const message = buildWhatsAppMessage(order, settings);
  order.whatsappMessage = message;
  order.whatsappRedirectedAt = new Date();
  await order.save();

  const whatsappNumber = settings?.whatsappNumber || process.env.STORE_WHATSAPP_NUMBER;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  sendResponse(res, 201, 'Order created successfully', {
    order,
    whatsappUrl,
    paymentInfo: buildPaymentInfo(settings),
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .populate('items.product', 'name images stock lowStockThreshold')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);
  sendPaginatedResponse(res, 'Orders fetched', orders, page, limit, total);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product', 'name images');
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.user.role !== 'admin' && order.user?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  sendResponse(res, 200, 'Order fetched', order);
});

export const getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) throw new ApiError(404, 'Order not found');
  sendResponse(res, 200, 'Order fetched', order);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.search) {
    filter.$or = [
      { orderNumber: new RegExp(req.query.search, 'i') },
      { customerName: new RegExp(req.query.search, 'i') },
      { customerPhone: new RegExp(req.query.search, 'i') },
    ];
  }
  const sort = buildSortQuery(req.query.sortBy, {
    'total-asc': { totalAmount: 1 },
    'total-desc': { totalAmount: -1 },
    'customer-asc': { customerName: 1 },
    'customer-desc': { customerName: -1 },
  });
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('items.product', 'name stock lowStockThreshold')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  sendPaginatedResponse(res, 'Orders fetched', orders, page, limit, total);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus, adminNotes } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      const quantityToRestore = Number(item.fulfilledQuantity ?? item.quantity ?? 0);
      if (product && quantityToRestore > 0) {
        const previousStock = product.stock;
        product.stock += quantityToRestore;
        await product.save();
        await InventoryMovement.create({
          product: product._id,
          type: 'IN',
          quantity: quantityToRestore,
          previousStock,
          newStock: product.stock,
          reason: 'Order cancelled - stock restored',
          referenceModel: 'Order',
          referenceId: order._id,
          createdBy: req.user._id,
        });
      }
    }
  }

  if (orderStatus) {
    order.statusHistory.push({ status: orderStatus, note: adminNotes, updatedBy: req.user._id });
    order.orderStatus = orderStatus;
  }
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (adminNotes !== undefined) order.adminNotes = adminNotes;
  await order.save();
  sendResponse(res, 200, 'Order updated', order);
});

export const uploadPaymentScreenshot = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  order.paymentScreenshot = req.file.path;
  order.paymentScreenshotPublicId = req.file.filename;
  await order.save();
  sendResponse(res, 200, 'Payment screenshot uploaded', order);
});

export const uploadPaymentScreenshotByOrderNumber = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user && (!req.user || order.user.toString() !== req.user._id.toString())) {
    throw new ApiError(403, 'Not authorized to upload payment proof for this order');
  }
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  order.paymentScreenshot = req.file.path;
  order.paymentScreenshotPublicId = req.file.filename;
  await order.save();

  sendResponse(res, 200, 'Payment screenshot uploaded', order);
});
