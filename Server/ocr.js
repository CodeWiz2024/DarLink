import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Extract ID number from image using OCR.space API
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<object>} - Extraction result
 */
export async function extractIDFromImage(imagePath) {
    try {
        console.log('🔍 Starting OCR.space extraction for:', imagePath);

        if (!process.env.OCR_SPACE_API_KEY) {
            return {
                success: false,
                error: 'OCR.space API key not configured',
                idNumber: null
            };
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(imagePath));
        formData.append('apikey', process.env.OCR_SPACE_API_KEY);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');

        console.log('📤 Sending request to OCR.space...');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`OCR.space API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📥 OCR.space response received');

        if (data.IsErroredOnProcessing) {
            console.error('❌ OCR.space processing error:', data.ErrorMessage);
            return {
                success: false,
                error: data.ErrorMessage || 'OCR processing failed',
                idNumber: null
            };
        }

        if (!data.ParsedResults || data.ParsedResults.length === 0) {
            return {
                success: false,
                error: 'No text detected in image',
                idNumber: null
            };
        }

        const parsedText = data.ParsedResults[0].ParsedText;
        console.log('📄 Detected text:', parsedText);

        const extractionResult = extractIDNumber(parsedText);

        if (extractionResult.idNumber) {
            console.log('✅ ID Number extracted:', extractionResult.idNumber);
            return {
                success: true,
                idNumber: extractionResult.idNumber,
                confidence: extractionResult.confidence,
                fullText: parsedText,
                pattern: extractionResult.pattern
            };
        } else {
            console.log('❌ No ID number pattern found in text');
            return {
                success: false,
                error: 'Could not find ID number pattern',
                idNumber: null,
                fullText: parsedText
            };
        }

    } catch (error) {
        console.error('❌ OCR.space Error:', error);
        return {
            success: false,
            error: error.message,
            idNumber: null
        };
    }
}

/**
 * Extract ID number from OCR text using patterns
 * @param {string} text - OCR detected text
 * @returns {object} - ID number, confidence, and pattern used
 */
function extractIDNumber(text) {
    const cleanText = text.replace(/\s+/g, ' ').trim().toUpperCase();
    const noSpaceText = text.replace(/\s+/g, '').toUpperCase();

    console.log('🔍 Analyzing text for ID patterns...');

    const patterns = [
        {
            name: 'Algerian ID - 18 digits (no spaces)',
            regex: /\b\d{18}\b/,
            confidence: 0.95,
            text: noSpaceText
        },
        {
            name: 'Algerian ID - 18 digits (with spaces)',
            regex: /\b(\d{2}\s?\d{3}\s?\d{4}\s?\d{5}\s?\d{2}\s?\d{2})\b/,
            confidence: 0.93,
            text: cleanText
        },
        {
            name: 'Generic 17 digits (possible OCR error)',
            regex: /\b\d{17}\b/,
            confidence: 0.75,
            text: noSpaceText
        },
        {
            name: 'Generic 15-16 digits',
            regex: /\b\d{15,16}\b/,
            confidence: 0.70,
            text: noSpaceText
        },
        {
            name: 'Longest number sequence (12+ digits)',
            regex: /\d{12,}/,
            confidence: 0.50,
            text: noSpaceText
        }
    ];

    for (let pattern of patterns) {
        const match = pattern.text.match(pattern.regex);
        if (match) {
            let idNumber = match[0].replace(/\s/g, '');
            idNumber = idNumber.replace(/^[A-Z]+/, '');
            
            console.log(`✅ Match found with pattern: ${pattern.name}`);
            console.log(`   ID Number: ${idNumber}`);
            console.log(`   Confidence: ${pattern.confidence * 100}%`);
            
            return {
                idNumber: idNumber,
                confidence: pattern.confidence,
                pattern: pattern.name
            };
        }
    }

    const allNumbers = noSpaceText.match(/\d+/g);
    if (allNumbers && allNumbers.length > 0) {
        const longest = allNumbers.reduce((a, b) => a.length > b.length ? a : b);
        
        if (longest.length >= 12) {
            console.log('⚠️  Using fallback - longest number:', longest);
            return {
                idNumber: longest,
                confidence: 0.40,
                pattern: 'Fallback - Longest Number'
            };
        }
    }

    console.log('❌ No ID number pattern found');
    return {
        idNumber: null,
        confidence: 0,
        pattern: null
    };
}

/**
 * Validate Algerian National ID card number
 * Format: GG YYY CCCC NNNNN SS KK
 * GG = Gender/Status (2 digits): 10=male, 11=female, 20=abroad, etc.
 * YYY = Year of birth (3 digits): last 3 digits of year
 * CCCC = Municipality code (4 digits)
 * NNNNN = Birth certificate number (5 digits)
 * SS = Sequential number (2 digits)
 * KK = Control key (2 digits)
 * 
 * @param {string} idNumber - ID number to validate
 * @returns {boolean} - True if valid format
 */
export function validateAlgerianID(idNumber) {
    const clean = idNumber.replace(/[\s-]/g, '');
    
    console.log('🔍 Validating Algerian ID:', clean);
    
    // Must be exactly 18 digits
    if (!/^\d{18}$/.test(clean)) {
        console.log('❌ Validation failed: Not 18 digits');
        return false;
    }

    // Extract components based on correct Algerian format
    const genderStatus = clean.substring(0, 2);    // GG
    const birthYear = clean.substring(2, 5);       // YYY
    const municipality = clean.substring(5, 9);    // CCCC
    const birthCert = clean.substring(9, 14);      // NNNNN
    const sequential = clean.substring(14, 16);    // SS
    const controlKey = clean.substring(16, 18);    // KK

    // Validate gender/status code (10-29 are common values)
    const gg = parseInt(genderStatus);
    if (gg < 10 || gg > 29) {
        console.log('⚠️  Warning: Unusual gender/status code:', genderStatus);
    }

    // Validate birth year (000-999)
    const yyy = parseInt(birthYear);
    if (yyy > 999) {
        console.log('❌ Validation failed: Invalid year value:', birthYear);
        return false;
    }

    // Log details for debugging
    console.log('✅ ID validation passed (18 digits)');
    console.log(`   Gender/Status: ${genderStatus} (${getGenderStatus(genderStatus)})`);
    console.log(`   Birth Year: ${getFullYear(birthYear)}`);
    console.log(`   Municipality: ${municipality}`);
    console.log(`   Birth Certificate: ${birthCert}`);
    console.log(`   Sequential: ${sequential}`);
    console.log(`   Control Key: ${controlKey}`);
    
    return true;
}

/**
 * Helper function to interpret gender/status code
 */
function getGenderStatus(code) {
    const statusMap = {
        '10': 'Male born in Algeria',
        '11': 'Female born in Algeria',
        '20': 'Born abroad',
        '12': 'Special case (duplicate/assumed)',
        '13': 'Special case',
        '14': 'Special case'
    };
    return statusMap[code] || 'Unknown status';
}

/**
 * Helper function to get full birth year
 */
function getFullYear(yyy) {
    const year = parseInt(yyy);
    // If year <= current year's last 3 digits, assume 2000s, else 1900s
    const currentYear = new Date().getFullYear();
    const currentYYY = currentYear % 1000;
    
    if (year <= currentYYY + 10) {
        return 2000 + year;
    } else {
        return 1000 + year; // 1900s
    }
}

/**
 * Get detailed information from Algerian ID number
 * @param {string} idNumber - 18 digit ID number
 * @returns {object} - Parsed ID information
 */
export function parseAlgerianID(idNumber) {
    const clean = idNumber.replace(/[\s-]/g, '');
    
    if (!validateAlgerianID(clean)) {
        return null;
    }

    const genderStatus = clean.substring(0, 2);
    const birthYear = clean.substring(2, 5);
    const municipality = clean.substring(5, 9);
    const birthCert = clean.substring(9, 14);
    const sequential = clean.substring(14, 16);
    const controlKey = clean.substring(16, 18);

    return {
        genderStatus: genderStatus,
        genderStatusText: getGenderStatus(genderStatus),
        birthYear: getFullYear(birthYear),
        municipalityCode: municipality,
        birthCertificateNumber: birthCert,
        sequentialNumber: sequential,
        controlKey: controlKey,
        formatted: `${genderStatus} ${birthYear} ${municipality} ${birthCert} ${sequential} ${controlKey}`
    };
}

export default {
    extractIDFromImage,
    validateAlgerianID,
    parseAlgerianID
};