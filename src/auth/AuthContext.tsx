import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import type { AuthResponse, RegisterRequest } from '../api/types'
import { AuthContext, type AuthContextValue } from './useAuth'
import { clearAuth, loadAuth, saveAuth } from './storage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => loadAuth())
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    clearAuth()
    setAuth(null)
    queryClient.clear() // drop everything fetched for this user (orders...), so the next user cannot see it
  }, [queryClient])

  // The API client fires this event when the backend answers 401 to a request that had a token.
  useEffect(() => {
    window.addEventListener('auth:expired', logout)
    return () => window.removeEventListener('auth:expired', logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    saveAuth(response)
    setAuth(response)
    return response
  }, [])

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await authApi.register(request) // the backend logs the new user in
    saveAuth(response)
    setAuth(response)
    return response
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ auth, isAdmin: auth?.role === 'ADMIN', login, register, logout }),
    [auth, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
