// app.js - Fixed with Cloudinary image uploads

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from './connect.js';
import { extractIDFromImage, validateAlgerianID, parseAlgerianID } from './ocr.js';
import chargily from './chargily-config.js';
import { propertyUpload, idUpload, cloudinaryV2, uploadToCloudinary } from './cloudinary-config.js';
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep uploads dir for OCR temp files ONLY
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// OCR-only local multer (temp files, deleted immediately after reading)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG and PNG images are allowed'), false);
    }
};

const ocrUpload = multer({
    dest: uploadDir,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        res.json({ 
            message: 'Database connected!', 
            result: rows[0].result,
            ocrConfigured: !!process.env.OCR_SPACE_API_KEY
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// OCR Endpoint — uses local temp storage, file deleted after use
app.post('/api/ocr/extract-id', ocrUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No image file provided' 
            });
        }

        const result = await extractIDFromImage(req.file.path);
        fs.unlinkSync(req.file.path);

        if (result.success) {
            const idDetails = parseAlgerianID(result.idNumber);
            res.json({
                success: true,
                idNumber: result.idNumber,
                confidence: result.confidence,
                pattern: result.pattern,
                details: idDetails,
                message: 'ID number extracted successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error,
                fullText: result.fullText,
                message: 'Could not extract ID number from image'
            });
        }
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Registration endpoint — uses Cloudinary idUpload
app.post('/api/users/register', idUpload.single('IDCardFront'), async (req, res) => {
    try {
        const { FullName, Email, PhoneNumber, IDCardNumber, Password, UserType } = req.body;

        const nameParts = FullName.trim().split(' ');
        const FirstName = nameParts[0] || '';
        const LastName = nameParts.slice(1).join(' ') || nameParts[0];

        if (!FullName || !Email || !PhoneNumber || !IDCardNumber || !Password || !UserType) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        if (!validateAlgerianID(IDCardNumber)) {
            return res.status(400).json({ 
                error: 'Invalid Algerian ID card number format (must be 18 digits)' 
            });
        }

        // Cloudinary returns full HTTPS URL in req.file.path
        let frontImagePath = null;
        if (req.file) {
           const uploadResult = await uploadToCloudinary(req.file.buffer, 'darlink/ids');
            frontImagePath = uploadResult.secure_url;
        }

        const hashedPassword = await bcrypt.hash(Password, 10);

        const [result] = await pool.query(
            `INSERT INTO USER_a 
            (FirstName, LastName, Email, PhoneNumber, IDCardNumber, Password, UserType, IDCardFrontPath) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [FirstName, LastName, Email, PhoneNumber, IDCardNumber, hashedPassword, UserType, frontImagePath]
        );

        res.status(201).json({
            message: 'Registration successful!',
            userId: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: 'Email or ID Card Number already exists' 
            });
        }

        res.status(500).json({ 
            error: 'Server error. Please try again later.',
            details: error.message
        });
    }
});

// Login endpoint
app.post('/api/users/login', async (req, res) => {
    try {
        const { Email, Password, UserType } = req.body;

        if (!Email || !Password || !UserType) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const [users] = await pool.query(
            'SELECT * FROM USER_a WHERE Email = ? AND UserType = ?',
            [Email, UserType]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or user type' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(Password, user.Password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        delete user.Password;

        res.json({
            message: 'Login successful!',
            user: user
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// Property endpoints — uses Cloudinary propertyUpload
// Property endpoints — NEW manual upload with upload_stream
app.post('/api/properties', propertyUpload.array('images', 10), async (req, res) => {
    try {
        let { 
            Title, Description, Address, City, Wilaya, Latitude, Longitude, 
            PropertyType, PricePerNight, AvailabilityStatus, NumofRooms, OwnerId,
            FeatureIds
        } = req.body;

        const basePrice = parseFloat(PricePerNight);
        if (isNaN(basePrice)) {
            return res.status(400).json({ error: 'Invalid PricePerNight' });
        }
        PricePerNight = parseFloat((basePrice * 1.1).toFixed(2));

        let featureIdsArray = [];
        if (FeatureIds) {
            try {
                featureIdsArray = typeof FeatureIds === 'string' ? JSON.parse(FeatureIds) : FeatureIds;
                if (!Array.isArray(featureIdsArray)) featureIdsArray = [];
            } catch (err) {
                featureIdsArray = [];
            }
        }

        if (!Title || !Description || !Address || !City || !Wilaya || !PropertyType || !PricePerNight || !NumofRooms || !OwnerId) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'At least one property image is required' });
        }

        // Check owner
        const [owners] = await pool.query(
            'SELECT UserId, UserType FROM USER_a WHERE UserId = ? AND UserType = "Owner"',
            [OwnerId]
        );

        if (owners.length === 0) {
            return res.status(403).json({ error: 'Only property owners can add properties' });
        }

        const lat = Latitude || null;
        const lng = Longitude || null;
        const status = AvailabilityStatus || 'Active';

        // Insert property first
        const [result] = await pool.query(
            `INSERT INTO Property 
            (Title, Description, Address, City, Wilaya, Latitude, Longitude, PropertyType, PricePerNight, AvailabilityStatus, NumofRooms, OwnerId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [Title, Description, Address, City, Wilaya, lat, lng, PropertyType, PricePerNight, status, NumofRooms, OwnerId]
        );

        const propertyId = result.insertId;

        // Insert features
        if (featureIdsArray && featureIdsArray.length > 0) {
            const featurePromises = featureIdsArray.map(fid =>
                pool.query('INSERT INTO has_features (PropertyId, FeatureId) VALUES (?, ?)', [propertyId, fid])
            );
            await Promise.all(featurePromises);
        }

        // === NEW: Upload images to Cloudinary using upload_stream ===
        const imageInsertPromises = req.files.map(async (file, index) => {
            const result = await uploadToCloudinary(file.buffer, 'darlink/properties');
            const imageURL = result.secure_url;        // Full HTTPS URL
            const caption = index === 0 ? 'Main Image' : `Image ${index + 1}`;
            
            return pool.query(
                'INSERT INTO PROPERTY_Image (PropertyId, ImageURL, Caption) VALUES (?, ?, ?)',
                [propertyId, imageURL, caption]
            );
        });

        await Promise.all(imageInsertPromises);

        res.status(201).json({ 
            message: `Property added successfully with ${req.files.length} image(s)!`, 
            propertyId: propertyId 
        });

    } catch (error) {
        console.error('Property upload error:', error);
        res.status(500).json({ error: error.message });
    }
});



app.get('/api/properties/owner/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;

        const [properties] = await pool.query(
            `SELECT p.*, 
             CONCAT(u.FirstName, ' ', u.LastName) as OwnerName
             FROM Property p
             JOIN USER_a u ON p.OwnerId = u.UserId
             WHERE p.OwnerId = ?
             ORDER BY p.PropertyId DESC`,
            [ownerId]
        );

        for (let property of properties) {
            const [images] = await pool.query(
                'SELECT ImageURL, Caption FROM PROPERTY_Image WHERE PropertyId = ?',
                [property.PropertyId]
            );
            // ImageURL is already a full Cloudinary HTTPS URL
            property.Images = images;
            property.MainImage = images.length > 0 ? images[0].ImageURL : null;

            const [feats] = await pool.query(
                `SELECT f.FeatureId, f.FeatureName
                 FROM Feature f
                 JOIN has_features hf ON f.FeatureId = hf.FeatureId
                 WHERE hf.PropertyId = ?`,
                [property.PropertyId]
            );
            property.Features = feats;
        }

        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/properties/:id', async (req, res) => {
    try {
        const [properties] = await pool.query(
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
            [req.params.id]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const property = properties[0];
        property.HasPromotion = property.HasPromotion === 1;

        const [images] = await pool.query(
            'SELECT ImageURL, Caption FROM PROPERTY_Image WHERE PropertyId = ? ORDER BY ImageId',
            [req.params.id]
        );

        // ImageURL is already a full Cloudinary HTTPS URL — no baseUrl prepending needed
        property.Images = images;
        property.MainImage = images.length > 0 ? images[0].ImageURL : null;

        const [feats] = await pool.query(
            `SELECT f.FeatureId, f.FeatureName
             FROM Feature f
             JOIN has_features hf ON f.FeatureId = hf.FeatureId
             WHERE hf.PropertyId = ?`,
            [req.params.id]
        );
        property.Features = feats;

        await pool.query(
            'UPDATE Property SET ViewCount = ViewCount + 1 WHERE PropertyId = ?',
            [req.params.id]
        );

        res.json(property);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/properties/:id', propertyUpload.array('images', 10), async (req, res) => {
    try {
        const { id } = req.params;
        let { 
            Title, Description, Address, City, Wilaya, PropertyType, 
            PricePerNight, AvailabilityStatus, NumofRooms, OwnerId,
            FeatureIds, Latitude, Longitude
        } = req.body;
        OwnerId = parseInt(OwnerId);

        if (PricePerNight !== undefined) {
            const basePrice = parseFloat(PricePerNight);
            if (isNaN(basePrice)) {
                return res.status(400).json({ error: 'Invalid PricePerNight' });
            }
            PricePerNight = parseFloat((basePrice * 1.1).toFixed(2));
        }

        let featureIdsArray = [];
        if (FeatureIds) {
            try {
                featureIdsArray = typeof FeatureIds === 'string' ? JSON.parse(FeatureIds) : FeatureIds;
                if (!Array.isArray(featureIdsArray)) featureIdsArray = [];
            } catch (err) {
                featureIdsArray = [];
            }
        }

        const [existing] = await pool.query(
            'SELECT OwnerId FROM Property WHERE PropertyId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (existing[0].OwnerId !== OwnerId) {
            return res.status(403).json({ error: 'You can only edit your own properties' });
        }

        await pool.query(
            `UPDATE Property 
             SET Title = ?, Description = ?, Address = ?, City = ?, Wilaya = ?, 
                 PropertyType = ?, PricePerNight = ?, AvailabilityStatus = ?, NumofRooms = ?,
                 Latitude = ?, Longitude = ?
             WHERE PropertyId = ?`,
            [Title, Description, Address, City, Wilaya, PropertyType, PricePerNight, AvailabilityStatus, NumofRooms, Latitude || null, Longitude || null, id]
        );

        // Cloudinary returns full HTTPS URL in file.path
        if (req.files && req.files.length > 0) {
            const imageInsertPromises = req.files.map(async (file, index) => {
                const result = await uploadToCloudinary(file.buffer, 'darlink/properties');
                const imageURL = result.secure_url;
                const caption = `Image ${index + 1}`;
                return pool.query(
                    'INSERT INTO PROPERTY_Image (PropertyId, ImageURL, Caption) VALUES (?, ?, ?)',
                    [id, imageURL, caption]
                );
            });
            await Promise.all(imageInsertPromises);
        }

        if (featureIdsArray && featureIdsArray.length > 0) {
            await pool.query('DELETE FROM has_features WHERE PropertyId = ?', [id]);
            const inserts = featureIdsArray.map(fid =>
                pool.query('INSERT INTO has_features (PropertyId, FeatureId) VALUES (?, ?)', [id, fid])
            );
            await Promise.all(inserts);
        }

        res.json({ message: 'Property updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all available features
app.get('/api/features', async (req, res) => {
    try {
        const [features] = await pool.query(
            'SELECT FeatureId, FeatureName FROM Feature ORDER BY FeatureName'
        );
        res.json(features);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// PROMOTION API ENDPOINTS
// ============================================

app.post('/api/promotions', async (req, res) => {
    try {
        const { PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate, EndDate } = req.body;

        if (!PromotionType || !MinStayDays || !DiscountType || !DiscountValue || !StartDate || !EndDate) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO Promotion (PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate, EndDate)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [PromotionType, MinStayDays, DiscountType, DiscountValue, StartDate, EndDate]
        );

        res.status(201).json({
            message: 'Promotion created successfully',
            PromotionId: result.insertId
        });

    } catch (error) {
        console.error('Promotion creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/promotions/:promotionId', async (req, res) => {
    try {
        const { promotionId } = req.params;

        await pool.query('DELETE FROM benefits_from WHERE PromotionId = ?', [promotionId]);

        const [result] = await pool.query('DELETE FROM Promotion WHERE PromotionId = ?', [promotionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        res.json({ message: 'Promotion deleted successfully' });

    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/properties/:propertyId/promotion', async (req, res) => {
    try {
        const { propertyId } = req.params;

        const [promo] = await pool.query(
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
            [propertyId]
        );

        if (promo.length > 0) {
            res.json({ hasPromotion: true, promotion: promo[0] });
        } else {
            res.json({ hasPromotion: false, promotion: null });
        }

    } catch (error) {
        console.error('Error fetching promotion:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/promotions/:promotionId/link-property', async (req, res) => {
    try {
        const { promotionId } = req.params;
        const { propertyId } = req.body;

        if (!promotionId || isNaN(promotionId)) {
            return res.status(400).json({ error: 'Invalid promotion ID' });
        }

        if (!propertyId || isNaN(propertyId)) {
            return res.status(400).json({ error: 'Invalid property ID' });
        }

        const [promo] = await pool.query(
            'SELECT PromotionId FROM Promotion WHERE PromotionId = ?',
            [promotionId]
        );

        if (promo.length === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        const [prop] = await pool.query(
            'SELECT PropertyId FROM Property WHERE PropertyId = ?',
            [propertyId]
        );

        if (prop.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const [existing] = await pool.query(
            'SELECT * FROM benefits_from WHERE PropertyId = ?',
            [propertyId]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE benefits_from SET PromotionId = ? WHERE PropertyId = ?',
                [promotionId, propertyId]
            );
        } else {
            await pool.query(
                'INSERT INTO benefits_from (PromotionId, PropertyId, BookingId) VALUES (?, ?, NULL)',
                [promotionId, propertyId]
            );
        }

        res.json({ 
            message: 'Promotion linked to property successfully',
            promotionId: promotionId,
            propertyId: propertyId
        });

    } catch (error) {
        console.error('Link promotion error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/features', async (req, res) => {
    try {
        const { FeatureName } = req.body;
        if (!FeatureName || typeof FeatureName !== 'string' || !FeatureName.trim()) {
            return res.status(400).json({ error: 'FeatureName is required' });
        }
        const [result] = await pool.query(
            'INSERT INTO Feature (FeatureName) VALUES (?)',
            [FeatureName.trim()]
        );
        res.status(201).json({ FeatureId: result.insertId, FeatureName: FeatureName.trim() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { OwnerId } = req.body;

        const [existing] = await pool.query(
            'SELECT OwnerId FROM Property WHERE PropertyId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (existing[0].OwnerId !== OwnerId) {
            return res.status(403).json({ error: 'You can only delete your own properties' });
        }

        await pool.query('START TRANSACTION');

        try {
            await pool.query('DELETE FROM Payment_Transaction WHERE PropertyId = ?', [id]);

            // Images are on Cloudinary — just delete DB records, no local file deletion needed
            await pool.query('DELETE FROM PROPERTY_Image WHERE PropertyId = ?', [id]);
            await pool.query('DELETE FROM Booking WHERE PropertyId = ?', [id]);
            await pool.query('DELETE FROM Property WHERE PropertyId = ?', [id]);

            await pool.query('COMMIT');

            res.json({ message: 'Property and all related records deleted successfully!' });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Booking endpoints
app.post('/api/bookings', async (req, res) => {
    try {
        const {
            UserId, PropertyId, StartDate, EndDate, LengthOfStay,
            TotalPrice, BasePrice, DiscountAmount, PhoneNumber, BookingStatus
        } = req.body;

        if (!UserId || !PropertyId || !StartDate || !EndDate || !LengthOfStay || !TotalPrice || !BasePrice) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        const [users] = await pool.query(
            'SELECT UserId, UserType FROM USER_a WHERE UserId = ? AND UserType = "Renter"',
            [UserId]
        );

        if (users.length === 0) {
            return res.status(403).json({ error: 'Only renters can make bookings' });
        }

        const [properties] = await pool.query(
            'SELECT PropertyId, AvailabilityStatus FROM Property WHERE PropertyId = ?',
            [PropertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (properties[0].AvailabilityStatus !== 'Active') {
            return res.status(400).json({ error: 'Property is not available for booking' });
        }

        const [existing] = await pool.query(
            `SELECT BookingId FROM Booking 
             WHERE PropertyId = ? 
             AND BookingStatus != 'Cancelled'
             AND (
                 (StartDate <= ? AND EndDate >= ?) OR
                 (StartDate <= ? AND EndDate >= ?) OR
                 (StartDate >= ? AND EndDate <= ?)
             )`,
            [PropertyId, StartDate, StartDate, EndDate, EndDate, StartDate, EndDate]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Property is already booked for these dates' });
        }

        const [result] = await pool.query(
            `INSERT INTO Booking 
            (UserId, PropertyId, StartDate, EndDate, LengthOfStay, TotalPrice, BookingStatus, PhoneNumber, BasePrice, DiscountAmount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [UserId, PropertyId, StartDate, EndDate, LengthOfStay, TotalPrice, BookingStatus || 'Confirmed', PhoneNumber, BasePrice, DiscountAmount || 0]
        );

        res.status(201).json({
            message: 'Booking confirmed successfully!',
            bookingId: result.insertId
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [bookings] = await pool.query(
            `SELECT b.*, 
             p.Title as PropertyTitle, p.City, p.Wilaya,
             CONCAT(u.FirstName, ' ', u.LastName) as OwnerName
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             JOIN USER_a u ON p.OwnerId = u.UserId
             WHERE b.UserId = ?
             ORDER BY b.BookingId DESC`,
            [userId]
        );

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { BookingStatus, UserId } = req.body;

        const [existing] = await pool.query(
            'SELECT UserId FROM Booking WHERE BookingId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (existing[0].UserId !== UserId) {
            return res.status(403).json({ error: 'You can only modify your own bookings' });
        }

        await pool.query(
            'UPDATE Booking SET BookingStatus = ? WHERE BookingId = ?',
            [BookingStatus, id]
        );

        res.json({ message: 'Booking updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User profile endpoints
app.get('/api/users/:id', async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT UserId, CONCAT(FirstName, ' ', LastName) as FullName,
             FirstName, LastName, Email, PhoneNumber, UserType, 
             IDCardNumber, IDCardFrontPath, AverageRating, TotalReviews
             FROM USER_a 
             WHERE UserId = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        // IDCardFrontPath is already a full Cloudinary HTTPS URL
        user.IDCardFrontURL = user.IDCardFrontPath || null;

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { UserId, FirstName, LastName, Email, PhoneNumber } = req.body;

        if (parseInt(id) !== UserId) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }

        const [existing] = await pool.query(
            'SELECT UserId FROM USER_a WHERE UserId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (Email) {
            const [emailCheck] = await pool.query(
                'SELECT UserId FROM USER_a WHERE Email = ? AND UserId != ?',
                [Email, id]
            );

            if (emailCheck.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        await pool.query(
            `UPDATE USER_a 
             SET FirstName = ?, LastName = ?, Email = ?, PhoneNumber = ?
             WHERE UserId = ?`,
            [FirstName, LastName, Email, PhoneNumber, id]
        );

        res.json({ message: 'Profile updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { UserId } = req.body;

        if (parseInt(id) !== UserId) {
            return res.status(403).json({ error: 'You can only delete your own account' });
        }

        const [existing] = await pool.query(
            'SELECT UserId, UserType, IDCardFrontPath FROM USER_a WHERE UserId = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = existing[0];

        if (user.UserType === 'Owner') {
            const [properties] = await pool.query(
                'SELECT PropertyId FROM Property WHERE OwnerId = ?',
                [id]
            );

            for (const property of properties) {
                // Images are on Cloudinary — just delete DB records
                await pool.query('DELETE FROM PROPERTY_Image WHERE PropertyId = ?', [property.PropertyId]);
            }

            await pool.query('DELETE FROM Property WHERE OwnerId = ?', [id]);
        }

        if (user.UserType === 'Renter') {
            await pool.query('DELETE FROM Booking WHERE UserId = ?', [id]);
        }

        // IDCardFrontPath is a Cloudinary URL — no local file to delete
        await pool.query('DELETE FROM USER_a WHERE UserId = ?', [id]);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PAYMENT ENDPOINTS - CHARGILY INTEGRATION
// ============================================

app.get('/api/packages', async (req, res) => {
    try {
        const [packages] = await pool.query(
            'SELECT * FROM AdvertPackage ORDER BY Price ASC'
        );
        res.json(packages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment/create-checkout', async (req, res) => {
    try {
        const { propertyId, packageId, ownerId } = req.body;

        console.log('💳 Creating checkout:', { propertyId, packageId, ownerId });

        if (!propertyId || !packageId || !ownerId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [packages] = await pool.query(
            'SELECT * FROM AdvertPackage WHERE PackageId = ?',
            [packageId]
        );

        if (packages.length === 0) {
            return res.status(404).json({ error: 'Package not found' });
        }

        const pkg = packages[0];

        const [owners] = await pool.query(
            'SELECT Email, PhoneNumber, CONCAT(FirstName, " ", LastName) as FullName FROM USER_a WHERE UserId = ?',
            [ownerId]
        );

        if (owners.length === 0) {
            return res.status(404).json({ error: 'Owner not found' });
        }

        const [result] = await pool.query(
            `INSERT INTO Payment_Transaction 
            (PropertyId, OwnerId, PackageId, Amount, PaymentMethod, PaymentStatus)
            VALUES (?, ?, ?, ?, 'Chargily', 'Pending')`,
            [propertyId, ownerId, packageId, pkg.Price]
        );

        const dbTransactionId = result.insertId;
        const CLIENT_URL = 'https://darlink-production.up.railway.app';
        
        const checkoutData = {
            amount: Math.round(pkg.Price * 100),
            currency: 'dzd',
            success_url: `${CLIENT_URL}/payment-success.html?propertyId=${propertyId}`,  
            failure_url: `${CLIENT_URL}/payment-failed.html?propertyId=${propertyId}`,   
            description: `${pkg.PackageName} - Property ${propertyId}`,
            locale: 'ar'
        };

        console.log('📤 Sending to Chargily:', checkoutData);

        const checkout = await chargily.createCheckout(checkoutData);

        console.log('✅ Checkout created:', checkout.id);

        await pool.query(
            'UPDATE Payment_Transaction SET TransactionReference = ? WHERE TransactionId = ?',
            [checkout.id, dbTransactionId]
        );

        res.json({
            success: true,
            checkoutId: checkout.id,
            checkoutUrl: checkout.checkout_url
        });

    } catch (error) {
        console.error('❌ Checkout error:', error);
        res.status(500).json({ 
            error: 'Failed to create checkout',
            details: error.message 
        });
    }
});

app.get('/api/payment/status/:checkoutId', async (req, res) => {
    try {
        const { checkoutId } = req.params;

        const [transactions] = await pool.query(
            `SELECT pt.*, pkg.PackageName, pkg.PackageType
             FROM Payment_Transaction pt
             JOIN AdvertPackage pkg ON pt.PackageId = pkg.PackageId
             WHERE pt.TransactionReference = ?`,
            [checkoutId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transaction = transactions[0];

        res.json({
            success: true,
            status: transaction.PaymentStatus,
            amount: transaction.Amount,
            package: transaction.PackageName,
            expiryDate: transaction.ExpiryDate
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/payments/owner/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;

        const [payments] = await pool.query(
            `SELECT pt.*, 
             pkg.PackageName, pkg.PackageType,
             p.Title as PropertyTitle
             FROM Payment_Transaction pt
             JOIN AdvertPackage pkg ON pt.PackageId = pkg.PackageId
             JOIN Property p ON pt.PropertyId = p.PropertyId
             WHERE pt.OwnerId = ?
             ORDER BY pt.PaymentDate DESC`,
            [ownerId]
        );

        res.json(payments);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test-chargily-custom', async (req, res) => {
    try {
        const apiKey = process.env.CHARGILY_SECRET_KEY;
        const baseURL = 'https://pay.chargily.net/api/v2';
        const CLIENT_URL = 'https://darlink-production.up.railway.app';
        const testData = {
            amount: 10000,
            currency: "dzd",
            success_url: `${CLIENT_URL}/payment-success.html`,
            failure_url: `${CLIENT_URL}/payment-failed.html`,
            description: "Test Payment",
            customer_email: "test@example.com"
        };
        
        const response = await fetch(`${baseURL}/checkouts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        
        res.json({
            success: response.ok,
            status: response.status,
            data: data
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/test-chargily-new', async (req, res) => {
    try {
        const CLIENT_URL = 'https://darlink-production.up.railway.app';
        const testData = {
            amount: 5000,
            currency: "dzd",
            success_url: `${CLIENT_URL}/payment-success.html`,
            failure_url: `${CLIENT_URL}/payment-failed.html`,
            description: "Test Payment",
            locale: "en"
        };
        
        console.log('🧪 Testing Chargily with:', testData);
        
        const checkout = await chargily.createCheckout(testData);
        
        res.json({
            success: true,
            message: 'Chargily API works!',
            checkout: checkout
        });

    } catch (error) {
        console.error('❌ Test error:', error);
        res.json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
});

app.get('/api/properties', async (req, res) => {
    try {
        console.log('🔄 Checking for expired packages...');
        
        const [featuredReset] = await pool.query(`
            UPDATE Property 
            SET IsFeatured = FALSE 
            WHERE IsFeatured = TRUE 
            AND FeaturedUntil IS NOT NULL 
            AND FeaturedUntil < CURDATE()
        `);
        console.log(`✅ Reset ${featuredReset.affectedRows} expired Featured properties`);
        
        const [boostedReset] = await pool.query(`
            UPDATE Property 
            SET IsBoosted = FALSE 
            WHERE IsBoosted = TRUE 
            AND BoostedUntil IS NOT NULL 
            AND BoostedUntil < CURDATE()
        `);
        console.log(`✅ Reset ${boostedReset.affectedRows} expired Boosted properties`);

        const [properties] = await pool.query(
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
        );

        console.log(`📊 Found ${properties.length} properties`);

        for (let property of properties) {
            const [images] = await pool.query(
                'SELECT ImageURL FROM PROPERTY_Image WHERE PropertyId = ? ORDER BY ImageId ASC LIMIT 1',
                [property.PropertyId]
            );
            
            // ImageURL is already a full Cloudinary HTTPS URL — use directly
            property.MainImage = images.length > 0 ? images[0].ImageURL : null;

            const [feats] = await pool.query(
                `SELECT f.FeatureId, f.FeatureName
                 FROM Feature f
                 JOIN has_features hf ON f.FeatureId = hf.FeatureId
                 WHERE hf.PropertyId = ?`,
                [property.PropertyId]
            );
            property.Features = feats;
            property.HasPromotion = property.HasPromotion === 1;
        }

        res.json(properties);
    } catch (error) {
        console.error('❌ Get properties error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CHAT/MESSAGING ENDPOINTS
// ============================================

app.post('/api/messages', async (req, res) => {
    try {
        const { senderId, receiverId, propertyId, messageText } = req.body;

        if (!senderId || !receiverId || !messageText) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.query(
            `INSERT INTO Message (SenderId, ReceiverId, PropertyId, MessageText)
             VALUES (?, ?, ?, ?)`,
            [senderId, receiverId, propertyId, messageText]
        );

        const [users] = await pool.query(
            'SELECT UserId, UserType FROM USER_a WHERE UserId IN (?, ?)',
            [senderId, receiverId]
        );

        const sender = users.find(u => u.UserId === parseInt(senderId));

        let renterId, ownerId;
        if (sender.UserType === 'Renter') {
            renterId = senderId;
            ownerId = receiverId;
        } else {
            renterId = receiverId;
            ownerId = senderId;
        }

        await pool.query(
            `INSERT INTO Conversation (RenterId, OwnerId, PropertyId, LastMessageAt)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE LastMessageAt = NOW()`,
            [renterId, ownerId, propertyId]
        );

        res.status(201).json({
            message: 'Message sent successfully',
            messageId: result.insertId
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;
        const { propertyId } = req.query;

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
        
        const params = [userId, otherUserId, otherUserId, userId];

        if (propertyId) {
            query += ' AND m.PropertyId = ?';
            params.push(propertyId);
        }

        query += ' ORDER BY m.SentAt ASC';

        const [messages] = await pool.query(query, params);

        await pool.query(
            `UPDATE Message 
             SET IsRead = TRUE 
             WHERE ReceiverId = ? AND SenderId = ? AND IsRead = FALSE`,
            [userId, otherUserId]
        );

        res.json(messages);

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [user] = await pool.query(
            'SELECT UserType FROM USER_a WHERE UserId = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userType = user[0].UserType;

        let query;
        if (userType === 'Renter') {
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
        } else {
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
        }

        const [conversations] = await pool.query(query, [userId, userId]);

        res.json(conversations);

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/messages/unread/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM Message WHERE ReceiverId = ? AND IsRead = FALSE',
            [userId]
        );

        res.json({ unreadCount: result[0].count });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/properties/:propertyId/owner', async (req, res) => {
    try {
        const { propertyId } = req.params;

        const [properties] = await pool.query(
            `SELECT p.OwnerId, 
             CONCAT(u.FirstName, ' ', u.LastName) as OwnerName,
             u.Email as OwnerEmail,
             u.PhoneNumber as OwnerPhone
             FROM Property p
             JOIN USER_a u ON p.OwnerId = u.UserId
             WHERE p.PropertyId = ?`,
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(properties[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// REVIEW ENDPOINTS
// ============================================

app.post('/api/reviews', async (req, res) => {
    try {
        const { reviewerId, reviewedUserId, propertyId, bookingId, rating, comment, reviewerType, reviewedRole } = req.body;

        if (!reviewerId || !reviewedUserId || !rating || !reviewerType || !reviewedRole) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        if (bookingId) {
            const [existing] = await pool.query(
                'SELECT ReviewId FROM Review WHERE ReviewerId = ? AND BookingId = ? AND ReviewedUserId = ?',
                [reviewerId, bookingId, reviewedUserId]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: 'You have already reviewed this booking' });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO Review (ReviewerId, ReviewedUserId, PropertyId, BookingId, Rating, Comment, ReviewerType, ReviewedRole)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [reviewerId, reviewedUserId, propertyId, bookingId, rating, comment, reviewerType, reviewedRole]
        );

        await updateUserRating(reviewedUserId);
        if (propertyId) {
            await updatePropertyRating(propertyId);
        }

        res.status(201).json({
            message: 'Review submitted successfully',
            reviewId: result.insertId
        });

    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [reviews] = await pool.query(
            `SELECT r.*, 
             CONCAT(reviewer.FirstName, ' ', reviewer.LastName) as ReviewerName,
             p.Title as PropertyTitle
             FROM Review r
             JOIN USER_a reviewer ON r.ReviewerId = reviewer.UserId
             LEFT JOIN Property p ON r.PropertyId = p.PropertyId
             WHERE r.ReviewedUserId = ?
             ORDER BY r.ReviewDate DESC`,
            [userId]
        );

        const [stats] = await pool.query(
            'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE ReviewedUserId = ?',
            [userId]
        );

        res.json({
            reviews: reviews,
            averageRating: parseFloat(stats[0].avgRating) || 0,
            totalReviews: parseInt(stats[0].totalReviews) || 0
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/property/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;

        const [reviews] = await pool.query(
            `SELECT r.*, 
             CONCAT(reviewer.FirstName, ' ', reviewer.LastName) as ReviewerName
             FROM Review r
             JOIN USER_a reviewer ON r.ReviewerId = reviewer.UserId
             WHERE r.PropertyId = ? AND r.ReviewedRole = 'Property'
             ORDER BY r.ReviewDate DESC`,
            [propertyId]
        );

        const [stats] = await pool.query(
            'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE PropertyId = ? AND ReviewedRole = "Property"',
            [propertyId]
        );

        res.json({
            reviews: reviews,
            averageRating: parseFloat(stats[0].avgRating) || 0,
            totalReviews: parseInt(stats[0].totalReviews) || 0
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/by-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const [reviews] = await pool.query(
            `SELECT r.*, 
             CONCAT(reviewed.FirstName, ' ', reviewed.LastName) as ReviewedUserName,
             p.Title as PropertyTitle
             FROM Review r
             JOIN USER_a reviewed ON r.ReviewedUserId = reviewed.UserId
             LEFT JOIN Property p ON r.PropertyId = p.PropertyId
             WHERE r.ReviewerId = ?
             ORDER BY r.ReviewDate DESC`,
            [userId]
        );

        res.json({ reviews: reviews });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/:bookingId/can-review', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { userId } = req.query;

        const [bookings] = await pool.query(
            `SELECT b.*, p.OwnerId, p.Title as PropertyTitle
             FROM Booking b
             JOIN Property p ON b.PropertyId = p.PropertyId
             WHERE b.BookingId = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];
        const isCompleted = booking.BookingStatus === 'Completed' || new Date(booking.EndDate) < new Date();

        if (!isCompleted) {
            return res.json({ canReview: false, reason: 'Booking not completed yet' });
        }

        const [existingProperty] = await pool.query(
            'SELECT ReviewId FROM Review WHERE ReviewerId = ? AND BookingId = ? AND ReviewedRole = "Property"',
            [userId, bookingId]
        );

        const [existingOwner] = await pool.query(
            'SELECT ReviewId FROM Review WHERE ReviewerId = ? AND BookingId = ? AND ReviewedUserId = ?',
            [userId, bookingId, booking.OwnerId]
        );

        res.json({ 
            canReview: true,
            canReviewProperty: existingProperty.length === 0,
            canReviewOwner: existingOwner.length === 0,
            booking: booking 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/property/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;

        const [bookings] = await pool.query(
            `SELECT b.*, 
             CONCAT(u.FirstName, ' ', u.LastName) as RenterName,
             u.PhoneNumber
             FROM Booking b
             JOIN USER_a u ON b.UserId = u.UserId
             WHERE b.PropertyId = ?
             ORDER BY b.StartDate DESC`,
            [propertyId]
        );

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/:id', async (req, res) => {
    try {
        const [bookings] = await pool.query(
            'SELECT * FROM Booking WHERE BookingId = ?',
            [req.params.id]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(bookings[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
async function updateUserRating(userId) {
    const [stats] = await pool.query(
        'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE ReviewedUserId = ?',
        [userId]
    );
    await pool.query(
        'UPDATE USER_a SET AverageRating = ?, TotalReviews = ? WHERE UserId = ?',
        [stats[0].avgRating || 0, stats[0].totalReviews || 0, userId]
    );
}

async function updatePropertyRating(propertyId) {
    const [stats] = await pool.query(
        'SELECT AVG(Rating) as avgRating, COUNT(*) as totalReviews FROM Review WHERE PropertyId = ? AND ReviewedRole = "Property"',
        [propertyId]
    );
    await pool.query(
        'UPDATE Property SET AverageRating = ?, TotalReviews = ? WHERE PropertyId = ?',
        [stats[0].avgRating || 0, stats[0].totalReviews || 0, propertyId]
    );
}

// ============================================
// BOOKING PAYMENT ENDPOINTS
// ============================================

app.post('/api/payment/create-booking-payment', async (req, res) => {
    try {
        const { bookingId } = req.body;

        console.log('💳 Creating booking payment for:', bookingId);

        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        const [bookings] = await pool.query(
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
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];

        if (booking.BookingStatus === 'Confirmed' && booking.PaymentReference) {
            return res.status(400).json({ error: 'This booking has already been paid' });
        }

        const totalAmount = parseFloat(booking.TotalPrice);
        const ownerShare = parseFloat((totalAmount / 1.1).toFixed(2));
        const platformFee = parseFloat((totalAmount - ownerShare).toFixed(2));

        console.log('💰 Payment breakdown:', { total: totalAmount, ownerShare, platformFee });

        await pool.query(
            `UPDATE Booking SET OwnerShare = ?, PlatformFee = ? WHERE BookingId = ?`,
            [ownerShare, platformFee, bookingId]
        );

        const CLIENT_URL = 'https://darlink-production.up.railway.app';
        const checkoutData = {
            amount: Math.round(totalAmount * 100),
            currency: 'dzd',
            success_url: `${CLIENT_URL}/booking-payment-success.html?bookingId=${bookingId}`,
            failure_url: `${CLIENT_URL}/booking-payment-failed.html?bookingId=${bookingId}`,
            description: `Booking: ${booking.PropertyTitle} (${booking.LengthOfStay} nights)`,
            locale: 'ar'
        };

        console.log('📤 Sending to Chargily:', checkoutData);

        const checkout = await chargily.createCheckout(checkoutData);

        console.log('✅ Checkout created:', checkout.id);

        await pool.query(
            `UPDATE Booking SET PaymentReference = ? WHERE BookingId = ?`,
            [checkout.id, bookingId]
        );

        await pool.query(
            `INSERT INTO Payment_History 
            (PaymentType, ReferenceId, PayerId, Amount, PlatformFee, RecipientShare, ChargilyCheckoutId, PaymentStatus)
            VALUES ('Booking', ?, ?, ?, ?, ?, ?, 'Pending')`,
            [bookingId, booking.UserId, totalAmount, platformFee, ownerShare, checkout.id]
        );

        res.json({
            success: true,
            checkoutId: checkout.id,
            checkoutUrl: checkout.checkout_url,
            amount: totalAmount,
            breakdown: {
                total: totalAmount,
                ownerWillReceive: ownerShare,
                platformFee: platformFee
            }
        });

    } catch (error) {
        console.error('❌ Booking payment error:', error);
        res.status(500).json({ 
            error: 'Failed to create booking payment',
            details: error.message 
        });
    }
});

app.delete('/api/bookings/cancel/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const [bookings] = await pool.query(
            'SELECT BookingId, PropertyId, BookingStatus, PaymentReference FROM Booking WHERE BookingId = ?',
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Booking not found or already cancelled' 
            });
        }

        const booking = bookings[0];

        if (booking.BookingStatus === 'Confirmed' && booking.PaymentReference) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot cancel a confirmed booking' 
            });
        }

        const [result] = await pool.query(
            'DELETE FROM Booking WHERE BookingId = ?',
            [bookingId]
        );

        if (result.affectedRows > 0) {
            res.json({ 
                success: true,
                message: 'Booking cancelled successfully. Dates are now available.',
                propertyId: booking.PropertyId
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to cancel booking' });
        }

    } catch (error) {
        console.error('❌ Cancel booking error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Webhook — handles BOTH package and booking payments
app.post('/api/payment/webhook', async (req, res) => {
    try {
        console.log('🔔 Webhook received:', req.body);

        const event = req.body;
        const checkoutId = event.id || event.data?.id;
        const status = event.status || event.data?.status;

        if (status === 'paid' || status === 'completed') {
            console.log('✅ Payment successful:', checkoutId);

            const [packagePayments] = await pool.query(
                `SELECT pt.*, pkg.DurationDays, pkg.PackageType, pkg.MaxImages
                 FROM Payment_Transaction pt
                 JOIN AdvertPackage pkg ON pt.PackageId = pkg.PackageId
                 WHERE pt.TransactionReference = ?`,
                [checkoutId]
            );

            if (packagePayments.length > 0) {
                const transaction = packagePayments[0];
                console.log('📦 Package payment detected');

                await pool.query(
                    `UPDATE Payment_Transaction 
                     SET PaymentStatus = 'Completed', PaymentDate = NOW()
                     WHERE TransactionReference = ?`,
                    [checkoutId]
                );

                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + transaction.DurationDays);

                if (transaction.PackageType === 'Premium') {
                    await pool.query(
                        `UPDATE Property SET IsFeatured = TRUE, FeaturedUntil = ?, MaxImages = ? WHERE PropertyId = ?`,
                        [expiryDate, transaction.MaxImages, transaction.PropertyId]
                    );
                    console.log('✅ Property upgraded to Premium');
                } else if (transaction.PackageType === 'Boost') {
                    await pool.query(
                        `UPDATE Property SET IsBoosted = TRUE, BoostedUntil = ?, MaxImages = ? WHERE PropertyId = ?`,
                        [expiryDate, transaction.MaxImages, transaction.PropertyId]
                    );
                    console.log('✅ Property boosted');
                }

                await pool.query(
                    'UPDATE Payment_Transaction SET ExpiryDate = ? WHERE TransactionId = ?',
                    [expiryDate, transaction.TransactionId]
                );

                return res.json({ received: true, type: 'package' });
            }

            const [bookings] = await pool.query(
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
                [checkoutId]
            );

            if (bookings.length > 0) {
                const booking = bookings[0];
                console.log('🏠 Booking payment detected');

                await pool.query(
                    `UPDATE Booking SET BookingStatus = 'Confirmed', PaymentDate = NOW() WHERE BookingId = ?`,
                    [booking.BookingId]
                );

                await pool.query(
                    `UPDATE Payment_History 
                     SET PaymentStatus = 'Completed', PaymentDate = NOW()
                     WHERE ChargilyCheckoutId = ? AND PaymentType = 'Booking'`,
                    [checkoutId]
                );

                console.log('✅ Booking confirmed! Owner payout pending.');
                return res.json({ received: true, type: 'booking' });
            }

            console.log('⚠️ Payment not found in database');
            return res.json({ received: true, type: 'unknown' });

        } else if (status === 'failed' || status === 'expired') {
            console.log('❌ Payment failed:', checkoutId);

            await pool.query(
                `UPDATE Payment_Transaction SET PaymentStatus = 'Failed' WHERE TransactionReference = ?`,
                [checkoutId]
            );

            await pool.query(
                `UPDATE Booking SET BookingStatus = 'Cancelled' WHERE PaymentReference = ?`,
                [checkoutId]
            );

            await pool.query(
                `UPDATE Payment_History SET PaymentStatus = 'Failed' WHERE ChargilyCheckoutId = ?`,
                [checkoutId]
            );
        }

        res.json({ received: true });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/pending-payouts', async (req, res) => {
    try {
        const [payouts] = await pool.query(
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
        );

        const totalPending = payouts.reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);
        const totalPlatformProfit = payouts.reduce((sum, p) => sum + parseFloat(p.PlatformFee), 0);

        res.json({
            payouts: payouts,
            summary: {
                count: payouts.length,
                totalOwnerPayouts: totalPending,
                totalPlatformProfit: totalPlatformProfit
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/mark-payout-complete', async (req, res) => {
    try {
        const { bookingId, payoutMethod, payoutReference } = req.body;

        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        const [result] = await pool.query(
            `UPDATE Booking 
             SET OwnerPaidOut = TRUE, PayoutDate = NOW(), PayoutMethod = ?, PayoutReference = ?
             WHERE BookingId = ?`,
            [payoutMethod || 'Manual Transfer', payoutReference || null, bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ success: true, message: 'Payout marked as complete' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/owner/payout-history/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;

        const [payouts] = await pool.query(
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
            [ownerId]
        );

        const totalEarned = payouts
            .filter(p => p.OwnerPaidOut)
            .reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);

        const totalPending = payouts
            .filter(p => !p.OwnerPaidOut && new Date(p.EndDate) < new Date())
            .reduce((sum, p) => sum + parseFloat(p.OwnerShare), 0);

        res.json({
            payouts: payouts,
            summary: {
                totalPaidOut: totalEarned,
                totalPending: totalPending,
                count: payouts.length
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/payment/booking-status/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const [bookings] = await pool.query(
            `SELECT BookingStatus, PaymentReference, PaymentDate, 
             TotalPrice, OwnerShare, PlatformFee, OwnerPaidOut, PayoutDate
             FROM Booking WHERE BookingId = ?`,
            [bookingId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(bookings[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ================================================================
// ADD THIS ROUTE TO app.js to diagnose the Railway Cloudinary issue
// Place it near the top with other test endpoints
// Then visit: https://darlink-production.up.railway.app/api/test-cloudinary
// ================================================================

app.get('/api/test-cloudinary', async (req, res) => {
  const vars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? `✅ set: ${process.env.CLOUDINARY_CLOUD_NAME}` : '❌ MISSING',
    CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY    ? '✅ set' : '❌ MISSING',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ set' : '❌ MISSING',
  };

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      ok: false,
      message: 'Missing Cloudinary environment variables in Railway',
      vars
    });
  }

  try {
    const result = await cloudinaryV2.api.ping();
    res.json({ 
      ok: true, 
      message: 'Cloudinary is fully working! Images will upload and persist after redeploy.', 
      ping: result,
      vars 
    });
  } catch (err) {
    res.status(500).json({ 
      ok: false, 
      message: 'Ping failed - check Railway logs for exact error',
      error: err.message,
      code: err.http_code || err.status,
      vars 
    });
  }
});


app.get('/api/test-cloudinary-debug', async (req, res) => {
  try {
    const result = await cloudinaryV2.api.ping();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error_message: err.message,
      http_code: err.http_code,
      name: err.name,
      full_error: err.toString()
    });
  }
});

// Start server
app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    console.log(`🖼️  Images: Cloudinary (persistent across deploys)`);
    console.log(`🔑 OCR.space API: ${process.env.OCR_SPACE_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});