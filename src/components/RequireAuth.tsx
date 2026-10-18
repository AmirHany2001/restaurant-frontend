import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

// Wraps pages that need a logged-in user. Anyone else is sent to the login page, which brings
// them back here afterwards (it reads state.from).
// This only decides what is SHOWN: the backend checks the token on every request anyway.
export default function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { auth, isAdmin } = useAuth()
  const location = useLocation()

  if (!auth) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
