import type { PlayerPosition } from '@/lib/types'

export const DEFAULT_STARTER_PROBABILITY: Record<PlayerPosition, number> = {
  FW: 0.7,
  MF: 0.5,
  DF: 0.3,
  GK: 0.05,
}
