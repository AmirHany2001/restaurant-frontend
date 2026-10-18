import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { describeError } from '../../api/client'
import { adminApi, menuApi } from '../../api/endpoints'
import { ITEM_SIZES, type Item, type ItemStatus } from '../../api/types'
import Field from '../../components/Field'
import Pagination from '../../components/Pagination'
import PriceFields from '../../components/PriceFields'
import { emptyPriceInputs, parsePrices, toPriceInputs, type PriceInputs } from '../../utils/prices'

const PAGE_SIZE = 20

const inputClass =
  'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-start outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
const primaryButton = 'rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60'
const secondaryButton = 'rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-60'

// --- the "Add product" form ------------------------------------------------------------------

function AddItemForm({ onDone, onError }: { onDone: (message: string) => void; onError: (message: string) => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: menuApi.categories })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<ItemStatus>('available')
  const [prices, setPrices] = useState<PriceInputs>(emptyPriceInputs)
  const [formError, setFormError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: adminApi.createItem,
    onSuccess: async (item) => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] })
      await queryClient.invalidateQueries({ queryKey: ['categories'] }) // the public menu changed too
      onDone(item.name)
    },
    onError: (err) => setFormError(describeError(err, t)),
  })

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    onError('')

    const parsed = parsePrices(prices)
    if (!parsed.ok) {
      setFormError(parsed.reason === 'required' ? t('admin.priceRequired') : t('admin.priceInvalid'))
      return
    }
    create.mutate({ name: name.trim(), description: description.trim(), price: parsed.prices, categoryId: Number(categoryId), status })
  }

  if (categories && categories.length === 0) {
    return <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{t('adminProducts.noCategories')}</p>
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <Field label={t('adminProducts.name')} name="name" required minLength={3} maxLength={100}
        value={name} onChange={(e) => setName(e.target.value)} />
      <Field label={t('adminProducts.description')} name="description" required minLength={3} maxLength={100}
        value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          {t('adminProducts.category')}
          <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass} mt-1`}>
            <option value="">{t('adminProducts.selectCategory')}</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-stone-700">
          {t('adminProducts.status')}
          <select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)} className={`${inputClass} mt-1`}>
            <option value="available">{t('adminProducts.available')}</option>
            <option value="not_available">{t('menu.unavailable')}</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-stone-700">{t('adminProducts.prices', { currency: t('currency') })}</legend>
        <PriceFields values={prices} onChange={setPrices} />
        <p className="mt-1 text-xs text-stone-500">{t('adminProducts.pricesHint')}</p>
      </fieldset>

      {formError && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{formError}</p>}

      <button type="submit" disabled={create.isPending} className={primaryButton}>
        {create.isPending ? t('admin.saving') : t('admin.save')}
      </button>
    </form>
  )
}

// --- one product in the list -------------------------------------------------------------------

function ItemRow({ item, onChanged, onError }: {
  item: Item
  onChanged: (message: string) => void
  onError: (message: string) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [prices, setPrices] = useState<PriceInputs>(() => toPriceInputs(item.price))
  const [priceError, setPriceError] = useState<string | null>(null)

  const available = item.status === 'available'

  // after any change: reload the admin list and the public menu, and show the backend's own message
  async function refreshAnd(message: string) {
    await queryClient.invalidateQueries({ queryKey: ['admin'] })
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    onChanged(message)
  }

  const changePrice = useMutation({
    mutationFn: (price: Item['price']) => adminApi.changePrice(item.id, price),
    onSuccess: async (result) => {
      setEditing(false)
      await refreshAnd(result.message)
    },
    onError: (err) => setPriceError(describeError(err, t)), // e.g. "The price is the same, change it"
  })

  const changeStatus = useMutation({
    mutationFn: (status: ItemStatus) => adminApi.changeStatus(item.id, status),
    onSuccess: (result) => refreshAnd(result.message),
    onError: (err) => onError(describeError(err, t)),
  })

  const remove = useMutation({
    mutationFn: () => adminApi.deleteItem(item.id),
    onSuccess: (result) => refreshAnd(result.message),
    onError: (err) => onError(describeError(err, t)), // e.g. the item is in past orders: set it unavailable instead
  })

  function savePrices() {
    setPriceError(null)
    const parsed = parsePrices(prices)
    if (!parsed.ok) {
      setPriceError(parsed.reason === 'required' ? t('admin.priceRequired') : t('admin.priceInvalid'))
      return
    }
    changePrice.mutate(parsed.prices)
  }

  function onDelete() {
    if (!window.confirm(t('adminProducts.deleteConfirm', { name: item.name }))) return
    onError('')
    remove.mutate()
  }

  const busy = changePrice.isPending || changeStatus.isPending || remove.isPending

  return (
    <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{item.name}</h2>
          <p className="text-xs text-stone-500">{item.categoryName}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${available ? 'bg-green-100 text-green-900' : 'bg-stone-200 text-stone-600'}`}>
          {available ? t('adminProducts.available') : t('menu.unavailable')}
        </span>
      </div>

      {!editing && (
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {ITEM_SIZES.filter((size) => item.price[size] !== undefined).map((size) => (
            <li key={size} className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-900">
              {t(`menu.size.${size}`)} · {item.price[size]!.toFixed(2)} {t('currency')}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <PriceFields values={prices} onChange={setPrices} />
          <p className="text-xs text-stone-500">{t('adminProducts.pricesHint')}</p>
          {priceError && <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">{priceError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={savePrices} disabled={busy} className={primaryButton}>
              {changePrice.isPending ? t('admin.saving') : t('admin.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setPriceError(null)
                setPrices(toPriceInputs(item.price)) // throw away what was typed
              }}
              className={secondaryButton}
            >
              {t('admin.cancel')}
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
          <button type="button" onClick={() => setEditing(true)} disabled={busy} className={secondaryButton}>
            {t('adminProducts.editPrices')}
          </button>
          <button
            type="button"
            onClick={() => changeStatus.mutate(available ? 'not_available' : 'available')}
            disabled={busy}
            className={secondaryButton}
          >
            {available ? t('adminProducts.makeUnavailable') : t('adminProducts.makeAvailable')}
          </button>
          <button type="button" onClick={onDelete} disabled={busy}
            className="ms-auto rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60">
            {t('admin.delete')}
          </button>
        </div>
      )}
    </li>
  )
}

// --- the page ------------------------------------------------------------------------------------

export default function AdminItemsPage() {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<string | null>(null) // success text, from the backend
  const [error, setError] = useState<string | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const { data, isPending, error: loadError } = useQuery({
    queryKey: ['admin', 'items', page],
    queryFn: () => adminApi.items(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })

  function showMessage(text: string) {
    setError(null)
    setMessage(text)
  }
  function showError(text: string) {
    setMessage(null)
    setError(text || null)
  }

  if (isPending) return <p className="text-stone-500">{t('admin.loading')}</p>
  if (loadError) return <p className="rounded-md bg-red-50 p-3 text-red-700">{describeError(loadError, t)}</p>

  return (
    <div className="space-y-4">
      {message && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {showForm ? (
        <div className="space-y-2">
          <AddItemForm
            onDone={(name) => {
              setShowForm(false)
              showMessage(t('adminProducts.created', { name }))
            }}
            onError={showError}
          />
          <button type="button" onClick={() => setShowForm(false)} className={secondaryButton}>
            {t('admin.cancel')}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className={primaryButton}>
          + {t('adminProducts.add')}
        </button>
      )}

      {data.content.length === 0 ? (
        <p className="py-6 text-center text-stone-500">{t('adminProducts.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {data.content.map((item) => (
            <ItemRow key={item.id} item={item} onChanged={showMessage} onError={showError} />
          ))}
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
