// knip-ignore
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { m } from 'motion/react';
import { SEO } from '@/components/layout/SEO';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionReplay } from '@/components/replay/SessionReplay';
import {
  ChampionIcon,
  Flag01Icon,
  Analytics01Icon,
  Clock01Icon,
  FlashIcon,
  Calendar01Icon,
  UserGroupIcon,
  Time01Icon,
  TradeUpIcon,
  ChartLineData01Icon,
  GitCompareIcon,
  PlayCircle02Icon,
} from 'hugeicons-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import HistoricalAccessPrompt from '@/components/common/HistoricalAccessPrompt';
import EventHeroCard from '@/components/calendar/EventHeroCard';
import { RacingChart } from '@/components/charts/RacingChart';
import { GapToLeaderChart } from '@/components/charts/GapToLeaderChart';
import { PaceAnalysisChart } from '@/components/charts/PaceAnalysisChart';
import { TireStrategy } from '@/components/race/TireStrategy';
import { SpeedTraceChart } from '@/components/charts/SpeedTraceChart';
import { GearMapChart } from '@/components/charts/GearMapChart';
import { CircuitComparisonChart } from '@/components/charts/CircuitComparisonChart';
import { DriverComparisonTelemetry } from '@/components/race/DriverComparisonTelemetry';
import { HeadToHeadEnriched } from '@/components/race/HeadToHeadEnriched';
import { TeamPaceBreakdown } from '@/components/race/TeamPaceBreakdown';
import { F1Card } from '@/components/race/F1Card';
import { Alert02Icon } from 'hugeicons-react';
import {
  fetchSpecificRaceResults,
  fetchAvailableSessions,
  fetchEventSessionSchedule,
  DetailedRaceResult,
  AvailableSession,
  EventSessionSchedule,
  getCircuitLength,
  calculateDistance,
  formatDistance,
} from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getTeamColorClass } from '@/lib/teamColors';
import ThrottleChart from '@/components/charts/ThrottleChart';
import BrakeChart from '@/components/charts/BrakeChart';
import RPMChart from '@/components/charts/RPMChart';
import DRSChart from '@/components/charts/DRSChart';
import PositionsTabContent from '@/components/race/PositionsTabContent';
import posthog from 'posthog-js';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GatedRoute } from '@/components/common/GatedRoute';
import { getCountryCode } from '@/utils/countryUtils';
import { APIError } from '@/lib/api-client';
import TireIcon from '@/components/race/TireIcon';

// --- Helper Functions ---

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const parseRaceLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Infinity;
  try {
    const parts = timeStr.split(/[:.]/);
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
    } else if (parts.length === 2) {
      return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 1000;
    }
  } catch (e) {
    console.error(`Error parsing lap time: ${timeStr}`, e);
  }
  return Infinity;
};
const parseLapTime = parseRaceLapTime;

const TESTING_SESSION_ALIAS_PATTERN = /^DAY([1-3])_(AM|PM)$/i;

const parseRaceTestingSessionAlias = (
  sessionType: string
): { day: number; window: 'morning' | 'afternoon' } | null => {
  const match = sessionType.match(TESTING_SESSION_ALIAS_PATTERN);
  if (!match) return null;
  return {
    day: Number(match[1]),
    window: match[2].toUpperCase() === 'AM' ? 'morning' : 'afternoon',
  };
};
const parseTestingSessionAlias = parseRaceTestingSessionAlias;

const resolveRaceSessionForAnalysis = (sessionType: string): string => {
  const parsed = parseTestingSessionAlias(sessionType);
  if (!parsed) return sessionType;
  return `FP${parsed.day}`;
};
const resolveSessionForAnalysis = resolveRaceSessionForAnalysis;

