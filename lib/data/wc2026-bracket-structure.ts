/** WC 2026 Round of 32 bracket structure from the official draw (December 2024). */

export type GroupPosSlot = {
  kind: 'group_pos'
  group: string
  position: 1 | 2
}

export type ThirdPlaceSlot = {
  kind: 'third'
  eligibleGroups: string[]
}

export type BracketSlot = GroupPosSlot | ThirdPlaceSlot

export interface BracketMatchupDef {
  matchId: string
  home: BracketSlot
  away: BracketSlot
}

export const ROUND_OF_32_DEFS: BracketMatchupDef[] = [
  { matchId: 'M73', home: { kind: 'group_pos', group: 'A', position: 2 }, away: { kind: 'group_pos', group: 'B', position: 2 } },
  { matchId: 'M74', home: { kind: 'group_pos', group: 'E', position: 1 }, away: { kind: 'third', eligibleGroups: ['A','B','C','D','F'] } },
  { matchId: 'M75', home: { kind: 'group_pos', group: 'F', position: 1 }, away: { kind: 'group_pos', group: 'C', position: 2 } },
  { matchId: 'M76', home: { kind: 'group_pos', group: 'C', position: 1 }, away: { kind: 'group_pos', group: 'F', position: 2 } },
  { matchId: 'M77', home: { kind: 'group_pos', group: 'I', position: 1 }, away: { kind: 'third', eligibleGroups: ['C','D','F','G','H'] } },
  { matchId: 'M78', home: { kind: 'group_pos', group: 'E', position: 2 }, away: { kind: 'group_pos', group: 'I', position: 2 } },
  { matchId: 'M79', home: { kind: 'group_pos', group: 'A', position: 1 }, away: { kind: 'third', eligibleGroups: ['C','E','F','H','I'] } },
  { matchId: 'M80', home: { kind: 'group_pos', group: 'L', position: 1 }, away: { kind: 'third', eligibleGroups: ['E','H','I','J','K'] } },
  { matchId: 'M81', home: { kind: 'group_pos', group: 'D', position: 1 }, away: { kind: 'third', eligibleGroups: ['B','E','F','I','J'] } },
  { matchId: 'M82', home: { kind: 'group_pos', group: 'G', position: 1 }, away: { kind: 'third', eligibleGroups: ['A','E','H','I','J'] } },
  { matchId: 'M83', home: { kind: 'group_pos', group: 'K', position: 2 }, away: { kind: 'group_pos', group: 'L', position: 2 } },
  { matchId: 'M84', home: { kind: 'group_pos', group: 'H', position: 1 }, away: { kind: 'group_pos', group: 'J', position: 2 } },
  { matchId: 'M85', home: { kind: 'group_pos', group: 'B', position: 1 }, away: { kind: 'third', eligibleGroups: ['E','F','G','I','J'] } },
  { matchId: 'M86', home: { kind: 'group_pos', group: 'J', position: 1 }, away: { kind: 'group_pos', group: 'H', position: 2 } },
  { matchId: 'M87', home: { kind: 'group_pos', group: 'K', position: 1 }, away: { kind: 'third', eligibleGroups: ['D','E','I','J','L'] } },
  { matchId: 'M88', home: { kind: 'group_pos', group: 'D', position: 2 }, away: { kind: 'group_pos', group: 'G', position: 2 } },
]
