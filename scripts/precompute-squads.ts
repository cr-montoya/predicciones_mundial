import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { writeFileSync } from 'fs'
import { join } from 'path'
import type { Player, PlayerPosition } from '@/lib/types'

const FD_BASE = 'https://api.football-data.org/v4'
const WC_SEASON = 2026

// football-data.org team ID → canonical team ID
const FD_TEAM_MAP: Record<number, number> = {
  758: 7, 759: 25, 760: 9, 761: 14, 762: 26, 763: 135, 764: 6, 765: 10,
  766: 21, 769: 16, 770: 24, 771: 1, 772: 28, 773: 2, 774: 56, 778: 46,
  779: 35, 783: 30, 788: 15, 791: 128, 792: 17, 798: 63, 799: 3, 801: 34,
  802: 33, 803: 141, 804: 51, 805: 4, 815: 32, 816: 41, 818: 20, 825: 37,
  828: 101, 836: 168, 840: 31, 1060: 92, 1836: 22, 1930: 206, 1934: 69,
  1935: 39, 8030: 197, 8049: 172, 8062: 173, 8070: 90, 8601: 5, 8872: 119,
  8873: 1179, 9460: 617,
}

// Default goalsPerMinute by position for players without WC goals
// Only FW/MF are included — DF/GK are filtered out (MIN_MINUTES_ELIGIBLE logic still applies)
const POSITION_DEFAULT_RATE: Partial<Record<PlayerPosition, number>> = {
  FW: 1 / 300,   // 1 goal per 300 min
  MF: 1 / 600,   // 1 goal per 600 min
}

// -----------------------------------------------------------------------------
// API shapes (football-data.org v4)
// -----------------------------------------------------------------------------

interface FdPlayer {
  id: number
  name: string
  position: string | null
  nationality: string
}

interface FdTeamWithSquad {
  id: number
  name: string
  squad: FdPlayer[]
}

interface FdTeamsResponse {
  teams: FdTeamWithSquad[]
}

interface FdScorer {
  player: { id: number; name: string }
  team: { id: number }
  goals: number
}

interface FdScorersResponse {
  scorers: FdScorer[]
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function normalize(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function fdPositionToPlayerPosition(fdPos: string | null): PlayerPosition | null {
  const pos = fdPos?.toLowerCase() ?? ''
  if (pos.includes('offence') || pos.includes('forward') || pos.includes('attack')) return 'FW'
  if (pos.includes('midfield')) return 'MF'
  if (pos.includes('defence') || pos.includes('defense') || pos.includes('defender')) return 'DF'
  if (pos.includes('goalkeeper') || pos.includes('keeper')) return 'GK'
  return null
}

async function fdFetch<T>(endpoint: string): Promise<T> {
  const key = process.env.FOOTBALLDATA_KEY
  if (!key) throw new Error('FOOTBALLDATA_KEY not set')
  const res = await fetch(`${FD_BASE}/${endpoint}`, {
    headers: { 'X-Auth-Token': key },
  })
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// -----------------------------------------------------------------------------
// Build squads from API + WC scorer stats
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[precompute:squads] fetching WC 2026 teams...')
  const teamsData = await fdFetch<FdTeamsResponse>(
    `competitions/WC/teams?season=${WC_SEASON}`
  )
  console.log(`[precompute:squads] ${teamsData.teams.length} teams received`)

  console.log('[precompute:squads] fetching WC 2026 scorers...')
  const scorersData = await fdFetch<FdScorersResponse>(
    `competitions/WC/scorers?season=${WC_SEASON}&limit=100`
  )
  console.log(`[precompute:squads] ${scorersData.scorers.length} scorers received`)

  // Build scorer lookup: normalized name → goals (keyed by canonical team id for disambiguation)
  const scorerMap = new Map<string, { goals: number; teamId: number }>()
  for (const s of scorersData.scorers) {
    const canonicalTeam = FD_TEAM_MAP[s.team.id] ?? s.team.id
    scorerMap.set(normalize(s.player.name), { goals: s.goals, teamId: canonicalTeam })
  }

  const squadsByTeamId: Record<number, Player[]> = {}
  let playerId = 1001
  let matched = 0
  let defaulted = 0
  let skipped = 0

  for (const fdTeam of teamsData.teams) {
    const canonicalTeamId = FD_TEAM_MAP[fdTeam.id] ?? fdTeam.id
    const players: Player[] = []

    for (const fdPlayer of fdTeam.squad ?? []) {
      const position = fdPositionToPlayerPosition(fdPlayer.position)
      if (!position || position === 'GK' || position === 'DF') {
        skipped++
        continue
      }

      const normName = normalize(fdPlayer.name)
      const scorer = scorerMap.get(normName)
        ?? [...scorerMap.entries()].find(([k]) => {
          // last-name fallback
          const last = normName.split(' ').at(-1) ?? ''
          return last.length >= 4 && k.split(' ').at(-1) === last
        })?.[1]

      let goalsScored: number
      let minutesPlayed: number
      let goalsPerMinute: number

      if (scorer && scorer.goals > 0) {
        // Use actual WC goals as the rate signal
        goalsScored = scorer.goals
        minutesPlayed = scorer.goals * 90  // approx 90 min per goal as floor
        goalsPerMinute = goalsScored / minutesPlayed
        matched++
      } else {
        // Position default — player is in the squad but hasn't scored yet
        const rate = POSITION_DEFAULT_RATE[position] ?? 0
        if (rate === 0) { skipped++; continue }
        goalsScored = 1
        minutesPlayed = Math.round(1 / rate)
        goalsPerMinute = rate
        defaulted++
      }

      players.push({
        id: playerId++,
        teamId: canonicalTeamId,
        name: fdPlayer.name,
        position,
        goalsScored,
        minutesPlayed,
        goalsPerMinute,
      })
    }

    if (players.length > 0) {
      squadsByTeamId[canonicalTeamId] = players
    }
  }

  console.log(`[precompute:squads] stats: ${matched} with WC goals, ${defaulted} with position defaults, ${skipped} skipped (GK/DF/no rate)`)

  const outPath = join(process.cwd(), 'lib', 'data', 'squads.json')
  writeFileSync(outPath, JSON.stringify(squadsByTeamId, null, 2) + '\n', 'utf-8')
  console.log(`[precompute:squads] written to ${outPath}`)

  // Show top 5 per team for sanity check
  const topByTeam = Object.entries(squadsByTeamId)
    .filter(([, ps]) => ps.length >= 4)
    .slice(0, 4)
    .map(([tid, ps]) => {
      const top = [...ps].sort((a, b) => (b.goalsPerMinute ?? 0) - (a.goalsPerMinute ?? 0)).slice(0, 3)
      return `  team ${tid}: ${top.map(p => p.name).join(', ')}`
    })
  console.log('[precompute:squads] sample:\n' + topByTeam.join('\n'))
}

main().catch((err) => {
  console.error('[precompute:squads] error:', err)
  process.exit(1)
})
