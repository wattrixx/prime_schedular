// File: routes/whatsappRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0/470609146145333/messages';


async function readMessages() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../messages.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { messages: [], schedules: [] };
    }
}

async function writeMessages(data) {
    await fs.writeFile(
        path.join(__dirname, '../messages.json'),
        JSON.stringify(data, null, 2)
    );
}

async function sendWhatsAppMessage(phoneNumber, message) {
    try {
        // Add debug logging
        console.log('Sending message with data:', {
            to: phoneNumber,
            messageLength: message.length
        });

        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneNumber,
                type: 'text',
                text: { 
                    preview_url: false,
                    body: message 
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', {
            status: error.response?.status,
            data: error.response?.data,
            phoneNumber: phoneNumber
        });
        throw error;
    }
}

// Send immediate message
router.post('/send', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        await sendWhatsAppMessage(phoneNumber, message);
        
        const data = await readMessages();
        data.messages.push({
            phoneNumber,
            message,
            timestamp: new Date().toISOString(),
            type: 'sent'
        });
        await writeMessages(data);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule message
router.post('/schedule', async (req, res) => {
    try {
        const { phoneNumber, message, scheduleDate, scheduleTime, event } = req.body;
        const data = await readMessages();
        
        data.schedules.push({
            id: Date.now().toString(),
            phoneNumber,
            message,
            event,
            scheduleDate,
            scheduleTime,
            status: 'pending'
        });
        
        await writeMessages(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook routes
router.get('/webhook', (req, res) => {
    if (
        req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === process.env.VERIFY_TOKEN
    ) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(400);
    }
});

router.post('/webhook', async (req, res) => {
    try {
        const { entry } = req.body;
        
        if (entry && entry[0].changes && entry[0].changes[0].value.messages) {
            const message = entry[0].changes[0].value.messages[0];
            const data = await readMessages();
            
            data.messages.push({
                phoneNumber: message.from,
                message: message.text.body,
                timestamp: new Date().toISOString(),
                type: 'received'
            });
            
            await writeMessages(data);
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});
// Add this debug logging helper
async function logError(error) {
    console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
    });
}
// Initialize cron job
// Modify the cron schedule function
cron.schedule('* * * * *', async () => {
    try {
        const data = await readMessages();
        const now = new Date();
        
        for (const schedule of data.schedules) {
            if (schedule.status === 'pending') {
                const scheduleDateTime = new Date(`${schedule.scheduleDate} ${schedule.scheduleTime}`);
                
                if (scheduleDateTime <= now) {
                    try {
                        // Add logging to debug the phone number format
                        console.log('Attempting to send scheduled message to:', {
                            phoneNumber: schedule.phoneNumber,
                            message: schedule.message,
                            scheduledTime: scheduleDateTime
                        });

                        // Ensure phone number is properly formatted
                        const formattedNumber = schedule.phoneNumber.startsWith('+') 
                            ? schedule.phoneNumber 
                            : `+${schedule.phoneNumber}`;

                        await sendWhatsAppMessage(formattedNumber, schedule.message);
                        schedule.status = 'sent';
                        
                        data.messages.push({
                            phoneNumber: formattedNumber,
                            message: schedule.message,
                            timestamp: new Date().toISOString(),
                            type: 'scheduled-sent'
                        });

                        console.log('Successfully sent scheduled message to:', formattedNumber);
                    } catch (sendError) {
                        // Log detailed error information
                        await logError(sendError);
                        schedule.status = 'failed';
                        schedule.error = sendError.message;
                    }
                }
            }
        }
        
        await writeMessages(data);
    } catch (error) {
        console.error('Schedule checker error:', error);
        await logError(error);
    }
});

module.exports = router;