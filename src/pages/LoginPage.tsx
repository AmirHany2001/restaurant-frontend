import { useState, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { describeError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  // set by pages that send the user to log in (the cart): where to return afterwards
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault() // stop the browser from reloading the page
    setError(null)
    setBusy(true)
    try {
      const { role } = await login(email, password)
      // an admin starts in the admin area, unless he was sent here from a specific page
      navigate(role === 'ADMIN' && from === '/' ? '/admin' : from, { replace: true })
    } catch (err) {
      setError(describeError(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-bold">{t('auth.loginTitle')}</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label={t('auth.email')}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-amber-600 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? t('auth.busy') : t('auth.submitLogin')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-stone-600">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-amber-700 hover:underline">
          {t('nav.register')}
        </Link>
      </p>
    </div>
  )
}
