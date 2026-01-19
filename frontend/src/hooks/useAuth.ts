import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '@/services/auth.service'
import * as Auth from '@/services/auth.service'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    setIsLoading(true)
    try {
      const me = await Auth.getCurrentUser()
      setUser(me)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const login = async (email: string, password: string) => {
    const u = await Auth.login(email, password)
    setUser(u)
  }

  const logout = async () => {
    await Auth.logout()
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, login, logout, refresh }),
    [user, isLoading]
  )

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
