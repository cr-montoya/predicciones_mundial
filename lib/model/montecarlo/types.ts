import type { Team, Player } from '@/lib/types'

export interface SimTeam {
  team: Team
  group: string
}

export interface GroupStanding {
  teamId: number
  points: number
  goalDiff: number
  goalsFor: number
}

export interface TournamentInput {
  teams: Team[]
  players: Player[]
}

export interface TournamentOutput {
  winner: import('@/lib/types').ModelOutput
  goldenBoot: import('@/lib/types').ModelOutput
}
