import { useTranslation } from 'react-i18next'
import type { Language } from '../i18n'

const OPTIONS: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ar', label: 'عربي', name: 'العربية' },
]

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
    </svg>
  )
}

// A two-option switch showing BOTH languages, with the current one highlighted, so it is always
// clear which language the page is in (the old button only named the "other" one).
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current: Language = i18n.language === 'ar' ? 'ar' : 'en'

  return (
    // dir="ltr": the order stays "EN | عربي" in both languages, so the switch does not jump around
    <div
      dir="ltr"
      role="group"
      aria-label={t('nav.languageLabel')}
      className="flex items-center gap-0.5 rounded-full bg-stone-100 p-0.5 ring-1 ring-stone-200"
    >
      <GlobeIcon className="mx-1.5 h-4 w-4 shrink-0 text-stone-400" />
      {OPTIONS.map((option) => {
        const active = option.code === current
        return (
          <button
            key={option.code}
            type="button"
            lang={option.code}
            title={option.name}
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(option.code)}
            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
              active
                ? 'bg-white text-amber-800 shadow-sm ring-1 ring-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
