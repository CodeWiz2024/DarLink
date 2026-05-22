// app.js - Fixed with Cloudinary image uploads

// Import: import express from 'express';
import express from 'express';
// Import: import cors from 'cors';
import cors from 'cors';
// Import: import dotenv from 'dotenv';
import dotenv from 'dotenv';
// Import: import bcrypt from 'bcrypt';
import bcrypt from 'bcrypt';
// Import: import multer from 'multer';
import multer from 'multer';
// Import: import path from 'path';
import path from 'path';
// Import: import { fileURLToPath } from 'url';
import { fileURLToPath } from 'url';
// Import: import fs from 'fs';
import fs from 'fs';
// Import: import pool from './connect.js';
import pool from './connect.js';
// Import: import { extractIDFromImage, validateAlgerianID, parseAlgerianID } from './ocr.js';
import { extractIDFromImage, validateAlgerianID, parseAlgerianID } from './ocr.js';
// Import: import chargily from './chargily-config.js';
import chargily from './chargily-config.js';
// Import: import { propertyUpload, idUpload, cloudinaryV2, uploadToCloudinary } from './cloudinary-config
import { propertyUpload, idUpload, cloudinaryV2, uploadToCloudinary } from './cloudinary-config.js';
// Load .env configuration
dotenv.config();

// Create Express app
const app = express();

// Constant: const __filename = fileURLToPath(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
// Constant: const __dirname = path.dirname(__filename);
const __dirname = path.dirname(__filename);

// Keep uploads dir for OCR temp files ONLY
const uploadDir = path.join(__dirname, 'uploads');
// Validation guard: if (!fs.existsSync(uploadDir)) {
if (!fs.existsSync(uploadDir)) {
    // File system: fs.mkdirSync(uploadDir, { recursive: true });
    fs.mkdirSync(uploadDir, { recursive: true });
// End block
}

// Middleware
app.use(cors());
// Express middleware
app.use(express.json());
// Express middleware
app.use(express.urlencoded({ extended: false }));

// OCR-only local multer (temp files, deleted immediately after reading)
const fileFilter = (req, file, cb) => {
    // Constant: const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    // If: if (allowedTypes.includes(file.mimetype)) {
    if (allowedTypes.includes(file.mimetype)) {
        // L37: cb(null, true);
        cb(null, true);
    // Else branch
    } else {
        // L39: cb(new Error('Only JPG and PNG images are allowed'), false);
        cb(new Error('Only JPG and PNG images are allowed'), false);
    // End block
    }
// End statement
};

// Constant: const ocrUpload = multer({
const ocrUpload = multer({
    // L44: dest: uploadDir,
    dest: uploadDir,
    // L45: fileFilter: fileFilter,
    fileFilter: fileFilter,
    // L46: limits: { fileSize: 5 * 1024 * 1024 }
    limits: { fileSize: 5 * 1024 * 1024 }
// End handler/callback
});

