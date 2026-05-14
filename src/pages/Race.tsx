// knip-ignore
import { useMemo, useEffect, useCallback, useRef, useReducer } from 'react';
import { SEO } from '@/components/layout/SEO';
import { useParams, useSearchParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import HistoricalAccessPrompt from '@/components/common/HistoricalAccessPrompt';
import {
  fetchSpecificRaceResults,
  fetchAvailableSessions,
  fetchEventSessionSchedule,
  DetailedRaceResult,
  AvailableSession,
  EventSessionSchedule,
  getCircuitLength,
  calculateDistance,
} from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getCountryCode } from '@/utils/countryUtils';
import { APIError } from '@/lib/api-client';
import { RaceHeader } from '@/pages/Race/RaceHeader';
import { RaceTabStrip } from '@/pages/Race/RaceTabStrip';
import {
  parseRaceLapTime as parseLapTime,
  parseRaceTestingSessionAlias as parseTestingSessionAlias,
  resolveRaceSessionForAnalysis as resolveSessionForAnalysis,
} from '@/pages/Race/race-utils';
import type { RaceLayoutContext } from '@/pages/Race/race-layout-context';

type RaceUIState = {
  testingWindow: 'full' | 'morning' | 'afternoon';
  now: Date;
  is24Hour: boolean;
};

type RaceUIAction =
  | { type: 'setTestingWindow'; value: 'full' | 'morning' | 'afternoon' }
  | { type: 'tickNow' }
  | { type: 'toggle24Hour' };

const raceUIReducer = (state: RaceUIState, action: RaceUIAction): RaceUIState => {
  switch (action.type) {
    case 'setTestingWindow':
      return { ...state, testingWindow: action.value };
    case 'tickNow':
      return { ...state, now: new Date() };
    case 'toggle24Hour':
      return { ...state, is24Hour: !state.is24Hour };
    default:
      return state;
  }
};

// Legacy ?tab= → sub-route mapping
const LEGACY_TAB_MAP: Record<string, string> = {
  overview: '/overview',
  replay: '/replay',
  strategy: '/strategy',
  positions: '/lap-analysis?view=positions',
  laptimes: '/lap-analysis',
  dominance: '/head-to-head',
  telemetry: '/telemetry',
};

