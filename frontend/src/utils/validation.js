export const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
export const isValidPhone = (value) => /^\d{10}$/.test(normalizePhone(value));
export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
