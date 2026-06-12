import { getDb } from '@/lib/db/client'

interface TeamSeed {
  id: number
  name: string
  group: string
  homeAdvantage: number
}

// API-Football team IDs (verified from API-Football database).
// homeAdvantage 1.15 for host nations: USA (id 1), Canada (id 101), Mexico (id 16).
const HOST_IDS = new Set([1, 101, 16])

const RAW_TEAMS: Omit<TeamSeed, 'homeAdvantage'>[] = [
  // Group A
  { id: 16,  name: 'Mexico',       group: 'A' },
  { id: 6,   name: 'Brazil',       group: 'A' },
  { id: 32,  name: 'Morocco',      group: 'A' },
  { id: 51,  name: 'Senegal',      group: 'A' },

  // Group B
  { id: 101, name: 'Canada',       group: 'B' },
  { id: 26,  name: 'Argentina',    group: 'B' },
  { id: 56,  name: 'South Africa', group: 'B' },
  { id: 21,  name: 'Poland',       group: 'B' },

  // Group C
  { id: 1,   name: 'USA',          group: 'C' },
  { id: 9,   name: 'Spain',        group: 'C' },
  { id: 25,  name: 'Germany',      group: 'C' },
  { id: 39,  name: 'Ivory Coast',  group: 'C' },

  // Group D
  { id: 2,   name: 'France',       group: 'D' },
  { id: 27,  name: 'Portugal',     group: 'D' },
  { id: 7,   name: 'Uruguay',      group: 'D' },
  { id: 128, name: 'Ecuador',      group: 'D' },

  // Group E
  { id: 5,   name: 'Netherlands',  group: 'E' },
  { id: 20,  name: 'Colombia',     group: 'E' },
  { id: 149, name: 'South Korea',  group: 'E' },
  { id: 46,  name: 'Algeria',      group: 'E' },

  // Group F
  { id: 14,  name: 'Serbia',       group: 'F' },
  { id: 29,  name: 'Iran',         group: 'F' },
  { id: 57,  name: 'Ghana',        group: 'F' },
  { id: 141, name: 'Turkey',       group: 'F' },

  // Group G
  { id: 15,  name: 'Switzerland',  group: 'G' },
  { id: 38,  name: 'Nigeria',      group: 'G' },
  { id: 253, name: 'Venezuela',    group: 'G' },
  { id: 164, name: 'Qatar',        group: 'G' },

  // Group H
  { id: 3,   name: 'Denmark',      group: 'H' },
  { id: 58,  name: 'Cameroon',     group: 'H' },
  { id: 202, name: 'Tunisia',      group: 'H' },
  { id: 107, name: 'Scotland',     group: 'H' },

  // Group I
  { id: 4,   name: 'Belgium',      group: 'I' },
  { id: 8,   name: 'Japan',        group: 'I' },
  { id: 98,  name: 'Australia',    group: 'I' },
  { id: 163, name: 'Costa Rica',   group: 'I' },

  // Group J
  { id: 10,  name: 'Croatia',      group: 'J' },
  { id: 19,  name: 'Chile',        group: 'J' },
  { id: 30,  name: 'Egypt',        group: 'J' },
  { id: 69,  name: 'DR Congo',     group: 'J' },

  // Group K
  { id: 24,  name: 'England',      group: 'K' },
  { id: 11,  name: 'Peru',         group: 'K' },
  { id: 47,  name: 'New Zealand',  group: 'K' },
  { id: 76,  name: 'Panama',       group: 'K' },

  // Group L
  { id: 17,  name: 'Hungary',      group: 'L' },
  { id: 13,  name: 'Ukraine',      group: 'L' },
  { id: 36,  name: 'Honduras',     group: 'L' },
  { id: 195, name: 'Indonesia',    group: 'L' },
]

const TEAMS: TeamSeed[] = RAW_TEAMS.map((t) => ({
  ...t,
  homeAdvantage: HOST_IDS.has(t.id) ? 1.15 : 1.0,
}))

function run(): void {
  const db = getDb()
  const insert = db.prepare(`
    INSERT OR REPLACE INTO teams
      (id, name, "group", fifa_ranking, attack_strength, defense_strength,
       home_advantage, recent_form, avg_goals_scored, avg_goals_conceded)
    VALUES
      (@id, @name, @group, NULL, 1.0, 1.0, @homeAdvantage, NULL, NULL, NULL)
  `)

  const insertAll = db.transaction((teams: TeamSeed[]) => {
    for (const team of teams) {
      insert.run({
        id: team.id,
        name: team.name,
        group: team.group,
        homeAdvantage: team.homeAdvantage,
      })
    }
  })

  insertAll(TEAMS)
  console.log(`Inserted ${TEAMS.length} teams.`)
}

run()
