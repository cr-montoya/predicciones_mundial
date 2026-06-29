'use client'

import { useLanguage } from './context'
import en from './en'
import es from './es'
import type { Translations, Locale } from './types'

export function getDict(locale: Locale): Translations {
  return (locale === 'en' ? en : es) as unknown as Translations
}

export function useTranslation() {
  const { locale, setLocale } = useLanguage()
  const t = getDict(locale)
  return { t, locale, setLocale }
}
