export interface MarketOdds {
  homeWin: number
  draw: number
  awayWin: number
  over25: number | null
  under25: number | null
  bookmakerCount: number
  fetchedAt: string
}

export type OddsResult = MarketOdds | null

interface OddsAPIOutcome {
  name: string
  price: number
  point?: number
}

interface OddsAPIMarket {
  key: 'h2h' | 'totals'
  outcomes: OddsAPIOutcome[]
}

interface OddsAPIEvent {
  id: string
  home_team: string
  away_team: string
  commence_time: string
  bookmakers: Array<{
    key: string
    markets: OddsAPIMarket[]
  }>
}

const TEAM_NAME_MAP: Record<string, string> = {
  'argentina': 'Argentina',
  'brazil': 'Brazil', 'brasil': 'Brazil',
  'france': 'France', 'francia': 'France',
  'germany': 'Germany', 'alemania': 'Germany',
  'spain': 'Spain', 'españa': 'Spain',
  'england': 'England', 'inglaterra': 'England',
  'portugal': 'Portugal',
  'netherlands': 'Netherlands', 'holland': 'Netherlands', 'holanda': 'Netherlands',
  'usa': 'United States', 'united states': 'United States', 'estados unidos': 'United States',
  'mexico': 'Mexico', 'méxico': 'Mexico',
  'colombia': 'Colombia',
  'ecuador': 'Ecuador',
  'uruguay': 'Uruguay',
  'chile': 'Chile',
  'peru': 'Peru', 'perú': 'Peru',
  'venezuela': 'Venezuela',
  'bolivia': 'Bolivia',
  'paraguay': 'Paraguay',
  'canada': 'Canada', 'canadá': 'Canada',
  'costa rica': 'Costa Rica',
  'panama': 'Panama', 'panamá': 'Panama',
  'jamaica': 'Jamaica',
  'honduras': 'Honduras',
  'el salvador': 'El Salvador',
  'morocco': 'Morocco', 'marruecos': 'Morocco',
  'senegal': 'Senegal',
  'nigeria': 'Nigeria',
  'cameroon': 'Cameroon', 'camerún': 'Cameroon',
  'ghana': 'Ghana',
  'egypt': 'Egypt', 'egipto': 'Egypt',
  'south africa': 'South Africa', 'sudáfrica': 'South Africa',
  'saudi arabia': 'Saudi Arabia', 'arabia saudita': 'Saudi Arabia',
  'japan': 'Japan', 'japón': 'Japan',
  'south korea': 'South Korea', 'corea del sur': 'South Korea',
  'australia': 'Australia',
  'iran': 'Iran', 'irán': 'Iran',
  'qatar': 'Qatar',
  'switzerland': 'Switzerland', 'suiza': 'Switzerland',
  'croatia': 'Croatia', 'croacia': 'Croatia',
  'poland': 'Poland', 'polonia': 'Poland',
  'denmark': 'Denmark', 'dinamarca': 'Denmark',
  'serbia': 'Serbia',
  'belgium': 'Belgium', 'bélgica': 'Belgium',
  'ukraine': 'Ukraine', 'ucrania': 'Ukraine',
  'turkey': 'Turkey', 'turquía': 'Turkey',
  'hungary': 'Hungary', 'hungría': 'Hungary',
  'slovakia': 'Slovakia', 'eslovaquia': 'Slovakia',
  'slovenia': 'Slovenia', 'eslovenia': 'Slovenia',
  'austria': 'Austria',
  'scotland': 'Scotland', 'escocia': 'Scotland',
  'greece': 'Greece', 'grecia': 'Greece',
  'wales': 'Wales', 'gales': 'Wales',
}

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalizeTeamName(name: string): string {
  const key = stripAccents(name.toLowerCase().trim())
  return TEAM_NAME_MAP[key] ?? name
}

function matchesTeam(apiName: string, targetName: string): boolean {
  const normalizedApi = normalizeTeamName(apiName)
  const normalizedTarget = normalizeTeamName(targetName)
  if (normalizedApi === normalizedTarget) return true

  const apiKey = stripAccents(apiName.toLowerCase().trim())
  const targetKey = stripAccents(targetName.toLowerCase().trim())
  return apiKey.includes(targetKey) || targetKey.includes(apiKey)
}

