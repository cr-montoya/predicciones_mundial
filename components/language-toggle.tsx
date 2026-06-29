'use client'

import { useTranslation } from '@/lib/i18n/hook'
import type { Locale } from '@/lib/i18n/types'

const LOCALES: Locale[] = ['ES', 'EN'] as unknown as Locale[]

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {(['es', 'en'] as Locale[]).map((lang) => {
        const active = locale === lang
        return (
          <button
            key={lang}
            onClick={() => setLocale(lang)}
            style={{
              background: active ? 'rgba(255,219,0,0.15)' : 'transparent',
              border: 'none',
              cursor: active ? 'default' : 'pointer',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: active ? '#FFDB00' : '#6b6d75',
              transition: 'background 0.15s, color 0.15s',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
            aria-pressed={active}
            aria-label={lang === 'es' ? 'Español' : 'English'}
          >
            {lang.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
