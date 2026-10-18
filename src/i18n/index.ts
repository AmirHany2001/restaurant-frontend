import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './ar'
import en from './en'

export type Language = 'en' | 'ar'

function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'ar') return saved
  } catch {
    // storage can be blocked (private window): fall through to the browser language
  }
  return navigator.language.startsWith('ar') ? 'ar' : 'en'
}

// Arabic is written right-to-left: the whole page layout has to flip, not only the text.
function applyDirection(language: string) {
  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: savedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
})

i18n.on('languageChanged', (language) => {
  applyDirection(language)
  try {
    localStorage.setItem('lang', language)
  } catch {
    // not critical
  }
})
applyDirection(i18n.language)

export default i18n
