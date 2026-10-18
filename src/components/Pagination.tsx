import { useTranslation } from 'react-i18next'

interface PaginationProps {
  page: number // starts at 0
  totalPages: number
  onChange: (page: number) => void
}

const buttonClass = 'rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-40'

// Previous / Next with "Page 2 of 5". Renders nothing when everything fits on one page.
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <nav className="mt-6 flex items-center justify-between" aria-label="pagination">
      <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} className={buttonClass}>
        {t('pagination.previous')}
      </button>
      <span className="text-sm text-stone-600">{t('pagination.pageOf', { page: page + 1, total: totalPages })}</span>
      <button type="button" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)} className={buttonClass}>
        {t('pagination.next')}
      </button>
    </nav>
  )
}
