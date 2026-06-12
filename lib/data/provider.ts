import type { Fixture, MatchEvent, MatchStats, Team } from '@/lib/types'

export interface DataProvider {
  readonly name: string

  fetchFixtures(leagueId: number, season: number): Promise<Fixture[]>

  fetchTeamStats(
    teamId: number,
    leagueId: number,
    season: number
  ): Promise<Partial<Team>>

  fetchMatchEvents(fixtureId: number): Promise<MatchEvent[]>

  fetchMatchStats(fixtureId: number): Promise<MatchStats[]>
}
