import type Database from 'better-sqlite3'
import type { Team } from '@/lib/types'

/**
 * Inserts seed teams into the teams table.
 * Uses INSERT OR IGNORE so successive runs are idempotent:
 * never overwrites existing rows, preserving attack_strength and
 * defense_strength already calibrated by the refresh agent.
 *
 * Receives the Database instance as a parameter to avoid the
 * circular dependency client -> seed -> client.
 */
export function seedTeams(
  instance: Database.Database,
  teams: Pick<Team, 'id' | 'name' | 'group' | 'homeAdvantage'>[]
): void {
  const stmt = instance.prepare(`
    INSERT OR IGNORE INTO teams (id, name, "group", home_advantage)
    VALUES (@id, @name, @group, @homeAdvantage)
  `)
  const insertAll = instance.transaction(
    (rows: Pick<Team, 'id' | 'name' | 'group' | 'homeAdvantage'>[]) => {
      for (const row of rows) {
        stmt.run(row)
      }
    }
  )
  insertAll(teams)
}
