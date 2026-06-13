interface LastUpdatedProps {
  /** Momento ISO en que se genero la data de esta pagina. */
  generatedAt: string
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

export function LastUpdated({ generatedAt }: LastUpdatedProps) {
  return (
    <span className="text-xs tracking-wide" style={{ color: 'var(--muted)' }}>
      Datos actualizados {formatRelative(generatedAt)} (se refrescan cada hora)
    </span>
  )
}
