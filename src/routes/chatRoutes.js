const express = require('express');
const router = express.Router();
const config = require('../config');
const { handleStreamingResponse, handleNormalResponse } = require('../handlers/streamHandler');

// 访问者路由
router.post('/visitor', async (req, res) => {
    try {
        const requestBody = {
            ...req.body,
            inputs: {}
        };

        if (requestBody.response_mode === 'streaming') {
            await handleStreamingResponse(
                { ...req, body: requestBody },
                res,
                config.dify.visitorApiKey
            );
        } else {
            await handleNormalResponse(
                { ...req, body: requestBody },
                res,
                config.dify.visitorApiKey
            );
        }
    } catch (error) {
        console.error('Dify API 调用错误:', error.message);
        res.status(500).json({
            error: '服务器内部错误',
            message: error.message
        });
    }
});

// 已登录用户路由
router.post('/enroller', async (req, res) => {
    try {
        if (req.body.response_mode === 'streaming') {
            await handleStreamingResponse(req, res, config.dify.enrollerApiKey);
        } else {
            await handleNormalResponse(req, res, config.dify.enrollerApiKey);
        }
    } catch (error) {
        console.error('Dify API 调用错误:', error.message);
        res.status(500).json({
            error: '服务器内部错误',
            message: error.message
        });
    }
});

module.exports = router; 