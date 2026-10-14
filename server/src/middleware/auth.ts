import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-student-feedback-secret-change-me'

export type AuthPayload = {
  userId: string
  role: Role
  email: string
  name: string
}

export type AuthedRequest = Request & { user: AuthPayload }

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    return res.status(401).json({ error: 'Sign in required' })
  }

  try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
        decoded.role = decoded.role as Role
    ;(req as AuthedRequest).user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).user
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this action' })
    }
    next()
  }
}
