import axios from 'axios';
import { getApiBaseUrl, normalizeAssetUrls } from '../utils/assetUrl.js';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

const binaryResponseTypes = new Set(['blob', 'arraybuffer', 'stream']);

const isBinaryPayload = (payload) => (
  (typeof Blob !== 'undefined' && payload instanceof Blob) ||
  (typeof ArrayBuffer !== 'undefined' && payload instanceof ArrayBuffer)
);

const shouldNormalizeResponse = (response) => (
  !binaryResponseTypes.has(response?.config?.responseType) && !isBinaryPayload(response?.data)
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kiki_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (shouldNormalizeResponse(res)) {
      res.data = normalizeAssetUrls(res.data);
    }
    return res;
  },
  (err) => {
    if (err.response?.data && shouldNormalizeResponse(err.response)) {
      err.response.data = normalizeAssetUrls(err.response.data);
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('kiki_token');
      localStorage.removeItem('kiki_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
