//testUpload.js
const axios = require('axios');
const FormData = require('form-data');  // Import correct FormData for Node.js
const fs = require('fs');

// Define file path (use forward slashes or escaped backslashes)
const filePath = "C:/Users/user/Downloads/WhatsApp_Image.jpeg";  

async function testUpload() {
    try {
        const formData = new FormData();
		formData.append('messaging_product', 'whatsapp'); 
        formData.append('file', fs.createReadStream(filePath));  // Read file for upload
        formData.append('type', 'image/jpeg');

        const response = await axios.post(
            'https://graph.facebook.com/v22.0/470609146145333/media',
            formData,
            {
                headers: {
                    'Authorization': `Bearer EAAXVE6Y5fckBO8czoJNhhhWZAFx66u8tw7JgxsadaMpGAU3Eb5j42hCpIzFSu84SseziMHez3xH5ZC5CnfOjqkkVc9YH3ZA01elRk2x8tgjY97143w0462mF9ecuDlHejLCDSpo1BJP2rVSGu4Ec0krLDtTBTuhGZC3xfEDZC5P774awafv9TZC2NQc3Pd4dwPEfisIyt6DY34ZCycDNPIKUAmLvUk8KS4V3WfyoaSZB`,
                    ...formData.getHeaders(),  // Correctly add headers from form-data
                },
            }
        );

        console.log('Upload successful:', response.data);
    } catch (error) {
        console.error('Upload error:', error.response?.data || error.message);
    }
}

testUpload();
