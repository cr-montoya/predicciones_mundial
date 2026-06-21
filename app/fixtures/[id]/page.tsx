import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadFixtures, computePredictionsRetroactive, teamMap } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { computeLambdas } from '@/lib/model/lambda'
import { computeMatchOutputs } from '@/lib/model/match-model'
import { loadOdds, type OddsResult } from '@/lib/agents/odds-loader'
import { loadLineups } from '@/lib/agents/lineups-loader'
import { loadH2H } from '@/lib/agents/h2h-loader'
import { calcValue, type ValueOutput } from '@/lib/model/skills/value-calc'
import { PickPanel } from '@/components/pick-panel'
import MatchContext from '@/components/match-context'
import { ModelResultCard } from '@/components/model-result-card'
import { MarketSection } from '@/components/market-section'
import { CollapsibleSection } from '@/components/collapsible-section'
import { TeamTotalsSection } from '@/components/team-totals-section'
import { FadeIn } from '@/components/fade-in'
import { ShareButton } from '@/components/share-button'
import type { ModelOutput, MarketType } from '@/lib/types'
import { squadsByTeamId } from '@/lib/data/squads'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://predicciones-mundial.vercel.app'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const fixtureId = parseInt(id, 10)
  if (isNaN(fixtureId)) return {}

  const fixtures = await loadFixtures()
  const fixture = fixtures.find(f => f.id === fixtureId)
  if (!fixture) return {}

  const byId = teamMap(buildStaticTeams())
  const home = byId.get(fixture.homeTeamId)
  const away = byId.get(fixture.awayTeamId)
  const homeName = home?.name ?? `Equipo ${fixture.homeTeamId}`
  const awayName = away?.name ?? `Equipo ${fixture.awayTeamId}`

  const predictions = fixture.status === 'finished'
    ? computePredictionsRetroactive(fixture, byId)
    : (home && away ? computeMatchOutputs({
        fixture,
        home,
        away,
        matchStats: [],
        homePlayers: squadsByTeamId[fixture.homeTeamId] ?? [],
        awayPlayers: squadsByTeamId[fixture.awayTeamId] ?? [],
      }) : [])
  const r1x2 = predictions.find(p => p.market === 'result_1x2')

  let description = `${homeName} vs ${awayName} — Predicción IA`
  if (r1x2) {
    const h = Math.round((r1x2.probabilities['home'] ?? 0) * 100)
    const d = Math.round((r1x2.probabilities['draw'] ?? 0) * 100)
    const a = Math.round((r1x2.probabilities['away'] ?? 0) * 100)
    description = `Local ${h}% · Empate ${d}% · Visita ${a}%`
  }

  const ogImage = `${APP_URL}/og/fixture/${fixtureId}`

  return {
    title: `${homeName} vs ${awayName} — Mundial 2026 IA Predictor`,
    description,
    openGraph: {
      title: `${homeName} vs ${awayName} — Predicción IA`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${homeName} vs ${awayName}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${homeName} vs ${awayName} — Predicción IA`,
      description,
      images: [ogImage],
    },
  }
}

export const revalidate = 3600

interface PageProps {
  params: Promise<{ id: string }>
}

function pickMarkets(predictions: ModelOutput[], types: MarketType[]): ModelOutput[] {
  return types.flatMap((t) => predictions.filter((p) => p.market === t))
}

function buildValueMap(
  predictions: ModelOutput[],
  odds: OddsResult,
): Record<string, Record<string, ValueOutput>> | null {
  if (!odds) return null

  const result: Record<string, Record<string, ValueOutput>> = {}

  const r1x2 = predictions.find((p) => p.market === 'result_1x2')
  if (r1x2) {
    const outcomes: Record<string, number | null> = { home: odds.homeWin, draw: odds.draw, away: odds.awayWin }
    const values: Record<string, ValueOutput> = {}
    for (const [key, marketProb] of Object.entries(outcomes)) {
      const modelProb = r1x2.probabilities[key]
      if (marketProb !== null && modelProb !== undefined) {
        values[key] = calcValue({ modelProbability: modelProb, marketProbability: marketProb })
      }
    }
    if (Object.keys(values).length > 0) result['result_1x2'] = values
  }

  const ou25 = predictions.find((p) => p.market === 'over_under_goals_2_5')
  if (ou25) {
    const outcomes: Record<string, number | null> = { over: odds.over25, under: odds.under25 }
    const values: Record<string, ValueOutput> = {}
    for (const [key, marketProb] of Object.entries(outcomes)) {
      const modelProb = ou25.probabilities[key]
      if (marketProb !== null && modelProb !== undefined) {
        values[key] = calcValue({ modelProbability: modelProb, marketProbability: marketProb })
      }
    }
    if (Object.keys(values).length > 0) result['over_under_goals_2_5'] = values
  }

  return Object.keys(result).length > 0 ? result : null
}

interface FixtureHeaderProps {
  home: string
  homeId: number
  away: string
  awayId: number
  kickoff: string
  homeGoals: number | null
  awayGoals: number | null
  status: string
}

function FixtureHeader({ home, homeId, away, awayId, kickoff, homeGoals, awayGoals, status }: FixtureHeaderProps) {
  const hasScore = homeGoals !== null && awayGoals !== null
  const date = new Date(kickoff).toLocaleString('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs tracking-wider" style={{ color: 'var(--muted)' }}>{date}</p>
      <div className="flex items-center gap-6">
        <a href={`/teams/${homeId}`} className="text-xl font-bold flex-1 text-right" style={{ color: '#f0ece4', textDecoration: 'none' }}>
          {home}
        </a>
        <span
          className="text-4xl font-bold tabular-nums w-28 text-center"
          style={{ color: hasScore ? 'var(--accent)' : 'var(--muted)' }}
        >
          {hasScore ? `${homeGoals} - ${awayGoals}` : 'vs'}
        </span>
        <a href={`/teams/${awayId}`} className="text-xl font-bold flex-1" style={{ color: '#f0ece4', textDecoration: 'none' }}>
          {away}
        </a>
      </div>
      <p className="text-xs tracking-widest text-center" style={{ color: 'var(--muted)' }}>
        {status === 'finished' ? 'FINALIZADO' : status === 'live' ? 'EN VIVO' : 'PROGRAMADO'}
      </p>
    </div>
  )
}

function formatLineupTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Alineación obtenida hace ${mins} min`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `Alineación obtenida hace ${hrs} h`
  return `Alineación obtenida ${new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
}

export default async function FixturePage({ params }: PageProps) {
  const { id } = await params
  const fixtureId = parseInt(id, 10)

  if (isNaN(fixtureId)) notFound()

  const allFixtures = await loadFixtures()
  const fixture = allFixtures.find((f) => f.id === fixtureId)
  if (!fixture) notFound()

  const byId = teamMap(buildStaticTeams())
  const home = byId.get(fixture.homeTeamId)
  const away = byId.get(fixture.awayTeamId)

  const retroPredictions = fixture.status === 'finished'
    ? computePredictionsRetroactive(fixture, byId)
    : []
  const r1x2Retro = retroPredictions.find(p => p.market === 'result_1x2')

  const homeName = home?.name ?? `Equipo ${fixture.homeTeamId}`
  const awayName = away?.name ?? `Equipo ${fixture.awayTeamId}`

  const lineupsData = fixture.status !== 'finished'
    ? await loadLineups(fixtureId, fixture.homeTeamId, fixture.awayTeamId, fixture.kickoffUtc)
    : null

  const predictions = fixture.status !== 'finished' && home && away
    ? computeMatchOutputs({
        fixture,
        home,
        away,
        matchStats: [],
        homePlayers: squadsByTeamId[fixture.homeTeamId] ?? [],
        awayPlayers: squadsByTeamId[fixture.awayTeamId] ?? [],
        homeScorerInputs: lineupsData?.homeScorerInputs,
        awayScorerInputs: lineupsData?.awayScorerInputs,
        lineupConfidence: lineupsData?.lineupConfidence,
      })
    : []

  const excludedPlayers = lineupsData?.excludedPlayers ?? []
  const lineupFetchedAt = lineupsData?.lineupFetchedAt ?? null

  const [lambdas, odds, h2h] = await Promise.all([
    Promise.resolve(home && away ? computeLambdas(home, away) : { lambdaHome: 1.2, lambdaAway: 1.0 }),
    loadOdds(homeName, awayName),
    loadH2H(fixture.homeTeamId, fixture.awayTeamId),
  ])

  const valueMap = buildValueMap(predictions, odds)

  const resultMarkets = pickMarkets(predictions, ['result_1x2', 'double_chance'])
  const combinedMarkets = pickMarkets(predictions, ['win_to_nil'])
  const goalMarkets = pickMarkets(predictions, [
    'over_under_goals_1_5',
    'over_under_goals_2_5',
    'over_under_goals_3_5',
    'btts',
    'exact_score',
  ])
  const homeTeamMarkets = pickMarkets(predictions, [
    'home_team_goals_0_5',
    'home_team_goals_1_5',
    'home_team_goals_2_5',
  ])
  const awayTeamMarkets = pickMarkets(predictions, [
    'away_team_goals_0_5',
    'away_team_goals_1_5',
    'away_team_goals_2_5',
  ])
  const disciplineMarkets = pickMarkets(predictions, ['total_cards', 'corners'])
  const scorerMarkets = pickMarkets(predictions, ['anytime_scorer', 'first_scorer'])
    .filter((m) => Object.keys(m.probabilities).length > 0)

  const fixturePath = `/fixtures/${fixture.id}`
  const shareTitle = `${homeName} vs ${awayName} — Predicción IA`
  const shareText = r1x2Retro
    ? `La IA predijo este partido. ¿Acertó?`
    : `La IA predice este partido del Mundial 2026. ¿Qué opinas?`

  return (
    <div className="flex flex-col gap-10 px-6 py-12 max-w-4xl mx-auto w-full">
      <FadeIn>
        <div className="flex flex-col gap-4">
          <FixtureHeader
            home={homeName}
            homeId={fixture.homeTeamId}
            away={awayName}
            awayId={fixture.awayTeamId}
            kickoff={fixture.kickoffUtc}
            homeGoals={fixture.homeGoals}
            awayGoals={fixture.awayGoals}
            status={fixture.status}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ShareButton title={shareTitle} text={shareText} path={fixturePath} />
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <PickPanel
          fixtureId={fixture.id}
          status={fixture.status}
          homeGoals={fixture.homeGoals}
          awayGoals={fixture.awayGoals}
          homeName={homeName}
          awayName={awayName}
        />
      </FadeIn>

      <FadeIn delay={0.08}>
        <MatchContext
          fixture={fixture}
          allFixtures={allFixtures}
          homeName={homeName}
          awayName={awayName}
          h2h={h2h}
        />
      </FadeIn>

      {fixture.status === 'finished' && r1x2Retro && fixture.homeGoals !== null && fixture.awayGoals !== null && (
        <FadeIn delay={0.1}>
          <ModelResultCard
            homeName={homeName}
            awayName={awayName}
            homeGoals={fixture.homeGoals}
            awayGoals={fixture.awayGoals}
            probabilities={r1x2Retro.probabilities}
          />
        </FadeIn>
      )}

      {predictions.length === 0 ? null : (
        <div className="flex flex-col gap-12">
          <FadeIn delay={0.1}>
            <MarketSection title="RESULTADO" markets={resultMarkets} odds={odds} valueMap={valueMap} />
          </FadeIn>

          {combinedMarkets.length > 0 && (
            <FadeIn delay={0.13}>
              <CollapsibleSection title="COMBINADOS" count={combinedMarkets.length} defaultOpen={true}>
                <MarketSection title="COMBINADOS" markets={combinedMarkets} noHeader={true} />
              </CollapsibleSection>
            </FadeIn>
          )}

          <FadeIn delay={0.15}>
            <CollapsibleSection title="GOLES" count={goalMarkets.length} defaultOpen={true}>
              <MarketSection title="GOLES" markets={goalMarkets} topN={5} noHeader={true} odds={odds} valueMap={valueMap} />
            </CollapsibleSection>
          </FadeIn>

          {(homeTeamMarkets.length > 0 || awayTeamMarkets.length > 0) && (
            <FadeIn delay={0.18}>
              <CollapsibleSection title="GOLES POR EQUIPO" defaultOpen={false}>
                <TeamTotalsSection
                  homeMarkets={homeTeamMarkets}
                  awayMarkets={awayTeamMarkets}
                  homeName={homeName}
                  awayName={awayName}
                  lambdaHome={lambdas.lambdaHome}
                  lambdaAway={lambdas.lambdaAway}
                />
              </CollapsibleSection>
            </FadeIn>
          )}

          <FadeIn delay={0.2}>
            <CollapsibleSection title="DISCIPLINA" count={disciplineMarkets.length} defaultOpen={false}>
              <MarketSection title="DISCIPLINA" markets={disciplineMarkets} noHeader={true} />
            </CollapsibleSection>
          </FadeIn>

          {scorerMarkets.length > 0 && (
            <FadeIn delay={0.25}>
              <CollapsibleSection title="GOLEADORES" count={scorerMarkets.length} defaultOpen={true}>
                {lineupFetchedAt ? (
                  <div className="flex flex-col gap-1.5 mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider px-2 py-0.5 w-fit"
                      style={{ background: 'rgba(2,185,6,0.12)', color: '#02B906', borderRadius: 3, letterSpacing: 1 }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#02B906', animation: 'pulseGlow 2s ease-in-out infinite' }}
                      />
                      ALINEACIÓN CONFIRMADA
                    </span>
                    <span className="text-[11px]" style={{ color: '#555' }}>
                      {formatLineupTimestamp(lineupFetchedAt)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-4">
                    <span
                      className="inline-block text-xs font-bold tracking-wider px-2 py-0.5 w-fit"
                      style={{ background: 'rgba(255,165,0,0.12)', color: '#FFA500', borderRadius: 3, letterSpacing: 1 }}
                    >
                      DATOS LIMITADOS
                    </span>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Sin alineación confirmada. Proyección por minutos históricos.
                    </p>
                  </div>
                )}
                <MarketSection title="GOLEADORES" markets={scorerMarkets} topN={5} noHeader={true} />
                {excludedPlayers.length > 0 && (
                  <div className="flex flex-col gap-2 mt-4">
                    {excludedPlayers.map(ep => (
                      <div key={ep.playerId} className="flex items-center gap-2 flex-wrap" style={{ opacity: 0.4 }}>
                        <span className="text-xs line-through" style={{ color: 'var(--muted)' }}>{ep.playerName}</span>
                        <span
                          className="text-[10px] font-bold tracking-widest px-1.5"
                          style={{ color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}
                        >
                          {ep.reason === 'injured' ? 'LESIONADO' : ep.reason === 'suspended' ? 'SUSPENDIDO' : 'BAJA'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>
            </FadeIn>
          )}
        </div>
      )}
    </div>
  )
}
