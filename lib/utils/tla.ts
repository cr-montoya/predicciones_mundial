const TLA: Record<string, string> = {
  'Argentina': 'ARG', 'Brazil': 'BRA', 'France': 'FRA', 'Germany': 'GER',
  'Spain': 'ESP', 'England': 'ENG', 'Portugal': 'POR', 'Netherlands': 'NED',
  'Belgium': 'BEL', 'Croatia': 'CRO', 'Uruguay': 'URU', 'Denmark': 'DEN',
  'Switzerland': 'SUI', 'United States': 'USA', 'Mexico': 'MEX', 'Canada': 'CAN',
  'Japan': 'JPN', 'South Korea': 'KOR', 'Morocco': 'MAR', 'Senegal': 'SEN',
  'Colombia': 'COL', 'Ecuador': 'ECU', 'Australia': 'AUS', 'Poland': 'POL',
  'Sweden': 'SWE', 'Turkey': 'TUR', 'Iran': 'IRN', 'Saudi Arabia': 'KSA',
  'Ghana': 'GHA', 'Tunisia': 'TUN', 'Egypt': 'EGY', 'Nigeria': 'NGA',
  'Cameroon': 'CMR', 'South Africa': 'RSA', 'Ivory Coast': "CIV",
  'Czechia': 'CZE', 'Austria': 'AUT', 'Scotland': 'SCO', 'Wales': 'WAL',
  'Norway': 'NOR', 'New Zealand': 'NZL', 'Paraguay': 'PAR', 'Haiti': 'HAI',
  'Qatar': 'QAT', 'Iraq': 'IRQ', 'Jordan': 'JOR', 'Uzbekistan': 'UZB',
  'Cape Verde Islands': 'CPV', 'Congo DR': 'COD', 'Algeria': 'ALG',
  'Bosnia-Herzegovina': 'BIH', 'Panama': 'PAN', 'Curaçao': 'CUW',
  'Bosnia Herzegovina': 'BIH',
}

export function getTla(teamName: string): string {
  return TLA[teamName] ?? teamName.replace(/\s+/g, '').slice(0, 3).toUpperCase()
}
