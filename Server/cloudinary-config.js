// cloudinary-config.js - FIXED (using cloudinary v1 + multer-storage-cloudinary)

import cloudinary from 'cloudinary';           // default import = v1
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const cfg = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.config(cfg);   // This is the v1 way

if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
  console.error('❌ MISSING Cloudinary env vars in Railway!');
} else {
  console.log('✅ Cloudinary v1 configured successfully →', cfg.cloud_name);
}

// Storage engines
export const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'darlink/properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit' }],
  },
});

export const idStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'darlink/ids',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

export const propertyUpload = multer({
  storage: propertyStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

export const idUpload = multer({
  storage: idStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// For ping + direct API calls in app.js
export const cloudinaryV2 = cloudinary.v2;   // ← important: use .v2 here

export default cloudinary;