// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// API Key from environment variable (Vite specific)
const API_KEY = import.meta.env.VITE_FASTLYTICS_API_KEY;
const API_KEY_HEADER = 'X-API-Key';

// --- Helper to get headers ---
const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (API_KEY) {
        headers[API_KEY_HEADER] = API_KEY;
    } else {
        console.warn("VITE_FASTLYTICS_API_KEY is not set. API requests will be sent without authentication.");
    }
    return headers;
};

// --- Data Structures (Exported) ---
export interface LapTimeDataPoint {
    LapNumber: number;
    [driverCode: string]: number | null; // Allow null for missed laps
}
export interface SpeedDataPoint { Distance: number; Speed: number; }
export interface GearMapDataPoint { X: number; Y: number; nGear: number; }
export interface ThrottleDataPoint { Distance: number; Throttle: number; }
export interface BrakeDataPoint { Distance: number; Brake: number; }
export interface RPMDataPoint { Distance: number; RPM: number; }
export interface DRSDataPoint { Distance: number; DRS: number; }
export interface TireStint { compound: string; startLap: number; endLap: number; lapCount: number; }
export interface DriverStrategy { driver: string; stints: TireStint[]; }
export interface SessionDriver { code: string; name: string; team: string; }
export interface DriverStanding { rank: number; code: string; name: string; team: string; points: number; wins: number; podiums: number; points_change?: number; teamColor?: string; } // Use points_change?
export interface TeamStanding { rank: number; team: string; points: number; wins: number; podiums: number; points_change?: number; teamColor?: string; shortName?: string; } // Use points_change?
export interface RaceResult { year: number; event: string; round: number; driver: string; team: string; teamColor: string; date?: string; location?: string; } // Added date and location
export interface DetailedRaceResult {
    position: number | null;
    driverCode: string;
    fullName: string;
    team: string;
    points: number;
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
  careerStats?: { // Optional stats block
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
  careerStats?: { // Optional stats block
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
}

export interface SectorComparisonData {
  sections: TrackSection[];
  driver1Code: string;
  driver2Code: string;
  circuitLayout: string; // SVG path data for the main track outline
}

export interface SessionIncident {
  type: 'SC/VSC' | 'RedFlag'; // Grouped SC/VSC for simplicity
  startLap: number;
  endLap: number;
}

// Type definition for the Team Pace data returned by the new endpoint
export interface TeamPaceData {
    rank: number;
    teamName: string;
    medianTime: number; // seconds
    averageTime: number; // seconds
    stdDev: number;
}

// --- API Fetch Functions ---

/** Fetches available sessions for a given event */
export const fetchAvailableSessions = async (year: number, event: string): Promise<AvailableSession[]> => {
    const params = new URLSearchParams({ year: year.toString(), event });
    const url = `${API_BASE_URL}/api/sessions?${params.toString()}`;
    console.log(`Fetching available sessions from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: AvailableSession[] = await response.json();
        console.log(`Successfully fetched ${data.length} available sessions.`);
        return data;
    } catch (error) { console.error("Error fetching available sessions:", error); throw error; }
};

/** Fetches the list of drivers for a given session. */
export const fetchSessionDrivers = async (year: number, event: string, session: string): Promise<SessionDriver[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session });
    const url = `${API_BASE_URL}/api/session/drivers?${params.toString()}`;
    console.log(`Fetching session drivers from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: SessionDriver[] = await response.json();
        console.log(`Successfully fetched ${data.length} session drivers.`);
        return data;
    } catch (error) { console.error("Error fetching session drivers:", error); throw error; }
};

/** Fetches lap time comparison data for multiple drivers (2 or 3). */
export const fetchLapTimes = async (year: number, event: string, session: string, drivers: string[]): Promise<LapTimeDataPoint[]> => {
    const params = new URLSearchParams();
    params.append('year', year.toString()); params.append('event', event); params.append('session', session);
    drivers.forEach(driver => params.append('drivers', driver));
    const url = `${API_BASE_URL}/api/laptimes?${params.toString()}`;
    console.log(`Fetching lap times from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: LapTimeDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} lap time records for ${drivers.join(', ')}.`);
        return data;
    } catch (error) { console.error("Error fetching lap times:", error); throw error; }
};

/** Fetches speed telemetry data for a specific lap. */
export const fetchTelemetrySpeed = async (year: number, event: string, session: string, driver: string, lap: string | number): Promise<SpeedDataPoint[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session, driver, lap: String(lap) });
    const url = `${API_BASE_URL}/api/telemetry/speed?${params.toString()}`;
    console.log(`Fetching speed telemetry from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: SpeedDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} speed telemetry records.`);
        return data;
    } catch (error) { console.error("Error fetching speed telemetry:", error); throw error; }
};

