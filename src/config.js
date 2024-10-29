require('dotenv').config();

const config = {
    dify: {
        apiKey: process.env.DIFY_API_KEY,
        apiUrl: process.env.DIFY_API_URL
    }
};

module.exports = config; 