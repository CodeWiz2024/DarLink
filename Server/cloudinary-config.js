// cloudinary-config.js - FIXED for cloudinary v2 + Railway + ESM
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error('❌ MISSING Cloudinary env vars! Check Railway Variables tab.');
} else {
  console.log('✅ Cloudinary configured with cloud_name:', cloudinaryConfig.cloud_name);
}

// Configure the main cloudinary instance (v2)
cloudinary.config(cloudinaryConfig);

// Create storage engines using the SAME cloudinary instance (v2 works in recent versions of the storage package)
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Export the v2 instance for direct API calls (ping, delete, etc.)
export { cloudinary as cloudinaryV2 };

// Also keep default export for backward compatibility if needed
export default cloudinary;