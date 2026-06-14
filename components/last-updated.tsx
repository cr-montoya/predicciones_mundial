interface LastUpdatedProps {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
      <div style={{
        width: 6,
        height: 6,
        background: '#02B906',
        borderRadius: '50%',
        animation: 'pulseGlow 2s infinite',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 11, color: '#555' }}>
        Datos actualizados {formatRelative(generatedAt)}
      </span>
    </div>
  )
}
