import { request } from './api-client';
import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Keep for constructing URLs not using request() yet?
// Ideally we move everything to use request() which handles base URL.
// But we need to update functions to pass relative path.

// --- Helper to get headers --- (DEPRECATED: Use request())
const getHeaders = (): HeadersInit => {
  // Kept for legacy functions until fully migrated
  const API_KEY = import.meta.env.VITE_FASTLYTICS_API_KEY;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  return headers;
};

// --- Data Structures (Exported) ---
export interface LapTimeDataPoint {
  LapNumber: number;
  [driverCode: string]: number | null; // Allow null for missed laps
}
export interface SpeedDataPoint {
  Distance: number;
  Speed: number;
}
export interface GearMapDataPoint {
  X: number;
  Y: number;
  nGear: number;
}
export interface GearShiftMapData {
  circuitLayout: string;
  segments: { gear: number; path: string }[];
  driverCode: string;
  lapNumber: number;
  stats: { avgGear: number; mostUsedGear: number };
}
export interface ThrottleDataPoint {
  Distance: number;
  Throttle: number;
}
export interface BrakeDataPoint {
  Distance: number;
  Brake: number;
}
export interface RPMDataPoint {
  Distance: number;
  RPM: number;
}
export interface DRSDataPoint {
  Distance: number;
  DRS: number;
}
export interface TireStint {
  compound: string;
  startLap: number;
  endLap: number;
  lapCount: number;
}
export interface DriverStrategy {
  driver: string;
  stints: TireStint[];
}
export interface SessionDriver {
  code: string;
  name: string;
  team: string;
}
export interface DriverStanding {
  rank: number;
  code: string;
  name: string;
  team: string;
  points: number;
  wins: number;
  podiums: number;
  points_change?: number;
  teamColor?: string;
} // Use points_change?
export interface TeamStanding {
  rank: number;
  team: string;
  points: number;
  wins: number;
  podiums: number;
  points_change?: number;
  teamColor?: string;
  shortName?: string;
} // Use points_change?
export interface RaceResult {
  year: number;
  event: string;
  round: number;
  driver: string;
  team: string;
  teamColor: string;
  date?: string;
  location?: string;
  podium?: { position: number; driver: string; team: string; teamColor: string }[];
} // Added date, location, and podium
export interface DetailedRaceResult {
  position: number | null;
  driverCode: string;
  fullName: string;
  team: string;
  points: number | null; // Allow null for incomplete data
  isProvisional?: boolean; // Flag for provisional results
  status: string;
  gridPosition?: number | null; // Optional for non-race/sprint
  teamColor: string;
  isFastestLap?: boolean; // Optional, mainly for Race/Sprint
  // Fields for specific session types
  fastestLapTime?: string | null; // For Practice
  lapsCompleted?: number | null; // For Practice
  q1Time?: string | null; // For Qualifying
  q2Time?: string | null; // For Qualifying
  q3Time?: string | null; // For Qualifying
  // Added fields for specific lap times from processor
  poleLapTimeValue?: string | null; // Formatted pole time (MM:SS.ms)
  fastestLapTimeValue?: string | null; // Formatted fastest lap time (MM:SS.ms)
  time?: string | null; // Race finish time for winner, gap for others (e.g., "+5.123" or "1:32:15.456")
  laps?: number | null; // Number of laps completed (for race sessions)
  // Individual driver fastest lap data for race sessions
  driverFastestLapTime?: string | null; // Individual driver's fastest lap time in race
  driverFastestLapNumber?: number | null; // Lap number when driver set their fastest lap
}
export interface LapPositionDataPoint {
  LapNumber: number;
  [driverCode: string]: number | null; // Position for each driver, null if DNF/not available
}

export interface AvailableSession {
  name: string;
  type: string;
  startTime: string; // Note: This might not be directly available from the schedule endpoint
}

