import type { RunLog } from '@/lib/types'

interface LastUpdatedProps {
  log: RunLog | undefined
}

function formatRelative(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'hace menos de 1 min'
  if (diffMin < 60) return `hace ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `hace ${diffHours} h`

  const d = new Date(isoString)
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LastUpdated({ log }: LastUpdatedProps) {
  if (!log || log.status !== 'ok' || !log.finishedAt) {
    return (
      <span className="text-xs tracking-wide" style={{ color: 'var(--muted)' }}>
        Sin datos recientes
      </span>
    )
  }

  return (
    <span className="text-xs tracking-wide" style={{ color: 'var(--muted)' }}>
      Última actualización: {formatRelative(log.finishedAt)}
    </span>
  )
}
