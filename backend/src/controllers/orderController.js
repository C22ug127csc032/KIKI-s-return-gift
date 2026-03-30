import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AppSetting from '../models/AppSetting.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse, sendPaginatedResponse } from '../utils/apiResponse.js';
import { getPagination, buildSortQuery } from '../utils/pagination.js';
import { generateOrderNumber, generateInvoiceNumber } from '../utils/generators.js';
import { getProductMrp, getProductSellingPrice } from '../utils/pricing.js';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/validation.js';

const buildWhatsAppMessage = (order, settings) => {
  const itemsText = order.items
    .map((i) => {
      const baseLine = `- ${i.name} x${i.quantity} @ Rs.${i.price}`;
      return i.originalPrice && Number(i.originalPrice) > Number(i.price)
        ? `${baseLine} (was Rs.${i.originalPrice})`
        : baseLine;
    })
    .join('\n');

  return `*New Order - ${settings?.storeName || "KIKI'S RETURN GIFT STORE"}*\n\n` +
    `Order No: ${order.orderNumber}\n` +
    `Name: ${order.customerName}\n` +
    `Phone: ${order.customerPhone}\n` +
    `Address: ${order.customerAddress}\n\n` +
    `*Items:*\n${itemsText}\n\n` +
    `Subtotal: Rs.${order.subtotal}\n` +
    (order.tax > 0 ? `Tax: Rs.${order.tax}\n` : '') +
    `*Total: Rs.${order.totalAmount}*\n\n` +
    (order.customerNotes ? `Notes: ${order.customerNotes}\n\n` : '') +
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

  const orderItems = [];
  let subtotal = 0;
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) throw new ApiError(400, `Product not found: ${item.product}`);
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${product.stock}`);
    }
    const sellingPrice = getProductSellingPrice(product);
    orderItems.push({
      product: product._id,
      name: product.name,
      price: sellingPrice,
      originalPrice: getProductMrp(product),
      quantity: item.quantity,
      image: product.images?.[0]?.url || '',
    });
    subtotal += sellingPrice * item.quantity;
  }

  const settings = await AppSetting.findOne();
  const taxRate = settings?.gstPercentage || 0;
  const tax = Math.round(subtotal * taxRate / 100 * 100) / 100;
  const totalAmount = subtotal + tax;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    invoiceNumber: generateInvoiceNumber(),
    user: req.user?._id || null,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items: orderItems,
    subtotal,
    tax,
    totalAmount,
    source: 'whatsapp',
    customerNotes,
  });

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    const previousStock = product.stock;
    product.stock -= item.quantity;
    await product.save();
    await InventoryMovement.create({
      product: product._id,
      type: 'OUT',
      quantity: item.quantity,
      previousStock,
      newStock: product.stock,
      reason: 'Order placed',
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
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
  const sort = buildSortQuery(req.query.sortBy);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit),
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
      if (product) {
        const previousStock = product.stock;
        product.stock += item.quantity;
        await product.save();
        await InventoryMovement.create({
          product: product._id,
          type: 'IN',
          quantity: item.quantity,
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
  if (adminNotes) order.adminNotes = adminNotes;
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
