'use client'

import { useState } from 'react'
import type { ModelOutput } from '@/lib/types'
import type { CandidateRow } from '@/lib/skills/normalize-scorer-name'
import { useTranslation } from '@/lib/i18n/hook'

function rankColor(pos: number): string {
  if (pos === 0) return '#FFDB00'
  if (pos <= 2) return '#D4A843'
  return '#887044'
}

function formatComputedAt(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

interface WinnerListProps {
  output: ModelOutput
  title: string
}

function WinnerList({ output, title }: WinnerListProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const sorted = Object.entries(output.probabilities).sort(([, a], [, b]) => b - a)
  const displayed = expanded ? sorted : sorted.slice(0, 5)
  const hasMore = sorted.length > 5
  const topProb = sorted[0]?.[1] ?? 1

  return (
    <div style={{
      background: 'rgba(255,219,0,0.02)',
      border: '1px solid rgba(255,219,0,0.06)',
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{
        fontSize: 12,
        color: '#D4A843',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 16,
      }}>
        {title}
      </div>

      <div>
        {displayed.map(([key, prob], i) => {
          const pct = Math.round(prob * 100)
          const color = rankColor(i)
          const barWidth = `${Math.round((prob / topProb) * 100)}%`

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: 12, color: '#6b6d75', width: 16, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: '#f0ece4', flex: 1, fontWeight: 500, minWidth: 0 }}>
                {key}
              </span>
              <div style={{
                width: 60,
                height: 4,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                <div style={{ width: barWidth, height: '100%', background: color, borderRadius: 2 }} />
              </div>
              <span style={{
                fontSize: 15,
                color,
                fontWeight: 700,
                width: 40,
                textAlign: 'right',
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
            }}
          >
            {expanded ? t.candidates.hide : t.candidates.viewMore}
          </button>
        </div>
      )}
    </div>
  )
}

interface BootListProps {
  candidates: CandidateRow[]
  computedAt: string
  title: string
}

function BootList({ candidates, computedAt, title }: BootListProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const displayed = expanded ? candidates : candidates.slice(0, 5)
  const hasMore = candidates.length > 5
  const computedDate = formatComputedAt(computedAt)

  return (
    <div style={{
      background: 'rgba(255,219,0,0.02)',
      border: '1px solid rgba(255,219,0,0.06)',
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{
        fontSize: 12,
        color: '#D4A843',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: computedDate ? 4 : 16,
      }}>
        {title}
      </div>

      {computedDate && (
        <div style={{ fontSize: 11, color: '#6b6d75', marginBottom: 14 }}>
          {t.candidates.probabilitiesAt} {computedDate}
        </div>
      )}

      <div>
        {displayed.map((row, i) => {
          const color = rankColor(i)
          const pct = row.probability !== null ? `${Math.round(row.probability * 100)}%` : '—'
          const goals = row.goals && row.goals > 0
            ? row.goals === 1 ? t.goalsLabel.one : t.goalsLabel.many(row.goals)
            : '—'
          const hasGoals = (row.goals ?? 0) > 0

          return (
            <div
              key={`${row.playerName}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: 12, color: '#6b6d75', width: 16, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: '#f0ece4', flex: 1, fontWeight: 500, minWidth: 0 }}>
                {row.playerName}
              </span>
              <span style={{
                fontSize: 13,
                color: hasGoals ? '#02B906' : '#555',
                fontWeight: hasGoals ? 600 : 400,
                width: 64,
                textAlign: 'right',
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {goals}
              </span>
              <span style={{
                fontSize: 15,
                color,
                fontWeight: 700,
                width: 40,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {pct}
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
            }}
          >
            {expanded ? t.candidates.hide : t.candidates.viewMore}
          </button>
        </div>
      )}
    </div>
  )
}

interface CandidatesProps {
  winner: ModelOutput | undefined
  boot: ModelOutput | undefined
  candidates: CandidateRow[]
  goldenBootComputedAt: string
}

export function Candidates({ winner, boot, candidates, goldenBootComputedAt }: CandidatesProps) {
  const { t } = useTranslation()

  if (!winner && !boot && candidates.length === 0) return null

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
        {t.candidates.sectionTitle}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {winner && (
          <WinnerList output={winner} title={t.candidates.champion} />
        )}
        {candidates.length > 0 && (
          <BootList
            candidates={candidates}
            computedAt={goldenBootComputedAt}
            title={t.candidates.goldenBoot}
          />
        )}
      </div>
    </section>
  )
}
