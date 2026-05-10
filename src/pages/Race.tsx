// knip-ignore
import React, { useMemo, useEffect, useCallback, useRef, useReducer } from 'react';
import { SEO } from '@/components/layout/SEO';
import { useParams, useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
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
import { ScheduleSidebar } from '@/pages/Race/ScheduleSidebar';
import { TelemetryTabs } from '@/pages/Race/TelemetryTabs';
import { OverviewTab } from '@/pages/Race/tabs/OverviewTab';
import { StrategyTab } from '@/pages/Race/tabs/StrategyTab';
import { PositionsTab } from '@/pages/Race/tabs/PositionsTab';
import { LapTimesTab } from '@/pages/Race/tabs/LapTimesTab';
import { DominanceTab } from '@/pages/Race/tabs/DominanceTab';
import { TeamPaceTab } from '@/pages/Race/tabs/TeamPaceTab';
import { TelemetryTab } from '@/pages/Race/tabs/TelemetryTab';
import { ReplayTab } from '@/pages/Race/tabs/ReplayTab';
import {
  parseRaceLapTime as parseLapTime,
  parseRaceTestingSessionAlias as parseTestingSessionAlias,
  resolveRaceSessionForAnalysis as resolveSessionForAnalysis,
} from '@/pages/Race/race-utils';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

type RaceUIState = {
  selectedLap: string | number;
  activeSection: string;
  lapAnalysisMode: 'history' | 'pace' | 'gap';
  testingWindow: 'full' | 'morning' | 'afternoon';
  now: Date;
  is24Hour: boolean;
};

type RaceUIAction =
  | { type: 'setSelectedLap'; value: string | number }
  | { type: 'setActiveSection'; value: string }
  | { type: 'setLapAnalysisMode'; value: 'history' | 'pace' | 'gap' }
  | { type: 'setTestingWindow'; value: 'full' | 'morning' | 'afternoon' }
  | { type: 'tickNow' }
  | { type: 'toggle24Hour' };

const raceUIReducer = (state: RaceUIState, action: RaceUIAction): RaceUIState => {
  switch (action.type) {
    case 'setSelectedLap':
      return { ...state, selectedLap: action.value };
    case 'setActiveSection':
      return { ...state, activeSection: action.value };
    case 'setLapAnalysisMode':
      return { ...state, lapAnalysisMode: action.value };
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

const Race = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSession = searchParams.get('session') || '';
  const showAnalysis = searchParams.get('view') === 'analysis';
  const initialTab = searchParams.get('tab');

  const { trackEvent, trackInteraction, trackSelection } = useAnalytics();

  const [uiState, dispatchUI] = useReducer(raceUIReducer, {
    selectedLap: 'fastest',
    activeSection: initialTab || 'overview',
    lapAnalysisMode: 'history',
    testingWindow: 'full',
    now: new Date(),
    is24Hour: true,
  });
  const { selectedLap, activeSection, lapAnalysisMode, testingWindow, now, is24Hour } = uiState;

  const setSelectedSession = (session: string) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('session', session);
        return newParams;
      },
      { replace: true }
    );
    trackEvent('session_changed', { session_type: session, race_name: eventName, year: year });
  };

  const setShowAnalysis = (show: boolean) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (show) {
        newParams.set('view', 'analysis');
      } else {
        newParams.delete('view');
      }
      return newParams;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => dispatchUI({ type: 'tickNow' }), 1000);
    return () => clearInterval(timer);
  }, []);

  // Circuit Comparison State
  const [circuitDrivers, setCircuitDrivers] = useState<{
    driver1: string;
    driver2: string;
    lap1: string | number;
    lap2: string | number;
    shouldLoadChart: boolean;
  }>({ driver1: '', driver2: '', lap1: 'fastest', lap2: 'fastest', shouldLoadChart: false });

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
        trackEvent('race_analysis_viewed', {
          year,
          race: eventName,
        });
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

  const { data: sessionResults, isLoading: isLoadingResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, eventSlug, selectedSession],
    queryFn: () => fetchSpecificRaceResults(year!, eventSlug!, selectedSession),
    enabled: !!year && !!eventSlug && !!selectedSession && availableSessions.length > 0,
  });

  // Only set default session if not already in params
  useEffect(() => {
    if (availableSessions.length > 0 && !searchParams.get('session')) {
      let defaultSession = '';
      if (isTestingEvent) {
        defaultSession = 'Summary';
      } else if (availableSessions.some((s) => s.type === 'R')) {
        defaultSession = 'R';
      } else {
        defaultSession = availableSessions[availableSessions.length - 1].type;
      }

      // Update params without pushing to history for initial load
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('session', defaultSession);
          return newParams;
        },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSessions]);

  // Derived Data
  // Fetch aggregated data for "Summary" session in testing events
  const { data: summaryResults, isLoading: isLoadingSummary } = useQuery<DetailedRaceResult[]>({
    queryKey: ['summaryResult', year, eventSlug],
    queryFn: async () => {
      if (!year || !eventSlug || availableSessions.length === 0) return [];

      const fetchingSessions = availableSessions.filter((s) => s.type !== 'Summary');

      const allResultsPromises = fetchingSessions.map((s) =>
        fetchSpecificRaceResults(year, eventSlug, s.type)
      );

      const allResultsArray = await Promise.all(allResultsPromises);

      const aggregatedMap: { [driverCode: string]: DetailedRaceResult } = {};

      allResultsArray.forEach((sessionResults) => {
        sessionResults.forEach((result) => {
          if (!aggregatedMap[result.driverCode]) {
            aggregatedMap[result.driverCode] = {
              ...result,
              lapsCompleted: 0,
              fastestLapTime: null, // We'll find min
            };
          }

          const aggr = aggregatedMap[result.driverCode];

          // Sum laps
          if (result.lapsCompleted) {
            aggr.lapsCompleted = (aggr.lapsCompleted || 0) + result.lapsCompleted;
          }

          // Find fastest lap across sessions
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
  const isLoadingEffectiveResults =
    selectedSession === 'Summary' ? isLoadingSummary : isLoadingResults;
  const isHistoricalAccessLocked =
    availableSessionsError instanceof APIError && availableSessionsError.status === 402;

  const raceWinner = useMemo(
    () =>
      selectedSession === 'R' || selectedSession === 'Sprint'
        ? effectiveSessionResults?.find((r) => r.position === 1)
        : null,
    [effectiveSessionResults, selectedSession]
  );

  const poleSitter = useMemo(
    () =>
      selectedSession === 'R' || selectedSession === 'Sprint'
        ? effectiveSessionResults?.find((r) => r.gridPosition === 1)
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
      if (!best) {
        return result;
      }

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

  /* Testing Event identification logic moved up early in the component */

  const testingSessionAlias = useMemo(
    () => parseTestingSessionAlias(selectedSession),
    [selectedSession]
  );
  const isTestingSplitSession = isTestingEvent && !!testingSessionAlias;
  const analysisSession = useMemo(() => {
    const resolved = resolveSessionForAnalysis(selectedSession);
    // "Summary" is not a real FastF1 session — map to first FP in available sessions
    if (resolved === 'Summary' && availableSessions.length > 0) {
      const firstFP = availableSessions.find((s) => s.type.startsWith('FP'));
      return firstFP?.type ?? 'FP1';
    }
    return resolved;
  }, [selectedSession, availableSessions]);
  const isTestingSession =
    isTestingEvent &&
    (selectedSession.startsWith('FP') || selectedSession === 'Summary' || !!testingSessionAlias);

  // Derived testing window: forced to 'full' when conditions invalidate session splits.
  const effectiveTestingWindow =
    !isTestingSession || isTestingSplitSession || selectedSession === 'Summary'
      ? 'full'
      : testingWindow;

  const getSessionWindowLapTime = useCallback(
    (result: DetailedRaceResult): string | null | undefined => {
      if (!isTestingSession || isTestingSplitSession) return result.fastestLapTime;
      if (effectiveTestingWindow === 'morning')
        return result.morningFastestLapTime ?? result.fastestLapTime;
      if (effectiveTestingWindow === 'afternoon') {
        return result.afternoonFastestLapTime ?? result.fastestLapTime;
      }
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
      if (effectiveTestingWindow === 'afternoon') {
        return result.afternoonLapsCompleted ?? result.lapsCompleted ?? 0;
      }
      return result.lapsCompleted ?? 0;
    },
    [isTestingSession, isTestingSplitSession, effectiveTestingWindow, selectedSession]
  );

  const testingInsights = useMemo(() => {
    if (!effectiveSessionResults || !isTestingSession) {
      return {
        fastest: null as DetailedRaceResult | null,
        mileage: null as DetailedRaceResult | null,
        totalLaps: 0,
        totalDistance: 0,
        averageLaps: 0,
        circuitLength: 5.0,
      };
    }

    const circuitLength = getCircuitLength(eventName);

    const fastest = effectiveSessionResults.reduce<DetailedRaceResult | null>((best, result) => {
      const lapTime = getSessionWindowLapTime(result);
      if (!lapTime) {
        return best;
      }

      if (!best) {
        return result;
      }

      return parseLapTime(lapTime) < parseLapTime(getSessionWindowLapTime(best)) ? result : best;
    }, null);

    const mileage =
      effectiveSessionResults.toSorted(
        (a, b) => getSessionWindowLaps(b) - getSessionWindowLaps(a)
      )[0] ?? null;

    const totalLaps = effectiveSessionResults.reduce(
      (sum, result) => sum + getSessionWindowLaps(result),
      0
    );
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

  const nextSession = useMemo(() => {
    if (!sessionSchedule) return null;
    return sessionSchedule.sessions.find((s) => new Date(s.date) > now);
  }, [sessionSchedule, now]);

  const countdown = useMemo(() => {
    if (!nextSession) return null;
    const diff = new Date(nextSession.date).getTime() - now.getTime();
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, [nextSession, now]);

  const nextSessionDate = useMemo(
    () => (nextSession ? { name: nextSession.name, date: new Date(nextSession.date) } : null),
    [nextSession]
  );

  const scheduleHeroDate = useMemo(() => {
    if (!sessionSchedule?.sessions.length) return 'Dates TBD';
    const sortedDates = sessionSchedule.sessions
      .map((session) => new Date(session.date))
      .sort((a, b) => a.getTime() - b.getTime());
    const anchorDate = nextSession
      ? new Date(nextSession.date)
      : sortedDates[sortedDates.length - 1];
    return anchorDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [nextSession, sessionSchedule]);

  const scheduleHeroCountryCode = useMemo(() => {
    if (!sessionSchedule) return undefined;
    const code = getCountryCode(sessionSchedule.country || sessionSchedule.location);
    return code !== 'xx' ? code : undefined;
  }, [sessionSchedule]);

  const handleCircuitDriversSelected = React.useCallback(
    (drivers: {
      driver1: string;
      driver2: string;
      lap1: string | number;
      lap2: string | number;
      shouldLoadChart: boolean;
    }) => {
      setCircuitDrivers(drivers);
      if (drivers.shouldLoadChart) {
        trackEvent('chart_interaction', {
          chart: 'circuit_comparison',
          action: 'compare_drivers',
          driver1: drivers.driver1,
          driver2: drivers.driver2,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trackEvent is stable, intentionally excluded
    []
  );

  const handleSectionChange = (section: string) => {
    dispatchUI({ type: 'setActiveSection', value: section });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('tab_switched', {
      tab: section,
      context: 'race_analysis',
      race_name: eventName,
      year: year,
    });
  };

  if (!year || !eventSlug) return null;

  if (isLoadingSessions) {
    return (
      <div
        style={inter}
        className="flex min-h-screen items-center justify-center bg-[#09090b] text-white"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
          <div className="text-[13px] text-white/35 animate-pulse">Loading session data…</div>
        </div>
      </div>
    );
  }

  if (isHistoricalAccessLocked) {
    return (
      <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
        <SEO
          title={`${eventName} ${year}: weekend breakdown`}
          description={`Explore the ${year} ${eventName} with lap data, telemetry overlays, strategy context, session results, and pace analysis.`}
          keywords={[
            'race analysis',
            'f1 telemetry',
            'formula 1 telemetry data',
            'race results',
            'tire strategy',
            eventName,
            `${year} race weekend`,
          ]}
        />
        <DashboardNavbar />
        <main className="mx-auto max-w-6xl px-5 pb-20 pt-24 lg:px-8">
          <HistoricalAccessPrompt year={year} eventName={eventName} />
        </main>
      </div>
    );
  }

  const hasProcessedSessions = availableSessions.length > 0;
  const hasRaceData = isTestingEvent
    ? availableSessions.length > 0
    : availableSessions.some((s) => s.type === 'R');
  const shouldShowSchedule = !hasRaceData && !showAnalysis;

  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title={`${eventName} ${year}: weekend breakdown`}
        description={`Explore the ${year} ${eventName} with lap data, telemetry overlays, strategy context, session results, and pace analysis.`}
        keywords={[
          'race analysis',
          'f1 telemetry',
          'formula 1 telemetry data',
          'race results',
          'tire strategy',
          eventName,
          `${year} race weekend`,
        ]}
      />
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
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

        {shouldShowSchedule ? (
          <ScheduleSidebar
            sessionSchedule={sessionSchedule}
            scheduleHeroDate={scheduleHeroDate}
            scheduleHeroCountryCode={scheduleHeroCountryCode}
            nextSessionDate={nextSessionDate}
            countdown={countdown}
            is24Hour={is24Hour}
            setIs24Hour={() => dispatchUI({ type: 'toggle24Hour' })}
            trackInteraction={trackInteraction}
            now={now}
            availableSessions={availableSessions}
            setSelectedSession={setSelectedSession}
            setShowAnalysis={setShowAnalysis}
          />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            <TelemetryTabs
              activeSection={activeSection}
              handleSectionChange={handleSectionChange}
              selectedSession={selectedSession}
              isTestingSession={isTestingSession}
            />

            {/* Main Content */}
            <div className="min-w-0 flex-1 space-y-8">
              {activeSection === 'overview' && year && (
                <OverviewTab
                  year={year}
                  eventName={eventName}
                  availableSessions={availableSessions}
                  selectedSession={selectedSession}
                  isTestingSession={isTestingSession}
                  isTestingSplitSession={isTestingSplitSession}
                  testingWindow={testingWindow}
                  setTestingWindow={(w: string) =>
                    dispatchUI({
                      type: 'setTestingWindow',
                      value: w as 'full' | 'morning' | 'afternoon',
                    })
                  }
                  testingInsights={testingInsights}
                  getSessionWindowLapTime={getSessionWindowLapTime}
                  getSessionWindowLaps={getSessionWindowLaps}
                  raceWinner={raceWinner}
                  poleSitter={poleSitter}
                  fastestLapHolder={fastestLapHolder}
                  topPerformers={topPerformers}
                  sessionResults={sessionResults}
                  effectiveSessionResults={effectiveSessionResults}
                  profile={profile}
                />
              )}

              {activeSection === 'strategy' &&
                (selectedSession === 'R' || selectedSession === 'Sprint' || isTestingSession) &&
                year && (
                  <StrategyTab
                    year={year}
                    eventName={eventName}
                    analysisSession={analysisSession}
                    favoriteDriver={profile?.favorite_driver}
                  />
                )}

              {activeSection === 'positions' &&
                (selectedSession === 'R' || selectedSession === 'Sprint') &&
                year && (
                  <PositionsTab
                    year={year}
                    eventName={eventName}
                    analysisSession={analysisSession}
                    favoriteDriver={profile?.favorite_driver}
                  />
                )}

              {activeSection === 'laptimes' && year && (
                <LapTimesTab
                  year={year}
                  eventName={eventName}
                  analysisSession={analysisSession}
                  sessionResults={sessionResults}
                  favoriteDriver={profile?.favorite_driver}
                  lapAnalysisMode={lapAnalysisMode}
                  setLapAnalysisMode={(v: 'history' | 'pace' | 'gap') =>
                    dispatchUI({ type: 'setLapAnalysisMode', value: v })
                  }
                />
              )}

              {activeSection === 'dominance' && year && (
                <DominanceTab
                  year={year}
                  eventName={eventName}
                  analysisSession={analysisSession}
                  sessionResults={sessionResults}
                  favoriteDriver={profile?.favorite_driver}
                  circuitDrivers={circuitDrivers}
                  onCircuitDriversSelected={handleCircuitDriversSelected}
                />
              )}

              {activeSection === 'teampace' && year && (
                <TeamPaceTab year={year} eventName={eventName} analysisSession={analysisSession} />
              )}

              {activeSection === 'telemetry' && year && (
                <TelemetryTab
                  year={year}
                  eventName={eventName}
                  analysisSession={analysisSession}
                  selectedLap={selectedLap}
                  sessionResults={sessionResults}
                  favoriteDriver={profile?.favorite_driver}
                />
              )}

              {activeSection === 'replay' && year && eventSlug && selectedSession && (
                <ReplayTab
                  year={year}
                  eventSlug={eventSlug}
                  analysisSession={analysisSession}
                  isTestingSession={isTestingSession}
                  isTestingSplitSession={isTestingSplitSession}
                  testingSessionAlias={testingSessionAlias}
                  effectiveTestingWindow={effectiveTestingWindow}
                />
              )}
            </div>
          </div>
        )}
      </main>
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
