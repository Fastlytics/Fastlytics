// Mock data for demonstration purposes - Standings data removed, fetched via API now.

// --- Interfaces (Keep for type safety) ---

interface TeamStanding {
  year: number;
  rank?: number;
  team: string;
  shortName: string;
  points: number;
  change: number | null;
  wins: number;
  podiums: number;
  teamColor: string;
}

interface DriverStanding {
  year: number;
  rank: number;
  name: string;
  shortName: string;
  team: string;
  points: number;
  change: number | null;
  wins: number;
  podiums: number;
  teamColor: string;
}

// Keep main structure if helper functions still reference it, but empty the arrays
export const standingsData: { teams: TeamStanding[], drivers: DriverStanding[] } = {
  teams: [], // Remove mock team data
  drivers: [] // Remove mock driver data
};

// --- Other Mock Data (Keep if still used elsewhere, e.g., charts before API integration) ---

// Mock data for race results (Keep simple for now, will be replaced by API call)
export const raceResultsData = [
  { year: 2025, event: 'Chinese Grand Prix', driver: 'Oscar Piastri', team: 'mclaren', change: 22 },
  { year: 2024, event: 'Bahrain Grand Prix', driver: 'Max Verstappen', team: 'redbull', change: null },
  { year: 2024, event: 'Saudi Arabian Grand Prix', driver: 'Sergio Perez', team: 'redbull', change: null },
  { year: 2024, event: 'Australian Grand Prix', driver: 'Carlos Sainz', team: 'ferrari', change: null },
  { year: 2023, event: 'Bahrain Grand Prix', driver: 'Max Verstappen', team: 'redbull', change: null },
  { year: 2023, event: 'Saudi Arabian Grand Prix', driver: 'Sergio Perez', team: 'redbull', change: null },
  { year: 2023, event: 'Australian Grand Prix', driver: 'Max Verstappen', team: 'redbull', change: null },
  { year: 2023, event: 'Azerbaijan Grand Prix', driver: 'Sergio Perez', team: 'redbull', change: null },
];

// Mock data for lap times comparison (Keep if RacingChart hasn't been fully updated everywhere)
export const lapTimesData = [
  { lap: 1, driverA: 95.5, driverB: 96.1 },
  { lap: 2, driverA: 94.8, driverB: 95.2 },
  { lap: 3, driverA: 94.5, driverB: 94.9 },
];

// Mock data for tire strategy (Keep if TireStrategy component hasn't been fully updated everywhere)
export const tireStrategyData = [
  { driver: 'VER', stints: [{ compound: 'Medium', laps: 18 }, { compound: 'Hard', laps: 40 }] },
  { driver: 'HAM', stints: [{ compound: 'Medium', laps: 20 }, { compound: 'Hard', laps: 38 }] },
];

// Mock data for driver comparison radar chart (Keep if DriverComparison uses it)
export const driverComparisonData = [
    { attribute: 'Qualifying Pace', verstappen: 95, hamilton: 92 },
    { attribute: 'Race Pace', verstappen: 98, hamilton: 96 },
    { attribute: 'Consistency', verstappen: 90, hamilton: 94 },
    { attribute: 'Tire Management', verstappen: 88, hamilton: 95 },
    { attribute: 'Overtaking', verstappen: 96, hamilton: 93 },
    { attribute: 'Wet Weather', verstappen: 92, hamilton: 97 },
];

// Remove old helper functions if they are no longer needed
// export const getTeamStandings = (year: number): TeamStanding[] => { ... };
// export const getDriverStandings = (year: number): DriverStanding[] => { ... };
