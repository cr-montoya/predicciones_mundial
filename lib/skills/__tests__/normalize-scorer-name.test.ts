import { describe, it, expect } from 'vitest'
import {
  normalizeName,
  mergeScorersWithCandidates,
  type CandidateRow,
  type LiveScorer,
} from '@/lib/skills/normalize-scorer-name'

// ---------------------------------------------------------------------------
// normalizeName
// ---------------------------------------------------------------------------

describe('normalizeName', () => {
  it('strips accent from é — Mbappé → mbappe', () => {
    expect(normalizeName('Mbappé')).toBe('mbappe')
  })

  it('strips multiple accents — Lautaro Martínez → lautaro martinez', () => {
    expect(normalizeName('Lautaro Martínez')).toBe('lautaro martinez')
  })

  it('lowercases ASCII letters', () => {
    expect(normalizeName('RONALDO')).toBe('ronaldo')
  })

  it('trims leading whitespace', () => {
    expect(normalizeName('  Neymar')).toBe('neymar')
  })

  it('trims trailing whitespace', () => {
    expect(normalizeName('Neymar  ')).toBe('neymar')
  })

  it('trims both sides and strips accents together', () => {
    expect(normalizeName('  Özil  ')).toBe('ozil')
  })

  it('preserves spaces between words', () => {
    expect(normalizeName('Kylian Mbappé')).toBe('kylian mbappe')
  })

  it('empty string stays empty', () => {
    expect(normalizeName('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCandidate(
  playerName: string,
  teamId: number | null,
  probability: number | null,
  goals: number | null = null,
): CandidateRow {
  return { playerName, teamId, probability, goals }
}

function makeScorer(
  playerName: string,
  teamId: number,
  goals: number,
  assists = 0,
  playerId = 1,
): LiveScorer {
  return { playerId, playerName, teamId, goals, assists }
}

// ---------------------------------------------------------------------------
// mergeScorersWithCandidates — fallback (empty liveScorers)
// ---------------------------------------------------------------------------

describe('mergeScorersWithCandidates — empty liveScorers', () => {
  it('returns candidates unchanged when liveScorers is []', () => {
    const candidates = [
      makeCandidate('Mbappé', 1, 0.3),
      makeCandidate('Benzema', 1, 0.2),
      makeCandidate('Griezmann', 2, 0.1),
    ]
    const result = mergeScorersWithCandidates(candidates, [])
    expect(result).toStrictEqual(candidates)
  })

  it('returns empty array when both inputs are empty', () => {
    expect(mergeScorersWithCandidates([], [])).toStrictEqual([])
  })
})

// ---------------------------------------------------------------------------
// mergeScorersWithCandidates — merge logic
// ---------------------------------------------------------------------------

describe('mergeScorersWithCandidates — merge logic', () => {
  it('player in both sources: gets goals from scorer, keeps probability', () => {
    const candidates = [makeCandidate('Mbappé', 10, 0.35)]
    const scorers = [makeScorer('Mbappé', 10, 3)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const player = result.find(r => normalizeName(r.playerName) === 'mbappe')
    expect(player).toBeDefined()
    expect(player!.goals).toBe(3)
    expect(player!.probability).toBe(0.35)
  })

  it('player only in JSON (no scorer match): keeps probability, goals stays null', () => {
    const candidates = [
      makeCandidate('Benzema', 10, 0.25),
      makeCandidate('Mbappé', 10, 0.35),
    ]
    const scorers = [makeScorer('Mbappé', 10, 2)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const benzema = result.find(r => normalizeName(r.playerName) === 'benzema')
    expect(benzema).toBeDefined()
    expect(benzema!.goals).toBeNull()
    expect(benzema!.probability).toBe(0.25)
  })

  it('player only in live scorers (not in JSON): added with probability null, gets goals', () => {
    const candidates = [makeCandidate('Benzema', 10, 0.25)]
    const scorers = [makeScorer('Messi', 5, 5)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const messi = result.find(r => normalizeName(r.playerName) === 'messi')
    expect(messi).toBeDefined()
    expect(messi!.goals).toBe(5)
    expect(messi!.probability).toBeNull()
    expect(messi!.teamId).toBe(5)
  })

  it('same name, different team: team-scoped match wins; no name-only collision when both teams have a scorer', () => {
    // Both team 1 and team 2 have a "Silva" in live scorers with different goal counts.
    // The candidate for team 1 must receive 2 goals (team-scoped match).
    // The candidate for team 2 must receive 5 goals (team-scoped match).
    const candidates = [
      makeCandidate('Silva', 1, 0.4),
      makeCandidate('Silva', 2, 0.3),
    ]
    const scorers = [makeScorer('Silva', 1, 2, 0, 1), makeScorer('Silva', 2, 5, 0, 2)]
    const result = mergeScorersWithCandidates(candidates, scorers)

    const silvaTeam1 = result.find(r => r.teamId === 1)
    const silvaTeam2 = result.find(r => r.teamId === 2)

    expect(silvaTeam1!.goals).toBe(2)
    expect(silvaTeam2!.goals).toBe(5)
  })

  it('fallback to name-only match when candidate teamId is null', () => {
    const candidates = [makeCandidate('Mbappé', null, 0.4)]
    const scorers = [makeScorer('Mbappé', 10, 2)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const player = result.find(r => normalizeName(r.playerName) === 'mbappe')
    expect(player!.goals).toBe(2)
    expect(player!.probability).toBe(0.4)
  })

  it('teamId+name match takes priority over name-only when both could match', () => {
    // Candidate has teamId 10, there is a scorer for teamId 10 and another for teamId 99.
    // Should match teamId 10 scorer (3 goals), not teamId 99 scorer (1 goal).
    const candidates = [makeCandidate('Mbappé', 10, 0.35)]
    const scorers = [makeScorer('Mbappé', 99, 1, 0, 1), makeScorer('Mbappé', 10, 3, 0, 2)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const player = result.find(r => r.teamId === 10)
    expect(player!.goals).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// mergeScorersWithCandidates — name normalization in matching
// ---------------------------------------------------------------------------

describe('mergeScorersWithCandidates — name normalization in matching', () => {
  it('"Kylian Mbappé" in candidates matches "Kylian Mbappé" in live scorer', () => {
    const candidates = [makeCandidate('Kylian Mbappé', 10, 0.4)]
    const scorers = [makeScorer('Kylian Mbappé', 10, 4)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    expect(result[0].goals).toBe(4)
    expect(result[0].probability).toBe(0.4)
  })

  it('accent mismatch still matches: "Martínez" candidate vs "Martinez" scorer', () => {
    const candidates = [makeCandidate('Lautaro Martínez', 7, 0.3)]
    const scorers = [makeScorer('Lautaro Martinez', 7, 2)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const player = result.find(r => r.teamId === 7)
    expect(player!.goals).toBe(2)
    expect(player!.probability).toBe(0.3)
  })
})

// ---------------------------------------------------------------------------
// mergeScorersWithCandidates — sort order
// ---------------------------------------------------------------------------

describe('mergeScorersWithCandidates — sort order', () => {
  it('players with goals appear before players without goals', () => {
    const candidates = [
      makeCandidate('Benzema', 1, 0.3),    // no goals after merge
      makeCandidate('Mbappé', 1, 0.35),    // will get 2 goals
    ]
    const scorers = [makeScorer('Mbappé', 1, 2)]
    const result = mergeScorersWithCandidates(candidates, scorers)

    const firstWithGoals = result.findIndex(r => (r.goals ?? 0) > 0)
    const firstNoGoals = result.findIndex(r => (r.goals ?? 0) === 0)
    expect(firstWithGoals).toBeLessThan(firstNoGoals)
  })

  it('among players with goals: sorted by goals desc', () => {
    const candidates = [
      makeCandidate('A', 1, 0.3),
      makeCandidate('B', 1, 0.25),
      makeCandidate('C', 1, 0.2),
    ]
    const scorers = [
      makeScorer('A', 1, 1),
      makeScorer('B', 1, 3),
      makeScorer('C', 1, 2),
    ]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const goalPlayers = result.filter(r => (r.goals ?? 0) > 0)
    expect(goalPlayers[0].goals).toBe(3)
    expect(goalPlayers[1].goals).toBe(2)
    expect(goalPlayers[2].goals).toBe(1)
  })

  it('tiebreak in goals: sorted by probability desc', () => {
    const candidates = [
      makeCandidate('LowProb', 1, 0.1),
      makeCandidate('HighProb', 1, 0.5),
      makeCandidate('MidProb', 1, 0.3),
    ]
    const scorers = [
      makeScorer('LowProb', 1, 2),
      makeScorer('HighProb', 1, 2),
      makeScorer('MidProb', 1, 2),
    ]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const goalPlayers = result.filter(r => (r.goals ?? 0) > 0)
    expect(goalPlayers[0].probability).toBe(0.5)
    expect(goalPlayers[1].probability).toBe(0.3)
    expect(goalPlayers[2].probability).toBe(0.1)
  })

  it('among players with no goals: sorted by probability desc', () => {
    const candidates = [
      makeCandidate('X', 1, 0.1),
      makeCandidate('Y', 1, 0.4),
      makeCandidate('Z', 1, 0.2),
    ]
    // No scorers match, no one has goals
    const scorers = [makeScorer('Unknown', 99, 1)]
    const result = mergeScorersWithCandidates(candidates, scorers)
    const noGoalPlayers = result.filter(r => (r.goals ?? 0) === 0)
    expect(noGoalPlayers[0].probability).toBe(0.4)
    expect(noGoalPlayers[1].probability).toBe(0.2)
    expect(noGoalPlayers[2].probability).toBe(0.1)
  })

  it('mixed: goals desc, then no-goals by probability desc', () => {
    const candidates = [
      makeCandidate('NoGoalHigh', 1, 0.9),
      makeCandidate('OneGoalLow', 2, 0.05),
      makeCandidate('TwoGoals', 3, 0.3),
      makeCandidate('NoGoalLow', 1, 0.1),
    ]
    const scorers = [
      makeScorer('OneGoalLow', 2, 1),
      makeScorer('TwoGoals', 3, 2),
    ]
    const result = mergeScorersWithCandidates(candidates, scorers)
    expect(result[0].playerName).toBe('TwoGoals')
    expect(result[1].playerName).toBe('OneGoalLow')
    expect(result[2].playerName).toBe('NoGoalHigh')
    expect(result[3].playerName).toBe('NoGoalLow')
  })
})
