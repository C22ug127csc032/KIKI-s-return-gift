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
    try { return normalizeAssetUrls(JSON.parse(localStorage.getItem(getCartStorageKey(user))) || []); } catch { return []; }
  });
  const cartStorageKey = getCartStorageKey(user);

  useEffect(() => {
    try {
      localStorage.removeItem('kiki_cart');
      const storedUserCart = normalizeAssetUrls(JSON.parse(localStorage.getItem(cartStorageKey)) || []);
      const guestCart = normalizeAssetUrls(JSON.parse(localStorage.getItem(getCartStorageKey(null))) || []);

      if (user?._id && storedUserCart.length === 0 && guestCart.length > 0) {
        localStorage.setItem(cartStorageKey, JSON.stringify(guestCart));
        localStorage.removeItem(getCartStorageKey(null));
        setItems(guestCart);
        return;
      }

      setItems(storedUserCart);
    } catch {
      setItems([]);
    }
  }, [cartStorageKey, user?._id]);

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }, [items, cartStorageKey]);

  const normalizeCartItem = (product, quantity) => {
    const normalizedProduct = normalizeAssetUrls(product);
    const displayName = getDisplayProductName(product);
    const availableStock = Math.max(Number(product.stock || 0), 0);
    const discountedSellingPrice = product.discountedPrice ?? getSellingPrice(product);
    const sellingPrice = Number(product.sellingPrice ?? product.basePrice ?? discountedSellingPrice);
    const taxRates = getTaxRates(product);
    const pricing = calculatePricing({
      basePrice: sellingPrice,
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
      sellingPrice,
      discountedSellingPrice: pricing.taxableUnitPrice,
      discountPercentage: pricing.discountPercentage,
      discountAmount: pricing.discountAmount,
      originalPrice: getMrpPrice(product),
      price: pricing.taxableUnitPrice,
      finalPrice: pricing.totalUnitPrice,
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
      roundedTotalAmount: pricing.roundedTotalAmount,
      roundOffAmount: pricing.roundOffAmount,
      availableStock,
      hasStockIssue: quantity > availableStock,
      backorderQuantity: Math.max(quantity - availableStock, 0),
    };
  };

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists) {
        const newQty = exists.quantity + quantity;
        const normalizedItem = normalizeCartItem(product, newQty);
        toast.success(normalizedItem.hasStockIssue ? 'Cart updated. This item will need stock confirmation.' : 'Cart updated');
        return prev.map((i) => i._id === product._id ? { ...i, ...normalizedItem, quantity: newQty } : i);
      }
      const normalizedItem = normalizeCartItem(product, quantity);
      toast.success(
        normalizedItem.hasStockIssue
          ? `${getDisplayProductName(product)} added. We will confirm stock after order.`
          : `${getDisplayProductName(product)} added to cart!`
      );
      return [...prev, normalizedItem];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) { removeItem(id); return; }
    const currentItem = items.find((item) => item._id === id);
    if (!currentItem) return;

    const nextItem = normalizeCartItem(currentItem, quantity);
    setItems((prev) => prev.map((item) => (item._id === id ? nextItem : item)));

    if (nextItem.hasStockIssue && quantity > currentItem.quantity) {
      toast.success('Quantity updated. This item will need stock confirmation.');
    }
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + Number(i.totalAmount || (i.finalPrice * i.quantity)), 0);
  const taxableSubtotal = items.reduce((sum, i) => sum + Number(i.taxableAmount || (Number(i.price || 0) * Number(i.quantity || 0))), 0);
  const gstTotal = items.reduce((sum, i) => sum + Number(i.gstAmount || 0), 0);
  const cgstTotal = items.reduce((sum, i) => sum + Number(i.cgstAmount || 0), 0);
  const sgstTotal = items.reduce((sum, i) => sum + Number(i.sgstAmount || 0), 0);
  const igstTotal = items.reduce((sum, i) => sum + Number(i.igstAmount || 0), 0);
  const actualTotal = items.reduce((sum, i) => sum + (Number(i.sellingPrice || i.price || 0) * i.quantity), 0);
  const discountTotal = items.reduce((sum, i) => sum + Number(i.discountAmount || 0), 0);
  const discountPercentage = actualTotal > 0 ? Math.round((discountTotal / actualTotal) * 10000) / 100 : 0;
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartCount = items.length;
  const roundedGrandTotal = Math.round(subtotal);
  const roundOffTotal = Math.round((roundedGrandTotal - subtotal) * 100) / 100;

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
      roundedGrandTotal,
      roundOffTotal,
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
