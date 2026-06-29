import 'server-only'
import { cookies } from 'next/headers'
import type { Locale, Translations } from './types'
import { LOCALE_COOKIE_KEY } from './types'
import en from './en'
import es from './es'

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const saved = cookieStore.get(LOCALE_COOKIE_KEY)?.value
  return saved === 'en' ? 'en' : 'es'
}

export async function getServerTranslations(): Promise<{ t: Translations; locale: Locale }> {
  const locale = await getServerLocale()
  const t = (locale === 'en' ? en : es) as unknown as Translations
  return { t, locale }
}