export interface SessionScheduleInfo {
  name: string;
  date: string; // ISO Date string
  localTime: string | null; // HH:MM format
}

export interface EventSessionSchedule {
  eventName: string;
  location: string;
  country: string;
  eventFormat: string;
  sessions: SessionScheduleInfo[];
}

// --- Stint Analysis Interfaces ---
export interface LapDetail {
  lapNumber: number;
  lapTime: number; // Lap time in seconds
}

export interface StintAnalysisData {
  driverCode: string;
  stintNumber: number;
  compound: string;
  startLap: number;
  endLap: number;
  lapDetails: LapDetail[]; // Array of {lapNumber, lapTime} objects
}

// --- Schedule Interface ---
export interface ScheduleEvent {
  RoundNumber: number;
  Country: string;
  Location: string;
  EventName: string;
  EventDate: string; // ISO Date string
  EventFormat: string;
  Session1: string;
  Session1Date: string; // ISO Date string
  Session2: string;
  Session2Date: string; // ISO Date string
  Session3: string;
  Session3Date: string; // ISO Date string
  Session4: string | null; // Can be null
  Session4Date: string | null; // Can be null
  Session5: string | null; // Can be null
  Session5Date: string | null; // Can be null
  F1ApiSupport: boolean;
}

// --- Driver/Team Detail Interfaces ---
export interface DriverDetails {
  driverId: string; // Usually the 3-letter code
  name: string;
  nationality: string;
  dateOfBirth: string; // ISO string format ideally
  bio?: string; // Optional
  imageUrl?: string; // Optional URL for the large photo
  headshot_url?: string; // From OpenF1
  team_colour?: string; // From OpenF1
  team_name?: string; // From OpenF1
  careerStats?: {
    // Optional stats block
    wins?: number;
    podiums?: number;
    poles?: number;
    championships?: number;
  };
  // Add other relevant fields from backend if available
}

export interface TeamDetails {
  teamId: string; // Usually the full team name used as ID
  name: string;
  nationality: string;
  base?: string; // Optional
  firstEntry?: number; // Optional
  bio?: string; // Optional
  imageUrl?: string; // Optional URL for the large photo/logo
  careerStats?: {
    // Optional stats block
    wins?: number;
    podiums?: number;
    poles?: number;
    constructorsChampionships?: number;
    driversChampionships?: number;
  };
  // Add other relevant fields (e.g., current drivers) if available
}

// --- Track Evolution Interfaces ---
export interface RollingLapDataPoint {
  lap: number;
  time: number | null; // Rolling average time in seconds
}

export interface DriverEvolutionData {
  code: string;
  color: string;
  rollingAverageLaps: RollingLapDataPoint[];
}

export interface ChampionshipProgressionRound {
  round: number;
  event: string;
  country: string;
}

export interface ChampionshipProgressionDriver {
  name: string;
  team: string;
  points_history: number[];
}

export interface ChampionshipProgressionData {
  rounds: ChampionshipProgressionRound[];
  drivers: { [key: string]: ChampionshipProgressionDriver };
}

export interface TrackTemperatureDataPoint {
  lap: number;
  temp: number | null; // Track temperature in Celsius
}

export interface TrackEvolutionResponse {
  drivers: DriverEvolutionData[];
  trackTemperature: TrackTemperatureDataPoint[];
  // TODO: Add interfaces for stint/compound analysis if implemented later
}

export interface TrackSection {
  id: string;
  name: string;
  type: 'straight' | 'corner' | 'sector';
  path: string; // SVG path data
  driver1Advantage?: number; // Positive means driver1 is faster, negative means driver2 is faster
  driver1AvgSpeed?: number;
  driver2AvgSpeed?: number;
}

export interface SectorComparisonData {
  sections: TrackSection[];
  driver1Code: string;
  driver2Code: string;
  driver1LapNumber?: number;
  driver1LapTime?: string;
  driver2LapNumber?: number;
  driver2LapTime?: string;
  circuitLayout: string; // SVG path data for the main track outline
}

