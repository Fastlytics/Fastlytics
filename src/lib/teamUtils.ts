// Team mapping to identify teammates
export const teamDriverMap: { [year: string]: { [team: string]: string[] } } = {
  '2025': {
    'Red Bull': ['VER', 'TSU'],
    'Ferrari': ['LEC', 'HAM'],
    'Mercedes': ['RUS', 'ANT'], // Antonelli
    'McLaren': ['NOR', 'PIA'],
    'Aston Martin': ['ALO', 'STR'],
    'Alpine': ['GAS', 'DOO'], // Doohan
    'Williams': ['ALB', 'SAI'],
    'Racing Bulls': ['LAW', 'HAD'], // Lawson, Hadjar
    'Sauber': ['HUL', 'BOR'], // Hulkenberg, Bortoleto
    'Haas': ['BEA', 'OCO'] // Bearman, Ocon
  },
  '2024': {
    'Red Bull': ['VER', 'PER'],
    'Mercedes': ['HAM', 'RUS'],
    'Ferrari': ['LEC', 'SAI', 'BEA'], // Including Bearman
    'McLaren': ['NOR', 'PIA'],
    'Aston Martin': ['ALO', 'STR'],
    'Alpine': ['GAS', 'OCO'],
    'Williams': ['ALB', 'SAR', 'COL'], // Including Colapinto
    'RB': ['RIC', 'TSU', 'LAW'], // Including Lawson
    'Sauber': ['BOT', 'ZHO'],
    'Haas': ['HUL', 'MAG', 'BEA'] // Including Bearman
  },
  '2023': {
    'Red Bull': ['VER', 'PER'],
    'Ferrari': ['LEC', 'SAI'],
    'Mercedes': ['HAM', 'RUS'],
    'Alpine': ['OCO', 'GAS'],
    'McLaren': ['NOR', 'PIA'],
    'Alfa Romeo': ['BOT', 'ZHO'],
    'Aston Martin': ['STR', 'ALO'],
    'Haas': ['MAG', 'HUL'],
    'AlphaTauri': ['TSU', 'DEV', 'RIC', 'LAW'], // All AlphaTauri drivers
    'Williams': ['ALB', 'SAR']
  },
  '2022': {
    'Mercedes': ['HAM', 'RUS'],
    'Red Bull': ['VER', 'PER'],
    'Ferrari': ['LEC', 'SAI'],
    'McLaren': ['NOR', 'RIC'],
    'Alpine': ['ALO', 'OCO'],
    'AlphaTauri': ['GAS', 'TSU'],
    'Aston Martin': ['VET', 'STR'],
    'Williams': ['LAT', 'ALB'],
    'Alfa Romeo': ['ZHO', 'BOT'],
    'Haas': ['MAG', 'MSC']
  },
  '2021': {
    'Mercedes': ['HAM', 'BOT'],
    'Red Bull': ['VER', 'PER'],
    'Ferrari': ['LEC', 'SAI'],
    'McLaren': ['NOR', 'RIC'],
    'Alpine': ['ALO', 'OCO'],
    'AlphaTauri': ['GAS', 'TSU'],
    'Aston Martin': ['VET', 'STR'],
    'Williams': ['LAT', 'RUS'],
    'Alfa Romeo': ['RAI', 'GIO'],
    'Haas': ['MSC', 'MAZ']
  },
  '2020': {
    'Mercedes': ['HAM', 'BOT'],
    'Red Bull': ['VER', 'ALB'],
    'Ferrari': ['VET', 'LEC'],
    'McLaren': ['NOR', 'SAI'],
    'Renault': ['RIC', 'OCO'],
    'AlphaTauri': ['GAS', 'KVY'],
    'Racing Point': ['PER', 'STR'],
    'Williams': ['RUS', 'LAT'],
    'Alfa Romeo': ['RAI', 'GIO'],
    'Haas': ['GRO', 'MAG']
  },
  '2019': {
    'Mercedes': ['HAM', 'BOT'],
    'Ferrari': ['VET', 'LEC'],
    'Red Bull': ['VER', 'GAS', 'ALB'],
    'McLaren': ['SAI', 'NOR'],
    'Renault': ['RIC', 'HUL'],
    'Toro Rosso': ['KVY', 'ALB', 'GAS'],
    'Racing Point': ['PER', 'STR'],
    'Alfa Romeo': ['RAI', 'GIO'],
    'Haas': ['GRO', 'MAG'],
    'Williams': ['RUS', 'KUB']
  }
};

/**
 * Helper function to determine if drivers are teammates
 * @param driver1 First driver code
 * @param driver2 Second driver code
 * @param year Season year
 * @returns Boolean indicating if drivers are teammates
 */
export const areTeammates = (driver1: string, driver2: string, year: number): boolean => {
  const yearStr = year.toString();
  
  // Use current year mapping if the specific year isn't defined
  const yearMapping = teamDriverMap[yearStr] || teamDriverMap['2024'];
  
  // Check if both drivers are in the same team
  for (const team in yearMapping) {
    const drivers = yearMapping[team];
    if (drivers.includes(driver1) && drivers.includes(driver2)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Helper function to generate distinctive line styles for teammates
 */
export const getLineStylesForDriver = (driver: string, teammates: string[], index: number): { strokeDasharray?: string, strokeWidth: number } => {
  // Return different line styles based on driver's position in teammates array
  if (teammates.length <= 1) {
    // Not part of a team or only driver from team - use solid line
    return { strokeWidth: 2.5 };
  }
  
  // Find position of driver in teammates array
  const driverIndex = teammates.indexOf(driver);
  
  // Alternate styles for teammates
  switch (driverIndex % 3) {
    case 0: // First driver - solid line
      return { strokeWidth: 2.5 };
    case 1: // Second driver - dashed line
      return { strokeDasharray: '5,3', strokeWidth: 2.5 };
    case 2: // Third driver (rare case) - dotted line
      return { strokeDasharray: '2,2', strokeWidth: 3 };
    default:
      return { strokeWidth: 2.5 };
  }
};

/**
 * Group drivers by team
 */
export const groupDriversByTeam = (drivers: string[], year: number): { [team: string]: string[] } => {
  const yearStr = year.toString();
  const yearMapping = teamDriverMap[yearStr] || teamDriverMap['2024'];
  
  const teamGroups: { [team: string]: string[] } = {};
  
  // First pass: add drivers to their teams
  drivers.forEach(driver => {
    for (const team in yearMapping) {
      if (yearMapping[team].includes(driver)) {
        if (!teamGroups[team]) {
          teamGroups[team] = [];
        }
        teamGroups[team].push(driver);
        break;
      }
    }
  });
  
  return teamGroups;
}; 