import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/catalog', requireRole('STUDENT', 'ADMIN'), async (_req, res) => {
  const courses = await prisma.course.findMany({
    include: {
      faculty: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
  })
  res.json({ courses })
})

router.get('/faculty-options', requireRole('ADMIN'), async (_req, res) => {
  const faculty = await prisma.user.findMany({
    where: { role: { in: ['FACULTY', 'ADMIN'] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  })
  res.json({ faculty })
})

router.get('/students', requireRole('ADMIN'), async (_req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
  res.json({ students })
})

router.get('/', async (req, res) => {
  const { userId, role } = (req as AuthedRequest).user

  if (role === 'STUDENT') {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          include: {
            faculty: { select: { id: true, name: true, email: true } },
            _count: { select: { enrollments: true, feedback: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const feedback = await prisma.feedback.findMany({
      where: { studentId: userId },
      select: { courseId: true },
    })
    const submitted = new Set(feedback.map((item) => item.courseId))

    return res.json({
      courses: enrollments.map((enrollment) => ({
        ...enrollment.course,
        submittedFeedback: submitted.has(enrollment.courseId),
      })),
    })
  }

  if (role === 'FACULTY') {
    const courses = await prisma.course.findMany({
      where: { facultyId: userId },
      include: {
        faculty: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true, feedback: true } },
      },
      orderBy: { code: 'asc' },
    })
    return res.json({ courses })
  }

  const courses = await prisma.course.findMany({
    include: {
      faculty: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true, feedback: true } },
    },
    orderBy: { code: 'asc' },
  })
  res.json({ courses })
})

router.post('/', requireRole('ADMIN', 'FACULTY'), async (req, res) => {
  const actor = (req as AuthedRequest).user
  const { code, name, description, facultyId } = req.body as {
    code?: string
    name?: string
    description?: string
    facultyId?: string
  }

  if (!code?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'Course code and name are required' })
  }

  const assignedFacultyId = actor.role === 'ADMIN' ? facultyId ?? actor.userId : actor.userId

  const faculty = await prisma.user.findUnique({ where: { id: assignedFacultyId } })
  if (!faculty || (faculty.role !== 'FACULTY' && faculty.role !== 'ADMIN')) {
    return res.status(400).json({ error: 'Assigned faculty account was not found' })
  }

  try {
    const course = await prisma.course.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() ?? '',
        facultyId: assignedFacultyId,
      },
      include: { faculty: { select: { id: true, name: true, email: true } } },
    })
    res.status(201).json({ course })
  } catch {
    res.status(409).json({ error: 'A course with this code already exists' })
  }
})

router.post('/:id/enroll', async (req, res) => {
  const actor = (req as AuthedRequest).user
  const courseId = req.params.id
  const { studentId } = req.body as { studentId?: string }

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) {
    return res.status(404).json({ error: 'Course not found' })
  }

  let targetStudentId = actor.userId
  if (actor.role === 'ADMIN') {
    targetStudentId = studentId ?? actor.userId
  } else if (actor.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Only students or admins can enroll in courses' })
  }

  const student = await prisma.user.findUnique({ where: { id: targetStudentId } })
  if (!student || student.role !== 'STUDENT') {
    return res.status(400).json({ error: 'Enrollment target must be a student account' })
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId: targetStudentId, courseId },
    })
    res.status(201).json({ enrollment })
  } catch {
    res.status(409).json({ error: 'Student is already enrolled in this course' })
  }
})

export default router
