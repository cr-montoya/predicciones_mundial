import WdlBadge from '@/components/wdl-badge'
import type { Fixture } from '@/lib/types'

interface Props {
  teamName: string
  flag: string
  fixtures: Fixture[]
  teamId: number
}

export default function FormStrip({ teamName, flag, fixtures, teamId }: Props) {
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
      }}
      className="flex items-center gap-3"
    >
      <div className="flex items-center gap-2" style={{ width: 132, flexShrink: 0, minWidth: 0 }}>
        {flag && <span style={{ fontSize: 15, flexShrink: 0 }}>{flag}</span>}
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {teamName}
        </span>
      </div>
      {fixtures.length > 0 ? (
        <div className="flex items-center gap-1.5">
          {fixtures.map((f) => {
            const isHome = f.homeTeamId === teamId
            const scored = isHome ? f.homeGoals : f.awayGoals
            const conceded = isHome ? f.awayGoals : f.homeGoals
            const result: 'W' | 'D' | 'L' =
              scored != null && conceded != null
                ? scored > conceded ? 'W' : scored === conceded ? 'D' : 'L'
                : 'D'
            return <WdlBadge key={f.id} result={result} />
          })}
        </div>
      ) : (
        <span className="text-[11px]" style={{ color: 'var(--muted2)' }}>
          Sin partidos aún
        </span>
      )}
    </div>
  )
}
