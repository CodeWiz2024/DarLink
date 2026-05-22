// Import: import fetch from 'node-fetch';
import fetch from 'node-fetch';
// Import: import dotenv from 'dotenv';
import dotenv from 'dotenv';

// Load .env configuration
dotenv.config();

// Class: class CustomChargilyClient {
class CustomChargilyClient {
    // L7: constructor(config) {
    constructor(config) {
        // L8: this.apiKey = config.api_key;
        this.apiKey = config.api_key;
        // Correct base URL from documentation
        this.baseURL = 'https://pay.chargily.net/api/v2';
        // Console: console.log('🔑 Chargily initialized with custom config');
        console.log('🔑 Chargily initialized with custom config');
        // Console: console.log('📡 Base URL:', this.baseURL);
        console.log('📡 Base URL:', this.baseURL);
        // Console: console.log('🔑 API Key prefix:', this.apiKey ? this.apiKey.substring(
        console.log('🔑 API Key prefix:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'missing');
    // End block
    }

    // L16: async createCheckout(data) {
    async createCheckout(data) {
        // Try block
        try {
            // Constant: const endpoint = `${this.baseURL}/checkouts`;
            const endpoint = `${this.baseURL}/checkouts`;
            
            // Console: console.log('📤 Creating checkout at:', endpoint);
            console.log('📤 Creating checkout at:', endpoint);
            // Console: console.log('📦 Checkout data:', JSON.stringify(data, null, 2));
            console.log('📦 Checkout data:', JSON.stringify(data, null, 2));

            // Constant: const response = await fetch(endpoint, {
            const response = await fetch(endpoint, {
                // L24: method: 'POST',
                method: 'POST',
                // L25: headers: {
                headers: {
                    // L26: 'Content-Type': 'application/json',
                    'Content-Type': 'application/json',
                    // L27: 'Authorization': `Bearer ${this.apiKey}`
                    'Authorization': `Bearer ${this.apiKey}`
                // L28: },
                },
                // L29: body: JSON.stringify(data)
                body: JSON.stringify(data)
            // End handler/callback
            });

            // Constant: const responseText = await response.text();
            const responseText = await response.text();
            
            // Console: console.log('📥 Response status:', response.status);
            console.log('📥 Response status:', response.status);
            // Console: console.log('📥 Response headers:', Object.fromEntries(response.header
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Validation guard: if (!response.ok) {
            if (!response.ok) {
                // Console: console.error('❌ Chargily API error:', responseText);
                console.error('❌ Chargily API error:', responseText);
                // L39: throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            // End block
            }

            // Try to parse as JSON
            try {
                // Return: JSON.parse(responseText);
                return JSON.parse(responseText);
            // Catch errors
            } catch (e) {
                // Console: console.error('❌ Failed to parse response as JSON:', responseText);
                console.error('❌ Failed to parse response as JSON:', responseText);
                // L47: throw new Error('Invalid JSON response from Chargily');
                throw new Error('Invalid JSON response from Chargily');
            // End block
            }

        // Catch errors
        } catch (error) {
            // Console: console.error('❌ Chargily client error:', error);
            console.error('❌ Chargily client error:', error);
            // L52: throw error;
            throw error;
        // End block
        }
    // End block
    }
// End block
}

// Constant: const chargily = new CustomChargilyClient({
const chargily = new CustomChargilyClient({
    // L58: api_key: process.env.CHARGILY_SECRET_KEY
    api_key: process.env.CHARGILY_SECRET_KEY
// End handler/callback
});

// Default export
export default chargily;