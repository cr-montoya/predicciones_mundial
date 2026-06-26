export const FD_BASE_URL = 'https://api.football-data.org'

export const FD_TEAM_MAP: Record<number, number> = {
  758: 7,     // Uruguay
  759: 25,    // Germany
  760: 9,     // Spain
  761: 14,    // Paraguay
  762: 26,    // Argentina
  763: 135,   // Ghana
  764: 6,     // Brazil
  765: 10,    // Portugal
  766: 21,    // Japan
  769: 16,    // Mexico
  770: 24,    // England
  771: 1,     // United States
  772: 28,    // South Korea
  773: 2,     // France
  774: 56,    // South Africa
  778: 46,    // Algeria
  779: 35,    // Australia
  783: 30,    // New Zealand
  788: 15,    // Switzerland
  791: 128,   // Ecuador
  792: 17,    // Sweden
  798: 63,    // Czechia
  799: 3,     // Croatia
  801: 34,    // Saudi Arabia
  802: 33,    // Tunisia
  803: 141,   // Turkey
  804: 51,    // Senegal
  805: 4,     // Belgium
  815: 32,    // Morocco
  816: 41,    // Austria
  818: 20,    // Colombia
  825: 37,    // Egypt
  828: 101,   // Canada
  836: 168,   // Haiti
  840: 31,    // Iran
  1060: 92,   // Bosnia-Herzegovina
  1836: 22,   // Panama
  1930: 206,  // Cape Verde Islands
  1934: 69,   // Congo DR
  1935: 39,   // Ivory Coast
  8030: 197,  // Qatar
  8049: 172,  // Jordan
  8062: 173,  // Iraq
  8070: 90,   // Uzbekistan
  8601: 5,    // Netherlands
  8872: 119,  // Norway
  8873: 1179, // Scotland
  9460: 617,  // Curaçao
}

export function toCanonicalTeamId(fdId: number): number {
  return FD_TEAM_MAP[fdId] ?? fdId
}
