import { createContext, useContext } from 'react'
import type { AuthResponse, RegisterRequest } from '../api/types'

export interface AuthContextValue {
  auth: AuthResponse | null // null = logged out
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResponse> // returns who logged in (role included)
  register: (request: RegisterRequest) => Promise<AuthResponse>
  logout: () => void
}

// Kept apart from AuthProvider (a component) so each file exports only one kind of thing,
// which keeps React's hot reload working.
export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
