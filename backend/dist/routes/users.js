import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { auth, requireRole } from '../middleware/auth.js';
const router = Router();
// GET /api/users
router.get('/', auth, requireRole('admin'), async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(users.map(formatUser));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/users/teachers — 获取所有教师列表（用于指派评委）
router.get('/teachers', auth, requireRole('admin', 'teacher'), async (_req, res) => {
    try {
        const teachers = await prisma.user.findMany({
            where: { role: 'teacher', status: 1 },
        });
        res.json(teachers.map(formatUser));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/users/students — 搜索学生
router.get('/students', auth, async (req, res) => {
    try {
        const { q } = req.query;
        const students = await prisma.user.findMany({
            where: {
                role: 'student',
                status: 1,
                ...(q ? {
                    OR: [
                        { userId: { contains: q } },
                        { name: { contains: q } },
                    ],
                } : {}),
            },
        });
        res.json(students.map(formatUser));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// POST /api/users
router.post('/', auth, requireRole('admin'), async (req, res) => {
    try {
        const { userId, name, role, college, major, grade, email, phone, password: reqPassword } = req.body;
        if (!userId || !name || !role) {
            res.status(400).json({ message: '缺少必填字段' });
            return;
        }
        const exists = await prisma.user.findUnique({ where: { userId } });
        if (exists) {
            res.status(400).json({ message: '该学号/工号已存在' });
            return;
        }
        const password = reqPassword ? bcrypt.hashSync(reqPassword, 10) : bcrypt.hashSync('123456', 10);
        const user = await prisma.user.create({
            data: { userId, name, role, password, college: college || '', major, grade, email, phone },
        });
        res.status(201).json(formatUser(user));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PUT /api/users/:id
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
    try {
        const { name, role, college, major, grade, email, phone, password: reqPassword } = req.body;
        const updateData = { name, role, college, major, grade, email, phone };
        if (reqPassword) {
            updateData.password = bcrypt.hashSync(reqPassword, 10);
        }
        const user = await prisma.user.update({
            where: { userId: req.params.id },
            data: updateData,
        });
        res.json(formatUser(user));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/users/:id/status
router.patch('/:id/status', auth, requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const user = await prisma.user.update({
            where: { userId: req.params.id },
            data: { status },
        });
        res.json(formatUser(user));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// DELETE /api/users/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        if (req.user.userId === userId) {
            res.status(400).json({ message: '不能删除当前登录用户' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) {
            res.status(404).json({ message: '用户不存在' });
            return;
        }
        await prisma.$transaction(async (tx) => {
            const captainTeams = await tx.team.findMany({
                where: { captainId: userId },
                select: { teamId: true },
            });
            const captainTeamIds = captainTeams.map(t => t.teamId);
            const registrationFilters = [{ studentId: userId }];
            if (captainTeamIds.length > 0)
                registrationFilters.push({ teamId: { in: captainTeamIds } });
            const registrations = await tx.registration.findMany({
                where: { OR: registrationFilters },
                select: { registrationId: true },
            });
            const registrationIds = registrations.map(r => r.registrationId);
            if (registrationIds.length > 0) {
                await tx.award.updateMany({
                    where: { registrationId: { in: registrationIds } },
                    data: { registrationId: null },
                });
                await tx.registration.deleteMany({ where: { registrationId: { in: registrationIds } } });
            }
            await tx.registration.updateMany({
                where: { advisorId: userId },
                data: { advisorId: null },
            });
            await tx.review.deleteMany({ where: { reviewerId: userId } });
            await tx.reviewerAssignment.deleteMany({ where: { teacherId: userId } });
            await tx.teamMember.deleteMany({ where: { studentId: userId } });
            if (captainTeamIds.length > 0) {
                await tx.team.deleteMany({ where: { teamId: { in: captainTeamIds } } });
            }
            await tx.notification.deleteMany({ where: { userId } });
            await tx.competition.deleteMany({ where: { creatorId: userId } });
            await tx.user.delete({ where: { userId } });
        });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/system/config
router.get('/system/config', async (_req, res) => {
    try {
        let config = await prisma.systemConfig.findFirst();
        if (!config) {
            config = await prisma.systemConfig.create({ data: { id: 'main', colleges: '[]', categories: '[]' } });
        }
        res.json({
            colleges: JSON.parse(config.colleges),
            categories: JSON.parse(config.categories),
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PUT /api/system/config
router.put('/system/config', auth, requireRole('admin'), async (req, res) => {
    try {
        const { colleges, categories } = req.body;
        const config = await prisma.systemConfig.upsert({
            where: { id: 'main' },
            update: {
                colleges: JSON.stringify(colleges || []),
                categories: JSON.stringify(categories || []),
            },
            create: {
                id: 'main',
                colleges: JSON.stringify(colleges || []),
                categories: JSON.stringify(categories || []),
            },
        });
        res.json({
            colleges: JSON.parse(config.colleges),
            categories: JSON.parse(config.categories),
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
function formatUser(u) {
    return {
        userId: u.userId,
        name: u.name,
        role: u.role,
        college: u.college,
        major: u.major,
        grade: u.grade,
        email: u.email,
        phone: u.phone,
        status: u.status,
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    };
}
export default router;
//# sourceMappingURL=users.js.map