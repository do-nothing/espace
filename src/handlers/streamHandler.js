const axios = require('axios');
const config = require('../config');
const chatService = require('../services/chatService');

const handleStreamingResponse = async (req, res, apiKey) => {
    const user = req.body.user;
    const conversationId = chatService.getConversationId(user);
    
    console.log(`[${new Date().toLocaleString()}] 用户${user} 问: ${req.body.query}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
            // 查找 workflow_finished 事件的数据
            const lines = responseData.split('\n');
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                
                try {
                    const jsonStr = line.substring(6); // 去掉 'data: ' 前缀
                    const jsonData = JSON.parse(jsonStr);
                    
                    if (jsonData.event === 'workflow_finished') {
                        const { conversation_id } = jsonData;
                        const answer = jsonData.data?.outputs?.answer;
                        
                        // 设置会话ID
                        if (conversation_id) {
                            chatService.setConversationId(user, conversation_id);
                        }
                        
                        // 打印回复日志
                        console.log(`[${new Date().toLocaleString()}] 用户${user} 收到回复: ${answer || '无回复'}\n`);
                        break;
                    }
                } catch (e) {
                    // 忽略单条数据的解析错误，继续处理下一条
                    continue;
                }
            }
        } catch (error) {
            console.error('解析错误:', error.message);
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
    
    console.log(`[${new Date().toLocaleString()}] 用户${user} 问: ${req.body.query}`);

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
    console.log(`[${new Date().toLocaleString()}] 用户${user} 收到回复: ${response.data.answer || '无回复'}\n`);
    res.json(response.data);
};

module.exports = {
    handleStreamingResponse,
    handleNormalResponse
}; 