const axios = require('axios');
const config = require('../config');
const chatService = require('../services/chatService');

const handleStreamingResponse = async (req, res, apiKey) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const user = req.body.user;
    const conversationId = chatService.getConversationId(user);

    const response = await axios.post(
        config.dify.apiUrl,
        {
            inputs: req.body.inputs,
            query: req.body.query,
            response_mode: req.body.response_mode,
            conversation_id: conversationId,
            user: user
        },
        {
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        }
    );

    let isResponseEnded = false;
    let responseData = '';

    response.data.on('data', (chunk) => {
        const data = chunk.toString();
        responseData += data;
        res.write(data);
    });

    response.data.on('end', () => {
        isResponseEnded = true;
        res.end();

        try {
            const jsonMatches = responseData.match(/data: (.+?)(?=\n|$)/g);
            if (jsonMatches) {
                jsonMatches.forEach((match) => {
                    const jsonData = JSON.parse(match.replace(/^data: /, ''));
                    if (jsonData.conversation_id) {
                        chatService.setConversationId(user, jsonData.conversation_id);
                    }
                });
            }
        } catch (error) {
            console.error('解析数据错误:', error);
        }
    });

    response.data.on('close', () => {
        if (!isResponseEnded) {
            isResponseEnded = true;
            res.end();
        }
        response.data.destroy();
    });
};

const handleNormalResponse = async (req, res, apiKey) => {
    const user = req.body.user;
    const conversationId = chatService.getConversationId(user);

    const response = await axios.post(
        config.dify.apiUrl,
        {
            inputs: req.body.inputs,
            query: req.body.query,
            response_mode: req.body.response_mode,
            conversation_id: conversationId,
            user: user
        },
        {
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            }
        }
    );
    
    chatService.setConversationId(user, response.data.conversation_id);
    res.json(response.data);
};

module.exports = {
    handleStreamingResponse,
    handleNormalResponse
}; 