import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { describeError } from '../api/client'
import { orderApi } from '../api/endpoints'
import type { Order } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { MAX_QUANTITY, useCart } from '../cart/useCart'

const stepButton =
  'flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-lg leading-none hover:bg-stone-100 disabled:opacity-40'

export default function CartPage() {
  const { t } = useTranslation()
  const { auth } = useAuth()
  const { lines, total, setQuantity, setNotes, remove, clear } = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [error, setError] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  const placeOrder = useMutation({
    mutationFn: () =>
      orderApi.create({
        // only names, sizes, quantities and notes: the server looks the prices up itself
        orderItems: lines.map((line) => ({
          itemName: line.itemName,
          size: line.size,
          quantity: line.quantity,
          notes: line.notes.trim() || undefined,
        })),
      }),
    onSuccess: (order) => {
      clear()
      setPlacedOrder(order)
      void queryClient.invalidateQueries({ queryKey: ['orders'] }) // the new order must show up in My orders
    },
    onError: (err) => setError(describeError(err, t)), // e.g. "Item Pizza is currently unavailable"
  })

  function onCheckout() {
    setError(null)
    if (!auth) {
      // log in first, then come back to the cart (LoginPage reads state.from)
      navigate('/login', { state: { from: '/cart' } })
      return
    }
    placeOrder.mutate()
  }

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-2 text-xl font-bold text-green-900">{t('cart.placedTitle')}</h1>
        <dl className="mt-4 space-y-1 text-start text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-600">{t('cart.orderNumber')}</dt>
            <dd className="font-medium">#{placedOrder.orderId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-600">{t('cart.orderTotal')}</dt>
            <dd className="font-medium">
              {placedOrder.totalPrice.toFixed(2)} {t('currency')}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-600">{t('cart.orderStatus')}</dt>
            <dd className="font-medium">{t(`status.${placedOrder.status}`)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/orders" className="rounded-md bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700">
            {t('cart.viewOrders')}
          </Link>
          <Link to="/" className="rounded-md border border-stone-300 px-4 py-2 hover:bg-stone-100">
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-stone-500">{t('cart.empty')}</p>
        <Link to="/" className="mt-3 inline-block font-medium text-amber-700 hover:underline">
          {t('cart.browse')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('cart.title')}</h1>

      <ul className="space-y-3">
        {lines.map((line) => (
          <li key={`${line.itemId}:${line.size}`} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{line.itemName}</h2>
                <p className="text-sm text-stone-600">
                  {t(`menu.size.${line.size}`)} · {line.unitPrice.toFixed(2)} {t('currency')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(line.itemId, line.size)}
                className="text-sm text-red-600 hover:underline"
              >
                {t('cart.remove')}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={t('cart.decrease')}
                  onClick={() => setQuantity(line.itemId, line.size, line.quantity - 1)}
                  className={stepButton}
                >
                  −
                </button>
                <span className="w-8 text-center font-medium" aria-live="polite">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  aria-label={t('cart.increase')}
                  disabled={line.quantity >= MAX_QUANTITY}
                  onClick={() => setQuantity(line.itemId, line.size, line.quantity + 1)}
                  className={stepButton}
                >
                  +
                </button>
              </div>

              <input
                type="text"
                aria-label={t('cart.notes')}
                placeholder={t('cart.notesPlaceholder')}
                maxLength={200}
                value={line.notes}
                onChange={(e) => setNotes(line.itemId, line.size, e.target.value)}
                className="min-w-48 flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-start outline-none focus:border-amber-500"
              />

              <span className="ms-auto font-semibold">
                {(Math.round(line.unitPrice * 100) * line.quantity / 100).toFixed(2)} {t('currency')}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>{t('cart.estimatedTotal')}</span>
          <span>
            {total.toFixed(2)} {t('currency')}
          </span>
        </div>
        <p className="mt-1 text-xs text-stone-500">{t('cart.estimateNote')}</p>

        {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          onClick={onCheckout}
          disabled={placeOrder.isPending}
          className="mt-4 w-full rounded-md bg-amber-600 py-2.5 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {placeOrder.isPending ? t('cart.placing') : auth ? t('cart.checkout') : t('cart.loginToOrder')}
        </button>
      </div>
    </div>
  )
}
