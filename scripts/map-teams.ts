import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load .env.local from project root
config({ path: path.join(__dirname, '..', '.env.local') })

const FOOTBALLDATA_KEY = process.env.FOOTBALLDATA_KEY
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'v3.football.api-sports.io'

if (!FOOTBALLDATA_KEY || !RAPIDAPI_KEY) {
  console.error('ERROR: Missing FOOTBALLDATA_KEY or RAPIDAPI_KEY in .env.local')
  process.exit(1)
}

interface FdTeam {
  fd_id: number
  name: string
  tla: string
  group: string
}

interface MappedTeam extends FdTeam {
  api_football_id: number
}

const MANUAL_OVERRIDES: Record<string, number> = {
  'United States': 1,
  'Korea Republic': 28,
  'New Zealand': 30,
  'Congo DR': 69,
  'Ivory Coast': 39,
  'Czech Republic': 63,
  'Bosnia-Herzegovina': 92,
}

async function fetchWc2026Teams(): Promise<any> {
  const url = 'https://api.football-data.org/v4/competitions/WC/matches'
  const params = new URLSearchParams({ season: '2026' })

  console.log('[1/3] Fetching WC 2026 matches from football-data.org...')
  const resp = await fetch(`${url}?${params}`, {
    headers: { 'X-Auth-Token': FOOTBALLDATA_KEY! },
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

function extractUniqueTeams(wcData: any): FdTeam[] {
  const seen = new Set<number>()
  const groupMap = new Map<number, string>()
  const teams: FdTeam[] = []

  // Build group mapping from GROUP_STAGE
  for (const match of wcData.matches || []) {
    if (match.stage === 'GROUP_STAGE') {
      for (const teamKey of ['homeTeam', 'awayTeam']) {
        const team = match[teamKey]
        const teamId = team.id
        if (teamId && !groupMap.has(teamId)) {
          groupMap.set(teamId, match.group || '')
        }
      }
    }
  }

  // Extract unique teams
  for (const match of wcData.matches || []) {
    for (const teamKey of ['homeTeam', 'awayTeam']) {
      const team = match[teamKey]
      const teamId = team.id
      const teamName = team.name || ''
      const teamTla = team.tla || ''

      if (teamId && !seen.has(teamId)) {
        seen.add(teamId)
        teams.push({
          fd_id: teamId,
          name: teamName,
          tla: teamTla,
          group: groupMap.get(teamId) || '',
        })
      }
    }
  }

  return teams.sort((a, b) => a.fd_id - b.fd_id)
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resolveApiFootballId(fdName: string, _fdTla: string): Promise<number | null> {
  // Check manual overrides
  if (fdName in MANUAL_OVERRIDES) {
    return MANUAL_OVERRIDES[fdName]
  }

  // Try API search
  const url = 'https://v3.football.api-sports.io/teams'
  const params = new URLSearchParams({
    name: fdName,
    type: 'National',
  })

  try {
    const resp = await fetch(`${url}?${params}`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    })
    if (!resp.ok) {
      console.log(`  [!] API error for ${fdName}: HTTP ${resp.status}`)
      return null
    }
    const data = await resp.json()
    const teams = data.response || []
    if (teams.length > 0) {
      return teams[0].team.id
    }
  } catch (e) {
    console.log(`  [!] API error for ${fdName}: ${e}`)
  }

  return null
}

async function main() {
  console.log('\n=== World Cup 2026 Team ID Mapping ===\n')

  // Step 1: Fetch WC 2026 data
  const wcData = await fetchWc2026Teams()
  const totalMatches = (wcData.matches || []).length
  console.log(`[1/2] Found ${totalMatches} matches\n`)

  // Step 2: Extract unique teams with REAL groups from football-data.org
  const fdTeams = extractUniqueTeams(wcData)
  console.log(`[2/2] Extracted ${fdTeams.length} unique teams with real groups`)
  console.log(`      (Groups assigned from GROUP_STAGE fixtures)\n`)

  // Use pre-validated API-Football IDs (from previous run)
  const apiFootballIds: Record<string, number> = {
    'Argentina': 26, 'France': 2, 'Morocco': 32, 'Ivory Coast': 39,
    'Spain': 9, 'Brazil': 6, 'Croatia': 3, 'Japan': 21,
    'United States': 1, 'Uruguay': 7, 'Panama': 22, 'Paraguay': 14,
    'Germany': 25, 'Mexico': 16, 'Belgium': 4, 'Saudi Arabia': 34,
    'Netherlands': 5, 'Colombia': 20, 'Portugal': 10, 'Senegal': 51,
    'England': 24, 'Czechia': 63, 'New Zealand': 30, 'Tunisia': 33,
    'Canada': 101, 'Ecuador': 128, 'South Korea': 28, 'Switzerland': 15,
    'Turkey': 141, 'South Africa': 56, 'Iran': 31, 'Qatar': 197,
    'Australia': 35, 'Egypt': 37, 'Haiti': 168, 'Jordan': 172,
    'Bosnia-Herzegovina': 92, 'Iraq': 173, 'Cape Verde Islands': 206, 'Curaçao': 617,
    'Austria': 41, 'Algeria': 46, 'Uzbekistan': 90, 'Ghana': 135,
    'Sweden': 17, 'Congo DR': 69, 'Norway': 119, 'Scotland': 1179,
  }

  const mappedTeams: MappedTeam[] = []
  const failed: [number, string][] = []

  for (let i = 0; i < fdTeams.length; i++) {
    const fdTeam = fdTeams[i]
    const { fd_id, name, group } = fdTeam

    const apiId = apiFootballIds[name]
    if (apiId !== undefined) {
      mappedTeams.push({
        fd_id,
        name,
        tla: fdTeam.tla,
        api_football_id: apiId,
        group,
      })
      const pad = String(i + 1).padStart(2, ' ')
      console.log(
        `  [${pad}/${fdTeams.length}] ✓ ${name.padEnd(25)} [Group ${group}] → api_id=${apiId}`
      )
    } else {
      failed.push([fd_id, name])
      const pad = String(i + 1).padStart(2, ' ')
      console.log(`  [${pad}/${fdTeams.length}] ✗ ${name.padEnd(25)} → NOT FOUND`)
    }
  }

  console.log(`\n=== RESULTS ===\n`)
  console.log(`✓ Mapped:     ${mappedTeams.length} teams with real groups`)
  console.log(`✗ Failed:     ${failed.length} teams\n`)

  if (failed.length > 0) {
    console.log('Teams not in lookup table:')
    for (const [fdId, name] of failed) {
      console.log(`  - ${name} [fd_id=${fdId}]`)
    }
    console.log()
  }

  // Save JSON output
  const outputFile = path.join(__dirname, 'team-map-output.json')
  fs.writeFileSync(outputFile, JSON.stringify(mappedTeams, null, 2))
  console.log(`✓ Saved to: ${outputFile}\n`)

  // Generate TypeScript FD_TEAM_MAP
  console.log('=== TypeScript FD_TEAM_MAP (copy-paste into lib/data/providers/football-data.ts) ===\n')
  console.log('const FD_TEAM_MAP: Record<number, number> = {')
  const sorted = [...mappedTeams].sort((a, b) => a.fd_id - b.fd_id)
  for (const team of sorted) {
    console.log(`  ${team.fd_id}: ${team.api_football_id},  // ${team.name}`)
  }
  console.log('}')

  console.log(`\n✓ Total: ${mappedTeams.length} mappings with REAL GROUPS from football-data.org`)
}

main().catch(console.error)
