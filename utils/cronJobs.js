const cron = require('node-cron');
const { sendWhatsAppMessage } = require('../controllers/messageController');
const db = require('../database/db');

// Define max retry attempts
const MAX_RETRY_ATTEMPTS = 3;

// ✅ Run cron job every minute
cron.schedule('* * * * *', async () => {
    console.log('Running cron job...');
    
    // Process Scheduled Messages
    db.all(
        `SELECT * FROM messages 
         WHERE status = 'pending' 
         AND datetime(schedule_time) <= datetime('now', 'localtime')
         AND retry_count < ?`,
        [MAX_RETRY_ATTEMPTS],
        async (err, messages) => {
            if (err) {
                console.error('Scheduled message query error:', err.message);
                return;
            }
            console.log(`Found ${messages.length} scheduled messages to send.`);
            
            for (let message of messages) {
                console.log(`Attempting to send scheduled message to ${message.phone_number}`);
                try {
                    await sendWhatsAppMessage(
                        message.phone_number,
                        message.message,
                        message.media_id
                    );
                    
                    // Update as sent on success
                    db.run(
                        `UPDATE messages 
                         SET status = 'sent' 
                         WHERE id = ?`, 
                        [message.id]
                    );
                    console.log(`Successfully sent scheduled message to ${message.phone_number}`);
                    
                } catch (error) {
                    console.error(`Failed to send scheduled message to ${message.phone_number}:`, error.message);
                    
                    // Increment retry count and update status if max retries reached
                    const newRetryCount = message.retry_count + 1;
                    const newStatus = newRetryCount >= MAX_RETRY_ATTEMPTS ? 'failed' : 'pending';
                    
                    db.run(
                        `UPDATE messages 
                         SET retry_count = ?,
                             status = ?,
                             last_error = ?
                         WHERE id = ?`,
                        [newRetryCount, newStatus, error.message, message.id]
                    );
                }
            }
        }
    );

    // Process Recurring Messages
    db.all(
        `SELECT * FROM recurring_events 
         WHERE date(next_send_date) <= date('now', 'localtime')`,
        async (err, events) => {
            if (err) {
                console.error('Recurring event query error:', err.message);
                return;
            }
            console.log(`Found ${events.length} recurring events to send.`);
            
            for (let event of events) {
                console.log(`Attempting to send recurring event message to ${event.phone_number}`);
                try {
                    await sendWhatsAppMessage(
                        event.phone_number,
                        event.message,
                        event.media_id
                    );
                    console.log(`Successfully sent recurring event message to ${event.phone_number}`);
                    
                    // Update the next occurrence for the recurring event (e.g., yearly)
                    let nextDate = new Date(event.next_send_date);
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    
                    db.run(
                        `UPDATE recurring_events 
                         SET next_send_date = ?,
                             retry_count = 0,  // Reset retry count on success
                             last_error = NULL
                         WHERE id = ?`,
                        [nextDate.toISOString().split('T')[0], event.id]
                    );
                    
                } catch (error) {
                    console.error(`Failed to send recurring event message to ${event.phone_number}:`, error.message);
                    
                    // Increment retry count for recurring events
                    db.run(
                        `UPDATE recurring_events 
                         SET retry_count = retry_count + 1,
                             last_error = ?
                         WHERE id = ?`,
                        [error.message, event.id]
                    );
                }
            }
        }
    );
});