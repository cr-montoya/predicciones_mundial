interface ProbabilityBarProps {
  label: string
  probability: number
}

export function ProbabilityBar({ label, probability }: ProbabilityBarProps) {
  const pct = Math.round(probability * 100)
  const fillColor = probability > 0.5 ? 'var(--accent)' : 'var(--muted)'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: 'var(--accent)' }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="h-1 w-full"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
    </div>
  )
}
