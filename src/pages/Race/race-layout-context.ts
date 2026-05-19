import { useOutletContext } from 'react-router-dom';
import type { AvailableSession, DetailedRaceResult, EventSessionSchedule } from '@/lib/api';
import type { Profile } from '@/contexts/AuthContext';

/**
 * Aggregated testing-specific insights derived from the session results.
 * Only meaningful when the active event/session is a testing session.
 */
export interface TestingInsights {
  fastest: DetailedRaceResult | null;
  mileage: DetailedRaceResult | null;
  totalLaps: number;
  totalDistance: number;
  averageLaps: number;
  circuitLength: number;
}

/**
 * Shape of the value exposed by the `/race/:raceId` layout route via
 * react-router's `<Outlet context={…} />`. Every child section consumes it
 * through {@link useRaceLayoutContext} — there is no React context provider.
 */
export interface RaceLayoutContext {
  // Route identifiers
  year: number;
  eventSlug: string;
  eventName: string;

  // Session selection
  selectedSession: string;
  setSelectedSession: (session: string) => void;
  analysisSession: string;
  availableSessions: AvailableSession[];
  isTestingEvent: boolean;
  isTestingSession: boolean;
  isTestingSplitSession: boolean;
  testingSessionAlias: string | null;

  // Results data
  sessionResults: DetailedRaceResult[] | undefined;
  summaryResults: DetailedRaceResult[] | undefined;
  effectiveSessionResults: DetailedRaceResult[] | undefined;
  sessionSchedule: EventSessionSchedule | undefined;

  // Derived highlights
  raceWinner: DetailedRaceResult | null;
  poleSitter: DetailedRaceResult | null;
  fastestLapHolder: DetailedRaceResult | null;
  topPerformers: DetailedRaceResult[];
  testingInsights: TestingInsights;

  // Testing window helpers
  testingWindow: 'full' | 'morning' | 'afternoon';
  setTestingWindow: (w: 'full' | 'morning' | 'afternoon') => void;
  effectiveTestingWindow: 'full' | 'morning' | 'afternoon';
  getSessionWindowLapTime: (r: DetailedRaceResult) => string | null | undefined;
  getSessionWindowLaps: (r: DetailedRaceResult) => number;

  // Profile (for favourite-driver highlighting)
  profile: Profile | null;
}

/**
 * Typed wrapper around `useOutletContext` that returns the race layout's
 * shared state. Call this from any section rendered inside the
 * `/race/:raceId` layout route.
 */
export function useRaceLayoutContext(): RaceLayoutContext {
  return useOutletContext<RaceLayoutContext>();
}
