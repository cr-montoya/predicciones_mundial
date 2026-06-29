'use client'

import { useState } from 'react'
import type { RankedMarket } from '@/lib/skills/rank-markets'
import { MARKET_SHORT_LABELS, translateOutcome } from '@/lib/content/markets-es'
import { useTranslation } from '@/lib/i18n/hook'

interface TopMarketsProps {
  initial: RankedMarket[]
  all: RankedMarket[]
}

function marketLabel(market: string): string {
  return MARKET_SHORT_LABELS[market] ?? market.replace(/_/g, ' ')
}

function pctColor(probability: number): string {
  if (probability >= 0.75) return '#FFDB00'
  if (probability >= 0.55) return '#D4A843'
  return '#887044'
}

export function TopMarkets({ initial, all }: TopMarketsProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const markets = expanded ? all : initial

  if (initial.length === 0) return null

  const hasMore = all.length > initial.length

  const confidenceBadge = (level: string) => {
    if (level === 'high') return { label: t.topMarkets.confidence.high, bg: 'rgba(255,219,0,0.12)', color: '#FFDB00' }
    if (level === 'medium') return { label: t.topMarkets.confidence.medium, bg: 'rgba(255,165,0,0.12)', color: '#FFA500' }
    return { label: t.topMarkets.confidence.low, bg: 'rgba(255,255,255,0.06)', color: '#6b6d75' }
  }

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: 11,
        color: '#6b6d75',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {t.topMarkets.sectionTitle}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {markets.map((m, i) => {
          const badge = confidenceBadge(m.confidence)
          const pct = Math.round(m.topProbability * 100)
          const outcomeLabel = translateOutcome(m.market, m.topOutcome)
          return (
            <div
              key={`${m.fixtureId}-${m.market}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'rgba(255,219,0,0.02)',
                borderRadius: 10,
                border: '1px solid rgba(255,219,0,0.04)',
              }}
            >
              <div style={{ width: 24, fontSize: 13, color: '#6b6d75', fontWeight: 600, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
                  {m.fixtureLabel}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f0ece4' }}>
                    {marketLabel(m.market)}
                  </span>
                  <span style={{
                    background: badge.bg,
                    color: badge.color,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}>
                    {badge.label}
                  </span>
                  <span style={{ fontSize: 12, color: '#6b6d75' }}>
                    {outcomeLabel}
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: 24,
                fontWeight: 800,
                color: pctColor(m.topProbability),
                marginLeft: 12,
                flexShrink: 0,
              }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: '#D4A843',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            {expanded ? t.topMarkets.hide : t.topMarkets.viewMore}
          </button>
        </div>
      )}
    </section>
  )
}
