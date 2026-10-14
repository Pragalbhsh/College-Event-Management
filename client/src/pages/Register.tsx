import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Register() {
  const { user, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register({ name, email, password, role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-copy">
        <p className="eyebrow">New account</p>
        <h1>Join as a student or faculty member.</h1>
        <p>Admin accounts are created from seed data, not public registration.</p>
      </div>
      <form className="panel" onSubmit={onSubmit}>
        <h2>Register</h2>
        <label>
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Campus email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as 'STUDENT' | 'FACULTY')}>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" disabled={busy} type="submit">
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="hint">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
