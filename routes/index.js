//routes index.js
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { sendWhatsAppMessage } = require('../sendMessage');

router.get('/messages', (req, res) => {
    db.get(`SELECT COUNT(*) AS unreadCount FROM messages WHERE status = 'unread'`, (err, countResult) => {
        if (err) {
            console.error("Error fetching unread count:", err);
            countResult = { unreadCount: 0 }; // Ensure it’s always defined
        }

        db.all(`SELECT * FROM threads ORDER BY last_updated DESC`, [], (err, threadRows) => {
            if (err) {
                console.error("Error fetching threads:", err);
                threadRows = []; // Ensure it's always an array
            }

            console.log("Threads loaded:", threadRows); // ✅ Debugging: Check threads in console
            console.log("Unread messages count:", countResult.unreadCount); // ✅ Debugging

            res.render('messages', { threads: threadRows, unreadCount: countResult.unreadCount });
        });
    });
});

router.get('/', (req, res) => {
    // Fetch scheduled messages from the database
    db.all(`SELECT * FROM messages WHERE type = 'scheduled' ORDER BY schedule_time ASC`, (err, scheduledMessages) => {
        if (err) {
            console.error('Error fetching scheduled messages:', err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.render('index', { scheduledMessages });  // ✅ Pass scheduledMessages to EJS
    });
});
router.get('/threads/:contact', (req, res) => {
    const contact = req.params.contact;
    db.all(`SELECT * FROM messages WHERE phone_number = ? ORDER BY timestamp ASC`, [contact], (err, rows) => {
        db.run(`UPDATE messages SET status = 'read' WHERE phone_number = ?`, [contact]);
        res.json(rows);
    });
});

router.post('/send-reply', async (req, res) => {
    const { phoneNumber, message } = req.body;
    try {
        await sendWhatsAppMessage(phoneNumber, message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
