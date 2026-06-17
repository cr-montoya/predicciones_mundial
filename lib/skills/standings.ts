import type { Fixture } from '@/lib/types'

export interface TeamStanding {
  teamId: number
  group: string
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
}

/** Computes group standings from finished group-stage fixtures. Pure function. */
export function computeGroupStandings(
  fixtures: Fixture[],
  teamGroups: Map<number, string>,
): Map<string, TeamStanding[]> {
  const raw = new Map<string, Map<number, TeamStanding>>()

  // Seed all known teams with zeroed stats
  for (const [teamId, group] of teamGroups) {
    if (!raw.has(group)) raw.set(group, new Map())
    raw.get(group)!.set(teamId, {
      teamId, group,
      points: 0, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0,
    })
  }

  for (const f of fixtures) {
    if (f.status !== 'finished') continue
    if (f.homeGoals === null || f.awayGoals === null) continue
    if (!f.round?.startsWith('Group Stage')) continue

    const homeGroup = teamGroups.get(f.homeTeamId)
    const awayGroup = teamGroups.get(f.awayTeamId)
    if (!homeGroup || !awayGroup || homeGroup !== awayGroup) continue

    const groupMap = raw.get(homeGroup)
    if (!groupMap) continue

    const home = groupMap.get(f.homeTeamId)
    const away = groupMap.get(f.awayTeamId)
    if (!home || !away) continue

    home.played++
    away.played++
    home.goalsFor += f.homeGoals
    home.goalsAgainst += f.awayGoals
    away.goalsFor += f.awayGoals
    away.goalsAgainst += f.homeGoals

    if (f.homeGoals > f.awayGoals) {
      home.won++; home.points += 3; away.lost++
    } else if (f.awayGoals > f.homeGoals) {
      away.won++; away.points += 3; home.lost++
    } else {
      home.drawn++; home.points++
      away.drawn++; away.points++
    }
  }

  const result = new Map<string, TeamStanding[]>()
  for (const [group, teamMap] of raw) {
    const sorted = [...teamMap.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      return b.goalsFor - a.goalsFor
    })
    sorted.forEach((s, i) => {
      s.goalDiff = s.goalsFor - s.goalsAgainst
      void i
    })
    result.set(group, sorted)
  }
  return result
}

/** Returns the team at the given 1-indexed position in the group, or null. */
export function getGroupPosition(
  standings: Map<string, TeamStanding[]>,
  group: string,
  position: 1 | 2 | 3,
): TeamStanding | null {
  return standings.get(group)?.[position - 1] ?? null
}

/** Returns the best 3rd-place team from a set of eligible groups, or null. */
export function getBestThird(
  standings: Map<string, TeamStanding[]>,
  eligibleGroups: string[],
): TeamStanding | null {
  const candidates = eligibleGroups
    .map(g => standings.get(g)?.[2] ?? null)
    .filter((t): t is TeamStanding => t !== null)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      return b.goalsFor - a.goalsFor
    })
  return candidates[0] ?? null
}
