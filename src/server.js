const express = require('express');
const bodyParser = require('body-parser');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const port = 3001;

// 添加中间件
app.use(bodyParser.json());

// 注册路由
app.use('/espace', chatRoutes);

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
