import type { ModelOutput } from '@/lib/types'
import { getFlag } from '@/lib/utils/flags'
import { topModelCall, deriveActualOutcome } from '@/lib/skills/accuracy'

export interface ResolvedTeam {
  teamId: number | null
  name: string | null
  positionLabel: string
  isProjected: boolean
}

export interface ResolvedMatchup {
  matchId: string
  home: ResolvedTeam
  away: ResolvedTeam
  prediction?: ModelOutput
  confirmedScore?: { homeGoals: number; awayGoals: number }
  isLive?: boolean
}

function TeamRow({
  team,
  score,
  isWinner,
  isTopCall,
  prob,
  isFinished,
}: {
  team: ResolvedTeam
  score?: number | null
  isWinner: boolean
  isTopCall: boolean
  prob: number | null
  isFinished: boolean
}) {
  const flag = team.name ? getFlag(team.name) : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 15, flexShrink: 0, width: 22, textAlign: 'center' }}>
        {flag ?? '🏳️'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: isWinner || (!isFinished && isTopCall) ? 700 : 400,
          color: isWinner ? '#FFDB00' : team.name ? '#f0ece4' : '#6b6d75',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {team.name ?? team.positionLabel}
        </div>
        {team.isProjected && team.name && (
          <div style={{ fontSize: 10, color: '#6b6d75', letterSpacing: '0.5px' }}>
            {team.positionLabel}
          </div>
        )}
      </div>
      {isFinished && score !== null && score !== undefined ? (
        <span style={{ fontSize: 16, fontWeight: 700, color: isWinner ? '#FFDB00' : '#9ca3af', flexShrink: 0 }}>
          {score}
        </span>
      ) : prob !== null ? (
        <span style={{ fontSize: 12, fontWeight: isTopCall ? 700 : 400, color: isTopCall ? '#FFDB00' : '#6b6d75', flexShrink: 0 }}>
          {prob}%
        </span>
      ) : null}
    </div>
  )
}

export function BracketMatchup({ matchId, home, away, prediction, confirmedScore, isLive }: ResolvedMatchup) {
  const isFinished = confirmedScore !== undefined
  const probs = prediction?.probabilities
  const homeProb = probs ? Math.round((probs['home'] ?? 0) * 100) : null
  const drawProb = probs ? Math.round((probs['draw'] ?? 0) * 100) : null
  const awayProb = probs ? Math.round((probs['away'] ?? 0) * 100) : null
  const topCall = probs ? topModelCall(probs) : null

  const actual = confirmedScore
    ? deriveActualOutcome(confirmedScore.homeGoals, confirmedScore.awayGoals)
    : null
  const homeWon = actual === 'home'
  const awayWon = actual === 'away'

  const anyProjected = home.isProjected || away.isProjected

  return (
    <div style={{
      border: `1px solid ${anyProjected && !isFinished ? 'rgba(255,219,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      padding: '14px 16px',
      background: anyProjected && !isFinished ? 'rgba(255,219,0,0.01)' : 'rgba(255,255,255,0.02)',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 10, color: '#6b6d75', letterSpacing: '1px', fontWeight: 600 }}>
          {matchId}
        </span>
        {anyProjected && !isFinished && (
          <span style={{ fontSize: 9, color: '#FFDB00', letterSpacing: '1px', fontWeight: 700, opacity: 0.7 }}>
            PROYECTADO
          </span>
        )}
        {isLive && (
          <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, letterSpacing: '1px' }}>
            EN VIVO
          </span>
        )}
      </div>

      <TeamRow
        team={home}
        score={confirmedScore?.homeGoals}
        isWinner={homeWon}
        isTopCall={topCall === 'home'}
        prob={homeProb}
        isFinished={isFinished}
      />

      {!isFinished && drawProb !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', paddingLeft: 30 }}>
          <span style={{ fontSize: 10, color: '#6b6d75' }}>Empate (90 min)</span>
          <span style={{ fontSize: 11, color: topCall === 'draw' ? '#FFDB00' : '#6b6d75', fontWeight: topCall === 'draw' ? 700 : 400 }}>
            {drawProb}%
          </span>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />

      <TeamRow
        team={away}
        score={confirmedScore?.awayGoals}
        isWinner={awayWon}
        isTopCall={topCall === 'away'}
        prob={awayProb}
        isFinished={isFinished}
      />
    </div>
  )
}
