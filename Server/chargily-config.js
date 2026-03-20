import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class CustomChargilyClient {
    constructor(config) {
        this.apiKey = config.api_key;
        // Correct base URL from documentation
        this.baseURL = 'https://pay.chargily.net/api/v2';
        console.log('🔑 Chargily initialized with custom config');
        console.log('📡 Base URL:', this.baseURL);
        console.log('🔑 API Key prefix:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'missing');
    }

    async createCheckout(data) {
        try {
            const endpoint = `${this.baseURL}/checkouts`;
            
            console.log('📤 Creating checkout at:', endpoint);
            console.log('📦 Checkout data:', JSON.stringify(data, null, 2));

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            
            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                console.error('❌ Chargily API error:', responseText);
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
            }

            // Try to parse as JSON
            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Failed to parse response as JSON:', responseText);
                throw new Error('Invalid JSON response from Chargily');
            }

        } catch (error) {
            console.error('❌ Chargily client error:', error);
            throw error;
        }
    }
}

const chargily = new CustomChargilyClient({
    api_key: process.env.CHARGILY_SECRET_KEY
});

export default chargily;