import { useState, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { describeError } from '../api/client'
import type { RegisterRequest } from '../api/types'
import { useAuth } from '../auth/useAuth'
import Field from '../components/Field'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  // set by pages that send the user to log in (the cart): where to return afterwards
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'

  const [form, setForm] = useState<RegisterRequest>({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // one handler for every input: the input's name tells which field of the form to change
  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(describeError(err, t)) // includes the backend's per-field validation messages
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-bold">{t('auth.registerTitle')}</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('auth.fullName')} name="fullName" autoComplete="name" required
          value={form.fullName} onChange={onChange} />
        <Field label={t('auth.email')} name="email" type="email" autoComplete="email" required
          value={form.email} onChange={onChange} />
        <Field label={t('auth.password')} name="password" type="password" autoComplete="new-password" required
          hint={t('auth.passwordHint')} value={form.password} onChange={onChange} />
        <Field label={t('auth.phoneNumber')} name="phoneNumber" type="tel" autoComplete="tel" required
          hint={t('auth.phoneHint')} value={form.phoneNumber} onChange={onChange} />
        <Field label={t('auth.address')} name="address" autoComplete="street-address" required
          value={form.address} onChange={onChange} />

        {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-amber-600 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? t('auth.busy') : t('auth.submitRegister')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-stone-600">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-medium text-amber-700 hover:underline">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  )
}