const formatRaceSessionTime = (
  timeStr: string | null | undefined,
  isWinner: boolean = false
): string => {
  if (!timeStr) return '-';
  if (isWinner) {
    try {
      const parts = timeStr.split(/[:.]/);
      if (parts.length === 3) {
        const totalMinutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        const milliseconds = parts[2];
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
      }
    } catch (e) {
      return timeStr;
    }
    return timeStr;
  }
  if (timeStr.match(/^[A-Za-z]/)) return timeStr;

  const processedTime = timeStr.startsWith('+') ? timeStr.substring(1) : timeStr;
  try {
    const parts = processedTime.split(/[:.]/);
    if (parts.length === 3) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const milliseconds = parts[2];
      const totalSeconds = minutes * 60 + seconds;
      if (totalSeconds >= 60) {
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        return `+${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds}`;
      } else {
        return `+${totalSeconds}.${milliseconds}`;
      }
    } else if (parts.length === 2) {
      const seconds = parseFloat(processedTime);
      if (seconds >= 60) {
        const displayMinutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const milliseconds = Math.round((seconds % 1) * 1000)
          .toString()
          .padStart(3, '0');
        return `+${displayMinutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds}`;
      } else {
        return `+${processedTime}`;
      }
    }
  } catch (e) {
    if (processedTime.match(/^\d/)) return `+${processedTime}`;
  }
  return timeStr;
};
const formatRaceTime = formatRaceSessionTime;

// --- Components ---

