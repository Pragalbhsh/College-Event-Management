import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  await prisma.feedback.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Asha Menon',
      email: 'admin@campus.edu',
      passwordHash,
      role: 'ADMIN',
    },
  })

  const priya = await prisma.user.create({
    data: {
      name: 'Dr. Priya Nair',
      email: 'priya.nair@campus.edu',
      passwordHash,
      role: 'FACULTY',
    },
  })

  const ravi = await prisma.user.create({
    data: {
      name: 'Prof. Ravi Iyer',
      email: 'ravi.iyer@campus.edu',
      passwordHash,
      role: 'FACULTY',
    },
  })

  const anu = await prisma.user.create({
    data: { name: 'Anu Sharma', email: 'anu.sharma@campus.edu', passwordHash, role: 'STUDENT' },
  })
  const kabir = await prisma.user.create({
    data: { name: 'Kabir Das', email: 'kabir.das@campus.edu', passwordHash, role: 'STUDENT' },
  })
  const meera = await prisma.user.create({
    data: { name: 'Meera Joshi', email: 'meera.joshi@campus.edu', passwordHash, role: 'STUDENT' },
  })

  const dbms = await prisma.course.create({
    data: {
      code: 'CS301',
      name: 'Database Systems',
      description: 'Relational modeling, SQL, transactions, and application connectivity.',
      facultyId: priya.id,
    },
  })
  const dsa = await prisma.course.create({
    data: {
      code: 'CS210',
      name: 'Data Structures',
      description: 'Arrays, trees, graphs, and the complexity of common algorithms.',
      facultyId: ravi.id,
    },
  })
  const ethics = await prisma.course.create({
    data: {
      code: 'HS120',
      name: 'Professional Ethics',
      description: 'Case-based discussion of responsibility in engineering practice.',
      facultyId: priya.id,
    },
  })

  await prisma.enrollment.createMany({
    data: [
      { studentId: anu.id, courseId: dbms.id },
      { studentId: anu.id, courseId: dsa.id },
      { studentId: kabir.id, courseId: dbms.id },
      { studentId: kabir.id, courseId: ethics.id },
      { studentId: meera.id, courseId: dsa.id },
      { studentId: meera.id, courseId: ethics.id },
    ],
  })

  await prisma.feedback.createMany({
    data: [
      {
        studentId: anu.id,
        courseId: dbms.id,
        rating: 5,
        teachingQuality: 5,
        contentQuality: 4,
        comment: 'Labs were practical and the SQL assignments mapped cleanly to the lectures.',
        anonymous: false,
      },
      {
        studentId: kabir.id,
        courseId: dbms.id,
        rating: 4,
        teachingQuality: 4,
        contentQuality: 5,
        comment: 'Would like more time on indexing before the midterm.',
        anonymous: true,
      },
      {
        studentId: meera.id,
        courseId: dsa.id,
        rating: 3,
        teachingQuality: 3,
        contentQuality: 4,
        comment: 'Problem sets are strong, but recitation moves too quickly.',
        anonymous: true,
      },
    ],
  })

  console.log('Seeded campus accounts. Shared password: password123')
  console.log(`Admin: ${admin.email}`)
  console.log(`Faculty: ${priya.email}, ${ravi.email}`)
  console.log(`Students: ${anu.email}, ${kabir.email}, ${meera.email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
