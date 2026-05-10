import type { ScheduleEvent, DetailedRaceResult } from '@/lib/api';

export const inter = { fontFamily: "'Inter', sans-serif" } as const;

export const isTestingDashboardEvent = (event: ScheduleEvent): boolean =>
  event.EventFormat?.toLowerCase().includes('test') ?? false;

export const getDashboardEventStartDate = (event: ScheduleEvent): Date =>
  new Date(event.Session1Date || event.EventDate);

export const toDashboardRaceSlug = (eventName: string): string =>
  eventName.toLowerCase().replace(/\s+/g, '-');

export const parseDashboardLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Number.POSITIVE_INFINITY;
  const cleaned = timeStr.startsWith('+') ? timeStr.slice(1) : timeStr;
  const parts = cleaned.split(/[:.]/);
  if (parts.length === 3) return Number(parts[0]) * 60 + Number(parts[1]) + Number(parts[2]) / 1000;
  if (parts.length === 2) return Number(parts[0]) + Number(parts[1]) / 1000;
  return Number.POSITIVE_INFINITY;
};

const TESTING_SESSION_ALIAS_PATTERN = /^DAY([1-3])_(AM|PM)$/i;
export const getDashboardTestingSessionOrder = (sessionType: string): number => {
  const match = sessionType.match(TESTING_SESSION_ALIAS_PATTERN);
  if (match) {
    const day = Number(match[1]);
    const halfScore = match[2].toUpperCase() === 'AM' ? 0 : 1;
    return day * 10 + halfScore;
  }
  if (sessionType === 'FP1') return 11;
  if (sessionType === 'FP2') return 21;
  if (sessionType === 'FP3') return 31;
  return -1;
};

export function buildEmptyTestingInsights() {
  return {
    fastest: [] as DetailedRaceResult[],
    mileage: [] as DetailedRaceResult[],
    morningFastest: null as DetailedRaceResult | null,
    afternoonFastest: null as DetailedRaceResult | null,
    totalLaps: 0,
    totalDistance: 0,
    morningLaps: 0,
    afternoonLaps: 0,
    driverCount: 0,
    leaderLaps: 0,
    leaderDistance: 0,
    circuitLength: 5.0,
  };
}
