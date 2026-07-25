export const teamDriverMap: Record<string, Record<string, string[]>> = {
  '2026': {
    'Red Bull': ['VER', 'HAD'],
    Ferrari: ['LEC', 'HAM'],
    Mercedes: ['RUS', 'ANT'],
    McLaren: ['NOR', 'PIA'],
    'Aston Martin': ['ALO', 'STR'],
    Alpine: ['GAS', 'COL'],
    Williams: ['ALB', 'SAI'],
    'Racing Bulls': ['LAW', 'LIN'],
    Audi: ['HUL', 'BOR'],
    Cadillac: ['BOT', 'PER'],
    Haas: ['BEA', 'OCO'],
  },
  '2025': {
    'Red Bull': ['VER', 'TSU'],
    Ferrari: ['LEC', 'HAM'],
    Mercedes: ['RUS', 'ANT'],
    McLaren: ['NOR', 'PIA'],
    'Aston Martin': ['ALO', 'STR'],
    Alpine: ['GAS', 'DOO'],
    Williams: ['ALB', 'SAI'],
    'Racing Bulls': ['LAW', 'HAD'],
    Sauber: ['HUL', 'BOR'],
    Haas: ['BEA', 'OCO'],
  },
  '2024': {
    'Red Bull': ['VER', 'PER'],
    Mercedes: ['HAM', 'RUS'],
    Ferrari: ['LEC', 'SAI', 'BEA'],
    McLaren: ['NOR', 'PIA'],
    'Aston Martin': ['ALO', 'STR'],
    Alpine: ['GAS', 'OCO'],
    Williams: ['ALB', 'SAR', 'COL'],
    RB: ['RIC', 'TSU', 'LAW'],
    Sauber: ['BOT', 'ZHO'],
    Haas: ['HUL', 'MAG', 'BEA'],
  },
  '2023': {
    'Red Bull': ['VER', 'PER'],
    Ferrari: ['LEC', 'SAI'],
    Mercedes: ['HAM', 'RUS'],
    Alpine: ['OCO', 'GAS'],
    McLaren: ['NOR', 'PIA'],
    'Alfa Romeo': ['BOT', 'ZHO'],
    'Aston Martin': ['STR', 'ALO'],
    Haas: ['MAG', 'HUL'],
    AlphaTauri: ['TSU', 'DEV', 'RIC', 'LAW'],
    Williams: ['ALB', 'SAR'],
  },
  '2022': {
    Mercedes: ['HAM', 'RUS'],
    'Red Bull': ['VER', 'PER'],
    Ferrari: ['LEC', 'SAI'],
    McLaren: ['NOR', 'RIC'],
    Alpine: ['ALO', 'OCO'],
    AlphaTauri: ['GAS', 'TSU'],
    'Aston Martin': ['VET', 'STR'],
    Williams: ['LAT', 'ALB'],
    'Alfa Romeo': ['ZHO', 'BOT'],
    Haas: ['MAG', 'MSC'],
  },
  '2021': {
    Mercedes: ['HAM', 'BOT'],
    'Red Bull': ['VER', 'PER'],
    Ferrari: ['LEC', 'SAI'],
    McLaren: ['NOR', 'RIC'],
    Alpine: ['ALO', 'OCO'],
    AlphaTauri: ['GAS', 'TSU'],
    'Aston Martin': ['VET', 'STR'],
    Williams: ['LAT', 'RUS'],
    'Alfa Romeo': ['RAI', 'GIO'],
    Haas: ['MSC', 'MAZ'],
  },
  '2020': {
    Mercedes: ['HAM', 'BOT'],
    'Red Bull': ['VER', 'ALB'],
    Ferrari: ['VET', 'LEC'],
    McLaren: ['NOR', 'SAI'],
    Renault: ['RIC', 'OCO'],
    AlphaTauri: ['GAS', 'KVY'],
    'Racing Point': ['PER', 'STR'],
    Williams: ['RUS', 'LAT'],
    'Alfa Romeo': ['RAI', 'GIO'],
    Haas: ['GRO', 'MAG'],
  },
  '2019': {
    Mercedes: ['HAM', 'BOT'],
    Ferrari: ['VET', 'LEC'],
    'Red Bull': ['VER', 'GAS', 'ALB'],
    McLaren: ['SAI', 'NOR'],
    Renault: ['RIC', 'HUL'],
    'Toro Rosso': ['KVY', 'ALB', 'GAS'],
    'Racing Point': ['PER', 'STR'],
    'Alfa Romeo': ['RAI', 'GIO'],
    Haas: ['GRO', 'MAG'],
    Williams: ['RUS', 'KUB'],
  },
};