const Race = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSession = searchParams.get('session') || '';
  const showAnalysis = searchParams.get('view') === 'analysis';

  const { trackEvent } = useAnalytics();

  const [uiState, dispatchUI] = useReducer(raceUIReducer, {
    testingWindow: 'full',
    now: new Date(),
    is24Hour: true,
  });
  const { testingWindow, now } = uiState;

  // Legacy ?tab= one-shot redirect (Requirement 9)
  const legacyRedirectDone = useRef(false);
  useEffect(() => {
    if (legacyRedirectDone.current) return;
    legacyRedirectDone.current = true;

    // Only act at the layout-level path — not inside a section
    if (location.pathname !== `/race/${raceId}`) return;

    const tabParam = searchParams.get('tab');
    if (!tabParam || !tabParam.trim()) return;

    const params = new URLSearchParams(searchParams);
    params.delete('tab');

    // Team pace → external redirect
    if (tabParam === 'teampace') {
      navigate(`/team-pace?race=${raceId}`, { replace: true });
      return;
    }

    const target = LEGACY_TAB_MAP[tabParam];
    if (!target) {
      if (import.meta.env.DEV) {
        console.warn(`[Race] Unknown legacy ?tab="${tabParam}". Redirecting to /overview.`);
      }
      navigate(
        {
          pathname: `/race/${raceId}/overview`,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true }
      );
      return;
    }

    // Target may contain ?view=… — merge into params
    const [targetPath, targetQuery] = target.split('?');
    if (targetQuery) {
      const targetParams = new URLSearchParams(targetQuery);
      targetParams.forEach((value, key) => {
        if (!params.has(key)) params.set(key, value);
      });
    }

    navigate(
      {
        pathname: `/race/${raceId}${targetPath}`,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSelectedSession = useCallback((session: string) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('session', session);
        return newParams;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => dispatchUI({ type: 'tickNow' }), 1000);
    return () => clearInterval(timer);
  }, []);

  // Parse ID
  const parsedRaceId = (() => {
    if (!raceId) return { year: null, eventSlug: null, eventName: 'Race' };
    const parts = raceId.split('-');
    const parsedYear = parseInt(parts[0], 10);
    if (isNaN(parsedYear)) return { year: null, eventSlug: raceId, eventName: 'Invalid Race ID' };
    const slug = parts.slice(1).join('-');
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return { year: parsedYear, eventSlug: slug, eventName: name };
  })();
  const year = parsedRaceId.year;
  const eventSlug = parsedRaceId.eventSlug;
  const eventName = parsedRaceId.eventName;

  const isTestingEvent = useMemo(() => {
    const format = eventName?.toLowerCase() ?? '';
    return format.includes('testing') || format.includes('test');
  }, [eventName]);

  const trackedEventRef = useRef<string | null>(null);
  useEffect(() => {
    if (year && eventName && eventName !== 'Invalid Race ID') {
      const eventKey = `${year}-${eventName}`;
      if (trackedEventRef.current !== eventKey) {
        trackEvent('race_analysis_viewed', { year, race: eventName });
        trackedEventRef.current = eventKey;
      }
    }
  }, [year, eventName, trackEvent]);

  // Queries
  const {
    data: availableSessions = [],
    isLoading: isLoadingSessions,
    error: availableSessionsError,
  } = useQuery<AvailableSession[]>({
    queryKey: ['availableSessions', year, eventName],
    queryFn: () => fetchAvailableSessions(year!, eventName),
    enabled: !!year && !!eventName,
  });

  const { data: sessionSchedule } = useQuery<EventSessionSchedule>({
    queryKey: ['sessionSchedule', year, eventSlug],
    queryFn: () => fetchEventSessionSchedule(year!, eventSlug!),
    enabled:
      !!year &&
      !!eventSlug &&
      !isLoadingSessions &&
      (!availableSessions || !availableSessions.some((s) => s.type === 'R')),
  });

  const { data: sessionResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, eventSlug, selectedSession],
    queryFn: () => fetchSpecificRaceResults(year!, eventSlug!, selectedSession),
    enabled: !!year && !!eventSlug && !!selectedSession && availableSessions.length > 0,
  });

  // Set default session if not already in params
  const sessionParam = searchParams.get('session');
  useEffect(() => {
    if (availableSessions.length > 0 && !sessionParam) {
      let defaultSession = '';
      if (isTestingEvent) {
        defaultSession = availableSessions[0].type;
      } else if (availableSessions.some((s) => s.type === 'R')) {
        defaultSession = 'R';
      } else {
        defaultSession = availableSessions[availableSessions.length - 1].type;
      }
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('session', defaultSession);
          return newParams;
        },
        { replace: true }
      );
    }
  }, [availableSessions, sessionParam, isTestingEvent, setSearchParams]);

  // Summary results for testing events
  const { data: summaryResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['summaryResult', year, eventSlug],
    queryFn: async () => {
      if (!year || !eventSlug || availableSessions.length === 0) return [];
      const fetchingSessions = availableSessions.filter((s) => s.type !== 'Summary');
      const allResultsArray = await Promise.all(
        fetchingSessions.map((s) => fetchSpecificRaceResults(year, eventSlug, s.type))
      );
      const aggregatedMap: { [driverCode: string]: DetailedRaceResult } = {};
      allResultsArray.forEach((results) => {
        results.forEach((result) => {
          if (!aggregatedMap[result.driverCode]) {
            aggregatedMap[result.driverCode] = {
              ...result,
              lapsCompleted: 0,
              fastestLapTime: null,
            };
          }
          const aggr = aggregatedMap[result.driverCode];
          if (result.lapsCompleted) {
            aggr.lapsCompleted = (aggr.lapsCompleted || 0) + result.lapsCompleted;
          }
          if (result.fastestLapTime) {
            const currentFastest = parseLapTime(aggr.fastestLapTime);
            const newTime = parseLapTime(result.fastestLapTime);
            if (!aggr.fastestLapTime || newTime < currentFastest) {
              aggr.fastestLapTime = result.fastestLapTime;
            }
          }
        });
      });
      return Object.values(aggregatedMap);
    },
    enabled: isTestingEvent && selectedSession === 'Summary' && availableSessions.length > 0,
  });

  const effectiveSessionResults = selectedSession === 'Summary' ? summaryResults : sessionResults;
  const isHistoricalAccessLocked =
    availableSessionsError instanceof APIError && availableSessionsError.status === 402;

  // Derived highlights
  const raceWinner = useMemo(
    () =>
      selectedSession === 'R' || selectedSession === 'Sprint'
        ? (effectiveSessionResults?.find((r) => r.position === 1) ?? null)
        : null,
    [effectiveSessionResults, selectedSession]
  );

  const poleSitter = useMemo(
    () =>
      selectedSession === 'R' || selectedSession === 'Sprint'
        ? (effectiveSessionResults?.find((r) => r.gridPosition === 1) ?? null)
        : null,
    [effectiveSessionResults, selectedSession]
  );

  const fastestLapHolder = useMemo(() => {
    if ((selectedSession !== 'R' && selectedSession !== 'Sprint') || !effectiveSessionResults)
      return null;
    const validResults = effectiveSessionResults.filter(
      (r) => !['Disqualified', 'DSQ', 'EXC'].includes(r.status) && r.driverFastestLapTime
    );
    if (validResults.length === 0) return null;
    return validResults.reduce<DetailedRaceResult | null>((best, result) => {
      if (!best) return result;
      return parseLapTime(result.driverFastestLapTime) < parseLapTime(best.driverFastestLapTime)
        ? result
        : best;
    }, null);
  }, [effectiveSessionResults, selectedSession]);

  const topPerformers = useMemo(() => {
    if (
      !effectiveSessionResults ||
      !selectedSession ||
      selectedSession === 'R' ||
      selectedSession === 'Sprint'
    )
      return [];
    return [...effectiveSessionResults]
      .filter((r) => r.fastestLapTime)
      .sort((a, b) => parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime))
      .slice(0, 3);
  }, [effectiveSessionResults, selectedSession]);

  // Testing session derivations
  const testingSessionAlias = useMemo(
    () => parseTestingSessionAlias(selectedSession),
    [selectedSession]
  );
  const isTestingSplitSession = isTestingEvent && !!testingSessionAlias;
  const analysisSession = useMemo(() => {
    const resolved = resolveSessionForAnalysis(selectedSession);
    if (resolved === 'Summary' && availableSessions.length > 0) {
      const firstFP = availableSessions.find((s) => s.type.startsWith('FP'));
      return firstFP?.type ?? 'FP1';
    }
    return resolved;
  }, [selectedSession, availableSessions]);
  const isTestingSession =
    isTestingEvent &&
    (selectedSession.startsWith('FP') || selectedSession === 'Summary' || !!testingSessionAlias);

  const effectiveTestingWindow: 'full' | 'morning' | 'afternoon' =
    !isTestingSession || isTestingSplitSession || selectedSession === 'Summary'
      ? 'full'
      : testingWindow;

  const getSessionWindowLapTime = useCallback(
    (result: DetailedRaceResult): string | null | undefined => {
      if (!isTestingSession || isTestingSplitSession) return result.fastestLapTime;
      if (effectiveTestingWindow === 'morning')
        return result.morningFastestLapTime ?? result.fastestLapTime;
      if (effectiveTestingWindow === 'afternoon')
        return result.afternoonFastestLapTime ?? result.fastestLapTime;
      return result.fastestLapTime;
    },
    [isTestingSession, isTestingSplitSession, effectiveTestingWindow]
  );

  const getSessionWindowLaps = useCallback(
    (result: DetailedRaceResult): number => {
      if (!isTestingSession || isTestingSplitSession || selectedSession === 'Summary')
        return result.lapsCompleted ?? 0;
      if (effectiveTestingWindow === 'morning')
        return result.morningLapsCompleted ?? result.lapsCompleted ?? 0;
      if (effectiveTestingWindow === 'afternoon')
        return result.afternoonLapsCompleted ?? result.lapsCompleted ?? 0;
      return result.lapsCompleted ?? 0;
    },
    [isTestingSession, isTestingSplitSession, effectiveTestingWindow, selectedSession]
  );

  const testingInsights = useMemo(() => {
    if (!effectiveSessionResults || !isTestingSession) {
      return {
        fastest: null,
        mileage: null,
        totalLaps: 0,
        totalDistance: 0,
        averageLaps: 0,
        circuitLength: 5.0,
      };
    }
    const circuitLength = getCircuitLength(eventName);
    const fastest = effectiveSessionResults.reduce<DetailedRaceResult | null>((best, result) => {
      const lapTime = getSessionWindowLapTime(result);
      if (!lapTime) return best;
      if (!best) return result;
      return parseLapTime(lapTime) < parseLapTime(getSessionWindowLapTime(best)) ? result : best;
    }, null);
    const mileage =
      effectiveSessionResults.toSorted(
        (a, b) => getSessionWindowLaps(b) - getSessionWindowLaps(a)
      )[0] ?? null;
    const totalLaps = effectiveSessionResults.reduce((sum, r) => sum + getSessionWindowLaps(r), 0);
    const totalDistance = calculateDistance(totalLaps, circuitLength);
    const averageLaps =
      effectiveSessionResults.length > 0 ? totalLaps / effectiveSessionResults.length : 0;
    return { fastest, mileage, totalLaps, totalDistance, averageLaps, circuitLength };
  }, [
    effectiveSessionResults,
    isTestingSession,
    getSessionWindowLapTime,
    getSessionWindowLaps,
    eventName,
  ]);

  // Schedule-related derivations (for RaceIndex)
  const hasRaceData = isTestingEvent
    ? availableSessions.length > 0
    : availableSessions.some((s) => s.type === 'R');
  const shouldShowSchedule = !hasRaceData && !showAnalysis;

  // Early returns
  if (!year || !eventSlug) return null;

  if (isLoadingSessions) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/60" />
          <div className="text-[13px] text-white/60">Loading session data…</div>
        </div>
      </div>
    );
  }

  if (isHistoricalAccessLocked) {
    return (
      <div className="text-white">
        <SEO
          title={`${eventName} ${year}: weekend breakdown`}
          description={`Explore the ${year} ${eventName} with lap data, telemetry overlays, strategy context, session results, and pace analysis.`}
          keywords={[
            'race analysis',
            'f1 telemetry',
            'race results',
            'tire strategy',
            eventName,
            `${year} race weekend`,
          ]}
        />
        <HistoricalAccessPrompt year={year} eventName={eventName} />
      </div>
    );
  }

  // Build the outlet context value
  const layoutContext: RaceLayoutContext = {
    year,
    eventSlug,
    eventName,
    selectedSession,
    setSelectedSession,
    analysisSession,
    availableSessions,
    isTestingEvent,
    isTestingSession,
    isTestingSplitSession,
    testingSessionAlias,
    sessionResults,
    summaryResults,
    effectiveSessionResults,
    sessionSchedule,
    raceWinner,
    poleSitter,
    fastestLapHolder,
    topPerformers,
    testingInsights,
    testingWindow,
    setTestingWindow: (w: 'full' | 'morning' | 'afternoon') =>
      dispatchUI({ type: 'setTestingWindow', value: w }),
    effectiveTestingWindow,
    getSessionWindowLapTime,
    getSessionWindowLaps,
    profile,
  };

  return (
    <div className="text-white">
      <SEO
        title={`${eventName} ${year}: weekend breakdown`}
        description={`Explore the ${year} ${eventName} with lap data, telemetry overlays, strategy context, session results, and pace analysis.`}
        keywords={[
          'race analysis',
          'f1 telemetry',
          'race results',
          'tire strategy',
          eventName,
          `${year} race weekend`,
        ]}
      />

      <div className="space-y-5">
        {/* Header */}
        <RaceHeader
          year={year}
          eventName={eventName}
          selectedSession={selectedSession}
          availableSessions={availableSessions}
          isTestingEvent={isTestingEvent}
          shouldShowSchedule={shouldShowSchedule}
          setSelectedSession={setSelectedSession}
        />

        {/* Tab strip — hidden when showing schedule */}
        {!shouldShowSchedule && (
          <RaceTabStrip
            baseHref={`/race/${raceId}`}
            selectedSession={selectedSession}
            isTestingSession={isTestingSession}
            isTestingEvent={isTestingEvent}
            isHistorical={!!year && year < 2018}
          />
        )}

        {/* Section content via sub-routes */}
        <Outlet context={layoutContext} />
      </div>
    </div>
  );
};

export default Race;

export {
  parseRaceLapTime,
  parseRaceTestingSessionAlias,
  resolveRaceSessionForAnalysis,
} from '@/pages/Race/race-utils';

export { formatRaceSessionTime } from '@/utils/formatters';
