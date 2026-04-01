import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { ProtectedRoute, AdminRoute, GuestRoute } from './routes/ProtectedRoute.jsx';

// Public pages
import HomePage from './pages/public/HomePage.jsx';
import ShopPage from './pages/public/ShopPage.jsx';
import ProductDetailPage from './pages/public/ProductDetailPage.jsx';
import CartPage from './pages/public/CartPage.jsx';
import CheckoutPage from './pages/public/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/public/OrderConfirmationPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

// Auth pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// User pages
import ProfilePage from './pages/user/ProfilePage.jsx';
import MyOrdersPage from './pages/user/MyOrdersPage.jsx';
import MyWishlistPage from './pages/user/MyWishlistPage.jsx';

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import { AdminCategories, AdminInventory, AdminOfflineSales, AdminSettings } from './pages/admin/AdminPages.jsx';
import { AdminProductBom, AdminProduction, AdminRawMaterials, AdminSuppliers } from './pages/admin/AdminSupplyChain.jsx';

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            {/* Public routes with layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              {/* Auth */}
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              {/* User */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><MyWishlistPage /></ProtectedRoute>} />
            </Route>

            {/* Standalone password recovery */}
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

            {/* Admin login - standalone */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/forgot-password" element={<ForgotPasswordPage role="admin" />} />
            <Route path="/admin/reset-password/:token" element={<ResetPasswordPage role="admin" />} />

            {/* Admin routes with sidebar layout */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="suppliers" element={<AdminSuppliers />} />
              <Route path="raw-materials" element={<AdminRawMaterials />} />
              <Route path="product-bom" element={<AdminProductBom />} />
              <Route path="production" element={<AdminProduction />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="offline-sales" element={<AdminOfflineSales />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
