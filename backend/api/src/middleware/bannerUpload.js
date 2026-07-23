const multer = require('multer');

const MB = 1024 * 1024;
const LIMITS = Object.freeze({
  imageBytes: Number(process.env.MAX_BANNER_IMAGE_BYTES) || 8 * MB,
  videoBytes: Number(process.env.MAX_BANNER_VIDEO_BYTES) || 30 * MB,
  videoDuration: Number(process.env.MAX_BANNER_VIDEO_DURATION_SECONDS) || 20,
});
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.videoBytes, files: 5 } }).fields([
  { name: 'desktopImage', maxCount: 1 }, { name: 'mobileImage', maxCount: 1 },
  { name: 'desktopVideo', maxCount: 1 }, { name: 'mobileVideo', maxCount: 1 },
  { name: 'posterImage', maxCount: 1 },
]);

async function validateBannerFiles(req, _res, next) {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    for (const [field, files] of Object.entries(req.files || {})) {
      const file = files[0];
      const detected = await fileTypeFromBuffer(file.buffer);
      const isVideo = field.toLowerCase().includes('video');
      const allowed = isVideo ? VIDEO_MIMES : IMAGE_MIMES;
      const limit = isVideo ? LIMITS.videoBytes : LIMITS.imageBytes;
      if (!detected || detected.mime !== file.mimetype || !allowed.has(detected.mime)) {
        const error = new Error(`Formato no permitido para ${field}`); error.statusCode = 415; throw error;
      }
      if (file.size > limit) { const error = new Error(`${field} excede el tamaño permitido`); error.statusCode = 413; throw error; }
    }
    next();
  } catch (error) { next(error); }
}

module.exports = { bannerUpload: upload, validateBannerFiles, LIMITS, IMAGE_MIMES, VIDEO_MIMES };
