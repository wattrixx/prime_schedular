const axios = require('axios');
const db = require('./database/db');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0/your-whatsapp-business-id/messages';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

async function sendWhatsAppMessage(phoneNumber, message, mediaId = null, type = 'single', groupId = null) {
    try {
        let recipient = type === 'group' ? groupId : phoneNumber;
        let messageData = {
            messaging_product: 'whatsapp',
            recipient_type: type === 'group' ? 'group' : 'individual',
            to: recipient,
            type: mediaId ? 'image' : 'text',
        };

        if (mediaId) {
            messageData.image = { id: mediaId, caption: message };
        } else {
            messageData.text = { preview_url: false, body: message };
        }

        await axios.post(WHATSAPP_API_URL, messageData, {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
        });

        db.run(`INSERT INTO messages (phone_number, message, media_id, status, type, group_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [phoneNumber, message, mediaId, 'sent', type, groupId]);

    } catch (error) {
        console.error('Error sending WhatsApp message:', error.message);
    }
}

module.exports = { sendWhatsAppMessage };
