'use client'

import { useState } from 'react'
import type { ModelOutput } from '@/lib/types'
import { getFlag } from '@/lib/utils/flags'

function displayName(key: string): string {
  const parts = key.split('_')
  if (parts.length > 1 && /^\d+$/.test(parts[0])) {
    return parts.slice(1).join('_')
  }
  return key
}

function rankColor(pos: number): string {
  if (pos === 0) return '#FFDB00'
  if (pos <= 2) return '#D4A843'
  return '#887044'
}

interface CandidatesProps {
  winner: ModelOutput | undefined
  boot: ModelOutput | undefined
}

interface CandidateListProps {
  output: ModelOutput
  title: string
  showBar?: boolean
}

function CandidateList({ output, title, showBar = true }: CandidateListProps) {
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
          const name = displayName(key)
          const flag = getFlag(name)
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
              {flag && <span style={{ fontSize: 18, flexShrink: 0 }}>{flag}</span>}
              <span style={{ fontSize: 14, color: '#f0ece4', flex: 1, fontWeight: 500, minWidth: 0 }}>
                {name}
              </span>
              {showBar && (
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
              )}
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
            {expanded ? '← Ocultar' : 'Ver más →'}
          </button>
        </div>
      )}
    </div>
  )
}

export function Candidates({ winner, boot }: CandidatesProps) {
  if (!winner && !boot) return null

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
        Proyecciones del Torneo
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {winner && (
          <CandidateList output={winner} title="🏆 Candidatos a Campeón" showBar />
        )}
        {boot && (
          <CandidateList output={boot} title="👟 Candidatos a Bota de Oro" showBar={false} />
        )}
      </div>
    </section>
  )
}
