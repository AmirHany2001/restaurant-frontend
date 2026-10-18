import type { AuthResponse } from '../api/types'

// The login answer (token + who the user is) is kept in localStorage so a page refresh keeps the user
// logged in. Every access is wrapped: storage can be blocked (private window) and then the app
// simply works without remembering the login.
const KEY = 'auth'

export function loadAuth(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AuthResponse) : null
  } catch {
    return null
  }
}

export function saveAuth(auth: AuthResponse) {
  try {
    localStorage.setItem(KEY, JSON.stringify(auth))
  } catch {
    // not critical
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // not critical
  }
}

export function getToken(): string | null {
  return loadAuth()?.token ?? null
}
