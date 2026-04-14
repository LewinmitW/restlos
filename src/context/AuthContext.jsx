import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    try {
      const res = await api('auth/session.php')
      if (res.success && res.data?.id) {
        setUser(res.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = async (email, password) => {
    const res = await api('auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res.success) {
      setUser(res.data)
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  const register = async (name, email, password) => {
    const res = await api('auth/register.php', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    if (res.success) {
      setUser(res.data)
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  const logout = async () => {
    try {
      await api('auth/logout.php', { method: 'POST' })
    } catch {
      // Ignore errors on logout
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
