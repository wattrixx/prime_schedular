// File: public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const sendMessageForm = document.getElementById('sendMessageForm');
    const scheduleMessageForm = document.getElementById('scheduleMessageForm');
    const recurringMessageForm = document.getElementById('recurringMessageForm');
    const mediaInput = document.getElementById('media');
    const mediaPreview = document.getElementById('mediaPreview');
    const previewImage = document.getElementById('previewImage');
    const recurringPhoneInput = document.getElementById("recurringPhone");

	//handles media pre-view
	if (mediaInput && mediaPreview && previewImage) {
        mediaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    mediaPreview.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            } else {
                mediaPreview.classList.add('d-none');
                previewImage.src = '';
            }
        });
    }

    
	
	//for phone number validation 
// Initialize intlTelInput for scheduled message phone input
// Initialize intlTelInput for both phone inputs
const phoneInput = document.querySelector("#phone");
const schedulePhoneInput = document.querySelector("#schedulePhone");

const itiPhone = window.intlTelInput(phoneInput, {
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
    preferredCountries: ['tz', 'ug', 'ke'],
    separateDialCode: true,
    formatOnDisplay: true
});

const itiSchedulePhone = window.intlTelInput(schedulePhoneInput, {
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
    preferredCountries: ['ke', 'ug', 'tz'],
    separateDialCode: true,
    formatOnDisplay: true
});

// Handle send message form submission and schedule message form submission

if (sendMessageForm) {
        sendMessageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const phoneNumber = itiPhone.getNumber();
            const message = formData.get('message');
            const mediaFile = formData.get('media');

            try {
                let mediaId = null;
                if (mediaFile && mediaFile.size > 0) {
                    const mediaFormData = new FormData();
                    mediaFormData.append('media', mediaFile);

                    const uploadResponse = await fetch('/whatsapp/upload-media', {
                        method: 'POST',
                        body: mediaFormData
                    });

                    if (!uploadResponse.ok) throw new Error('Media upload failed');

                    const uploadResult = await uploadResponse.json();
                    mediaId = uploadResult.mediaId;
                }

                const messageResponse = await fetch('/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber, message, mediaId })
                });

                const result = await messageResponse.json();
                if (messageResponse.ok) {
                    alert('Message sent successfully!');
                    e.target.reset();
                    if (mediaPreview) mediaPreview.classList.add('d-none');  // ✅ Fix the null issue
                } else {
                    alert('Error: ' + result.error);
                }

            } catch (error) {
                console.error('Error:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    if (scheduleMessageForm) {
        document.getElementById('scheduleMessageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const phoneNumber = itiSchedulePhone.getNumber();
    const message = formData.get('message');
    const mediaFile = document.getElementById('scheduleMedia').files[0];
    const scheduleDate = formData.get('scheduleDate');
    const scheduleTime = formData.get('scheduleTime');

    try {
        let mediaId = null;
        if (mediaFile) {
            const mediaFormData = new FormData();
            mediaFormData.append('media', mediaFile);

            const uploadResponse = await fetch('/whatsapp/upload-media', {
                method: 'POST',
                body: mediaFormData
            });

            if (!uploadResponse.ok) {
                throw new Error('Media upload failed');
            }

            const uploadResult = await uploadResponse.json();
            mediaId = uploadResult.mediaId;
        }

        const scheduleResponse = await fetch('/whatsapp/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber,
                message,
                mediaId,
                scheduleDate,
                scheduleTime
            })
        });

        if (!scheduleResponse.ok) {
            throw new Error('Failed to schedule message');
        }

        alert('Message scheduled successfully!');
        e.target.reset();
    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    }
});

    }
//for scheduling recurring events
 const itiRecurringPhone = window.intlTelInput(recurringPhoneInput, {
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
        preferredCountries: ['ke', 'ug', 'tz'],
        separateDialCode: true,
        formatOnDisplay: true
    });

    document.getElementById('recurringMessageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const phoneNumber = itiRecurringPhone.getNumber();  // Get the full international format number
        const eventName = formData.get('eventName');
        const eventDate = formData.get('eventDate');
        const message = formData.get('message');
        const mediaFile = document.getElementById('recurringMedia').files[0];

        try {
            let mediaId = null;
            if (mediaFile) {
                const mediaFormData = new FormData();
                mediaFormData.append('media', mediaFile);

                const uploadResponse = await fetch('/whatsapp/upload-media', {
                    method: 'POST',
                    body: mediaFormData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Media upload failed');
                }

                const uploadResult = await uploadResponse.json();
                mediaId = uploadResult.mediaId;
            }

            const eventResponse = await fetch('/whatsapp/save-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,  // Use formatted number
                    eventName,
                    eventDate,
                    message,
                    mediaId
                })
            });

            if (!eventResponse.ok) {
                throw new Error('Failed to save event');
            }

            alert('Recurring event saved successfully!');
            e.target.reset();
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        }
    });
});


