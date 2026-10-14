import { Router } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../prisma.js'
import { requireAuth, signToken, type AuthedRequest, type Role } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body as {
    name?: string
    email?: string
    password?: string
    role?: string
  }

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const allowedRoles = ['STUDENT', 'FACULTY'] as const
  const nextRole = allowedRoles.includes(role as (typeof allowedRoles)[number])
    ? (role as (typeof allowedRoles)[number])
    : 'STUDENT'

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: nextRole,
    },
  })

  const token = signToken({
    userId: user.id,
    role: user.role as Role,
    email: user.email,
    name: user.name,
  })

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken({
    userId: user.id,
    role: user.role as Role,
    email: user.email,
    name: user.name,
  })

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

router.get('/me', requireAuth, async (req, res) => {
  const { userId } = (req as AuthedRequest).user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({ user })
})

export default router
