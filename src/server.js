const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');

const app = express();
const port = 3001;

// 中间件配置
app.use(bodyParser.json());
const conversationIdPool = {}

// 调用 Dify API 的函数
async function callDifyAPI(conversation_id,query) {
    try {
        const response = await axios.post(config.dify.apiUrl, {
            inputs: {},
            query: query,
            response_mode: "blocking",
            conversation_id: conversation_id,
            user: "abc-1234"
        }, {
            headers: {
                'Authorization': config.dify.apiKey,
                'Content-Type': 'application/json'
            }
        });

        return {
            conversationId: response.data.conversation_id,
            answer: response.data.answer
        };
    } catch (error) {
        console.error('Dify API 调用失败:', error);
        throw error;
    }
}

// 生成响应的同步函数修改为异步函数
async function generateResponse(points, content) {
    const conversation_id = conversationIdPool[points] || "";
    // 调用 Dify API
    const difyResponse = await callDifyAPI(conversation_id, content);
    conversationIdPool[points] = difyResponse.conversationId;
    
    // 尝试从 answer 中解析订单信息
    let data = null;

    try {
        // 从 answer 中提取 JSON 字符串
        const jsonMatch = difyResponse.answer.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[1]);
            data = {
                startAddress: parsedData.pickup_location,
                endAddress: parsedData.dropoff_location,
                appointmentTime: parsedData.pickup_time,
                passengersCounts: parsedData.passenger_count.toString()
            };
        }
    } catch (error) {
        console.error('解析 Dify 响应失败:', error);
    }

    const answer = difyResponse.answer;
    return {
        points,
        answer,
        data
    };
}

// 获取格式化的当前时间
function getCurrentTime() {
    return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

// API路由处理修改为异步处理
app.post('/api/process', async (req, res) => {
    const requestTime = getCurrentTime();
    try {
        // 打印入参
        console.log(`\n=== 请求入参 [${requestTime}] ===`);
        console.log(JSON.stringify(req.body, null, 2));

        const { points, mesType, content, audio } = req.body;

        // 验证输入
        if (!points || !mesType || !content) {
            const errorResponse = {
                status: 1,
                message: '缺少必要参数'
            };
            console.log(`\n=== 响应出参 [${getCurrentTime()}] ===`);
            console.log(JSON.stringify(errorResponse, null, 2));
            return res.status(400).json(errorResponse);
        }

        // 检查mesType是否为有效值
        if (mesType !== '1' && mesType !== '2') {
            const errorResponse = {
                status: 1,
                message: 'mesType必须为1或2'
            };
            console.log(`\n=== 响应出参 [${getCurrentTime()}] ===`);
            console.log(JSON.stringify(errorResponse, null, 2));
            return res.status(400).json(errorResponse);
        }

        // 使用异步函数生成响应
        const generatedResponse = await generateResponse(points, content);

        // 构建最终响应
        const response = {
            status: 0,
            channel: {
                points: generatedResponse.points,
                content: generatedResponse.answer
            },
            data: generatedResponse.data,
        };

        const responseTime = getCurrentTime();
        // 打印出参
        console.log(`\n=== 响应出参 [${responseTime}] ===`);
        console.log(JSON.stringify(response, null, 2));

        res.json(response);
    } catch (error) {
        console.error('处理请求失败:', error);
        const errorResponse = {
            status: 1,
            message: '服务器内部错误'
        };
        console.log(`\n=== 错误响应出参 [${getCurrentTime()}] ===`);
        console.log(JSON.stringify(errorResponse, null, 2));
        res.status(500).json(errorResponse);
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
