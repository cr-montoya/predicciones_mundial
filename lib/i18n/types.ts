import type en from './en'

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : DeepStringify<T[K]>
}

export type Translations = DeepStringify<typeof en>
export type Locale = 'en' | 'es'

export const LOCALE_STORAGE_KEY = 'wc2026-locale'
export const LOCALE_COOKIE_KEY = 'wc2026-locale'