export interface SessionIncident {
  type: 'SC/VSC' | 'RedFlag'; // Grouped SC/VSC for simplicity
  startLap: number;
  endLap: number;
}

// --- Team Pace Analysis Interfaces ---
export interface TeamPaceSession {
  teamName: string;
  medianTime: number;
  averageTime: number;
  fastestLapTime: number;
  stdDev: number;
  lapCount: number;
  teamColor: string;
  rank: number;
}

export interface TeamPaceEvent {
  year: number;
  round: number;
  eventName: string;
  sessions: Record<string, TeamPaceSession[]>;
}

export interface TeamPaceSummary {
  round: number;
  eventName: string;
  bestRacePaceTeam: string;
}

// --- API Fetch Functions ---

/** Fetches available sessions for a given event */
/** Fetches available sessions for a given event */
export const fetchAvailableSessions = async (
  year: number,
  event: string
): Promise<AvailableSession[]> => {
  const params = new URLSearchParams({ year: year.toString(), event });
  // Use request helper: passes relative path
  return request<AvailableSession[]>(`/api/sessions?${params.toString()}`);
};

/** Fetches the list of drivers for a given session. */
export const fetchSessionDrivers = async (
  year: number,
  event: string,
  session: string
): Promise<SessionDriver[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<SessionDriver[]>(`/api/session/drivers?${params.toString()}`);
};

/** Fetches lap time comparison data for multiple drivers (2 or 3). */
export const fetchLapTimes = async (
  year: number,
  event: string,
  session: string,
  drivers: string[]
): Promise<LapTimeDataPoint[]> => {
  const params = new URLSearchParams();
  params.append('year', year.toString());
  params.append('event', event);
  params.append('session', session);
  drivers.forEach((driver) => params.append('drivers', driver));
  return request<LapTimeDataPoint[]>(`/api/laptimes?${params.toString()}`);
};

/** Fetches speed telemetry data for a specific lap. */
export const fetchTelemetrySpeed = async (
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string | number
): Promise<SpeedDataPoint[]> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver,
    lap: String(lap),
  });
  return request<SpeedDataPoint[]>(`/api/telemetry/speed?${params.toString()}`);
};

/** Fetches gear map telemetry data for a specific lap. */
export const fetchTelemetryGear = async (
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string | number
): Promise<GearMapDataPoint[]> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver,
    lap: String(lap),
  });
  return request<GearMapDataPoint[]>(`/api/telemetry/gear?${params.toString()}`);
};

/** Fetches gear shift map data (SVG paths) for a specific lap. */
export const fetchGearShiftMap = async (
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string | number
): Promise<GearShiftMapData> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver,
    lap: String(lap),
  });
  return request<GearShiftMapData>(`/api/telemetry/gear-map?${params.toString()}`);
};

/** Fetches throttle telemetry data for a specific lap. */
export const fetchTelemetryThrottle = async (
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string | number
): Promise<ThrottleDataPoint[]> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver,
    lap: String(lap),
  });
  return request<ThrottleDataPoint[]>(`/api/telemetry/throttle?${params.toString()}`);
};

/** Fetches brake telemetry data for a specific lap. */
export const fetchTelemetryBrake = async (
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string | number
): Promise<BrakeDataPoint[]> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver,
    lap: String(lap),
  });
  return request<BrakeDataPoint[]>(`/api/telemetry/brake?${params.toString()}`);
};

/** Fetches RPM telemetry data for a specific lap. */
export const fetchTelemetryDRS = async (
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string | number
): Promise<DRSDataPoint[]> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver,
    lap: String(lap),
  });
  return request<DRSDataPoint[]>(`/api/telemetry/drs?${params.toString()}`);
};

