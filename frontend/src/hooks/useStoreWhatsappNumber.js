import { useEffect, useState } from 'react';
import api from '../api/api.js';

const fallbackWhatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
let cachedWhatsapp = null;
let settingsRequest = null;
const normalizeWhatsappNumber = (value) => String(value || '').replace(/\D/g, '') || fallbackWhatsapp;

const fetchStoreWhatsapp = async () => {
  if (cachedWhatsapp) return cachedWhatsapp;
  if (settingsRequest) return settingsRequest;

  settingsRequest = (async () => {
  try {
    const response = await api.get('/settings');
    cachedWhatsapp = normalizeWhatsappNumber(response.data.data?.whatsappNumber);
    return cachedWhatsapp;
  } catch {
    return cachedWhatsapp || fallbackWhatsapp;
  } finally {
    settingsRequest = null;
  }
  })();

  return settingsRequest;
};

export const useStoreWhatsappNumber = () => {
  const [whatsappNumber, setWhatsappNumber] = useState(cachedWhatsapp || fallbackWhatsapp);

  useEffect(() => {
    let mounted = true;
    fetchStoreWhatsapp().then((number) => {
      if (mounted) setWhatsappNumber(number);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return whatsappNumber;
};

export const buildProductNotifyUrl = (whatsappNumber, product, productPath) => {
  const productUrl = `${window.location.origin}${productPath}`;
  const message = `Hi! I want to know when "${product.name}" will be back in stock.\nProduct link: ${productUrl}`;
  return `https://wa.me/${whatsappNumber || fallbackWhatsapp}?text=${encodeURIComponent(message)}`;
};
