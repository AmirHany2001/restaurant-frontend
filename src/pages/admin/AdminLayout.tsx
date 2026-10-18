import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-3 py-2 text-sm font-medium ${
    isActive ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-600 hover:text-stone-900'
  }`

// The frame of the admin area: a title and tabs. The page of the chosen tab is drawn in <Outlet />.
export default function AdminLayout() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{t('admin.title')}</h1>

      <nav className="mb-6 flex flex-wrap gap-1 border-b border-stone-200">
        <NavLink to="/admin/items" className={tabClass}>
          {t('admin.products')}
        </NavLink>
        <NavLink to="/admin/categories" className={tabClass}>
          {t('admin.categories')}
        </NavLink>
        <NavLink to="/admin/orders" className={tabClass}>
          {t('admin.orders')}
        </NavLink>
        <NavLink to="/admin/users" className={tabClass}>
          {t('admin.users')}
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}
