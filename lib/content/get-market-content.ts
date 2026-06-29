import type { MarketCopy } from './markets-es'
import { MARKET_COPY, MARKET_SHORT_LABELS, translateOutcome } from './markets-es'
import { MARKET_COPY_EN, translateOutcomeEn } from './markets-en'

export interface MarketContent {
  copy: Record<string, MarketCopy>
  shortLabels: Record<string, string>
  translateOutcome: (market: string, outcome: string) => string
}

const MARKET_SHORT_LABELS_EN: Record<string, string> = Object.fromEntries(
  Object.entries(MARKET_COPY_EN).map(([k, v]) => [k, v.shortLabel])
)

export function getMarketContent(locale: 'en' | 'es'): MarketContent {
  if (locale === 'en') {
    return {
      copy: MARKET_COPY_EN,
      shortLabels: MARKET_SHORT_LABELS_EN,
      translateOutcome: translateOutcomeEn,
    }
  }
  return {
    copy: MARKET_COPY,
    shortLabels: MARKET_SHORT_LABELS,
    translateOutcome,
  }
}
