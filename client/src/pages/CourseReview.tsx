import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type Course, type FeedbackItem } from '../api'

const scores = [1, 2, 3, 4, 5]

export default function CourseReview() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [existing, setExisting] = useState<FeedbackItem | null>(null)
  const [rating, setRating] = useState(4)
  const [teachingQuality, setTeachingQuality] = useState(4)
  const [contentQuality, setContentQuality] = useState(4)
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function load() {
      const [courses, mine] = await Promise.all([api.courses(), api.myFeedback()])
      const found = courses.courses.find((item) => item.id === courseId) ?? null
      setCourse(found)
      const prior = mine.feedback.find((item) => item.courseId === courseId)
      if (prior) {
        setExisting(prior)
        setRating(prior.rating)
        setTeachingQuality(prior.teachingQuality)
        setContentQuality(prior.contentQuality)
        setComment(prior.comment)
        setAnonymous(prior.anonymous)
      }
    }
    load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load course'))
  }, [courseId])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!courseId) return
    setBusy(true)
    setError('')
    try {
      await api.submitFeedback({
        courseId,
        rating,
        teachingQuality,
        contentQuality,
        comment,
        anonymous,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save feedback')
    } finally {
      setBusy(false)
    }
  }

  if (!course && !error) return <p>Loading course…</p>
  if (!course) return <p className="error">{error || 'Course not found in your enrollments.'}</p>

  return (
    <div className="narrow">
      <Link to="/">← Back</Link>
      <p className="eyebrow">{course.code}</p>
      <h1>{existing ? 'Update feedback' : 'Submit feedback'}</h1>
      <p>
        {course.name} · {course.faculty.name}
      </p>
      <form className="panel" onSubmit={onSubmit}>
        <Score label="Overall" value={rating} onChange={setRating} />
        <Score label="Teaching quality" value={teachingQuality} onChange={setTeachingQuality} />
        <Score label="Content quality" value={contentQuality} onChange={setContentQuality} />
        <label>
          Written comments
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5} />
        </label>
        <label className="check">
          <input
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            type="checkbox"
          />
          Keep my name hidden from faculty
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" disabled={busy} type="submit">
          {busy ? 'Saving…' : 'Save feedback'}
        </button>
      </form>
    </div>
  )
}

function Score({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <fieldset className="score">
      <legend>{label}</legend>
      {scores.map((score) => (
        <label key={score}>
          <input
            checked={value === score}
            name={label}
            onChange={() => onChange(score)}
            type="radio"
            value={score}
          />
          {score}
        </label>
      ))}
    </fieldset>
  )
}
