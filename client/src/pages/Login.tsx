import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('anu.sharma@campus.edu')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-copy">
        <p className="eyebrow">Campus Pulse</p>
        <h1>Student feedback, kept honest and useful.</h1>
        <p>
          Students rate teaching and course content. Faculty see summaries. Admins keep the catalog
          in order.
        </p>
      </div>
      <form className="panel" onSubmit={onSubmit}>
        <h2>Sign in</h2>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Enter campus'}
        </button>
        <p className="hint">
          Demo password for every seeded account: <code>password123</code>
        </p>
        <p className="hint">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  )
}
