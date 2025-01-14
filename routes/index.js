// File: routes/index.js
const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');

// Helper function to read messages
async function readMessages() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../messages.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { messages: [], schedules: [] };
    }
}

router.get('/', async (req, res) => {
    const data = await readMessages();
    res.render('index', { messages: data.schedules });
});

router.get('/messages', async (req, res) => {
    const data = await readMessages();
    res.render('messages', { messages: data.messages });
});

module.exports = router;