const cron = require('node-cron');
const db = require('./database');
const { sendWhatsAppMessage } = require('./sendMessage');

cron.schedule('* * * * *', async () => {
    try {
        console.log('Running scheduler...');
        const now = new Date();
        const today = now.toISOString().slice(5, 10);

        db.all(`SELECT * FROM messages WHERE status = 'pending' AND timestamp <= ?`, [now], async (err, messages) => {
            if (err) return console.error("Error fetching scheduled messages:", err);

            for (const msg of messages) {
                try {
                    await sendWhatsAppMessage(msg.phone_number, msg.message, msg.media_id, msg.type, msg.group_id);
                    db.run(`UPDATE messages SET status = 'sent' WHERE id = ?`, [msg.id]);
                    console.log(`Sent scheduled message to ${msg.phone_number}`);
                } catch (error) {
                    console.error("Failed to send scheduled message:", error.message);
                }
            }
        });

        db.all(`SELECT * FROM recurring_events WHERE SUBSTR(event_date, 6, 5) = ?`, [today], async (err, events) => {
            if (err) return console.error("Error fetching recurring messages:", err);

            for (const event of events) {
                try {
                    await sendWhatsAppMessage(event.phone_number, event.message, event.media_id);
                    console.log(`Sent recurring event: ${event.event_name} to ${event.phone_number}`);
                } catch (error) {
                    console.error("Failed to send recurring event:", error.message);
                }
            }
        });

    } catch (error) {
        console.error('Cron job error:', error.message);
    }
});
