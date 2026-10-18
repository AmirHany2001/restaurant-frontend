import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { menuApi } from '../api/endpoints'
import { describeError } from '../api/client'
import { ITEM_SIZES, type Item } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'

function ItemCard({ item }: { item: Item }) {
  const { t } = useTranslation()
  const { lines, add } = useCart()
  const { isAdmin } = useAuth()
  const available = item.status === 'available'

  return (
    <li className={`rounded-xl border border-stone-200 bg-white p-4 shadow-sm ${available ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{item.name}</h3>
        {!available && (
          <span className="shrink-0 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600">
            {t('menu.unavailable')}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-stone-600">{item.description}</p>

      {/* one button per size this item is sold in; the badge shows how many are already in the cart */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {ITEM_SIZES.filter((size) => item.price[size] !== undefined).map((size) => {
          if (isAdmin) {
            // nothing to add to: the admin only looks at the menu (he manages it in the admin area)
            return (
              <li key={size} className="rounded-md bg-amber-50 px-2.5 py-1 text-sm text-amber-900">
                {t(`menu.size.${size}`)} · {item.price[size]!.toFixed(2)} {t('currency')}
              </li>
            )
          }
          const inCart = lines.find((line) => line.itemId === item.id && line.size === size)?.quantity ?? 0
          return (
            <li key={size}>
              <button
                type="button"
                disabled={!available}
                aria-label={t('menu.addLabel', { name: item.name, size: t(`menu.size.${size}`) })}
                onClick={() => add(item, size)}
                className="flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1 text-sm text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:hover:bg-amber-50"
              >
                <span>
                  {t(`menu.size.${size}`)} · {item.price[size]!.toFixed(2)} {t('currency')}
                </span>
                <span className="rounded bg-amber-600 px-1.5 text-white">{inCart > 0 ? `×${inCart}` : '+'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </li>
  )
}

export default function MenuPage() {
  const { t } = useTranslation()
  const { data: categories, isPending, error } = useQuery({
    queryKey: ['categories'],
    queryFn: menuApi.categories,
  })

  if (isPending) return <p className="text-stone-500">{t('menu.loading')}</p>
  if (error) return <p className="rounded-md bg-red-50 p-3 text-red-700">{describeError(error, t)}</p>

  const nonEmpty = categories.filter((category) => category.items.length > 0)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('menu.title')}</h1>

      {nonEmpty.length === 0 && <p className="text-stone-500">{t('menu.empty')}</p>}

      {nonEmpty.map((category) => (
        <section key={category.name} className="mb-8">
          <h2 className="mb-3 border-b border-stone-200 pb-1 text-lg font-semibold text-amber-800">
            {category.name}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {category.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
