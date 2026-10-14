import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type Course, type Review, type Summary } from '../api'

export default function CourseInsights() {
  const { courseId } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [feedback, setFeedback] = useState<Review[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!courseId) return
    api
      .courseFeedback(courseId)
      .then((data) => {
        setCourse(data.course)
        setSummary(data.summary)
        setFeedback(data.feedback)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load insights'))
  }, [courseId])

  if (error) return <p className="error">{error}</p>
  if (!course || !summary) return <p>Loading insights…</p>

  return (
    <div>
      <Link to="/">← Dashboard</Link>
      <header className="page-head">
        <div>
          <p className="eyebrow">{course.code}</p>
          <h1>{course.name}</h1>
          <p>{course.faculty.name}</p>
        </div>
      </header>
      <div className="stats">
        <Stat label="Responses" value={String(summary.responses)} />
        <Stat label="Overall" value={summary.responses ? summary.rating.toFixed(1) : '—'} />
        <Stat
          label="Teaching"
          value={summary.responses ? summary.teachingQuality.toFixed(1) : '—'}
        />
        <Stat
          label="Content"
          value={summary.responses ? summary.contentQuality.toFixed(1) : '—'}
        />
      </div>
      <ul className="list">
        {feedback.map((item) => (
          <li key={item.id}>
            <strong>
              {item.student.name} · {item.rating}/5
            </strong>
            <span>
              Teaching {item.teachingQuality} · Content {item.contentQuality}
            </span>
            <p>{item.comment || 'No written comment.'}</p>
          </li>
        ))}
      </ul>
      {feedback.length === 0 ? <p className="empty">No feedback has been submitted yet.</p> : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
