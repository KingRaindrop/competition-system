import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { auth, requireRole } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// GET /api/competitions
router.get('/', async (req, res) => {
    try {
        const { status, category, keyword, creatorId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        if (creatorId)
            where.creatorId = creatorId;
        if (keyword) {
            where.OR = [
                { title: { contains: keyword } },
                { organizer: { contains: keyword } },
            ];
        }
        const competitions = await prisma.competition.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });
        res.json(competitions);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/competitions/published — 公开已发布的竞赛
router.get('/published', async (_req, res) => {
    try {
        const competitions = await prisma.competition.findMany({
            where: { status: { in: ['published', 'registering', 'reviewing', 'final'] } },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(competitions);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/competitions/:id
router.get('/:id', async (req, res) => {
    try {
        const competition = await prisma.competition.findUnique({
            where: { competitionId: req.params.id },
        });
        if (!competition) {
            res.status(404).json({ message: '竞赛不存在' });
            return;
        }
        res.json(competition);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// POST /api/competitions
router.post('/', auth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const now = new Date().toISOString();
        const comp = await prisma.competition.create({
            data: {
                competitionId: uuidv4(),
                ...req.body,
                creatorId: req.user.userId,
                status: 'draft',
                allowIndividual: req.body.allowIndividual ?? false,
                requireAdvisor: req.body.requireAdvisor ?? false,
                reviewMode: req.body.reviewMode ?? 'open',
                maxFileSize: req.body.maxFileSize ?? 100,
                allowFormats: req.body.allowFormats ?? 'zip,rar,pdf,ppt,mp4',
                createdAt: now,
                updatedAt: now,
            },
        });
        res.status(201).json(comp);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PUT /api/competitions/:id
router.put('/:id', auth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id } });
        if (!comp) {
            res.status(404).json({ message: '竞赛不存在' });
            return;
        }
        // 教师只能编辑自己的竞赛且状态为草稿或已驳回
        if (req.user.role === 'teacher') {
            if (comp.creatorId !== req.user.userId) {
                res.status(403).json({ message: '只能编辑自己创建的竞赛' });
                return;
            }
            if (!['draft', 'pending'].includes(comp.status)) {
                res.status(400).json({ message: '当前状态不允许编辑' });
                return;
            }
        }
        const { competitionId, creatorId, createdAt, ...updateData } = req.body;
        const updated = await prisma.competition.update({
            where: { competitionId: req.params.id },
            data: { ...updateData, updatedAt: new Date().toISOString() },
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/competitions/:id/submit — 提交审核
router.patch('/:id/submit', auth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id } });
        if (!comp) {
            res.status(404).json({ message: '竞赛不存在' });
            return;
        }
        if (req.user.role === 'teacher' && comp.creatorId !== req.user.userId) {
            res.status(403).json({ message: '只能提交自己创建的竞赛' });
            return;
        }
        const updated = await prisma.competition.update({
            where: { competitionId: req.params.id },
            data: { status: 'pending', updatedAt: new Date().toISOString() },
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/competitions/:id/approve — 审核通过
router.patch('/:id/approve', auth, requireRole('admin'), async (req, res) => {
    try {
        const now = new Date().toISOString();
        const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id } });
        if (!comp) {
            res.status(404).json({ message: '竞赛不存在' });
            return;
        }
        if (comp.status !== 'pending') {
            res.status(400).json({ message: '只有待审核竞赛可以审核通过' });
            return;
        }
        let newStatus = 'published';
        if (now >= comp.regStart && now <= comp.regEnd)
            newStatus = 'registering';
        else if (now >= comp.reviewStart && now <= comp.reviewEnd)
            newStatus = 'reviewing';
        const updated = await prisma.competition.update({
            where: { competitionId: req.params.id },
            data: { status: newStatus, auditComment: null, updatedAt: now },
        });
        await prisma.notification.create({
            data: {
                notificationId: uuidv4(),
                userId: comp.creatorId,
                title: '竞赛审核通过',
                content: `你创建的"${comp.title}"已通过审核，现已发布。`,
                read: false,
                createdAt: now,
            },
        }).catch(() => null);
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/competitions/:id/reject — 审核驳回
router.patch('/:id/reject', auth, requireRole('admin'), async (req, res) => {
    try {
        const { comment } = req.body;
        const now = new Date().toISOString();
        const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id } });
        if (!comp) {
            res.status(404).json({ message: '竞赛不存在' });
            return;
        }
        const updated = await prisma.competition.update({
            where: { competitionId: req.params.id },
            data: { status: 'draft', auditComment: comment || '', updatedAt: now },
        });
        await prisma.notification.create({
            data: {
                notificationId: uuidv4(),
                userId: comp.creatorId,
                title: '竞赛审核驳回',
                content: `你创建的"${comp.title}"已被驳回。理由：${comment || '未填写'}`,
                read: false,
                createdAt: now,
            },
        }).catch(() => null);
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/competitions/:id/cancel — 下架/取消
router.patch('/:id/cancel', auth, requireRole('admin'), async (req, res) => {
    try {
        const updated = await prisma.competition.update({
            where: { competitionId: req.params.id },
            data: { status: 'cancelled', updatedAt: new Date().toISOString() },
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/competitions/:id/status — 手动设置状态
router.patch('/:id/status', auth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const { status } = req.body;
        const comp = await prisma.competition.findUnique({ where: { competitionId: req.params.id } });
        if (!comp) {
            res.status(404).json({ message: '竞赛不存在' });
            return;
        }
        if (req.user.role === 'teacher' && comp.creatorId !== req.user.userId) {
            res.status(403).json({ message: '权限不足' });
            return;
        }
        const updated = await prisma.competition.update({
            where: { competitionId: req.params.id },
            data: { status, updatedAt: new Date().toISOString() },
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// DELETE /api/competitions/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
    try {
        await prisma.competition.delete({ where: { competitionId: req.params.id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
export default router;
//# sourceMappingURL=competitions.js.map