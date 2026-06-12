'use client'

import { useState } from 'react'
import type { RankedMarket } from '@/lib/skills/rank-markets'

interface TopMarketsProps {
  initial: RankedMarket[]
  all: RankedMarket[]
}

const MARKET_LABELS: Record<string, string> = {
  result_1x2: '1X2',
  double_chance: 'DOBLE CHANCE',
  over_under_goals_1_5: 'O/U 1.5',
  over_under_goals_2_5: 'O/U 2.5',
  over_under_goals_3_5: 'O/U 3.5',
  btts: 'AMBOS MARCAN',
  exact_score: 'MARCADOR EXACTO',
  first_scorer: '1er GOLEADOR',
  anytime_scorer: 'GOLEADOR',
  total_cards: 'TARJETAS',
  corners: 'CORNERS',
  clean_sheet: 'PORTERIA 0',
}

function marketLabel(market: string): string {
  return MARKET_LABELS[market] ?? market.toUpperCase().replace(/_/g, ' ')
}

function confidenceBadge(level: string): { label: string; color: string } {
  if (level === 'high') return { label: 'ALTA', color: 'var(--accent)' }
  if (level === 'medium') return { label: 'MEDIA', color: '#888' }
  return { label: 'BAJA', color: '#555' }
}

function ProbBar({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100)
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-3xl font-bold tabular-nums w-16 text-right"
        style={{ color: '#f5c542' }}
      >
        {pct}%
      </span>
      <div className="h-[2px] flex-1 hidden sm:block" style={{ background: 'var(--border)' }}>
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: '#f5c542', transition: 'width 0.3s' }}
        />
      </div>
    </div>
  )
}

export function TopMarkets({ initial, all }: TopMarketsProps) {
  const [expanded, setExpanded] = useState(false)
  const markets = expanded ? all : initial

  if (initial.length === 0) return null

  const hasMore = all.length > initial.length

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
        MERCADOS MAS INTERESANTES
      </h2>
      <div className="flex flex-col border-t" style={{ borderColor: 'var(--border)' }}>
        {markets.map((m, i) => {
          const badge = confidenceBadge(m.confidence)
          return (
            <div
              key={`${m.fixtureId}-${m.market}`}
              className="grid py-4 border-b gap-y-1"
              style={{
                borderColor: 'var(--border)',
                gridTemplateColumns: '1.5rem 1fr auto',
                gridTemplateRows: 'auto auto',
              }}
            >
              <span
                className="text-xs row-span-2 pt-1"
                style={{ color: 'var(--muted)' }}
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-xs tracking-widest"
                  style={{ color: 'var(--muted)' }}
                >
                  {m.fixtureLabel.toUpperCase()}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold tracking-wide text-white">
                    {marketLabel(m.market)}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 tracking-widest"
                    style={{ border: `1px solid ${badge.color}`, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>
                <span className="text-sm tracking-wide" style={{ color: 'var(--muted)' }}>
                  {m.topOutcome.toUpperCase()}
                </span>
              </div>
              <div className="flex items-end pb-1">
                <ProbBar probability={m.topProbability} />
              </div>
            </div>
          )
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs tracking-widest py-3 border-t transition-colors hover:opacity-80"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--accent)',
          }}
        >
          {expanded ? '← OCULTAR ARRIESGADOS' : 'VER MERCADOS ARRIESGADOS →'}
        </button>
      )}
    </section>
  )
}