/** Fetches RPM telemetry data for a specific lap. */
export const fetchTelemetryRPM = async (
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string | number
): Promise<RPMDataPoint[]> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver,
    lap: String(lap),
  });
  return request<RPMDataPoint[]>(`/api/telemetry/rpm?${params.toString()}`);
};

/** Fetches tire strategy data for all drivers in a session. */
export const fetchTireStrategy = async (
  year: number,
  event: string,
  session: string
): Promise<DriverStrategy[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<DriverStrategy[]>(`/api/strategy?${params.toString()}`);
};

/** Fetches driver standings for a given year. */
export const fetchDriverStandings = async (year: number): Promise<DriverStanding[]> => {
  const params = new URLSearchParams({ year: year.toString() });
  return request<DriverStanding[]>(`/api/standings/drivers?${params.toString()}`);
};
export const fetchTeamStandings = async (year: number): Promise<TeamStanding[]> => {
  const params = new URLSearchParams({ year: year.toString() });
  return request<TeamStanding[]>(`/api/standings/teams?${params.toString()}`);
};

/** Fetches race results summary (winners) for a given year. */
export const fetchRaceResults = async (year: number): Promise<RaceResult[]> => {
  const params = new URLSearchParams({ year: year.toString() });
  return request<RaceResult[]>(`/api/results/races?${params.toString()}`);
};
export const fetchSpecificRaceResults = async (
  year: number,
  eventSlug: string,
  session: string
): Promise<DetailedRaceResult[]> => {
  const params = new URLSearchParams({ session });
  return request<DetailedRaceResult[]>(
    `/api/results/race/${year}/${eventSlug}?${params.toString()}`
  );
};

/** Fetches track evolution data */
export const fetchTrackEvolution = async (
  year: number,
  event: string,
  session: string
): Promise<TrackEvolutionResponse> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<TrackEvolutionResponse>(`/api/track-evolution?${params.toString()}`);
};
export const fetchChampionshipProgression = async (
  year: number
): Promise<ChampionshipProgressionData> => {
  const params = new URLSearchParams({ year: year.toString() });
  return request<ChampionshipProgressionData>(`/api/standings/progression?${params.toString()}`);
};

/** Fetches the event schedule for a given year. */
export const fetchSchedule = async (year: number): Promise<ScheduleEvent[]> => {
  return request<ScheduleEvent[]>(`/api/schedule/${year}`);
};

/** Fetches team pace summary for a given year. */
export const fetchTeamPaceSummary = async (year: number): Promise<TeamPaceSummary[]> => {
  const params = new URLSearchParams({ year: year.toString() });
  return request<TeamPaceSummary[]>(`/api/team-pace/summary?${params.toString()}`);
};

/** Fetches detailed team pace data for a specific event. */
export const fetchTeamPaceEvent = async (
  year: number,
  eventSlug: string
): Promise<TeamPaceEvent> => {
  const params = new URLSearchParams({ year: year.toString(), event_slug: eventSlug });
  return request<TeamPaceEvent>(`/api/team-pace/event?${params.toString()}`);
};

/** Fetches lap-by-lap position data for a race session. */
export const fetchLapPositions = async (
  year: number,
  event: string,
  session: string
): Promise<LapPositionDataPoint[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<LapPositionDataPoint[]>(`/api/lapdata/positions?${params.toString()}`);
};

/** Fetches detailed information for a specific driver. */
export const getDriverDetails = async (driverId: string): Promise<DriverDetails> => {
  const data = await request<DriverDetails>(`/api/driver/${driverId}`);

  // Fetch additional data from OpenF1
  // We need to map driverId (e.g., 'VER') to driver number if possible, or fetch all and find match
  // For now, let's try to fetch all drivers for the latest session and match by code/acronym
  try {
    const openF1Drivers = await import('./openf1').then((m) => m.fetchAllOpenF1Drivers());
    const openF1Driver = openF1Drivers.find(
      (d) => d.name_acronym === driverId || d.last_name.toUpperCase().includes(driverId)
    );

    if (openF1Driver) {
      logger.debug(`Found OpenF1 data for ${driverId}`);
      data.headshot_url = openF1Driver.headshot_url;
      data.team_colour = openF1Driver.team_colour;
      data.team_name = openF1Driver.team_name;
      // Prefer OpenF1 headshot if available
      if (openF1Driver.headshot_url) {
        data.imageUrl = openF1Driver.headshot_url;
      }
    }
  } catch (openF1Error) {
    logger.warn('Failed to enrich driver details with OpenF1 data:', openF1Error);
  }

  return data;
};

