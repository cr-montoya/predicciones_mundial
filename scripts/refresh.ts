import { runRefresh } from '@/lib/agents/run-refresh'

async function main(): Promise<void> {
  const result = await runRefresh('cli_refresh')
  if (result.skipped) {
    console.log(`Refresh omitido: ${result.reason}`)
  } else {
    console.log(
      `Refresh ${result.status}: ${result.fixturesUpdated} fixtures, ${result.predictionsComputed} predicciones en ${result.durationMs}ms`
    )
    if (result.error) console.error(result.error)
  }
}

main().catch(console.error)
