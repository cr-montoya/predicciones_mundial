import type { Fixture, Team, ModelOutput } from '@/lib/types'
import { sanityCheck } from '@/lib/types'
import { rankMarkets, type RankableMarket } from '@/lib/skills/rank-markets'
import { computeMatchOutputs } from '@/lib/model/match-model'
import { buildStaticTeams } from './static-teams'
import { todayBoundsUtc, buildLabel, type HomeData, type FixtureWithTeams } from './home-types'
import { fetchFixtures } from '@/lib/data/api-football'
import tournamentPrediction from '@/lib/data/tournament-prediction.json'
import { squadsByTeamId } from '@/lib/data/squads'
import {
  deriveActualOutcome,
  topModelCall,
  computeAccuracyStats,
  type MatchAccuracyRecord,
} from '@/lib/skills/accuracy'
import {
  normalizeName,
  mergeScorersWithCandidates,
  type LiveScorer,
  type CandidateRow,
} from '@/lib/skills/normalize-scorer-name'
import { toCanonicalTeamId, FD_BASE_URL } from '@/lib/data/fd-team-map'
import { apiFetch } from '@/lib/data/api-fetch'
import { DATA_REVALIDATE_SECONDS } from '@/lib/model/constants'

const WC_LEAGUE_ID = 1
const WC_SEASON = 2026
interface FdScorersResponse {
  scorers?: Array<{
    player?: { id?: number; name?: string }
    team?: { id?: number }
    goals?: number
    assists?: number
  }>
}

async function fetchLiveScorers(): Promise<LiveScorer[]> {
  const key = process.env.FOOTBALLDATA_KEY
  if (!key) return []
  try {
    const data = await apiFetch<FdScorersResponse>(
      'v4/competitions/WC/scorers',
      {
        baseUrl: FD_BASE_URL,
        headers: { 'X-Auth-Token': key },
        params: { season: '2026', limit: '50' },
        revalidate: DATA_REVALIDATE_SECONDS,
      }
    )
    if (!Array.isArray(data?.scorers)) return []
    return data.scorers
      .filter(s => (s.goals ?? 0) > 0 && s.player?.name && s.team?.id)
      .map(s => ({
        playerId: s.player?.id ?? 0,
        playerName: s.player!.name!,
        teamId: toCanonicalTeamId(s.team!.id!),
        goals: s.goals!,
        assists: s.assists ?? 0,
      }))
  } catch {
    return []
  }
}

function buildInitialCandidates(probabilities: Record<string, number>): CandidateRow[] {
  const nameToTeamId = new Map<string, number>()
  for (const [tid, players] of Object.entries(squadsByTeamId)) {
    for (const p of players) {
      nameToTeamId.set(normalizeName(p.name), Number(tid))
    }
  }
  return Object.entries(probabilities).map(([name, prob]) => ({
    playerName: name,
    teamId: nameToTeamId.get(normalizeName(name)) ?? null,
    probability: prob,
    goals: null,
  }))
}

/** Prediccion del torneo precomputada (Monte Carlo estatico, ver script). */
function tournamentOutputs(): { winner: ModelOutput; goldenBoot: ModelOutput } {
  return tournamentPrediction as unknown as { winner: ModelOutput; goldenBoot: ModelOutput }
}

/** Todos los fixtures del Mundial desde la API en runtime. */
export async function loadFixtures(): Promise<Fixture[]> {
  return fetchFixtures(WC_LEAGUE_ID, WC_SEASON)
}

/** Squad de un equipo desde los datos precomputados. */
export function getSquadForTeam(teamId: number) {
  return squadsByTeamId[teamId] ?? []
}

export function teamMap(teams: Team[]): Map<number, Team> {
  return new Map(teams.map(t => [t.id, t]))
}

function predictionsForTeams(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  const home = byId.get(fixture.homeTeamId)
  const away = byId.get(fixture.awayTeamId)
  if (!home || !away) return []
  return computeMatchOutputs({
    fixture,
    home,
    away,
    matchStats: [],
    homePlayers: squadsByTeamId[fixture.homeTeamId] ?? [],
    awayPlayers: squadsByTeamId[fixture.awayTeamId] ?? [],
  })
}

