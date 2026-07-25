// --- API Response Types ---

export interface LapTimeDataPoint {
  LapNumber: number;
  [driverCode: string]: number | null;
}

export interface EnrichedLapRecord {
  lapNumber: number | null;
  lapTime: number | null;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  compound: string | null;
  tyreLife: number | null;
  freshTyre: boolean | null;
  stint: number | null;
  position: number | null;
  trackStatus: string | null;
  deleted: boolean;
  deletedReason: string | null;
  isPersonalBest: boolean;
  speedI1: number | null;
  speedI2: number | null;
  speedFL: number | null;
  speedST: number | null;
}

export interface WeatherSummary {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  rainfall: boolean;
  windSpeed: number;
  windDirection?: number;
}

export interface LapTimesEnrichedResponse {
  lapComparison: LapTimeDataPoint[];
  driverLapDetails: Record<string, EnrichedLapRecord[]>;
  weather: WeatherSummary | null;
}

export interface SpeedDataPoint {
  Distance: number;
  Speed: number;
  Throttle?: number;
  Brake?: number;
  DRS?: number;
  nGear?: number;
  RPM?: number;
}

export interface LapMeta {
  lapNumber?: number;
  lapTime?: number;
  compound?: string;
  tyreLife?: number;
  freshTyre?: boolean;
  stint?: number;
  position?: number;
  trackStatus?: string;
  isPersonalBest?: boolean;
  deleted?: boolean;
  deletedReason?: string;
  sector1Time?: number;
  sector2Time?: number;
  sector3Time?: number;
  speedI1?: number;
  speedI2?: number;
  speedFL?: number;
  speedST?: number;
}

export interface SpeedTraceResponse {
  trace: SpeedDataPoint[];
  lapMeta: LapMeta;
}

export interface GearMapDataPoint {
  X: number;
  Y: number;
  nGear: number;
  Z?: number;
  Status?: string;
  Speed?: number;
  DriverAhead?: string;
  DistanceToDriverAhead?: number;
}

export interface GearMapResponse {
  points: GearMapDataPoint[];
  lapMeta: LapMeta;
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
  tyreLifeStart?: number | null;
  tyreLifeEnd?: number | null;
  freshTyre?: boolean | null;
  avgLapTime?: number | null;
  bestLapTime?: number | null;
  positionStart?: number | null;
  positionEnd?: number | null;
}

export interface DriverStrategy {
  driver: string;
  stints: TireStint[];
}

export interface PitStop {
  driver: string;
  stopNumber: number;
  lap: number;
  duration: number | null;
  tyreFrom: string;
  tyreTo: string;
}

export interface RaceControlMessage {
  time: number | string | null;
  lap: number | null;
  message: string | null;
  category: string;
  flag: string | null;
}

export interface TireStrategyResponse {
  stints: DriverStrategy[];
  pitStops: PitStop[];
  raceControl: RaceControlMessage[];
  weather: WeatherSummary | null;
}

export interface SessionDriver {
  code: string;
  name: string;
  team: string;
  headshotUrl?: string;
  countryCode?: string;
  driverNumber?: string;
  teamColor?: string;
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
  headshotUrl?: string | null;
  countryCode?: string | null;
  avgGridPosition?: number | null;
  bestGridPosition?: number | null;
  bestFinish?: number | null;
  dnfs?: number;
  lapsCompleted?: number;
  fastestLaps?: number;
}

export interface TeamStanding {
  rank: number;
  team: string;
  points: number;
  wins: number;
  podiums: number;
  points_change?: number;
  teamColor?: string;
  shortName?: string;
}

export interface ScheduleEvent {
  RoundNumber: number;
  Country: string;
  Location: string;
  EventName: string;
  EventDate: string;
  EventFormat: string;
  Session1: string;
  Session1Date: string;
  Session2: string;
  Session2Date: string;
  Session3: string;
  Session3Date: string;
  Session4: string | null;
  Session4Date: string | null;
  Session5: string | null;
  Session5Date: string | null;
  F1ApiSupport: boolean;
}

export interface AvailableSession {
  name: string;
  type: string;
  startTime?: string;
  sourceSession?: string;
  testingWindow?: 'morning' | 'afternoon' | 'full';
}

export interface SessionScheduleInfo {
  name: string;
  date: string;
  localTime: string | null;
}

export interface EventSessionSchedule {
  eventName: string;
  location: string;
  country: string;
  eventFormat: string;
  sessions: SessionScheduleInfo[];
}

