import type { TFunction } from 'i18next'
import { clearAuth, getToken } from '../auth/storage'
import i18n from '../i18n'
import type { ErrorBody } from './types'

// Where the Spring Boot backend runs. Override with VITE_API_URL in a .env file.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | undefined>
}

// One place that talks to the backend: adds the token, asks for the answer in the current language,
// and turns the backend's { status, message, errors } error body into an ApiError.
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) query.set(key, String(value))
  }
  const url = `${BASE_URL}${path}${query.size > 0 ? `?${query}` : ''}`

  const headers: Record<string, string> = {
    'Accept-Language': i18n.language, // the backend translates its messages with this header
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  const data: unknown = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    // An expired or invalid token: forget it, so the app shows the logged-out state.
    if (response.status === 401 && token) {
      clearAuth()
      window.dispatchEvent(new Event('auth:expired'))
    }
    const error = data as Partial<ErrorBody> | undefined
    throw new ApiError(response.status, error?.message ?? response.statusText, error?.errors)
  }

  return data as T
}

// A readable message for the user from anything a request can throw.
export function describeError(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const details = Object.values(error.fieldErrors ?? {})
    return [error.message, ...details].join(' • ')
  }
  // fetch() throws a TypeError when the server cannot be reached at all
  if (error instanceof TypeError) return t('errors.network')
  return t('errors.generic')
}
