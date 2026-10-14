import cors from 'cors'
import express from 'express'
import authRouter from './routes/auth.js'
import coursesRouter from './routes/courses.js'
import feedbackRouter from './routes/feedback.js'

const app = express()
const PORT = Number(process.env.PORT ?? 4000)

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'student-feedback' })
})

app.use('/auth', authRouter)
app.use('/courses', coursesRouter)
app.use('/feedback', feedbackRouter)

app.listen(PORT, () => {
  console.log(`Student Feedback API running on http://localhost:${PORT}`)
})
