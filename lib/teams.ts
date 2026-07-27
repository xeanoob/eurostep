export interface TeamData {
  id: string
  name: string
  shortName: string
  city: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  starPlayer: {
    name: string
    number: string
    position: string
    imageUrl?: string
  }
  logoUrl?: string
}

/**
 * Team database — colors are official RGB hex.
 * Star players are the current franchise players.
 * Extend this with more teams as needed.
 */
export const TEAMS: Record<string, TeamData> = {
  // ==================
  // Betclic Élite (FR)
  // ==================
  'AS Monaco Basket': {
    id: 'monaco',
    name: 'AS Monaco Basket',
    shortName: 'Monaco',
    city: 'Monaco',
    colors: { primary: '#DA291C', secondary: '#FFFFFF', accent: '#C8102E' },
    starPlayer: { name: 'Mike James', number: '55', position: 'Guard' },
  },
  'LDLC ASVEL': {
    id: 'asvel',
    name: 'LDLC ASVEL',
    shortName: 'ASVEL',
    city: 'Villeurbanne',
    colors: { primary: '#005B2E', secondary: '#FFD700', accent: '#00843D' },
    starPlayer: { name: 'Nando De Colo', number: '1', position: 'Guard' },
  },
  'Paris Basketball': {
    id: 'paris',
    name: 'Paris Basketball',
    shortName: 'Paris',
    city: 'Paris',
    colors: { primary: '#1A237E', secondary: '#E91E63', accent: '#3F51B5' },
    starPlayer: { name: 'T.J. Shorts', number: '0', position: 'Guard' },
  },
  'JL Bourg Basket': {
    id: 'bourg',
    name: 'JL Bourg Basket',
    shortName: 'Bourg',
    city: 'Bourg-en-Bresse',
    colors: { primary: '#FFB300', secondary: '#000000', accent: '#FFC107' },
    starPlayer: { name: 'Amine Noua', number: '8', position: 'Forward' },
  },
  'SIG Strasbourg': {
    id: 'strasbourg',
    name: 'SIG Strasbourg',
    shortName: 'SIG',
    city: 'Strasbourg',
    colors: { primary: '#0072CE', secondary: '#FFFFFF', accent: '#0091D5' },
    starPlayer: { name: 'Brandon Jefferson', number: '5', position: 'Guard' },
  },
  'Cholet Basket': {
    id: 'cholet',
    name: 'Cholet Basket',
    shortName: 'Cholet',
    city: 'Cholet',
    colors: { primary: '#E30613', secondary: '#1D1D1B', accent: '#FF1744' },
    starPlayer: { name: 'Aaron Wheeler', number: '22', position: 'Forward' },
  },
  'CSP Limoges': {
    id: 'limoges',
    name: 'CSP Limoges',
    shortName: 'Limoges',
    city: 'Limoges',
    colors: { primary: '#00A651', secondary: '#FFFFFF', accent: '#4CAF50' },
    starPlayer: { name: 'Hugo Besson', number: '7', position: 'Guard' },
  },
  'Le Mans Sarthe Basket': {
    id: 'lemans',
    name: 'Le Mans Sarthe Basket',
    shortName: 'Le Mans',
    city: 'Le Mans',
    colors: { primary: '#FF6F00', secondary: '#1B5E20', accent: '#FF9800' },
    starPlayer: { name: 'Terry Tarpey', number: '32', position: 'Forward' },
  },
  'JDA Dijon Basket': {
    id: 'dijon',
    name: 'JDA Dijon Basket',
    shortName: 'Dijon',
    city: 'Dijon',
    colors: { primary: '#B71C1C', secondary: '#000000', accent: '#D32F2F' },
    starPlayer: { name: 'David Holston', number: '3', position: 'Guard' },
  },
  'Pau-Lacq-Orthez': {
    id: 'pau',
    name: 'Pau-Lacq-Orthez',
    shortName: 'Pau',
    city: 'Pau',
    colors: { primary: '#006233', secondary: '#FFFFFF', accent: '#2E7D32' },
    starPlayer: { name: 'Trevon Bluiett', number: '5', position: 'Guard' },
  },

  // ==================
  // EuroLeague
  // ==================
  'Real Madrid': {
    id: 'realmadrid',
    name: 'Real Madrid Baloncesto',
    shortName: 'Real',
    city: 'Madrid',
    colors: { primary: '#FFFFFF', secondary: '#00529F', accent: '#FEBE10' },
    starPlayer: { name: 'Facundo Campazzo', number: '7', position: 'Guard', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630267.png' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Real_Madrid_Baloncesto_logo.svg/200px-Real_Madrid_Baloncesto_logo.svg.png'
  },
  'Olympiacos Piraeus': {
    id: 'olympiacos',
    name: 'Olympiacos BC',
    shortName: 'Olympiacos',
    city: 'Pirée',
    colors: { primary: '#CC0000', secondary: '#FFFFFF', accent: '#FF1744' },
    starPlayer: { name: 'Sasha Vezenkov', number: '8', position: 'Forward' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e2/Olympiacos_BC_logo.svg/200px-Olympiacos_BC_logo.svg.png'
  },
  'Fenerbahçe': {
    id: 'fenerbahce',
    name: 'Fenerbahçe Beko',
    shortName: 'Fener',
    city: 'Istanbul',
    colors: { primary: '#FFED00', secondary: '#00296B', accent: '#FFD600' },
    starPlayer: { name: 'Nick Calathes', number: '33', position: 'Guard' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Fenerbah%C3%A7e_Beko_logo.svg/200px-Fenerbah%C3%A7e_Beko_logo.svg.png'
  },
  'FC Barcelona': {
    id: 'barcelona',
    name: 'FC Barcelona Basket',
    shortName: 'Barça',
    city: 'Barcelone',
    colors: { primary: '#A50044', secondary: '#004D98', accent: '#EDBB00' },
    starPlayer: { name: 'Nikola Laprovittola', number: '20', position: 'Guard' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/FC_Barcelona_logo.svg/200px-FC_Barcelona_logo.svg.png'
  },
  'Panathinaikos': {
    id: 'panathinaikos',
    name: 'Panathinaikos BC',
    shortName: 'Pana',
    city: 'Athènes',
    colors: { primary: '#006838', secondary: '#FFFFFF', accent: '#00C853' },
    starPlayer: { name: 'Kendrick Nunn', number: '12', position: 'Guard' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/Panathinaikos_BC_logo.svg/200px-Panathinaikos_BC_logo.svg.png'
  },
  'Anadolu Efes': {
    id: 'efes',
    name: 'Anadolu Efes',
    shortName: 'Efes',
    city: 'Istanbul',
    colors: { primary: '#004785', secondary: '#C9002B', accent: '#FFFFFF' },
    starPlayer: { name: 'Shane Larkin', number: '0', position: 'Guard' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Anadolu_Efes_SK_logo.svg/200px-Anadolu_Efes_SK_logo.svg.png'
  },
  'AS Monaco': {
    id: 'monaco',
    name: 'AS Monaco Basket',
    shortName: 'Monaco',
    city: 'Monaco',
    colors: { primary: '#E32219', secondary: '#FFFFFF', accent: '#FFCC00' },
    starPlayer: { name: 'Mike James', number: '55', position: 'Guard', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628455.png' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/AS_Monaco_Basket_logo.svg/200px-AS_Monaco_Basket_logo.svg.png'
  },
  'Baskonia': {
    id: 'baskonia',
    name: 'Baskonia Vitoria-Gasteiz',
    shortName: 'Baskonia',
    city: 'Vitoria-Gasteiz',
    colors: { primary: '#D21034', secondary: '#002B5C', accent: '#FFFFFF' },
    starPlayer: { name: 'Markus Howard', number: '0', position: 'Guard' },
  },
  'Crvena Zvezda': {
    id: 'crvenazvezda',
    name: 'Crvena Zvezda Meridianbet',
    shortName: 'Zvezda',
    city: 'Belgrade',
    colors: { primary: '#E31837', secondary: '#FFFFFF', accent: '#111111' },
    starPlayer: { name: 'Miloš Teodosić', number: '4', position: 'Guard' },
  },
  'Olimpia Milano': {
    id: 'milano',
    name: 'EA7 Emporio Armani Milan',
    shortName: 'Milano',
    city: 'Milan',
    colors: { primary: '#C8102E', secondary: '#FFFFFF', accent: '#111111' },
    starPlayer: { name: 'Nikola Mirotić', number: '33', position: 'Forward', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202703.png' },
  },
  'Maccabi Tel Aviv': {
    id: 'maccabi',
    name: 'Maccabi Playtika Tel Aviv',
    shortName: 'Maccabi',
    city: 'Tel Aviv',
    colors: { primary: '#FFCC00', secondary: '#002B5C', accent: '#FFFFFF' },
    starPlayer: { name: 'Wade Baldwin IV', number: '5', position: 'Guard' },
  },
  'Partizan': {
    id: 'partizan',
    name: 'Partizan Mozzart Bet',
    shortName: 'Partizan',
    city: 'Belgrade',
    colors: { primary: '#111111', secondary: '#FFFFFF', accent: '#888888' },
    starPlayer: { name: 'Kevin Punter', number: '7', position: 'Guard' },
  },
  'Virtus Bologna': {
    id: 'virtus',
    name: 'Virtus Segafredo Bologna',
    shortName: 'Virtus',
    city: 'Bologna',
    colors: { primary: '#111111', secondary: '#FFFFFF', accent: '#888888' },
    starPlayer: { name: 'Tornike Shengelia', number: '21', position: 'Forward' },
  },
  'Zalgiris Kaunas': {
    id: 'zalgiris',
    name: 'Zalgiris Kaunas',
    shortName: 'Zalgiris',
    city: 'Kaunas',
    colors: { primary: '#006B3F', secondary: '#FFFFFF', accent: '#111111' },
    starPlayer: { name: 'Keenan Evans', number: '2', position: 'Guard' },
  },
  'Bayern Munich': {
    id: 'bayern',
    name: 'FC Bayern Munich',
    shortName: 'Bayern',
    city: 'Munich',
    colors: { primary: '#DC052D', secondary: '#0066B2', accent: '#FFFFFF' },
    starPlayer: { name: 'Serge Ibaka', number: '9', position: 'Center', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201935.png' },
  },
  'Paris Basketball': {
    id: 'paris',
    name: 'Paris Basketball',
    shortName: 'Paris',
    city: 'Paris',
    colors: { primary: '#111111', secondary: '#FFFFFF', accent: '#00A3E0' },
    starPlayer: { name: 'T.J. Shorts II', number: '0', position: 'Guard' },
  },

  // ==================
  // NBA (via BallDontLie API)
  // ==================
  'Los Angeles Lakers': {
    id: 'lakers',
    name: 'Los Angeles Lakers',
    shortName: 'Lakers',
    city: 'Los Angeles',
    colors: { primary: '#552583', secondary: '#FDB927', accent: '#FDB927' },
    starPlayer: { name: 'LeBron James', number: '23', position: 'Forward' },
  },
  'Boston Celtics': {
    id: 'celtics',
    name: 'Boston Celtics',
    shortName: 'Celtics',
    city: 'Boston',
    colors: { primary: '#007A33', secondary: '#BA9653', accent: '#FFFFFF' },
    starPlayer: { name: 'Jayson Tatum', number: '0', position: 'Forward' },
  },
  'Golden State Warriors': {
    id: 'warriors',
    name: 'Golden State Warriors',
    shortName: 'Warriors',
    city: 'San Francisco',
    colors: { primary: '#1D428A', secondary: '#FFC72C', accent: '#FFC72C' },
    starPlayer: { name: 'Stephen Curry', number: '30', position: 'Guard' },
  },
  'Milwaukee Bucks': {
    id: 'bucks',
    name: 'Milwaukee Bucks',
    shortName: 'Bucks',
    city: 'Milwaukee',
    colors: { primary: '#00471B', secondary: '#EEE1C6', accent: '#0077C0' },
    starPlayer: { name: 'Giannis Antetokounmpo', number: '34', position: 'Forward' },
  },
  'Denver Nuggets': {
    id: 'nuggets',
    name: 'Denver Nuggets',
    shortName: 'Nuggets',
    city: 'Denver',
    colors: { primary: '#0E2240', secondary: '#FEC524', accent: '#8B2131' },
    starPlayer: { name: 'Nikola Jokić', number: '15', position: 'Center' },
  },
  'Phoenix Suns': {
    id: 'suns',
    name: 'Phoenix Suns',
    shortName: 'Suns',
    city: 'Phoenix',
    colors: { primary: '#1D1160', secondary: '#E56020', accent: '#63727A' },
    starPlayer: { name: 'Kevin Durant', number: '35', position: 'Forward' },
  },
  'Miami Heat': {
    id: 'heat',
    name: 'Miami Heat',
    shortName: 'Heat',
    city: 'Miami',
    colors: { primary: '#98002E', secondary: '#F9A01B', accent: '#000000' },
    starPlayer: { name: 'Jimmy Butler', number: '22', position: 'Forward' },
  },
  'Dallas Mavericks': {
    id: 'mavericks',
    name: 'Dallas Mavericks',
    shortName: 'Mavs',
    city: 'Dallas',
    colors: { primary: '#00538C', secondary: '#002B5E', accent: '#B8C4CA' },
    starPlayer: { name: 'Luka Dončić', number: '77', position: 'Guard' },
  },
  // ==================
  // WNBA
  // ==================
  'Las Vegas Aces': {
    id: 'aces',
    name: 'Las Vegas Aces',
    shortName: 'Aces',
    city: 'Las Vegas',
    colors: { primary: '#000000', secondary: '#BA0C2F', accent: '#B4975A' },
    starPlayer: { name: 'A\'ja Wilson', number: '22', position: 'Forward', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/headshots/wnba/players/full/3143494.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/lv.png'
  },
  'New York Liberty': {
    id: 'liberty',
    name: 'New York Liberty',
    shortName: 'Liberty',
    city: 'New York',
    colors: { primary: '#71CCA4', secondary: '#000000', accent: '#FE5000' },
    starPlayer: { name: 'Breanna Stewart', number: '30', position: 'Forward', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/headshots/wnba/players/full/2996914.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/ny.png'
  },
  'Connecticut Sun': {
    id: 'sun',
    name: 'Connecticut Sun',
    shortName: 'Sun',
    city: 'Connecticut',
    colors: { primary: '#D8262C', secondary: '#FFC836', accent: '#041E42' },
    starPlayer: { name: 'Alyssa Thomas', number: '25', position: 'Forward', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/2529140.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/conn.png'
  },
  'Minnesota Lynx': {
    id: 'lynx',
    name: 'Minnesota Lynx',
    shortName: 'Lynx',
    city: 'Minnesota',
    colors: { primary: '#002B5C', secondary: '#78BE20', accent: '#8D9093' },
    starPlayer: { name: 'Napheesa Collier', number: '24', position: 'Forward', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/3917450.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/min.png'
  },
  'Seattle Storm': {
    id: 'storm',
    name: 'Seattle Storm',
    shortName: 'Storm',
    city: 'Seattle',
    colors: { primary: '#15322C', secondary: '#FFC220', accent: '#00653A' },
    starPlayer: { name: 'Jewell Loyd', number: '24', position: 'Guard', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/2987869.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/sea.png'
  },
  'Phoenix Mercury': {
    id: 'mercury',
    name: 'Phoenix Mercury',
    shortName: 'Mercury',
    city: 'Phoenix',
    colors: { primary: '#201747', secondary: '#CB6015', accent: '#000000' },
    starPlayer: { name: 'Diana Taurasi', number: '3', position: 'Guard', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/3371.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/phx.png'
  },
  'Indiana Fever': {
    id: 'fever',
    name: 'Indiana Fever',
    shortName: 'Fever',
    city: 'Indiana',
    colors: { primary: '#041E42', secondary: '#FFB81C', accent: '#C8102E' },
    starPlayer: { name: 'Caitlin Clark', number: '22', position: 'Guard', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/headshots/wnba/players/full/4433403.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/ind.png'
  },
  'Chicago Sky': {
    id: 'sky',
    name: 'Chicago Sky',
    shortName: 'Sky',
    city: 'Chicago',
    colors: { primary: '#418FDE', secondary: '#FFCD00', accent: '#000000' },
    starPlayer: { name: 'Angel Reese', number: '5', position: 'Forward', imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/headshots/wnba/players/full/4433402.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/chi.png'
  },
  'Atlanta Dream': {
    id: 'dream',
    name: 'Atlanta Dream',
    shortName: 'Dream',
    city: 'Atlanta',
    colors: { primary: '#C8102E', secondary: '#041E42', accent: '#B9975B' },
    starPlayer: { name: 'Rhyne Howard', number: '10', position: 'Guard', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/4398674.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/atl.png'
  },
  'Dallas Wings': {
    id: 'wings',
    name: 'Dallas Wings',
    shortName: 'Wings',
    city: 'Dallas',
    colors: { primary: '#002B5C', secondary: '#C8102E', accent: '#CED1D2' },
    starPlayer: { name: 'Arike Ogunbowale', number: '24', position: 'Guard', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/3904577.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/dal.png'
  },
  'Washington Mystics': {
    id: 'mystics',
    name: 'Washington Mystics',
    shortName: 'Mystics',
    city: 'Washington',
    colors: { primary: '#0C2340', secondary: '#C8102E', accent: '#898D8D' },
    starPlayer: { name: 'Ariel Atkins', number: '7', position: 'Guard', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/3146151.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/wsh.png'
  },
  'Los Angeles Sparks': {
    id: 'sparks',
    name: 'Los Angeles Sparks',
    shortName: 'Sparks',
    city: 'Los Angeles',
    colors: { primary: '#552583', secondary: '#FDB927', accent: '#000000' },
    starPlayer: { name: 'Dearica Hamby', number: '5', position: 'Forward', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/2566106.png' },
    logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/la.png'
  },
  'Golden State Valkyries': {
    id: 'valkyries',
    name: 'Golden State Valkyries',
    shortName: 'Valkyries',
    city: 'San Francisco',
    colors: { primary: '#B282FF', secondary: '#000000', accent: '#FFFFFF' },
    starPlayer: { name: 'Kelsey Plum', number: '10', position: 'Guard', imageUrl: 'https://a.espncdn.com/i/headshots/wnba/players/full/3065570.png' },
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Golden_State_Valkyries_logo.svg/200px-Golden_State_Valkyries_logo.svg.png'
  },
  'Toronto Tempo': {
    id: 'tempo',
    name: 'Toronto Tempo',
    shortName: 'Tempo',
    city: 'Toronto',
    colors: { primary: '#CE1141', secondary: '#000000', accent: '#A1A1A4' },
    starPlayer: { name: 'Draft Pick', number: '1', position: 'Forward' },
  },
  'Portland Fire': {
    id: 'fire',
    name: 'Portland Fire',
    shortName: 'Fire',
    city: 'Portland',
    colors: { primary: '#E03A3E', secondary: '#000000', accent: '#FFFFFF' },
    starPlayer: { name: 'Draft Pick', number: '1', position: 'Guard' },
  }
}

/**
 * Find team data by full name or partial match.
 * Falls back to a generic team with neutral colors.
 */
export function findTeam(name: string): TeamData {
  // Exact match
  if (TEAMS[name]) return TEAMS[name]

  // Partial match (e.g. "Lakers" matches "Los Angeles Lakers")
  const lower = name.toLowerCase()
  for (const [key, team] of Object.entries(TEAMS)) {
    if (
      key.toLowerCase().includes(lower) ||
      team.shortName.toLowerCase() === lower ||
      team.city.toLowerCase() === lower ||
      lower.includes(team.shortName.toLowerCase()) ||
      lower.includes(team.city.toLowerCase())
    ) {
      return team
    }
  }

  // Fallback
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    shortName: name.split(' ').pop() ?? name,
    city: '',
    colors: { primary: '#6366F1', secondary: '#FFFFFF', accent: '#818CF8' },
    starPlayer: { name: 'Star Player', number: '0', position: 'Guard' },
  }
}
