import FormStrip from '@/components/form-strip'
import { getFlag } from '@/lib/utils/flags'
import type { Fixture, H2HMatch } from '@/lib/types'

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de grupos',
  ROUND_OF_32: 'Dieciseisavos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semifinal',
  THIRD_PLACE: '3er puesto',
  FINAL: 'Final',
}

interface Props {
  fixture: Fixture
  allFixtures: Fixture[]
  homeName: string
  awayName: string
  h2h: H2HMatch[]
}

export default function MatchContext({ fixture, allFixtures, homeName, awayName, h2h }: Props) {
  const homeFixtures = allFixtures
    .filter(
      (f) =>
        f.status === 'finished' &&
        (f.homeTeamId === fixture.homeTeamId || f.awayTeamId === fixture.homeTeamId)
    )
    .sort((a, b) => b.kickoffUtc.localeCompare(a.kickoffUtc))
    .slice(0, 3)

  const awayFixtures = allFixtures
    .filter(
      (f) =>
        f.status === 'finished' &&
        (f.homeTeamId === fixture.awayTeamId || f.awayTeamId === fixture.awayTeamId)
    )
    .sort((a, b) => b.kickoffUtc.localeCompare(a.kickoffUtc))
    .slice(0, 3)

  const showForm = homeFixtures.length > 0 || awayFixtures.length > 0
  const showH2H = h2h.length > 0

  if (!showForm && !showH2H) return null

  const homeFlag = getFlag(homeName)
  const awayFlag = getFlag(awayName)

  return (
    <div className="flex flex-col gap-4">
      <span
        className="text-[11px] font-bold tracking-widest uppercase"
        style={{ color: 'var(--accent)' }}
      >
        CONTEXTO
      </span>

      {showForm && (
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--muted)' }}
          >
            Forma reciente
          </span>
          <div className="flex flex-col gap-2">
            <FormStrip
              teamName={homeName}
              flag={homeFlag}
              fixtures={homeFixtures}
              teamId={fixture.homeTeamId}
            />
            <FormStrip
              teamName={awayName}
              flag={awayFlag}
              fixtures={awayFixtures}
              teamId={fixture.awayTeamId}
            />
          </div>
        </div>
      )}

      {showH2H && (
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--muted)' }}
          >
            Encuentros en este Mundial
          </span>
          <div className="flex flex-col gap-2">
            {h2h.map((m) => {
              const stageLabel = STAGE_LABELS[m.stage] ?? m.stage
              return (
                <div
                  key={`${m.date}-${m.homeTeam}-${m.awayTeam}`}
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}
                  className="flex items-center gap-3"
                >
                  {stageLabel && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', borderRadius: 3, padding: '2px 6px', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      {stageLabel}
                    </span>
                  )}
                  <div className="flex items-center gap-2 flex-1" style={{ minWidth: 0, justifyContent: 'center' }}>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', flex: 1 }}>
                      {m.homeTeam}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums" style={{ color: 'var(--text)', flexShrink: 0 }}>
                      {m.homeGoals}<span style={{ color: 'var(--muted)' }}> &ndash; </span>{m.awayGoals}
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', flex: 1 }}>
                      {m.awayTeam}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
