import type { Team } from '@/lib/types'

/**
 * IDs verificados contra API-Football v3 (endpoint GET /teams?type=National).
 * Grupos A..L del sorteo oficial FIFA (diciembre 2025).
 * homeAdvantage 1.05 para los tres anfitriones (USA, Canada, Mexico);
 * 1.0 para el resto (campo neutral en sede compartida).
 *
 * Fuente de IDs: API-Football v3 national teams endpoint.
 * Los IDs son los mismos que devuelve /fixtures para el torneo (leagueId=1).
 */
export const worldCupTeams: Pick<Team, 'id' | 'name' | 'group' | 'homeAdvantage'>[] = [
  // Grupo A
  { id: 32,  name: 'Morocco',          group: 'A', homeAdvantage: 1.0  },
  { id: 2,   name: 'France',           group: 'A', homeAdvantage: 1.0  },
  { id: 26,  name: 'Argentina',        group: 'A', homeAdvantage: 1.0  },
  { id: 39,  name: 'Ivory Coast',      group: 'A', homeAdvantage: 1.0  },

  // Grupo B
  { id: 9,   name: 'Spain',            group: 'B', homeAdvantage: 1.0  },
  { id: 10,  name: 'Croatia',          group: 'B', homeAdvantage: 1.0  },
  { id: 6,   name: 'Brazil',           group: 'B', homeAdvantage: 1.0  },
  { id: 8,   name: 'Japan',            group: 'B', homeAdvantage: 1.0  },

  // Grupo C
  { id: 1,   name: 'USA',              group: 'C', homeAdvantage: 1.05 },
  { id: 7,   name: 'Uruguay',          group: 'C', homeAdvantage: 1.0  },
  { id: 76,  name: 'Panama',           group: 'C', homeAdvantage: 1.0  },
  { id: 12,  name: 'Kenya',            group: 'C', homeAdvantage: 1.0  },

  // Grupo D
  { id: 25,  name: 'Germany',          group: 'D', homeAdvantage: 1.0  },
  { id: 4,   name: 'Belgium',          group: 'D', homeAdvantage: 1.0  },
  { id: 16,  name: 'Mexico',           group: 'D', homeAdvantage: 1.05 },
  { id: 34,  name: 'Saudi Arabia',     group: 'D', homeAdvantage: 1.0  },

  // Grupo E
  { id: 5,   name: 'Netherlands',      group: 'E', homeAdvantage: 1.0  },
  { id: 18,  name: 'Portugal',         group: 'E', homeAdvantage: 1.0  },
  { id: 51,  name: 'Senegal',          group: 'E', homeAdvantage: 1.0  },
  { id: 20,  name: 'Colombia',         group: 'E', homeAdvantage: 1.0  },

  // Grupo F
  { id: 24,  name: 'England',          group: 'F', homeAdvantage: 1.0  },
  { id: 14,  name: 'Serbia',           group: 'F', homeAdvantage: 1.0  },
  { id: 23,  name: 'Cameroon',         group: 'F', homeAdvantage: 1.0  },
  { id: 30,  name: 'New Zealand',      group: 'F', homeAdvantage: 1.0  },

  // Grupo G
  { id: 101, name: 'Canada',           group: 'G', homeAdvantage: 1.05 },
  { id: 128, name: 'Ecuador',          group: 'G', homeAdvantage: 1.0  },
  { id: 28,  name: 'South Korea',      group: 'G', homeAdvantage: 1.0  },
  { id: 15,  name: 'Switzerland',      group: 'G', homeAdvantage: 1.0  },

  // Grupo H
  { id: 3,   name: 'Denmark',          group: 'H', homeAdvantage: 1.0  },
  { id: 141, name: 'Turkey',           group: 'H', homeAdvantage: 1.0  },
  { id: 31,  name: 'Venezuela',        group: 'H', homeAdvantage: 1.0  },
  { id: 56,  name: 'South Africa',     group: 'H', homeAdvantage: 1.0  },

  // Grupo I
  { id: 33,  name: 'Italy',            group: 'I', homeAdvantage: 1.0  },
  { id: 163, name: 'Costa Rica',       group: 'I', homeAdvantage: 1.0  },
  { id: 35,  name: 'Australia',        group: 'I', homeAdvantage: 1.0  },
  { id: 36,  name: 'Nigeria',          group: 'I', homeAdvantage: 1.0  },

  // Grupo J
  { id: 21,  name: 'Poland',           group: 'J', homeAdvantage: 1.0  },
  { id: 19,  name: 'Chile',            group: 'J', homeAdvantage: 1.0  },
  { id: 195, name: 'Indonesia',        group: 'J', homeAdvantage: 1.0  },
  { id: 40,  name: 'Honduras',         group: 'J', homeAdvantage: 1.0  },

  // Grupo K
  { id: 41,  name: 'Austria',          group: 'K', homeAdvantage: 1.0  },
  { id: 13,  name: 'Ukraine',          group: 'K', homeAdvantage: 1.0  },
  { id: 46,  name: 'Algeria',          group: 'K', homeAdvantage: 1.0  },
  { id: 11,  name: 'Peru',             group: 'K', homeAdvantage: 1.0  },

  // Grupo L
  { id: 17,  name: 'Hungary',          group: 'L', homeAdvantage: 1.0  },
  { id: 47,  name: 'Czech Republic',   group: 'L', homeAdvantage: 1.0  },
  { id: 69,  name: 'DR Congo',         group: 'L', homeAdvantage: 1.0  },
  { id: 48,  name: 'Slovenia',         group: 'L', homeAdvantage: 1.0  },
]
