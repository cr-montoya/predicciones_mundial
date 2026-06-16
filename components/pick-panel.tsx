'use client'

import { useState, useEffect } from 'react'
import type { FixtureStatus } from '@/lib/types'
import {
  deriveOutcome,
  resolveVerdict,
  type PickOutcome,
  type StoredPick,
} from '@/lib/skills/picks'

interface PickPanelProps {
  fixtureId: number
  status: FixtureStatus
  homeGoals: number | null
  awayGoals: number | null
  homeName: string
  awayName: string
}

const LABEL: Record<PickOutcome, string> = {
  home: 'Local',
  draw: 'Empate',
  away: 'Visita',
}

const OUTCOMES: PickOutcome[] = ['home', 'draw', 'away']

function storageKey(id: number) {
  return `pick_${id}`
}

function loadPick(id: number): StoredPick | null {
  try {
    const raw = localStorage.getItem(storageKey(id))
    return raw ? (JSON.parse(raw) as StoredPick) : null
  } catch {
    return null
  }
}

function savePick(pick: StoredPick) {
  try {
    localStorage.setItem(storageKey(pick.fixtureId), JSON.stringify(pick))
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — silent fail
  }
}

export function PickPanel({
  fixtureId,
  status,
  homeGoals,
  awayGoals,
  homeName,
  awayName,
}: PickPanelProps) {
  const [pick, setPick] = useState<StoredPick | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setPick(loadPick(fixtureId))
    setMounted(true)
  }, [fixtureId])

  // Don't render until hydrated to avoid SSR mismatch
  if (!mounted) return null

  // Finished without a pick: no panel
  if (status === 'finished' && !pick) return null

  const locked = status === 'live' || status === 'finished'

  function handlePick(outcome: PickOutcome) {
    if (locked) return
    const next: StoredPick = {
      fixtureId,
      outcome,
      pickedAt: new Date().toISOString(),
    }
    savePick(next)
    setPick(next)
  }

  const verdict =
    status === 'finished' && pick && homeGoals !== null && awayGoals !== null
      ? resolveVerdict(pick.outcome, homeGoals, awayGoals)
      : null

  const actualOutcome =
    status === 'finished' && homeGoals !== null && awayGoals !== null
      ? deriveOutcome(homeGoals, awayGoals)
      : null

  const headerRight =
    verdict === 'correct'
      ? { label: '✓ ACERTASTE', color: '#22c55e' }
      : verdict === 'incorrect'
        ? { label: '✗ FALLASTE', color: '#ef4444' }
        : status === 'live'
          ? { label: 'EN CURSO', color: '#FFDB00' }
          : null

  return (
    <div style={{
      border: '1px solid rgba(255,219,0,0.12)',
      borderRadius: 10,
      padding: '16px 20px',
      background: 'rgba(255,219,0,0.03)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: '#D4A843',
        }}>
          TU PICK
        </span>
        {headerRight && (
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1px',
            color: headerRight.color,
          }}>
            {headerRight.label}
          </span>
        )}
      </div>

      {/* Verdict detail (finished) */}
      {verdict && pick && (
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10 }}>
          Elegiste: <span style={{ color: '#f0ece4', fontWeight: 600 }}>{LABEL[pick.outcome]}</span>
          {actualOutcome && actualOutcome !== pick.outcome && (
            <span> · Ganó: <span style={{ color: '#f0ece4', fontWeight: 600 }}>{LABEL[actualOutcome]}</span></span>
          )}
          {homeGoals !== null && awayGoals !== null && (
            <span style={{ color: '#6b6d75' }}> ({homeGoals}–{awayGoals})</span>
          )}
        </div>
      )}

      {/* Buttons (hidden when finished) */}
      {status !== 'finished' && (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            {OUTCOMES.map((outcome) => {
              const selected = pick?.outcome === outcome
              return (
                <button
                  key={outcome}
                  onClick={() => handlePick(outcome)}
                  disabled={locked}
                  style={{
                    flex: 1,
                    padding: '9px 4px',
                    borderRadius: 7,
                    border: selected
                      ? '1.5px solid #FFDB00'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: selected
                      ? 'rgba(255,219,0,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    color: selected ? '#FFDB00' : '#9ca3af',
                    fontSize: 12,
                    fontWeight: selected ? 700 : 500,
                    cursor: locked ? 'default' : 'pointer',
                    opacity: locked && !selected ? 0.35 : 1,
                    transition: 'all 0.15s',
                    letterSpacing: '0.3px',
                  }}
                >
                  {outcome === 'home' ? homeName.split(' ')[0] : outcome === 'away' ? awayName.split(' ')[0] : 'Empate'}
                  {selected && ' ✓'}
                </button>
              )
            })}
          </div>

          <p style={{
            marginTop: 10,
            fontSize: 11,
            color: '#6b6d75',
          }}>
            {locked
              ? 'Pick bloqueado mientras el partido está en curso'
              : pick
                ? 'Puedes cambiar tu pick hasta que empiece el partido'
                : 'Elige el resultado antes de que empiece'}
          </p>
        </>
      )}
    </div>
  )
}
