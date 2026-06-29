'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Locale } from './types'
import { LOCALE_STORAGE_KEY, LOCALE_COOKIE_KEY } from './types'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'es',
  setLocale: () => {},
})

function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved === 'en' || saved === 'es') return saved
    const browser = navigator.language?.slice(0, 2).toLowerCase()
    return browser === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.cookie = `${LOCALE_COOKIE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`
    document.documentElement.lang = locale
  } catch {
    // storage unavailable
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    const initial = detectInitialLocale()
    setLocaleState(initial)
    document.documentElement.lang = initial
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    persistLocale(next)
  }, [])

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
