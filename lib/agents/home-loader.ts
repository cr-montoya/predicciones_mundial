import { db } from '@/lib/db/client'
import { sanityCheck } from '@/lib/types'
import { rankMarkets } from '@/lib/skills/rank-markets'
import type { Fixture, Team, ModelOutput } from '@/lib/types'
import type { RankableMarket, RankedMarket } from '@/lib/skills/rank-markets'
import type { FixtureRow, TeamRow, PredictionRow } from '@/lib/db/mappers'
import { mapFixture, mapTeam, mapPrediction } from '@/lib/db/mappers'

const TZ_OFFSET_HOURS = -5

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

export interface FixtureWithTeams {
  fixture: Fixture
  homeTeam: Team | undefined
  awayTeam: Team | undefined
  label: string
}

export interface HomeData {
  fixturesToday: FixtureWithTeams[]
  rankedMarkets: RankedMarket[]  // top 5 for display
  allRankedMarkets: RankedMarket[]  // all ranked markets (for expansion)
  tournamentWinner: ModelOutput | undefined
  goldenBoot: ModelOutput | undefined
  fallbackLabel: string | null
}

function buildLabel(home: Team | undefined, away: Team | undefined, fx: Fixture): string {
  const h = home?.name ?? `Equipo ${fx.homeTeamId}`
  const a = away?.name ?? `Equipo ${fx.awayTeamId}`
  return `${h} vs ${a}`
}

function teamMap(): Map<number, Team> {
  const rows = db.prepare('SELECT * FROM teams').all() as TeamRow[]
  return new Map(rows.map((r) => [r.id, mapTeam(r)]))
}

function getFixturesToday(): Fixture[] {
  const { start, end } = todayBoundsUtc()
  const rows = db.prepare(
    'SELECT * FROM fixtures WHERE kickoff_utc >= ? AND kickoff_utc <= ? ORDER BY kickoff_utc'
  ).all(start, end) as FixtureRow[]
  return rows.map(mapFixture)
}

function getNextFixture(): Fixture | undefined {
  const now = new Date().toISOString()
  const row = db.prepare(
    "SELECT * FROM fixtures WHERE kickoff_utc > ? AND status != 'finished' ORDER BY kickoff_utc LIMIT 1"
  ).get(now) as FixtureRow | undefined
  return row ? mapFixture(row) : undefined
}

function getPredictionsForFixtures(fixtureIds: number[]): Map<number, ModelOutput[]> {
  if (fixtureIds.length === 0) return new Map()
  const ph = fixtureIds.map(() => '?').join(',')
  const sql = `SELECT p.* FROM predictions p INNER JOIN (
    SELECT fixture_id, market, MAX(computed_at) AS max_at FROM predictions
    WHERE fixture_id IN (${ph}) GROUP BY fixture_id, market
  ) latest ON p.fixture_id = latest.fixture_id AND p.market = latest.market
    AND p.computed_at = latest.max_at WHERE p.fixture_id IN (${ph})`
  const rows = db.prepare(sql).all(...fixtureIds, ...fixtureIds) as PredictionRow[]
  const result = new Map<number, ModelOutput[]>()
  for (const row of rows) {
    if (row.fixture_id == null) continue
    const list = result.get(row.fixture_id) ?? []
    list.push(mapPrediction(row))
    result.set(row.fixture_id, list)
  }
  return result
}

function getTournamentPredictions(): ModelOutput[] {
  const rows = db.prepare(`
    SELECT p.* FROM predictions p INNER JOIN (
      SELECT market, MAX(computed_at) AS max_at FROM predictions
      WHERE fixture_id IS NULL GROUP BY market
    ) latest ON p.market = latest.market AND p.computed_at = latest.max_at
    WHERE p.fixture_id IS NULL
  `).all() as PredictionRow[]
  return rows.map(mapPrediction)
}

export function loadHomeData(): HomeData {
  const teams = teamMap()
  let fixtures = getFixturesToday()
  let fallbackLabel: string | null = null

  if (fixtures.length === 0) {
    const next = getNextFixture()
    if (next) {
      fixtures = [next]
      const h = teams.get(next.homeTeamId)
      const a = teams.get(next.awayTeamId)
      fallbackLabel = `Proxima jornada: ${buildLabel(h, a, next)}`
    }
  }

  const fixturesToday: FixtureWithTeams[] = fixtures.map((fx) => ({
    fixture: fx,
    homeTeam: teams.get(fx.homeTeamId),
    awayTeam: teams.get(fx.awayTeamId),
    label: buildLabel(teams.get(fx.homeTeamId), teams.get(fx.awayTeamId), fx),
  }))

  const fixtureIds = fixtures.map((f) => f.id)
  const predMap = getPredictionsForFixtures(fixtureIds)

  const rankable: RankableMarket[] = []
  for (const { fixture, label } of fixturesToday) {
    const preds = predMap.get(fixture.id) ?? []
    for (const output of preds) {
      try {
        sanityCheck(output)
        rankable.push({ fixtureId: fixture.id, fixtureLabel: label, output })
      } catch {
        // skip malformed predictions silently
      }
    }
  }

  const allRankedMarkets = rankable.length > 0
    ? rankMarkets(rankable, { limit: 30, maxPerFixture: 2 })
    : []

  const rankedMarkets = allRankedMarkets.slice(0, 5)

  const tournamentPreds = getTournamentPredictions()
  const tournamentWinner = tournamentPreds.find((p) => p.market === 'tournament_winner')
  const goldenBoot = tournamentPreds.find((p) => p.market === 'golden_boot')

  return { fixturesToday, rankedMarkets, allRankedMarkets, tournamentWinner, goldenBoot, fallbackLabel }
}
