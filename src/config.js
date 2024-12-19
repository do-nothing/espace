require('dotenv').config();

const config = {
    dify: {
        visitorApiKey: process.env.DIFY_VISITOR_API_KEY,
        enrollerApiKey: process.env.DIFY_ENROLLER_API_KEY,
        apiUrl: process.env.DIFY_API_URL
    }
};

module.exports = config; 