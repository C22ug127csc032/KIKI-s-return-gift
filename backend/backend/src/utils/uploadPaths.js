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
