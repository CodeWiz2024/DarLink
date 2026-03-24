import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

// multer-storage-cloudinary v4 requires cloudinary v1 (default export), NOT v2
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// For property images
const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'darlink/properties',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, height: 900, crop: 'limit' }],
  },
});

// For ID card images
const idStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'darlink/ids',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

export const propertyUpload = multer({ storage: propertyStorage });
export const idUpload = multer({ storage: idStorage });
export default cloudinary;