export const areTeammates = (driver1: string, driver2: string, year: number): boolean => {
  const yearStr = year.toString();
  const yearMapping = teamDriverMap[yearStr] || teamDriverMap['2024'];
  const driverToTeam = new Map<string, string>();

  for (const [team, drivers] of Object.entries(yearMapping)) {
    for (const driver of drivers) {
      driverToTeam.set(driver, team);
    }
  }

  return driverToTeam.get(driver1) === driverToTeam.get(driver2);
};

export const getLineStylesForDriver = (
  driver: string,
  teammates: string[],
  index: number
): { strokeDasharray?: string; strokeWidth: number } => {
  if (teammates.length <= 1) {
    return { strokeWidth: 2.5 };
  }

  const driverIndex = teammates.indexOf(driver);

  switch (driverIndex % 3) {
    case 0:
      return { strokeWidth: 2.5 };
    case 1:
      return { strokeDasharray: '5,3', strokeWidth: 2.5 };
    case 2:
      return { strokeDasharray: '2,2', strokeWidth: 3 };
    default:
      return { strokeWidth: 2.5 };
  }
};

export const groupDriversByTeam = (
  drivers: string[],
  year: number
): Record<string, string[]> => {
  const yearStr = year.toString();
  const yearMapping = teamDriverMap[yearStr] || teamDriverMap['2024'];
  const teamGroups: Record<string, string[]> = {};
  const driverToTeam = new Map<string, string>();

  for (const [team, teamDrivers] of Object.entries(yearMapping)) {
    for (const driver of teamDrivers) {
      driverToTeam.set(driver, team);
    }
  }

  drivers.forEach((driver) => {
    const team = driverToTeam.get(driver);
    if (!team) return;
    if (!teamGroups[team]) {
      teamGroups[team] = [];
    }
    teamGroups[team].push(driver);
  });

  return teamGroups;
};

export const getTeamLogo = (teamName: string | undefined): string | null => {
  if (!teamName) return null;

  const normalizedName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalizedName.includes('redbull')) return '/logos/redbull.svg';
  if (normalizedName.includes('ferrari')) return '/logos/ferrari.svg';
  if (normalizedName.includes('mercedes')) return '/logos/mercedes.svg';
  if (normalizedName.includes('mclaren')) return '/logos/mclaren.svg';
  if (normalizedName.includes('astonmartin')) return '/logos/aston-martin.svg';
  if (normalizedName.includes('alpine')) return '/logos/alpine.svg';
  if (normalizedName.includes('williams')) return '/logos/williams.png';
  if (normalizedName.includes('haas')) return '/logos/haas.png';
  if (normalizedName.includes('audi')) return '/logos/Audi.svg';
  if (normalizedName.includes('cadillac')) return '/logos/Cadillac.svg';
  if (normalizedName.includes('sauber') || normalizedName.includes('kick'))
    return '/logos/kick-sauber.png';
  if (
    normalizedName.includes('racingbulls') ||
    normalizedName.includes('rb') ||
    normalizedName.includes('alphatauri')
  )
    return '/logos/racing-bulls.svg';

  return null;
};

export const getTeamSlug = (teamName: string | undefined): string => {
  if (!teamName) return '';

  const normalizedName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalizedName.includes('redbull')) return 'red-bull';
  if (normalizedName.includes('ferrari')) return 'ferrari';
  if (normalizedName.includes('mercedes')) return 'mercedes';
  if (normalizedName.includes('mclaren')) return 'mclaren';
  if (normalizedName.includes('astonmartin')) return 'aston-martin';
  if (normalizedName.includes('alpine')) return 'alpine';
  if (normalizedName.includes('williams')) return 'williams';
  if (normalizedName.includes('haas')) return 'haas';
  if (normalizedName.includes('audi')) return 'audi';
  if (normalizedName.includes('cadillac')) return 'cadillac';
  if (normalizedName.includes('sauber') || normalizedName.includes('kick')) return 'sauber';
  if (
    normalizedName.includes('racingbulls') ||
    normalizedName.includes('rb') ||
    normalizedName.includes('alphatauri') ||
    normalizedName.includes('tororosso')
  )
    return 'racing-bulls';

  return teamName.toLowerCase().replace(/\s+/g, '-');
};
