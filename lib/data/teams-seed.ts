import type { Team } from '@/lib/types'

/**
 * 48 equipos del Mundial 2026 (sources: football-data.org fixtures WC 2026).
 * IDs son API-Football v3 team IDs (mismo que devuelve /fixtures para leagueId=1).
 * homeAdvantage 1.05 para los tres anfitriones (USA, Canada, Mexico);
 * 1.0 para el resto (campos neutrales en sede compartida).
 * Grupos A..L del sorteo oficial FIFA.
 */
export const worldCupTeams: Pick<Team, 'id' | 'name' | 'group' | 'homeAdvantage'>[] = [
  // Grupo A
  { id: 26,  name: 'Argentina',        group: 'A', homeAdvantage: 1.0  },
  { id: 2,   name: 'France',           group: 'A', homeAdvantage: 1.0  },
  { id: 32,  name: 'Morocco',          group: 'A', homeAdvantage: 1.0  },
  { id: 39,  name: 'Ivory Coast',      group: 'A', homeAdvantage: 1.0  },

  // Grupo B
  { id: 9,   name: 'Spain',            group: 'B', homeAdvantage: 1.0  },
  { id: 6,   name: 'Brazil',           group: 'B', homeAdvantage: 1.0  },
  { id: 3,   name: 'Croatia',          group: 'B', homeAdvantage: 1.0  },
  { id: 21,  name: 'Japan',            group: 'B', homeAdvantage: 1.0  },

  // Grupo C
  { id: 1,   name: 'United States',    group: 'C', homeAdvantage: 1.05 },
  { id: 7,   name: 'Uruguay',          group: 'C', homeAdvantage: 1.0  },
  { id: 22,  name: 'Panama',           group: 'C', homeAdvantage: 1.0  },
  { id: 14,  name: 'Paraguay',         group: 'C', homeAdvantage: 1.0  },

  // Grupo D
  { id: 25,  name: 'Germany',          group: 'D', homeAdvantage: 1.0  },
  { id: 16,  name: 'Mexico',           group: 'D', homeAdvantage: 1.05 },
  { id: 4,   name: 'Belgium',          group: 'D', homeAdvantage: 1.0  },
  { id: 34,  name: 'Saudi Arabia',     group: 'D', homeAdvantage: 1.0  },

  // Grupo E
  { id: 5,   name: 'Netherlands',      group: 'E', homeAdvantage: 1.0  },
  { id: 20,  name: 'Colombia',         group: 'E', homeAdvantage: 1.0  },
  { id: 10,  name: 'Portugal',         group: 'E', homeAdvantage: 1.0  },
  { id: 51,  name: 'Senegal',          group: 'E', homeAdvantage: 1.0  },

  // Grupo F
  { id: 24,  name: 'England',          group: 'F', homeAdvantage: 1.0  },
  { id: 63,  name: 'Czechia',          group: 'F', homeAdvantage: 1.0  },
  { id: 30,  name: 'New Zealand',      group: 'F', homeAdvantage: 1.0  },
  { id: 33,  name: 'Tunisia',          group: 'F', homeAdvantage: 1.0  },

  // Grupo G
  { id: 101, name: 'Canada',           group: 'G', homeAdvantage: 1.05 },
  { id: 128, name: 'Ecuador',          group: 'G', homeAdvantage: 1.0  },
  { id: 28,  name: 'South Korea',      group: 'G', homeAdvantage: 1.0  },
  { id: 15,  name: 'Switzerland',      group: 'G', homeAdvantage: 1.0  },

  // Grupo H
  { id: 141, name: 'Turkey',           group: 'H', homeAdvantage: 1.0  },
  { id: 56,  name: 'South Africa',     group: 'H', homeAdvantage: 1.0  },
  { id: 31,  name: 'Iran',             group: 'H', homeAdvantage: 1.0  },
  { id: 197, name: 'Qatar',            group: 'H', homeAdvantage: 1.0  },

  // Grupo I
  { id: 35,  name: 'Australia',        group: 'I', homeAdvantage: 1.0  },
  { id: 37,  name: 'Egypt',            group: 'I', homeAdvantage: 1.0  },
  { id: 168, name: 'Haiti',            group: 'I', homeAdvantage: 1.0  },
  { id: 172, name: 'Jordan',           group: 'I', homeAdvantage: 1.0  },

  // Grupo J
  { id: 92,  name: 'Bosnia-Herzegovina', group: 'J', homeAdvantage: 1.0  },
  { id: 173, name: 'Iraq',             group: 'J', homeAdvantage: 1.0  },
  { id: 206, name: 'Cape Verde Islands', group: 'J', homeAdvantage: 1.0  },
  { id: 617, name: 'Curaçao',          group: 'J', homeAdvantage: 1.0  },

  // Grupo K
  { id: 41,  name: 'Austria',          group: 'K', homeAdvantage: 1.0  },
  { id: 46,  name: 'Algeria',          group: 'K', homeAdvantage: 1.0  },
  { id: 90,  name: 'Uzbekistan',       group: 'K', homeAdvantage: 1.0  },
  { id: 135, name: 'Ghana',            group: 'K', homeAdvantage: 1.0  },

  // Grupo L
  { id: 17,  name: 'Sweden',           group: 'L', homeAdvantage: 1.0  },
  { id: 69,  name: 'Congo DR',         group: 'L', homeAdvantage: 1.0  },
  { id: 119, name: 'Norway',           group: 'L', homeAdvantage: 1.0  },
  { id: 1179, name: 'Scotland',        group: 'L', homeAdvantage: 1.0  },
]
