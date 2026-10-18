import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { describeError } from '../../api/client'
import { adminApi } from '../../api/endpoints'
import { NEXT_STATUSES, ORDER_STATUSES, type Order, type OrderStatus } from '../../api/types'
import OrderCard from '../../components/OrderCard'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 10

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm ${
    active ? 'border-amber-600 bg-amber-100 text-amber-900' : 'border-stone-300 hover:bg-stone-100'
  }`

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // filter and page live in the URL: ?status=pending&page=1
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const status = ORDER_STATUSES.find((s) => s === statusParam) // anything else in the URL = no filter
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const { data, isPending, error: loadError } = useQuery({
    queryKey: ['admin', 'orders', status, page],
    queryFn: () => adminApi.orders(status, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })

  const update = useMutation({
    mutationFn: ({ order, next }: { order: Order; next: OrderStatus }) => adminApi.setOrderStatus(order.orderId, next),
    onSuccess: async (order) => {
      setError(null)
      setMessage(t('adminOrders.updated', { id: order.orderId, status: t(`status.${order.status}`) }))
      await queryClient.invalidateQueries({ queryKey: ['admin'] })
      await queryClient.invalidateQueries({ queryKey: ['orders'] }) // the customer's own list changed too
    },
    onError: async (err) => {
      setMessage(null)
      setError(describeError(err, t)) // e.g. the customer cancelled it a second ago
      // our list was out of date (that is why it failed): reload it so the real status shows
      await queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })

  function changeFilter(next: OrderStatus | undefined) {
    setSearchParams(next ? { status: next } : {}) // a new filter starts again at the first page
  }

  function changePage(next: number) {
    const params: Record<string, string> = {}
    if (status) params.status = status
    if (next > 0) params.page = String(next)
    setSearchParams(params)
  }

  function onAction(order: Order, next: OrderStatus) {
    if (next === 'cancelled' && !window.confirm(t('adminOrders.confirmCancel', { id: order.orderId }))) return
    update.mutate({ order, next })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group">
        <button type="button" onClick={() => changeFilter(undefined)} className={chip(status === undefined)}>
          {t('adminOrders.all')}
        </button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => changeFilter(s)} className={chip(status === s)}>
            {t(`status.${s}`)}
          </button>
        ))}
      </div>

      {message && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {isPending && <p className="text-stone-500">{t('admin.loading')}</p>}
      {loadError && <p className="rounded-md bg-red-50 p-3 text-red-700">{describeError(loadError, t)}</p>}

      {data && (
        <>
          {data.content.length === 0 ? (
            <p className="py-6 text-center text-stone-500">{t('adminOrders.empty')}</p>
          ) : (
            <ul className="space-y-4">
              {data.content.map((order) => (
                <OrderCard key={order.orderId} order={order} showCustomer>
                  {/* only the moves the backend allows from the current status (none for completed/cancelled) */}
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUSES[order.status].map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={update.isPending}
                        onClick={() => onAction(order, next)}
                        className={
                          next === 'cancelled'
                            ? 'rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60'
                            : 'rounded-md bg-amber-600 px-3 py-1 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60'
                        }
                      >
                        {t(`adminOrders.action.${next}`)}
                      </button>
                    ))}
                  </div>
                </OrderCard>
              ))}
            </ul>
          )}

          <Pagination page={page} totalPages={data.totalPages} onChange={changePage} />
        </>
      )}
    </div>
  )
}