const SessionResultsTable: React.FC<{
  results: DetailedRaceResult[];
  sessionType: string;
  favoriteDriver?: string | null;
  fastestLapHolder?: DetailedRaceResult | null;
  isTestingSession?: boolean;
  isTestingSplitSession?: boolean;
  testingWindow?: 'full' | 'morning' | 'afternoon';
  eventName?: string;
}> = ({
  results,
  sessionType,
  favoriteDriver,
  fastestLapHolder,
  isTestingSession = false,
  isTestingSplitSession = false,
  testingWindow = 'full',
  eventName,
}) => {
  const isPractice = sessionType.startsWith('FP') || isTestingSession;
  const isQualifying = sessionType.startsWith('Q') || sessionType.startsWith('SQ');
  const isRaceOrSprint = sessionType === 'R' || sessionType === 'Sprint';

  const getPracticeLapTime = useCallback(
    (result: DetailedRaceResult): string | null | undefined => {
      if (!isTestingSession || isTestingSplitSession) return result.fastestLapTime;
      if (testingWindow === 'morning') return result.morningFastestLapTime ?? result.fastestLapTime;
      if (testingWindow === 'afternoon') {
        return result.afternoonFastestLapTime ?? result.fastestLapTime;
      }
      return result.fastestLapTime;
    },
    [isTestingSession, isTestingSplitSession, testingWindow]
  );

  const getPracticeLaps = useCallback(
    (result: DetailedRaceResult): number => {
      if (!isTestingSession || isTestingSplitSession) return result.lapsCompleted ?? 0;
      if (testingWindow === 'morning')
        return result.morningLapsCompleted ?? result.lapsCompleted ?? 0;
      if (testingWindow === 'afternoon') {
        return result.afternoonLapsCompleted ?? result.lapsCompleted ?? 0;
      }
      return result.lapsCompleted ?? 0;
    },
    [isTestingSession, isTestingSplitSession, testingWindow]
  );

  const sortedResults = useMemo(() => {
    if ((isPractice || isQualifying) && results) {
      return results.toSorted((a, b) => {
        const lapDelta = parseLapTime(getPracticeLapTime(a)) - parseLapTime(getPracticeLapTime(b));
        if (lapDelta !== 0) return lapDelta;
        return getPracticeLaps(b) - getPracticeLaps(a);
      });
    }
    return results;
  }, [results, isPractice, isQualifying, getPracticeLapTime, getPracticeLaps]);

  const leaderLaps = useMemo(
    () => sortedResults.reduce((max, res) => Math.max(max, getPracticeLaps(res)), 0),
    [sortedResults, getPracticeLaps]
  );

  // Calculate circuit length for distance conversion (for testing sessions)
  const circuitLength = useMemo(() => getCircuitLength(eventName), [eventName]);

  // Calculate leader distance in km
  const leaderDistance = useMemo(
    () => calculateDistance(leaderLaps, circuitLength),
    [leaderLaps, circuitLength]
  );

  const columns: {
    key:
      | keyof DetailedRaceResult
      | 'driver'
      | 'team'
      | 'displayPosition'
      | 'mileage'
      | 'reliability';
    label: string;
    className?: string;
  }[] = [
    {
      key: 'displayPosition',
      label: 'POS',
      className: 'w-[60px] text-center font-mono font-black text-zinc-400',
    },
    { key: 'driver', label: 'DRIVER' },
    { key: 'team', label: 'TEAM' },
  ];

  if (isRaceOrSprint) {
    columns.push({ key: 'time', label: 'TIME/GAP', className: 'text-right font-mono' });
    columns.push({
      key: 'driverFastestLapTime',
      label: 'FASTEST LAP',
      className: 'text-right font-mono',
    });
    columns.push({ key: 'laps', label: 'LAPS', className: 'text-center font-mono' });
    columns.push({ key: 'points', label: 'PTS', className: 'text-right font-black text-red-500' });
  } else if (isQualifying) {
    columns.push({
      key: 'fastestLapTime',
      label: 'FASTEST LAP',
      className: 'text-right font-mono',
    });
  } else if (isPractice) {
    columns.push({
      key: 'fastestLapTime',
      label: 'FASTEST LAP',
      className: 'text-right font-mono',
    });
    columns.push({ key: 'lapsCompleted', label: 'LAPS', className: 'text-center font-mono' });
    if (isTestingSession) {
      columns.push({ key: 'mileage', label: 'MILEAGE', className: 'text-right font-mono' });
      columns.push({
        key: 'reliability',
        label: 'RELIABILITY',
        className: 'text-right font-mono',
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(
                  'text-[12px] font-medium uppercase tracking-wider text-white/35 py-4',
                  col.className
                )}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedResults?.map((res, index) => {
            const isFavorite =
              favoriteDriver &&
              (res.driverCode === favoriteDriver ||
                res.fullName.toLowerCase().includes(favoriteDriver.toLowerCase()));
            return (
              <TableRow
                key={res.driverCode}
                className={cn(
                  'border-b border-white/[0.04] transition-colors group last:border-b-0',
                  isFavorite ? 'bg-red-500/[0.05] hover:bg-red-500/[0.08]' : 'hover:bg-white/[0.02]'
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${res.driverCode}-${String(col.key)}`}
                    className={cn('py-4', col.className)}
                  >
                    {col.key === 'displayPosition' ? (
                      isPractice || isQualifying ? (
                        <span className="text-[15px] font-bold text-white/40">{index + 1}</span>
                      ) : (
                        <span className="text-[15px] font-bold text-white/40">
                          {res.position ?? '-'}
                        </span>
                      )
                    ) : col.key === 'driver' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-[15px] font-semibold text-white group-hover:text-red-400 transition-colors">
                          {res.fullName}
                        </span>
                        {((fastestLapHolder && res.driverCode === fastestLapHolder.driverCode) ||
                          (!fastestLapHolder && res.isFastestLap)) && (
                          <Clock01Icon className="size-3 text-purple-500" />
                        )}
                      </div>
                    ) : col.key === 'team' ? (
                      <span className="flex items-center gap-2 text-[13px] text-white/45">
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            `bg-f1-${getTeamColorClass(res.team)}`
                          )}
                        />
                        {res.team}
                      </span>
                    ) : col.key === 'points' ? (
                      <span
                        className={cn(
                          'flex items-center justify-end gap-2 font-bold',
                          res.isProvisional ? 'text-amber-400' : 'text-red-400'
                        )}
                      >
                        {res.points !== null ? res.points : '-'}
                        {res.isProvisional && (
                          <span className="text-[10px] uppercase tracking-tighter rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-400">
                            Prov
                          </span>
                        )}
                      </span>
                    ) : col.key === 'time' ? (
                      <span className="text-white/60">
                        {(() => {
                          const isLapped = res.status.includes('Lap');
                          const isFinished =
                            res.status === 'Finished' || res.status.startsWith('+') || isLapped;

                          if (isFinished) {
                            if (res.time) return formatRaceTime(res.time, res.position === 1);
                            if (isLapped) return res.status;
                            return '-';
                          }
                          return (
                            <span className="text-red-400 font-semibold uppercase text-[10px]">
                              {res.status}
                            </span>
                          );
                        })()}
                      </span>
                    ) : col.key === 'laps' ? (
                      <span className="text-white/35">{res.laps ?? '-'}</span>
                    ) : col.key === 'fastestLapTime' && isPractice ? (
                      <span className="text-white/60">{getPracticeLapTime(res) ?? '-'}</span>
                    ) : col.key === 'lapsCompleted' && isPractice ? (
                      <span className="text-white/35">{getPracticeLaps(res) || '-'}</span>
                    ) : col.key === 'mileage' ? (
                      <span className="text-white/60">
                        {(() => {
                          const laps = getPracticeLaps(res);
                          const distance = calculateDistance(laps, circuitLength);
                          const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                          return `${formatDistance(distance)} (${pct}%)`;
                        })()}
                      </span>
                    ) : col.key === 'reliability' ? (
                      <span
                        className={cn(
                          'font-semibold',
                          (() => {
                            const laps = getPracticeLaps(res);
                            const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                            if (pct >= 90) return 'text-emerald-400';
                            if (pct >= 75) return 'text-amber-400';
                            return 'text-red-400';
                          })()
                        )}
                      >
                        {(() => {
                          const laps = getPracticeLaps(res);
                          const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                          if (pct >= 90) return 'HIGH';
                          if (pct >= 75) return 'MEDIUM';
                          return 'LOW';
                        })()}
                      </span>
                    ) : col.key === 'driverFastestLapTime' ? (
                      res.driverFastestLapTime ? (
                        <span
                          className={cn(
                            (fastestLapHolder && res.driverCode === fastestLapHolder.driverCode) ||
                              (!fastestLapHolder && res.isFastestLap)
                              ? 'text-purple-400 font-bold'
                              : 'text-white/40'
                          )}
                        >
                          {res.driverFastestLapTime}
                        </span>
                      ) : (
                        '-'
                      )
                    ) : (
                      (res[col.key as keyof DetailedRaceResult] ?? '-')
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const SectionHeader = ({
  title,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="mb-6">
    <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">{title}</h2>
  </div>
);

const NavItem = ({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold uppercase tracking-wider transition-all text-left',
      active
        ? 'bg-white/[0.06] text-white border border-white/[0.08]'
        : 'text-white/45 hover:text-white hover:bg-white/[0.03] border border-transparent'
    )}
  >
    <Icon className={cn('size-4', active ? 'text-red-400' : 'text-white/30')} />
    {label}
  </button>
);

const Race = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSession = searchParams.get('session') || '';
  const showAnalysis = searchParams.get('view') === 'analysis';
  const initialTab = searchParams.get('tab');

  const { trackEvent, trackInteraction, trackSelection } = useAnalytics();

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

  const [selectedLap, setSelectedLap] = useState<string | number>('fastest');
  const [activeSection, setActiveSection] = useState(initialTab || 'overview');
  const [lapAnalysisMode, setLapAnalysisMode] = useState<'history' | 'pace' | 'gap'>('history');
  const [testingWindow, setTestingWindow] = useState<'full' | 'morning' | 'afternoon'>('full');

  // New State for Redesign
  const [now, setNow] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
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

  const formatTimeStr = (timeStr: string | null) => {
    if (!timeStr) return '-';
    if (is24Hour) return timeStr;
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const toDate = (dateStr: string) => new Date(dateStr);

  const formatShortDate = (dateStr: string) =>
    toDate(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase();

  const formatWeekday = (dateStr: string) =>
    toDate(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour,
      });
    } catch (e) {
      return '-';
    }
  };

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
    setActiveSection(section);
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
            setIs24Hour={setIs24Hour}
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
                  setTestingWindow={setTestingWindow}
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
                  setLapAnalysisMode={setLapAnalysisMode}
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
