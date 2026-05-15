import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'

const router = Router()

async function canAccessRegistration(registrationId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return true

  const reg = await prisma.registration.findUnique({
    where: { registrationId },
    include: { competition: true },
  })
  if (!reg) return false
  if (role === 'teacher') {
    if (reg.competition.creatorId === userId) return true
    // 评委也可以访问
    const assignment = await prisma.reviewerAssignment.findFirst({
      where: { competitionId: reg.competitionId, teacherId: userId },
    })
    return !!assignment
  }
  if (reg.studentId === userId) return true
  if (!reg.teamId) return false

  const member = await prisma.teamMember.findFirst({
    where: { teamId: reg.teamId, studentId: userId, status: 'accepted' },
  })
  return !!member
}

function deleteUploadedFiles(files: Express.Multer.File[] | undefined) {
  files?.forEach(file => {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
  })
}

// GET /api/files/:registrationId — 获取报名下的文件列表
router.get('/:registrationId', auth, async (req: Request, res: Response) => {
  try {
    const registrationId = req.params.registrationId as string
    const allowed = await canAccessRegistration(registrationId, req.user!.userId, req.user!.role)
    if (!allowed) {
      res.status(403).json({ message: '无权查看该报名文件' })
      return
    }

    const files = await prisma.workFile.findMany({
      where: { registrationId },
      orderBy: { uploadedAt: 'desc' },
    })
    res.json(files)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/files/:registrationId — 上传文件
router.post('/:registrationId', auth, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const registrationId = req.params.registrationId as string
    const reg = await prisma.registration.findUnique({
      where: { registrationId },
    })
    if (!reg) {
      deleteUploadedFiles(req.files as Express.Multer.File[] | undefined)
      res.status(404).json({ message: '报名不存在' })
      return
    }

    const allowed = await canAccessRegistration(registrationId, req.user!.userId, req.user!.role)
    if (!allowed) {
      deleteUploadedFiles(req.files as Express.Multer.File[] | undefined)
      res.status(403).json({ message: '无权上传该报名文件' })
      return
    }

    // 检查竞赛文件格式和大小限制
    const comp = await prisma.competition.findUnique({
      where: { competitionId: reg.competitionId },
    })
    if (!comp) {
      deleteUploadedFiles(req.files as Express.Multer.File[] | undefined)
      res.status(404).json({ message: '竞赛不存在' })
      return
    }

    const allowedFormats = comp.allowFormats.split(',').map(f => f.trim().toLowerCase())
    const maxSize = comp.maxFileSize * 1024 * 1024

    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      res.status(400).json({ message: '请选择文件' })
      return
    }

    if (reg.status === 'submitted') {
      deleteUploadedFiles(files)
      res.status(400).json({ message: '作品已提交，无法继续上传' })
      return
    }

    const now = new Date().toISOString()

    // 先校验所有文件，避免部分写入
    for (const file of files) {
      const ext = file.originalname.split('.').pop()?.toLowerCase() || ''
      if (!allowedFormats.includes(ext)) {
        deleteUploadedFiles(files)
        res.status(400).json({ message: `文件 "${file.originalname}" 的格式 .${ext} 不被允许，允许的格式：${comp.allowFormats}` })
        return
      }
      if (file.size > maxSize) {
        deleteUploadedFiles(files)
        res.status(400).json({ message: `文件 "${file.originalname}" 超过大小限制（${comp.maxFileSize}MB）` })
        return
      }
    }

    // 全部校验通过后再写入数据库
    const results = []
    for (const file of files) {
      const ext = file.originalname.split('.').pop()?.toLowerCase() || ''
      const workFile = await prisma.workFile.create({
        data: {
          fileId: uuidv4(),
          registrationId,
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: ext,
          uploadedAt: now,
        },
      })
      results.push(workFile)
    }

    res.status(201).json(results)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/files/delete/:fileId
router.delete('/delete/:fileId', auth, async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId as string
    const file = await prisma.workFile.findUnique({ where: { fileId } })
    if (!file) {
      res.status(404).json({ message: '文件不存在' })
      return
    }

    const allowed = await canAccessRegistration(file.registrationId, req.user!.userId, req.user!.role)
    if (!allowed) {
      res.status(403).json({ message: '无权删除该文件' })
      return
    }

    const reg = await prisma.registration.findUnique({ where: { registrationId: file.registrationId } })
    if (reg?.status === 'submitted') {
      res.status(400).json({ message: '作品已提交，无法删除文件' })
      return
    }

    // 删除磁盘文件
    const filePath = path.resolve(file.filePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await prisma.workFile.delete({ where: { fileId } })
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/files/download/:fileId — 下载文件
router.get('/download/:fileId', auth, async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId as string
    const file = await prisma.workFile.findUnique({ where: { fileId } })
    if (!file) {
      res.status(404).json({ message: '文件不存在' })
      return
    }
    const allowed = await canAccessRegistration(file.registrationId, req.user!.userId, req.user!.role)
    if (!allowed) {
      res.status(403).json({ message: '无权下载该文件' })
      return
    }

    const filePath = path.resolve(file.filePath)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: '文件已被删除' })
      return
    }

    // 图片和 PDF 浏览器内预览，其他类型强制下载
    const inlineTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf']
    if (inlineTypes.includes(file.fileType.toLowerCase())) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`)
      res.sendFile(filePath)
    } else {
      res.download(filePath, file.fileName)
    }
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

export default router
