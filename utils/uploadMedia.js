const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const WHATSAPP_CLOUD_API = 'https://graph.facebook.com/v22.0/470609146145333';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

async function uploadMedia(filePath) {
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(`${WHATSAPP_CLOUD_API}/media`, formData, {
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, ...formData.getHeaders() }
    });

    return response.data.id; // Return media ID
}

module.exports = uploadMedia;
