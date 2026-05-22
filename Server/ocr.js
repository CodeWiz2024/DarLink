// Import: import fetch from 'node-fetch';
import fetch from 'node-fetch';
// Import: import FormData from 'form-data';
import FormData from 'form-data';
// Import: import fs from 'fs';
import fs from 'fs';
// Import: import dotenv from 'dotenv';
import dotenv from 'dotenv';

// Load .env configuration
dotenv.config();

/**
 * Extract ID number from image using OCR.space API
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<object>} - Extraction result
 */
// Export: export async function extractIDFromImage(imagePath) {
export async function extractIDFromImage(imagePath) {
    // Try block
    try {
        // Console: console.log('🔍 Starting OCR.space extraction for:', imagePath);
        console.log('🔍 Starting OCR.space extraction for:', imagePath);

        // Validation guard: if (!process.env.OCR_SPACE_API_KEY) {
        if (!process.env.OCR_SPACE_API_KEY) {
            // Return: {
            return {
                // L19: success: false,
                success: false,
                // L20: error: 'OCR.space API key not configured',
                error: 'OCR.space API key not configured',
                // L21: idNumber: null
                idNumber: null
            // End statement
            };
        // End block
        }

        // Constant: const formData = new FormData();
        const formData = new FormData();
        // OCR form field
        formData.append('file', fs.createReadStream(imagePath));
        // OCR form field
        formData.append('apikey', process.env.OCR_SPACE_API_KEY);
        // OCR form field
        formData.append('language', 'eng');
        // OCR form field
        formData.append('isOverlayRequired', 'false');
        // OCR form field
        formData.append('detectOrientation', 'true');
        // OCR form field
        formData.append('scale', 'true');
        // OCR form field
        formData.append('OCREngine', '2');

        // Console: console.log('📤 Sending request to OCR.space...');
        console.log('📤 Sending request to OCR.space...');

        // Constant: const response = await fetch('https://api.ocr.space/parse/image', {
        const response = await fetch('https://api.ocr.space/parse/image', {
            // L37: method: 'POST',
            method: 'POST',
            // L38: body: formData,
            body: formData,
            // L39: headers: formData.getHeaders()
            headers: formData.getHeaders()
        // End handler/callback
        });

        // Validation guard: if (!response.ok) {
        if (!response.ok) {
            // L43: throw new Error(`OCR.space API error: ${response.statusText}`);
            throw new Error(`OCR.space API error: ${response.statusText}`);
        // End block
        }

        // Constant: const data = await response.json();
        const data = await response.json();
        // Console: console.log('📥 OCR.space response received');
        console.log('📥 OCR.space response received');

        // If: if (data.IsErroredOnProcessing) {
        if (data.IsErroredOnProcessing) {
            // Console: console.error('❌ OCR.space processing error:', data.ErrorMessage);
            console.error('❌ OCR.space processing error:', data.ErrorMessage);
            // Return: {
            return {
                // L52: success: false,
                success: false,
                // L53: error: data.ErrorMessage || 'OCR processing failed',
                error: data.ErrorMessage || 'OCR processing failed',
                // L54: idNumber: null
                idNumber: null
            // End statement
            };
        // End block
        }

        // Validation guard: if (!data.ParsedResults || data.ParsedResults.length === 0) {
        if (!data.ParsedResults || data.ParsedResults.length === 0) {
            // Return: {
            return {
                // L60: success: false,
                success: false,
                // L61: error: 'No text detected in image',
                error: 'No text detected in image',
                // L62: idNumber: null
                idNumber: null
            // End statement
            };
        // End block
        }

        // Constant: const parsedText = data.ParsedResults[0].ParsedText;
        const parsedText = data.ParsedResults[0].ParsedText;
        // Console: console.log('📄 Detected text:', parsedText);
        console.log('📄 Detected text:', parsedText);

        // Constant: const extractionResult = extractIDNumber(parsedText);
        const extractionResult = extractIDNumber(parsedText);

        // If: if (extractionResult.idNumber) {
        if (extractionResult.idNumber) {
            // Console: console.log('✅ ID Number extracted:', extractionResult.idNumber);
            console.log('✅ ID Number extracted:', extractionResult.idNumber);
            // Return: {
            return {
                // L74: success: true,
                success: true,
                // L75: idNumber: extractionResult.idNumber,
                idNumber: extractionResult.idNumber,
                // L76: confidence: extractionResult.confidence,
                confidence: extractionResult.confidence,
                // L77: fullText: parsedText,
                fullText: parsedText,
                // L78: pattern: extractionResult.pattern
                pattern: extractionResult.pattern
            // End statement
            };
        // Else branch
        } else {
            // Console: console.log('❌ No ID number pattern found in text');
            console.log('❌ No ID number pattern found in text');
            // Return: {
            return {
                // L83: success: false,
                success: false,
                // L84: error: 'Could not find ID number pattern',
                error: 'Could not find ID number pattern',
                // L85: idNumber: null,
                idNumber: null,
                // L86: fullText: parsedText
                fullText: parsedText
            // End statement
            };
        // End block
        }

    // Catch errors
    } catch (error) {
        // Console: console.error('❌ OCR.space Error:', error);
        console.error('❌ OCR.space Error:', error);
        // Return: {
        return {
            // L93: success: false,
            success: false,
            // L94: error: error.message,
            error: error.message,
            // L95: idNumber: null
            idNumber: null
        // End statement
        };
    // End block
    }
// End block
}