/** Fetches detailed information for a specific team. */
export const getTeamDetails = async (teamId: string): Promise<TeamDetails> => {
  // Team ID might contain spaces or special chars, ensure it's encoded for the URL path part
  const encodedTeamId = encodeURIComponent(teamId);
  const data = await request<TeamDetails>(`/api/team/${encodedTeamId}`);
  // TODO: Potentially add mock data here if API returns 404 during development
  return data;
};

/** Fetches session schedule for a specific event. */
export const fetchEventSessionSchedule = async (
  year: number,
  event: string
): Promise<EventSessionSchedule> => {
  return request<EventSessionSchedule>(`/api/schedule/${year}/${event}/sessions`);
};

/** Fetches available lap numbers for a specific driver in a session. */
export const fetchDriverLapNumbers = async (
  year: number,
  event: string,
  session: string,
  driver: string
): Promise<number[]> => {
  if (!driver) {
    // Return empty array or throw error if driver isn't selected yet
    return [];
  }
  const params = new URLSearchParams({ year: year.toString(), event, session, driver });
  const data = await request<{ laps: number[] }>(`/api/laps/driver?${params.toString()}`);
  return data.laps || []; // Ensure we return an array
};

/** Fetches sector comparison data for two drivers for specific laps. */
export const fetchSectorComparison = async (
  year: number,
  event: string,
  session: string,
  driver1: string,
  driver2: string,
  lap1: string | number = 'fastest', // Add lap1 parameter with default
  lap2: string | number = 'fastest' // Add lap2 parameter with default
): Promise<SectorComparisonData> => {
  if (!driver1 || !driver2) {
    throw new Error('Both drivers must be specified');
  }

  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver1,
    driver2,
    lap1: String(lap1), // Pass lap identifiers
    lap2: String(lap2), // Pass lap identifiers
  });

  try {
    return await request<SectorComparisonData>(`/api/comparison/sectors?${params.toString()}`);
  } catch (error) {
    // For development/demo, return mock data if real API isn't available
    if (process.env.NODE_ENV === 'development') {
      // Generate mock sector comparison data
      const mockData: SectorComparisonData = {
        driver1Code: driver1,
        driver2Code: driver2,
        circuitLayout:
          'M100,250 C150,100 250,50 400,50 C550,50 650,100 700,250 C750,400 650,450 400,450 C250,450 150,400 100,250 Z',
        sections: [
          {
            id: 's1',
            name: 'Turn 1',
            type: 'corner',
            path: 'M380,50 C420,50 460,50 500,70 C540,90 560,130 560,170',
            driver1Advantage: Math.random() * 0.2 - 0.1,
          },
          {
            id: 's2',
            name: 'Back Straight',
            type: 'straight',
            path: 'M560,170 C590,240 620,310 650,380',
            driver1Advantage: Math.random() * 0.2 - 0.1,
          },
          {
            id: 's3',
            name: 'Chicane',
            type: 'corner',
            path: 'M650,380 C630,420 580,440 520,440',
            driver1Advantage: Math.random() * 0.2 - 0.1,
          },
          {
            id: 's4',
            name: 'Final Corner',
            type: 'corner',
            path: 'M520,440 C400,450 280,430 200,370',
            driver1Advantage: Math.random() * 0.2 - 0.1,
          },
          {
            id: 's5',
            name: 'Start/Finish',
            type: 'straight',
            path: 'M200,370 C150,320 120,260 110,200 C100,140 120,90 180,60 C240,30 310,50 380,50',
            driver1Advantage: Math.random() * 0.2 - 0.1,
          },
        ],
      };
      return mockData;
    }

    throw error;
  }
};

