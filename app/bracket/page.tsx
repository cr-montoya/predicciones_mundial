import { loadFixtures, teamMap, computePredictionsRetroactive } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { groupByRound } from '@/lib/skills/bracket'
import { BracketView } from '@/components/bracket-view'
import type { ModelOutput } from '@/lib/types'

export const revalidate = 3600

export const metadata = {
  title: 'Bracket — Mundial 2026 IA Predictor',
}

export default async function BracketPage() {
  const allFixtures = await loadFixtures()
  const byId = teamMap(buildStaticTeams())

  const rounds = groupByRound(allFixtures)

  const predictionMap = new Map<number, ModelOutput>()
  for (const round of rounds) {
    for (const f of round.fixtures) {
      const preds = computePredictionsRetroactive(f, byId)
      const r1x2 = preds.find(p => p.market === 'result_1x2')
      if (r1x2) predictionMap.set(f.id, r1x2)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#f0ece4',
          letterSpacing: '-0.5px',
          margin: 0,
          marginBottom: 8,
        }}>
          Bracket de Eliminatorias
        </h1>
        <p style={{ fontSize: 14, color: '#6b6d75', margin: 0 }}>
          Proyecciones de la IA para cada cruce del Mundial 2026
        </p>
      </div>

      <BracketView
        rounds={rounds}
        teamMap={byId}
        predictionMap={predictionMap}
      />
    </div>
  )
}
