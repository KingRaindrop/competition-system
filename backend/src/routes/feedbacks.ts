import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth, requireRole } from '../middleware/auth.js'
import { nowLocal } from '../lib/utils.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// POST /api/feedbacks — 学生创建反馈
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body
    if (!title || !content) {
      res.status(400).json({ message: '请输入标题和内容' })
      return
    }
    const now = nowLocal()
    const feedback = await prisma.feedback.create({
      data: {
        feedbackId: uuidv4(),
        userId: req.user!.userId,
        title,
        content,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
      include: { user: true },
    })
    res.status(201).json(formatFeedback(feedback))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/feedbacks — 学生看自己的，管理员看全部
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const where: any = {}
    if (req.user!.role !== 'admin') {
      where.userId = req.user!.userId
    }
    const feedbacks = await prisma.feedback.findMany({
      where,
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(feedbacks.map(formatFeedback))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/feedbacks/:id — 管理员回复/标记状态
router.patch('/:id', auth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { adminReply, status } = req.body
    const now = nowLocal()
    const data: any = { updatedAt: now }
    if (adminReply !== undefined) data.adminReply = adminReply
    if (status !== undefined) data.status = status

    const feedback = await prisma.feedback.update({
      where: { feedbackId: req.params.id as string },
      data,
      include: { user: true },
    })
    res.json(formatFeedback(feedback))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

function formatFeedback(f: any) {
  return {
    feedbackId: f.feedbackId,
    userId: f.userId,
    title: f.title,
    content: f.content,
    status: f.status,
    adminReply: f.adminReply,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    user: f.user ? {
      userId: f.user.userId,
      name: f.user.name,
      role: f.user.role,
      college: f.user.college,
    } : null,
  }
}

export default router
