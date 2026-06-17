import { describe, it, expect } from 'vitest'
import { computeGroupStandings, getGroupPosition, getBestThird } from '@/lib/skills/standings'
import type { Fixture } from '@/lib/types'

const teamGroups = new Map<number, string>([
  [1, 'A'], [2, 'A'], [3, 'A'], [4, 'A'],
  [5, 'B'], [6, 'B'],
])

function makeFixture(id: number, homeId: number, awayId: number, hg: number, ag: number): Fixture {
  return {
    id,
    homeTeamId: homeId,
    awayTeamId: awayId,
    kickoffUtc: '2026-06-15T00:00:00Z',
    status: 'finished',
    homeGoals: hg,
    awayGoals: ag,
    round: 'Group Stage - Matchday 1',
  }
}

describe('computeGroupStandings', () => {
  it('seeds all teams with zero stats when no fixtures', () => {
    const s = computeGroupStandings([], teamGroups)
    const groupA = s.get('A')!
    expect(groupA).toHaveLength(4)
    expect(groupA[0].points).toBe(0)
  })

  it('awards 3 points to winner', () => {
    const f = makeFixture(1, 1, 2, 2, 0)
    const s = computeGroupStandings([f], teamGroups)
    const groupA = s.get('A')!
    const team1 = groupA.find(t => t.teamId === 1)!
    const team2 = groupA.find(t => t.teamId === 2)!
    expect(team1.points).toBe(3)
    expect(team1.won).toBe(1)
    expect(team2.points).toBe(0)
    expect(team2.lost).toBe(1)
  })

  it('awards 1 point each for a draw', () => {
    const f = makeFixture(1, 1, 2, 1, 1)
    const s = computeGroupStandings([f], teamGroups)
    const groupA = s.get('A')!
    const team1 = groupA.find(t => t.teamId === 1)!
    const team2 = groupA.find(t => t.teamId === 2)!
    expect(team1.points).toBe(1)
    expect(team2.points).toBe(1)
    expect(team1.drawn).toBe(1)
  })

  it('skips non-finished fixtures', () => {
    const f: Fixture = { ...makeFixture(1, 1, 2, 2, 0), status: 'scheduled', homeGoals: null, awayGoals: null }
    const s = computeGroupStandings([f], teamGroups)
    const groupA = s.get('A')!
    expect(groupA.every(t => t.points === 0)).toBe(true)
  })

  it('skips fixtures not in group stage', () => {
    const f: Fixture = { ...makeFixture(1, 1, 2, 2, 0), round: 'LAST_32' }
    const s = computeGroupStandings([f], teamGroups)
    const groupA = s.get('A')!
    expect(groupA.every(t => t.points === 0)).toBe(true)
  })

  it('sorts by points then goal diff then goals scored', () => {
    const fixtures = [
      makeFixture(1, 1, 2, 3, 0),
      makeFixture(2, 3, 4, 1, 0),
    ]
    const s = computeGroupStandings(fixtures, teamGroups)
    const groupA = s.get('A')!
    expect(groupA[0].teamId).toBe(1)
    expect(groupA[1].teamId).toBe(3)
  })

  it('does not cross groups for fixtures', () => {
    const f = makeFixture(1, 1, 5, 2, 0)
    const s = computeGroupStandings([f], teamGroups)
    const groupA = s.get('A')!
    expect(groupA.every(t => t.points === 0)).toBe(true)
  })
})

describe('getGroupPosition', () => {
  it('returns the team at the given position', () => {
    const f = makeFixture(1, 1, 2, 2, 0)
    const s = computeGroupStandings([f], teamGroups)
    const first = getGroupPosition(s, 'A', 1)
    expect(first?.teamId).toBe(1)
  })

  it('returns null for unknown group', () => {
    const s = computeGroupStandings([], teamGroups)
    expect(getGroupPosition(s, 'Z', 1)).toBeNull()
  })
})

describe('getBestThird', () => {
  it('returns best third from eligible groups', () => {
    const f = makeFixture(1, 1, 2, 2, 0)
    const s = computeGroupStandings([f], teamGroups)
    const third = getBestThird(s, ['A'])
    expect(third).not.toBeNull()
  })

  it('returns null if no eligible groups in standings', () => {
    const s = computeGroupStandings([], teamGroups)
    expect(getBestThird(s, ['Z'])).toBeNull()
  })
})
