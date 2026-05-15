import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { auth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// GET /api/registrations — 根据查询参数返回报名
router.get('/', auth, async (req, res) => {
    try {
        const { competitionId, studentId } = req.query;
        const where = {};
        if (competitionId)
            where.competitionId = competitionId;
        if (studentId) {
            // 学生可能在团队中
            const teams = await prisma.teamMember.findMany({
                where: { studentId: studentId, status: 'accepted' },
            });
            const teamIds = teams.map(t => t.teamId);
            where.OR = [
                { studentId: studentId },
                ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
            ];
        }
        const registrations = await prisma.registration.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        res.json(registrations);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/registrations/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const reg = await prisma.registration.findUnique({
            where: { registrationId: req.params.id },
        });
        if (!reg) {
            res.status(404).json({ message: '报名不存在' });
            return;
        }
        res.json(reg);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// POST /api/registrations
router.post('/', auth, async (req, res) => {
    try {
        const { competitionId, teamId, workTitle, advisorId, notes } = req.body;
        if (!competitionId || !workTitle) {
            res.status(400).json({ message: '缺少必填字段' });
            return;
        }
        // 检查竞赛是否存在且可以报名
        const comp = await prisma.competition.findUnique({ where: { competitionId } });
        if (!comp) {
            res.status(404).json({ message: '竞赛不存在' });
            return;
        }
        const now = new Date().toISOString();
        if (comp.status !== 'registering' && comp.status !== 'published') {
            res.status(400).json({ message: '当前竞赛状态不允许报名' });
            return;
        }
        if (now < comp.regStart || now > comp.regEnd) {
            res.status(400).json({ message: '不在报名时间范围内' });
            return;
        }
        // 检查是否已报名
        const alreadyReg = await checkAlreadyRegistered(competitionId, req.user.userId, teamId);
        if (alreadyReg) {
            res.status(400).json({ message: '你已报名该竞赛' });
            return;
        }
        const reg = await prisma.registration.create({
            data: {
                registrationId: uuidv4(),
                competitionId,
                teamId: teamId || null,
                studentId: teamId ? null : req.user.userId,
                workTitle,
                advisorId: advisorId || null,
                notes: notes || null,
                status: 'registered',
                createdAt: now,
            },
        });
        // 发送通知
        await prisma.notification.create({
            data: {
                notificationId: uuidv4(),
                userId: req.user.userId,
                title: '报名成功',
                content: `你已成功报名"${comp.title}"，请按时提交作品。`,
                read: false,
                createdAt: now,
            },
        }).catch(() => null);
        res.status(201).json(reg);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PUT /api/registrations/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const reg = await prisma.registration.findUnique({ where: { registrationId: req.params.id } });
        if (!reg) {
            res.status(404).json({ message: '报名不存在' });
            return;
        }
        // 检查报名截止时间
        const comp = await prisma.competition.findUnique({ where: { competitionId: reg.competitionId } });
        if (comp) {
            const now = new Date().toISOString();
            if (now > comp.regEnd) {
                res.status(400).json({ message: '报名已截止，无法修改' });
                return;
            }
        }
        const { workTitle, advisorId, notes, teamId } = req.body;
        const updated = await prisma.registration.update({
            where: { registrationId: req.params.id },
            data: { workTitle, advisorId, notes, teamId },
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/registrations/:id/status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await prisma.registration.update({
            where: { registrationId: req.params.id },
            data: { status },
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/registrations/:id/finalist — 设置/取消决赛资格
router.patch('/:id/finalist', auth, async (req, res) => {
    try {
        const { isFinalist } = req.body;
        const updated = await prisma.registration.update({
            where: { registrationId: req.params.id },
            data: { isFinalist, status: isFinalist ? 'qualified' : undefined },
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// DELETE /api/registrations/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const reg = await prisma.registration.findUnique({ where: { registrationId: req.params.id } });
        if (!reg) {
            res.status(404).json({ message: '报名不存在' });
            return;
        }
        const comp = await prisma.competition.findUnique({ where: { competitionId: reg.competitionId } });
        if (comp) {
            const now = new Date().toISOString();
            if (now > comp.regEnd) {
                res.status(400).json({ message: '报名已截止，无法取消' });
                return;
            }
        }
        await prisma.registration.delete({ where: { registrationId: req.params.id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/registrations/check/:competitionId — 检查是否已报名
router.get('/check/:competitionId', auth, async (req, res) => {
    try {
        const registered = await checkAlreadyRegistered(req.params.competitionId, req.user.userId);
        res.json({ registered });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
async function checkAlreadyRegistered(competitionId, userId, teamId) {
    const regs = await prisma.registration.findMany({ where: { competitionId } });
    for (const r of regs) {
        if (r.studentId === userId)
            return true;
        if (r.teamId) {
            const member = await prisma.teamMember.findFirst({
                where: { teamId: r.teamId, studentId: userId, status: 'accepted' },
            });
            if (member)
                return true;
        }
    }
    return false;
}
export default router;
//# sourceMappingURL=registrations.js.map