export function adjustedProbabilities(outcomes: OddsAPIOutcome[]): number[] | null {
  if (outcomes.some(o => o.price <= 1.0)) return null

  const raws = outcomes.map(o => 1 / o.price)
  const overround = raws.reduce((sum, r) => sum + r, 0)

  if (overround === 0) return null

  return raws.map(r => r / overround)
}

export async function loadOdds(homeTeam: string, awayTeam: string): Promise<OddsResult> {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY
    if (!apiKey) return null

    const url = new URL('https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds')
    url.searchParams.set('apiKey', apiKey)
    url.searchParams.set('regions', 'eu')
    url.searchParams.set('markets', 'h2h,totals')
    url.searchParams.set('oddsFormat', 'decimal')

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) return null

    const events: OddsAPIEvent[] = await response.json()

    const event = events.find(e =>
      matchesTeam(e.home_team, homeTeam) && matchesTeam(e.away_team, awayTeam)
    )

    if (!event) return null

    const h2hOutcomesByBookmaker: OddsAPIOutcome[][] = []
    const totalsOutcomesByBookmaker: OddsAPIOutcome[][] = []

    for (const bookmaker of event.bookmakers) {
      for (const market of bookmaker.markets) {
        if (market.key === 'h2h') {
          h2hOutcomesByBookmaker.push(market.outcomes)
        } else if (market.key === 'totals') {
          totalsOutcomesByBookmaker.push(market.outcomes)
        }
      }
    }

    if (h2hOutcomesByBookmaker.length === 0) return null

    const h2hAggregated = aggregateOutcomes(h2hOutcomesByBookmaker)
    const h2hProbs = adjustedProbabilities(h2hAggregated)
    if (!h2hProbs) return null

    const homeOutcomeIndex = h2hAggregated.findIndex(o =>
      matchesTeam(o.name, homeTeam)
    )
    const awayOutcomeIndex = h2hAggregated.findIndex(o =>
      matchesTeam(o.name, awayTeam)
    )
    const drawOutcomeIndex = h2hAggregated.findIndex(o =>
      o.name.toLowerCase() === 'draw'
    )

    if (homeOutcomeIndex === -1 || awayOutcomeIndex === -1 || drawOutcomeIndex === -1) return null

    let over25: number | null = null
    let under25: number | null = null

    if (totalsOutcomesByBookmaker.length > 0) {
      const totalsAggregated = aggregateOutcomes(totalsOutcomesByBookmaker)
      const totals25 = totalsAggregated.filter(o => o.point === 2.5)

      if (totals25.length >= 2) {
        const totalsProbs = adjustedProbabilities(totals25)
        if (totalsProbs) {
          const overIndex = totals25.findIndex(o => o.name.toLowerCase() === 'over')
          const underIndex = totals25.findIndex(o => o.name.toLowerCase() === 'under')
          if (overIndex !== -1) over25 = totalsProbs[overIndex]
          if (underIndex !== -1) under25 = totalsProbs[underIndex]
        }
      }
    }

    return {
      homeWin: h2hProbs[homeOutcomeIndex],
      draw: h2hProbs[drawOutcomeIndex],
      awayWin: h2hProbs[awayOutcomeIndex],
      over25,
      under25,
      bookmakerCount: event.bookmakers.length,
      fetchedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[odds-loader] Error fetching odds:', err)
    return null
  }
}

export function aggregateOutcomes(outcomeGroups: OddsAPIOutcome[][]): OddsAPIOutcome[] {
  const priceMap = new Map<string, { total: number; count: number; point?: number }>()

  for (const outcomes of outcomeGroups) {
    for (const outcome of outcomes) {
      const key = outcome.point !== undefined
        ? `${outcome.name}:${outcome.point}`
        : outcome.name
      const existing = priceMap.get(key)
      if (existing) {
        existing.total += outcome.price
        existing.count += 1
      } else {
        priceMap.set(key, { total: outcome.price, count: 1, point: outcome.point })
      }
    }
  }

  return Array.from(priceMap.entries()).map(([key, val]) => {
    const name = val.point !== undefined ? key.split(':')[0] : key
    return { name, price: val.total / val.count, point: val.point }
  })
}
