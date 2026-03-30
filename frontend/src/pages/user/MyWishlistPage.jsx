import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext.jsx';
import ProductCard from '../../components/shop/ProductCard.jsx';
import { EmptyState, PageLoader } from '../../components/ui/index.jsx';

export default function MyWishlistPage() {
  const { items, loading } = useWishlist();

  useEffect(() => {
    document.title = "My Wishlist - KIKI'S Store";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="page-container">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-6">
          <Link to="/" className="hover:text-rose-600">Home</Link><span>/</span>
          <span className="text-gray-600">Wishlist</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">
          My Wishlist {items.length > 0 ? <span className="text-rose-600">({items.length})</span> : null}
        </h1>

        {loading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiHeart size={48} />}
            title="Your wishlist is empty"
            message="Save your favorite gifts here and come back anytime."
            action={<Link to="/shop" className="btn-primary flex items-center gap-2"><FiShoppingBag size={16} /> Browse Gifts</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((product, index) => <ProductCard key={product._id} product={product} index={index} />)}
          </div>
        )}
      </div>
    </div>
  );
}
