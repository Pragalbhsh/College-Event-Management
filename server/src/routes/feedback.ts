import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function validateScores(rating?: number, teachingQuality?: number, contentQuality?: number) {
  const scores = [rating, teachingQuality, contentQuality]
  return scores.every((score) => typeof score === 'number' && score >= 1 && score <= 5)
}

router.get('/mine', requireRole('STUDENT'), async (req, res) => {
  const { userId } = (req as AuthedRequest).user
  const items = await prisma.feedback.findMany({
    where: { studentId: userId },
    include: {
      course: {
        include: { faculty: { select: { name: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
  res.json({ feedback: items })
})

router.post('/', requireRole('STUDENT'), async (req, res) => {
  const { userId } = (req as AuthedRequest).user
  const { courseId, rating, teachingQuality, contentQuality, comment, anonymous } = req.body as {
    courseId?: string
    rating?: number
    teachingQuality?: number
    contentQuality?: number
    comment?: string
    anonymous?: boolean
  }

  if (!courseId || !validateScores(rating, teachingQuality, contentQuality)) {
    return res.status(400).json({ error: 'Course and scores from 1 to 5 are required' })
  }

  const enrolled = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId } },
  })
  if (!enrolled) {
    return res.status(403).json({ error: 'You can only submit feedback for courses you are enrolled in' })
  }

  const feedback = await prisma.feedback.upsert({
    where: { studentId_courseId: { studentId: userId, courseId } },
    update: {
      rating: rating!,
      teachingQuality: teachingQuality!,
      contentQuality: contentQuality!,
      comment: comment?.trim() ?? '',
      anonymous: anonymous ?? true,
    },
    create: {
      studentId: userId,
      courseId,
      rating: rating!,
      teachingQuality: teachingQuality!,
      contentQuality: contentQuality!,
      comment: comment?.trim() ?? '',
      anonymous: anonymous ?? true,
    },
  })

  res.status(201).json({ feedback })
})

router.get('/course/:courseId', async (req, res) => {
  const actor = (req as AuthedRequest).user
  const { courseId } = req.params

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { faculty: { select: { id: true, name: true, email: true } } },
  })

  if (!course) {
    return res.status(404).json({ error: 'Course not found' })
  }

  if (actor.role === 'STUDENT') {
    return res.status(403).json({ error: 'Students cannot view other feedback for a course' })
  }

  if (actor.role === 'FACULTY' && course.facultyId !== actor.userId) {
    return res.status(403).json({ error: 'You can only view feedback for your own courses' })
  }

  const items = await prisma.feedback.findMany({
    where: { courseId },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const payload = items.map((item) => ({
    id: item.id,
    rating: item.rating,
    teachingQuality: item.teachingQuality,
    contentQuality: item.contentQuality,
    comment: item.comment,
    anonymous: item.anonymous,
    createdAt: item.createdAt,
    student: item.anonymous
      ? { name: 'Anonymous student', email: null }
      : { name: item.student.name, email: item.student.email },
  }))

  const summary = {
    responses: items.length,
    rating: average(items.map((item) => item.rating)),
    teachingQuality: average(items.map((item) => item.teachingQuality)),
    contentQuality: average(items.map((item) => item.contentQuality)),
  }

  res.json({ course, summary, feedback: payload })
})

router.get('/overview', requireRole('ADMIN', 'FACULTY'), async (req, res) => {
  const actor = (req as AuthedRequest).user
  const courses = await prisma.course.findMany({
    where: actor.role === 'FACULTY' ? { facultyId: actor.userId } : undefined,
    include: {
      faculty: { select: { name: true } },
      feedback: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
  })

  const overview = courses.map((course) => ({
    id: course.id,
    code: course.code,
    name: course.name,
    facultyName: course.faculty.name,
    enrolled: course._count.enrollments,
    responses: course.feedback.length,
    rating: average(course.feedback.map((item) => item.rating)),
    teachingQuality: average(course.feedback.map((item) => item.teachingQuality)),
    contentQuality: average(course.feedback.map((item) => item.contentQuality)),
  }))

  res.json({ overview })
})

export default router
