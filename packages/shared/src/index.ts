// Logger
export { logger } from './logger';

// API Client
export { createApiClient, APIError } from './api';
export type { ApiClientConfig } from './api';
export { createSupabaseClient } from './api/supabase';

// Types
export type {
  LapTimeDataPoint,
  EnrichedLapRecord,
  WeatherSummary,
  LapTimesEnrichedResponse,
  SpeedDataPoint,
  LapMeta,
  SpeedTraceResponse,
  GearMapDataPoint,
  GearMapResponse,
  GearShiftMapData,
  ThrottleDataPoint,
  BrakeDataPoint,
  RPMDataPoint,
  DRSDataPoint,
  TireStint,
  DriverStrategy,
  PitStop,
  RaceControlMessage,
  TireStrategyResponse,
  SessionDriver,
  DriverStanding,
  TeamStanding,
  ScheduleEvent,
  AvailableSession,
  SessionScheduleInfo,
  EventSessionSchedule,
  DetailedRaceResult,
  RaceResult,
  LapPositionDataPoint,
  LapDetail,
  StintAnalysisData,
  LapGapsResponse,
  DriverDetails,
  TeamDetails,
  DriverEvolutionData,
  RollingLapDataPoint,
  ChampionshipProgressionRound,
  ChampionshipProgressionDriver,
  ChampionshipProgressionData,
  TrackTemperatureDataPoint,
  TrackEvolutionResponse,
  TrackSection,
  SectorComparisonData,
  TeamPaceSession,
  CompoundPace,
  DriverPace,
  SectorPace,
  TeamPaceResponse,
  TeamPaceEvent,
  SessionIncident,
  SessionReplayData,
  ReplayDriverData,
  ReplayDriversMap,
} from './types';

// Data & Mappings
export {
  getDriverSlug,
  driverColor,
  isDRSAvailable,
  getCurrentSeasonYear,
  resolveSeasonYear,
  getTeamColorClass,
  teamDriverMap,
  areTeammates,
  getLineStylesForDriver,
  groupDriversByTeam,
  getTeamLogo,
  getTeamSlug,
  CIRCUIT_COORDINATES,
  getCircuitCoords,
} from './data';
export type { CircuitCoords } from './data';

// Utils
export { formatRaceSessionTime, getCountryCode, getNationalityCountryCode } from './utils';
