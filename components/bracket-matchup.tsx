import type { Fixture, Team, ModelOutput } from '@/lib/types'
import { getFlag } from '@/lib/utils/flags'
import { topModelCall, deriveActualOutcome } from '@/lib/skills/accuracy'

interface BracketMatchupProps {
  fixture: Fixture
  homeTeam: Team | undefined
  awayTeam: Team | undefined
  prediction: ModelOutput | undefined
}

function teamRow(
  name: string,
  flag: string | null,
  score: number | null | undefined,
  prob: number | null,
  isWinner: boolean,
  isTopCall: boolean,
  isFinished: boolean,
) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{flag ?? '🏳️'}</span>
      <span style={{
        flex: 1,
        fontSize: 13,
        fontWeight: isWinner || (!isFinished && isTopCall) ? 700 : 400,
        color: isWinner ? '#FFDB00' : '#f0ece4',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      {isFinished && score !== null && score !== undefined ? (
        <span style={{
          fontSize: 16,
          fontWeight: 700,
          color: isWinner ? '#FFDB00' : '#6b6d75',
          flexShrink: 0,
        }}>
          {score}
        </span>
      ) : prob !== null ? (
        <span style={{
          fontSize: 12,
          fontWeight: isTopCall ? 700 : 400,
          color: isTopCall ? '#FFDB00' : '#6b6d75',
          flexShrink: 0,
        }}>
          {prob}%
        </span>
      ) : null}
    </div>
  )
}

export function BracketMatchup({ fixture, homeTeam, awayTeam, prediction }: BracketMatchupProps) {
  const homeName = homeTeam?.name ?? 'Por definir'
  const awayName = awayTeam?.name ?? 'Por definir'
  const homeFlag = homeTeam ? getFlag(homeTeam.name) : null
  const awayFlag = awayTeam ? getFlag(awayTeam.name) : null
  const isFinished = fixture.status === 'finished'

  const probs = prediction?.probabilities
  const homeProb = probs ? Math.round((probs['home'] ?? 0) * 100) : null
  const drawProb = probs ? Math.round((probs['draw'] ?? 0) * 100) : null
  const awayProb = probs ? Math.round((probs['away'] ?? 0) * 100) : null
  const topCall = probs ? topModelCall(probs) : null

  const actual = isFinished && fixture.homeGoals !== null && fixture.awayGoals !== null
    ? deriveActualOutcome(fixture.homeGoals, fixture.awayGoals)
    : null

  const homeWon = actual === 'home'
  const awayWon = actual === 'away'

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '14px 16px',
      background: 'rgba(255,255,255,0.02)',
      minWidth: 200,
      width: '100%',
    }}>
      {teamRow(homeName, homeFlag, fixture.homeGoals, homeProb, homeWon, topCall === 'home', isFinished)}

      {/* Draw row — only shown when not finished and prediction available */}
      {!isFinished && drawProb !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '6px 0',
          paddingLeft: 24,
        }}>
          <span style={{ fontSize: 11, color: '#6b6d75' }}>Empate (90 min)</span>
          <span style={{
            fontSize: 12,
            fontWeight: topCall === 'draw' ? 700 : 400,
            color: topCall === 'draw' ? '#FFDB00' : '#6b6d75',
          }}>
            {drawProb}%
          </span>
        </div>
      )}

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'rgba(255,255,255,0.05)',
        margin: isFinished ? '8px 0' : '6px 0',
      }} />

      {teamRow(awayName, awayFlag, fixture.awayGoals, awayProb, awayWon, topCall === 'away', isFinished)}

      {fixture.status === 'live' && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#ef4444', fontWeight: 700, letterSpacing: '1px' }}>
          EN VIVO
        </div>
      )}
    </div>
  )
}