export interface DetailedRaceResult {
  position: number | null;
  driverCode: string;
  fullName: string;
  team: string;
  points: number | null;
  isProvisional?: boolean;
  status: string;
  gridPosition?: number | null;
  teamColor: string;
  isFastestLap?: boolean;
  fastestLapTime?: string | null;
  lapsCompleted?: number | null;
  q1Time?: string | null;
  q2Time?: string | null;
  q3Time?: string | null;
  time?: string | null;
  laps?: number | null;
  headshotUrl?: string | null;
  countryCode?: string | null;
  driverFastestLapTime?: string | null;
  driverFastestLapNumber?: number | null;
  deletedLapsCount?: number;
  totalStints?: number | null;
  maxSpeedTrap?: number | null;
  fastestLapSector1?: string | null;
  fastestLapSector2?: string | null;
  fastestLapSector3?: string | null;
}

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
}

export interface LapPositionDataPoint {
  LapNumber: number;
  [driverCode: string]: number | null;
}

export interface LapDetail {
  lapNumber: number;
  lapTime: number;
  sector1?: number;
  sector2?: number;
  sector3?: number;
  tyreLife?: number;
  position?: number;
  speedI1?: number;
  speedI2?: number;
  speedFL?: number;
  speedST?: number;
}

export interface StintAnalysisData {
  driverCode: string;
  stintNumber: number;
  compound: string;
  startLap: number;
  endLap: number;
  freshTyre?: boolean | null;
  tyreDegradation?: number | null;
  lapDetails: LapDetail[];
}

export interface LapGapsResponse {
  lapGaps: LapTimeDataPoint[];
  usesOfficialTiming: boolean;
}

export interface DriverDetails {
  driverId: string;
  name: string;
  nationality: string;
  dateOfBirth: string;
  bio?: string;
  imageUrl?: string;
  headshot_url?: string;
  team_colour?: string;
  team_name?: string;
  careerStats?: {
    wins?: number;
    podiums?: number;
    poles?: number;
    championships?: number;
  };
}

export interface TeamDetails {
  teamId: string;
  name: string;
  nationality: string;
  base?: string;
  firstEntry?: number;
  bio?: string;
  imageUrl?: string;
  careerStats?: {
    wins?: number;
    podiums?: number;
    poles?: number;
    constructorsChampionships?: number;
    driversChampionships?: number;
  };
}

export interface DriverEvolutionData {
  code: string;
  color: string;
  rollingAverageLaps: RollingLapDataPoint[];
}

export interface RollingLapDataPoint {
  lap: number;
  time: number | null;
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
  drivers: Record<string, ChampionshipProgressionDriver>;
}

export interface TrackTemperatureDataPoint {
  lap: number;
  temp: number | null;
}

export interface TrackEvolutionResponse {
  drivers: DriverEvolutionData[];
  trackTemperature: TrackTemperatureDataPoint[];
}

export interface TrackSection {
  id: string;
  name: string;
  type: 'straight' | 'corner' | 'sector';
  path: string;
  driver1Advantage?: number;
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
  circuitLayout: string;
}

export interface TeamPaceSession {
  teamName: string;
  medianTime: number;
  averageTime: number;
  fastestLapTime?: number;
  stdDev: number;
  lapCount: number;
  teamColor: string;
  rank: number;
}

export interface CompoundPace {
  teamName: string;
  compound: string;
  medianTime: number;
  averageTime: number;
  lapCount: number;
  teamColor: string;
}

export interface DriverPace {
  driverCode: string;
  teamName: string;
  medianTime: number;
  averageTime: number;
  stdDev: number;
  lapCount: number;
  teamColor: string;
}

export interface SectorPace {
  teamName: string;
  teamColor: string;
  sector1Median?: number | null;
  sector1Best?: number | null;
  sector2Median?: number | null;
  sector2Best?: number | null;
  sector3Median?: number | null;
  sector3Best?: number | null;
}

export interface TeamPaceResponse {
  teamPace: TeamPaceSession[];
  compoundPace: CompoundPace[];
  driverPace: DriverPace[];
  sectorPace: SectorPace[];
  weather: WeatherSummary | null;
}

export interface TeamPaceEvent {
  year: number;
  round: number;
  eventName: string;
  sessions: Record<string, TeamPaceSession[]>;
}

export interface SessionIncident {
  type: 'SC/VSC' | 'RedFlag';
  startLap: number;
  endLap: number;
}

export interface SessionReplayData {
  total_laps: number;
  total_duration: number;
  circuit_key: number;
  session_key: number;
  meeting_key: number;
  location: string;
  country_name: string;
  country_code: string;
  event_name: string;
  meeting_name: string;
  year: number;
  event: string;
  session: string;
}

export interface ReplayDriverData {
  driver_number: string;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url?: string;
  country_code?: string;
}

export interface ReplayDriversMap {
  [driverNumber: string]: ReplayDriverData;
}
