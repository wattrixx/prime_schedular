//database/db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./messages.db');

//  Ensure the messages table is correct
db.serialize(() => {
    // Ensure the messages table is correct
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id INTEGER,  -- Link messages to threads
        phone_number TEXT NOT NULL,
        message TEXT NOT NULL,
        media_id TEXT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        type TEXT NOT NULL CHECK(type IN ('single', 'scheduled', 'recurring', 'group')),
        schedule_time DATETIME NULL,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        group_id TEXT NULL,
        FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE
    )`);

    // Table for recurring events
    db.run(`CREATE TABLE IF NOT EXISTS recurring_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        event_name TEXT NOT NULL,
        message TEXT NOT NULL,
        media_id TEXT NULL,
        next_send_date DATE NOT NULL
    )`);

    // Threads table (ensures unique conversations)
    db.run(`CREATE TABLE IF NOT EXISTS threads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact TEXT NOT NULL UNIQUE,
        last_message TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});
module.exports = db;
