import express from 'express'
import cors from 'cors'
import { json, urlencoded } from 'body-parser'
import { guidesRouter } from './api-handlers'
import { apiKeyAuth } from './middleware/auth'
import dotenv from 'dotenv';
dotenv.config();

console.log('MONGODB_URI:', process.env.MONGODB_URI);

// 环境变量配置
const PORT = process.env.SERVER_PORT || 3001

// 创建Express应用
const app = express()

// 中间件配置
app.use(cors())
app.use(json({ limit: '50mb' })) // 增大限制以处理base64图片
app.use(urlencoded({ extended: true, limit: '50mb' }))

// 健康检查端点 - 不需要API Key验证
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// 使用API Key验证中间件保护API路由
app.use('/api/guides', apiKeyAuth, guidesRouter)

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
}) 