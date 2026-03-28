import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import OfflineSale from '../models/OfflineSale.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders, pendingOrders, completedOrders, paidOrders,
    totalProducts, lowStockProducts, totalUsers,
    monthlyOrders, recentOrders, topProducts,
    totalRevenue, monthlyRevenue, offlineSalesCount
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'Pending' }),
    Order.countDocuments({ orderStatus: 'Completed' }),
    Order.countDocuments({ paymentStatus: 'Paid' }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.find().sort({ createdAt: -1 }).limit(5),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    OfflineSale.countDocuments(),
  ]);

  // Revenue by day (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  const revenueByDay = await Promise.all(
    last7Days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const result = await Order.aggregate([
        { $match: { createdAt: { $gte: day, $lt: nextDay } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]);
      return { date: day.toISOString().split('T')[0], revenue: result[0]?.total || 0, orders: result[0]?.count || 0 };
    })
  );

  sendResponse(res, 200, 'Dashboard stats fetched', {
    overview: {
      totalOrders, pendingOrders, completedOrders, paidOrders,
      totalProducts, lowStockProducts, totalUsers,
      monthlyOrders, offlineSalesCount,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
    },
    recentOrders,
    topProducts,
    revenueByDay,
  });
});