/**
 * Predicciones de un partido calculadas al vuelo (Poisson, barato). Solo para
 * partidos no finalizados — los finalizados usan computePredictionsRetroactive.
 */
export function computePredictionsForFixture(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  if (fixture.status === 'finished') return []
  return predictionsForTeams(fixture, byId)
}

/**
 * Misma lógica que computePredictionsForFixture pero sin la guarda de 'finished'.
 * Usar en fixture detail de partidos finalizados para mostrar la predicción
 * retroactiva del modelo.
 */
export function computePredictionsRetroactive(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  return predictionsForTeams(fixture, byId)
}

export async function loadHomeData(): Promise<HomeData> {
  const teams = buildStaticTeams()
  const byId = teamMap(teams)
  const [allFixtures, liveScorers] = await Promise.all([loadFixtures(), fetchLiveScorers()])

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

  const fixturesToday: FixtureWithTeams[] = fixtures.map(fx => {
    const preds = computePredictionsForFixture(fx, byId)
    const r1x2 = preds.find(p => p.market === 'result_1x2')
    const exactScore = preds.find(p => p.market === 'exact_score')

    let prediction: FixtureWithTeams['prediction']
    if (r1x2 && exactScore) {
      const [topKey, topProb] = Object.entries(r1x2.probabilities).sort(([, a], [, b]) => b - a)[0]
      const winner =
        topKey === 'home' ? (byId.get(fx.homeTeamId)?.name ?? 'Local')
        : topKey === 'away' ? (byId.get(fx.awayTeamId)?.name ?? 'Visitante')
        : 'Empate'
      const expectedGoals = Object.entries(exactScore.probabilities).reduce((sum, [key, prob]) => {
        const [h, a] = key.split('-').map(Number)
        if (isNaN(h) || isNaN(a)) return sum
        return sum + prob * (h + a)
      }, 0)
      prediction = { winner, winnerProb: topProb, expectedGoals: Math.round(expectedGoals * 10) / 10 }
    }

    return {
      fixture: fx,
      homeTeam: byId.get(fx.homeTeamId),
      awayTeam: byId.get(fx.awayTeamId),
      label: buildLabel(byId.get(fx.homeTeamId), byId.get(fx.awayTeamId), fx),
      prediction,
    }
  })

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
  const goldenBootComputedAt = goldenBoot?.computedAt ?? ''
  const initialCandidates = goldenBoot ? buildInitialCandidates(goldenBoot.probabilities) : []
  const candidates = mergeScorersWithCandidates(initialCandidates, liveScorers)

  const accuracyRecords: MatchAccuracyRecord[] = []
  for (const f of allFixtures) {
    if (f.status !== 'finished' || f.homeGoals === null || f.awayGoals === null) continue
    const preds = computePredictionsRetroactive(f, byId)
    const r1x2 = preds.find(p => p.market === 'result_1x2')
    if (!r1x2) continue
    const call = topModelCall(r1x2.probabilities)
    if (!call) continue
    const actual = deriveActualOutcome(f.homeGoals, f.awayGoals)
    accuracyRecords.push({
      fixtureId: f.id,
      homeTeam: byId.get(f.homeTeamId)?.name ?? '',
      awayTeam: byId.get(f.awayTeamId)?.name ?? '',
      modelCall: call,
      actual,
      correct: call === actual,
      homeProb: r1x2.probabilities['home'] ?? 0,
      drawProb: r1x2.probabilities['draw'] ?? 0,
      awayProb: r1x2.probabilities['away'] ?? 0,
    })
  }
  const accuracyStats = computeAccuracyStats(accuracyRecords)

  return {
    fixturesToday,
    rankedMarkets,
    allRankedMarkets,
    tournamentWinner: winner,
    goldenBoot,
    candidates,
    goldenBootComputedAt,
    fallbackLabel,
    generatedAt: new Date().toISOString(),
    accuracyStats,
  }
}
