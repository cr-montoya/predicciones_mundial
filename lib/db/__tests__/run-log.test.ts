/**
 * Integration tests for insertRunLog / updateRunLog with status 'running'.
 *
 * Background: the on-disk DB could have the old CHECK constraint
 * (status IN ('ok', 'error')); migrateRunLog fixes it.
 * These tests don't test the migration directly (it is internal and not
 * exported) — they test the observable behavior: that the running -> ok | error
 * cycle works without throwing exceptions.
 *
 * An in-memory DB (':memory:') built from the real schema is used so
 * tests don't depend on the on-disk DB or the singleton connection.
 * No better-sqlite3 mocks: the harness prohibits them.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const SCHEMA_PATH = join(process.cwd(), 'lib', 'db', 'schema.sql')

// Helpers that mirror the write.ts logic but against an isolated in-memory DB.

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
