const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_CLOUD_API = 'https://graph.facebook.com/v22.0/470609146145333';

/**
 * Upload Media to WhatsApp Cloud API
 */
async function uploadMedia(filePath) {
    try {
        const formData = new FormData();
        formData.append('messaging_product', 'whatsapp');
        formData.append('file', fs.createReadStream(filePath));

        // Determine file type
        const fileType = path.extname(filePath).toLowerCase();
        const mimeType = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
            '.mp4': 'video/mp4'
        }[fileType] || 'application/octet-stream';

        formData.append('type', mimeType);

        // Upload to WhatsApp API
        const response = await axios.post(`${WHATSAPP_CLOUD_API}/media`, formData, {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, ...formData.getHeaders() }
        });

        return response.data.id; // Return media ID
    } catch (error) {
        console.error('Error uploading media:', error.response?.data || error.message);
        throw error;
    }
}

async function uploadMedia(filePath) {
    try {
        const formData = new FormData();
        formData.append('messaging_product', 'whatsapp');
        formData.append('file', fs.createReadStream(filePath));

        const response = await axios.post(`${WHATSAPP_CLOUD_API}/media`, formData, {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, ...formData.getHeaders() }
        });

        return response.data.id; // Return media ID

    } catch (error) {
        console.error("Error uploading media:", error.response?.data || error.message);
        throw new Error("Failed to upload media.");
    }
}

module.exports = { uploadMedia };
