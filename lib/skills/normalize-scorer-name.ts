export interface LiveScorer {
  playerId: number
  playerName: string
  teamId: number
  goals: number
  assists: number
}

export interface CandidateRow {
  playerName: string
  teamId: number | null
  probability: number | null
  goals: number | null
}

export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function mergeScorersWithCandidates(
  candidates: CandidateRow[],
  liveScorers: LiveScorer[],
): CandidateRow[] {
  if (liveScorers.length === 0) return candidates

  const scorerByTeamAndName = new Map<string, LiveScorer>()
  const scorerByName = new Map<string, LiveScorer>()
  for (const s of liveScorers) {
    const norm = normalizeName(s.playerName)
    scorerByTeamAndName.set(`${s.teamId}:${norm}`, s)
    if (!scorerByName.has(norm)) scorerByName.set(norm, s)
  }

  const matchedNames = new Set<string>()

  const merged: CandidateRow[] = candidates.map(c => {
    const norm = normalizeName(c.playerName)
    // When teamId is known, only match by team+name (avoids false positives with same surname)
    // When teamId is null, fall back to name-only
    const scorer = c.teamId !== null
      ? scorerByTeamAndName.get(`${c.teamId}:${norm}`)
      : scorerByName.get(norm)
    if (scorer) {
      matchedNames.add(normalizeName(scorer.playerName))
      return { ...c, goals: scorer.goals }
    }
    return c
  })

  for (const s of liveScorers) {
    if (!matchedNames.has(normalizeName(s.playerName))) {
      merged.push({
        playerName: s.playerName,
        teamId: s.teamId,
        probability: null,
        goals: s.goals,
      })
    }
  }

  return merged.sort((a, b) => {
    const aGoals = a.goals ?? 0
    const bGoals = b.goals ?? 0
    if (aGoals > 0 && bGoals === 0) return -1
    if (aGoals === 0 && bGoals > 0) return 1
    if (aGoals > 0 && bGoals > 0) {
      if (bGoals !== aGoals) return bGoals - aGoals
      return (b.probability ?? 0) - (a.probability ?? 0)
    }
    return (b.probability ?? 0) - (a.probability ?? 0)
  })
}
