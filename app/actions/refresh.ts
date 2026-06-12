'use server'
import { runRefresh } from '@/lib/agents/run-refresh'

export async function triggerRefresh(): Promise<{ skipped: boolean; message: string }> {
  const result = await runRefresh('server_action')
  if (result.skipped) return { skipped: true, message: result.reason ?? 'Refresh reciente' }
  if (result.status === 'error') return { skipped: false, message: `Error: ${result.error}` }
  return {
    skipped: false,
    message: `Actualizado: ${result.fixturesUpdated} partidos, ${result.predictionsComputed} predicciones`,
  }
}
