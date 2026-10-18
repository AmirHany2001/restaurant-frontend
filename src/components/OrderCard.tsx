import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Order, OrderStatus } from '../api/types'

const statusStyle: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-blue-100 text-blue-900',
  completed: 'bg-green-100 text-green-900',
  cancelled: 'bg-stone-200 text-stone-600',
}

// The server sends a date-time without a time zone. "ar-EG-u-nu-latn" = Arabic wording
// but Latin digits, so the numbers look the same as the prices.
function formatDate(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

interface OrderCardProps {
  order: Order
  showCustomer?: boolean // the admin needs to know who ordered; a customer looking at their own order does not
  children?: ReactNode // the bottom row (total + buttons): different for a customer and for an admin
}

// One order: number, date, status, customer (optional), lines. Used by "My orders" and by the admin.
export default function OrderCard({ order, showCustomer = false, children }: OrderCardProps) {
  const { t, i18n } = useTranslation()

  return (
    <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">
            {t('orders.number')} #{order.orderId}
          </h2>
          <p className="text-xs text-stone-500">{formatDate(order.orderDate, i18n.language)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[order.status]}`}>
          {t(`status.${order.status}`)}
        </span>
      </div>

      {showCustomer && order.customerName && (
        <div className="mt-3 rounded-md bg-stone-50 p-2 text-sm">
          <p className="font-medium">
            {t('adminOrders.customer')}: {order.customerName}
          </p>
          {/* phone numbers and addresses stay left-to-right even in an Arabic page */}
          <p dir="ltr" className="text-start text-stone-600">{order.customerPhone}</p>
          <p className="text-stone-600">{order.deliveryAddress}</p>
        </div>
      )}

      <ul className="mt-3 space-y-1 text-sm">
        {order.orderItems.map((line, index) => (
          <li key={index}>
            <span className="font-medium">{line.quantity} ×</span> {line.itemName} ({t(`menu.size.${line.size}`)})
            {line.unitPriceAtOrder !== null && (
              <span className="text-stone-500">
                {' '}
                · {line.unitPriceAtOrder.toFixed(2)} {t('currency')}
              </span>
            )}
            {line.notes && (
              <span className="block text-xs text-stone-500">
                {t('orders.notes')}: {line.notes}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="font-bold">
          {t('orders.total')}: {order.totalPrice.toFixed(2)} {t('currency')}
        </span>
        {children}
      </div>
    </li>
  )
}
