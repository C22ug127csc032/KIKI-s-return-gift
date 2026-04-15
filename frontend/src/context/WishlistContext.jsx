import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/api.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?._id) {
      setItems([]);
      return;
    }

    let active = true;
    setLoading(true);
    api.get('/auth/wishlist')
      .then((res) => {
        if (active) setItems(res.data.data || []);
      })
      .catch(() => {
        if (active) toast.error('Failed to load wishlist');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?._id]);

  const wishlistIds = useMemo(() => new Set(items.map((item) => item._id)), [items]);

  const addToWishlist = async (product) => {
    if (!user?._id) return false;
    try {
      const res = await api.post(`/auth/wishlist/${product._id}`);
      setItems(res.data.data || []);
      toast.success(`${product.name} added to wishlist`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (productId, productName = 'Product') => {
    if (!user?._id) return false;
    try {
      const res = await api.delete(`/auth/wishlist/${productId}`);
      setItems(res.data.data || []);
      toast.success(`${productName} removed from wishlist`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove from wishlist');
      return false;
    }
  };

  const toggleWishlist = async (product) => {
    if (!user?._id) return false;
    if (wishlistIds.has(product._id)) {
      return removeFromWishlist(product._id, product.name);
    }
    return addToWishlist(product);
  };

  return (
    <WishlistContext.Provider value={{ items, loading, wishlistIds, addToWishlist, removeFromWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be inside WishlistProvider');
  return ctx;
};
