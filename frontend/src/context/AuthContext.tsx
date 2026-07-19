import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, role?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    try {
      const { data } = await api.get<User>('/api/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (localStorage.getItem('collabai_token')) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    // FastAPI's OAuth2PasswordRequestForm expects x-www-form-urlencoded with "username".
    const form = new URLSearchParams()
    form.set('username', email)
    form.set('password', password)
    const { data } = await api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('collabai_token', data.access_token)
    await fetchMe()
  }

  const signup = async (name: string, email: string, password: string, role = 'student') => {
    await api.post('/api/auth/signup', { name, email, password, role })
    await login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('collabai_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
