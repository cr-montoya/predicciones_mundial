import type { AgentName, RunLog } from '@/lib/types'
import {
  getFixtures, getLastOkRunLog,
  insertOrReplaceFixture, insertRunLog, updateRunLog,
} from '@/lib/db/client'
import { fetchFixtures } from '@/lib/data/api-football'
import { REFRESH_GUARD_MINUTES } from '@/lib/model/constants'
import { fetchAndStoreMatchData, refreshTeamStats, recalculatePredictions, loadHistoricalStats } from './refresh-steps'

export interface RefreshResult {
  skipped: boolean
  reason?: string
  fixturesUpdated: number
  predictionsComputed: number
  durationMs: number
  status: 'ok' | 'error'
  error?: string
}

export function isFresh(lastRun: RunLog | undefined, guardMs: number): boolean {
  if (!lastRun) return false
  return Date.now() - new Date(lastRun.startedAt).getTime() < guardMs
}

export async function runRefresh(agentName: AgentName): Promise<RefreshResult> {
  const guardMs = REFRESH_GUARD_MINUTES * 60 * 1000
  const lastOk = getLastOkRunLog(agentName)

  if (isFresh(lastOk, guardMs)) {
    return {
      skipped: true,
      reason: `Ultima corrida hace menos de ${REFRESH_GUARD_MINUTES} minutos`,
      fixturesUpdated: 0,
      predictionsComputed: 0,
      durationMs: 0,
      status: 'ok',
    }
  }

  const startedAt = new Date().toISOString()
  const runId = insertRunLog({ agentName, startedAt, status: 'running' })
  const t0 = Date.now()

  let fixturesUpdated = 0
  let predictionsComputed = 0
  let finalStatus: 'ok' | 'error' = 'ok'
  let errorMsg: string | undefined

  try {
    loadHistoricalStats()

    const prevFixtures = getFixtures()
    const prevStatusById = new Map(prevFixtures.map(f => [f.id, f.status]))

    const apiFixtures = await fetchFixtures(1, 2026)

    for (const f of apiFixtures) {
      insertOrReplaceFixture(f)
      fixturesUpdated++
    }

    const recienTerminados = apiFixtures.filter(f => {
      const prev = prevStatusById.get(f.id)
      return (prev === 'scheduled' || prev === 'live') && f.status === 'finished'
    })

    if (recienTerminados.length > 0) {
      await fetchAndStoreMatchData(recienTerminados)
      const affectedTeamIds = new Set<number>()
      for (const f of recienTerminados) {
        affectedTeamIds.add(f.homeTeamId)
        affectedTeamIds.add(f.awayTeamId)
      }
      await refreshTeamStats(Array.from(affectedTeamIds))
    }

    if (recienTerminados.length > 0 || fixturesUpdated > 0) {
      predictionsComputed = await recalculatePredictions()
    }
  } catch (err) {
    finalStatus = 'error'
    errorMsg = err instanceof Error ? err.message : String(err)
  } finally {
    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - t0
    updateRunLog(runId, {
      finishedAt,
      durationMs,
      status: finalStatus,
      message: errorMsg ?? null,
    })
  }

  return {
    skipped: false,
    fixturesUpdated,
    predictionsComputed,
    durationMs: Date.now() - t0,
    status: finalStatus,
    error: errorMsg,
  }
}
