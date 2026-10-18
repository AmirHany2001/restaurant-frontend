import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

// Pages for customers (cart, my orders). An admin who types the address is sent to the admin area.
export default function CustomerOnly() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/admin" replace /> : <Outlet />
}
