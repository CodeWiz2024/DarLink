// Import BOTH:
// - v1 default export  → required by multer-storage-cloudinary@4
// - v2 named export    → required for direct API calls (ping, delete, etc.)
import cloudinaryV1 from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const cfg = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Configure v1 — required by multer-storage-cloudinary@4
cloudinaryV1.config(cfg);

// Configure v2 — used for direct API calls
cloudinaryV2.config(cfg);

if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
  console.error('❌ MISSING Cloudinary env vars! Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Railway.');
} else {
  console.log('✅ Cloudinary configured:', cfg.cloud_name);
}

// multer-storage-cloudinary@4 MUST receive the v1 default export — NOT v2
export const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV1,
  params: {
    folder: 'darlink/properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit' }],
  },
});

export const idStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV1,
  params: {
    folder: 'darlink/ids',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

export const propertyUpload = multer({
  storage: propertyStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export const idUpload = multer({
  storage: idStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Named export for direct API calls in app.js (ping, delete, etc.)
export { cloudinaryV2 };

// Default export is v1 (for any other consumers)
export default cloudinaryV1;