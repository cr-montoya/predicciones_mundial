'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'

const DISMISS_KEY = 'picks_banner_dismissed'
export const UPCOMING_UNPICKED_COUNT_KEY = 'upcoming_unpicked_count'

interface UpcomingFixture {
  id: number
  kickoffUtc: string
  status: string
  label: string
}

function getUnpickedSoon(fixtures: UpcomingFixture[]): UpcomingFixture[] {
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
  fixtures: UpcomingFixture[]
}

export function PicksReminderBanner({ fixtures }: PicksReminderBannerProps) {
  const [unpicked, setUnpicked] = useState<UpcomingFixture[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      if (localStorage.getItem(DISMISS_KEY) === today) {
        setDismissed(true)
        return
      }
      const soon = getUnpickedSoon(fixtures)
      setUnpicked(soon)
      localStorage.setItem(UPCOMING_UNPICKED_COUNT_KEY, String(soon.length))
    } catch {
      // localStorage unavailable (private mode)
    }
  }, [fixtures])

  const count = unpicked.length

  if (count === 0 || dismissed) return null

  const today = new Date().toISOString().slice(0, 10)
  const heading =
    count === 1
      ? 'Tienes 1 partido próximo sin pick'
      : `Tienes ${count} partidos próximos sin pick`

  return (
    <FadeIn>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: '1 1 240px', minWidth: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FFDB00',
              flexShrink: 0,
              animation: 'pulseGlow 2s infinite',
              display: 'inline-block',
              marginTop: 5,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0ece4', lineHeight: 1.3 }}>
              {heading}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {unpicked.map((f) => (
                <Link
                  key={f.id}
                  href={`/fixtures/${f.id}`}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: '#08090d',
                    background: '#FFDB00',
                    padding: '6px 12px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    alignSelf: 'flex-start',
                  }}
                >
                  {f.label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
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
    </FadeIn>
  )
}
