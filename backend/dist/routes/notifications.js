import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { auth } from '../middleware/auth.js';
const router = Router();
// GET /api/notifications
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notifications);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// GET /api/notifications/unread-count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: { userId: req.user.userId, read: false },
        });
        res.json({ count });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        await prisma.notification.update({
            where: { notificationId: req.params.id },
            data: { read: true },
        });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// PATCH /api/notifications/read-all
router.patch('/read-all', auth, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.userId },
            data: { read: true },
        });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
export default router;
//# sourceMappingURL=notifications.js.map