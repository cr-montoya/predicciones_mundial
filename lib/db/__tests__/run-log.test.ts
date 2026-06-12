/**
 * Tests de integracion para insertRunLog / updateRunLog con status 'running'.
 *
 * Contexto: la DB en disco podia tener el CHECK constraint antiguo
 * (status IN ('ok', 'error')) y la funcion migrateRunLog lo arregla.
 * Aqui no testeamos la migracion directamente (es interna y no exportada),
 * sino el comportamiento observable: que el ciclo running -> ok | error
 * funciona sin lanzar excepciones.
 *
 * Usamos una DB en memoria (':memory:') construida desde el schema real
 * para no depender de la DB en disco ni de la conexion singleton.
 * No hay mocks de better-sqlite3: el harness los prohibe.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const SCHEMA_PATH = join(process.cwd(), 'lib', 'db', 'schema.sql')

// Helpers que replican la logica de write.ts pero sobre una DB en memoria aislada.

function makeDb(): Database.Database {
  const instance = new Database(':memory:')
  instance.pragma('foreign_keys = ON')
  const schema = readFileSync(SCHEMA_PATH, 'utf-8')
  instance.exec(schema)
  return instance
}

function insertRunLog(
  db: Database.Database,
  log: { agentName: string; startedAt: string; status: string }
): number {
  const result = db
    .prepare(
      `INSERT INTO run_log (agent_name, started_at, status, finished_at, duration_ms, message)
       VALUES (@agentName, @startedAt, @status, NULL, NULL, NULL)`
    )
    .run({ agentName: log.agentName, startedAt: log.startedAt, status: log.status })
  return (result as unknown as { lastInsertRowid: number }).lastInsertRowid
}

function updateRunLog(
  db: Database.Database,
  id: number,
  patch: { finishedAt: string | null; durationMs: number | null; status: string; message: string | null }
): void {
  db.prepare(
    `UPDATE run_log
     SET finished_at = @finishedAt,
         duration_ms = @durationMs,
         status      = @status,
         message     = @message
     WHERE id = @id`
  ).run({
    id,
    finishedAt: patch.finishedAt,
    durationMs: patch.durationMs,
    status: patch.status,
    message: patch.message,
  })
}

function getRunLog(db: Database.Database, id: number) {
  return db.prepare('SELECT * FROM run_log WHERE id = ?').get(id) as {
    id: number
    agent_name: string
    started_at: string
    finished_at: string | null
    duration_ms: number | null
    status: string
    message: string | null
  } | undefined
}

// ---------------------------------------------------------------------------

describe('run_log: ciclo running -> ok', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
  })

  it("insertRunLog con status 'running' no lanza", () => {
    expect(() =>
      insertRunLog(db, {
        agentName: 'cli_refresh',
        startedAt: '2026-06-11T00:00:00.000Z',
        status: 'running',
      })
    ).not.toThrow()
  })

  it("la fila insertada con status 'running' tiene los campos correctos", () => {
    const id = insertRunLog(db, {
      agentName: 'server_action',
      startedAt: '2026-06-11T01:00:00.000Z',
      status: 'running',
    })

    const row = getRunLog(db, id)
    expect(row).toBeDefined()
    expect(row!.status).toBe('running')
    expect(row!.finished_at).toBeNull()
    expect(row!.duration_ms).toBeNull()
    expect(row!.message).toBeNull()
  })

  it("updateRunLog de 'running' a 'ok' no lanza y persiste los cambios", () => {
    const id = insertRunLog(db, {
      agentName: 'cli_refresh',
      startedAt: '2026-06-11T02:00:00.000Z',
      status: 'running',
    })

    expect(() =>
      updateRunLog(db, id, {
        finishedAt: '2026-06-11T02:01:30.000Z',
        durationMs: 90000,
        status: 'ok',
        message: null,
      })
    ).not.toThrow()

    const row = getRunLog(db, id)
    expect(row!.status).toBe('ok')
    expect(row!.finished_at).toBe('2026-06-11T02:01:30.000Z')
    expect(row!.duration_ms).toBe(90000)
    expect(row!.message).toBeNull()
  })

  it("updateRunLog de 'running' a 'error' persiste el mensaje de error", () => {
    const id = insertRunLog(db, {
      agentName: 'server_action',
      startedAt: '2026-06-11T03:00:00.000Z',
      status: 'running',
    })

    updateRunLog(db, id, {
      finishedAt: '2026-06-11T03:00:05.000Z',
      durationMs: 5000,
      status: 'error',
      message: 'API rate limit exceeded',
    })

    const row = getRunLog(db, id)
    expect(row!.status).toBe('error')
    expect(row!.message).toBe('API rate limit exceeded')
  })

  it("el CHECK constraint rechaza un status invalido", () => {
    expect(() =>
      insertRunLog(db, {
        agentName: 'cli_refresh',
        startedAt: '2026-06-11T04:00:00.000Z',
        status: 'pending',
      })
    ).toThrow()
  })

  it("el CHECK constraint rechaza un agent_name invalido", () => {
    expect(() =>
      insertRunLog(db, {
        agentName: 'unknown_agent',
        startedAt: '2026-06-11T04:00:00.000Z',
        status: 'running',
      })
    ).toThrow()
  })
})

describe('run_log: multiples corridas independientes', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
  })

  it('se pueden insertar varias corridas y cada una tiene su propio id', () => {
    const id1 = insertRunLog(db, {
      agentName: 'cli_refresh',
      startedAt: '2026-06-11T10:00:00.000Z',
      status: 'running',
    })
    const id2 = insertRunLog(db, {
      agentName: 'server_action',
      startedAt: '2026-06-11T11:00:00.000Z',
      status: 'running',
    })

    expect(id1).not.toBe(id2)
    expect(id2).toBeGreaterThan(id1)
  })

  it('updateRunLog de una corrida no afecta a otra', () => {
    const id1 = insertRunLog(db, {
      agentName: 'cli_refresh',
      startedAt: '2026-06-11T12:00:00.000Z',
      status: 'running',
    })
    const id2 = insertRunLog(db, {
      agentName: 'server_action',
      startedAt: '2026-06-11T12:30:00.000Z',
      status: 'running',
    })

    updateRunLog(db, id1, {
      finishedAt: '2026-06-11T12:05:00.000Z',
      durationMs: 300000,
      status: 'ok',
      message: null,
    })

    const row2 = getRunLog(db, id2)
    expect(row2!.status).toBe('running')
    expect(row2!.finished_at).toBeNull()
  })
})
