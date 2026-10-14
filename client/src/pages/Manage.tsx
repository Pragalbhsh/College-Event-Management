import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type CatalogCourse, type Course, type User } from '../api'
import { useAuth } from '../auth'

export default function Manage() {
  const { user } = useAuth()
  if (user?.role === 'STUDENT') return <StudentCatalog />
  return <StaffManage />
}

function StudentCatalog() {
  const [courses, setCourses] = useState<CatalogCourse[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  async function load() {
    const [catalog, mine] = await Promise.all([api.catalog(), api.courses()])
    setCourses(catalog.courses)
    setEnrolledIds(new Set(mine.courses.map((course) => course.id)))
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load catalog'))
  }, [])

  async function enroll(courseId: string) {
    setError('')
    try {
      await api.enroll(courseId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed')
    }
  }

  return (
    <div>
      <Link to="/">← Dashboard</Link>
      <h1>Course catalog</h1>
      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        {courses.map((course) => (
          <article className="card" key={course.id}>
            <p className="code">{course.code}</p>
            <h3>{course.name}</h3>
            <p className="meta">{course.faculty.name}</p>
            {enrolledIds.has(course.id) ? (
              <span className="pill">Enrolled</span>
            ) : (
              <button className="primary" onClick={() => enroll(course.id)} type="button">
                Enroll
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

function StaffManage() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [faculty, setFaculty] = useState<User[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [studentId, setStudentId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const courseData = await api.courses()
    setCourses(courseData.courses)
    if (courseData.courses[0] && !courseId) setCourseId(courseData.courses[0].id)
    if (user?.role === 'ADMIN') {
      const [facultyData, studentData] = await Promise.all([api.facultyOptions(), api.students()])
      setFaculty(facultyData.faculty)
      setStudents(studentData.students)
      if (facultyData.faculty[0] && !facultyId) setFacultyId(facultyData.faculty[0].id)
      if (studentData.students[0] && !studentId) setStudentId(studentData.students[0].id)
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load admin data'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  async function createCourse(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.createCourse({ code, name, description, facultyId: facultyId || undefined })
      setCode('')
      setName('')
      setDescription('')
      setMessage('Course created.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create course')
    }
  }

  async function enrollStudent(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.enroll(courseId, studentId)
      setMessage('Student enrolled.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enroll student')
    }
  }

  return (
    <div className="split">
      <div>
        <Link to="/">← Dashboard</Link>
        <h1>Manage catalog</h1>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="ok">{message}</p> : null}
        <form className="panel" onSubmit={createCourse}>
          <h2>New course</h2>
          <label>
            Code
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS401" required />
          </label>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
          {user?.role === 'ADMIN' ? (
            <label>
              Faculty
              <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                {faculty.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button className="primary" type="submit">
            Create course
          </button>
        </form>
      </div>
      {user?.role === 'ADMIN' ? (
        <form className="panel" onSubmit={enrollStudent}>
          <h2>Enroll a student</h2>
          <label>
            Student
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Course
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" type="submit">
            Enroll
          </button>
        </form>
      ) : null}
    </div>
  )
}
