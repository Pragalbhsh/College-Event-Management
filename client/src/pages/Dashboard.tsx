import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Course, type FeedbackItem, type OverviewRow } from '../api'
import { useAuth } from '../auth'

export default function Dashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [mine, setMine] = useState<FeedbackItem[]>([])
  const [overview, setOverview] = useState<OverviewRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const courseData = await api.courses()
        if (!cancelled) setCourses(courseData.courses)
        if (user?.role === 'STUDENT') {
          const feedbackData = await api.myFeedback()
          if (!cancelled) setMine(feedbackData.feedback)
        } else {
          const overviewData = await api.overview()
          if (!cancelled) setOverview(overviewData.overview)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.role])

  if (error) return <p className="error">{error}</p>

  if (user?.role === 'STUDENT') {
    return (
      <div>
        <header className="page-head">
          <div>
            <p className="eyebrow">Student desk</p>
            <h1>Your courses</h1>
          </div>
          <Link className="ghost" to="/catalog">
            Browse catalog
          </Link>
        </header>
        <div className="grid">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <p className="code">{course.code}</p>
              <h3>{course.name}</h3>
              <p>{course.description}</p>
              <p className="meta">Faculty: {course.faculty.name}</p>
              <Link className="primary" to={`/courses/${course.id}/review`}>
                {course.submittedFeedback ? 'Update feedback' : 'Submit feedback'}
              </Link>
            </article>
          ))}
        </div>
        {courses.length === 0 ? <p className="empty">You are not enrolled in any courses yet.</p> : null}
        {mine.length > 0 ? (
          <section className="stack">
            <h2>Previous submissions</h2>
            <ul className="list">
              {mine.map((item) => (
                <li key={item.id}>
                  <strong>
                    {item.course.code} · {item.rating}/5
                  </strong>
                  <span>{item.comment || 'No written comment'}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="eyebrow">{user?.role === 'ADMIN' ? 'Administration' : 'Faculty desk'}</p>
          <h1>Course pulse</h1>
        </div>
        {user?.role === 'ADMIN' ? (
          <Link className="ghost" to="/manage">
            Manage catalog
          </Link>
        ) : (
          <Link className="ghost" to="/manage">
            Add a course
          </Link>
        )}
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Faculty</th>
              <th>Enrolled</th>
              <th>Responses</th>
              <th>Overall</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {overview.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.code}</strong>
                  <div>{row.name}</div>
                </td>
                <td>{row.facultyName}</td>
                <td>{row.enrolled}</td>
                <td>{row.responses}</td>
                <td>{row.responses ? row.rating.toFixed(1) : '—'}</td>
                <td>
                  <Link to={`/courses/${row.id}/insights`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
