import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { describeError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import type { AppUser, Role } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 20

const secondaryButton = 'rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { auth } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const { data, isPending, error: loadError } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.users(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] })

  const changeRole = useMutation({
    mutationFn: ({ user, role }: { user: AppUser; role: Role }) => adminApi.setRole(user.id, role),
    onSuccess: async (user) => {
      setError(null)
      setMessage(t('adminUsers.roleChanged', { name: user.fullName, role: t(`adminUsers.role.${user.role}`) }))
      await refresh()
    },
    onError: (err) => {
      setMessage(null)
      setError(describeError(err, t)) // e.g. "Cannot remove the last admin"
    },
  })

  const remove = useMutation({
    mutationFn: (user: AppUser) => adminApi.deleteUser(user.id),
    onSuccess: async (result) => {
      setError(null)
      setMessage(result.message)
      await refresh()
    },
    onError: (err) => {
      setMessage(null)
      setError(describeError(err, t))
    },
  })

  function onDelete(user: AppUser) {
    // the backend deletes the user's orders together with the user, so the warning says so
    if (!window.confirm(t('adminUsers.deleteConfirm', { name: user.fullName }))) return
    remove.mutate(user)
  }

  if (isPending) return <p className="text-stone-500">{t('admin.loading')}</p>
  if (loadError) return <p className="rounded-md bg-red-50 p-3 text-red-700">{describeError(loadError, t)}</p>

  const busy = changeRole.isPending || remove.isPending

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">{t('adminUsers.roleHint')}</p>

      {message && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data.content.length === 0 ? (
        <p className="py-6 text-center text-stone-500">{t('adminUsers.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {data.content.map((user) => {
            const isSelf = user.id === auth?.userId
            const isAdmin = user.role === 'ADMIN'
            return (
              <li key={user.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">
                      {user.fullName} {isSelf && <span className="text-sm font-normal text-stone-500">{t('adminUsers.you')}</span>}
                    </h2>
                    <p dir="ltr" className="text-start text-sm text-stone-600">{user.email}</p>
                    <p dir="ltr" className="text-start text-sm text-stone-600">{user.phoneNumber}</p>
                    <p className="text-sm text-stone-600">{user.address}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isAdmin ? 'bg-purple-100 text-purple-900' : 'bg-stone-200 text-stone-700'}`}>
                    {t(`adminUsers.role.${user.role}`)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                  {/* your own account is left alone here, so an admin cannot lock themselves out by accident */}
                  <button
                    type="button"
                    disabled={busy || isSelf}
                    title={isSelf ? t('adminUsers.selfHint') : undefined}
                    onClick={() => changeRole.mutate({ user, role: isAdmin ? 'USER' : 'ADMIN' })}
                    className={secondaryButton}
                  >
                    {isAdmin ? t('adminUsers.removeAdmin') : t('adminUsers.makeAdmin')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || isSelf}
                    title={isSelf ? t('adminUsers.selfHint') : undefined}
                    onClick={() => onDelete(user)}
                    className="ms-auto rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('admin.delete')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={data.totalPages}
        onChange={(next) => setSearchParams(next === 0 ? {} : { page: String(next) })}
      />
    </div>
  )
}
