const { v2: cloudinary } = require('cloudinary');

const FOLDERS = Object.freeze({
  image: 'integra-sutec/banners/images',
  video: 'integra-sutec/banners/videos',
  poster: 'integra-sutec/banners/posters',
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function assertOwned(publicId, kind) {
  if (!publicId || !publicId.startsWith(`${FOLDERS[kind]}/`)) {
    const error = new Error('El recurso no pertenece a Integra Sutec');
    error.statusCode = 400;
    throw error;
  }
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error); else resolve(result);
    });
    stream.end(buffer);
  });
}

const uploadImage = (buffer, options = {}) => uploadBuffer(buffer, {
  resource_type: 'image', folder: options.poster ? FOLDERS.poster : FOLDERS.image,
  use_filename: false, unique_filename: true, overwrite: false,
});
const uploadVideo = (buffer) => uploadBuffer(buffer, {
  resource_type: 'video', folder: FOLDERS.video, use_filename: false,
  unique_filename: true, overwrite: false, eager_async: true,
});
async function deleteImage(publicId, kind = 'image') {
  assertOwned(publicId, kind);
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}
async function deleteVideo(publicId) {
  assertOwned(publicId, 'video');
  return cloudinary.uploader.destroy(publicId, { resource_type: 'video', invalidate: true });
}
async function replaceImage(buffer, oldPublicId, options = {}) {
  const fresh = await uploadImage(buffer, options);
  return { fresh, cleanup: () => oldPublicId && deleteImage(oldPublicId, options.poster ? 'poster' : 'image') };
}
async function replaceVideo(buffer, oldPublicId) {
  const fresh = await uploadVideo(buffer);
  return { fresh, cleanup: () => oldPublicId && deleteVideo(oldPublicId) };
}
function generateImageUrl(publicId, width = 1600) {
  return cloudinary.url(publicId, { resource_type: 'image', secure: true, fetch_format: 'auto', quality: 'auto', width, crop: 'limit' });
}
function generatePosterUrl(publicId, width = 1600) {
  return cloudinary.url(publicId, { resource_type: 'image', secure: true, fetch_format: 'auto', quality: 'auto', width, crop: 'fill', gravity: 'auto', aspect_ratio: '16:5' });
}
function generateVideoUrl(publicId, width = 1600) {
  return cloudinary.url(publicId, { resource_type: 'video', secure: true, quality: 'auto', width, crop: 'limit' });
}

module.exports = { FOLDERS, uploadImage, uploadVideo, deleteImage, deleteVideo, replaceImage, replaceVideo, generateImageUrl, generateVideoUrl, generatePosterUrl };
