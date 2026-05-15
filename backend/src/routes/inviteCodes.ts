import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth, requireRole } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/invite-codes — admin sees all, teacher sees own
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const where: any = {}
    if (req.user!.role === 'teacher') {
      where.createdBy = req.user!.userId
    } else if (req.user!.role !== 'admin') {
      res.status(403).json({ message: '无权访问' })
      return
    }
    const codes = await prisma.inviteCode.findMany({
      where,
      include: { creator: { select: { userId: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(codes.map(formatCode))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/invite-codes — admin/teacher creates invite codes
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { maxUses, colleges, count, role } = req.body
    if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      res.status(403).json({ message: '无权操作' })
      return
    }
    if (!colleges || !Array.isArray(colleges) || colleges.length === 0) {
      res.status(400).json({ message: '请选择至少一个学院' })
      return
    }
    // 只有管理员可以创建教师邀请码
    const targetRole = req.user!.role === 'admin' && role === 'teacher' ? 'teacher' : 'student'
    const max = Math.max(1, Math.min(parseInt(maxUses) || 1, 10000))
    const num = Math.max(1, Math.min(parseInt(count) || 1, 100))

    const created: any[] = []
    for (let i = 0; i < num; i++) {
      const code = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase()
      const record = await prisma.inviteCode.create({
        data: {
          code,
          createdBy: req.user!.userId,
          maxUses: max,
          usedCount: 0,
          colleges: JSON.stringify(colleges),
          role: targetRole,
        },
        include: { creator: { select: { userId: true, name: true } } },
      })
      created.push(formatCode(record))
    }
    res.status(201).json(created)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/invite-codes/:code
router.delete('/:code', auth, async (req: Request, res: Response) => {
  try {
    const code = await prisma.inviteCode.findUnique({ where: { code: req.params.code as string } })
    if (!code) {
      res.status(404).json({ message: '邀请码不存在' })
      return
    }
    if (req.user!.role !== 'admin' && code.createdBy !== req.user!.userId) {
      res.status(403).json({ message: '无权操作' })
      return
    }
    await prisma.inviteCode.delete({ where: { code: req.params.code as string } })
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/invite-codes/validate — validate an invite code (public)
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, college } = req.body
    const trimmedCode = (code as string).trim().toUpperCase()
    const trimmedCollege = (college as string).trim()
    if (!trimmedCode || !trimmedCollege) {
      res.status(400).json({ message: '邀请码和学院不能为空' })
      return
    }
    const record = await prisma.inviteCode.findUnique({ where: { code: trimmedCode } })
    if (!record) {
      res.status(404).json({ message: '邀请码不存在' })
      return
    }
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      res.status(400).json({ message: '邀请码已过期' })
      return
    }
    if (record.usedCount >= record.maxUses) {
      res.status(400).json({ message: '邀请码已达使用上限' })
      return
    }
    const allowedColleges: string[] = JSON.parse(record.colleges)
    if (!allowedColleges.includes(trimmedCollege)) {
      res.status(400).json({ message: '该邀请码不适用于你选择的学院' })
      return
    }
    res.json({ valid: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

function formatCode(c: any) {
  return {
    code: c.code,
    createdBy: c.createdBy,
    creator: c.creator,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    colleges: typeof c.colleges === 'string' ? JSON.parse(c.colleges) : c.colleges,
    role: c.role || 'student',
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    expiresAt: c.expiresAt instanceof Date ? c.expiresAt.toISOString() : c.expiresAt,
  }
}

export default router
