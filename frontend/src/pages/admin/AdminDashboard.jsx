import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiShoppingBag, FiPackage, FiUsers, FiAlertTriangle, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import api from '../../api/api.js';
import { Badge, PageLoader } from '../../components/ui/index.jsx';

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="admin-card flex items-start gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard – Admin';
    api.get('/dashboard/stats').then((r) => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!stats) return <div className="text-center text-gray-500 py-20">Failed to load dashboard</div>;

  const { overview, recentOrders, topProducts, revenueByDay } = stats;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening at your store.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiPackage} label="Total Orders" value={overview.totalOrders} sub={`${overview.monthlyOrders} this month`} color="bg-brand-500" delay={0} />
        <StatCard icon={FiDollarSign} label="Total Revenue" value={`₹${overview.totalRevenue?.toLocaleString('en-IN')}`} sub={`₹${overview.monthlyRevenue?.toLocaleString('en-IN')} this month`} color="bg-green-500" delay={0.05} />
        <StatCard icon={FiShoppingBag} label="Products" value={overview.totalProducts} sub={`${overview.lowStockProducts} low stock`} color="bg-brand-400" delay={0.1} />
        <StatCard icon={FiUsers} label="Customers" value={overview.totalUsers} sub={`${overview.offlineSalesCount} offline sales`} color="bg-blue-500" delay={0.15} />
      </div>

      {/* Order Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          ['Pending', overview.pendingOrders, 'bg-yellow-50 border-yellow-200 text-yellow-700'],
          ['Completed', overview.completedOrders, 'bg-green-50 border-green-200 text-green-700'],
          ['Paid', overview.paidOrders, 'bg-blue-50 border-blue-200 text-blue-700'],
          ['Low Stock', overview.lowStockProducts, 'bg-red-50 border-red-200 text-red-700'],
        ].map(([label, val, cls]) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${cls}`}>
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 admin-card">
          <h2 className="font-semibold text-gray-800 mb-5">Revenue – Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} labelFormatter={(l) => `Date: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="admin-card">
          <h2 className="font-semibold text-gray-800 mb-5">Top Selling Products</h2>
          <div className="space-y-3">
            {topProducts?.length === 0 && <p className="text-sm text-gray-400">No sales yet.</p>}
            {topProducts?.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-brand-100 text-brand-600 text-xs font-bold rounded-full flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.totalSold} sold · ₹{p.revenue?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-brand-500 hover:underline">View All</Link>
        </div>
        {recentOrders?.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders?.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <Link to={`/admin/orders`} className="text-brand-500 font-medium hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="py-3 text-gray-700">{o.customerName}</td>
                    <td className="py-3 font-semibold text-gray-800">₹{o.totalAmount}</td>
                    <td className="py-3"><Badge status={o.orderStatus} /></td>
                    <td className="py-3"><Badge status={o.paymentStatus} type="payment" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {overview.lowStockProducts > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <FiAlertTriangle size={20} className="text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">{overview.lowStockProducts} products have low stock!</p>
            <p className="text-xs text-red-600">Review inventory to avoid stockouts.</p>
          </div>
          <Link to="/admin/inventory" className="text-sm text-red-600 font-semibold hover:underline shrink-0">View →</Link>
        </motion.div>
      )}
    </div>
  );
}
