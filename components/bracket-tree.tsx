'use client'

import type { ResolvedMatchup } from './bracket-matchup'
import { topModelCall } from '@/lib/skills/accuracy'
import { getTla } from '@/lib/utils/tla'
import { getFlag } from '@/lib/utils/flags'
import { useTranslation } from '@/lib/i18n/hook'

const LINE = 'rgba(255,219,0,0.18)'
const CARD_W = 176
const CONN_W = 28
const CARD_H = 56  // two 28px rows

interface SlotProps {
  name: string | null
  posLabel: string
  prob: number | null
  isLeading: boolean
  isTop: boolean
}

function SlotRow({ name, posLabel, prob, isLeading, isTop }: SlotProps) {
  const flag = name ? getFlag(name) : null
  const tla = name ? getTla(name) : posLabel

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: CARD_H / 2,
      padding: '0 10px',
      borderBottom: isTop ? `1px solid rgba(255,255,255,0.06)` : 'none',
    }}>
      <span style={{ fontSize: 13, width: 20, textAlign: 'center', flexShrink: 0 }}>
        {flag ?? '🏳️'}
      </span>
      <span style={{
        fontSize: 11,
        fontWeight: isLeading ? 700 : 500,
        color: isLeading ? '#FFDB00' : name ? '#e0ddd6' : '#6b6d75',
        flex: 1,
        letterSpacing: '0.5px',
      }}>
        {tla}
      </span>
      {prob !== null && (
        <span style={{
          fontSize: 11,
          fontWeight: isLeading ? 700 : 400,
          color: isLeading ? '#FFDB00' : '#9ca3af',
        }}>
          {prob}%
        </span>
      )}
    </div>
  )
}

function MatchCard({ matchup, isProjected }: { matchup: ResolvedMatchup; isProjected: boolean }) {
  const probs = matchup.prediction?.probabilities
  const topCall = probs ? topModelCall(probs) : null
  const homeProb = probs ? Math.round((probs['home'] ?? 0) * 100) : null
  const awayProb = probs ? Math.round((probs['away'] ?? 0) * 100) : null

  return (
    <div style={{
      width: CARD_W,
      height: CARD_H,
      border: `1px solid ${isProjected ? 'rgba(255,219,0,0.12)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 6,
      background: 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <SlotRow
        name={matchup.home.name}
        posLabel={matchup.home.positionLabel}
        prob={homeProb}
        isLeading={topCall === 'home'}
        isTop={true}
      />
      <SlotRow
        name={matchup.away.name}
        posLabel={matchup.away.positionLabel}
        prob={awayProb}
        isLeading={topCall === 'away'}
        isTop={false}
      />
    </div>
  )
}

function TbdCard({ label }: { label: string }) {
  return (
    <div style={{
      width: CARD_W,
      height: CARD_H,
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 6,
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 10, color: '#4b4d54', letterSpacing: '1px' }}>{label}</span>
    </div>
  )
}

/** Vertical bracket connector: two cards on left feed into one slot on right */
function BracketPair({
  top,
  bottom,
  next,
  isProjected,
}: {
  top: ResolvedMatchup
  bottom: ResolvedMatchup
  next: React.ReactNode
  isProjected: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* Left: two matches stacked */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Top match */}
        <div style={{
          paddingRight: CONN_W / 2,
          paddingBottom: 4,
          borderRight: `1px solid ${LINE}`,
          borderBottom: `1px solid ${LINE}`,
        }}>
          <MatchCard matchup={top} isProjected={isProjected} />
        </div>
        {/* Bottom match */}
        <div style={{
          paddingRight: CONN_W / 2,
          paddingTop: 4,
          borderRight: `1px solid ${LINE}`,
          borderTop: `1px solid ${LINE}`,
        }}>
          <MatchCard matchup={bottom} isProjected={isProjected} />
        </div>
      </div>
      {/* Horizontal connector */}
      <div style={{ width: CONN_W / 2, height: 1, background: LINE, flexShrink: 0 }} />
      {/* Right: next-round slot centered */}
      <div>
        {next}
      </div>
    </div>
  )
}

export function BracketTree({ matchups }: { matchups: ResolvedMatchup[] }) {
  const { t } = useTranslation()
  const ROUND_LABELS = [t.bracket.r16, t.bracket.quarters, t.bracket.semis, t.bracket.final]

  // Pair R32 matches: (M73,M74) → R16_1, (M75,M76) → R16_2, …
  const pairs: Array<[ResolvedMatchup, ResolvedMatchup]> = []
  for (let i = 0; i < matchups.length - 1; i += 2) {
    pairs.push([matchups[i], matchups[i + 1]])
  }

  // 4 later rounds (R16 → QF → SF → F): column counts 8, 4, 2, 1
  const laterRounds = [8, 4, 2, 1]

  const totalH = pairs.length * (CARD_H * 2 + 8 + 16)

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 8 }}>
      {/* Column headers */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, paddingLeft: CARD_W + CONN_W }}>
        {[t.bracket.round32, ...ROUND_LABELS].map((label, i) => (
          <div key={label} style={{
            width: i === 0 ? CARD_W + CONN_W : CARD_W + CONN_W,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#6b6d75',
            textTransform: 'uppercase',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {/* R32 column: 8 pairs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
          {pairs.map(([top, bottom], i) => (
            <BracketPair
              key={`pair-${i}`}
              top={top}
              bottom={bottom}
              isProjected={top.home.isProjected || top.away.isProjected}
              next={<TbdCard label={t.bracket.tbd} />}
            />
          ))}
        </div>

        {/* R16, QF, SF, F columns */}
        {laterRounds.slice(1).map((count, roundIdx) => {
          const label = ROUND_LABELS[roundIdx + 1]
          const itemH = totalH / count
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{
                  height: itemH,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: CONN_W / 2,
                }}>
                  <TbdCard label={t.bracket.tbd} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
