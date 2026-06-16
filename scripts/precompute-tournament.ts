import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
import { writeFileSync } from 'fs'
import { join } from 'path'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { simulateTournament } from '@/lib/model/montecarlo'
import { squadsByTeamId } from '@/lib/data/squads'
import type { Player } from '@/lib/types'

// football-data.org ID → canonical team ID (same map as FootballDataProvider)
const FD_TEAM_MAP: Record<number, number> = {
  758: 7, 759: 25, 760: 9, 761: 14, 762: 26, 763: 135, 764: 6, 765: 10,
  766: 21, 769: 16, 770: 24, 771: 1, 772: 28, 773: 2, 774: 56, 778: 46,
  779: 35, 783: 30, 788: 15, 791: 128, 792: 17, 798: 63, 799: 3, 801: 34,
  802: 33, 803: 141, 804: 51, 805: 4, 815: 32, 816: 41, 818: 20, 825: 37,
  828: 101, 836: 168, 840: 31, 1060: 92, 1836: 22, 1930: 206, 1934: 69,
  1935: 39, 8030: 197, 8049: 172, 8062: 173, 8070: 90, 8601: 5, 8872: 119,
  8873: 1179, 9460: 617,
}

interface FdScorer {
  player: { name: string }
  team: { id: number }
  goals: number
}
interface FdScorersResponse { scorers: FdScorer[] }

function normalize(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
}

async function fetchWCScorers(): Promise<FdScorer[]> {
  const key = process.env.FOOTBALLDATA_KEY
  if (!key) {
    console.warn('[precompute] FOOTBALLDATA_KEY not set — skipping WC scorer fetch')
    return []
  }
  try {
    const url = 'https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=100'
    const res = await fetch(url, { headers: { 'X-Auth-Token': key } })
    if (!res.ok) {
      console.warn(`[precompute] scorers fetch failed: ${res.status}`)
      return []
    }
    const data = await res.json() as FdScorersResponse
    console.log(`[precompute] fetched ${data.scorers.length} WC 2026 scorers`)
    return data.scorers
  } catch (err) {
    console.warn('[precompute] scorers fetch error:', err)
    return []
  }
}

// Merges WC 2026 actual goals into squad baseline by player name + team.
// Matched players get WC goals added on top of historical baseline.
// Unmatched WC scorers are added as new players (WC goals only, no baseline).
function mergeWCScorers(baseline: Record<number, Player[]>, wcScorers: FdScorer[]): Player[] {
  // Deep-clone so we don't mutate the imported squads
  const merged: Record<number, Player[]> = {}
  for (const [tid, players] of Object.entries(baseline)) {
    merged[Number(tid)] = players.map(p => ({ ...p }))
  }

  let nextId = 9000
  for (const scorer of wcScorers) {
    if (!scorer.goals || scorer.goals <= 0) continue
    const canonicalTeamId = FD_TEAM_MAP[scorer.team.id] ?? scorer.team.id
    const normScorer = normalize(scorer.player.name)
    const squad = merged[canonicalTeamId]
    let matched = false

    if (squad) {
      for (const p of squad) {
        if (normalize(p.name) === normScorer) {
          // Exact match: add WC goals to baseline
          p.goalsScored += scorer.goals
          p.minutesPlayed += scorer.goals * 90  // approx minutes for WC goals
          p.goalsPerMinute = p.goalsScored / p.minutesPlayed
          matched = true
          break
        }
      }
      if (!matched) {
        // Try last-name match as fallback
        const scorerLast = normScorer.split(' ').at(-1) ?? ''
        for (const p of squad) {
          const pLast = normalize(p.name).split(' ').at(-1) ?? ''
          if (scorerLast.length >= 4 && pLast === scorerLast) {
            p.goalsScored += scorer.goals
            p.minutesPlayed += scorer.goals * 90
            p.goalsPerMinute = p.goalsScored / p.minutesPlayed
            matched = true
            break
          }
        }
      }
    }

    if (!matched) {
      // New scorer not in squads.ts: add as new player with WC stats only
      const teamPlayers = merged[canonicalTeamId] ?? []
      teamPlayers.push({
        id: nextId++,
        teamId: canonicalTeamId,
        name: scorer.player.name,
        position: 'FW',
        goalsScored: scorer.goals,
        minutesPlayed: scorer.goals * 90,
        goalsPerMinute: 1 / 90,
      })
      merged[canonicalTeamId] = teamPlayers
      console.log(`[precompute] added new scorer: ${scorer.player.name} (${scorer.goals} goals, team ${canonicalTeamId})`)
    }
  }

  return Object.values(merged).flat()
}

/**
 * Precomputa la prediccion del torneo (campeon + bota de oro).
 * Incorpora goleadores reales del WC 2026 desde football-data.org si FOOTBALLDATA_KEY
 * está disponible. Ejecutar con: pnpm precompute
 */
async function main(): Promise<void> {
  const teams = buildStaticTeams()
  const wcScorers = await fetchWCScorers()
  const allPlayers = wcScorers.length > 0
    ? mergeWCScorers(squadsByTeamId, wcScorers)
    : Object.values(squadsByTeamId).flat()

  const { winner, goldenBoot } = simulateTournament({ teams, players: allPlayers })

  const out = { winner, goldenBoot }
  const outPath = join(process.cwd(), 'lib', 'data', 'tournament-prediction.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8')

  const topWinner = Object.entries(winner.probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, p]) => `${name} ${(p * 100).toFixed(1)}%`)
    .join(', ')

  const topBoot = Object.entries(goldenBoot.probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k, p]) => {
      const name = k.match(/^\d+_(.+)$/)?.[1] ?? k
      return `${name} ${(p * 100).toFixed(1)}%`
    })
    .join(', ')

  console.log(`Tournament prediction written to ${outPath}`)
  console.log(`Top 5 campeón: ${topWinner}`)
  console.log(`Top 5 bota de oro: ${topBoot}`)
}

main()