/**
 * Extract ID number from OCR text using patterns
 * @param {string} text - OCR detected text
 * @returns {object} - ID number, confidence, and pattern used
 */
// Function: function extractIDNumber(text) {
function extractIDNumber(text) {
    // Constant: const cleanText = text.replace(/\s+/g, ' ').trim().toUpperCase();
    const cleanText = text.replace(/\s+/g, ' ').trim().toUpperCase();
    // Constant: const noSpaceText = text.replace(/\s+/g, '').toUpperCase();
    const noSpaceText = text.replace(/\s+/g, '').toUpperCase();

    // Console: console.log('🔍 Analyzing text for ID patterns...');
    console.log('🔍 Analyzing text for ID patterns...');

    // Constant: const patterns = [
    const patterns = [
        // L112: {
        {
            // L113: name: 'Algerian ID - 18 digits (no spaces)',
            name: 'Algerian ID - 18 digits (no spaces)',
            // L114: regex: /\b\d{18}\b/,
            regex: /\b\d{18}\b/,
            // L115: confidence: 0.95,
            confidence: 0.95,
            // L116: text: noSpaceText
            text: noSpaceText
        // L117: },
        },
        // L118: {
        {
            // L119: name: 'Algerian ID - 18 digits (with spaces)',
            name: 'Algerian ID - 18 digits (with spaces)',
            // L120: regex: /\b(\d{2}\s?\d{3}\s?\d{4}\s?\d{5}\s?\d{2}\s?\d{2})\b/,
            regex: /\b(\d{2}\s?\d{3}\s?\d{4}\s?\d{5}\s?\d{2}\s?\d{2})\b/,
            // L121: confidence: 0.93,
            confidence: 0.93,
            // L122: text: cleanText
            text: cleanText
        // L123: },
        },
        // L124: {
        {
            // L125: name: 'Generic 17 digits (possible OCR error)',
            name: 'Generic 17 digits (possible OCR error)',
            // L126: regex: /\b\d{17}\b/,
            regex: /\b\d{17}\b/,
            // L127: confidence: 0.75,
            confidence: 0.75,
            // L128: text: noSpaceText
            text: noSpaceText
        // L129: },
        },
        // L130: {
        {
            // L131: name: 'Generic 15-16 digits',
            name: 'Generic 15-16 digits',
            // L132: regex: /\b\d{15,16}\b/,
            regex: /\b\d{15,16}\b/,
            // L133: confidence: 0.70,
            confidence: 0.70,
            // L134: text: noSpaceText
            text: noSpaceText
        // L135: },
        },
        // L136: {
        {
            // L137: name: 'Longest number sequence (12+ digits)',
            name: 'Longest number sequence (12+ digits)',
            // L138: regex: /\d{12,}/,
            regex: /\d{12,}/,
            // L139: confidence: 0.50,
            confidence: 0.50,
            // L140: text: noSpaceText
            text: noSpaceText
        // End block
        }
    // L142: ];
    ];

    // Loop: for (let pattern of patterns) {
    for (let pattern of patterns) {
        // Constant: const match = pattern.text.match(pattern.regex);
        const match = pattern.text.match(pattern.regex);
        // If: if (match) {
        if (match) {
            // Variable: let idNumber = match[0].replace(/\s/g, '');
            let idNumber = match[0].replace(/\s/g, '');
            // L148: idNumber = idNumber.replace(/^[A-Z]+/, '');
            idNumber = idNumber.replace(/^[A-Z]+/, '');
            
            // Console: console.log(`✅ Match found with pattern: ${pattern.name}`);
            console.log(`✅ Match found with pattern: ${pattern.name}`);
            // Console: console.log(`   ID Number: ${idNumber}`);
            console.log(`   ID Number: ${idNumber}`);
            // Console: console.log(`   Confidence: ${pattern.confidence * 100}%`);
            console.log(`   Confidence: ${pattern.confidence * 100}%`);
            
            // Return: {
            return {
                // L155: idNumber: idNumber,
                idNumber: idNumber,
                // L156: confidence: pattern.confidence,
                confidence: pattern.confidence,
                // L157: pattern: pattern.name
                pattern: pattern.name
            // End statement
            };
        // End block
        }
    // End block
    }

    // Constant: const allNumbers = noSpaceText.match(/\d+/g);
    const allNumbers = noSpaceText.match(/\d+/g);
    // If: if (allNumbers && allNumbers.length > 0) {
    if (allNumbers && allNumbers.length > 0) {
        // Constant: const longest = allNumbers.reduce((a, b) => a.length > b.length ? a : b);
        const longest = allNumbers.reduce((a, b) => a.length > b.length ? a : b);
        
        // If: if (longest.length >= 12) {
        if (longest.length >= 12) {
            // Console: console.log('⚠️  Using fallback - longest number:', longest);
            console.log('⚠️  Using fallback - longest number:', longest);
            // Return: {
            return {
                // L169: idNumber: longest,
                idNumber: longest,
                // L170: confidence: 0.40,
                confidence: 0.40,
                // L171: pattern: 'Fallback - Longest Number'
                pattern: 'Fallback - Longest Number'
            // End statement
            };
        // End block
        }
    // End block
    }

    // Console: console.log('❌ No ID number pattern found');
    console.log('❌ No ID number pattern found');
    // Return: {
    return {
        // L178: idNumber: null,
        idNumber: null,
        // L179: confidence: 0,
        confidence: 0,
        // L180: pattern: null
        pattern: null
    // End statement
    };
// End block
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
// Export: export function validateAlgerianID(idNumber) {
export function validateAlgerianID(idNumber) {
    // Constant: const clean = idNumber.replace(/[\s-]/g, '');
    const clean = idNumber.replace(/[\s-]/g, '');
    
    // Console: console.log('🔍 Validating Algerian ID:', clean);
    console.log('🔍 Validating Algerian ID:', clean);
    
    // Must be exactly 18 digits
    if (!/^\d{18}$/.test(clean)) {
        // Console: console.log('❌ Validation failed: Not 18 digits');
        console.log('❌ Validation failed: Not 18 digits');
        // Return: false;
        return false;
    // End block
    }

    // Extract components based on correct Algerian format
    const genderStatus = clean.substring(0, 2);    // GG
    // Constant: const birthYear = clean.substring(2, 5);       // YYY
    const birthYear = clean.substring(2, 5);       // YYY
    // Constant: const municipality = clean.substring(5, 9);    // CCCC
    const municipality = clean.substring(5, 9);    // CCCC
    // Constant: const birthCert = clean.substring(9, 14);      // NNNNN
    const birthCert = clean.substring(9, 14);      // NNNNN
    // Constant: const sequential = clean.substring(14, 16);    // SS
    const sequential = clean.substring(14, 16);    // SS
    // Constant: const controlKey = clean.substring(16, 18);    // KK
    const controlKey = clean.substring(16, 18);    // KK

    // Validate gender/status code (10-29 are common values)
    const gg = parseInt(genderStatus);
    // If: if (gg < 10 || gg > 29) {
    if (gg < 10 || gg > 29) {
        // Console: console.log('⚠️  Warning: Unusual gender/status code:', genderStatus);
        console.log('⚠️  Warning: Unusual gender/status code:', genderStatus);
    // End block
    }

    // Validate birth year (000-999)
    const yyy = parseInt(birthYear);
    // If: if (yyy > 999) {
    if (yyy > 999) {
        // Console: console.log('❌ Validation failed: Invalid year value:', birthYear);
        console.log('❌ Validation failed: Invalid year value:', birthYear);
        // Return: false;
        return false;
    // End block
    }

    // Log details for debugging
    // Console: console.log('✅ ID validation passed (18 digits)');
    console.log('✅ ID validation passed (18 digits)');
    // Console: console.log(`   Gender/Status: ${genderStatus} (${getGenderStatus(gend
    console.log(`   Gender/Status: ${genderStatus} (${getGenderStatus(genderStatus)})`);
    // Console: console.log(`   Birth Year: ${getFullYear(birthYear)}`);
    console.log(`   Birth Year: ${getFullYear(birthYear)}`);
    // Console: console.log(`   Municipality: ${municipality}`);
    console.log(`   Municipality: ${municipality}`);
    // Console: console.log(`   Birth Certificate: ${birthCert}`);
    console.log(`   Birth Certificate: ${birthCert}`);
    // Console: console.log(`   Sequential: ${sequential}`);
    console.log(`   Sequential: ${sequential}`);
    // Console: console.log(`   Control Key: ${controlKey}`);
    console.log(`   Control Key: ${controlKey}`);
    
    // Return: true;
    return true;
// End block
}

/**
 * Helper function to interpret gender/status code
 */
// Function: function getGenderStatus(code) {
function getGenderStatus(code) {
    // Constant: const statusMap = {
    const statusMap = {
        // L246: '10': 'Male born in Algeria',
        '10': 'Male born in Algeria',
        // L247: '11': 'Female born in Algeria',
        '11': 'Female born in Algeria',
        // L248: '20': 'Born abroad',
        '20': 'Born abroad',
        // L249: '12': 'Special case (duplicate/assumed)',
        '12': 'Special case (duplicate/assumed)',
        // L250: '13': 'Special case',
        '13': 'Special case',
        // L251: '14': 'Special case'
        '14': 'Special case'
    // End statement
    };
    // Return: statusMap[code] || 'Unknown status';
    return statusMap[code] || 'Unknown status';
// End block
}

/**
 * Helper function to get full birth year
 */
// Function: function getFullYear(yyy) {
function getFullYear(yyy) {
    // Constant: const year = parseInt(yyy);
    const year = parseInt(yyy);
    // If year <= current year's last 3 digits, assume 2000s, else 1900s
    const currentYear = new Date().getFullYear();
    // Constant: const currentYYY = currentYear % 1000;
    const currentYYY = currentYear % 1000;
    
    // If: if (year <= currentYYY + 10) {
    if (year <= currentYYY + 10) {
        // Return: 2000 + year;
        return 2000 + year;
    // Else branch
    } else {
        // Return: 1000 + year; // 1900s
        return 1000 + year; // 1900s
    // End block
    }
// End block
}

/**
 * Get detailed information from Algerian ID number
 * @param {string} idNumber - 18 digit ID number
 * @returns {object} - Parsed ID information
 */
// Export: export function parseAlgerianID(idNumber) {
export function parseAlgerianID(idNumber) {
    // Constant: const clean = idNumber.replace(/[\s-]/g, '');
    const clean = idNumber.replace(/[\s-]/g, '');
    
    // Validation guard: if (!validateAlgerianID(clean)) {
    if (!validateAlgerianID(clean)) {
        // Return: null;
        return null;
    // End block
    }

    // Constant: const genderStatus = clean.substring(0, 2);
    const genderStatus = clean.substring(0, 2);
    // Constant: const birthYear = clean.substring(2, 5);
    const birthYear = clean.substring(2, 5);
    // Constant: const municipality = clean.substring(5, 9);
    const municipality = clean.substring(5, 9);
    // Constant: const birthCert = clean.substring(9, 14);
    const birthCert = clean.substring(9, 14);
    // Constant: const sequential = clean.substring(14, 16);
    const sequential = clean.substring(14, 16);
    // Constant: const controlKey = clean.substring(16, 18);
    const controlKey = clean.substring(16, 18);

    // Return: {
    return {
        // L292: genderStatus: genderStatus,
        genderStatus: genderStatus,
        // L293: genderStatusText: getGenderStatus(genderStatus),
        genderStatusText: getGenderStatus(genderStatus),
        // L294: birthYear: getFullYear(birthYear),
        birthYear: getFullYear(birthYear),
        // L295: municipalityCode: municipality,
        municipalityCode: municipality,
        // L296: birthCertificateNumber: birthCert,
        birthCertificateNumber: birthCert,
        // L297: sequentialNumber: sequential,
        sequentialNumber: sequential,
        // L298: controlKey: controlKey,
        controlKey: controlKey,
        // L299: formatted: `${genderStatus} ${birthYear} ${municipality} ${birthCert} ${sequential} ${controlKey}`
        formatted: `${genderStatus} ${birthYear} ${municipality} ${birthCert} ${sequential} ${controlKey}`
    // End statement
    };
// End block
}

// Default export
export default {
    // L304: extractIDFromImage,
    extractIDFromImage,
    // L305: validateAlgerianID,
    validateAlgerianID,
    // L306: parseAlgerianID
    parseAlgerianID
// End statement
};