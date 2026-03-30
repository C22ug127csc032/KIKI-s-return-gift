import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getMrpPrice, getSellingPrice } from '../utils/pricing.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

const getCartStorageKey = (user) => {
  if (!user?._id) return 'kiki_cart_guest';
  return `kiki_cart_${user._id}`;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(getCartStorageKey(null))) || []; } catch { return []; }
  });
  const cartStorageKey = getCartStorageKey(user);

  useEffect(() => {
    try {
      localStorage.removeItem('kiki_cart');
      setItems(JSON.parse(localStorage.getItem(cartStorageKey)) || []);
    } catch {
      setItems([]);
    }
  }, [cartStorageKey]);

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }, [items, cartStorageKey]);

  const normalizeCartItem = (product, quantity) => {
    const sellingPrice = product.discountedPrice ?? getSellingPrice(product);
    return {
      ...product,
      quantity,
      originalPrice: getMrpPrice(product),
      price: sellingPrice,
    };
  };

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      const normalizedItem = normalizeCartItem(product, quantity);
      if (exists) {
        const newQty = exists.quantity + quantity;
        if (newQty > product.stock) {
          toast.error(`Only ${product.stock} items available`);
          return prev;
        }
        toast.success('Cart updated');
        return prev.map((i) => i._id === product._id ? { ...i, ...normalizedItem, quantity: newQty } : i);
      }
      if (quantity > product.stock) {
        toast.error(`Only ${product.stock} items available`);
        return prev;
      }
      toast.success(`${product.name} added to cart!`);
      return [...prev, normalizedItem];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) { removeItem(id); return; }
    setItems((prev) =>
      prev.map((i) => {
        if (i._id !== id) return i;
        if (quantity > i.stock) { toast.error(`Only ${i.stock} items available`); return i; }
        return { ...i, quantity };
      })
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartCount = items.length;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, totalItems, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
