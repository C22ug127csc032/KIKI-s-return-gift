const DEFAULT_API_BASE_URL = 'https://api.kiki.ematixsolutions.com/api';

const LOCAL_UPLOAD_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export const getAssetBaseUrl = () => {
  const explicitAssetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL;
  if (explicitAssetBaseUrl) return explicitAssetBaseUrl.replace(/\/$/, '');

  try {
    const apiUrl = new URL(getApiBaseUrl(), window.location.origin);
    apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, '');
    apiUrl.search = '';
    apiUrl.hash = '';
    return apiUrl.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
};

export const normalizeAssetUrl = (value) => {
  if (typeof value !== 'string' || !value) return value;

  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue.startsWith('data:') || trimmedValue.startsWith('blob:')) {
    return value;
  }

  const assetBaseUrl = getAssetBaseUrl();
  if (!assetBaseUrl) return value;

  if (trimmedValue.startsWith('/uploads/')) {
    return `${assetBaseUrl}${trimmedValue}`;
  }

  if (trimmedValue.startsWith('uploads/')) {
    return `${assetBaseUrl}/${trimmedValue}`;
  }

  try {
    const url = new URL(trimmedValue);
    if (url.pathname.startsWith('/uploads/') && LOCAL_UPLOAD_HOSTS.has(url.hostname)) {
      return `${assetBaseUrl}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return value;
  }

  return value;
};

export const normalizeAssetUrls = (payload) => {
  if (Array.isArray(payload)) return payload.map(normalizeAssetUrls);

  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, normalizeAssetUrls(value)])
    );
  }

  return normalizeAssetUrl(payload);
};
