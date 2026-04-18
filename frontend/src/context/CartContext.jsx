import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { calculatePricing, getGstAmount, getGstRate, getMrpPrice, getSellingPrice, getTaxRates, getTaxableAmount } from '../utils/pricing.js';
import { getDisplayProductName } from '../utils/productName.js';
import { normalizeAssetUrls } from '../utils/assetUrl.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

const getCartStorageKey = (user) => {
  if (!user?._id) return 'kiki_cart_guest';
  return `kiki_cart_${user._id}`;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try { return normalizeAssetUrls(JSON.parse(localStorage.getItem(getCartStorageKey(null))) || []); } catch { return []; }
  });
  const cartStorageKey = getCartStorageKey(user);

  useEffect(() => {
    try {
      localStorage.removeItem('kiki_cart');
      setItems(normalizeAssetUrls(JSON.parse(localStorage.getItem(cartStorageKey)) || []));
    } catch {
      setItems([]);
    }
  }, [cartStorageKey]);

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }, [items, cartStorageKey]);

  const normalizeCartItem = (product, quantity) => {
    const normalizedProduct = normalizeAssetUrls(product);
    const displayName = getDisplayProductName(product);
    const sellingPrice = product.discountedPrice ?? getSellingPrice(product);
    const taxRates = getTaxRates(product);
    const pricing = calculatePricing({
      basePrice: product.basePrice ?? getTaxableAmount(sellingPrice, taxRates.gstRate),
      discountPercentage: product.discountPercentage || 0,
      cgstRate: taxRates.cgstRate,
      sgstRate: taxRates.sgstRate,
      igstRate: taxRates.igstRate,
      quantity,
    });
    return {
      ...normalizedProduct,
      name: displayName,
      quantity,
      basePrice: pricing.basePrice,
      discountPercentage: pricing.discountPercentage,
      discountAmount: pricing.discountAmount,
      originalPrice: getMrpPrice(product),
      price: sellingPrice,
      gstRate: pricing.gstRate || getGstRate(product),
      cgstRate: pricing.cgstRate,
      sgstRate: pricing.sgstRate,
      igstRate: pricing.igstRate,
      taxableAmount: pricing.taxableAmount,
      cgstAmount: pricing.cgstAmount,
      sgstAmount: pricing.sgstAmount,
      igstAmount: pricing.igstAmount,
      gstAmount: pricing.gstAmount,
      totalAmount: pricing.totalAmount,
    };
  };

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists) {
        const newQty = exists.quantity + quantity;
        if (newQty > product.stock) {
          toast.error(`Only ${product.stock} items available`);
          return prev;
        }
        const normalizedItem = normalizeCartItem(product, newQty);
        toast.success('Cart updated');
        return prev.map((i) => i._id === product._id ? { ...i, ...normalizedItem, quantity: newQty } : i);
      }
      if (quantity > product.stock) {
        toast.error(`Only ${product.stock} items available`);
        return prev;
      }
      const normalizedItem = normalizeCartItem(product, quantity);
      toast.success(`${getDisplayProductName(product)} added to cart!`);
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
        return normalizeCartItem(i, quantity);
      })
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + Number(i.totalAmount || (i.price * i.quantity)), 0);
  const taxableSubtotal = items.reduce((sum, i) => sum + Number(i.taxableAmount || (getTaxableAmount(i.price, i.gstRate) * i.quantity)), 0);
  const gstTotal = items.reduce((sum, i) => sum + Number(i.gstAmount || (getGstAmount(i.price, i.gstRate) * i.quantity)), 0);
  const cgstTotal = items.reduce((sum, i) => sum + Number(i.cgstAmount || 0), 0);
  const sgstTotal = items.reduce((sum, i) => sum + Number(i.sgstAmount || 0), 0);
  const igstTotal = items.reduce((sum, i) => sum + Number(i.igstAmount || 0), 0);
  const actualTotal = items.reduce((sum, i) => sum + (Number(i.originalPrice || i.price || 0) * i.quantity), 0);
  const discountTotal = Math.max(actualTotal - subtotal, 0);
  const discountPercentage = actualTotal > 0 ? Math.round((discountTotal / actualTotal) * 10000) / 100 : 0;
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartCount = items.length;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      taxableSubtotal,
      gstTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      grandTotal: subtotal,
      actualTotal,
      discountTotal,
      discountPercentage,
      totalItems,
      cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
