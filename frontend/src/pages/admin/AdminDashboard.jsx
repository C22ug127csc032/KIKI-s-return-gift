import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiShoppingBag, FiPackage, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';
import api from '../../api/api.js';
import { Badge, PageLoader } from '../../components/ui/index.jsx';

const formatCurrency = (value) => `Rs.${Number(value || 0).toLocaleString('en-IN')}`;

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="admin-card flex items-start gap-3 p-4 sm:gap-4 sm:p-6"
  >
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${color} sm:h-12 sm:w-12`}>
      <Icon size={20} className="text-white sm:text-[22px]" />
    </div>
    <div className="min-w-0">
      <p className="break-words text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub ? <p className="mt-0.5 text-xs text-gray-400">{sub}</p> : null}
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard - Admin';
    api.get('/dashboard/stats').then((r) => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!stats) return <div className="py-20 text-center text-gray-500">Failed to load dashboard</div>;

  const { overview, recentOrders, topProducts, revenueByDay } = stats;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 max-w-md text-sm text-gray-500">Welcome back! Here's what's happening at your store.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FiPackage}
          label="Total Orders"
          value={overview.totalOrders}
          sub={`${overview.monthlyOrders} this month`}
          color="bg-brand-500"
          delay={0}
        />
        <StatCard
          icon={BiRupee}
          label="Total Revenue"
          value={formatCurrency(overview.totalRevenue)}
          sub={`${formatCurrency(overview.monthlyRevenue)} this month`}
          color="bg-green-500"
          delay={0.05}
        />
        <StatCard
          icon={FiShoppingBag}
          label="Products"
          value={overview.totalProducts}
          sub={`${overview.lowStockProducts} low stock`}
          color="bg-brand-400"
          delay={0.1}
        />
        <StatCard
          icon={FiUsers}
          label="Customers"
          value={overview.totalUsers}
          sub={`${overview.offlineSalesCount} offline sales`}
          color="bg-blue-500"
          delay={0.15}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
        {[
          ['Pending', overview.pendingOrders, 'bg-yellow-50 border-yellow-200 text-yellow-700'],
          ['Completed', overview.completedOrders, 'bg-green-50 border-green-200 text-green-700'],
          ['Paid', overview.paidOrders, 'bg-blue-50 border-blue-200 text-blue-700'],
          ['Low Stock', overview.lowStockProducts, 'bg-red-50 border-red-200 text-red-700'],
        ].map(([label, val, cls]) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${cls}`}>
            <p className="text-xl font-bold sm:text-2xl">{val}</p>
            <p className="mt-0.5 text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 lg:grid-cols-3">
        <div className="admin-card p-4 sm:col-span-2 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 sm:mb-5 sm:text-lg">Revenue - Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Rs.${v}`} width={52} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} labelFormatter={(l) => `Date: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 sm:mb-5 sm:text-lg">Top Selling Products</h2>
          <div className="space-y-3">
            {topProducts?.length === 0 ? <p className="text-sm text-gray-400">No sales yet.</p> : null}
            {topProducts?.map((product, index) => (
              <div key={product._id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-400">
                    {product.totalSold} sold | {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-800 sm:text-lg">Recent Orders</h2>
          <Link to="/admin/orders" className="shrink-0 text-sm text-brand-500 hover:underline">View All</Link>
        </div>
        {recentOrders?.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[620px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders?.map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-gray-50">
                    <td className="py-3">
                      <Link to="/admin/orders" className="font-medium text-brand-500 hover:underline">{order.orderNumber}</Link>
                    </td>
                    <td className="py-3 text-gray-700">{order.customerName}</td>
                    <td className="py-3 font-semibold text-gray-800">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3"><Badge status={order.orderStatus} /></td>
                    <td className="py-3"><Badge status={order.paymentStatus} type="payment" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {overview.lowStockProducts > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
        >
          <FiAlertTriangle size={20} className="shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{overview.lowStockProducts} products have low stock!</p>
            <p className="text-xs text-red-600">Review inventory to avoid stockouts.</p>
          </div>
          <Link to="/admin/inventory" className="shrink-0 text-sm font-semibold text-red-600 hover:underline">View →</Link>
        </motion.div>
      ) : null}
    </div>
  );
}
