import type { Fixture, MatchStats, MatchEvent, Team } from '@/lib/types'

/**
 * IDs alineados con worldCupTeams del seed real (lib/data/teams-seed.ts).
 * Argentina=26, France=2, Brazil=6, England=24.
 */
export const mockTeams: Team[] = [
  {
    id: 26,
    name: 'Argentina',
    group: 'A',
    fifaRanking: 1,
    attackStrength: 1.15,
    defenseStrength: 0.95,
    homeAdvantage: 1.0,
    recentForm: 1.05,
    avgGoalsScored: 1.8,
    avgGoalsConceded: 0.7,
  },
  {
    id: 2,
    name: 'France',
    group: 'A',
    fifaRanking: 2,
    attackStrength: 1.25,
    defenseStrength: 0.90,
    homeAdvantage: 1.0,
    recentForm: 1.02,
    avgGoalsScored: 2.0,
    avgGoalsConceded: 0.8,
  },
  {
    id: 6,
    name: 'Brazil',
    group: 'B',
    fifaRanking: 3,
    attackStrength: 1.20,
    defenseStrength: 0.92,
    homeAdvantage: 1.0,
    recentForm: 1.08,
    avgGoalsScored: 1.9,
    avgGoalsConceded: 0.75,
  },
  {
    id: 24,
    name: 'England',
    group: 'F',
    fifaRanking: 4,
    attackStrength: 1.10,
    defenseStrength: 0.98,
    homeAdvantage: 1.0,
    recentForm: 1.00,
    avgGoalsScored: 1.7,
    avgGoalsConceded: 0.85,
  },
]

export const mockFixtures: Fixture[] = [
  {
    id: 5001,
    homeTeamId: 26,
    awayTeamId: 2,
    kickoffUtc: '2026-06-15T18:00:00Z',
    status: 'scheduled',
    homeGoals: null,
    awayGoals: null,
    round: 'group',
  },
  {
    id: 5002,
    homeTeamId: 6,
    awayTeamId: 24,
    kickoffUtc: '2026-06-16T20:00:00Z',
    status: 'scheduled',
    homeGoals: null,
    awayGoals: null,
    round: 'group',
  },
  {
    id: 5003,
    homeTeamId: 26,
    awayTeamId: 6,
    kickoffUtc: '2026-07-10T18:00:00Z',
    status: 'scheduled',
    homeGoals: null,
    awayGoals: null,
    round: 'round_of_16',
  },
]

export const mockMatchStats: Record<number, MatchStats[]> = {
  5001: [
    {
      fixtureId: 5001,
      teamId: 26,
      corners: 8,
      yellowCards: 2,
      redCards: 0,
      shotsOnTarget: 5,
      possession: 48,
    },
    {
      fixtureId: 5001,
      teamId: 2,
      corners: 9,
      yellowCards: 1,
      redCards: 0,
      shotsOnTarget: 6,
      possession: 52,
    },
  ],
  5002: [
    {
      fixtureId: 5002,
      teamId: 6,
      corners: 7,
      yellowCards: 3,
      redCards: 0,
      shotsOnTarget: 4,
      possession: 55,
    },
    {
      fixtureId: 5002,
      teamId: 24,
      corners: 6,
      yellowCards: 2,
      redCards: 0,
      shotsOnTarget: 3,
      possession: 45,
    },
  ],
}

export const mockMatchEvents: Record<number, MatchEvent[]> = {
  5001: [
    {
      id: 1,
      fixtureId: 5001,
      type: 'goal',
      teamId: 26,
      playerId: 101,
      minute: 23,
    },
    {
      id: 2,
      fixtureId: 5001,
      type: 'yellow_card',
      teamId: 2,
      playerId: 201,
      minute: 45,
    },
  ],
  5002: [
    {
      id: 3,
      fixtureId: 5002,
      type: 'goal',
      teamId: 6,
      playerId: 301,
      minute: 18,
    },
    {
      id: 4,
      fixtureId: 5002,
      type: 'goal',
      teamId: 6,
      playerId: 302,
      minute: 67,
    },
  ],
}