/** Fetches gear map telemetry data for a specific lap. */
export const fetchTelemetryGear = async (year: number, event: string, session: string, driver: string, lap: string | number): Promise<GearMapDataPoint[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session, driver, lap: String(lap) });
    const url = `${API_BASE_URL}/api/telemetry/gear?${params.toString()}`;
    console.log(`Fetching gear telemetry from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: GearMapDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} gear telemetry records.`);
        return data;
    } catch (error) { console.error("Error fetching gear telemetry:", error); throw error; }
};

/** Fetches throttle telemetry data for a specific lap. */
export const fetchTelemetryThrottle = async (year: number, event: string, session: string, driver: string, lap: string | number): Promise<ThrottleDataPoint[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session, driver, lap: String(lap) });
    const url = `${API_BASE_URL}/api/telemetry/throttle?${params.toString()}`;
    console.log(`Fetching throttle telemetry from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: ThrottleDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} throttle telemetry records.`);
        return data;
    } catch (error) { console.error("Error fetching throttle telemetry:", error); throw error; }
};

/** Fetches brake telemetry data for a specific lap. */
export const fetchTelemetryBrake = async (year: number, event: string, session: string, driver: string, lap: string | number): Promise<BrakeDataPoint[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session, driver, lap: String(lap) });
    const url = `${API_BASE_URL}/api/telemetry/brake?${params.toString()}`;
    console.log(`Fetching brake telemetry from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: BrakeDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} brake telemetry records.`);
        return data;
    } catch (error) { console.error("Error fetching brake telemetry:", error); throw error; }
};

/** Fetches RPM telemetry data for a specific lap. */
export const fetchTelemetryRPM = async (year: number, event: string, session: string, driver: string, lap: string | number): Promise<RPMDataPoint[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session, driver, lap: String(lap) });
    const url = `${API_BASE_URL}/api/telemetry/rpm?${params.toString()}`;
    console.log(`Fetching RPM telemetry from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: RPMDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} RPM telemetry records.`);
        return data;
    } catch (error) { console.error("Error fetching RPM telemetry:", error); throw error; }
};

/** Fetches DRS telemetry data for a specific lap. */
export const fetchTelemetryDRS = async (year: number, event: string, session: string, driver: string, lap: string | number): Promise<DRSDataPoint[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session, driver, lap: String(lap) });
    const url = `${API_BASE_URL}/api/telemetry/drs?${params.toString()}`;
    console.log(`Fetching DRS telemetry from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: DRSDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} DRS telemetry records.`);
        return data;
    } catch (error) { console.error("Error fetching DRS telemetry:", error); throw error; }
};

/** Fetches tire strategy data for all drivers in a session. */
export const fetchTireStrategy = async (year: number, event: string, session: string): Promise<DriverStrategy[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session });
    const url = `${API_BASE_URL}/api/strategy?${params.toString()}`;
    console.log(`Fetching tire strategy from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: DriverStrategy[] = await response.json();
        console.log(`Successfully fetched strategy for ${data.length} drivers.`);
        return data;
    } catch (error) { console.error("Error fetching tire strategy:", error); throw error; }
};

/** Fetches driver standings for a given year. */
export const fetchDriverStandings = async (year: number): Promise<DriverStanding[]> => {
    const params = new URLSearchParams({ year: year.toString() });
    const url = `${API_BASE_URL}/api/standings/drivers?${params.toString()}`;
    console.log(`Fetching driver standings from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: DriverStanding[] = await response.json();
        console.log(`Successfully fetched driver standings for ${year}.`);
        return data;
    } catch (error) { console.error(`Error fetching driver standings for ${year}:`, error); throw error; }
};

