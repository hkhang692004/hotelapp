import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe, login as apiLogin, logout as apiLogout } from '../api/auth'
import { canAccessWeb } from '../utils/roles'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(true)

  const persistSession = useCallback((payload) => {
    localStorage.setItem('access_token', payload.access)
    localStorage.setItem('refresh_token', payload.refresh)
    localStorage.setItem('user', JSON.stringify(payload.user))
    setUser(payload.user)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    if (!canAccessWeb(data.user)) {
      throw new Error('Tài khoản này dùng ứng dụng mobile. Vui lòng đăng nhập trên web bằng tài khoản lễ tân, quản lý hoặc admin.')
    }
    persistSession(data)
    return data.user
  }, [persistSession])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      if (refresh) await apiLogout(refresh)
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then((me) => {
        if (!canAccessWeb(me)) {
          clearSession()
          return
        }
        setUser(me)
        localStorage.setItem('user', JSON.stringify(me))
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false))
  }, [clearSession])

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
