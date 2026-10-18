import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { describeError } from '../../api/client'
import { adminApi, menuApi } from '../../api/endpoints'
import Field from '../../components/Field'

export default function AdminCategoriesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // the public endpoint already returns every category with its items (so we can count them)
  const { data: categories, isPending, error: loadError } = useQuery({
    queryKey: ['categories'],
    queryFn: menuApi.categories,
  })

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    await queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  const create = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: async (category) => {
      setName('')
      setError(null)
      setMessage(t('adminCategories.created', { name: category.name }))
      await refresh()
    },
    onError: (err) => {
      setMessage(null)
      setError(describeError(err, t)) // e.g. "Category name already exists: Pizza"
    },
  })

  const remove = useMutation({
    mutationFn: adminApi.deleteCategory,
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

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    create.mutate(name.trim())
  }

  function onDelete(categoryName: string) {
    if (!window.confirm(t('adminCategories.deleteConfirm', { name: categoryName }))) return
    remove.mutate(categoryName)
  }

  if (isPending) return <p className="text-stone-500">{t('admin.loading')}</p>
  if (loadError) return <p className="rounded-md bg-red-50 p-3 text-red-700">{describeError(loadError, t)}</p>

  return (
    <div className="space-y-4">
      {message && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="min-w-48 flex-1">
          <Field label={t('adminCategories.name')} name="categoryName" required minLength={3} maxLength={50}
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {create.isPending ? t('admin.saving') : t('adminCategories.add')}
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="py-6 text-center text-stone-500">{t('adminCategories.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => {
            const hasItems = category.items.length > 0
            return (
              <li key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div>
                  <h2 className="font-semibold">{category.name}</h2>
                  <p className="text-xs text-stone-500">{t('adminCategories.products', { count: category.items.length })}</p>
                </div>
                {/* the backend refuses to delete a category that still has products, so do not offer it */}
                <button
                  type="button"
                  disabled={hasItems || remove.isPending}
                  title={hasItems ? t('adminCategories.hasProducts') : undefined}
                  onClick={() => onDelete(category.name)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('admin.delete')}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
