const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so we can process the buffer with sharp before saving
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPG, PNG, WebP, GIF)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

/**
 * Middleware that converts the uploaded image buffer to WebP using sharp
 * and saves it to disk. Must run AFTER upload.single('image').
 * Populates req.file.filename and req.file.path with the final .webp values.
 */
async function convertToWebp(req, res, next) {
  try {
    if (!req.file) return next();

    const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
    const outputPath = path.join(uploadDir, uniqueName);

    await sharp(req.file.buffer)
      .webp({ quality: 85 })
      .toFile(outputPath);

    // Overwrite multer file metadata so the route handler works unchanged
    req.file.filename = uniqueName;
    req.file.path = outputPath;
    req.file.mimetype = 'image/webp';

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, convertToWebp };
