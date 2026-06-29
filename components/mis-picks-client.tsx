'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { StoredPick, PickOutcome } from '@/lib/skills/picks'
import { resolveVerdict } from '@/lib/skills/picks'
import { PickResultRow } from './pick-result-row'
import type { PickableFixture } from '@/app/mis-picks/page'
import { useTranslation } from '@/lib/i18n/hook'

interface EnrichedPick {
  pick: StoredPick
  fixture: PickableFixture
  verdict: 'correct' | 'incorrect' | null
}

function Section({ title, picks, accent }: { title: string; picks: EnrichedPick[]; accent?: string }) {
  if (picks.length === 0) return null
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: accent ?? '#6b6d75',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {title} <span style={{ fontWeight: 400, color: '#6b6d75' }}>({picks.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {picks.map(({ pick, fixture, verdict }) => (
          <PickResultRow
            key={fixture.id}
            fixtureId={fixture.id}
            homeTeamName={fixture.homeTeamName}
            awayTeamName={fixture.awayTeamName}
            status={fixture.status}
            homeGoals={fixture.homeGoals}
            awayGoals={fixture.awayGoals}
            kickoffUtc={fixture.kickoffUtc}
            outcome={pick.outcome as PickOutcome}
            verdict={verdict}
          />
        ))}
      </div>
    </section>
  )
}

export function MisPicksClient({ fixtures }: { fixtures: PickableFixture[] }) {
  const { t } = useTranslation()
  const [picks, setPicks] = useState<EnrichedPick[] | null>(null)

  useEffect(() => {
    const enriched: EnrichedPick[] = []
    for (const fixture of fixtures) {
      const raw = localStorage.getItem(`pick_${fixture.id}`)
      if (!raw) continue
      try {
        const pick: StoredPick = JSON.parse(raw)
        const verdict =
          fixture.status === 'finished' &&
          fixture.homeGoals !== null &&
          fixture.awayGoals !== null
            ? resolveVerdict(pick.outcome, fixture.homeGoals, fixture.awayGoals)
            : null
        enriched.push({ pick, fixture, verdict })
      } catch {
        // skip malformed picks
      }
    }
    enriched.sort((a, b) => b.fixture.kickoffUtc.localeCompare(a.fixture.kickoffUtc))
    setPicks(enriched)
  }, [fixtures])

  if (picks === null) return null

  if (picks.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '64px 24px',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
        <p style={{ fontSize: 16, color: '#9ca3af', marginBottom: 8 }}>
          {t.myPicks.emptyState}
        </p>
        <p style={{ fontSize: 13, color: '#6b6d75', marginBottom: 24 }}>
          {t.myPicks.emptyHint}
        </p>
        <Link href="/fixtures" style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: '#FFDB00',
          color: '#08090d',
          fontWeight: 700,
          fontSize: 13,
          borderRadius: 8,
          textDecoration: 'none',
          letterSpacing: '0.5px',
        }}>
          {t.myPicks.viewFixtures}
        </Link>
      </div>
    )
  }

  const resolved = picks.filter(p => p.fixture.status === 'finished')
  const live = picks.filter(p => p.fixture.status === 'live')
  const pending = picks.filter(p => p.fixture.status === 'scheduled')
  const correct = resolved.filter(p => p.verdict === 'correct').length
  const pct = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0

  return (
    <div>
      {resolved.length > 0 && (
        <div style={{
          background: 'rgba(255,219,0,0.02)',
          border: '1px solid rgba(255,219,0,0.08)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: '#9ca3af' }}>
              {t.myPicks.accuracy(correct, resolved.length)}
            </span>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#FFDB00', letterSpacing: '-1px' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`,
              height: '100%',
              background: '#FFDB00',
              borderRadius: 3,
            }} />
          </div>
        </div>
      )}

      <Section title={t.myPicks.live} picks={live} accent="#f59e0b" />
      <Section title={t.myPicks.resolved} picks={resolved} />
      <Section title={t.myPicks.pending} picks={pending} />
    </div>
  )
}
