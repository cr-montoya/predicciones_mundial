import type { Fixture, Team } from '@/lib/types'
import type { RankedMarket } from '@/lib/skills/rank-markets'
import type { ModelOutput } from '@/lib/types'
import type { AccuracyStats } from '@/lib/skills/accuracy'
import type { CandidateRow } from '@/lib/skills/normalize-scorer-name'

export type { CandidateRow }

const TZ_OFFSET_HOURS = -5

/**
 * UTC bounds for "today" in Colombia time (UTC-5). Pure function,
 * no DB access, shared between the loader and tests.
 */
export function todayBoundsUtc(): { start: string; end: string } {
  const nowUtc = new Date()
  const localMs = nowUtc.getTime() + TZ_OFFSET_HOURS * 3_600_000
  const localDate = new Date(localMs)
  const y = localDate.getUTCFullYear()
  const m = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const d = String(localDate.getUTCDate()).padStart(2, '0')

  const tomorrow = new Date(localDate)
  tomorrow.setUTCDate(localDate.getUTCDate() + 1)
  const ty = tomorrow.getUTCFullYear()
  const tm = String(tomorrow.getUTCMonth() + 1).padStart(2, '0')
  const td = String(tomorrow.getUTCDate()).padStart(2, '0')

  const startHour = String(-TZ_OFFSET_HOURS).padStart(2, '0')
  const endHour = String(-TZ_OFFSET_HOURS - 1).padStart(2, '0')
  const start = `${y}-${m}-${d}T${startHour}:00:00.000Z`
  const end = `${ty}-${tm}-${td}T${endHour}:59:59.999Z`
  return { start, end }
}

export function buildLabel(home: Team | undefined, away: Team | undefined, fx: Fixture): string {
  const h = home?.name ?? `Equipo ${fx.homeTeamId}`
  const a = away?.name ?? `Equipo ${fx.awayTeamId}`
  return `${h} vs ${a}`
}

export interface FixturePrediction {
  winner: string
  winnerProb: number
  expectedGoals: number
}

export interface FixtureWithTeams {
  fixture: Fixture
  homeTeam: Team | undefined
  awayTeam: Team | undefined
  label: string
  prediction?: FixturePrediction
}

export interface HomeData {
  fixturesToday: FixtureWithTeams[]
  rankedMarkets: RankedMarket[]  // top 5 for display
  allRankedMarkets: RankedMarket[]  // all ranked markets (for expansion)
  tournamentWinner: ModelOutput | undefined
  goldenBoot: ModelOutput | undefined
  candidates: CandidateRow[]
  goldenBootComputedAt: string
  fallbackLabel: string | null
  /** ISO timestamp when this data was generated (used for "updated X ago" display). */
  generatedAt: string
  accuracyStats: AccuracyStats
}
