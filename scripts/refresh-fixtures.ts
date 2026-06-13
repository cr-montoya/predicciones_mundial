import * as dotenv from 'dotenv'
import * as fs from 'node:fs'
import * as path from 'node:path'
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
import { fetchFixtures } from '../lib/data/api-football'
import type { Fixture } from '../lib/types'

const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

const FIXTURE_KEYS: (keyof Fixture)[] = [
  'id',
  'homeTeamId',
  'awayTeamId',
  'kickoffUtc',
  'status',
  'homeGoals',
  'awayGoals',
  'round',
]

function sanityCheckFixtures(fixtures: Fixture[]): void {
  if (fixtures.length === 0) {
    throw new Error('sanityCheckFixtures: fixtures array is empty')
  }

  for (const fixture of fixtures) {
    for (const key of FIXTURE_KEYS) {
      if (!(key in fixture)) {
        throw new Error(
          `sanityCheckFixtures: fixture id=${fixture.id} is missing key "${key}"`
        )
      }
    }

    const parsed = Date.parse(fixture.kickoffUtc)
    if (Number.isNaN(parsed)) {
      throw new Error(
        `sanityCheckFixtures: fixture id=${fixture.id} has invalid kickoffUtc "${fixture.kickoffUtc}"`
      )
    }
  }
}

interface FixturesCache {
  generatedAt: string
  count: number
  source: string
  fixtures: Fixture[]
}

async function main(): Promise<void> {
  console.log('[refresh-fixtures] Fetching fixtures from football-data.org...')

  const fixtures = await fetchFixtures(WC_LEAGUE_ID, WC_SEASON)

  console.log(`[refresh-fixtures] Received ${fixtures.length} fixtures`)

  sanityCheckFixtures(fixtures)

  console.log('[refresh-fixtures] Sanity check passed')

  const cache: FixturesCache = {
    generatedAt: new Date().toISOString(),
    count: fixtures.length,
    source: 'football-data.org',
    fixtures,
  }

  const outPath = path.resolve(__dirname, '../lib/data/fixtures-cache.json')
  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2), 'utf-8')

  console.log(`[refresh-fixtures] Written ${fixtures.length} fixtures to lib/data/fixtures-cache.json`)
}

main().catch((err) => {
  console.error('[refresh-fixtures] Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
