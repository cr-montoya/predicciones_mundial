import { notFound } from 'next/navigation'
import { loadFixtures, computePredictionsForFixture, teamMap } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { computeLambdas } from '@/lib/model/lambda'
import { MarketSection } from '@/components/market-section'
import { CollapsibleSection } from '@/components/collapsible-section'
import { TeamTotalsSection } from '@/components/team-totals-section'
import { FadeIn } from '@/components/fade-in'
import type { ModelOutput, MarketType } from '@/lib/types'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ id: string }>
}

function pickMarkets(predictions: ModelOutput[], types: MarketType[]): ModelOutput[] {
  return types.flatMap((t) => predictions.filter((p) => p.market === t))
}

interface FixtureHeaderProps {
  home: string
  away: string
  kickoff: string
  homeGoals: number | null
  awayGoals: number | null
  status: string
}

function FixtureHeader({ home, away, kickoff, homeGoals, awayGoals, status }: FixtureHeaderProps) {
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
        <span className="text-xl font-bold text-white flex-1 text-right">{home}</span>
        <span
          className="text-4xl font-bold tabular-nums w-28 text-center"
          style={{ color: hasScore ? 'var(--accent)' : 'var(--muted)' }}
        >
          {hasScore ? `${homeGoals} - ${awayGoals}` : 'vs'}
        </span>
        <span className="text-xl font-bold text-white flex-1">{away}</span>
      </div>
      <p className="text-xs tracking-widest text-center" style={{ color: 'var(--muted)' }}>
        {status === 'finished' ? 'FINALIZADO' : status === 'live' ? 'EN VIVO' : 'PROGRAMADO'}
      </p>
    </div>
  )
}

export default async function FixturePage({ params }: PageProps) {
  const { id } = await params
  const fixtureId = parseInt(id, 10)

  if (isNaN(fixtureId)) notFound()

  const fixture = (await loadFixtures()).find((f) => f.id === fixtureId)
  if (!fixture) notFound()

  const byId = teamMap(buildStaticTeams())
  const home = byId.get(fixture.homeTeamId)
  const away = byId.get(fixture.awayTeamId)
  const predictions = computePredictionsForFixture(fixture, byId)

  const homeName = home?.name ?? `Equipo ${fixture.homeTeamId}`
  const awayName = away?.name ?? `Equipo ${fixture.awayTeamId}`

  const lambdas = home && away ? computeLambdas(home, away) : { lambdaHome: 1.2, lambdaAway: 1.0 }

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

  const scorerConfidence = scorerMarkets[0]?.confidence

  return (
    <div className="flex flex-col gap-10 px-6 py-12 max-w-4xl mx-auto w-full">
      <FadeIn>
        <FixtureHeader
          home={homeName}
          away={awayName}
          kickoff={fixture.kickoffUtc}
          homeGoals={fixture.homeGoals}
          awayGoals={fixture.awayGoals}
          status={fixture.status}
        />
      </FadeIn>

      {predictions.length === 0 ? (
        <FadeIn delay={0.1}>
          <div
            className="border p-6 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Sin predicciones para este partido (los partidos finalizados no se proyectan).
          </div>
        </FadeIn>
      ) : (
        <div className="flex flex-col gap-12">
          <FadeIn delay={0.1}>
            <MarketSection title="RESULTADO" markets={resultMarkets} />
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
              <MarketSection title="GOLES" markets={goalMarkets} topN={5} noHeader={true} />
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

          <FadeIn delay={0.25}>
            <CollapsibleSection
              title="GOLEADORES"
              count={scorerMarkets.length}
              defaultOpen={true}
            >
              {scorerConfidence === 'low' && (
                <div className="flex flex-col gap-2 mb-4">
                  <span
                    className="inline-block text-xs font-bold tracking-wider px-2 py-0.5 w-fit"
                    style={{
                      background: 'rgba(255,165,0,0.12)',
                      color: '#FFA500',
                      borderRadius: 3,
                      letterSpacing: 1,
                    }}
                  >
                    DATOS LIMITADOS
                  </span>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Sin alineación confirmada. Proyección por minutos históricos.
                  </p>
                </div>
              )}
              <MarketSection title="GOLEADORES" markets={scorerMarkets} topN={5} noHeader={true} />
            </CollapsibleSection>
          </FadeIn>
        </div>
      )}
    </div>
  )
}
