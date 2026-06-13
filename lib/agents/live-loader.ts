import type { Fixture, Team, ModelOutput } from '@/lib/types'
import { sanityCheck } from '@/lib/types'
import { rankMarkets, type RankableMarket } from '@/lib/skills/rank-markets'
import { computeMatchOutputs } from '@/lib/model/match-model'
import { buildStaticTeams } from './static-teams'
import { todayBoundsUtc, buildLabel, type HomeData, type FixtureWithTeams } from './home-types'
import tournamentPrediction from '@/lib/data/tournament-prediction.json'
import fixturesCache from '@/lib/data/fixtures-cache.json'

/** Prediccion del torneo precomputada (Monte Carlo estatico, ver script). */
function tournamentOutputs(): { winner: ModelOutput; goldenBoot: ModelOutput } {
  return tournamentPrediction as unknown as { winner: ModelOutput; goldenBoot: ModelOutput }
}

/** Todos los fixtures del Mundial leidos del JSON commiteado (sin red). */
export function loadFixtures(): Fixture[] {
  return (fixturesCache as { fixtures: unknown[] }).fixtures as Fixture[]
}

export function teamMap(teams: Team[]): Map<number, Team> {
  return new Map(teams.map(t => [t.id, t]))
}

/**
 * Predicciones de un partido calculadas al vuelo (Poisson, barato). matchStats
 * y jugadores van vacios: los mercados de disciplina/corners usan defaults y la
 * bota de oro se proyecta a nivel torneo, no por partido.
 */
export function computePredictionsForFixture(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  if (fixture.status === 'finished') return []
  const home = byId.get(fixture.homeTeamId)
  const away = byId.get(fixture.awayTeamId)
  if (!home || !away) return []

  return computeMatchOutputs({
    fixture,
    home,
    away,
    matchStats: [],
    homePlayers: [],
    awayPlayers: [],
  })
}

export async function loadHomeData(): Promise<HomeData> {
  const teams = buildStaticTeams()
  const byId = teamMap(teams)
  const allFixtures = loadFixtures()

  const { start, end } = todayBoundsUtc()
  let fixtures = allFixtures
    .filter(f => f.kickoffUtc >= start && f.kickoffUtc <= end)
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))

  let fallbackLabel: string | null = null

  if (fixtures.length === 0) {
    const nowIso = new Date().toISOString()
    const next = allFixtures
      .filter(f => f.kickoffUtc > nowIso && f.status !== 'finished')
      .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))[0]
    if (next) {
      fixtures = [next]
      fallbackLabel = `Proxima jornada: ${buildLabel(byId.get(next.homeTeamId), byId.get(next.awayTeamId), next)}`
    }
  }

  const fixturesToday: FixtureWithTeams[] = fixtures.map(fx => ({
    fixture: fx,
    homeTeam: byId.get(fx.homeTeamId),
    awayTeam: byId.get(fx.awayTeamId),
    label: buildLabel(byId.get(fx.homeTeamId), byId.get(fx.awayTeamId), fx),
  }))

  const rankable: RankableMarket[] = []
  for (const { fixture, label } of fixturesToday) {
    for (const output of computePredictionsForFixture(fixture, byId)) {
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

  const { winner, goldenBoot } = tournamentOutputs()

  return {
    fixturesToday,
    rankedMarkets,
    allRankedMarkets,
    tournamentWinner: winner,
    goldenBoot,
    fallbackLabel,
    generatedAt: new Date().toISOString(),
  }
}