/** Fetches detailed stint analysis data including lap times. */
export const fetchStintAnalysis = async (
  year: number,
  event: string,
  session: string
): Promise<StintAnalysisData[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<StintAnalysisData[]>(`/api/stint-analysis?${params.toString()}`);
};

/** Fetches incident periods (SC/VSC, Red Flag) for a session. */
export const fetchSessionIncidents = async (
  year: number,
  event: string,
  session: string
): Promise<SessionIncident[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  try {
    return await request<SessionIncident[]>(`/api/incidents?${params.toString()}`);
  } catch (error) {
    // Return empty array on error to prevent breaking UI that expects an array
    logger.error('Error fetching incidents:', error);
    return [];
    // Alternatively, throw error; if you want query hook to handle error state
  }
};

export interface PaceDistributionData {
  driverCode: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

/** Fetches pace distribution statistics for selected drivers. */
export const fetchPaceDistribution = async (
  year: number,
  event: string,
  session: string,
  drivers: string[]
): Promise<PaceDistributionData[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  params.append('drivers', drivers.join(','));
  return request<PaceDistributionData[]>(`/api/telemetry/pace-distribution?${params.toString()}`);
};

// --- Session Replay Inteface (Columnar Optimization) ---
// Old row-based (Frame[]) structure replaced with Columnar (Struct of Arrays)
export interface ReplayDriverData {
  x: number[];
  y: number[];
  dist: number[];
  rel_dist: number[];
  speed: number[];
  gear: number[];
  drs: number[];
  rpm: number[];
  lap: number[];
  tyre: number[];
  throttle: number[];
  brake: number[];
}

export interface ReplayDriversMap {
  [code: string]: ReplayDriverData;
}

export interface SessionReplayData {
  time: number[]; // Shared timeline
  drivers: ReplayDriversMap;
  driver_colors: { [code: string]: string };
  driver_grid_positions: Record<string, number>;
  track_statuses: { status: string; start_time: number; end_time: number | null }[];
  race_control_messages: {
    time: number;
    category: string;
    message: string;
    flag?: string;
    sector?: number | null;
  }[];
  circuit_layout: string;
  circuit_points?: number[][];
  circuit_distances?: number[];
  pit_intervals?: Record<string, { start: number; end: number }[]>;
  driver_end_times?: Record<string, number>;
  completed_laps?: {
    driver: string;
    lap: number;
    time_str: string;
    seconds: number;
    timestamp: number;
    compound: string;
  }[];
  start_time?: number;
  session_info: { name: string; year: number; session: string };
}

/** Fetches full session replay data. */
export const fetchSessionReplay = async (
  year: number,
  event: string,
  session: string
): Promise<SessionReplayData> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<SessionReplayData>(`/api/replay/session?${params.toString()}`);
};

/** Fetches session replay metadata. */
export const fetchSessionReplayMetadata = async (
  year: number,
  event: string,
  session: string
): Promise<SessionReplayData> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<SessionReplayData>(`/api/replay/metadata?${params.toString()}`);
};

export interface ReplayChunk {
  chunk_id: number;
  start_time: number;
  end_time: number;
  time: number[];
  drivers: ReplayDriversMap;
}

/** Fetches a session replay chunk. */
export const fetchSessionReplayChunk = async (
  year: number,
  event: string,
  session: string,
  chunkId: number
): Promise<ReplayChunk> => {
  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    chunk_id: chunkId.toString(),
  });
  return request<ReplayChunk>(`/api/replay/chunk?${params.toString()}`);
};
