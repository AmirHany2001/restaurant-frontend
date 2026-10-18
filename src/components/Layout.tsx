import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import LanguageSwitcher from './LanguageSwitcher'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${isActive ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:bg-stone-100'}`

export default function Layout() {
  const { t } = useTranslation()
  const { auth, isAdmin, logout } = useAuth()
  const { count } = useCart()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        {/* gap-* and ms-auto are "logical": in Arabic (right-to-left) the whole row flips by itself */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3">
          <Link to="/" className="me-4 text-lg font-bold whitespace-nowrap text-amber-700">
            🍽 {t('app.name')}
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              {t('nav.menu')}
            </NavLink>
            {/* an admin runs the restaurant, he does not order from it: no cart and no "my orders" */}
            {!isAdmin && (
              <NavLink to="/cart" className={linkClass}>
                {t('nav.cart')}
                {count > 0 && (
                  <span className="ms-1.5 rounded-full bg-amber-600 px-1.5 py-0.5 text-xs text-white">{count}</span>
                )}
              </NavLink>
            )}
            {auth && !isAdmin && (
              <NavLink to="/orders" className={linkClass}>
                {t('nav.orders')}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                {t('nav.admin')}
              </NavLink>
            )}
          </nav>

          <div className="ms-auto flex flex-wrap items-center gap-2">

            {auth ? (
              <>
                <span className="hidden text-sm text-stone-600 sm:inline">{auth.fullName}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md bg-stone-800 px-3 py-1.5 text-sm text-white hover:bg-stone-700"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  {t('nav.login')}
                </NavLink>
                <Link
                  to="/register"
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}

            {/* a thin divider, then the language switch at the very end of the bar */}
            <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-stone-200 sm:block" />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
