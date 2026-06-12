import type { Team } from '@/lib/types'

/**
 * 48 equipos del Mundial 2026 (source: football-data.org fixtures WC 2026).
 * IDs son API-Football v3 team IDs (mismo que devuelve /fixtures para leagueId=1).
 * Grupos A..L de los fixtures reales de football-data.org (GROUP_STAGE).
 * homeAdvantage 1.05 para los tres anfitriones (USA, Canada, Mexico);
 * 1.0 para el resto (campos neutrales en sede compartida).
 */
export const worldCupTeams: Pick<Team, 'id' | 'name' | 'group' | 'homeAdvantage'>[] = [
  // Grupo A (GROUP_A en football-data.org)
  { id: 16,  name: 'Mexico',           group: 'A', homeAdvantage: 1.05 },
  { id: 28,  name: 'South Korea',      group: 'A', homeAdvantage: 1.0  },
  { id: 56,  name: 'South Africa',     group: 'A', homeAdvantage: 1.0  },
  { id: 63,  name: 'Czechia',          group: 'A', homeAdvantage: 1.0  },

  // Grupo B (GROUP_B en football-data.org)
  { id: 15,  name: 'Switzerland',      group: 'B', homeAdvantage: 1.0  },
  { id: 101, name: 'Canada',           group: 'B', homeAdvantage: 1.05 },
  { id: 92,  name: 'Bosnia-Herzegovina', group: 'B', homeAdvantage: 1.0  },
  { id: 197, name: 'Qatar',            group: 'B', homeAdvantage: 1.0  },

  // Grupo C (GROUP_C en football-data.org)
  { id: 6,   name: 'Brazil',           group: 'C', homeAdvantage: 1.0  },
  { id: 32,  name: 'Morocco',          group: 'C', homeAdvantage: 1.0  },
  { id: 168, name: 'Haiti',            group: 'C', homeAdvantage: 1.0  },
  { id: 1179, name: 'Scotland',        group: 'C', homeAdvantage: 1.0  },

  // Grupo D (GROUP_D en football-data.org)
  { id: 1,   name: 'United States',    group: 'D', homeAdvantage: 1.05 },
  { id: 35,  name: 'Australia',        group: 'D', homeAdvantage: 1.0  },
  { id: 141, name: 'Turkey',           group: 'D', homeAdvantage: 1.0  },
  { id: 14,  name: 'Paraguay',         group: 'D', homeAdvantage: 1.0  },

  // Grupo E (GROUP_E en football-data.org)
  { id: 128, name: 'Ecuador',          group: 'E', homeAdvantage: 1.0  },
  { id: 25,  name: 'Germany',          group: 'E', homeAdvantage: 1.0  },
  { id: 39,  name: 'Ivory Coast',      group: 'E', homeAdvantage: 1.0  },
  { id: 617, name: 'Curaçao',          group: 'E', homeAdvantage: 1.0  },

  // Grupo F (GROUP_F en football-data.org)
  { id: 21,  name: 'Japan',            group: 'F', homeAdvantage: 1.0  },
  { id: 17,  name: 'Sweden',           group: 'F', homeAdvantage: 1.0  },
  { id: 33,  name: 'Tunisia',          group: 'F', homeAdvantage: 1.0  },
  { id: 5,   name: 'Netherlands',      group: 'F', homeAdvantage: 1.0  },

  // Grupo G (GROUP_G en football-data.org)
  { id: 4,   name: 'Belgium',          group: 'G', homeAdvantage: 1.0  },
  { id: 30,  name: 'New Zealand',      group: 'G', homeAdvantage: 1.0  },
  { id: 37,  name: 'Egypt',            group: 'G', homeAdvantage: 1.0  },
  { id: 31,  name: 'Iran',             group: 'G', homeAdvantage: 1.0  },

  // Grupo H (GROUP_H en football-data.org)
  { id: 7,   name: 'Uruguay',          group: 'H', homeAdvantage: 1.0  },
  { id: 9,   name: 'Spain',            group: 'H', homeAdvantage: 1.0  },
  { id: 34,  name: 'Saudi Arabia',     group: 'H', homeAdvantage: 1.0  },
  { id: 206, name: 'Cape Verde Islands', group: 'H', homeAdvantage: 1.0  },

  // Grupo I (GROUP_I en football-data.org)
  { id: 2,   name: 'France',           group: 'I', homeAdvantage: 1.0  },
  { id: 51,  name: 'Senegal',          group: 'I', homeAdvantage: 1.0  },
  { id: 173, name: 'Iraq',             group: 'I', homeAdvantage: 1.0  },
  { id: 119, name: 'Norway',           group: 'I', homeAdvantage: 1.0  },

  // Grupo J (GROUP_J en football-data.org)
  { id: 26,  name: 'Argentina',        group: 'J', homeAdvantage: 1.0  },
  { id: 46,  name: 'Algeria',          group: 'J', homeAdvantage: 1.0  },
  { id: 41,  name: 'Austria',          group: 'J', homeAdvantage: 1.0  },
  { id: 172, name: 'Jordan',           group: 'J', homeAdvantage: 1.0  },

  // Grupo K (GROUP_K en football-data.org)
  { id: 20,  name: 'Colombia',         group: 'K', homeAdvantage: 1.0  },
  { id: 10,  name: 'Portugal',         group: 'K', homeAdvantage: 1.0  },
  { id: 69,  name: 'Congo DR',         group: 'K', homeAdvantage: 1.0  },
  { id: 90,  name: 'Uzbekistan',       group: 'K', homeAdvantage: 1.0  },

  // Grupo L (GROUP_L en football-data.org)
  { id: 24,  name: 'England',          group: 'L', homeAdvantage: 1.0  },
  { id: 3,   name: 'Croatia',          group: 'L', homeAdvantage: 1.0  },
  { id: 135, name: 'Ghana',            group: 'L', homeAdvantage: 1.0  },
  { id: 22,  name: 'Panama',           group: 'L', homeAdvantage: 1.0  },
]
