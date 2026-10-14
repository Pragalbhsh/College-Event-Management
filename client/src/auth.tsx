import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, type User } from './api'

type AuthContextValue = {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: { name: string; email: string; password: string; role: 'STUDENT' | 'FACULTY' }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('sf_token')
    if (!token) {
      setReady(true)
      return
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('sf_token'))
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        const data = await api.login(email, password)
        localStorage.setItem('sf_token', data.token)
        setUser(data.user)
      },
      register: async (payload) => {
        const data = await api.register(payload)
        localStorage.setItem('sf_token', data.token)
        setUser(data.user)
      },
      logout: () => {
        localStorage.removeItem('sf_token')
        setUser(null)
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
