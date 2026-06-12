import type Database from 'better-sqlite3'
import type { Team } from '@/lib/types'

/**
 * Inserta los equipos del seed en la tabla teams.
 * Usa INSERT OR IGNORE para que corridas sucesivas sean idempotentes:
 * nunca sobreescribe filas existentes, preservando attack_strength y
 * defense_strength ya calibrados por el refresh agent.
 *
 * Recibe la instancia de Database como parámetro para evitar el ciclo
 * circular client -> seed -> client.
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
