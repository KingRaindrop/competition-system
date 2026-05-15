import { verifyToken } from '../lib/jwt.js';
export function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ message: '未登录' });
        return;
    }
    try {
        req.user = verifyToken(header.slice(7));
        next();
    }
    catch {
        res.status(401).json({ message: '登录已过期，请重新登录' });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: '未登录' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: '权限不足' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map