/** Fetches team standings for a given year. */
export const fetchTeamStandings = async (year: number): Promise<TeamStanding[]> => {
    const params = new URLSearchParams({ year: year.toString() });
    const url = `${API_BASE_URL}/api/standings/teams?${params.toString()}`;
    console.log(`Fetching team standings from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: TeamStanding[] = await response.json();
        console.log(`Successfully fetched team standings for ${year}.`);
        return data;
    } catch (error) { console.error(`Error fetching team standings for ${year}:`, error); throw error; }
};

/** Fetches race results summary (winners) for a given year. */
export const fetchRaceResults = async (year: number): Promise<RaceResult[]> => {
    const params = new URLSearchParams({ year: year.toString() });
    const url = `${API_BASE_URL}/api/results/races?${params.toString()}`;
    console.log(`Fetching race results summary from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: RaceResult[] = await response.json();
        console.log(`Successfully fetched ${data.length} race results summary for ${year}.`);
        return data;
    } catch (error) { console.error(`Error fetching race results for ${year}:`, error); throw error; }
};

/** Fetches detailed race results for a specific event and session. */
export const fetchSpecificRaceResults = async (year: number, eventSlug: string, session: string): Promise<DetailedRaceResult[]> => {
    // Add the session as a query parameter
    const params = new URLSearchParams({ session });
    const url = `${API_BASE_URL}/api/results/race/${year}/${eventSlug}?${params.toString()}`;
    console.log(`Fetching detailed race results from: ${url}`); // Log includes session now
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: DetailedRaceResult[] = await response.json();
        console.log(`Successfully fetched detailed results for ${year} ${eventSlug} session ${session}.`);
        return data;
    } catch (error) {
        console.error(`Error fetching detailed race results for ${year} ${eventSlug} session ${session}:`, error);
        throw error;
    }
};

/** Fetches track evolution data */
export const fetchTrackEvolution = async (year: number, event: string, session: string): Promise<TrackEvolutionResponse> => {
    const params = new URLSearchParams({ year: year.toString(), event, session });
    const url = `${API_BASE_URL}/api/track-evolution?${params.toString()}`;
    console.log(`Fetching track evolution from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: TrackEvolutionResponse = await response.json();
        console.log(`Successfully fetched track evolution data.`);
        return data;
    } catch (error) { console.error("Error fetching track evolution data:", error); throw error; }
};

/** Fetches the event schedule for a given year. */
export const fetchSchedule = async (year: number): Promise<ScheduleEvent[]> => {
    const url = `${API_BASE_URL}/api/schedule/${year}`;
    console.log(`Fetching schedule from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error fetching schedule for ${year}: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: ScheduleEvent[] = await response.json();
        console.log(`Successfully fetched schedule for ${year} with ${data.length} events.`);
        return data;
    } catch (error) {
        console.error(`Error fetching schedule for ${year}:`, error);
        throw error;
    }
};

/** Fetches lap-by-lap position data for a race session. */
export const fetchLapPositions = async (year: number, event: string, session: string): Promise<LapPositionDataPoint[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session });
    const url = `${API_BASE_URL}/api/lapdata/positions?${params.toString()}`;
    console.log(`Fetching lap positions from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: LapPositionDataPoint[] = await response.json();
        console.log(`Successfully fetched ${data.length} lap position records.`);
        return data;
    } catch (error) { console.error("Error fetching lap positions:", error); throw error; }
};

/** Fetches detailed information for a specific driver. */
export const getDriverDetails = async (driverId: string): Promise<DriverDetails> => {
    const url = `${API_BASE_URL}/api/driver/${driverId}`;
    console.log(`Fetching driver details from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error fetching driver ${driverId}: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: DriverDetails = await response.json();
        console.log(`Successfully fetched details for driver ${driverId}.`);
        // TODO: Potentially add mock data here if API returns 404 during development
        // if (!data && MOCK_ENABLED) return MOCK_DRIVER_DETAILS[driverId];
        return data;
    } catch (error) {
        console.error(`Error fetching driver details for ${driverId}:`, error);
        // TODO: Potentially return mock data on error during development
        // if (MOCK_ENABLED) return MOCK_DRIVER_DETAILS[driverId];
        throw error;
    }
};

