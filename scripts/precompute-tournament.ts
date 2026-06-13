import { writeFileSync } from 'fs'
import { join } from 'path'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { simulateTournament } from '@/lib/model/montecarlo'

/**
 * Precomputa la prediccion del torneo (campeon + bota de oro) a partir de las
 * fuerzas estaticas. El Monte Carlo (10k iteraciones) es demasiado pesado para
 * el runtime de Workers, y como los inputs son estaticos el resultado no cambia
 * entre cargas: lo calculamos aqui y commiteamos el JSON. Reejecutar solo si
 * cambia historical-stats.json. Uso: pnpm precompute
 */
function main(): void {
  const teams = buildStaticTeams()
  const { winner, goldenBoot } = simulateTournament({ teams, players: [] })

  const out = { winner, goldenBoot }
  const outPath = join(process.cwd(), 'lib', 'data', 'tournament-prediction.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8')

  const top = Object.entries(winner.probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, p]) => `${name} ${(p * 100).toFixed(1)}%`)
    .join(', ')

  console.log(`Tournament prediction written to ${outPath}`)
  console.log(`Top 5 favoritos: ${top}`)
}

main()
