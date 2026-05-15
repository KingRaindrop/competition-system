import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { signToken, verifyToken } from '../lib/jwt.js';
import { auth } from '../middleware/auth.js';
const router = Router();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { userId, name, password, role, college, major, grade, email, phone } = req.body;
        if (!userId || !name || !password) {
            res.status(400).json({ message: '学号/工号、姓名、密码为必填项' });
            return;
        }
        const exists = await prisma.user.findUnique({ where: { userId } });
        if (exists) {
            res.status(400).json({ message: '该学号/工号已被注册' });
            return;
        }
        // 只有管理员可以创建管理员/教师账号，普通注册默认为学生
        let finalRole = 'student';
        if (role && (role === 'admin' || role === 'teacher')) {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (token) {
                try {
                    const payload = verifyToken(token);
                    if (payload.role === 'admin') {
                        finalRole = role;
                    }
                }
                catch { /* token无效则默认为student */ }
            }
        }
        const hash = bcrypt.hashSync(password, 10);
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
        });
        const tokenResult = signToken({ userId: user.userId, role: user.role });
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
                createdAt: user.createdAt.toISOString(),
            },
        });
    }
    catch (e) {
        res.status(500).json({ message: '注册失败: ' + e.message });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        if (!userId) {
            res.status(400).json({ message: '请输入学号/工号' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user || user.status === 0) {
            res.status(401).json({ message: '账号不存在或已停用' });
            return;
        }
        const validPassword = user.password && bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            res.status(401).json({ message: '密码错误' });
            return;
        }
        const token = signToken({ userId: user.userId, role: user.role });
        // 更新竞赛状态
        await refreshCompetitionStatuses();
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
                createdAt: user.createdAt.toISOString(),
            },
        });
    }
    catch (e) {
        res.status(500).json({ message: '登录失败: ' + e.message });
    }
});
// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { userId: req.user.userId } });
        if (!user) {
            res.status(404).json({ message: '用户不存在' });
            return;
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
            createdAt: user.createdAt.toISOString(),
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { email, phone, college, major, grade } = req.body;
        const user = await prisma.user.update({
            where: { userId: req.user.userId },
            data: { email, phone, college, major, grade },
        });
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
            createdAt: user.createdAt.toISOString(),
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
async function refreshCompetitionStatuses() {
    const now = new Date().toISOString();
    const comps = await prisma.competition.findMany();
    for (const c of comps) {
        let newStatus = c.status;
        if (c.status === 'published' && now >= c.regStart && now <= c.regEnd)
            newStatus = 'registering';
        else if ((c.status === 'published' || c.status === 'registering') && now >= c.reviewStart && now <= c.reviewEnd)
            newStatus = 'reviewing';
        else if (c.status === 'reviewing' && now > c.reviewEnd && now < c.resultTime)
            newStatus = 'final';
        else if (c.status === 'final' && now >= c.resultTime)
            newStatus = 'ended';
        if (newStatus !== c.status) {
            await prisma.competition.update({
                where: { competitionId: c.competitionId },
                data: { status: newStatus, updatedAt: new Date().toISOString() },
            });
        }
    }
}
export default router;
//# sourceMappingURL=auth.js.map