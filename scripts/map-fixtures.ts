import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

config({ path: path.join(__dirname, '..', '.env.local') })

const FOOTBALLDATA_KEY = process.env.FOOTBALLDATA_KEY
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'v3.football.api-sports.io'

if (!FOOTBALLDATA_KEY || !RAPIDAPI_KEY) {
  console.error('ERROR: Missing FOOTBALLDATA_KEY or RAPIDAPI_KEY in .env.local')
  process.exit(1)
}

// Same map used in football-data.ts: FD team ID → API-Football team ID
const FD_TEAM_MAP: Record<number, number> = {
  758: 7, 759: 25, 760: 9, 761: 14, 762: 26, 763: 135, 764: 6, 765: 10,
  766: 21, 769: 16, 770: 24, 771: 1, 772: 28, 773: 2, 774: 56, 778: 46,
  779: 35, 783: 30, 788: 15, 791: 128, 792: 17, 798: 63, 799: 3, 801: 34,
  802: 33, 803: 141, 804: 51, 805: 4, 815: 32, 816: 41, 818: 20, 825: 37,
  828: 101, 836: 168, 840: 31, 1060: 92, 1836: 22, 1930: 206, 1934: 69,
  1935: 39, 8030: 197, 8049: 172, 8062: 173, 8070: 90, 8601: 5, 8872: 119,
  8873: 1179, 9460: 617,
}

function toDate(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD
}

async function fetchFdFixtures(): Promise<Array<{ fdId: number; fdHome: number; fdAway: number; date: string }>> {
  console.log('[1/2] Fetching WC 2026 fixtures from football-data.org...')
  const resp = await fetch('https://api.football-data.org/v4/competitions/WC/matches?season=2026', {
    headers: { 'X-Auth-Token': FOOTBALLDATA_KEY! },
  })
  if (!resp.ok) throw new Error(`football-data.org HTTP ${resp.status}`)
  const data = await resp.json()
  const matches = data.matches ?? []
  console.log(`    → ${matches.length} fixtures`)
  return matches.map((m: any) => ({
    fdId: m.id,
    fdHome: m.homeTeam.id,
    fdAway: m.awayTeam.id,
    date: toDate(m.utcDate),
  }))
}

async function fetchAfFixtures(): Promise<Array<{ afId: number; afHome: number; afAway: number; date: string }>> {
  console.log('[2/2] Fetching WC 2026 fixtures from API-Football...')
  // Match the same URL-building logic as ApiFootballProvider
  const basePath = RAPIDAPI_HOST.includes('v3') ? '' : '/v3'
  const url = `https://${RAPIDAPI_HOST}${basePath}/fixtures?league=1&season=2026`
  console.log(`    URL: ${url}`)
  const resp = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY!,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`API-Football HTTP ${resp.status}: ${text.slice(0, 200)}`)
  }
  const data = await resp.json()
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`)
  }
  const fixtures = data.response ?? []
  console.log(`    → ${fixtures.length} fixtures`)
  return fixtures.map((f: any) => ({
    afId: f.fixture.id,
    afHome: f.teams.home.id,
    afAway: f.teams.away.id,
    date: toDate(f.fixture.date),
  }))
}

async function main() {
  console.log('\n=== World Cup 2026 Fixture ID Mapping (FD → API-Football) ===\n')

  const fdFixtures = await fetchFdFixtures()
  const afFixtures = await fetchAfFixtures()

  // Build AF lookup: "afHome_afAway_date" → afId
  const afLookup = new Map<string, number>()
  for (const af of afFixtures) {
    afLookup.set(`${af.afHome}_${af.afAway}_${af.date}`, af.afId)
  }

  const fixtureMap: Record<string, number> = {}
  const failed: Array<{ fdId: number; fdHome: number; fdAway: number; date: string }> = []

  for (const fd of fdFixtures) {
    const afHome = FD_TEAM_MAP[fd.fdHome] ?? fd.fdHome
    const afAway = FD_TEAM_MAP[fd.fdAway] ?? fd.fdAway
    const key = `${afHome}_${afAway}_${fd.date}`
    const afId = afLookup.get(key)

    if (afId !== undefined) {
      fixtureMap[String(fd.fdId)] = afId
    } else {
      failed.push(fd)
    }
  }

  console.log(`\n=== RESULTS ===`)
  console.log(`✓ Mapped:  ${Object.keys(fixtureMap).length} fixtures`)
  console.log(`✗ Failed:  ${failed.length} fixtures`)

  if (failed.length > 0) {
    console.log('\nFailed fixtures (no AF match found):')
    for (const f of failed) {
      const afHome = FD_TEAM_MAP[f.fdHome] ?? f.fdHome
      const afAway = FD_TEAM_MAP[f.fdAway] ?? f.fdAway
      console.log(`  fdId=${f.fdId} date=${f.date} afHome=${afHome} afAway=${afAway}`)
    }
  }

  const outPath = path.resolve(__dirname, '../lib/data/fixture-id-map.json')
  fs.writeFileSync(outPath, JSON.stringify(fixtureMap, null, 2), 'utf-8')
  console.log(`\n✓ Saved to lib/data/fixture-id-map.json`)
}

main().catch(console.error)
