import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// ==================== 评分标准 ====================

// GET /api/reviews/rubrics/:competitionId
router.get('/rubrics/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    const rubrics = await prisma.scoringRubric.findMany({
      where: { competitionId: req.params.competitionId as string },
      orderBy: { sortOrder: 'asc' },
    })
    res.json(rubrics)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/reviews/rubrics/:competitionId — 批量保存评分标准
router.put('/rubrics/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    if (!await ownsCompetition(req.params.competitionId as string, req.user!.userId, req.user!.role)) {
      res.status(403).json({ message: '无权操作该竞赛' })
      return
    }
    const { rubrics } = req.body
    // 删除旧的
    await prisma.scoringRubric.deleteMany({ where: { competitionId: req.params.competitionId as string } })
    // 创建新的
    for (let i = 0; i < rubrics.length; i++) {
      await prisma.scoringRubric.create({
        data: {
          rubricId: uuidv4(),
          competitionId: req.params.competitionId as string,
          name: rubrics[i].name,
          maxScore: rubrics[i].maxScore,
          weight: rubrics[i].weight,
          sortOrder: i + 1,
        },
      })
    }
    const result = await prisma.scoringRubric.findMany({
      where: { competitionId: req.params.competitionId as string },
      orderBy: { sortOrder: 'asc' },
    })
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// ==================== 评委指派 ====================

// GET /api/reviews/reviewers/:competitionId
router.get('/reviewers/:competitionId', async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.reviewerAssignment.findMany({
      where: { competitionId: req.params.competitionId as string },
    })
    res.json(assignments)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/reviews/reviewers/:competitionId — 批量指派评委
router.put('/reviewers/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    if (!await ownsCompetition(req.params.competitionId as string, req.user!.userId, req.user!.role)) {
      res.status(403).json({ message: '无权操作该竞赛' })
      return
    }
    const { teacherIds } = req.body
    const now = new Date().toISOString()
    // 删除旧指派
    await prisma.reviewerAssignment.deleteMany({ where: { competitionId: req.params.competitionId as string } })
    // 创建新指派
    for (const tid of teacherIds) {
      await prisma.reviewerAssignment.create({
        data: {
          id: uuidv4(),
          competitionId: req.params.competitionId as string,
          teacherId: tid,
          assignedAt: now,
        },
      })
      // 发送通知
      const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.competitionId as string } })
      await prisma.notification.create({
        data: {
          notificationId: uuidv4(),
          userId: tid,
          title: '评审邀请',
          content: `你已被指派为"${comp?.title}"评委，请按时完成评审。`,
          read: false,
          createdAt: now,
        },
      })
    }
    const result = await prisma.reviewerAssignment.findMany({
      where: { competitionId: req.params.competitionId as string },
    })
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/reviews/my-assignments — 我的评审任务
router.get('/my-assignments', auth, async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.reviewerAssignment.findMany({
      where: { teacherId: req.user!.userId },
      include: { competition: true },
    })
    res.json(assignments)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// ==================== 评分 ====================

// GET /api/reviews/scores/:registrationId
router.get('/scores/:registrationId', auth, async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { registrationId: req.params.registrationId as string },
      include: { details: true },
    })
    res.json(reviews)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/reviews/my-score/:registrationId
router.get('/my-score/:registrationId', auth, async (req: Request, res: Response) => {
  try {
    const review = await prisma.review.findFirst({
      where: {
        registrationId: req.params.registrationId as string,
        reviewerId: req.user!.userId,
      },
      include: { details: true },
    })
    res.json(review || null)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/reviews/scores — 保存/提交评分
router.post('/scores', auth, async (req: Request, res: Response) => {
  try {
    const { registrationId, scores, comment, submit } = req.body

    // 查找或创建 review
    let review = await prisma.review.findFirst({
      where: {
        registrationId,
        reviewerId: req.user!.userId,
      },
    })

    if (!review) {
      review = await prisma.review.create({
        data: {
          reviewId: uuidv4(),
          registrationId,
          reviewerId: req.user!.userId,
          status: 'draft',
        },
      })
    }

    // 清除旧明细
    await prisma.reviewDetail.deleteMany({ where: { reviewId: review.reviewId } })

    // 获取评分标准并计算总分
    const reg = await prisma.registration.findUnique({ where: { registrationId } })
    const compRubrics = await prisma.scoringRubric.findMany({
      where: { competitionId: reg?.competitionId || '' },
    })

    let total = 0
    for (const s of scores) {
      const rubric = compRubrics.find(r => r.rubricId === s.rubricId)
      if (rubric) total += s.score * rubric.weight

      await prisma.reviewDetail.create({
        data: {
          id: uuidv4(),
          reviewId: review.reviewId,
          rubricId: s.rubricId,
          score: s.score,
        },
      })
    }

    const now = new Date().toISOString()
    const updated = await prisma.review.update({
      where: { reviewId: review.reviewId },
      data: {
        totalScore: Math.round(total * 100) / 100,
        comment: comment || null,
        status: submit ? 'submitted' : 'draft',
        submittedAt: submit ? now : null,
      },
      include: { details: true },
    })

    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/reviews/progress/:competitionId — 评审进度
router.get('/progress/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    const competitionId = req.params.competitionId as string
    const reviewers = await prisma.reviewerAssignment.findMany({ where: { competitionId } })
    const regs = await prisma.registration.findMany({
      where: { competitionId, status: 'submitted' },
    })

    const progress = []
    for (const r of reviewers) {
      const done = await prisma.review.count({
        where: {
          reviewerId: r.teacherId,
          registration: { competitionId },
          status: 'submitted',
        },
      })
      progress.push({
        teacherId: r.teacherId,
        done,
        total: regs.length,
      })
    }

    res.json(progress)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/reviews/average/:registrationId — 平均分
router.get('/average/:registrationId', auth, async (req: Request, res: Response) => {
  try {
    const revs = await prisma.review.findMany({
      where: {
        registrationId: req.params.registrationId as string,
        status: 'submitted',
      },
    })
    const avg = revs.length > 0
      ? revs.reduce((sum, r) => sum + (r.totalScore || 0), 0) / revs.length
      : 0
    res.json({ averageScore: Math.round(avg * 100) / 100, count: revs.length })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function ownsCompetition(competitionId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return true
  const comp = await prisma.competition.findUnique({ where: { competitionId } })
  if (!comp) return false
  return comp.creatorId === userId
}

export default router
