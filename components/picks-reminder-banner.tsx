'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import type { Fixture } from '@/lib/types'

const DISMISS_KEY = 'picks_banner_dismissed'
export const UPCOMING_UNPICKED_COUNT_KEY = 'upcoming_unpicked_count'

function getUnpickedSoon(fixtures: Fixture[]): Fixture[] {
  const now = Date.now()
  const sixHours = 6 * 60 * 60 * 1000
  return fixtures.filter((f) => {
    if (f.status !== 'scheduled') return false
    const kickoff = new Date(f.kickoffUtc).getTime()
    if (kickoff - now > sixHours || kickoff < now) return false
    try {
      return !localStorage.getItem(`pick_${f.id}`)
    } catch {
      return true
    }
  })
}

interface PicksReminderBannerProps {
  fixtures: Fixture[]
}

export function PicksReminderBanner({ fixtures }: PicksReminderBannerProps) {
  const [count, setCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      if (localStorage.getItem(DISMISS_KEY) === today) {
        setDismissed(true)
        return
      }
      const unpicked = getUnpickedSoon(fixtures)
      const n = unpicked.length
      setCount(n)
      localStorage.setItem(UPCOMING_UNPICKED_COUNT_KEY, String(n))
    } catch {
      // localStorage unavailable (private mode)
    }
  }, [fixtures])

  if (count === 0 || dismissed) return null

  const today = new Date().toISOString().slice(0, 10)
  const text =
    count === 1
      ? `Tienes 1 partido próximo sin pick · Haz tu predicción`
      : `Tienes ${count} partidos próximos sin pick · Haz tu predicción`

  return (
    <FadeIn>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: 'rgba(255,219,0,0.06)',
          border: '1px solid rgba(255,219,0,0.18)',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: '1 1 240px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FFDB00',
              flexShrink: 0,
              animation: 'pulseGlow 2s infinite',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#f0ece4',
              lineHeight: 1.3,
            }}
          >
            {text}
          </span>
        </div>
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Link
            href="/fixtures"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: '#08090d',
              background: '#FFDB00',
              padding: '7px 14px',
              borderRadius: 6,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            VER PARTIDOS →
          </Link>
          <button
            onClick={() => {
              try {
                localStorage.setItem(DISMISS_KEY, today)
              } catch {
                // localStorage unavailable
              }
              setDismissed(true)
            }}
            aria-label="Cerrar aviso"
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: '#6b6d75',
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      </div>
    </FadeIn>
  )
}
