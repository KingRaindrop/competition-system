import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import competitionRoutes from './routes/competitions.js'
import teamRoutes from './routes/teams.js'
import registrationRoutes from './routes/registrations.js'
import fileRoutes from './routes/files.js'
import reviewRoutes from './routes/reviews.js'
import awardRoutes from './routes/awards.js'
import notificationRoutes from './routes/notifications.js'
import feedbackRoutes from './routes/feedbacks.js'
import inviteCodeRoutes from './routes/inviteCodes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// 中间件
app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/competitions', competitionRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/awards', awardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/feedbacks', feedbackRoutes)
app.use('/api/invite-codes', inviteCodeRoutes)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 前端静态文件（Docker 部署时使用）
const publicDir = path.join(__dirname, '..', 'public')
app.use(express.static(publicDir))

// SPA 回退：非 API 请求全部返回 index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'))
})

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})

export default app
