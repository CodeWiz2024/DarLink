// cloudinary-config.js - FIXED & COMPLETE (No more ReferenceError)

import dotenv from 'dotenv';
dotenv.config();   // Load env vars first

import cloudinary from 'cloudinary';                    // v1 default
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';   // ← THIS WAS MISSING

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey    = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary env vars MISSING!');
} else {
  console.log('✅ Cloudinary credentials loaded successfully → Cloud:', cloudName);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

// Storage for properties
export const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'darlink/properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit' }],
  },
});

// Storage for ID cards
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

// For the test endpoint (ping)
export const cloudinaryV2 = cloudinary.v2;

export default cloudinary;