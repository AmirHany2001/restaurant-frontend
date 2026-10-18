import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { describeError } from '../api/client'
import { orderApi } from '../api/endpoints'
import type { Order } from '../api/types'
import { useAuth } from '../auth/useAuth'
import OrderCard from '../components/OrderCard'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10

export default function OrdersPage() {
  const { t } = useTranslation()
  const { auth } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // the page number lives in the URL (?page=2), so the back button and refresh keep it
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const userId = auth!.userId // this page is only reachable when logged in (see RequireAuth)
  const { data, isPending, error: loadError } = useQuery({
    queryKey: ['orders', userId, page],
    queryFn: () => orderApi.ofUser(userId, page, PAGE_SIZE),
    placeholderData: keepPreviousData, // keep showing the old page while the next one loads
  })

  const cancel = useMutation({
    mutationFn: (orderId: number) => orderApi.cancel(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }), // reload the list
    onError: (err) => setError(describeError(err, t)),
  })

  function goToPage(next: number) {
    setSearchParams(next === 0 ? {} : { page: String(next) })
    window.scrollTo({ top: 0 })
  }

  function onCancel(order: Order) {
    if (!window.confirm(t('orders.cancelConfirm', { id: order.orderId }))) return
    setError(null)
    cancel.mutate(order.orderId)
  }

  if (isPending) return <p className="text-stone-500">{t('orders.loading')}</p>
  if (loadError) return <p className="rounded-md bg-red-50 p-3 text-red-700">{describeError(loadError, t)}</p>

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('orders.title')}</h1>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data.content.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-stone-500">{t('orders.empty')}</p>
          <Link to="/" className="mt-3 inline-block font-medium text-amber-700 hover:underline">
            {t('cart.browse')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.content.map((order) => (
            <OrderCard key={order.orderId} order={order}>
              {/* the backend only cancels pending orders, so the button is only offered for those */}
              {order.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => onCancel(order)}
                  disabled={cancel.isPending && cancel.variables === order.orderId}
                  className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  {cancel.isPending && cancel.variables === order.orderId ? t('orders.cancelling') : t('orders.cancel')}
                </button>
              )}
            </OrderCard>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={data.totalPages} onChange={goToPage} />
    </div>
  )
}