// Test endpoint
app.get('/api/test', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [rows] = await pool.query('SELECT 1 + 1 AS result');
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        // Send HTTP response
        res.json({ 
            // L54: message: 'Database connected!',
            message: 'Database connected!', 
            // L55: result: rows[0].result,
            result: rows[0].result,
            // L56: ocrConfigured: !!process.env.OCR_SPACE_API_KEY
            ocrConfigured: !!process.env.OCR_SPACE_API_KEY
        // End handler/callback
        });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// OCR Endpoint — uses local temp storage, file deleted after use
app.post('/api/ocr/extract-id', ocrUpload.single('image'), async (req, res) => {
    // Try block
    try {
        // Validation guard: if (!req.file) {
        if (!req.file) {
            // HTTP response
            return res.status(400).json({ 
                // L68: success: false,
                success: false,
                // L69: error: 'No image file provided'
                error: 'No image file provided' 
            // End handler/callback
            });
        // End block
        }

        // Constant: const result = await extractIDFromImage(req.file.path);
        const result = await extractIDFromImage(req.file.path);
        // File system: fs.unlinkSync(req.file.path);
        fs.unlinkSync(req.file.path);

        // If: if (result.success) {
        if (result.success) {
            // Constant: const idDetails = parseAlgerianID(result.idNumber);
            const idDetails = parseAlgerianID(result.idNumber);
            // Send HTTP response
            res.json({
                // L79: success: true,
                success: true,
                // L80: idNumber: result.idNumber,
                idNumber: result.idNumber,
                // L81: confidence: result.confidence,
                confidence: result.confidence,
                // L82: pattern: result.pattern,
                pattern: result.pattern,
                // L83: details: idDetails,
                details: idDetails,
                // L84: message: 'ID number extracted successfully'
                message: 'ID number extracted successfully'
            // End handler/callback
            });
        // Else branch
        } else {
            // Send HTTP response
            res.status(400).json({
                // L88: success: false,
                success: false,
                // L89: error: result.error,
                error: result.error,
                // L90: fullText: result.fullText,
                fullText: result.fullText,
                // L91: message: 'Could not extract ID number from image'
                message: 'Could not extract ID number from image'
            // End handler/callback
            });
        // End block
        }
    // Catch errors
    } catch (error) {
        // If: if (req.file && fs.existsSync(req.file.path)) {
        if (req.file && fs.existsSync(req.file.path)) {
            // File system: fs.unlinkSync(req.file.path);
            fs.unlinkSync(req.file.path);
        // End block
        }
        // Send HTTP response
        res.status(500).json({
            // L99: success: false,
            success: false,
            // L100: error: error.message
            error: error.message
        // End handler/callback
        });
    // End block
    }
// End handler/callback
});

// Registration endpoint — uses Cloudinary idUpload
app.post('/api/users/register', idUpload.single('IDCardFront'), async (req, res) => {
    // Try block
    try {
        // Constant: const { FullName, Email, PhoneNumber, IDCardNumber, Password, UserType } = 
        const { FullName, Email, PhoneNumber, IDCardNumber, Password, UserType } = req.body;

        // Constant: const nameParts = FullName.trim().split(' ');
        const nameParts = FullName.trim().split(' ');
        // Constant: const FirstName = nameParts[0] || '';
        const FirstName = nameParts[0] || '';
        // Constant: const LastName = nameParts.slice(1).join(' ') || nameParts[0];
        const LastName = nameParts.slice(1).join(' ') || nameParts[0];

        // Validation guard: if (!FullName || !Email || !PhoneNumber || !IDCardNumber || !Pass
        if (!FullName || !Email || !PhoneNumber || !IDCardNumber || !Password || !UserType) {
            // HTTP response
            return res.status(400).json({ error: 'All required fields must be filled' });
        // End block
        }

        // Validation guard: if (!validateAlgerianID(IDCardNumber)) {
        if (!validateAlgerianID(IDCardNumber)) {
            // HTTP response
            return res.status(400).json({ 
                // L120: error: 'Invalid Algerian ID card number format (must be 18 digits)'
                error: 'Invalid Algerian ID card number format (must be 18 digits)' 
            // End handler/callback
            });
        // End block
        }

        // Cloudinary returns full HTTPS URL in req.file.path
        let frontImagePath = null;
        // If: if (req.file) {
        if (req.file) {
           // Constant: const uploadResult = await uploadToCloudinary(req.file.buffer, 'darlink/ids
           const uploadResult = await uploadToCloudinary(req.file.buffer, 'darlink/ids');
            // L128: frontImagePath = uploadResult.secure_url;
            frontImagePath = uploadResult.secure_url;
        // End block
        }

        // Constant: const hashedPassword = await bcrypt.hash(Password, 10);
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO USER_a 
            (FirstName, LastName, Email, PhoneNumber, IDCardNumber, Password, UserType, IDCardFrontPath) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            // L137: [FirstName, LastName, Email, PhoneNumber, IDCardNumber, hashedPassword, UserType, frontImagePath]
            [FirstName, LastName, Email, PhoneNumber, IDCardNumber, hashedPassword, UserType, frontImagePath]
        // L138: );
        );

        // Send HTTP response
        res.status(201).json({
            // L141: message: 'Registration successful!',
            message: 'Registration successful!',
            // L142: userId: result.insertId
            userId: result.insertId
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // If: if (error.code === 'ER_DUP_ENTRY') {
        if (error.code === 'ER_DUP_ENTRY') {
            // HTTP response
            return res.status(400).json({ 
                // L148: error: 'Email or ID Card Number already exists'
                error: 'Email or ID Card Number already exists' 
            // End handler/callback
            });
        // End block
        }

        // Send HTTP response
        res.status(500).json({ 
            // L153: error: 'Server error. Please try again later.',
            error: 'Server error. Please try again later.',
            // L154: details: error.message
            details: error.message
        // End handler/callback
        });
    // End block
    }
// End handler/callback
});

// Login endpoint
// POST /api/users/login — route handler entry
app.post('/api/users/login', async (req, res) => {
    // Try block
    try {
        // Constant: const { Email, Password, UserType } = req.body;
        const { Email, Password, UserType } = req.body;

        // Validation guard: if (!Email || !Password || !UserType) {
        if (!Email || !Password || !UserType) {
            // HTTP response
            return res.status(400).json({ error: 'All fields are required' });
        // End block
        }

        // Query result destructure: const [users] = await pool.query(
        const [users] = await pool.query(
            // SQL statement
            'SELECT * FROM USER_a WHERE Email = ? AND UserType = ?',
            // L170: [Email, UserType]
            [Email, UserType]
        // L171: );
        );

        // If: if (users.length === 0) {
        if (users.length === 0) {
            // HTTP response
            return res.status(401).json({ error: 'Invalid email or user type' });
        // End block
        }

        // Constant: const user = users[0];
        const user = users[0];
        // Constant: const isValidPassword = await bcrypt.compare(Password, user.Password);
        const isValidPassword = await bcrypt.compare(Password, user.Password);

        // Validation guard: if (!isValidPassword) {
        if (!isValidPassword) {
            // HTTP response
            return res.status(401).json({ error: 'Invalid password' });
        // End block
        }

        // L184: delete user.Password;
        delete user.Password;

        // Send HTTP response
        res.json({
            // L187: message: 'Login successful!',
            message: 'Login successful!',
            // L188: user: user
            user: user
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: 'Server error. Please try again later.' });
    // End block
    }
// End handler/callback
});

// Property endpoints — uses Cloudinary propertyUpload
// Property endpoints — NEW manual upload with upload_stream
app.post('/api/properties', propertyUpload.array('images', 10), async (req, res) => {
    // Try block
    try {
        // Variable: let {
        let { 
            // L201: Title, Description, Address, City, Wilaya, Latitude, Longitude,
            Title, Description, Address, City, Wilaya, Latitude, Longitude, 
            // L202: PropertyType, PricePerNight, AvailabilityStatus, NumofRooms, OwnerId,
            PropertyType, PricePerNight, AvailabilityStatus, NumofRooms, OwnerId,
            // L203: FeatureIds
            FeatureIds
        // L204: } = req.body;
        } = req.body;

        // Constant: const basePrice = parseFloat(PricePerNight);
        const basePrice = parseFloat(PricePerNight);
        // If: if (isNaN(basePrice)) {
        if (isNaN(basePrice)) {
            // HTTP response
            return res.status(400).json({ error: 'Invalid PricePerNight' });
        // End block
        }
        // L210: PricePerNight = parseFloat((basePrice * 1.1).toFixed(2));
        PricePerNight = parseFloat((basePrice * 1.1).toFixed(2));

        // Variable: let featureIdsArray = [];
        let featureIdsArray = [];
        // If: if (FeatureIds) {
        if (FeatureIds) {
            // Try block
            try {
                // L215: featureIdsArray = typeof FeatureIds === 'string' ? JSON.parse(FeatureIds) : FeatureIds;
                featureIdsArray = typeof FeatureIds === 'string' ? JSON.parse(FeatureIds) : FeatureIds;
                // Validation guard: if (!Array.isArray(featureIdsArray)) featureIdsArray = [];
                if (!Array.isArray(featureIdsArray)) featureIdsArray = [];
            // Catch errors
            } catch (err) {
                // L218: featureIdsArray = [];
                featureIdsArray = [];
            // End block
            }
        // End block
        }

        // Validation guard: if (!Title || !Description || !Address || !City || !Wilaya || !Pr
        if (!Title || !Description || !Address || !City || !Wilaya || !PropertyType || !PricePerNight || !NumofRooms || !OwnerId) {
            // HTTP response
            return res.status(400).json({ error: 'All required fields must be filled' });
        // End block
        }

        // Validation guard: if (!req.files || req.files.length === 0) {
        if (!req.files || req.files.length === 0) {
            // HTTP response
            return res.status(400).json({ error: 'At least one property image is required' });
        // End block
        }

        // Check owner
        const [owners] = await pool.query(
            // SQL statement
            'SELECT UserId, UserType FROM USER_a WHERE UserId = ? AND UserType = "Owner"',
            // L233: [OwnerId]
            [OwnerId]
        // L234: );
        );

        // If: if (owners.length === 0) {
        if (owners.length === 0) {
            // HTTP response
            return res.status(403).json({ error: 'Only property owners can add properties' });
        // End block
        }

        // Constant: const lat = Latitude || null;
        const lat = Latitude || null;
        // Constant: const lng = Longitude || null;
        const lng = Longitude || null;
        // Constant: const status = AvailabilityStatus || 'Active';
        const status = AvailabilityStatus || 'Active';

        // Insert property first
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO Property 
            (Title, Description, Address, City, Wilaya, Latitude, Longitude, PropertyType, PricePerNight, AvailabilityStatus, NumofRooms, OwnerId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            // L249: [Title, Description, Address, City, Wilaya, lat, lng, PropertyType, PricePerNight, status, NumofRoom
            [Title, Description, Address, City, Wilaya, lat, lng, PropertyType, PricePerNight, status, NumofRooms, OwnerId]
        // L250: );
        );

        // Constant: const propertyId = result.insertId;
        const propertyId = result.insertId;

        // Insert features
        if (featureIdsArray && featureIdsArray.length > 0) {
            // Constant: const featurePromises = featureIdsArray.map(fid =>
            const featurePromises = featureIdsArray.map(fid =>
                // Test DB connection
                pool.query('INSERT INTO has_features (PropertyId, FeatureId) VALUES (?, ?)', [propertyId, fid])
            // L258: );
            );
            // Await: await Promise.all(featurePromises);
            await Promise.all(featurePromises);
        // End block
        }

        // === NEW: Upload images to Cloudinary using upload_stream ===
        const imageInsertPromises = req.files.map(async (file, index) => {
            // Constant: const result = await uploadToCloudinary(file.buffer, 'darlink/properties');
            const result = await uploadToCloudinary(file.buffer, 'darlink/properties');
            // Constant: const imageURL = result.secure_url;        // Full HTTPS URL
            const imageURL = result.secure_url;        // Full HTTPS URL
            // Constant: const caption = index === 0 ? 'Main Image' : `Image ${index + 1}`;
            const caption = index === 0 ? 'Main Image' : `Image ${index + 1}`;
            
            // Return: pool.query(
            return pool.query(
                // SQL statement
                'INSERT INTO PROPERTY_Image (PropertyId, ImageURL, Caption) VALUES (?, ?, ?)',
                // L270: [propertyId, imageURL, caption]
                [propertyId, imageURL, caption]
            // L271: );
            );
        // End handler/callback
        });

        // Await: await Promise.all(imageInsertPromises);
        await Promise.all(imageInsertPromises);

        // Send HTTP response
        res.status(201).json({ 
            // L277: message: `Property added successfully with ${req.files.length} image(s)!`,
            message: `Property added successfully with ${req.files.length} image(s)!`, 
            // L278: propertyId: propertyId
            propertyId: propertyId 
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('Property upload error:', error);
        console.error('Property upload error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});



// GET /api/properties/owner/:ownerId — route handler entry
app.get('/api/properties/owner/:ownerId', async (req, res) => {
    // Try block
    try {
        // Constant: const { ownerId } = req.params;
        const { ownerId } = req.params;

        // Query result destructure: const [properties] = await pool.query(
        const [properties] = await pool.query(
            // SQL statement
            `SELECT p.*, 
             CONCAT(u.FirstName, ' ', u.LastName) as OwnerName
             FROM Property p
             JOIN USER_a u ON p.OwnerId = u.UserId
             WHERE p.OwnerId = ?
             ORDER BY p.PropertyId DESC`,
            // L300: [ownerId]
            [ownerId]
        // L301: );
        );

        // Loop: for (let property of properties) {
        for (let property of properties) {
            // Query result destructure: const [images] = await pool.query(
            const [images] = await pool.query(
                // SQL statement
                'SELECT ImageURL, Caption FROM PROPERTY_Image WHERE PropertyId = ?',
                // L306: [property.PropertyId]
                [property.PropertyId]
            // L307: );
            );
            // ImageURL is already a full Cloudinary HTTPS URL
            property.Images = images;
            // L310: property.MainImage = images.length > 0 ? images[0].ImageURL : null;
            property.MainImage = images.length > 0 ? images[0].ImageURL : null;

            // Query result destructure: const [feats] = await pool.query(
            const [feats] = await pool.query(
                // SQL statement
                `SELECT f.FeatureId, f.FeatureName
                 FROM Feature f
                 JOIN has_features hf ON f.FeatureId = hf.FeatureId
                 WHERE hf.PropertyId = ?`,
                // L317: [property.PropertyId]
                [property.PropertyId]
            // L318: );
            );
            // L319: property.Features = feats;
            property.Features = feats;
        // End block
        }

        // Send HTTP response
        res.json(properties);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/properties/:id — route handler entry
app.get('/api/properties/:id', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [properties] = await pool.query(
        const [properties] = await pool.query(
            // SQL statement
            `SELECT p.*, 
             CONCAT(u.FirstName, ' ', u.LastName) as OwnerName, 
             u.Email as OwnerEmail, u.PhoneNumber as OwnerPhone,
             pr.PromotionId,
             pr.PromotionType,
             pr.DiscountType,
             pr.DiscountValue,
             pr.StartDate as PromoStartDate,
             pr.EndDate as PromoEndDate,
             CASE 
                 WHEN pr.PromotionId IS NOT NULL 
                 AND CURDATE() BETWEEN pr.StartDate AND pr.EndDate 
                 THEN 1
                 ELSE 0
             END as HasPromotion,
             CASE 
                 WHEN pr.DiscountType = 'Percentage' 
                 THEN pr.DiscountValue 
                 ELSE 0 
             END as DiscountPercentage,
             CASE 
                 WHEN pr.DiscountType = 'FixedAmount' 
                 THEN pr.DiscountValue 
                 ELSE 0 
             END as DiscountAmount
             FROM Property p
             JOIN USER_a u ON p.OwnerId = u.UserId
             LEFT JOIN benefits_from bf ON p.PropertyId = bf.PropertyId  
             LEFT JOIN Promotion pr ON bf.PromotionId = pr.PromotionId 
                 AND CURDATE() BETWEEN pr.StartDate AND pr.EndDate
             WHERE p.PropertyId = ?`,
            // L362: [req.params.id]
            [req.params.id]
        // L363: );
        );

        // If: if (properties.length === 0) {
        if (properties.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Property not found' });
        // End block
        }

        // Constant: const property = properties[0];
        const property = properties[0];
        // L370: property.HasPromotion = property.HasPromotion === 1;
        property.HasPromotion = property.HasPromotion === 1;

        // Query result destructure: const [images] = await pool.query(
        const [images] = await pool.query(
            // SQL statement
            'SELECT ImageURL, Caption FROM PROPERTY_Image WHERE PropertyId = ? ORDER BY ImageId',
            // L374: [req.params.id]
            [req.params.id]
        // L375: );
        );

        // ImageURL is already a full Cloudinary HTTPS URL — no baseUrl prepending needed
        property.Images = images;
        // L379: property.MainImage = images.length > 0 ? images[0].ImageURL : null;
        property.MainImage = images.length > 0 ? images[0].ImageURL : null;

        // Query result destructure: const [feats] = await pool.query(
        const [feats] = await pool.query(
            // SQL statement
            `SELECT f.FeatureId, f.FeatureName
             FROM Feature f
             JOIN has_features hf ON f.FeatureId = hf.FeatureId
             WHERE hf.PropertyId = ?`,
            // L386: [req.params.id]
            [req.params.id]
        // L387: );
        );
        // L388: property.Features = feats;
        property.Features = feats;

        // Run SQL query
        await pool.query(
            // SQL statement
            'UPDATE Property SET ViewCount = ViewCount + 1 WHERE PropertyId = ?',
            // L392: [req.params.id]
            [req.params.id]
        // L393: );
        );

        // Send HTTP response
        res.json(property);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// PUT /api/properties/:id — route handler entry
app.put('/api/properties/:id', propertyUpload.array('images', 10), async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Variable: let {
        let { 
            // L405: Title, Description, Address, City, Wilaya, PropertyType,
            Title, Description, Address, City, Wilaya, PropertyType, 
            // L406: PricePerNight, AvailabilityStatus, NumofRooms, OwnerId,
            PricePerNight, AvailabilityStatus, NumofRooms, OwnerId,
            // L407: FeatureIds, Latitude, Longitude
            FeatureIds, Latitude, Longitude
        // L408: } = req.body;
        } = req.body;
        // L409: OwnerId = parseInt(OwnerId);
        OwnerId = parseInt(OwnerId);

        // If: if (PricePerNight !== undefined) {
        if (PricePerNight !== undefined) {
            // Constant: const basePrice = parseFloat(PricePerNight);
            const basePrice = parseFloat(PricePerNight);
            // If: if (isNaN(basePrice)) {
            if (isNaN(basePrice)) {
                // HTTP response
                return res.status(400).json({ error: 'Invalid PricePerNight' });
            // End block
            }
            // L416: PricePerNight = parseFloat((basePrice * 1.1).toFixed(2));
            PricePerNight = parseFloat((basePrice * 1.1).toFixed(2));
        // End block
        }

        // Variable: let featureIdsArray = [];
        let featureIdsArray = [];
        // If: if (FeatureIds) {
        if (FeatureIds) {
            // Try block
            try {
                // L422: featureIdsArray = typeof FeatureIds === 'string' ? JSON.parse(FeatureIds) : FeatureIds;
                featureIdsArray = typeof FeatureIds === 'string' ? JSON.parse(FeatureIds) : FeatureIds;
                // Validation guard: if (!Array.isArray(featureIdsArray)) featureIdsArray = [];
                if (!Array.isArray(featureIdsArray)) featureIdsArray = [];
            // Catch errors
            } catch (err) {
                // L425: featureIdsArray = [];
                featureIdsArray = [];
            // End block
            }
        // End block
        }

        // Query result destructure: const [existing] = await pool.query(
        const [existing] = await pool.query(
            // SQL statement
            'SELECT OwnerId FROM Property WHERE PropertyId = ?',
            // L431: [id]
            [id]
        // L432: );
        );

        // If: if (existing.length === 0) {
        if (existing.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Property not found' });
        // End block
        }

        // If: if (existing[0].OwnerId !== OwnerId) {
        if (existing[0].OwnerId !== OwnerId) {
            // HTTP response
            return res.status(403).json({ error: 'You can only edit your own properties' });
        // End block
        }

        // Run SQL query
        await pool.query(
            // SQL statement
            `UPDATE Property 
             SET Title = ?, Description = ?, Address = ?, City = ?, Wilaya = ?, 
                 PropertyType = ?, PricePerNight = ?, AvailabilityStatus = ?, NumofRooms = ?,
                 Latitude = ?, Longitude = ?
             WHERE PropertyId = ?`,
            // L448: [Title, Description, Address, City, Wilaya, PropertyType, PricePerNight, AvailabilityStatus, NumofRo
            [Title, Description, Address, City, Wilaya, PropertyType, PricePerNight, AvailabilityStatus, NumofRooms, Latitude || null, Longitude || null, id]
        // L449: );
        );

        // Cloudinary returns full HTTPS URL in file.path
        if (req.files && req.files.length > 0) {
            // Constant: const imageInsertPromises = req.files.map(async (file, index) => {
            const imageInsertPromises = req.files.map(async (file, index) => {
                // Constant: const result = await uploadToCloudinary(file.buffer, 'darlink/properties');
                const result = await uploadToCloudinary(file.buffer, 'darlink/properties');
                // Constant: const imageURL = result.secure_url;
                const imageURL = result.secure_url;
                // Constant: const caption = `Image ${index + 1}`;
                const caption = `Image ${index + 1}`;
                // Return: pool.query(
                return pool.query(
                    // SQL statement
                    'INSERT INTO PROPERTY_Image (PropertyId, ImageURL, Caption) VALUES (?, ?, ?)',
                    // L459: [id, imageURL, caption]
                    [id, imageURL, caption]
                // L460: );
                );
            // End handler/callback
            });
            // Await: await Promise.all(imageInsertPromises);
            await Promise.all(imageInsertPromises);
        // End block
        }

        // If: if (featureIdsArray && featureIdsArray.length > 0) {
        if (featureIdsArray && featureIdsArray.length > 0) {
            // Run SQL query
            await pool.query('DELETE FROM has_features WHERE PropertyId = ?', [id]);
            // Constant: const inserts = featureIdsArray.map(fid =>
            const inserts = featureIdsArray.map(fid =>
                // Test DB connection
                pool.query('INSERT INTO has_features (PropertyId, FeatureId) VALUES (?, ?)', [id, fid])
            // L469: );
            );
            // Await: await Promise.all(inserts);
            await Promise.all(inserts);
        // End block
        }

        // Send HTTP response
        res.json({ message: 'Property updated successfully!' });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET all available features
app.get('/api/features', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [features] = await pool.query(
        const [features] = await pool.query(
            // SQL statement
            'SELECT FeatureId, FeatureName FROM Feature ORDER BY FeatureName'
        // L484: );
        );
        // Send HTTP response
        res.json(features);
    // Catch errors
    } catch (err) {
        // Send HTTP response
        res.status(500).json({ error: err.message });
    // End block
    }
// End handler/callback
});

// ============================================
// PROMOTION API ENDPOINTS
// ============================================

// POST /api/promotions — route handler entry
app.post('/api/promotions', async (req, res) => {
    // Try block
    try {
        // Constant: const { PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate,
        const { PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate, EndDate } = req.body;

        // Validation guard: if (!PromotionType || !MinStayDays || !DiscountType || !DiscountV
        if (!PromotionType || !MinStayDays || !DiscountType || !DiscountValue || !StartDate || !EndDate) {
            // HTTP response
            return res.status(400).json({ error: 'All fields are required' });
        // End block
        }

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO Promotion (PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate, EndDate)
             VALUES (?, ?, ?, ?, ?, ?)`,
            // L506: [PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate, EndDate]
            [PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate, EndDate]
        // L507: );
        );

        // Send HTTP response
        res.status(201).json({
            // L510: message: 'Promotion created successfully',
            message: 'Promotion created successfully',
            // L511: PromotionId: result.insertId
            PromotionId: result.insertId
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('Promotion creation error:', error);
        console.error('Promotion creation error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// DELETE /api/promotions/:promotionId — route handler entry
app.delete('/api/promotions/:promotionId', async (req, res) => {
    // Try block
    try {
        // Constant: const { promotionId } = req.params;
        const { promotionId } = req.params;

        // Run SQL query
        await pool.query('DELETE FROM benefits_from WHERE PromotionId = ?', [promotionId]);

        // Query result destructure: const [result] = await pool.query('DELETE FROM Promotion WHERE Promoti
        const [result] = await pool.query('DELETE FROM Promotion WHERE PromotionId = ?', [promotionId]);

        // If: if (result.affectedRows === 0) {
        if (result.affectedRows === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Promotion not found' });
        // End block
        }

        // Send HTTP response
        res.json({ message: 'Promotion deleted successfully' });

    // Catch errors
    } catch (error) {
        // Console: console.error('Delete promotion error:', error);
        console.error('Delete promotion error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/properties/:propertyId/promotion — route handler entry
app.get('/api/properties/:propertyId/promotion', async (req, res) => {
    // Try block
    try {
        // Constant: const { propertyId } = req.params;
        const { propertyId } = req.params;

        // Query result destructure: const [promo] = await pool.query(
        const [promo] = await pool.query(
            // L545: `SELECT
            `SELECT 
                pr.PromotionId,
                pr.PromotionType,
                pr.DiscountType,
                pr.DiscountValue,
                pr.StartDate as PromoStartDate,
                pr.EndDate as PromoEndDate,
                pr.MinStayDays
            FROM benefits_from bf
            JOIN Promotion pr ON bf.PromotionId = pr.PromotionId
            WHERE bf.PropertyId = ?
            AND CURDATE() BETWEEN pr.StartDate AND pr.EndDate
            LIMIT 1`,
            // L558: [propertyId]
            [propertyId]
        // L559: );
        );

        // If: if (promo.length > 0) {
        if (promo.length > 0) {
            // Send HTTP response
            res.json({ hasPromotion: true, promotion: promo[0] });
        // Else branch
        } else {
            // Send HTTP response
            res.json({ hasPromotion: false, promotion: null });
        // End block
        }

    // Catch errors
    } catch (error) {
        // Console: console.error('Error fetching promotion:', error);
        console.error('Error fetching promotion:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// POST /api/promotions/:promotionId/link-property — route handler entry
app.post('/api/promotions/:promotionId/link-property', async (req, res) => {
    // Try block
    try {
        // Constant: const { promotionId } = req.params;
        const { promotionId } = req.params;
        // Constant: const { propertyId } = req.body;
        const { propertyId } = req.body;

        // Validation guard: if (!promotionId || isNaN(promotionId)) {
        if (!promotionId || isNaN(promotionId)) {
            // HTTP response
            return res.status(400).json({ error: 'Invalid promotion ID' });
        // End block
        }

        // Validation guard: if (!propertyId || isNaN(propertyId)) {
        if (!propertyId || isNaN(propertyId)) {
            // HTTP response
            return res.status(400).json({ error: 'Invalid property ID' });
        // End block
        }

        // Query result destructure: const [promo] = await pool.query(
        const [promo] = await pool.query(
            // SQL statement
            'SELECT PromotionId FROM Promotion WHERE PromotionId = ?',
            // L588: [promotionId]
            [promotionId]
        // L589: );
        );

        // If: if (promo.length === 0) {
        if (promo.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Promotion not found' });
        // End block
        }

        // Query result destructure: const [prop] = await pool.query(
        const [prop] = await pool.query(
            // SQL statement
            'SELECT PropertyId FROM Property WHERE PropertyId = ?',
            // L597: [propertyId]
            [propertyId]
        // L598: );
        );

        // If: if (prop.length === 0) {
        if (prop.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Property not found' });
        // End block
        }

        // Query result destructure: const [existing] = await pool.query(
        const [existing] = await pool.query(
            // SQL statement
            'SELECT * FROM benefits_from WHERE PropertyId = ?',
            // L606: [propertyId]
            [propertyId]
        // L607: );
        );

        // If: if (existing.length > 0) {
        if (existing.length > 0) {
            // Run SQL query
            await pool.query(
                // SQL statement
                'UPDATE benefits_from SET PromotionId = ? WHERE PropertyId = ?',
                // L612: [promotionId, propertyId]
                [promotionId, propertyId]
            // L613: );
            );
        // Else branch
        } else {
            // Run SQL query
            await pool.query(
                // SQL statement
                'INSERT INTO benefits_from (PromotionId, PropertyId, BookingId) VALUES (?, ?, NULL)',
                // L617: [promotionId, propertyId]
                [promotionId, propertyId]
            // L618: );
            );
        // End block
        }

        // Send HTTP response
        res.json({ 
            // L622: message: 'Promotion linked to property successfully',
            message: 'Promotion linked to property successfully',
            // L623: promotionId: promotionId,
            promotionId: promotionId,
            // L624: propertyId: propertyId
            propertyId: propertyId
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('Link promotion error:', error);
        console.error('Link promotion error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// POST /api/features — route handler entry
app.post('/api/features', async (req, res) => {
    // Try block
    try {
        // Constant: const { FeatureName } = req.body;
        const { FeatureName } = req.body;
        // Validation guard: if (!FeatureName || typeof FeatureName !== 'string' || !FeatureNa
        if (!FeatureName || typeof FeatureName !== 'string' || !FeatureName.trim()) {
            // HTTP response
            return res.status(400).json({ error: 'FeatureName is required' });
        // End block
        }
        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            'INSERT INTO Feature (FeatureName) VALUES (?)',
            // L641: [FeatureName.trim()]
            [FeatureName.trim()]
        // L642: );
        );
        // Send HTTP response
        res.status(201).json({ FeatureId: result.insertId, FeatureName: FeatureName.trim() });
    // Catch errors
    } catch (err) {
        // Send HTTP response
        res.status(500).json({ error: err.message });
    // End block
    }
// End handler/callback
});

// DELETE /api/properties/:id — route handler entry
app.delete('/api/properties/:id', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Constant: const { OwnerId } = req.body;
        const { OwnerId } = req.body;

        // Query result destructure: const [existing] = await pool.query(
        const [existing] = await pool.query(
            // SQL statement
            'SELECT OwnerId FROM Property WHERE PropertyId = ?',
            // L656: [id]
            [id]
        // L657: );
        );

        // If: if (existing.length === 0) {
        if (existing.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Property not found' });
        // End block
        }

        // If: if (existing[0].OwnerId !== OwnerId) {
        if (existing[0].OwnerId !== OwnerId) {
            // HTTP response
            return res.status(403).json({ error: 'You can only delete your own properties' });
        // End block
        }

        // Run SQL query
        await pool.query('START TRANSACTION');

        // Try block
        try {
            // Run SQL query
            await pool.query('DELETE FROM Payment_Transaction WHERE PropertyId = ?', [id]);

            // Images are on Cloudinary — just delete DB records, no local file deletion needed
            await pool.query('DELETE FROM PROPERTY_Image WHERE PropertyId = ?', [id]);
            // Run SQL query
            await pool.query('DELETE FROM Booking WHERE PropertyId = ?', [id]);
            // Run SQL query
            await pool.query('DELETE FROM Property WHERE PropertyId = ?', [id]);

            // Run SQL query
            await pool.query('COMMIT');

            // Send HTTP response
            res.json({ message: 'Property and all related records deleted successfully!' });
        // Catch errors
        } catch (error) {
            // Run SQL query
            await pool.query('ROLLBACK');
            // L682: throw error;
            throw error;
        // End block
        }

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// Booking endpoints
app.post('/api/bookings', async (req, res) => {
    // Try block
    try {
        // Constant: const {
        const {
            // L694: UserId, PropertyId, StartDate, EndDate, LengthOfStay,
            UserId, PropertyId, StartDate, EndDate, LengthOfStay,
            // L695: TotalPrice, BasePrice, DiscountAmount, PhoneNumber, BookingStatus
            TotalPrice, BasePrice, DiscountAmount, PhoneNumber, BookingStatus
        // L696: } = req.body;
        } = req.body;

        // Validation guard: if (!UserId || !PropertyId || !StartDate || !EndDate || !LengthOf
        if (!UserId || !PropertyId || !StartDate || !EndDate || !LengthOfStay || !TotalPrice || !BasePrice) {
            // HTTP response
            return res.status(400).json({ error: 'All required fields must be filled' });
        // End block
        }

        // Query result destructure: const [users] = await pool.query(
        const [users] = await pool.query(
            // SQL statement
            'SELECT UserId, UserType FROM USER_a WHERE UserId = ? AND UserType = "Renter"',
            // L704: [UserId]
            [UserId]
        // L705: );
        );

        // If: if (users.length === 0) {
        if (users.length === 0) {
            // HTTP response
            return res.status(403).json({ error: 'Only renters can make bookings' });
        // End block
        }

        // Query result destructure: const [properties] = await pool.query(
        const [properties] = await pool.query(
            // SQL statement
            'SELECT PropertyId, AvailabilityStatus FROM Property WHERE PropertyId = ?',
            // L713: [PropertyId]
            [PropertyId]
        // L714: );
        );

        // If: if (properties.length === 0) {
        if (properties.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Property not found' });
        // End block
        }

        // If: if (properties[0].AvailabilityStatus !== 'Active') {
        if (properties[0].AvailabilityStatus !== 'Active') {
            // HTTP response
            return res.status(400).json({ error: 'Property is not available for booking' });
        // End block
        }

        // Query result destructure: const [existing] = await pool.query(
        const [existing] = await pool.query(
            // SQL statement
            `SELECT BookingId FROM Booking 
             WHERE PropertyId = ? 
             AND BookingStatus != 'Cancelled'
             AND (
                 (StartDate <= ? AND EndDate >= ?) OR
                 (StartDate <= ? AND EndDate >= ?) OR
                 (StartDate >= ? AND EndDate <= ?)
             )`,
            // L733: [PropertyId, StartDate, StartDate, EndDate, EndDate, StartDate, EndDate]
            [PropertyId, StartDate, StartDate, EndDate, EndDate, StartDate, EndDate]
        // L734: );
        );

        // If: if (existing.length > 0) {
        if (existing.length > 0) {
            // HTTP response
            return res.status(400).json({ error: 'Property is already booked for these dates' });
        // End block
        }

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO Booking 
            (UserId, PropertyId, StartDate, EndDate, LengthOfStay, TotalPrice, BookingStatus, PhoneNumber, BasePrice, DiscountAmount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            // L744: [UserId, PropertyId, StartDate, EndDate, LengthOfStay, TotalPrice, BookingStatus || 'Confirmed', Pho
            [UserId, PropertyId, StartDate, EndDate, LengthOfStay, TotalPrice, BookingStatus || 'Confirmed', PhoneNumber, BasePrice, DiscountAmount || 0]
        // L745: );
        );

        // Send HTTP response
        res.status(201).json({
            // L748: message: 'Booking confirmed successfully!',
            message: 'Booking confirmed successfully!',
            // L749: bookingId: result.insertId
            bookingId: result.insertId
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/bookings/user/:userId — route handler entry
app.get('/api/bookings/user/:userId', async (req, res) => {
    // Try block
    try {
        // Constant: const { userId } = req.params;
        const { userId } = req.params;

        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            `SELECT b.*, 
             p.Title as PropertyTitle, p.City, p.Wilaya,
             CONCAT(u.FirstName, ' ', u.LastName) as OwnerName
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             JOIN USER_a u ON p.OwnerId = u.UserId
             WHERE b.UserId = ?
             ORDER BY b.BookingId DESC`,
            // L770: [userId]
            [userId]
        // L771: );
        );

        // Send HTTP response
        res.json(bookings);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// PUT /api/bookings/:id — route handler entry
app.put('/api/bookings/:id', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Constant: const { BookingStatus, UserId } = req.body;
        const { BookingStatus, UserId } = req.body;

        // Query result destructure: const [existing] = await pool.query(
        const [existing] = await pool.query(
            // SQL statement
            `SELECT b.UserId as RenterId, p.OwnerId 
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             WHERE b.BookingId = ?`,
            // L789: [id]
            [id]
        // L790: );
        );

        // If: if (existing.length === 0) {
        if (existing.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Booking not found' });
        // End block
        }

        // If: if (existing[0].RenterId !== UserId && existing[0].OwnerId !== Us
        if (existing[0].RenterId !== UserId && existing[0].OwnerId !== UserId) {
            // HTTP response
            return res.status(403).json({ error: 'You can only modify your own bookings' });
        // End block
        }

        // Run SQL query
        await pool.query(
            // SQL statement
            'UPDATE Booking SET BookingStatus = ? WHERE BookingId = ?',
            // L802: [BookingStatus, id]
            [BookingStatus, id]
        // L803: );
        );

        // Send HTTP response
        res.json({ message: 'Booking updated successfully!' });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// User profile endpoints
app.get('/api/users/:id', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [users] = await pool.query(
        const [users] = await pool.query(
            // SQL statement
            `SELECT UserId, CONCAT(FirstName, ' ', LastName) as FullName,
             FirstName, LastName, Email, PhoneNumber, UserType, 
             IDCardNumber, IDCardFrontPath, AverageRating, TotalReviews
             FROM USER_a 
             WHERE UserId = ?`,
            // L820: [req.params.id]
            [req.params.id]
        // L821: );
        );

        // If: if (users.length === 0) {
        if (users.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'User not found' });
        // End block
        }

        // Constant: const user = users[0];
        const user = users[0];
        // IDCardFrontPath is already a full Cloudinary HTTPS URL
        user.IDCardFrontURL = user.IDCardFrontPath || null;

        // Send HTTP response
        res.json(user);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// PUT /api/users/:id — route handler entry
app.put('/api/users/:id', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Constant: const { UserId, FirstName, LastName, Email, PhoneNumber } = req.body;
        const { UserId, FirstName, LastName, Email, PhoneNumber } = req.body;

        // If: if (parseInt(id) !== UserId) {
        if (parseInt(id) !== UserId) {
            // HTTP response
            return res.status(403).json({ error: 'You can only update your own profile' });
        // End block
        }

        // Query result destructure: const [existing] = await pool.query(
        const [existing] = await pool.query(
            // SQL statement
            'SELECT UserId FROM USER_a WHERE UserId = ?',
            // L848: [id]
            [id]
        // L849: );
        );

        // If: if (existing.length === 0) {
        if (existing.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'User not found' });
        // End block
        }

        // If: if (Email) {
        if (Email) {
            // Query result destructure: const [emailCheck] = await pool.query(
            const [emailCheck] = await pool.query(
                // SQL statement
                'SELECT UserId FROM USER_a WHERE Email = ? AND UserId != ?',
                // L858: [Email, id]
                [Email, id]
            // L859: );
            );

            // If: if (emailCheck.length > 0) {
            if (emailCheck.length > 0) {
                // HTTP response
                return res.status(400).json({ error: 'Email already in use' });
            // End block
            }
        // End block
        }

        // Run SQL query
        await pool.query(
            // SQL statement
            `UPDATE USER_a 
             SET FirstName = ?, LastName = ?, Email = ?, PhoneNumber = ?
             WHERE UserId = ?`,
            // L870: [FirstName, LastName, Email, PhoneNumber, id]
            [FirstName, LastName, Email, PhoneNumber, id]
        // L871: );
        );

        // Send HTTP response
        res.json({ message: 'Profile updated successfully!' });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// DELETE /api/users/:id — route handler entry
app.delete('/api/users/:id', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Constant: const { UserId } = req.body;
        const { UserId } = req.body;

        // If: if (parseInt(id) !== UserId) {
        if (parseInt(id) !== UserId) {
            // HTTP response
            return res.status(403).json({ error: 'You can only delete your own account' });
        // End block
        }

        // Query result destructure: const [existing] = await pool.query(
        const [existing] = await pool.query(
            // SQL statement
            'SELECT UserId, UserType, IDCardFrontPath FROM USER_a WHERE UserId = ?',
            // L890: [id]
            [id]
        // L891: );
        );

        // If: if (existing.length === 0) {
        if (existing.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'User not found' });
        // End block
        }

        // Constant: const user = existing[0];
        const user = existing[0];

        // If: if (user.UserType === 'Owner') {
        if (user.UserType === 'Owner') {
            // Query result destructure: const [properties] = await pool.query(
            const [properties] = await pool.query(
                // SQL statement
                'SELECT PropertyId FROM Property WHERE OwnerId = ?',
                // L902: [id]
                [id]
            // L903: );
            );

            // Loop: for (const property of properties) {
            for (const property of properties) {
                // Images are on Cloudinary — just delete DB records
                await pool.query('DELETE FROM PROPERTY_Image WHERE PropertyId = ?', [property.PropertyId]);
            // End block
            }

            // Run SQL query
            await pool.query('DELETE FROM Property WHERE OwnerId = ?', [id]);
        // End block
        }

        // If: if (user.UserType === 'Renter') {
        if (user.UserType === 'Renter') {
            // Run SQL query
            await pool.query('DELETE FROM Booking WHERE UserId = ?', [id]);
        // End block
        }

        // IDCardFrontPath is a Cloudinary URL — no local file to delete
        await pool.query('DELETE FROM USER_a WHERE UserId = ?', [id]);

        // Send HTTP response
        res.json({ message: 'Account deleted successfully' });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// ============================================
// PAYMENT ENDPOINTS - CHARGILY INTEGRATION
// ============================================

// GET /api/packages — route handler entry
app.get('/api/packages', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [packages] = await pool.query(
        const [packages] = await pool.query(
            // SQL statement
            'SELECT * FROM AdvertPackage ORDER BY Price ASC'
        // L934: );
        );
        // Send HTTP response
        res.json(packages);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// POST /api/payment/create-checkout — route handler entry
app.post('/api/payment/create-checkout', async (req, res) => {
    // Try block
    try {
        // Constant: const { propertyId, packageId, ownerId } = req.body;
        const { propertyId, packageId, ownerId } = req.body;

        // Console: console.log('💳 Creating checkout:', { propertyId, packageId, ownerId 
        console.log('💳 Creating checkout:', { propertyId, packageId, ownerId });

        // Validation guard: if (!propertyId || !packageId || !ownerId) {
        if (!propertyId || !packageId || !ownerId) {
            // HTTP response
            return res.status(400).json({ error: 'Missing required fields' });
        // End block
        }

        // Query result destructure: const [packages] = await pool.query(
        const [packages] = await pool.query(
            // SQL statement
            'SELECT * FROM AdvertPackage WHERE PackageId = ?',
            // L953: [packageId]
            [packageId]
        // L954: );
        );

        // If: if (packages.length === 0) {
        if (packages.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Package not found' });
        // End block
        }

        // Constant: const pkg = packages[0];
        const pkg = packages[0];

        // Query result destructure: const [owners] = await pool.query(
        const [owners] = await pool.query(
            // SQL statement
            'SELECT Email, PhoneNumber, CONCAT(FirstName, " ", LastName) as FullName FROM USER_a WHERE UserId = ?',
            // L964: [ownerId]
            [ownerId]
        // L965: );
        );

        // If: if (owners.length === 0) {
        if (owners.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Owner not found' });
        // End block
        }

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO Payment_Transaction 
            (PropertyId, OwnerId, PackageId, Amount, PaymentMethod, PaymentStatus)
            VALUES (?, ?, ?, ?, 'Chargily', 'Pending')`,
            // L975: [propertyId, ownerId, packageId, pkg.Price]
            [propertyId, ownerId, packageId, pkg.Price]
        // L976: );
        );

        // Constant: const dbTransactionId = result.insertId;
        const dbTransactionId = result.insertId;
        // Constant: const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        
        // Constant: const checkoutData = {
        const checkoutData = {
            // L982: amount: Math.round(pkg.Price * 100),
            amount: Math.round(pkg.Price * 100),
            // L983: currency: 'dzd',
            currency: 'dzd',
            // L984: success_url: `${CLIENT_URL}/payment-success.html?propertyId=${propertyId}`,
            success_url: `${CLIENT_URL}/payment-success.html?propertyId=${propertyId}`,  
            // L985: failure_url: `${CLIENT_URL}/payment-failed.html?propertyId=${propertyId}`,
            failure_url: `${CLIENT_URL}/payment-failed.html?propertyId=${propertyId}`,   
            // L986: description: `${pkg.PackageName} - Property ${propertyId}`,
            description: `${pkg.PackageName} - Property ${propertyId}`,
            // L987: locale: 'ar'
            locale: 'ar'
        // End statement
        };

        // Console: console.log('📤 Sending to Chargily:', checkoutData);
        console.log('📤 Sending to Chargily:', checkoutData);

        // Constant: const checkout = await chargily.createCheckout(checkoutData);
        const checkout = await chargily.createCheckout(checkoutData);

        // Console: console.log('✅ Checkout created:', checkout.id);
        console.log('✅ Checkout created:', checkout.id);

        // Run SQL query
        await pool.query(
            // SQL statement
            'UPDATE Payment_Transaction SET TransactionReference = ? WHERE TransactionId = ?',
            // L998: [checkout.id, dbTransactionId]
            [checkout.id, dbTransactionId]
        // L999: );
        );

        // Send HTTP response
        res.json({
            // L1002: success: true,
            success: true,
            // L1003: checkoutId: checkout.id,
            checkoutId: checkout.id,
            // L1004: checkoutUrl: checkout.checkout_url
            checkoutUrl: checkout.checkout_url
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('❌ Checkout error:', error);
        console.error('❌ Checkout error:', error);
        // Send HTTP response
        res.status(500).json({ 
            // L1010: error: 'Failed to create checkout',
            error: 'Failed to create checkout',
            // L1011: details: error.message
            details: error.message 
        // End handler/callback
        });
    // End block
    }
// End handler/callback
});

// GET /api/payment/status/:checkoutId — route handler entry
app.get('/api/payment/status/:checkoutId', async (req, res) => {
    // Try block
    try {
        // Constant: const { checkoutId } = req.params;
        const { checkoutId } = req.params;

        // Query result destructure: const [transactions] = await pool.query(
        const [transactions] = await pool.query(
            // SQL statement
            `SELECT pt.*, pkg.PackageName, pkg.PackageType
             FROM Payment_Transaction pt
             JOIN AdvertPackage pkg ON pt.PackageId = pkg.PackageId
             WHERE pt.TransactionReference = ?`,
            // L1025: [checkoutId]
            [checkoutId]
        // L1026: );
        );

        // If: if (transactions.length === 0) {
        if (transactions.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Transaction not found' });
        // End block
        }

        // Constant: const transaction = transactions[0];
        const transaction = transactions[0];

        // Send HTTP response
        res.json({
            // L1035: success: true,
            success: true,
            // L1036: status: transaction.PaymentStatus,
            status: transaction.PaymentStatus,
            // L1037: amount: transaction.Amount,
            amount: transaction.Amount,
            // L1038: package: transaction.PackageName,
            package: transaction.PackageName,
            // L1039: expiryDate: transaction.ExpiryDate
            expiryDate: transaction.ExpiryDate
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/payments/owner/:ownerId — route handler entry
app.get('/api/payments/owner/:ownerId', async (req, res) => {
    // Try block
    try {
        // Constant: const { ownerId } = req.params;
        const { ownerId } = req.params;

        // Query result destructure: const [payments] = await pool.query(
        const [payments] = await pool.query(
            // SQL statement
            `SELECT pt.*, 
             pkg.PackageName, pkg.PackageType,
             p.Title as PropertyTitle
             FROM Payment_Transaction pt
             JOIN AdvertPackage pkg ON pt.PackageId = pkg.PackageId
             JOIN Property p ON pt.PropertyId = p.PropertyId
             WHERE pt.OwnerId = ?
             ORDER BY pt.PaymentDate DESC`,
            // L1060: [ownerId]
            [ownerId]
        // L1061: );
        );

        // Send HTTP response
        res.json(payments);

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/test-chargily-custom — route handler entry
app.get('/api/test-chargily-custom', async (req, res) => {
    // Try block
    try {
        // Constant: const apiKey = process.env.CHARGILY_SECRET_KEY;
        const apiKey = process.env.CHARGILY_SECRET_KEY;
        // Constant: const baseURL = 'https://pay.chargily.net/api/v2';
        const baseURL = 'https://pay.chargily.net/api/v2';
        // Constant: const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        // Constant: const testData = {
        const testData = {
            // L1076: amount: 10000,
            amount: 10000,
            // L1077: currency: "dzd",
            currency: "dzd",
            // L1078: success_url: `${CLIENT_URL}/payment-success.html`,
            success_url: `${CLIENT_URL}/payment-success.html`,
            // L1079: failure_url: `${CLIENT_URL}/payment-failed.html`,
            failure_url: `${CLIENT_URL}/payment-failed.html`,
            // L1080: description: "Test Payment",
            description: "Test Payment",
            // L1081: customer_email: "test@example.com"
            customer_email: "test@example.com"
        // End statement
        };
        
        // Constant: const response = await fetch(`${baseURL}/checkouts`, {
        const response = await fetch(`${baseURL}/checkouts`, {
            // L1085: method: 'POST',
            method: 'POST',
            // L1086: headers: {
            headers: {
                // L1087: 'Content-Type': 'application/json',
                'Content-Type': 'application/json',
                // L1088: 'Authorization': `Bearer ${apiKey}`
                'Authorization': `Bearer ${apiKey}`
            // L1089: },
            },
            // L1090: body: JSON.stringify(testData)
            body: JSON.stringify(testData)
        // End handler/callback
        });

        // Constant: const data = await response.json();
        const data = await response.json();
        
        // Send HTTP response
        res.json({
            // L1096: success: response.ok,
            success: response.ok,
            // L1097: status: response.status,
            status: response.status,
            // L1098: data: data
            data: data
        // End handler/callback
        });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.json({ success: false, error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/test-chargily-new — route handler entry
app.get('/api/test-chargily-new', async (req, res) => {
    // Try block
    try {
        // Constant: const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        // Constant: const testData = {
        const testData = {
            // L1109: amount: 5000,
            amount: 5000,
            // L1110: currency: "dzd",
            currency: "dzd",
            // L1111: success_url: `${CLIENT_URL}/payment-success.html`,
            success_url: `${CLIENT_URL}/payment-success.html`,
            // L1112: failure_url: `${CLIENT_URL}/payment-failed.html`,
            failure_url: `${CLIENT_URL}/payment-failed.html`,
            // L1113: description: "Test Payment",
            description: "Test Payment",
            // L1114: locale: "en"
            locale: "en"
        // End statement
        };
        
        // Console: console.log('🧪 Testing Chargily with:', testData);
        console.log('🧪 Testing Chargily with:', testData);
        
        // Constant: const checkout = await chargily.createCheckout(testData);
        const checkout = await chargily.createCheckout(testData);
        
        // Send HTTP response
        res.json({
            // L1122: success: true,
            success: true,
            // L1123: message: 'Chargily API works!',
            message: 'Chargily API works!',
            // L1124: checkout: checkout
            checkout: checkout
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('❌ Test error:', error);
        console.error('❌ Test error:', error);
        // Send HTTP response
        res.json({ 
            // L1130: success: false,
            success: false, 
            // L1131: error: error.message,
            error: error.message,
            // L1132: stack: error.stack
            stack: error.stack
        // End handler/callback
        });
    // End block
    }
// End handler/callback
});

// GET /api/properties — route handler entry
app.get('/api/properties', async (req, res) => {
    // Try block
    try {
        // Console: console.log('🔄 Checking for expired packages...');
        console.log('🔄 Checking for expired packages...');
        
        // Query result destructure: const [featuredReset] = await pool.query(`
        const [featuredReset] = await pool.query(`
            UPDATE Property 
            SET IsFeatured = FALSE 
            WHERE IsFeatured = TRUE 
            AND FeaturedUntil IS NOT NULL 
            AND FeaturedUntil < CURDATE()
        `);
        // Console: console.log(`✅ Reset ${featuredReset.affectedRows} expired Featured pr
        console.log(`✅ Reset ${featuredReset.affectedRows} expired Featured properties`);
        
        // Query result destructure: const [boostedReset] = await pool.query(`
        const [boostedReset] = await pool.query(`
            UPDATE Property 
            SET IsBoosted = FALSE 
            WHERE IsBoosted = TRUE 
            AND BoostedUntil IS NOT NULL 
            AND BoostedUntil < CURDATE()
        `);
        // Console: console.log(`✅ Reset ${boostedReset.affectedRows} expired Boosted prop
        console.log(`✅ Reset ${boostedReset.affectedRows} expired Boosted properties`);

        // Query result destructure: const [properties] = await pool.query(
        const [properties] = await pool.query(
            // SQL statement
            `SELECT p.PropertyId, p.Title, p.Description, p.City, p.Wilaya, p.OwnerId,
               p.PropertyType, p.PricePerNight, p.NumofRooms, p.AvailabilityStatus,
               p.IsFeatured, p.IsBoosted, p.ViewCount,
               p.AverageRating, p.TotalReviews,
               CONCAT(u.FirstName, ' ', u.LastName) as OwnerName,
               u.AverageRating as OwnerRating,
               u.TotalReviews as OwnerTotalReviews,
               u.Email as OwnerEmail,
               pr.PromotionId,
               pr.PromotionType,
               pr.DiscountType,
               pr.DiscountValue,
               pr.StartDate as PromoStartDate,
               pr.EndDate as PromoEndDate,
               CASE 
                   WHEN pr.PromotionId IS NOT NULL 
                   AND CURDATE() BETWEEN pr.StartDate AND pr.EndDate 
                   THEN 1
                   ELSE 0
               END as HasPromotion,
               CASE 
                   WHEN pr.DiscountType = 'Percentage' 
                   THEN pr.DiscountValue 
                   ELSE 0 
               END as DiscountPercentage,
               CASE 
                   WHEN pr.DiscountType = 'FixedAmount' 
                   THEN pr.DiscountValue 
                   ELSE 0 
               END as DiscountAmount
             FROM Property p
             JOIN USER_a u ON p.OwnerId = u.UserId
             LEFT JOIN benefits_from bf ON p.PropertyId = bf.PropertyId  
             LEFT JOIN Promotion pr ON bf.PromotionId = pr.PromotionId 
                 AND CURDATE() BETWEEN pr.StartDate AND pr.EndDate
             WHERE p.AvailabilityStatus = 'Active'
             GROUP BY p.PropertyId, pr.PromotionId, pr.PromotionType, pr.DiscountType, pr.DiscountValue, pr.StartDate, pr.EndDate
             ORDER BY HasPromotion DESC, p.IsFeatured DESC, p.IsBoosted DESC, p.ViewCount DESC, p.PropertyId DESC`
        // L1198: );
        );

        // Console: console.log(`📊 Found ${properties.length} properties`);
        console.log(`📊 Found ${properties.length} properties`);

        // Loop: for (let property of properties) {
        for (let property of properties) {
            // Query result destructure: const [images] = await pool.query(
            const [images] = await pool.query(
                // SQL statement
                'SELECT ImageURL FROM PROPERTY_Image WHERE PropertyId = ? ORDER BY ImageId ASC LIMIT 1',
                // L1205: [property.PropertyId]
                [property.PropertyId]
            // L1206: );
            );
            
            // ImageURL is already a full Cloudinary HTTPS URL — use directly
            property.MainImage = images.length > 0 ? images[0].ImageURL : null;

            // Query result destructure: const [feats] = await pool.query(
            const [feats] = await pool.query(
                // SQL statement
                `SELECT f.FeatureId, f.FeatureName
                 FROM Feature f
                 JOIN has_features hf ON f.FeatureId = hf.FeatureId
                 WHERE hf.PropertyId = ?`,
                // L1216: [property.PropertyId]
                [property.PropertyId]
            // L1217: );
            );
            // L1218: property.Features = feats;
            property.Features = feats;
            // L1219: property.HasPromotion = property.HasPromotion === 1;
            property.HasPromotion = property.HasPromotion === 1;
        // End block
        }

        // Send HTTP response
        res.json(properties);
    // Catch errors
    } catch (error) {
        // Console: console.error('❌ Get properties error:', error);
        console.error('❌ Get properties error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// ============================================
// CHAT/MESSAGING ENDPOINTS
// ============================================

// POST /api/messages — route handler entry
app.post('/api/messages', async (req, res) => {
    // Try block
    try {
        // Constant: const { senderId, receiverId, propertyId, messageText } = req.body;
        const { senderId, receiverId, propertyId, messageText } = req.body;

        // Validation guard: if (!senderId || !receiverId || !messageText) {
        if (!senderId || !receiverId || !messageText) {
            // HTTP response
            return res.status(400).json({ error: 'Missing required fields' });
        // End block
        }

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO Message (SenderId, ReceiverId, PropertyId, MessageText)
             VALUES (?, ?, ?, ?)`,
            // L1244: [senderId, receiverId, propertyId, messageText]
            [senderId, receiverId, propertyId, messageText]
        // L1245: );
        );

        // Query result destructure: const [users] = await pool.query(
        const [users] = await pool.query(
            // SQL statement
            'SELECT UserId, UserType FROM USER_a WHERE UserId IN (?, ?)',
            // L1249: [senderId, receiverId]
            [senderId, receiverId]
        // L1250: );
        );

        // Constant: const sender = users.find(u => u.UserId === parseInt(senderId));
        const sender = users.find(u => u.UserId === parseInt(senderId));

        // Variable: let renterId, ownerId;
        let renterId, ownerId;
        // If: if (sender.UserType === 'Renter') {
        if (sender.UserType === 'Renter') {
            // L1256: renterId = senderId;
            renterId = senderId;
            // L1257: ownerId = receiverId;
            ownerId = receiverId;
        // Else branch
        } else {
            // L1259: renterId = receiverId;
            renterId = receiverId;
            // L1260: ownerId = senderId;
            ownerId = senderId;
        // End block
        }

        // Run SQL query
        await pool.query(
            // SQL statement
            `INSERT INTO Conversation (RenterId, OwnerId, PropertyId, LastMessageAt)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE LastMessageAt = NOW()`,
            // L1267: [renterId, ownerId, propertyId]
            [renterId, ownerId, propertyId]
        // L1268: );
        );

        // Send HTTP response
        res.status(201).json({
            // L1271: message: 'Message sent successfully',
            message: 'Message sent successfully',
            // L1272: messageId: result.insertId
            messageId: result.insertId
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('Send message error:', error);
        console.error('Send message error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/messages/:userId/:otherUserId — route handler entry
app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
    // Try block
    try {
        // Constant: const { userId, otherUserId } = req.params;
        const { userId, otherUserId } = req.params;
        // Constant: const { propertyId } = req.query;
        const { propertyId } = req.query;

        // Variable: let query = `
        let query = `
            SELECT m.*, 
            CONCAT(sender.FirstName, ' ', sender.LastName) as SenderName,
            sender.UserType as SenderType,
            CONCAT(receiver.FirstName, ' ', receiver.LastName) as ReceiverName
            FROM Message m
            JOIN USER_a sender ON m.SenderId = sender.UserId
            JOIN USER_a receiver ON m.ReceiverId = receiver.UserId
            WHERE ((m.SenderId = ? AND m.ReceiverId = ?) OR (m.SenderId = ? AND m.ReceiverId = ?))
        `;
        
        // Constant: const params = [userId, otherUserId, otherUserId, userId];
        const params = [userId, otherUserId, otherUserId, userId];

        // If: if (propertyId) {
        if (propertyId) {
            // L1300: query += ' AND m.PropertyId = ?';
            query += ' AND m.PropertyId = ?';
            // L1301: params.push(propertyId);
            params.push(propertyId);
        // End block
        }

        // L1304: query += ' ORDER BY m.SentAt ASC';
        query += ' ORDER BY m.SentAt ASC';

        // Query result destructure: const [messages] = await pool.query(query, params);
        const [messages] = await pool.query(query, params);

        // Run SQL query
        await pool.query(
            // SQL statement
            `UPDATE Message 
             SET IsRead = TRUE 
             WHERE ReceiverId = ? AND SenderId = ? AND IsRead = FALSE`,
            // L1312: [userId, otherUserId]
            [userId, otherUserId]
        // L1313: );
        );

        // Send HTTP response
        res.json(messages);

    // Catch errors
    } catch (error) {
        // Console: console.error('Get messages error:', error);
        console.error('Get messages error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/conversations/:userId — route handler entry
app.get('/api/conversations/:userId', async (req, res) => {
    // Try block
    try {
        // Constant: const { userId } = req.params;
        const { userId } = req.params;

        // Query result destructure: const [user] = await pool.query(
        const [user] = await pool.query(
            // SQL statement
            'SELECT UserType FROM USER_a WHERE UserId = ?',
            // L1329: [userId]
            [userId]
        // L1330: );
        );

        // If: if (user.length === 0) {
        if (user.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'User not found' });
        // End block
        }

        // Constant: const userType = user[0].UserType;
        const userType = user[0].UserType;

        // Variable: let query;
        let query;
        // If: if (userType === 'Renter') {
        if (userType === 'Renter') {
            // L1340: query = `
            query = `
                SELECT c.*, 
                CONCAT(owner.FirstName, ' ', owner.LastName) as OtherUserName,
                owner.Email as OtherUserEmail,
                p.Title as PropertyTitle,
                (SELECT COUNT(*) FROM Message 
                 WHERE ReceiverId = ? AND SenderId = c.OwnerId AND IsRead = FALSE) as UnreadCount
                FROM Conversation c
                JOIN USER_a owner ON c.OwnerId = owner.UserId
                LEFT JOIN Property p ON c.PropertyId = p.PropertyId
                WHERE c.RenterId = ?
                ORDER BY c.LastMessageAt DESC
            `;
        // Else branch
        } else {
            // L1354: query = `
            query = `
                SELECT c.*, 
                CONCAT(renter.FirstName, ' ', renter.LastName) as OtherUserName,
                renter.Email as OtherUserEmail,
                p.Title as PropertyTitle,
                (SELECT COUNT(*) FROM Message 
                 WHERE ReceiverId = ? AND SenderId = c.RenterId AND IsRead = FALSE) as UnreadCount
                FROM Conversation c
                JOIN USER_a renter ON c.RenterId = renter.UserId
                LEFT JOIN Property p ON c.PropertyId = p.PropertyId
                WHERE c.OwnerId = ?
                ORDER BY c.LastMessageAt DESC
            `;
        // End block
        }

        // Query result destructure: const [conversations] = await pool.query(query, [userId, userId]);
        const [conversations] = await pool.query(query, [userId, userId]);

        // Send HTTP response
        res.json(conversations);

    // Catch errors
    } catch (error) {
        // Console: console.error('Get conversations error:', error);
        console.error('Get conversations error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/messages/unread/:userId — route handler entry
app.get('/api/messages/unread/:userId', async (req, res) => {
    // Try block
    try {
        // Constant: const { userId } = req.params;
        const { userId } = req.params;

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            'SELECT COUNT(*) as count FROM Message WHERE ReceiverId = ? AND IsRead = FALSE',
            // L1385: [userId]
            [userId]
        // L1386: );
        );

        // Send HTTP response
        res.json({ unreadCount: result[0].count });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/properties/:propertyId/owner — route handler entry
app.get('/api/properties/:propertyId/owner', async (req, res) => {
    // Try block
    try {
        // Constant: const { propertyId } = req.params;
        const { propertyId } = req.params;

        // Query result destructure: const [properties] = await pool.query(
        const [properties] = await pool.query(
            // SQL statement
            `SELECT p.OwnerId, 
             CONCAT(u.FirstName, ' ', u.LastName) as OwnerName,
             u.Email as OwnerEmail,
             u.PhoneNumber as OwnerPhone
             FROM Property p
             JOIN USER_a u ON p.OwnerId = u.UserId
             WHERE p.PropertyId = ?`,
            // L1407: [propertyId]
            [propertyId]
        // L1408: );
        );

        // If: if (properties.length === 0) {
        if (properties.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Property not found' });
        // End block
        }

        // Send HTTP response
        res.json(properties[0]);

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// ============================================
// REVIEW ENDPOINTS
// ============================================

// POST /api/reviews — route handler entry
app.post('/api/reviews', async (req, res) => {
    // Try block
    try {
        // Constant: const { reviewerId, reviewedUserId, propertyId, bookingId, rating, comment,
        const { reviewerId, reviewedUserId, propertyId, bookingId, rating, comment, reviewerType, reviewedRole } = req.body;

        // Validation guard: if (!reviewerId || !reviewedUserId || !rating || !reviewerType ||
        if (!reviewerId || !reviewedUserId || !rating || !reviewerType || !reviewedRole) {
            // HTTP response
            return res.status(400).json({ error: 'Missing required fields' });
        // End block
        }

        // If: if (rating < 1 || rating > 5) {
        if (rating < 1 || rating > 5) {
            // HTTP response
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        // End block
        }

        // If: if (bookingId) {
        if (bookingId) {
            // Query result destructure: const [existing] = await pool.query(
            const [existing] = await pool.query(
                // SQL statement
                'SELECT ReviewId FROM Review WHERE ReviewerId = ? AND BookingId = ? AND ReviewedUserId = ?',
                // L1440: [reviewerId, bookingId, reviewedUserId]
                [reviewerId, bookingId, reviewedUserId]
            // L1441: );
            );

            // If: if (existing.length > 0) {
            if (existing.length > 0) {
                // HTTP response
                return res.status(400).json({ error: 'You have already reviewed this booking' });
            // End block
            }
        // End block
        }

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO Review (ReviewerId, ReviewedUserId, PropertyId, BookingId, Rating, Comment, ReviewerType, ReviewedRole)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            // L1451: [reviewerId, reviewedUserId, propertyId, bookingId, rating, comment, reviewerType, reviewedRole]
            [reviewerId, reviewedUserId, propertyId, bookingId, rating, comment, reviewerType, reviewedRole]
        // L1452: );
        );

        // Await: await updateUserRating(reviewedUserId);
        await updateUserRating(reviewedUserId);
        // If: if (propertyId) {
        if (propertyId) {
            // Await: await updatePropertyRating(propertyId);
            await updatePropertyRating(propertyId);
        // End block
        }

        // Send HTTP response
        res.status(201).json({
            // L1460: message: 'Review submitted successfully',
            message: 'Review submitted successfully',
            // L1461: reviewId: result.insertId
            reviewId: result.insertId
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('Submit review error:', error);
        console.error('Submit review error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/reviews/user/:userId — route handler entry
app.get('/api/reviews/user/:userId', async (req, res) => {
    // Try block
    try {
        // Constant: const { userId } = req.params;
        const { userId } = req.params;

        // Query result destructure: const [reviews] = await pool.query(
        const [reviews] = await pool.query(
            // SQL statement
            `SELECT r.*, 
             CONCAT(reviewer.FirstName, ' ', reviewer.LastName) as ReviewerName,
             p.Title as PropertyTitle
             FROM Review r
             JOIN USER_a reviewer ON r.ReviewerId = reviewer.UserId
             LEFT JOIN Property p ON r.PropertyId = p.PropertyId
             WHERE r.ReviewedUserId = ?
             ORDER BY r.ReviewDate DESC`,
            // L1483: [userId]
            [userId]
        // L1484: );
        );

        // Query result destructure: const [stats] = await pool.query(
        const [stats] = await pool.query(
            // SQL statement
            'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE ReviewedUserId = ?',
            // L1488: [userId]
            [userId]
        // L1489: );
        );

        // Send HTTP response
        res.json({
            // L1492: reviews: reviews,
            reviews: reviews,
            // L1493: averageRating: parseFloat(stats[0].avgRating) || 0,
            averageRating: parseFloat(stats[0].avgRating) || 0,
            // L1494: totalReviews: parseInt(stats[0].totalReviews) || 0
            totalReviews: parseInt(stats[0].totalReviews) || 0
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/reviews/property/:propertyId — route handler entry
app.get('/api/reviews/property/:propertyId', async (req, res) => {
    // Try block
    try {
        // Constant: const { propertyId } = req.params;
        const { propertyId } = req.params;

        // Query result destructure: const [reviews] = await pool.query(
        const [reviews] = await pool.query(
            // SQL statement
            `SELECT r.*, 
             CONCAT(reviewer.FirstName, ' ', reviewer.LastName) as ReviewerName
             FROM Review r
             JOIN USER_a reviewer ON r.ReviewerId = reviewer.UserId
             WHERE r.PropertyId = ? AND r.ReviewedRole = 'Property'
             ORDER BY r.ReviewDate DESC`,
            // L1513: [propertyId]
            [propertyId]
        // L1514: );
        );

        // Query result destructure: const [stats] = await pool.query(
        const [stats] = await pool.query(
            // SQL statement
            'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE PropertyId = ? AND ReviewedRole = "Property"',
            // L1518: [propertyId]
            [propertyId]
        // L1519: );
        );

        // Send HTTP response
        res.json({
            // L1522: reviews: reviews,
            reviews: reviews,
            // L1523: averageRating: parseFloat(stats[0].avgRating) || 0,
            averageRating: parseFloat(stats[0].avgRating) || 0,
            // L1524: totalReviews: parseInt(stats[0].totalReviews) || 0
            totalReviews: parseInt(stats[0].totalReviews) || 0
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/reviews/by-user/:userId — route handler entry
app.get('/api/reviews/by-user/:userId', async (req, res) => {
    // Try block
    try {
        // Constant: const { userId } = req.params;
        const { userId } = req.params;

        // Query result destructure: const [reviews] = await pool.query(
        const [reviews] = await pool.query(
            // SQL statement
            `SELECT r.*, 
             CONCAT(reviewed.FirstName, ' ', reviewed.LastName) as ReviewedUserName,
             p.Title as PropertyTitle
             FROM Review r
             JOIN USER_a reviewed ON r.ReviewedUserId = reviewed.UserId
             LEFT JOIN Property p ON r.PropertyId = p.PropertyId
             WHERE r.ReviewerId = ?
             ORDER BY r.ReviewDate DESC`,
            // L1545: [userId]
            [userId]
        // L1546: );
        );

        // Send HTTP response
        res.json({ reviews: reviews });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/bookings/:bookingId/can-review — route handler entry
app.get('/api/bookings/:bookingId/can-review', async (req, res) => {
    // Try block
    try {
        // Constant: const { bookingId } = req.params;
        const { bookingId } = req.params;
        // Constant: const { userId } = req.query;
        const { userId } = req.query;

        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            `SELECT b.*, p.OwnerId, p.Title as PropertyTitle
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             WHERE b.BookingId = ?`,
            // L1565: [bookingId]
            [bookingId]
        // L1566: );
        );

        // If: if (bookings.length === 0) {
        if (bookings.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Booking not found' });
        // End block
        }

        // Constant: const booking = bookings[0];
        const booking = bookings[0];
        // Constant: const isCompleted = booking.BookingStatus === 'Completed' || new Date(booki
        const isCompleted = booking.BookingStatus === 'Completed' || new Date(booking.EndDate) < new Date();

        // Validation guard: if (!isCompleted) {
        if (!isCompleted) {
            // HTTP response
            return res.json({ canReview: false, reason: 'Booking not completed yet' });
        // End block
        }

        // Query result destructure: const [existingProperty] = await pool.query(
        const [existingProperty] = await pool.query(
            // SQL statement
            'SELECT ReviewId FROM Review WHERE ReviewerId = ? AND BookingId = ? AND ReviewedRole = "Property"',
            // L1581: [userId, bookingId]
            [userId, bookingId]
        // L1582: );
        );

        // Query result destructure: const [existingOwner] = await pool.query(
        const [existingOwner] = await pool.query(
            // SQL statement
            'SELECT ReviewId FROM Review WHERE ReviewerId = ? AND BookingId = ? AND ReviewedUserId = ?',
            // L1586: [userId, bookingId, booking.OwnerId]
            [userId, bookingId, booking.OwnerId]
        // L1587: );
        );

        // Send HTTP response
        res.json({ 
            // L1590: canReview: true,
            canReview: true,
            // L1591: canReviewProperty: existingProperty.length === 0,
            canReviewProperty: existingProperty.length === 0,
            // L1592: canReviewOwner: existingOwner.length === 0,
            canReviewOwner: existingOwner.length === 0,
            // L1593: booking: booking
            booking: booking 
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/bookings/property/:propertyId — route handler entry
app.get('/api/bookings/property/:propertyId', async (req, res) => {
    // Try block
    try {
        // Constant: const { propertyId } = req.params;
        const { propertyId } = req.params;

        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            `SELECT b.*, 
             CONCAT(u.FirstName, ' ', u.LastName) as RenterName,
             u.PhoneNumber
             FROM Booking b
             JOIN USER_a u ON b.UserId = u.UserId
             WHERE b.PropertyId = ?
             ORDER BY b.StartDate DESC`,
            // L1613: [propertyId]
            [propertyId]
        // L1614: );
        );

        // Send HTTP response
        res.json(bookings);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/bookings/:id — route handler entry
app.get('/api/bookings/:id', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            'SELECT * FROM Booking WHERE BookingId = ?',
            // L1626: [req.params.id]
            [req.params.id]
        // L1627: );
        );
        
        // If: if (bookings.length === 0) {
        if (bookings.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Booking not found' });
        // End block
        }
        
        // Send HTTP response
        res.json(bookings[0]);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// Helper functions
async function updateUserRating(userId) {
    // Query result destructure: const [stats] = await pool.query(
    const [stats] = await pool.query(
        // SQL statement
        'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE ReviewedUserId = ?',
        // L1643: [userId]
        [userId]
    // L1644: );
    );
    // Run SQL query
    await pool.query(
        // SQL statement
        'UPDATE USER_a SET AverageRating = ?, TotalReviews = ? WHERE UserId = ?',
        // L1647: [stats[0].avgRating || 0, stats[0].totalReviews || 0, userId]
        [stats[0].avgRating || 0, stats[0].totalReviews || 0, userId]
    // L1648: );
    );
// End block
}

// Async function: async function updatePropertyRating(propertyId) {
async function updatePropertyRating(propertyId) {
    // Query result destructure: const [stats] = await pool.query(
    const [stats] = await pool.query(
        // SQL statement
        'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE PropertyId = ? AND ReviewedRole = "Property"',
        // L1654: [propertyId]
        [propertyId]
    // L1655: );
    );
    // Run SQL query
    await pool.query(
        // SQL statement
        'UPDATE Property SET AverageRating = ?, TotalReviews = ? WHERE PropertyId = ?',
        // L1658: [stats[0].avgRating || 0, stats[0].totalReviews || 0, propertyId]
        [stats[0].avgRating || 0, stats[0].totalReviews || 0, propertyId]
    // L1659: );
    );
// End block
}

// ============================================
// BOOKING PAYMENT ENDPOINTS
// ============================================

// POST /api/payment/create-booking-payment — route handler entry
app.post('/api/payment/create-booking-payment', async (req, res) => {
    // Try block
    try {
        // Constant: const { bookingId } = req.body;
        const { bookingId } = req.body;

        // Console: console.log('💳 Creating booking payment for:', bookingId);
        console.log('💳 Creating booking payment for:', bookingId);

        // Validation guard: if (!bookingId) {
        if (!bookingId) {
            // HTTP response
            return res.status(400).json({ error: 'Booking ID is required' });
        // End block
        }

        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            `SELECT b.*, 
             p.Title as PropertyTitle,
             p.PricePerNight,
             CONCAT(renter.FirstName, ' ', renter.LastName) as RenterName,
             renter.Email as RenterEmail,
             CONCAT(owner.FirstName, ' ', owner.LastName) as OwnerName,
             p.OwnerId
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             JOIN USER_a renter ON b.UserId = renter.UserId
             JOIN USER_a owner ON p.OwnerId = owner.UserId
             WHERE b.BookingId = ?`,
            // L1689: [bookingId]
            [bookingId]
        // L1690: );
        );

        // If: if (bookings.length === 0) {
        if (bookings.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Booking not found' });
        // End block
        }

        // Constant: const booking = bookings[0];
        const booking = bookings[0];

        // If: if (booking.BookingStatus === 'Confirmed' && booking.PaymentRefer
        if (booking.BookingStatus === 'Confirmed' && booking.PaymentReference) {
            // HTTP response
            return res.status(400).json({ error: 'This booking has already been paid' });
        // End block
        }

        // Constant: const totalAmount = parseFloat(booking.TotalPrice);
        const totalAmount = parseFloat(booking.TotalPrice);
        // Constant: const ownerShare = parseFloat((totalAmount / 1.1).toFixed(2));
        const ownerShare = parseFloat((totalAmount / 1.1).toFixed(2));
        // Constant: const platformFee = parseFloat((totalAmount - ownerShare).toFixed(2));
        const platformFee = parseFloat((totalAmount - ownerShare).toFixed(2));

        // Console: console.log('💰 Payment breakdown:', { total: totalAmount, ownerShare,
        console.log('💰 Payment breakdown:', { total: totalAmount, ownerShare, platformFee });

        // Run SQL query
        await pool.query(
            // SQL statement
            `UPDATE Booking SET OwnerShare = ?, PlatformFee = ? WHERE BookingId = ?`,
            // L1710: [ownerShare, platformFee, bookingId]
            [ownerShare, platformFee, bookingId]
        // L1711: );
        );

        // Constant: const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        const CLIENT_URL = 'https://dar-link-mocha.vercel.app';
        // Constant: const checkoutData = {
        const checkoutData = {
            // L1715: amount: Math.round(totalAmount * 100),
            amount: Math.round(totalAmount * 100),
            // L1716: currency: 'dzd',
            currency: 'dzd',
            // L1717: success_url: `${CLIENT_URL}/booking-payment-success.html?bookingId=${bookingId}`,
            success_url: `${CLIENT_URL}/booking-payment-success.html?bookingId=${bookingId}`,
            // L1718: failure_url: `${CLIENT_URL}/booking-payment-failed.html?bookingId=${bookingId}`,
            failure_url: `${CLIENT_URL}/booking-payment-failed.html?bookingId=${bookingId}`,
            // L1719: description: `Booking: ${booking.PropertyTitle} (${booking.LengthOfStay} nights)`,
            description: `Booking: ${booking.PropertyTitle} (${booking.LengthOfStay} nights)`,
            // L1720: locale: 'ar'
            locale: 'ar'
        // End statement
        };

        // Console: console.log('📤 Sending to Chargily:', checkoutData);
        console.log('📤 Sending to Chargily:', checkoutData);

        // Constant: const checkout = await chargily.createCheckout(checkoutData);
        const checkout = await chargily.createCheckout(checkoutData);

        // Console: console.log('✅ Checkout created:', checkout.id);
        console.log('✅ Checkout created:', checkout.id);

        // Run SQL query
        await pool.query(
            // SQL statement
            `UPDATE Booking SET PaymentReference = ? WHERE BookingId = ?`,
            // L1731: [checkout.id, bookingId]
            [checkout.id, bookingId]
        // L1732: );
        );

        // Run SQL query
        await pool.query(
            // SQL statement
            `INSERT INTO Payment_History 
            (PaymentType, ReferenceId, PayerId, Amount, PlatformFee, RecipientShare, ChargilyCheckoutId, PaymentStatus)
            VALUES ('Booking', ?, ?, ?, ?, ?, ?, 'Pending')`,
            // L1738: [bookingId, booking.UserId, totalAmount, platformFee, ownerShare, checkout.id]
            [bookingId, booking.UserId, totalAmount, platformFee, ownerShare, checkout.id]
        // L1739: );
        );

        // Send HTTP response
        res.json({
            // L1742: success: true,
            success: true,
            // L1743: checkoutId: checkout.id,
            checkoutId: checkout.id,
            // L1744: checkoutUrl: checkout.checkout_url,
            checkoutUrl: checkout.checkout_url,
            // L1745: amount: totalAmount,
            amount: totalAmount,
            // L1746: breakdown: {
            breakdown: {
                // L1747: total: totalAmount,
                total: totalAmount,
                // L1748: ownerWillReceive: ownerShare,
                ownerWillReceive: ownerShare,
                // L1749: platformFee: platformFee
                platformFee: platformFee
            // End block
            }
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('❌ Booking payment error:', error);
        console.error('❌ Booking payment error:', error);
        // Send HTTP response
        res.status(500).json({ 
            // L1756: error: 'Failed to create booking payment',
            error: 'Failed to create booking payment',
            // L1757: details: error.message
            details: error.message 
        // End handler/callback
        });
    // End block
    }
// End handler/callback
});

// DELETE /api/bookings/cancel/:bookingId — route handler entry
app.delete('/api/bookings/cancel/:bookingId', async (req, res) => {
    // Try block
    try {
        // Constant: const { bookingId } = req.params;
        const { bookingId } = req.params;

        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            'SELECT BookingId, PropertyId, BookingStatus, PaymentReference FROM Booking WHERE BookingId = ?',
            // L1768: [bookingId]
            [bookingId]
        // L1769: );
        );

        // If: if (bookings.length === 0) {
        if (bookings.length === 0) {
            // HTTP response
            return res.status(404).json({ 
                // L1773: success: false,
                success: false,
                // L1774: message: 'Booking not found or already cancelled'
                message: 'Booking not found or already cancelled' 
            // End handler/callback
            });
        // End block
        }

        // Constant: const booking = bookings[0];
        const booking = bookings[0];

        // If: if (booking.BookingStatus === 'Confirmed' && booking.PaymentRefer
        if (booking.BookingStatus === 'Confirmed' && booking.PaymentReference) {
            // HTTP response
            return res.status(400).json({ 
                // L1782: success: false,
                success: false,
                // L1783: message: 'Cannot cancel a confirmed booking'
                message: 'Cannot cancel a confirmed booking' 
            // End handler/callback
            });
        // End block
        }

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            'DELETE FROM Booking WHERE BookingId = ?',
            // L1789: [bookingId]
            [bookingId]
        // L1790: );
        );

        // If: if (result.affectedRows > 0) {
        if (result.affectedRows > 0) {
            // Send HTTP response
            res.json({ 
                // L1794: success: true,
                success: true,
                // L1795: message: 'Booking cancelled successfully. Dates are now available.',
                message: 'Booking cancelled successfully. Dates are now available.',
                // L1796: propertyId: booking.PropertyId
                propertyId: booking.PropertyId
            // End handler/callback
            });
        // Else branch
        } else {
            // Send HTTP response
            res.status(500).json({ success: false, message: 'Failed to cancel booking' });
        // End block
        }

    // Catch errors
    } catch (error) {
        // Console: console.error('❌ Cancel booking error:', error);
        console.error('❌ Cancel booking error:', error);
        // Send HTTP response
        res.status(500).json({ success: false, error: error.message });
    // End block
    }
// End handler/callback
});

// Webhook — handles BOTH package and booking payments
app.post('/api/payment/webhook', async (req, res) => {
    // Try block
    try {
        // Console: console.log('🔔 Webhook received:', req.body);
        console.log('🔔 Webhook received:', req.body);

        // Constant: const event = req.body;
        const event = req.body;
        // Constant: const checkoutId = event.id || event.data?.id;
        const checkoutId = event.id || event.data?.id;
        // Constant: const status = event.status || event.data?.status;
        const status = event.status || event.data?.status;

        // If: if (status === 'paid' || status === 'completed') {
        if (status === 'paid' || status === 'completed') {
            // Console: console.log('✅ Payment successful:', checkoutId);
            console.log('✅ Payment successful:', checkoutId);

            // Query result destructure: const [packagePayments] = await pool.query(
            const [packagePayments] = await pool.query(
                // SQL statement
                `SELECT pt.*, pkg.DurationDays, pkg.PackageType, pkg.MaxImages
                 FROM Payment_Transaction pt
                 JOIN AdvertPackage pkg ON pt.PackageId = pkg.PackageId
                 WHERE pt.TransactionReference = ?`,
                // L1825: [checkoutId]
                [checkoutId]
            // L1826: );
            );

            // If: if (packagePayments.length > 0) {
            if (packagePayments.length > 0) {
                // Constant: const transaction = packagePayments[0];
                const transaction = packagePayments[0];
                // Console: console.log('📦 Package payment detected');
                console.log('📦 Package payment detected');

                // Run SQL query
                await pool.query(
                    // SQL statement
                    `UPDATE Payment_Transaction 
                     SET PaymentStatus = 'Completed', PaymentDate = NOW()
                     WHERE TransactionReference = ?`,
                    // L1836: [checkoutId]
                    [checkoutId]
                // L1837: );
                );

                // Constant: const expiryDate = new Date();
                const expiryDate = new Date();
                // L1840: expiryDate.setDate(expiryDate.getDate() + transaction.DurationDays);
                expiryDate.setDate(expiryDate.getDate() + transaction.DurationDays);

                // If: if (transaction.PackageType === 'Premium') {
                if (transaction.PackageType === 'Premium') {
                    // Run SQL query
                    await pool.query(
                        // SQL statement
                        `UPDATE Property SET IsFeatured = TRUE, FeaturedUntil = ?, MaxImages = ? WHERE PropertyId = ?`,
                        // L1845: [expiryDate, transaction.MaxImages, transaction.PropertyId]
                        [expiryDate, transaction.MaxImages, transaction.PropertyId]
                    // L1846: );
                    );
                    // Console: console.log('✅ Property upgraded to Premium');
                    console.log('✅ Property upgraded to Premium');
                // Else if: } else if (transaction.PackageType === 'Boost') {
                } else if (transaction.PackageType === 'Boost') {
                    // Run SQL query
                    await pool.query(
                        // SQL statement
                        `UPDATE Property SET IsBoosted = TRUE, BoostedUntil = ?, MaxImages = ? WHERE PropertyId = ?`,
                        // L1851: [expiryDate, transaction.MaxImages, transaction.PropertyId]
                        [expiryDate, transaction.MaxImages, transaction.PropertyId]
                    // L1852: );
                    );
                    // Console: console.log('✅ Property boosted');
                    console.log('✅ Property boosted');
                // End block
                }

                // Run SQL query
                await pool.query(
                    // SQL statement
                    'UPDATE Payment_Transaction SET ExpiryDate = ? WHERE TransactionId = ?',
                    // L1858: [expiryDate, transaction.TransactionId]
                    [expiryDate, transaction.TransactionId]
                // L1859: );
                );

                // HTTP response
                return res.json({ received: true, type: 'package' });
            // End block
            }

            // Query result destructure: const [bookings] = await pool.query(
            const [bookings] = await pool.query(
                // SQL statement
                `SELECT b.*, 
                 p.Title as PropertyTitle,
                 CONCAT(renter.FirstName, ' ', renter.LastName) as RenterName,
                 CONCAT(owner.FirstName, ' ', owner.LastName) as OwnerName,
                 p.OwnerId
                 FROM Booking b
                 JOIN Property p ON b.PropertyId = p.PropertyId
                 JOIN USER_a renter ON b.UserId = renter.UserId
                 JOIN USER_a owner ON p.OwnerId = owner.UserId
                 WHERE b.PaymentReference = ?`,
                // L1875: [checkoutId]
                [checkoutId]
            // L1876: );
            );

            // If: if (bookings.length > 0) {
            if (bookings.length > 0) {
                // Constant: const booking = bookings[0];
                const booking = bookings[0];
                // Console: console.log('🏠 Booking payment detected');
                console.log('🏠 Booking payment detected');

                // Run SQL query
                await pool.query(
                    // SQL statement
                    `UPDATE Booking SET BookingStatus = 'Completed', PaymentDate = NOW() WHERE BookingId = ?`,
                    // L1884: [booking.BookingId]
                    [booking.BookingId]
                // L1885: );
                );

                // Run SQL query
                await pool.query(
                    // SQL statement
                    `UPDATE Payment_History 
                     SET PaymentStatus = 'Completed', PaymentDate = NOW()
                     WHERE ChargilyCheckoutId = ? AND PaymentType = 'Booking'`,
                    // L1891: [checkoutId]
                    [checkoutId]
                // L1892: );
                );

                // Console: console.log('✅ Booking confirmed! Owner payout pending.');
                console.log('✅ Booking confirmed! Owner payout pending.');
                // HTTP response
                return res.json({ received: true, type: 'booking' });
            // End block
            }

            // Console: console.log('⚠️ Payment not found in database');
            console.log('⚠️ Payment not found in database');
            // HTTP response
            return res.json({ received: true, type: 'unknown' });

        // Else if: } else if (status === 'failed' || status === 'expired') {
        } else if (status === 'failed' || status === 'expired') {
            // Console: console.log('❌ Payment failed:', checkoutId);
            console.log('❌ Payment failed:', checkoutId);

            // Run SQL query
            await pool.query(
                // SQL statement
                `UPDATE Payment_Transaction SET PaymentStatus = 'Failed' WHERE TransactionReference = ?`,
                // L1906: [checkoutId]
                [checkoutId]
            // L1907: );
            );

            // Run SQL query
            await pool.query(
                // SQL statement
                `UPDATE Booking SET BookingStatus = 'Cancelled' WHERE PaymentReference = ?`,
                // L1911: [checkoutId]
                [checkoutId]
            // L1912: );
            );

            // Run SQL query
            await pool.query(
                // SQL statement
                `UPDATE Payment_History SET PaymentStatus = 'Failed' WHERE ChargilyCheckoutId = ?`,
                // L1916: [checkoutId]
                [checkoutId]
            // L1917: );
            );
        // End block
        }

        // Send HTTP response
        res.json({ received: true });

    // Catch errors
    } catch (error) {
        // Console: console.error('❌ Webhook error:', error);
        console.error('❌ Webhook error:', error);
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/admin/pending-payouts — route handler entry
app.get('/api/admin/pending-payouts', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [payouts] = await pool.query(
        const [payouts] = await pool.query(
            // SQL statement
            `SELECT b.BookingId, b.TotalPrice, b.OwnerShare, b.PlatformFee, 
             b.StartDate, b.EndDate, b.PaymentDate,
             p.PropertyId, p.Title as PropertyTitle,
             CONCAT(owner.FirstName, ' ', owner.LastName) as OwnerName,
             owner.Email as OwnerEmail,
             owner.PhoneNumber as OwnerPhone,
             owner.UserId as OwnerId,
             CONCAT(renter.FirstName, ' ', renter.LastName) as RenterName
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             JOIN USER_a owner ON p.OwnerId = owner.UserId
             JOIN USER_a renter ON b.UserId = renter.UserId
             WHERE b.BookingStatus = 'Confirmed'
             AND b.OwnerPaidOut = FALSE
             AND b.PaymentDate IS NOT NULL
             AND b.EndDate < CURDATE()
             ORDER BY b.EndDate ASC`
        // L1948: );
        );

        // Constant: const totalPending = payouts.reduce((sum, p) => sum + parseFloat(p.OwnerSha
        const totalPending = payouts.reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);
        // Constant: const totalPlatformProfit = payouts.reduce((sum, p) => sum + parseFloat(p.P
        const totalPlatformProfit = payouts.reduce((sum, p) => sum + parseFloat(p.PlatformFee), 0);

        // Send HTTP response
        res.json({
            // L1954: payouts: payouts,
            payouts: payouts,
            // L1955: summary: {
            summary: {
                // L1956: count: payouts.length,
                count: payouts.length,
                // L1957: totalOwnerPayouts: totalPending,
                totalOwnerPayouts: totalPending,
                // L1958: totalPlatformProfit: totalPlatformProfit
                totalPlatformProfit: totalPlatformProfit
            // End block
            }
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// POST /api/admin/mark-payout-complete — route handler entry
app.post('/api/admin/mark-payout-complete', async (req, res) => {
    // Try block
    try {
        // Constant: const { bookingId, payoutMethod, payoutReference } = req.body;
        const { bookingId, payoutMethod, payoutReference } = req.body;

        // Validation guard: if (!bookingId) {
        if (!bookingId) {
            // HTTP response
            return res.status(400).json({ error: 'Booking ID is required' });
        // End block
        }

        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            `UPDATE Booking 
             SET OwnerPaidOut = TRUE, PayoutDate = NOW(), PayoutMethod = ?, PayoutReference = ?
             WHERE BookingId = ?`,
            // L1979: [payoutMethod || 'Manual Transfer', payoutReference || null, bookingId]
            [payoutMethod || 'Manual Transfer', payoutReference || null, bookingId]
        // L1980: );
        );

        // If: if (result.affectedRows === 0) {
        if (result.affectedRows === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Booking not found' });
        // End block
        }

        // Send HTTP response
        res.json({ success: true, message: 'Payout marked as complete' });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/owner/payout-history/:ownerId — route handler entry
app.get('/api/owner/payout-history/:ownerId', async (req, res) => {
    // Try block
    try {
        // Constant: const { ownerId } = req.params;
        const { ownerId } = req.params;

        // Query result destructure: const [payouts] = await pool.query(
        const [payouts] = await pool.query(
            // SQL statement
            `SELECT b.BookingId, b.OwnerShare, b.PaymentDate, b.PayoutDate, 
             b.PayoutMethod, b.PayoutReference, b.OwnerPaidOut,
             p.Title as PropertyTitle,
             CONCAT(renter.FirstName, ' ', renter.LastName) as RenterName,
             b.StartDate, b.EndDate
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             JOIN USER_a renter ON b.UserId = renter.UserId
             WHERE p.OwnerId = ?
             AND b.BookingStatus = 'Confirmed'
             AND b.PaymentDate IS NOT NULL
             ORDER BY b.PaymentDate DESC`,
            // L2010: [ownerId]
            [ownerId]
        // L2011: );
        );

        // Constant: const totalEarned = payouts
        const totalEarned = payouts
            // L2014: .filter(p => p.OwnerPaidOut)
            .filter(p => p.OwnerPaidOut)
            // L2015: .reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);
            .reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);

        // Constant: const totalPending = payouts
        const totalPending = payouts
            // L2018: .filter(p => !p.OwnerPaidOut && new Date(p.EndDate) < new Date())
            .filter(p => !p.OwnerPaidOut && new Date(p.EndDate) < new Date())
            // L2019: .reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);
            .reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);

        // Send HTTP response
        res.json({
            // L2022: payouts: payouts,
            payouts: payouts,
            // L2023: summary: {
            summary: {
                // L2024: totalPaidOut: totalEarned,
                totalPaidOut: totalEarned,
                // L2025: totalPending: totalPending,
                totalPending: totalPending,
                // L2026: count: payouts.length
                count: payouts.length
            // End block
            }
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});

// GET /api/payment/booking-status/:bookingId — route handler entry
app.get('/api/payment/booking-status/:bookingId', async (req, res) => {
    // Try block
    try {
        // Constant: const { bookingId } = req.params;
        const { bookingId } = req.params;

        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            `SELECT BookingStatus, PaymentReference, PaymentDate, 
             TotalPrice, OwnerShare, PlatformFee, OwnerPaidOut, PayoutDate
             FROM Booking WHERE BookingId = ?`,
            // L2043: [bookingId]
            [bookingId]
        // L2044: );
        );

        // If: if (bookings.length === 0) {
        if (bookings.length === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Booking not found' });
        // End block
        }

        // Send HTTP response
        res.json(bookings[0]);

    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});


// ================================================================
// ADD THIS ROUTE TO app.js to diagnose the Railway Cloudinary issue
// Place it near the top with other test endpoints
// Then visit: https://darlink-production.up.railway.app/api/test-cloudinary
// ================================================================

// GET /api/test-cloudinary — route handler entry
app.get('/api/test-cloudinary', async (req, res) => {
  // Constant: const vars = {
  const vars = {
    // L2066: CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? `✅ set: ${process.env.CLOUDINARY_CLOUD_NA
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? `✅ set: ${process.env.CLOUDINARY_CLOUD_NAME}` : '❌ MISSING',
    // L2067: CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY    ? '✅ set' : '❌ MISSING',
    CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY    ? '✅ set' : '❌ MISSING',
    // L2068: CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ set' : '❌ MISSING',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ set' : '❌ MISSING',
  // End statement
  };

  // Validation guard: if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    // HTTP response
    return res.status(500).json({
      // L2073: ok: false,
      ok: false,
      // L2074: message: 'Missing Cloudinary environment variables in Railway',
      message: 'Missing Cloudinary environment variables in Railway',
      // L2075: vars
      vars
    // End handler/callback
    });
  // End block
  }

  // Try block
  try {
    // Constant: const result = await cloudinaryV2.api.ping();
    const result = await cloudinaryV2.api.ping();
    // Send HTTP response
    res.json({ 
      // L2082: ok: true,
      ok: true, 
      // L2083: message: 'Cloudinary is fully working! Images will upload and persist after redeploy.',
      message: 'Cloudinary is fully working! Images will upload and persist after redeploy.', 
      // L2084: ping: result,
      ping: result,
      // L2085: vars
      vars 
    // End handler/callback
    });
  // Catch errors
  } catch (err) {
    // Send HTTP response
    res.status(500).json({ 
      // L2089: ok: false,
      ok: false, 
      // L2090: message: 'Ping failed - check Railway logs for exact error',
      message: 'Ping failed - check Railway logs for exact error',
      // L2091: error: err.message,
      error: err.message,
      // L2092: code: err.http_code || err.status,
      code: err.http_code || err.status,
      // L2093: vars
      vars 
    // End handler/callback
    });
  // End block
  }
// End handler/callback
});


// GET /api/test-cloudinary-debug — route handler entry
app.get('/api/test-cloudinary-debug', async (req, res) => {
  // Try block
  try {
    // Constant: const result = await cloudinaryV2.api.ping();
    const result = await cloudinaryV2.api.ping();
    // Send HTTP response
    res.json({ ok: true, result });
  // Catch errors
  } catch (err) {
    // Send HTTP response
    res.status(500).json({
      // L2105: ok: false,
      ok: false,
      // L2106: error_message: err.message,
      error_message: err.message,
      // L2107: http_code: err.http_code,
      http_code: err.http_code,
      // L2108: name: err.name,
      name: err.name,
      // L2109: full_error: err.toString()
      full_error: err.toString()
    // End handler/callback
    });
  // End block
  }
// End handler/callback
});


// ================================================================
// ENDPOINTS Administration & Diagnostics
// ================================================================

// GET all users (admin) — returns FullName, AccountStatus
app.get('/api/users', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [users] = await pool.query(
        const [users] = await pool.query(
            // SQL statement
            `SELECT UserId,
             CONCAT(FirstName, ' ', LastName) AS FullName,
             FirstName, LastName, Email, PhoneNumber,
             UserType, IDCardNumber, IDCardFrontPath,
             AverageRating, TotalReviews,
             COALESCE(AccountStatus, 'Active') AS AccountStatus
             FROM USER_a
             ORDER BY UserId DESC`
        // L2131: );
        );
        // Send HTTP response
        res.json(users);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 
// PUT update user account status (admin: Active / Suspended / Banned)
app.put('/api/users/:id/status', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Constant: const { status } = req.body;
        const { status } = req.body;
 
        // Constant: const allowed = ['Active', 'Suspended', 'Banned'];
        const allowed = ['Active', 'Suspended', 'Banned'];
        // Validation guard: if (!allowed.includes(status)) {
        if (!allowed.includes(status)) {
            // HTTP response
            return res.status(400).json({ error: 'Invalid status' });
        // End block
        }
 
        // Run SQL query
        await pool.query(
            // SQL statement
            'UPDATE USER_a SET AccountStatus = ? WHERE UserId = ?',
            // L2151: [status, id]
            [status, id]
        // L2152: );
        );
        // Send HTTP response
        res.json({ message: `User #${id} status updated to ${status}` });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 
// GET all properties with owner name (admin)
app.get('/api/admin/properties', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [properties] = await pool.query(
        const [properties] = await pool.query(
            // SQL statement
            `SELECT p.*,
             CONCAT(u.FirstName, ' ', u.LastName) AS OwnerName
             FROM Property p
             JOIN USER_a u ON p.OwnerId = u.UserId
             ORDER BY p.PropertyId DESC`
        // L2168: );
        );
        // Send HTTP response
        res.json(properties);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 
// PUT update property availability status (admin)
app.put('/api/properties/:id/status', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Constant: const { status } = req.body;
        const { status } = req.body;
 
        // Constant: const allowed = ['Active', 'Inactive', 'Blocked'];
        const allowed = ['Active', 'Inactive', 'Blocked'];
        // Validation guard: if (!allowed.includes(status)) {
        if (!allowed.includes(status)) {
            // HTTP response
            return res.status(400).json({ error: 'Invalid status' });
        // End block
        }
 
        // Run SQL query
        await pool.query(
            // SQL statement
            'UPDATE Property SET AvailabilityStatus = ? WHERE PropertyId = ?',
            // L2188: [status, id]
            [status, id]
        // L2189: );
        );
        // Send HTTP response
        res.json({ message: `Property #${id} status updated to ${status}` });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 
// GET all bookings (admin) — includes renter name and property title
app.get('/api/bookings', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [bookings] = await pool.query(
        const [bookings] = await pool.query(
            // SQL statement
            `SELECT b.*,
             p.Title AS PropertyTitle,
             CONCAT(u.FirstName, ' ', u.LastName) AS RenterName
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             JOIN USER_a u ON b.UserId = u.UserId
             ORDER BY b.BookingId DESC`
        // L2207: );
        );
        // Send HTTP response
        res.json(bookings);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 
// PUT cancel booking (admin)
app.put('/api/bookings/:id/cancel', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Run SQL query
        await pool.query(
            // SQL statement
            "UPDATE Booking SET BookingStatus = 'Cancelled' WHERE BookingId = ?",
            // L2220: [id]
            [id]
        // L2221: );
        );
        // Send HTTP response
        res.json({ message: `Booking #${id} cancelled` });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 
// GET all reviews (admin)
app.get('/api/reviews', async (req, res) => {
    // Try block
    try {
        // Query result destructure: const [reviews] = await pool.query(
        const [reviews] = await pool.query(
            // SQL statement
            `SELECT r.*,
             CONCAT(reviewer.FirstName, ' ', reviewer.LastName) AS ReviewerName,
             p.Title AS PropertyTitle
             FROM Review r
             JOIN USER_a reviewer ON r.ReviewerId = reviewer.UserId
             LEFT JOIN Property p ON r.PropertyId = p.PropertyId
             ORDER BY r.ReviewDate DESC`
        // L2239: );
        );
        // Normalize: use ReviewId as PropertyReviewId for compatibility
        const normalized = reviews.map(r => ({
            // L2242: ...r,
            ...r,
            // L2243: PropertyReviewId: r.ReviewId
            PropertyReviewId: r.ReviewId
        // L2244: }));
        }));
        // Send HTTP response
        res.json(normalized);
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 
// DELETE a review (admin)
app.delete('/api/reviews/:id', async (req, res) => {
    // Try block
    try {
        // Constant: const { id } = req.params;
        const { id } = req.params;
        // Query result destructure: const [result] = await pool.query(
        const [result] = await pool.query(
            // SQL statement
            'DELETE FROM Review WHERE ReviewId = ?',
            // L2257: [id]
            [id]
        // L2258: );
        );
        // If: if (result.affectedRows === 0) {
        if (result.affectedRows === 0) {
            // HTTP response
            return res.status(404).json({ error: 'Review not found' });
        // End block
        }
        // Send HTTP response
        res.json({ message: 'Review deleted' });
    // Catch errors
    } catch (error) {
        // Send HTTP response
        res.status(500).json({ error: error.message });
    // End block
    }
// End handler/callback
});
 // POST /api/admin/login — route handler entry
 app.post('/api/admin/login', async (req, res) => {
    // Try block
    try {
        // Constant: const { name, password } = req.body;
        const { name, password } = req.body;
 
        // Validation guard: if (!name || !password) {
        if (!name || !password) {
            // HTTP response
            return res.status(400).json({ error: 'Name and password are required' });
        // End block
        }
 
        // Query result destructure: const [admins] = await pool.query(
        const [admins] = await pool.query(
            // SQL statement
            'SELECT * FROM Admin WHERE Name = ?',
            // L2277: [name]
            [name]
        // L2278: );
        );
 
        // If: if (admins.length === 0) {
        if (admins.length === 0) {
            // HTTP response
            return res.status(401).json({ error: 'Invalid name or password' });
        // End block
        }
 
        // Constant: const admin = admins[0];
        const admin = admins[0];
        // Constant: const valid = await bcrypt.compare(password, admin.Password);
        const valid = await bcrypt.compare(password, admin.Password);
 
        // Validation guard: if (!valid) {
        if (!valid) {
            // HTTP response
            return res.status(401).json({ error: 'Invalid name or password' });
        // End block
        }
 
        // L2291: delete admin.Password;
        delete admin.Password;
 
        // Send HTTP response
        res.json({
            // L2294: success: true,
            success: true,
            // L2295: admin: {
            admin: {
                // L2296: AdminId: admin.AdminId,
                AdminId: admin.AdminId,
                // L2297: Name: admin.Name,
                Name: admin.Name,
                // L2298: Email: admin.Email
                Email: admin.Email
            // End block
            }
        // End handler/callback
        });
 
    // Catch errors
    } catch (error) {
        // Console: console.error('Admin login error:', error);
        console.error('Admin login error:', error);
        // Send HTTP response
        res.status(500).json({ error: 'Server error' });
    // End block
    }
// End handler/callback
});

// POST create new admin
app.post('/api/admin/register', async (req, res) => {
    // Try block
    try {
        // Constant: const { name, email, password } = req.body;
        const { name, email, password } = req.body;

        // Validation guard: if (!name || !email || !password) {
        if (!name || !email || !password) {
            // HTTP response
            return res.status(400).json({ error: 'Name, email, and password are required' });
        // End block
        }

        // Check if admin name already exists
        const [existingName] = await pool.query(
            // SQL statement
            'SELECT AdminId FROM Admin WHERE Name = ?',
            // L2320: [name]
            [name]
        // L2321: );
        );

        // If: if (existingName.length > 0) {
        if (existingName.length > 0) {
            // HTTP response
            return res.status(400).json({ error: 'Admin name already exists' });
        // End block
        }

        // Check if email already exists
        const [existingEmail] = await pool.query(
            // SQL statement
            'SELECT AdminId FROM Admin WHERE Email = ?',
            // L2330: [email]
            [email]
        // L2331: );
        );

        // If: if (existingEmail.length > 0) {
        if (existingEmail.length > 0) {
            // HTTP response
            return res.status(400).json({ error: 'Email already registered' });
        // End block
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new admin (userId and propertyId are optional, can be NULL)
        const [result] = await pool.query(
            // SQL statement
            `INSERT INTO Admin (Name, Email, Password, UserId, PropertyId)
             VALUES (?, ?, ?, NULL, NULL)`,
            // L2344: [name, email, hashedPassword]
            [name, email, hashedPassword]
        // L2345: );
        );

        // Send HTTP response
        res.status(201).json({
            // L2348: success: true,
            success: true,
            // L2349: message: 'Admin account created successfully',
            message: 'Admin account created successfully',
            // L2350: adminId: result.insertId
            adminId: result.insertId
        // End handler/callback
        });

    // Catch errors
    } catch (error) {
        // Console: console.error('Admin registration error:', error);
        console.error('Admin registration error:', error);
        // Send HTTP response
        res.status(500).json({ error: 'Server error' });
    // End block
    }
// End handler/callback
});

// Start server
app.listen(process.env.PORT, () => {
    // Console: console.log(`🚀 Server running on http://localhost:${process.env.PORT}
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    // Console: console.log(`🖼️  Images: Cloudinary (persistent across deploys)`);
    console.log(`🖼️  Images: Cloudinary (persistent across deploys)`);
    // Console: console.log(`🔑 OCR.space API: ${process.env.OCR_SPACE_API_KEY ? '✅ Co
    console.log(`🔑 OCR.space API: ${process.env.OCR_SPACE_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
// End handler/callback
});