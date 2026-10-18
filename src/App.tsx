import { Navigate, Route, Routes } from 'react-router-dom'
import CustomerOnly from './components/CustomerOnly'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import OrdersPage from './pages/OrdersPage'
import RegisterPage from './pages/RegisterPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminItemsPage from './pages/admin/AdminItemsPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

export default function App() {
  return (
    <Routes>
      {/* every page is drawn inside Layout (the header) */}
      <Route element={<Layout />}>
        <Route index element={<MenuPage />} />
        {/* pages for customers only (an admin is sent to /admin) */}
        <Route element={<CustomerOnly />}>
          <Route path="cart" element={<CartPage />} />
          {/* ... and this one also needs a logged-in user */}
          <Route element={<RequireAuth />}>
            <Route path="orders" element={<OrdersPage />} />
          </Route>
        </Route>
        {/* admin only: anybody else is sent to the menu (and the backend answers 403 anyway) */}
        <Route element={<RequireAuth admin />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="items" replace />} />
            <Route path="items" element={<AdminItemsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  )
}
