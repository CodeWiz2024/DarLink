// cloudinary-config.js - NEW CLEAN VERSION (using upload_stream)

// Import: import dotenv from 'dotenv';
import dotenv from 'dotenv';
// Load .env configuration
dotenv.config();

// Import: import cloudinary from 'cloudinary';
import cloudinary from 'cloudinary';
// Import: import multer from 'multer';
import multer from 'multer';
// Import: import streamifier from 'streamifier';
import streamifier from 'streamifier';

// Constant: const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
// Constant: const apiKey    = process.env.CLOUDINARY_API_KEY;
const apiKey    = process.env.CLOUDINARY_API_KEY;
// Constant: const apiSecret = process.env.CLOUDINARY_API_SECRET;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validation guard: if (!cloudName || !apiKey || !apiSecret) {
if (!cloudName || !apiKey || !apiSecret) {
  // Console: console.error('❌ Cloudinary environment variables are missing!');
  console.error('❌ Cloudinary environment variables are missing!');
// Else branch
} else {
  // Console: console.log('✅ Cloudinary configured successfully → Cloud:', cloudName
  console.log('✅ Cloudinary configured successfully → Cloud:', cloudName);
// End block
}

// Configure Cloudinary
cloudinary.config({
  // L22: cloud_name: cloudName,
  cloud_name: cloudName,
  // L23: api_key: apiKey,
  api_key: apiKey,
  // L24: api_secret: apiSecret,
  api_secret: apiSecret,
  // L25: secure: true
  secure: true
// End handler/callback
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  // Return: new Promise((resolve, reject) => {
  return new Promise((resolve, reject) => {
    // L31: cloudinary.v2.uploader.upload_stream(
    cloudinary.v2.uploader.upload_stream(
      // L32: { folder: folder },
      { folder: folder },
      // L33: (error, result) => {
      (error, result) => {
        // If: if (error) reject(error);
        if (error) reject(error);
        // Else branch
        else resolve(result);
      // End block
      }
    // L37: ).end(buffer);
    ).end(buffer);
  // End handler/callback
  });
// End statement
};

// Multer with memory storage (recommended for Cloudinary)
const memoryStorage = multer.memoryStorage();

// Export: export const propertyUpload = multer({
export const propertyUpload = multer({
  // L45: storage: memoryStorage,
  storage: memoryStorage,
  // L46: limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  // L47: fileFilter: (req, file, cb) => {
  fileFilter: (req, file, cb) => {
    // If: if (file.mimetype.startsWith('image/')) {
    if (file.mimetype.startsWith('image/')) {
      // L49: cb(null, true);
      cb(null, true);
    // Else branch
    } else {
      // L51: cb(new Error('Only image files are allowed'), false);
      cb(new Error('Only image files are allowed'), false);
    // End block
    }
  // End block
  }
// End handler/callback
});

// Export: export const idUpload = multer({
export const idUpload = multer({
  // L57: storage: memoryStorage,
  storage: memoryStorage,
  // L58: limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  // L59: fileFilter: (req, file, cb) => {
  fileFilter: (req, file, cb) => {
    // If: if (file.mimetype.startsWith('image/')) {
    if (file.mimetype.startsWith('image/')) {
      // L61: cb(null, true);
      cb(null, true);
    // Else branch
    } else {
      // L63: cb(new Error('Only image files are allowed'), false);
      cb(new Error('Only image files are allowed'), false);
    // End block
    }
  // End block
  }
// End handler/callback
});

// Export the upload helper and cloudinary instance
export { uploadToCloudinary };
// Export: export const cloudinaryV2 = cloudinary.v2;
export const cloudinaryV2 = cloudinary.v2;
// Default export
export default cloudinary;