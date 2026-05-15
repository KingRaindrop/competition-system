import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/teams/mine — 获取我的团队
router.get('/mine', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    // 我是队长的团队
    const captainTeams = await prisma.team.findMany({
      where: { captainId: userId },
      include: { members: { include: { student: true } } },
    })
    // 我是成员的团队
    const memberRecords = await prisma.teamMember.findMany({
      where: { studentId: userId, status: 'accepted' },
    })
    const memberTeamIds = memberRecords.map(m => m.teamId)
    const memberTeams = await prisma.team.findMany({
      where: { teamId: { in: memberTeamIds } },
      include: { members: { include: { student: true } } },
    })

    // 合并去重
    const allTeams = [...captainTeams]
    for (const t of memberTeams) {
      if (!allTeams.find(at => at.teamId === t.teamId)) {
        allTeams.push(t)
      }
    }

    res.json(allTeams.map(formatTeam))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/teams/by-competition/:competitionId — 获取竞赛下所有团队
router.get('/by-competition/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    const competitionId = req.params.competitionId as string

    // 权限：admin 或竞赛创建者
    if (req.user!.role !== 'admin') {
      const comp = await prisma.competition.findUnique({ where: { competitionId } })
      if (!comp || comp.creatorId !== req.user!.userId) {
        res.status(403).json({ message: '无权查看该竞赛的团队信息' })
        return
      }
    }

    const registrations = await prisma.registration.findMany({
      where: { competitionId, teamId: { not: null } },
      select: { teamId: true },
    })
    const teamIds = [...new Set(registrations.map(r => r.teamId))] as string[]

    if (teamIds.length === 0) {
      res.json([])
      return
    }

    const teams = await prisma.team.findMany({
      where: { teamId: { in: teamIds } },
      include: { members: { include: { student: true } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json(teams.map(formatTeam))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/teams/:id
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { teamId: req.params.id as string },
      include: { members: { include: { student: true } } },
    })
    if (!team) {
      res.status(404).json({ message: '团队不存在' })
      return
    }
    res.json(formatTeam(team))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/teams
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { name } = req.body
    if (!name) {
      res.status(400).json({ message: '请输入团队名称' })
      return
    }
    const team = await prisma.team.create({
      data: { teamId: uuidv4(), name, captainId: req.user!.userId },
    })
    await prisma.teamMember.create({
      data: {
        id: uuidv4(),
        teamId: team.teamId,
        studentId: req.user!.userId,
        role: 'captain',
        status: 'accepted',
      },
    })

    const created = await prisma.team.findUnique({
      where: { teamId: team.teamId },
      include: { members: { include: { student: true } } },
    })
    res.status(201).json(formatTeam(created!))
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/teams/:id/members — 邀请队员
router.post('/:id/members', auth, async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({ where: { teamId: req.params.id as string } })
    if (!team) {
      res.status(404).json({ message: '团队不存在' })
      return
    }
    if (team.captainId !== req.user!.userId) {
      res.status(403).json({ message: '只有队长可以邀请队员' })
      return
    }

    const { studentId } = req.body
    if (!studentId) {
      res.status(400).json({ message: '请提供学号' })
      return
    }

    // 检查是否已存在
    const existing = await prisma.teamMember.findFirst({
      where: { teamId: req.params.id as string, studentId },
    })
    if (existing) {
      res.status(400).json({ message: '该学生已在团队中或已收到邀请' })
      return
    }

    const member = await prisma.teamMember.create({
      data: {
        id: uuidv4(),
        teamId: req.params.id as string,
        studentId,
        role: 'member',
        status: 'invited',
      },
    })

    // 发送通知
    await prisma.notification.create({
      data: {
        notificationId: uuidv4(),
        userId: studentId,
        title: '团队邀请',
        content: `你已被邀请加入"${team.name}"团队。`,
        read: false,
        createdAt: new Date().toISOString(),
      },
    })

    res.status(201).json(member)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/teams/:id/members/:memberId — 接受/拒绝邀请
router.patch('/:id/members/:memberId', auth, async (req: Request, res: Response) => {
  try {
    const { status } = req.body // 'accepted' | 'rejected'
    const member = await prisma.teamMember.findUnique({ where: { id: req.params.memberId as string } })
    if (!member) {
      res.status(404).json({ message: '成员记录不存在' })
      return
    }
    if (member.studentId !== req.user!.userId) {
      res.status(403).json({ message: '只能处理自己的邀请' })
      return
    }

    const updated = await prisma.teamMember.update({
      where: { id: req.params.memberId as string },
      data: { status },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/teams/:id/members/:memberId — 移出队员
router.delete('/:id/members/:memberId', auth, async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({ where: { teamId: req.params.id as string } })
    if (!team) {
      res.status(404).json({ message: '团队不存在' })
      return
    }
    if (!await canManageTeam(req.params.id as string, req.user!.userId, req.user!.role)) {
      res.status(403).json({ message: '只有队长、管理员或竞赛创建者可以移除队员' })
      return
    }

    const member = await prisma.teamMember.findUnique({ where: { id: req.params.memberId as string } })
    if (member && member.role === 'captain') {
      res.status(400).json({ message: '不能移除队长' })
      return
    }

    await prisma.teamMember.delete({ where: { id: req.params.memberId as string } })
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/teams/:id — 解散团队
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({ where: { teamId: req.params.id as string } })
    if (!team) {
      res.status(404).json({ message: '团队不存在' })
      return
    }
    if (!await canManageTeam(req.params.id as string, req.user!.userId, req.user!.role)) {
      res.status(403).json({ message: '只有队长、管理员或竞赛创建者可以解散团队' })
      return
    }
    await prisma.team.delete({ where: { teamId: req.params.id as string } })
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/teams/invitations/pending — 待处理的邀请
router.get('/invitations/pending', auth, async (req: Request, res: Response) => {
  try {
    const invitations = await prisma.teamMember.findMany({
      where: { studentId: req.user!.userId, status: 'invited' },
      include: { team: true },
    })
    res.json(invitations)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function canManageTeam(teamId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return true
  const team = await prisma.team.findUnique({ where: { teamId } })
  if (!team) return false
  if (team.captainId === userId) return true
  // 检查是否是注册了该团队的竞赛的创建者
  const regs = await prisma.registration.findMany({
    where: { teamId },
    select: { competitionId: true },
  })
  const compIds = regs.map(r => r.competitionId)
  if (compIds.length > 0) {
    const comps = await prisma.competition.findMany({
      where: { competitionId: { in: compIds } },
      select: { creatorId: true },
    })
    if (comps.some(c => c.creatorId === userId)) return true
  }
  return false
}

function formatTeam(t: any) {
  return {
    teamId: t.teamId,
    name: t.name,
    captainId: t.captainId,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    members: t.members?.map((m: any) => ({
      id: m.id,
      teamId: m.teamId,
      studentId: m.studentId,
      role: m.role,
      status: m.status,
      user: m.student ? {
        userId: m.student.userId,
        name: m.student.name,
        college: m.student.college,
        major: m.student.major,
        grade: m.student.grade,
        email: m.student.email,
        phone: m.student.phone,
      } : null,
    })) || [],
  }
}

export default router
