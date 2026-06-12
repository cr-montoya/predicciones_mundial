import { getTeams, getFixtures } from '@/lib/db/client'
import type { Team, Fixture } from '@/lib/types'

interface StandingRow {
  team: Team
  pj: number
  g: number
  e: number
  p: number
  gf: number
  gc: number
  gd: number
  pts: number
}

function buildStandings(teams: Team[], finished: Fixture[]): Map<string, StandingRow[]> {
  const map = new Map<number, StandingRow>()
  for (const team of teams) {
    map.set(team.id, { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, gd: 0, pts: 0 })
  }

  for (const fx of finished) {
    const home = map.get(fx.homeTeamId)
    const away = map.get(fx.awayTeamId)
    if (!home || !away) continue
    const hg = fx.homeGoals ?? 0
    const ag = fx.awayGoals ?? 0

    home.pj++; away.pj++
    home.gf += hg; home.gc += ag
    away.gf += ag; away.gc += hg
    home.gd = home.gf - home.gc
    away.gd = away.gf - away.gc

    if (hg > ag) { home.g++; home.pts += 3; away.p++ }
    else if (hg < ag) { away.g++; away.pts += 3; home.p++ }
    else { home.e++; home.pts++; away.e++; away.pts++ }
  }

  const groups = new Map<string, StandingRow[]>()
  for (const row of map.values()) {
    const g = row.team.group
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(row)
  }

  for (const rows of groups.values()) {
    rows.sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    )
  }

  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

function GroupTable({ group, rows }: { group: string; rows: StandingRow[] }) {
  return (
    <div className="border" style={{ borderColor: 'var(--border)' }}>
      <div
        className="px-4 py-2 text-xs tracking-widest font-bold"
        style={{ background: 'var(--border)', color: 'var(--accent)' }}
      >
        GRUPO {group}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            <th className="py-2 px-4 text-left w-6">POS</th>
            <th className="py-2 px-4 text-left">EQUIPO</th>
            <th className="py-2 px-2 text-center">PJ</th>
            <th className="py-2 px-2 text-center">G</th>
            <th className="py-2 px-2 text-center">E</th>
            <th className="py-2 px-2 text-center">P</th>
            <th className="py-2 px-2 text-center">GF</th>
            <th className="py-2 px-2 text-center">GC</th>
            <th className="py-2 px-2 text-center">GD</th>
            <th className="py-2 px-2 text-center font-bold" style={{ color: 'var(--accent)' }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.team.id}
              className="border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <td className="py-2 px-4" style={{ color: 'var(--muted)' }}>{i + 1}</td>
              <td className="py-2 px-4 text-white">{row.team.name}</td>
              <td className="py-2 px-2 text-center">{row.pj}</td>
              <td className="py-2 px-2 text-center">{row.g}</td>
              <td className="py-2 px-2 text-center">{row.e}</td>
              <td className="py-2 px-2 text-center">{row.p}</td>
              <td className="py-2 px-2 text-center">{row.gf}</td>
              <td className="py-2 px-2 text-center">{row.gc}</td>
              <td className="py-2 px-2 text-center">{row.gd >= 0 ? `+${row.gd}` : row.gd}</td>
              <td className="py-2 px-2 text-center font-bold" style={{ color: 'var(--accent)' }}>{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function GroupsPage() {
  const teams = getTeams()
  const finished = getFixtures('finished')
  const standings = buildStandings(teams, finished)

  return (
    <div className="flex flex-col gap-8 px-6 py-12 max-w-5xl mx-auto w-full">
      <h1 className="text-2xl font-bold tracking-widest" style={{ color: 'var(--text)' }}>
        FASE DE GRUPOS
      </h1>
      {standings.size === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Sin equipos registrados.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...standings.entries()].map(([group, rows]) => (
            <GroupTable key={group} group={group} rows={rows} />
          ))}
        </div>
      )}
    </div>
  )
}
