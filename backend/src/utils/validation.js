export const PHONE_REGEX = /^\d{10}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const isValidPhone = (value) => PHONE_REGEX.test(normalizePhone(value));
export const isValidEmail = (value) => EMAIL_REGEX.test(normalizeEmail(value));
