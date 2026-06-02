import { createContext, useContext, useState, type ReactNode } from 'react'
import { authAPI } from './api'

export type Role = 'admin' | 'staff'

export type AuthContextType = {
  token: string | null
  user: { id: string; email: string; role: Role } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'))
  const [user, setUser] = useState<{ id: string; email: string; role: Role } | null>(
    token ? JSON.parse(localStorage.getItem('authUser') || 'null') : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authAPI.login(email, password)
      const { accessToken, user: userData } = data.data

      console.log('[AuthContext] Login successful, userData:', userData)
      setToken(accessToken)
      setUser(userData)
      localStorage.setItem('authToken', accessToken)
      localStorage.setItem('authUser', JSON.stringify(userData))
      console.log('[AuthContext] State updated with token and user')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login error'
      console.error('[AuthContext] Login error:', message)
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setError(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