/** Fetches detailed information for a specific team. */
export const getTeamDetails = async (teamId: string): Promise<TeamDetails> => {
    // Team ID might contain spaces or special chars, ensure it's encoded for the URL path part
    const encodedTeamId = encodeURIComponent(teamId);
    const url = `${API_BASE_URL}/api/team/${encodedTeamId}`;
    console.log(`Fetching team details from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error fetching team ${teamId}: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: TeamDetails = await response.json();
        console.log(`Successfully fetched details for team ${teamId}.`);
        // TODO: Potentially add mock data here if API returns 404 during development
        return data;
    } catch (error) {
        console.error(`Error fetching team details for ${teamId}:`, error);
        // TODO: Potentially return mock data on error during development
    throw error;
  }
};

/** Fetches session schedule for a specific event. */
export const fetchEventSessionSchedule = async (year: number, event: string): Promise<EventSessionSchedule> => {
  const url = `${API_BASE_URL}/api/schedule/${year}/${event}/sessions`;
  console.log(`Fetching event session schedule from: ${url}`);
  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
      console.error(`API Error: ${errorDetail}`);
      throw new Error(errorDetail);
    }
    const data: EventSessionSchedule = await response.json();
    console.log(`Successfully fetched session schedule for ${year} ${event}.`);
    return data;
  } catch (error) {
    console.error(`Error fetching session schedule for ${year} ${event}:`, error);
    throw error;
  }
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
  const url = `${API_BASE_URL}/api/laps/driver?${params.toString()}`;
  console.log(`Fetching lap numbers from: ${url}`);
  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
      console.error(`API Error fetching lap numbers for ${driver}: ${errorDetail}`);
      throw new Error(errorDetail);
    }
    const data: { laps: number[] } = await response.json();
    console.log(`Successfully fetched ${data.laps.length} lap numbers for ${driver}.`);
    return data.laps || []; // Ensure we return an array
  } catch (error) {
    console.error(`Error fetching lap numbers for ${driver}:`, error);
    throw error;
  }
};


/** Fetches sector comparison data for two drivers for specific laps. */
export const fetchSectorComparison = async (
  year: number, 
  event: string, 
  session: string,
  driver1: string,
  driver2: string,
  lap1: string | number = 'fastest', // Add lap1 parameter with default
  lap2: string | number = 'fastest'  // Add lap2 parameter with default
): Promise<SectorComparisonData> => {
  if (!driver1 || !driver2) {
    throw new Error("Both drivers must be specified");
  }

  const params = new URLSearchParams({
    year: year.toString(),
    event,
    session,
    driver1,
    driver2,
    lap1: String(lap1), // Pass lap identifiers
    lap2: String(lap2)  // Pass lap identifiers
  });

  // Correct endpoint and all parameters as query params
  const url = `${API_BASE_URL}/api/comparison/sectors?${params.toString()}`;
  console.log(`Fetching sector comparison from: ${url}`); // Log includes laps now
  
  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try { 
        const errorData = await response.json(); 
        errorDetail = errorData.detail || errorDetail; 
      } catch (e) { /* Ignore */ }
      console.error(`API Error: ${errorDetail}`);
      throw new Error(errorDetail);
    }
    const data: SectorComparisonData = await response.json();
    console.log(`Successfully fetched sector comparison for ${driver1} (Lap ${lap1}) vs ${driver2} (Lap ${lap2}) in ${year} ${event} ${session}`);
    return data;
  } catch (error) {
    console.error(`Error fetching sector comparison for ${driver1} (Lap ${lap1}) vs ${driver2} (Lap ${lap2}):`, error);
    
    // For development/demo, return mock data if real API isn't available
    if (process.env.NODE_ENV === 'development') {
      // Generate mock sector comparison data
      const mockData: SectorComparisonData = {
        driver1Code: driver1,
        driver2Code: driver2,
        circuitLayout: "M100,250 C150,100 250,50 400,50 C550,50 650,100 700,250 C750,400 650,450 400,450 C250,450 150,400 100,250 Z",
        sections: [
          {
            id: "s1",
            name: "Turn 1",
            type: "corner",
            path: "M380,50 C420,50 460,50 500,70 C540,90 560,130 560,170",
            driver1Advantage: Math.random() * 0.2 - 0.1
          },
          {
            id: "s2",
            name: "Back Straight",
            type: "straight",
            path: "M560,170 C590,240 620,310 650,380",
            driver1Advantage: Math.random() * 0.2 - 0.1
          },
          {
            id: "s3",
            name: "Chicane",
            type: "corner",
            path: "M650,380 C630,420 580,440 520,440",
            driver1Advantage: Math.random() * 0.2 - 0.1
          },
          {
            id: "s4",
            name: "Final Corner",
            type: "corner",
            path: "M520,440 C400,450 280,430 200,370",
            driver1Advantage: Math.random() * 0.2 - 0.1
          },
          {
            id: "s5",
            name: "Start/Finish",
            type: "straight",
            path: "M200,370 C150,320 120,260 110,200 C100,140 120,90 180,60 C240,30 310,50 380,50",
            driver1Advantage: Math.random() * 0.2 - 0.1
          }
        ]
      };
      return mockData;
    }
    
    throw error;
  }
};

/** Fetches detailed stint analysis data including lap times. */
export const fetchStintAnalysis = async (year: number, event: string, session: string): Promise<StintAnalysisData[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session });
    const url = `${API_BASE_URL}/api/stint-analysis?${params.toString()}`;
    console.log(`Fetching stint analysis from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error: ${errorDetail}`);
            throw new Error(errorDetail);
        }
        const data: StintAnalysisData[] = await response.json();
        console.log(`Successfully fetched ${data.length} stint records for analysis.`);
        return data;
    } catch (error) { console.error("Error fetching stint analysis:", error); throw error; }
};

/** Fetches incident periods (SC/VSC, Red Flag) for a session. */
export const fetchSessionIncidents = async (year: number, event: string, session: string): Promise<SessionIncident[]> => {
    const params = new URLSearchParams({ year: year.toString(), event, session });
    const url = `${API_BASE_URL}/api/incidents?${params.toString()}`;
    console.log(`Fetching session incidents from: ${url}`);
    try {
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) {
            let errorDetail = `HTTP error! status: ${response.status}`;
            try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* Ignore */ }
            console.error(`API Error fetching incidents: ${errorDetail}`);
            // Return empty array on error to prevent breaking UI that expects an array
            return [];
            // Alternatively, throw new Error(errorDetail); if you want query hook to handle error state
        }
        const data: SessionIncident[] = await response.json();
        console.log(`Successfully fetched ${data.length} incident periods.`);
        return data;
    } catch (error) {
        console.error("Error fetching session incidents:", error);
        // Return empty array on network/other errors
        return [];
        // Alternatively, throw error;
    }
};

// Function to fetch team pace analysis data
export const fetchTeamPace = async (
    year: number,
    event: string,
    session: string
): Promise<TeamPaceData[]> => {
    const url = `/api/pace/teams?year=${year}&event=${encodeURIComponent(event)}&session=${session}`;
    console.log("Fetching team pace data from:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(`Failed to fetch team pace data: ${response.status} ${errorData.detail || response.statusText}`);
        }
        const data: TeamPaceData[] = await response.json();
        console.log("Successfully fetched team pace data:", data.length);
        return data;
    } catch (error) {
        console.error("Error fetching team pace data:", error);
        throw error; // Re-throw to be caught by React Query
    }
};
