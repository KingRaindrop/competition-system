import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { nowLocal } from '../lib/utils.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/registrations — 根据查询参数返回报名
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { competitionId, studentId } = req.query
    const where: any = {}
    if (competitionId) where.competitionId = competitionId
    if (studentId) {
      // 学生可能在团队中
      const teams = await prisma.teamMember.findMany({
        where: { studentId: studentId as string, status: 'accepted' },
      })
      const teamIds = teams.map(t => t.teamId)
      where.OR = [
        { studentId: studentId as string },
        ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
      ]
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json(registrations)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/registrations/:id
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const reg = await prisma.registration.findUnique({
      where: { registrationId: req.params.id as string },
    })
    if (!reg) {
      res.status(404).json({ message: '报名不存在' })
      return
    }
    res.json(reg)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/registrations
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { competitionId, teamId, workTitle, advisorId, notes } = req.body
    if (!competitionId || !workTitle) {
      res.status(400).json({ message: '缺少必填字段' })
      return
    }

    // 检查是否被禁赛
    const student = await prisma.user.findUnique({ where: { userId: req.user!.userId } })
    if (student?.banned) {
      res.status(403).json({ message: '你已被禁止参加竞赛' })
      return
    }

    // 检查竞赛是否存在且可以报名
    const comp = await prisma.competition.findUnique({ where: { competitionId } })
    if (!comp) {
      res.status(404).json({ message: '竞赛不存在' })
      return
    }

    const now = nowLocal()
    if (comp.status !== 'registering' && comp.status !== 'published') {
      res.status(400).json({ message: '当前竞赛状态不允许报名' })
      return
    }
    if (now < comp.regStart || now > comp.regEnd) {
      res.status(400).json({ message: '不在报名时间范围内' })
      return
    }

    // 检查是否已报名
    const alreadyReg = await checkAlreadyRegistered(competitionId, req.user!.userId, teamId)
    if (alreadyReg.registered) {
      res.status(400).json({ message: '你已报名该竞赛' })
      return
    }

    const reg = await prisma.registration.create({
      data: {
        registrationId: uuidv4(),
        competitionId,
        teamId: teamId || null,
        studentId: teamId ? null : req.user!.userId,
        workTitle,
        advisorId: advisorId || null,
        notes: notes || null,
        status: 'registered',
        createdAt: now,
      },
    })

    // 发送通知
    await prisma.notification.create({
      data: {
        notificationId: uuidv4(),
        userId: req.user!.userId,
        title: '报名成功',
        content: `你已成功报名"${comp.title}"，请按时提交作品。`,
        read: false,
        createdAt: now,
      },
    }).catch(() => null)

    res.status(201).json(reg)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/registrations/:id
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const reg = await prisma.registration.findUnique({ where: { registrationId: req.params.id as string } })
    if (!reg) {
      res.status(404).json({ message: '报名不存在' })
      return
    }

    // 检查报名截止时间
    const comp = await prisma.competition.findUnique({ where: { competitionId: reg.competitionId } })
    if (comp) {
      const now = nowLocal()
      if (now > comp.regEnd) {
        res.status(400).json({ message: '报名已截止，无法修改' })
        return
      }
    }

    const { workTitle, advisorId, notes, teamId } = req.body
    const updated = await prisma.registration.update({
      where: { registrationId: req.params.id as string },
      data: { workTitle, advisorId, notes, teamId },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/registrations/:id/status
router.patch('/:id/status', auth, async (req: Request, res: Response) => {
  try {
    const reg = await prisma.registration.findUnique({ where: { registrationId: req.params.id as string } })
    if (!reg) {
      res.status(404).json({ message: '报名不存在' })
      return
    }
    if (!await canManageRegistration(reg, req.user!.userId, req.user!.role)) {
      res.status(403).json({ message: '无权修改该报名' })
      return
    }
    const { status } = req.body
    const updated = await prisma.registration.update({
      where: { registrationId: req.params.id as string },
      data: { status },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/registrations/:id/finalist — 设置/取消决赛资格
router.patch('/:id/finalist', auth, async (req: Request, res: Response) => {
  try {
    const { isFinalist } = req.body
    const updated = await prisma.registration.update({
      where: { registrationId: req.params.id as string },
      data: { isFinalist, status: isFinalist ? 'qualified' : 'submitted' },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/registrations/:id
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const reg = await prisma.registration.findUnique({ where: { registrationId: req.params.id as string } })
    if (!reg) {
      res.status(404).json({ message: '报名不存在' })
      return
    }
    const comp = await prisma.competition.findUnique({ where: { competitionId: reg.competitionId } })
    if (comp) {
      const now = nowLocal()
      if (now > comp.regEnd) {
        res.status(400).json({ message: '报名已截止，无法取消' })
        return
      }
    }

    await prisma.registration.delete({ where: { registrationId: req.params.id as string } })
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/registrations/check/:competitionId — 检查是否已报名
router.get('/check/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    const result = await checkAlreadyRegistered(req.params.competitionId as string, req.user!.userId)
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function checkAlreadyRegistered(competitionId: string, userId: string, teamId?: string | null): Promise<{ registered: boolean; registrationId?: string }> {
  const regs = await prisma.registration.findMany({ where: { competitionId } })

  for (const r of regs) {
    if (r.studentId === userId) return { registered: true, registrationId: r.registrationId }
    if (r.teamId) {
      const member = await prisma.teamMember.findFirst({
        where: { teamId: r.teamId, studentId: userId, status: 'accepted' },
      })
      if (member) return { registered: true, registrationId: r.registrationId }
    }
  }
  return { registered: false }
}

async function canManageRegistration(reg: any, userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return true
  // 个人报名：报名者本人可以管理
  if (reg.studentId === userId) return true
  // 团队报名：队长可以管理
  if (reg.teamId) {
    const team = await prisma.team.findUnique({ where: { teamId: reg.teamId } })
    if (team?.captainId === userId) return true
    return false
  }
  return false
}

export default router
