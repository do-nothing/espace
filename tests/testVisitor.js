const axios = require('axios');

async function testVisitorEndpoint() {
    // 获取命令行参数，如果没有则使用默认值 "你好"
    const query = process.argv[2] || "你好";
    
    const url = 'http://localhost:3001/espace/visitor';
    const payload = {
        query: query,
        response_mode: "streaming",
        user: "abc-1234"
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        let buffer = ''; // 用于存储接收到的数据

        // 处理流式响应
        response.data.on('data', chunk => {
            buffer += chunk.toString(); // 将 Buffer 转换为字符串并添加到缓冲区

            // 尝试提取并处理完整的 JSON 对象
            try {
                // 使用正则表达式提取完整的 data: {...} 格式的数据
                const matches = buffer.match(/data: ({[^}]+})/g);
                if (matches) {
                    matches.forEach(match => {
                        try {
                            // 提取 JSON 部分
                            const jsonStr = match.replace('data: ', '');
                            const data = JSON.parse(jsonStr);
                            
                            // 只处理包含 answer 的消息
                            if (data.answer) {
                                process.stdout.write(data.answer);
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    });

                    // 更新缓冲区，只保留最后一个不完整的部分
                    const lastMatch = matches[matches.length - 1];
                    const lastIndex = buffer.lastIndexOf(lastMatch) + lastMatch.length;
                    buffer = buffer.substring(lastIndex);
                }
            } catch (error) {
                // 忽略解析错误
            }
        });

        response.data.on('end', () => {
            console.log('\n响应结束');
        });

    } catch (error) {
        console.error('测试失败:', error.response?.status || error.message);
    }
}

// 运行测试
testVisitorEndpoint(); 