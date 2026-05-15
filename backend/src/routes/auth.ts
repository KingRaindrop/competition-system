import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { signToken, verifyToken } from '../lib/jwt.js'
import { auth } from '../middleware/auth.js'
import { nowLocal } from '../lib/utils.js'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { userId, name, password, role, college, major, grade, email, phone, inviteCode } = req.body
    if (!userId || !name || !password) {
      res.status(400).json({ message: '学号/工号、姓名、密码为必填项' })
      return
    }
    if (!college) {
      res.status(400).json({ message: '请选择所属学院' })
      return
    }
    if (!inviteCode) {
      res.status(400).json({ message: '请输入邀请码' })
      return
    }

    // 验证邀请码
    const cleanCode = (inviteCode as string).trim().toUpperCase()
    const codeRecord = await prisma.inviteCode.findUnique({ where: { code: cleanCode } })
    if (!codeRecord) {
      res.status(400).json({ message: '邀请码不存在' })
      return
    }
    if (codeRecord.expiresAt && new Date(codeRecord.expiresAt) < new Date()) {
      res.status(400).json({ message: '邀请码已过期' })
      return
    }
    if (codeRecord.usedCount >= codeRecord.maxUses) {
      res.status(400).json({ message: '邀请码已达使用上限' })
      return
    }
    const allowedColleges: string[] = JSON.parse(codeRecord.colleges)
    if (!allowedColleges.includes(college)) {
      return
    }

    const exists = await prisma.user.findUnique({ where: { userId } })
    if (exists) {
      res.status(400).json({ message: '该学号/工号已被注册' })
      return
    }

    // 邀请码决定初始角色：教师邀请码→teacher，学生邀请码→student
    let finalRole = codeRecord.role === 'teacher' ? 'teacher' : 'student'
    // 管理员可以手动指定角色（覆盖邀请码角色）
    if (role && (role === 'admin' || role === 'teacher')) {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (token) {
        try {
          const payload = verifyToken(token)
          if (payload.role === 'admin') {
            finalRole = role
          }
        } catch { /* token无效则忽略 */ }
      }
    }

    const hash = bcrypt.hashSync(password, 10)
    const user = await prisma.user.create({
      data: {
        userId,
        name,
        role: finalRole,
        password: hash,
        college: college || '',
        major: major || null,
        grade: grade || null,
        email: email || null,
        phone: phone || null,
        status: 1,
      },
    })

    // 增加邀请码使用次数
    await prisma.inviteCode.update({
      where: { code: cleanCode },
      data: { usedCount: codeRecord.usedCount + 1 },
    })

    const tokenResult = signToken({ userId: user.userId, role: user.role })

    res.status(201).json({
      token: tokenResult,
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        college: user.college,
        major: user.major,
        grade: user.grade,
        email: user.email,
        phone: user.phone,
        status: user.status,
        banned: user.banned,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (e: any) {
    res.status(500).json({ message: '注册失败: ' + e.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body
    if (!userId) {
      res.status(400).json({ message: '请输入学号/工号' })
      return
    }
    if (!password) {
      res.status(400).json({ message: '请输入密码' })
      return
    }

    const user = await prisma.user.findUnique({ where: { userId } })
    if (!user || user.status === 0) {
      res.status(401).json({ message: '账号不存在或已停用' })
      return
    }

    if (user.banned) {
      res.status(403).json({ message: '您已被封禁，请联系管理员' })
      return
    }

    const validPassword = bcrypt.compareSync(password, user.password)

    if (!validPassword) {
      res.status(401).json({ message: '密码错误' })
      return
    }

    const token = signToken({ userId: user.userId, role: user.role })

    // 更新竞赛状态
    await refreshCompetitionStatuses()

    res.json({
      token,
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        college: user.college,
        major: user.major,
        grade: user.grade,
        email: user.email,
        phone: user.phone,
        status: user.status,
        banned: user.banned,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (e: any) {
    res.status(500).json({ message: '登录失败: ' + e.message })
  }
})

// GET /api/auth/me
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { userId: req.user!.userId } })
    if (!user) {
      res.status(404).json({ message: '用户不存在' })
      return
    }
    res.json({
      userId: user.userId,
      name: user.name,
      role: user.role,
      college: user.college,
      major: user.major,
      grade: user.grade,
      email: user.email,
      phone: user.phone,
      status: user.status,
      banned: user.banned,
      createdAt: user.createdAt.toISOString(),
    })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/auth/profile
router.put('/profile', auth, async (req: Request, res: Response) => {
  try {
    const { email, phone, college, major, grade } = req.body
    const user = await prisma.user.update({
      where: { userId: req.user!.userId },
      data: { email, phone, college, major, grade },
    })
    res.json({
      userId: user.userId,
      name: user.name,
      role: user.role,
      college: user.college,
      major: user.major,
      grade: user.grade,
      email: user.email,
      phone: user.phone,
      status: user.status,
      banned: user.banned,
      createdAt: user.createdAt.toISOString(),
    })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function refreshCompetitionStatuses() {
  const now = nowLocal()
  const comps = await prisma.competition.findMany()

  for (const c of comps) {
    let newStatus = c.status
    if (c.status === 'published' && now >= c.regStart && now <= c.regEnd) newStatus = 'registering'
    else if (c.status === 'registering' && now > c.regEnd && now < c.reviewStart) newStatus = 'published'
    else if ((c.status === 'published' || c.status === 'registering') && now >= c.reviewStart && now <= c.reviewEnd) newStatus = 'reviewing'
    else if (c.status === 'reviewing' && now > c.reviewEnd && now < c.resultTime) newStatus = 'final'
    else if (c.status === 'final' && now >= c.resultTime) newStatus = 'ended'

    if (newStatus !== c.status) {
      await prisma.competition.update({
        where: { competitionId: c.competitionId },
        data: { status: newStatus, updatedAt: new Date().toISOString() },
      })
    }
  }
}

export default router
