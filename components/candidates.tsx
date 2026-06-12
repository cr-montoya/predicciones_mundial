import type { ModelOutput } from '@/lib/types'

function displayName(key: string): string {
  // Handle legacy format: "168_Haiti" -> "Haiti", "10_Kylian Mbappé" -> "Kylian Mbappé"
  const parts = key.split('_')
  if (parts.length > 1 && /^\d+$/.test(parts[0])) {
    return parts.slice(1).join('_')
  }
  return key
}

interface CandidatesProps {
  winner: ModelOutput | undefined
  boot: ModelOutput | undefined
}

interface CandidateListProps {
  output: ModelOutput
  title: string
}

function CandidateList({ output, title }: CandidateListProps) {
  const sorted = Object.entries(output.probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
      <h3 className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
        {title}
      </h3>
      <div className="flex flex-col gap-3">
        {sorted.map(([key, prob], i) => {
          const pct = Math.round(prob * 100)
          return (
            <div key={key} className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-xs w-4 tabular-nums" style={{ color: 'var(--muted)' }}>
                  {i + 1}
                </span>
                <span className="text-sm tracking-wide text-white">{displayName(key)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-[2px] hidden sm:block" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: '#f5c542' }}
                  />
                </div>
                <span
                  className="text-2xl font-bold tabular-nums w-14 text-right"
                  style={{ color: '#f5c542' }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Candidates({ winner, boot }: CandidatesProps) {
  if (!winner && !boot) return null

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xs tracking-widest" style={{ color: 'var(--muted)' }}>
        PROYECCIONES TORNEO
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {winner && (
          <CandidateList output={winner} title="CANDIDATOS A CAMPEON" />
        )}
        {boot && (
          <CandidateList output={boot} title="CANDIDATOS A BOTA DE ORO" />
        )}
      </div>
    </section>
  )
}
