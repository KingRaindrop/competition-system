import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import { config } from '../config.js'

export interface TokenPayload {
  userId: string
  role: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret as Secret, { expiresIn: config.jwtExpiresIn } as SignOptions)
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret as Secret) as TokenPayload
}
