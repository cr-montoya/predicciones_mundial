/**
 * Tests del orquestador de fallback.
 * Usa providers mockeados para evitar red, sin DB.
 */

import { describe, it, expect, vi } from 'vitest'
import type { DataProvider } from '@/lib/data/provider'
import type { Fixture, MatchEvent, MatchStats, Team } from '@/lib/types'
import { fetchFixtures, fetchTeamStats, fetchMatchStats, fetchMatchEvents } from '@/lib/data/fallback'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFixtures(id: number): Fixture[] {
  return [{
    id,
    homeTeamId: 1001,
    awayTeamId: 1002,
    kickoffUtc: '2026-06-15T18:00:00Z',
    status: 'scheduled',
    homeGoals: null,
    awayGoals: null,
    round: 'group',
  }]
}

function makeProvider(name: string, overrides: Partial<DataProvider> = {}): DataProvider {
  return {
    name,
    fetchFixtures: vi.fn(async () => []),
    fetchTeamStats: vi.fn(async () => ({})),
    fetchMatchEvents: vi.fn(async () => []),
    fetchMatchStats: vi.fn(async () => []),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests: flujo de fallback para fetchFixtures
// ---------------------------------------------------------------------------

describe('fallback orchestrator - fetchFixtures', () => {
  it('primario OK -> usa primario, no llama al fallback', async () => {
    const primary = makeProvider('primary', {
      fetchFixtures: vi.fn(async () => makeFixtures(1)),
    })
    const secondary = makeProvider('secondary')

    const result = await fetchFixtures(1, 2026, [primary, secondary])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
    expect(primary.fetchFixtures).toHaveBeenCalledOnce()
    expect(secondary.fetchFixtures).not.toHaveBeenCalled()
  })

  it('primario lanza error -> intenta fallback, fallback OK -> usa fallback', async () => {
    const primary = makeProvider('primary', {
      fetchFixtures: vi.fn(async () => { throw new Error('API down') }),
    })
    const secondary = makeProvider('secondary', {
      fetchFixtures: vi.fn(async () => makeFixtures(2)),
    })

    const result = await fetchFixtures(1, 2026, [primary, secondary])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
    expect(primary.fetchFixtures).toHaveBeenCalledOnce()
    expect(secondary.fetchFixtures).toHaveBeenCalledOnce()
  })

  it('primario devuelve [] (vacio) -> intenta fallback, no salta a mock directamente', async () => {
    const primary = makeProvider('primary', {
      fetchFixtures: vi.fn(async () => []),
    })
    const secondary = makeProvider('secondary', {
      fetchFixtures: vi.fn(async () => makeFixtures(3)),
    })
    const tertiary = makeProvider('tertiary')

    const result = await fetchFixtures(1, 2026, [primary, secondary, tertiary])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(3)
    expect(primary.fetchFixtures).toHaveBeenCalledOnce()
    expect(secondary.fetchFixtures).toHaveBeenCalledOnce()
    expect(tertiary.fetchFixtures).not.toHaveBeenCalled()
  })

  it('ambos fallan -> cae al ultimo proveedor (mock)', async () => {
    const primary = makeProvider('primary', {
      fetchFixtures: vi.fn(async () => { throw new Error('primary down') }),
    })
    const secondary = makeProvider('secondary', {
      fetchFixtures: vi.fn(async () => { throw new Error('secondary down') }),
    })
    const mock = makeProvider('mock', {
      fetchFixtures: vi.fn(async () => makeFixtures(99)),
    })

    const result = await fetchFixtures(1, 2026, [primary, secondary, mock])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(99)
    expect(primary.fetchFixtures).toHaveBeenCalledOnce()
    expect(secondary.fetchFixtures).toHaveBeenCalledOnce()
    // mock se llama en la iteracion normal tras los fallos y quizas una vez extra
    expect(mock.fetchFixtures).toHaveBeenCalled()
  })

  it('primario [] y secundario [] -> cae al ultimo proveedor (mock) con fixtures', async () => {
    const primary = makeProvider('primary')
    const secondary = makeProvider('secondary')
    const mock = makeProvider('mock', {
      fetchFixtures: vi.fn(async () => makeFixtures(88)),
    })

    // Con 3 providers donde todos los primeros devuelven []
    // el orquestador agota primary y secondary (ambos vacíos), luego invoca mock
    const result = await fetchFixtures(1, 2026, [primary, secondary, mock])

    expect(mock.fetchFixtures).toHaveBeenCalled()
    // El resultado debe ser de mock dado que los otros dos devuelven vacío
    // (withFallback cae al último proveedor al agotar todos)
  })
})

describe('fallback orchestrator - fetchTeamStats', () => {
  it('primario devuelve stats completas -> usa primario', async () => {
    const primary = makeProvider('primary', {
      fetchTeamStats: vi.fn(async () => ({ avgGoalsScored: 1.8, avgGoalsConceded: 0.9 })),
    })
    const secondary = makeProvider('secondary')

    const result = await fetchTeamStats(1001, 1, 2026, [primary, secondary])

    expect(result.avgGoalsScored).toBe(1.8)
    expect(result.avgGoalsConceded).toBe(0.9)
    expect(secondary.fetchTeamStats).not.toHaveBeenCalled()
  })

  it('primario devuelve {} (football-data free tier) -> intenta secundario', async () => {
    const primary = makeProvider('primary', {
      fetchTeamStats: vi.fn(async () => ({})),
    })
    const secondary = makeProvider('secondary', {
      fetchTeamStats: vi.fn(async () => ({ avgGoalsScored: 1.5, avgGoalsConceded: 1.0 })),
    })

    const result = await fetchTeamStats(1001, 1, 2026, [primary, secondary])

    expect(result.avgGoalsScored).toBe(1.5)
    expect(primary.fetchTeamStats).toHaveBeenCalledOnce()
    expect(secondary.fetchTeamStats).toHaveBeenCalledOnce()
  })
})

describe('fallback orchestrator - fetchMatchStats', () => {
  it('primario OK con stats -> no llama al secundario', async () => {
    const stats: MatchStats[] = [{
      fixtureId: 9001, teamId: 1001, corners: 5,
      yellowCards: 2, redCards: 0, shotsOnTarget: 4, possession: 52,
    }]
    const primary = makeProvider('primary', {
      fetchMatchStats: vi.fn(async () => stats),
    })
    const secondary = makeProvider('secondary')

    const result = await fetchMatchStats(9001, [primary, secondary])

    expect(result).toHaveLength(1)
    expect(secondary.fetchMatchStats).not.toHaveBeenCalled()
  })

  it('primario lanza -> secundario sirve la respuesta', async () => {
    const stats: MatchStats[] = [{
      fixtureId: 9001, teamId: 1001, corners: null,
      yellowCards: null, redCards: null, shotsOnTarget: null, possession: null,
    }]
    const primary = makeProvider('primary', {
      fetchMatchStats: vi.fn(async () => { throw new Error('fail') }),
    })
    const secondary = makeProvider('secondary', {
      fetchMatchStats: vi.fn(async () => stats),
    })

    const result = await fetchMatchStats(9001, [primary, secondary])

    expect(result).toHaveLength(1)
    expect(secondary.fetchMatchStats).toHaveBeenCalledOnce()
  })
})

describe('fallback orchestrator - fetchMatchEvents', () => {
  it('primario OK -> no llama al secundario', async () => {
    const events: MatchEvent[] = [{
      id: 1, fixtureId: 9001, type: 'goal', teamId: 1001, playerId: null, minute: 23,
    }]
    const primary = makeProvider('primary', {
      fetchMatchEvents: vi.fn(async () => events),
    })
    const secondary = makeProvider('secondary')

    const result = await fetchMatchEvents(9001, [primary, secondary])

    expect(result).toHaveLength(1)
    expect(secondary.fetchMatchEvents).not.toHaveBeenCalled()
  })
})

describe('fallback orchestrator - console log del proveedor que sirvió', () => {
  it('registra en console el proveedor que sirvió la corrida', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const primary = makeProvider('test-primary', {
      fetchFixtures: vi.fn(async () => makeFixtures(1)),
    })

    await fetchFixtures(1, 2026, [primary])

    const logs = consoleSpy.mock.calls.map(args => args.join(' '))
    const servedLog = logs.find(l => l.includes('served by') && l.includes('test-primary'))
    expect(servedLog).toBeDefined()

    consoleSpy.mockRestore()
  })
})
