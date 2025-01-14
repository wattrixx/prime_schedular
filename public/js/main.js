// File: public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const sendMessageForm = document.getElementById('sendMessageForm');
    const scheduleMessageForm = document.getElementById('scheduleMessageForm');

    if (sendMessageForm) {
        sendMessageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                const response = await fetch('/whatsapp/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phoneNumber: formData.get('phoneNumber'),
                        message: formData.get('message')
                    })
                });
                if (response.ok) {
                    alert('Message sent successfully!');
                    location.reload();
                }
            } catch (error) {
                alert('Error sending message');
            }
        });
    }

    if (scheduleMessageForm) {
        scheduleMessageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                const response = await fetch('/whatsapp/schedule', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phoneNumber: formData.get('phoneNumber'),
                        message: formData.get('message'),
                        event: formData.get('event'),
                        scheduleDate: formData.get('scheduleDate'),
                        scheduleTime: formData.get('scheduleTime')
                    })
                });
                if (response.ok) {
                    alert('Message scheduled successfully!');
                    location.reload();
                }
            } catch (error) {
                alert('Error scheduling message');
            }
        });
    }
});
