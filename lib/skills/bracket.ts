import type { Fixture } from '@/lib/types'

export interface BracketRound {
  key: string
  label: string
  fixtures: Fixture[]
}

const STAGE_LABELS: Record<string, string> = {
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarter_final: 'Cuartos de Final',
  semi_final: 'Semifinales',
  third_place: 'Tercer Lugar',
  final: 'Final',
}

const STAGE_ORDER = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final']

const ROUND_MAP: Record<string, string> = {
  LAST_32: 'round_of_32',
  ROUND_OF_32: 'round_of_32',
  LAST_16: 'round_of_16',
  ROUND_OF_16: 'round_of_16',
  QUARTER_FINALS: 'quarter_final',
  SEMI_FINALS: 'semi_final',
  THIRD_PLACE: 'third_place',
  PLAY_OFF_FOR_THIRD_PLACE: 'third_place',
  FINAL: 'final',
}

export function normalizeKnockoutStage(round: string | null): string | null {
  if (!round) return null
  if (round.startsWith('Group Stage')) return null
  return ROUND_MAP[round] ?? null
}

export function groupByRound(fixtures: Fixture[]): BracketRound[] {
  const map = new Map<string, Fixture[]>()
  for (const f of fixtures) {
    const key = normalizeKnockoutStage(f.round)
    if (!key) continue
    const existing = map.get(key) ?? []
    existing.push(f)
    map.set(key, existing)
  }

  return STAGE_ORDER
    .filter(key => map.has(key))
    .map(key => ({
      key,
      label: STAGE_LABELS[key] ?? key,
      fixtures: (map.get(key) ?? []).sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)),
    }))
}
