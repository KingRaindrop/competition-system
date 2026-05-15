import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth, requireRole } from '../middleware/auth.js'
import { nowLocal } from '../lib/utils.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/competitions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, keyword, creatorId } = req.query

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (creatorId) where.creatorId = creatorId
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string } },
        { organizer: { contains: keyword as string } },
      ]
    }

    const competitions = await prisma.competition.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })
    res.json(competitions)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/competitions/published — 公开已发布的竞赛
router.get('/published', async (_req: Request, res: Response) => {
  try {
    const competitions = await prisma.competition.findMany({
      where: { status: { in: ['published', 'registering', 'reviewing', 'final', 'ended'] } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(competitions)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/competitions/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const competition = await prisma.competition.findUnique({
      where: { competitionId: req.params.id as string },
    })
    if (!competition) {
      res.status(404).json({ message: '竞赛不存在' })
      return
    }
    res.json(competition)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/competitions
router.post('/', auth, requireRole('admin', 'teacher'), async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString()
    const { title, organizer, category, description, detail, coverImage, regStart, regEnd, submitStart, submitEnd, reviewStart, reviewEnd, finalTime, finalLocation, resultTime, allowFormats, maxFileSize, allowIndividual, teamMin, teamMax, requireAdvisor, reviewMode } = req.body
    const comp = await prisma.competition.create({
      data: {
        competitionId: uuidv4(),
        title,
        organizer,
        category,
        description,
        detail: detail || null,
        coverImage: coverImage || null,
        creatorId: req.user!.userId,
        status: 'draft',
        regStart,
        regEnd,
        submitStart,
        submitEnd,
        reviewStart,
        reviewEnd,
        finalTime: finalTime || null,
        finalLocation: finalLocation || null,
        resultTime,
        allowFormats: allowFormats ?? 'zip,rar,pdf,ppt,mp4',
        maxFileSize: maxFileSize ?? 100,
        allowIndividual: allowIndividual ?? false,
        teamMin: teamMin || null,
        teamMax: teamMax || null,
        requireAdvisor: requireAdvisor ?? false,
        reviewMode: reviewMode ?? 'open',
        createdAt: now,
        updatedAt: now,
      },
    })
    res.status(201).json(comp)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/competitions/:id
router.put('/:id', auth, requireRole('admin', 'teacher'), async (req: Request, res: Response) => {
  try {
    const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id as string } })
    if (!comp) {
      res.status(404).json({ message: '竞赛不存在' })
      return
    }
    // 教师只能编辑自己的竞赛且状态为草稿或已驳回
    if (req.user!.role === 'teacher') {
      if (comp.creatorId !== req.user!.userId) {
        res.status(403).json({ message: '只能编辑自己创建的竞赛' })
        return
      }
      if (!['draft', 'pending'].includes(comp.status)) {
        res.status(400).json({ message: '当前状态不允许编辑' })
        return
      }
    }

    const { title, organizer, category, description, detail, coverImage, regStart, regEnd, submitStart, submitEnd, reviewStart, reviewEnd, finalTime, finalLocation, resultTime, allowFormats, maxFileSize, allowIndividual, teamMin, teamMax, requireAdvisor, reviewMode } = req.body
    const now = nowLocal()
    let newStatus = comp.status
    if (comp.status === 'published' && now >= regStart && now <= regEnd) newStatus = 'registering'
    else if (comp.status === 'registering' && now > regEnd) newStatus = 'published'
    else if (comp.status === 'registering' && now >= reviewStart && now <= reviewEnd) newStatus = 'reviewing'

    const updated = await prisma.competition.update({
      where: { competitionId: req.params.id as string },
      data: {
        title, organizer, category, description, detail, coverImage,
        regStart, regEnd, submitStart, submitEnd, reviewStart, reviewEnd,
        finalTime, finalLocation, resultTime,
        allowFormats, maxFileSize, allowIndividual, teamMin, teamMax, requireAdvisor, reviewMode,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/competitions/:id/submit — 提交审核
router.patch('/:id/submit', auth, requireRole('admin', 'teacher'), async (req: Request, res: Response) => {
  try {
    const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id as string } })
    if (!comp) {
      res.status(404).json({ message: '竞赛不存在' })
      return
    }
    if (req.user!.role === 'teacher' && comp.creatorId !== req.user!.userId) {
      res.status(403).json({ message: '只能提交自己创建的竞赛' })
      return
    }
    const updated = await prisma.competition.update({
      where: { competitionId: req.params.id as string },
      data: { status: 'pending', updatedAt: new Date().toISOString() },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/competitions/:id/approve — 审核通过
router.patch('/:id/approve', auth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const now = nowLocal()
    const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id as string } })
    if (!comp) {
      res.status(404).json({ message: '竞赛不存在' })
      return
    }
    if (comp.status !== 'pending') {
      res.status(400).json({ message: '只有待审核竞赛可以审核通过' })
      return
    }

    let newStatus = 'published'
    if (now >= comp.regStart && now <= comp.regEnd) newStatus = 'registering'
    else if (now >= comp.reviewStart && now <= comp.reviewEnd) newStatus = 'reviewing'

    const updated = await prisma.competition.update({
      where: { competitionId: req.params.id as string },
      data: { status: newStatus, auditComment: null, updatedAt: now },
    })

    await prisma.notification.create({
      data: {
        notificationId: uuidv4(),
        userId: comp.creatorId,
        title: '竞赛审核通过',
        content: `你创建的"${comp.title}"已通过审核，现已发布。`,
        read: false,
        createdAt: now,
      },
    }).catch(() => null)

    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/competitions/:id/reject — 审核驳回
router.patch('/:id/reject', auth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { comment } = req.body
    const now = new Date().toISOString()
    const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id as string } })
    if (!comp) {
      res.status(404).json({ message: '竞赛不存在' })
      return
    }

    const updated = await prisma.competition.update({
      where: { competitionId: req.params.id as string },
      data: { status: 'draft', auditComment: comment || '', updatedAt: now },
    })

    await prisma.notification.create({
      data: {
        notificationId: uuidv4(),
        userId: comp.creatorId,
        title: '竞赛审核驳回',
        content: `你创建的"${comp.title}"已被驳回。理由：${comment || '未填写'}`,
        read: false,
        createdAt: now,
      },
    }).catch(() => null)

    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/competitions/:id/cancel — 下架/取消
router.patch('/:id/cancel', auth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const updated = await prisma.competition.update({
      where: { competitionId: req.params.id as string },
      data: { status: 'cancelled', updatedAt: new Date().toISOString() },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/competitions/:id/status — 手动设置状态
router.patch('/:id/status', auth, requireRole('admin', 'teacher'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id as string } })
    if (!comp) {
      res.status(404).json({ message: '竞赛不存在' })
      return
    }
    if (req.user!.role === 'teacher' && comp.creatorId !== req.user!.userId) {
      res.status(403).json({ message: '权限不足' })
      return
    }
    const updated = await prisma.competition.update({
      where: { competitionId: req.params.id as string },
      data: { status, updatedAt: new Date().toISOString() },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/competitions/:id
router.delete('/:id', auth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await prisma.competition.delete({ where: { competitionId: req.params.id as string } })
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

export default router
