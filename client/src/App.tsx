import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import CourseInsights from './pages/CourseInsights'
import CourseReview from './pages/CourseReview'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Manage from './pages/Manage'
import Register from './pages/Register'

export default function App() {
  const { user, ready, logout } = useAuth()

  if (!ready) return <p className="boot">Loading session…</p>

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>Campus Pulse</strong>
          <span>Student Feedback</span>
        </div>
        {user ? (
          <div className="session">
            <span>
              {user.name} · {user.role.toLowerCase()}
            </span>
            <button onClick={logout} type="button">
              Sign out
            </button>
          </div>
        ) : null}
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route
            path="/courses/:courseId/review"
            element={user ? <CourseReview /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/courses/:courseId/insights"
            element={user ? <CourseInsights /> : <Navigate to="/login" replace />}
          />
          <Route path="/catalog" element={user ? <Manage /> : <Navigate to="/login" replace />} />
          <Route path="/manage" element={user ? <Manage /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}
