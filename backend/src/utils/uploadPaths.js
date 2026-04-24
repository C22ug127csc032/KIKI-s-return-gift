import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../../uploads');

export const buildLocalUploadPath = (folder, filename) => `/uploads/${folder}/${filename}`;

export const getLocalUploadFileName = (imageUrl, folder) => {
  if (!imageUrl) return '';
  const marker = `/uploads/${folder}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return '';

  const fileName = imageUrl.slice(index + marker.length).split(/[?#]/)[0];
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
};

export const normalizeLocalUploadUrl = (url) => {
  if (typeof url !== 'string') return url;
  const match = url.match(/\/uploads\/(?:categories|products)\/[^?#\s]+/);
  return match ? match[0] : url;
};

export const deleteLocalUploadFile = (imageUrl, folder) => {
  const fileName = getLocalUploadFileName(imageUrl, folder);
  if (!fileName) return false;

  const safeFileName = path.basename(fileName);
  const filePath = path.join(uploadsRoot, folder, safeFileName);

  try {
    fs.rmSync(filePath, { force: true });
    return true;
  } catch {
    return false;
  }
};
