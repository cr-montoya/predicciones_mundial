import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { loadFixtures, computePredictionsForFixture, computePredictionsRetroactive, teamMap } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'

export const revalidate = 3600

const W = 1200
const H = 630
const BG = '#08090d'
const GOLD = '#FFDB00'
const TEXT = '#f0ece4'
const MUTED = '#6b6d75'
const CARD = '#12141a'


function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params
  const fixtureId = parseInt(id, 10)
  if (isNaN(fixtureId)) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const fixtures = await loadFixtures()

  const fixture = fixtures.find(f => f.id === fixtureId)
  if (!fixture) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const byId = teamMap(buildStaticTeams())
  const home = byId.get(fixture.homeTeamId)
  const away = byId.get(fixture.awayTeamId)
  const homeName = home?.name ?? `Equipo ${fixture.homeTeamId}`
  const awayName = away?.name ?? `Equipo ${fixture.awayTeamId}`

  const predictions = fixture.status === 'finished'
    ? computePredictionsRetroactive(fixture, byId)
    : computePredictionsForFixture(fixture, byId)

  const r1x2 = predictions.find(p => p.market === 'result_1x2')
  const homeProb = r1x2?.probabilities['home'] ?? 0.33
  const drawProb = r1x2?.probabilities['draw'] ?? 0.34
  const awayProb = r1x2?.probabilities['away'] ?? 0.33

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, ${GOLD}, #D4A843)`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}>
              ⚽
            </div>
            <span style={{ color: TEXT, fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>
              MUNDIAL 2026
            </span>
            <span style={{ color: MUTED, fontSize: 16, fontWeight: 400, marginLeft: 4 }}>
              Prediction Simulator
            </span>
          </div>
          <span style={{ color: MUTED, fontSize: 14 }}>predicciones-mundial-topaz.vercel.app</span>
        </div>

        {/* Teams */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          <span style={{ color: TEXT, fontSize: 52, fontWeight: 800, textAlign: 'right', flex: 1 }}>
            {homeName}
          </span>
          <span style={{ color: GOLD, fontSize: 36, fontWeight: 700, letterSpacing: 4 }}>
            vs
          </span>
          <span style={{ color: TEXT, fontSize: 52, fontWeight: 800, flex: 1 }}>
            {awayName}
          </span>
        </div>

        {/* Probabilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: CARD, borderRadius: 16, padding: '32px 40px' }}>
          {[
            { label: 'LOCAL', prob: homeProb },
            { label: 'EMPATE', prob: drawProb },
            { label: 'VISITA', prob: awayProb },
          ].map(({ label, prob }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span style={{ color: MUTED, fontSize: 14, fontWeight: 700, letterSpacing: 2, width: 72 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, display: 'flex' }}>
                <div style={{
                  width: pct(prob),
                  height: '100%',
                  background: GOLD,
                  borderRadius: 5,
                }} />
              </div>
              <span style={{ color: GOLD, fontSize: 22, fontWeight: 800, width: 56, textAlign: 'right' }}>
                {pct(prob)}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ color: MUTED, fontSize: 15, letterSpacing: 1 }}>
            AI-assisted statistical football analytics · Entertainment projections
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    },
  )
}
