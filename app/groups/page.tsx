import { loadFixtures } from '@/lib/agents/live-loader'
import { buildStaticTeams } from '@/lib/agents/static-teams'
import { getFlag } from '@/lib/utils/flags'
import type { Team, Fixture } from '@/lib/types'

export const revalidate = 3600

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
    rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  }

  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

const COL = { w: 26, style: { width: 26, textAlign: 'center' as const, fontSize: 12, color: '#888' } }

function GroupCard({ group, rows }: { group: string; rows: StandingRow[] }) {
  return (
    <div style={{
      background: '#12141a',
      border: '1px solid rgba(255,219,0,0.06)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        background: 'rgba(255,219,0,0.04)',
        borderBottom: '1px solid rgba(255,219,0,0.08)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#D4A843', letterSpacing: '0.5px' }}>
          Grupo {group}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        <span style={{ width: 22, fontSize: 10, color: '#555', textTransform: 'uppercase' }}>#</span>
        <span style={{ flex: 1, fontSize: 10, color: '#555', textTransform: 'uppercase' }}>Equipo</span>
        <span style={{ ...COL.style, color: '#555' }}>PJ</span>
        <span style={{ ...COL.style, color: '#555' }}>G</span>
        <span style={{ ...COL.style, color: '#555' }}>E</span>
        <span style={{ ...COL.style, color: '#555' }}>P</span>
        <span style={{ ...COL.style, color: '#555' }}>GF</span>
        <span style={{ ...COL.style, color: '#555' }}>GC</span>
        <span style={{ width: 30, textAlign: 'center', fontSize: 10, color: '#555' }}>GD</span>
        <span style={{ width: 30, textAlign: 'center', fontSize: 10, color: '#D4A843', fontWeight: 600 }}>PTS</span>
      </div>

      {rows.map((row, i) => {
        const qualifying = i < 2
        const flag = getFlag(row.team.name)
        const gdStr = row.gd >= 0 ? `+${row.gd}` : String(row.gd)

        return (
          <div
            key={row.team.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '9px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.02)',
              borderLeft: qualifying ? '3px solid rgba(212,168,67,0.25)' : '3px solid transparent',
            }}
          >
            <span style={{ width: 22, fontSize: 12, color: '#6b6d75' }}>{i + 1}</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {flag && <span style={{ fontSize: 16, flexShrink: 0 }}>{flag}</span>}
              <span style={{
                fontSize: 13,
                color: '#f0ece4',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {row.team.name}
              </span>
            </div>
            <span style={COL.style}>{row.pj}</span>
            <span style={COL.style}>{row.g}</span>
            <span style={COL.style}>{row.e}</span>
            <span style={COL.style}>{row.p}</span>
            <span style={COL.style}>{row.gf}</span>
            <span style={COL.style}>{row.gc}</span>
            <span style={{ width: 30, textAlign: 'center', fontSize: 12, color: '#888' }}>{gdStr}</span>
            <span style={{
              width: 30,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: row.pts > 0 ? '#FFDB00' : '#6b6d75',
            }}>
              {row.pts}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default async function GroupsPage() {
  const teams = buildStaticTeams()
  const finished = (await loadFixtures()).filter((f) => f.status === 'finished')
  const standings = buildStandings(teams, finished)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px 60px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#f0ece4', marginBottom: 24 }}>
        Fase de Grupos
      </div>

      {standings.size === 0 ? (
        <p style={{ fontSize: 14, color: '#6b6d75' }}>Sin equipos registrados.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
          gap: 16,
        }}>
          {[...standings.entries()].map(([group, rows]) => (
            <GroupCard key={group} group={group} rows={rows} />
          ))}
        </div>
      )}
    </div>
  )
}
