//controllers/messageController.js
const axios = require('axios');
const db = require('../database/db');
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/470609146145333/messages`;


/**
 * Send a WhatsApp Message (Single, Scheduled, or Recurring)
 */
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
            messageData.text = { body: message };
        }

        await axios.post(WHATSAPP_API_URL, messageData, {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        });

        db.run(`INSERT INTO messages (phone_number, message, media_id, status, type, group_id, schedule_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [phoneNumber, message, mediaId, 'sent', type, groupId, null]);

        return { success: true };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Schedule a WhatsApp Message (Save to DB)
 */
async function scheduleMessage(req, res) {
    try {
        const { phoneNumber, message, mediaId, scheduleDate, scheduleTime } = req.body;
        const scheduleTimestamp = `${scheduleDate} ${scheduleTime}:00`;

        db.run(`INSERT INTO messages (phone_number, message, media_id, type, schedule_time, status) 
                VALUES (?, ?, ?, 'scheduled', ?, 'pending')`,
            [phoneNumber, message, mediaId, scheduleTimestamp]);

        res.json({ success: true, message: 'Message scheduled successfully' });
    } catch (error) {
        console.error('Error scheduling message:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Save Recurring Event
 */
async function saveRecurringEvent(req, res) {
    try {
        const { phoneNumber, eventName, eventDate, message, mediaId } = req.body;

        db.run(`INSERT INTO recurring_events (phone_number, event_name, message, media_id, next_send_date) 
                VALUES (?, ?, ?, ?, ?)`,
            [phoneNumber, eventName, message, mediaId, eventDate]);

        res.json({ success: true, message: 'Recurring event saved successfully' });
    } catch (error) {
        console.error('Error saving event:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get all threads
async function getThreads(req, res) {
    db.all(
        `SELECT contact, last_message, 
                (SELECT COUNT(*) FROM messages WHERE phone_number = contact AND status = 'unread') AS unreadCount 
         FROM threads ORDER BY last_updated DESC`, 
        [], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
}

// Get messages in a thread
async function getThreadMessages(req, res) {
    const contact = req.params.contact;

    db.all(
        `SELECT * FROM messages 
         WHERE phone_number = ? 
         ORDER BY timestamp ASC`, 
        [contact], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            console.log("Messages for", contact, ":", rows); // ✅ Debugging

            res.json(rows);
        }
    );
}



// Send message and update thread
async function sendMessage(req, res) {
    const { phoneNumber, message } = req.body;

    db.get(`SELECT id FROM threads WHERE contact = ?`, [phoneNumber], (err, thread) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!thread) {
            // Create thread if it doesn't exist
            db.run(`INSERT INTO threads (contact, last_message, last_updated) VALUES (?, ?, CURRENT_TIMESTAMP)`, 
                [phoneNumber, message], function(err) {
                    if (err) return res.status(500).json({ error: err.message });

                    insertMessage(this.lastID); // Use newly created thread_id
                });
        } else {
            insertMessage(thread.id);
        }
    });

    function insertMessage(threadId) {
        db.run(
            `INSERT INTO messages (thread_id, phone_number, message, status) VALUES (?, ?, ?, 'sent')`,
            [threadId, phoneNumber, message],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });

                // Update last message in thread
                db.run(`UPDATE threads SET last_message = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`,
                    [message, threadId]);

                res.json({ success: true });
            }
        );
    }
}


module.exports = { sendWhatsAppMessage, scheduleMessage, saveRecurringEvent, getThreads, getThreadMessages, sendMessage };
