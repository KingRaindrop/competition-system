import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// GET /api/awards/:competitionId
router.get('/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    const awards = await prisma.award.findMany({
      where: { competitionId: req.params.competitionId as string },
    })
    res.json(awards)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/awards/:competitionId — 批量保存奖项
router.put('/:competitionId', auth, async (req: Request, res: Response) => {
  try {
    if (!await ownsCompetition(req.params.competitionId as string, req.user!.userId, req.user!.role)) {
      res.status(403).json({ message: '无权操作该竞赛' })
      return
    }
    const { awards } = req.body
    await prisma.award.deleteMany({ where: { competitionId: req.params.competitionId as string } })
    for (const item of awards) {
      await prisma.award.create({
        data: {
          awardId: uuidv4(),
          competitionId: req.params.competitionId as string,
          name: item.name,
          quota: item.quota,
          registrationId: item.registrationId || null,
        },
      })
    }
    const result = await prisma.award.findMany({
      where: { competitionId: req.params.competitionId as string },
    })
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/awards/:awardId/assign — 分配奖项给报名
router.patch('/:awardId/assign', auth, async (req: Request, res: Response) => {
  try {
    const { registrationId } = req.body
    const updated = await prisma.award.update({
      where: { awardId: req.params.awardId as string },
      data: { registrationId: registrationId || null },
    })
    res.json(updated)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/awards/competition/:competitionId/results — 获取竞赛结果（公开）
router.get('/competition/:competitionId/results', async (req: Request, res: Response) => {
  try {
    const awards = await prisma.award.findMany({
      where: { competitionId: req.params.competitionId as string },
    })

    const results = []
    for (const award of awards) {
      let registration = null
      if (award.registrationId) {
        registration = await prisma.registration.findUnique({
          where: { registrationId: award.registrationId },
          include: { team: true, student: true },
        })
      }
      results.push({
        ...award,
        registration: registration
          ? {
              registrationId: registration.registrationId,
              workTitle: registration.workTitle,
              teamName: registration.team?.name || null,
              studentName: registration.student?.name || null,
            }
          : null,
      })
    }

    res.json(results)
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
