// File: routes/whatsappRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const db = require('../database/db');
const { sendWhatsAppMessage, scheduleMessage, saveRecurringEvent } = require('../controllers/messageController');
const { getThreads, getThreadMessages, sendMessage } = require('../controllers/messageController');
const { uploadMedia } = require('../controllers/mediaController');



const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v22.0/470609146145333/messages';
const WHATSAPP_CLOUD_API = 'https://graph.facebook.com/v22.0/470609146145333';

// Configure multer for file uploads
//const upload = multer({ dest: 'public/uploads/' });
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });
// Send message immediately
router.post('/send', async (req, res) => {
    try {
        const { phoneNumber, message, mediaId, type = 'single' } = req.body;
        await sendWhatsAppMessage(phoneNumber, message, mediaId, type);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule message
router.post('/schedule', scheduleMessage);

// Save recurring event
router.post('/save-event', saveRecurringEvent);

// Upload media
router.post('/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const mediaId = await uploadMedia(req.file.path);
        
        // Delete temporary file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temporary file:', err);
        });
        
        res.json({ success: true, mediaId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all message threads 
router.get('/threads', getThreads);

// Get messages for a specific thread
router.get('/threads/:contact', getThreadMessages);

// Send reply in a thread
router.post('/send-reply', sendMessage);


// Load messages page
router.get('/messages', async (req, res) => {
    try {
        const threads = await messageController.getThreads();
        const unreadCount = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
        res.render('messages', { threads, unreadCount });
    } catch (error) {
        console.error('Error loading messages:', error);
        res.render('messages', { threads: [], unreadCount: 0 });
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

            const phoneNumber = message.from;
            const text = message.text?.body || '';
            
            // Insert into messages table
            db.run(
                `INSERT INTO messages (phone_number, message, status, type, timestamp) 
                 VALUES (?, ?, 'received', 'single', CURRENT_TIMESTAMP)`,
                [phoneNumber, text]
            );

            // Update or create thread
            db.run(
                `INSERT INTO threads (contact, last_message, last_updated) 
                 VALUES (?, ?, CURRENT_TIMESTAMP) 
                 ON CONFLICT(contact) DO UPDATE SET last_message = ?, last_updated = CURRENT_TIMESTAMP`,
                [phoneNumber, text, text]
            );
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



//router for save events 

router.post('/save-event', (req, res) => {
    const { phoneNumber, eventName, eventDate, message, mediaId } = req.body;

    console.log("Received recurring event request:", req.body);  // ✅ Debugging log

    if (!phoneNumber || !eventName || !eventDate || !message) {
        console.error(" Missing required fields for recurring event");
        return res.status(400).json({ error: "All fields are required" });
    }

    db.run(`INSERT INTO recurring_events (phone_number, event_name, message, media_id, next_send_date) 
            VALUES (?, ?, ?, ?, ?)`,
        [phoneNumber, eventName, message, mediaId, eventDate], (err) => {
            if (err) {
                console.error("Error saving recurring event:", err.message);
                return res.status(500).json({ error: err.message });
            }

            console.log(`Recurring event saved for ${phoneNumber} on ${eventDate}`);
            res.json({ success: true, message: 'Recurring event saved successfully' });
        });
});

module.exports = router ;