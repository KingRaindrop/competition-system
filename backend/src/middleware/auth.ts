import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../lib/jwt.js'
import prisma from '../lib/prisma.js'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: '未登录' })
    return
  }
  try {
    const payload = verifyToken(header.slice(7))
    req.user = payload
    // 从数据库获取最新角色，确保提权后立即生效
    prisma.user.findUnique({ where: { userId: payload.userId } }).then(user => {
      if (user && user.status === 1 && !user.banned) {
        req.user!.role = user.role
      }
      next()
    }).catch(() => next())
  } catch {
    res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: '未登录' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: '权限不足' })
      return
    }
    next()
  }
}
