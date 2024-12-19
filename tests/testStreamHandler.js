const axios = require('axios');
const config = require('../src/config'); // 确保路径正确

const testStreamingApi = async () => {
    const requestBody = {
        inputs: {},
        query: "你好",
        response_mode: "streaming",
        conversation_id: "",
        user: "abc-1234"
    };

    try {
        const response = await axios.post(config.dify.apiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.dify.visitorApiKey // 或者使用其他 API 密钥
            },
            responseType: 'stream'
        });

        response.data.on('data', (chunk) => {
            const data = chunk.toString();
            console.log('接收到的数据:', data);
        });

        response.data.on('end', () => {
            console.log('数据流结束');
        });

        response.data.on('error', (error) => {
            console.error('数据流错误:', error);
        });
    } catch (error) {
        console.error('请求错误:', error.message);
    }
};

// 调用测试方法
testStreamingApi(); 