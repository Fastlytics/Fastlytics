import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
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
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileRace } from '@/components/mobile';
import TireIcon from '@/components/mobile/tireicon';
import { GatedRoute } from '@/components/common/GatedRoute';
import { getCountryCode } from '@/utils/countryUtils';

// --- Helper Functions ---

const inter = { fontFamily: "'Inter', sans-serif" } as const;

export const parseRaceLapTime = (timeStr: string | null | undefined): number => {
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

export const parseRaceTestingSessionAlias = (
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

export const resolveRaceSessionForAnalysis = (sessionType: string): string => {
  const parsed = parseTestingSessionAlias(sessionType);
  if (!parsed) return sessionType;
  return `FP${parsed.day}`;
};
const resolveSessionForAnalysis = resolveRaceSessionForAnalysis;

export const formatRaceSessionTime = (
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
      return [...results].sort((a, b) => {
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
      className: 'w-[60px] text-center font-mono font-black text-gray-400',
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
                          <Clock01Icon className="w-3 h-3 text-purple-500" />
                        )}
                      </div>
                    ) : col.key === 'team' ? (
                      <span className="flex items-center gap-2 text-[13px] text-white/45">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
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
    <Icon className={cn('h-4 w-4', active ? 'text-red-400' : 'text-white/30')} />
    {label}
  </button>
);

const Race = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
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
  const { data: availableSessions = [], isLoading: isLoadingSessions } = useQuery<
    AvailableSession[]
  >({
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

    return validResults.sort(
      (a, b) => parseLapTime(a.driverFastestLapTime) - parseLapTime(b.driverFastestLapTime)
    )[0];
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

    const fastest =
      [...effectiveSessionResults]
        .filter((result) => !!getSessionWindowLapTime(result))
        .sort(
          (a, b) =>
            parseLapTime(getSessionWindowLapTime(a)) - parseLapTime(getSessionWindowLapTime(b))
        )[0] ?? null;

    const mileage =
      [...effectiveSessionResults].sort(
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

  // Mobile version
  if (isMobile) {
    return (
      <>
        <SEO
          title={`${eventName} ${year} - F1 Race Analysis`}
          description={`Detailed analysis of the ${year} ${eventName}. View race results, tire strategy, lap times, telemetry, and track dominance.`}
          keywords={[
            'f1 race analysis',
            'race results',
            'tire strategy',
            'f1 telemetry',
            eventName,
            `${year} f1 season`,
          ]}
        />
        <MobileRace />
      </>
    );
  }

  if (isLoadingSessions) {
    return (
      <div
        style={inter}
        className="flex min-h-screen items-center justify-center bg-[#09090b] text-white"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
          <div className="text-[13px] text-white/35 animate-pulse">Loading session data...</div>
        </div>
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
        title={`${eventName} ${year} - F1 Race Analysis`}
        description={`Detailed analysis of the ${year} ${eventName}. View race results, tire strategy, lap times, telemetry, and track dominance.`}
        keywords={[
          'f1 race analysis',
          'race results',
          'tire strategy',
          'f1 telemetry',
          eventName,
          `${year} f1 season`,
        ]}
      />
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                    </span>
                    Season {year}
                  </span>
                </div>
                <h1 className="text-3xl font-bold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
                  {eventName}
                </h1>
                {selectedSession && availableSessions.find((s) => s.type === selectedSession) && (
                  <p className="mt-1 text-[15px] text-white/50">
                    {availableSessions.find((s) => s.type === selectedSession)?.name}
                  </p>
                )}
              </div>

              {!shouldShowSchedule &&
                availableSessions.length > 0 &&
                (isTestingEvent ? (
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger className="w-auto min-w-[240px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-white/[0.1] hover:text-white">
                      <SelectValue placeholder="Select Session" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                      <SelectItem
                        value="Summary"
                        className="text-[13px] font-semibold text-red-400 focus:bg-white/[0.06] focus:text-red-300"
                      >
                        3-Day Testing Summary
                      </SelectItem>
                      {availableSessions
                        .filter((s) => s.type !== 'Q' && s.type !== 'Summary')
                        .map((s) => (
                          <SelectItem
                            key={s.type}
                            value={s.type}
                            className="text-[13px] font-medium text-white/70 focus:bg-white/[0.06] focus:text-white"
                          >
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger className="w-auto min-w-[180px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-white/[0.1] hover:text-white">
                      <SelectValue placeholder="Session" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                      {availableSessions
                        .filter((s) => s.type !== 'Q')
                        .map((s) => (
                          <SelectItem
                            key={s.type}
                            value={s.type}
                            className="text-[13px] font-medium text-white/70 focus:bg-white/[0.06] focus:text-white"
                          >
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ))}
            </div>
          </motion.div>
          <div className="mt-8 h-px w-full bg-white/[0.05]" />
        </div>

        {shouldShowSchedule ? (
          sessionSchedule ? (
            <div className="space-y-10">
              {/* Hero Countdown */}
              <EventHeroCard
                eyebrow="Upcoming Session"
                title={sessionSchedule.eventName}
                displayDate={scheduleHeroDate}
                location={sessionSchedule.location}
                countryCode={scheduleHeroCountryCode}
                countryAlt={sessionSchedule.country || sessionSchedule.location}
                isSprint={sessionSchedule.eventFormat?.toLowerCase().includes('sprint')}
                nextSession={
                  nextSession ? { name: nextSession.name, date: new Date(nextSession.date) } : null
                }
                countdownFallbackLabel={countdown ? undefined : 'Session in Progress'}
              />

              {/* Schedule */}
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
                    Weekend Schedule
                  </h3>
                  <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
                    <button
                      onClick={() => {
                        setIs24Hour(true);
                        trackInteraction('time_format_changed', { format: '24h' });
                      }}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors',
                        is24Hour
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/35 hover:text-white/60'
                      )}
                    >
                      24H
                    </button>
                    <button
                      onClick={() => {
                        setIs24Hour(false);
                        trackInteraction('time_format_changed', { format: '12h' });
                      }}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors',
                        !is24Hour
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/35 hover:text-white/60'
                      )}
                    >
                      12H
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                  <div className="divide-y divide-white/[0.04]">
                    {sessionSchedule.sessions.map((session, idx) => {
                      const isNext = nextSession && session.name === nextSession.name;
                      let sessionType = '';
                      const lowerName = session.name.toLowerCase();
                      if (lowerName.includes('practice 1')) sessionType = 'FP1';
                      else if (lowerName.includes('practice 2')) sessionType = 'FP2';
                      else if (lowerName.includes('practice 3')) sessionType = 'FP3';
                      else if (
                        lowerName.includes('sprint qualifying') ||
                        lowerName.includes('sprint shootout')
                      )
                        sessionType = 'SQ';
                      else if (lowerName.includes('sprint') && !lowerName.includes('qualifying'))
                        sessionType = 'Sprint';
                      else if (lowerName.includes('qualifying') && !lowerName.includes('sprint'))
                        sessionType = 'Q';
                      else if (lowerName === 'race') sessionType = 'R';

                      const isAvailable = availableSessions.some((s) => {
                        if (sessionType === 'Q')
                          return (
                            s.type === 'Q' || s.type === 'Q1' || s.type === 'Q2' || s.type === 'Q3'
                          );
                        if (sessionType === 'SQ')
                          return (
                            s.type === 'SQ' ||
                            s.type === 'SQ1' ||
                            s.type === 'SQ2' ||
                            s.type === 'SQ3'
                          );
                        return s.type === sessionType;
                      });

                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-center gap-4 px-5 py-4 transition-colors',
                            isNext ? 'bg-red-500/[0.04]' : 'hover:bg-white/[0.02]'
                          )}
                        >
                          <div className="w-16 shrink-0 text-center">
                            <div
                              className={cn(
                                'text-[15px] font-bold tabular-nums',
                                isNext ? 'text-white' : 'text-white/60'
                              )}
                            >
                              {new Date(session.date)
                                .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                                .toUpperCase()}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-white/25">
                              {new Date(session.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                              })}
                            </div>
                          </div>
                          <div
                            className={cn(
                              'h-8 w-0.5 rounded-full',
                              isNext ? 'bg-red-400' : 'bg-white/[0.06]'
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                'text-[14px] font-semibold',
                                isNext ? 'text-red-400' : 'text-white'
                              )}
                            >
                              {session.name}
                            </div>
                          </div>
                          <div className="hidden shrink-0 text-right md:block">
                            {!isAvailable && (
                              <>
                                <div
                                  className={cn(
                                    'text-[14px] tabular-nums',
                                    isNext ? 'text-white' : 'text-white/50'
                                  )}
                                >
                                  {formatTimeStr(session.localTime)}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-white/25">
                                  Local
                                </div>
                              </>
                            )}
                          </div>
                          <div className="hidden shrink-0 md:block">
                            {(() => {
                              const sessionDate = new Date(session.date);
                              const diffMins =
                                (new Date().getTime() - sessionDate.getTime()) / (1000 * 60);
                              let duration = 60;
                              if (sessionType === 'R') duration = 180;
                              else if (sessionType === 'Sprint') duration = 60;
                              const isLive = diffMins >= 0 && diffMins < duration;

                              if (isLive) {
                                return (
                                  <div className="flex items-center gap-1.5 text-emerald-400">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    </span>
                                    <span className="text-[11px] font-semibold uppercase">
                                      Live
                                    </span>
                                  </div>
                                );
                              }
                              if (isAvailable) {
                                return (
                                  <button
                                    onClick={() => {
                                      let targetSession = sessionType;
                                      if (
                                        sessionType === 'Q' &&
                                        !availableSessions.some((s) => s.type === 'Q')
                                      ) {
                                        if (availableSessions.some((s) => s.type === 'Q3'))
                                          targetSession = 'Q3';
                                        else if (availableSessions.some((s) => s.type === 'Q2'))
                                          targetSession = 'Q2';
                                        else if (availableSessions.some((s) => s.type === 'Q1'))
                                          targetSession = 'Q1';
                                      }
                                      if (
                                        sessionType === 'SQ' &&
                                        !availableSessions.some((s) => s.type === 'SQ')
                                      ) {
                                        if (availableSessions.some((s) => s.type === 'SQ3'))
                                          targetSession = 'SQ3';
                                        else if (availableSessions.some((s) => s.type === 'SQ2'))
                                          targetSession = 'SQ2';
                                        else if (availableSessions.some((s) => s.type === 'SQ1'))
                                          targetSession = 'SQ1';
                                      }
                                      setSelectedSession(targetSession);
                                      setShowAnalysis(true);
                                      trackInteraction('results_button_clicked', {
                                        sessionKey: targetSession,
                                      });
                                    }}
                                    className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase text-red-400 transition-colors hover:bg-red-500/[0.12]"
                                  >
                                    Results
                                  </button>
                                );
                              }
                              return (
                                <div className="text-right">
                                  <div
                                    className={cn(
                                      'text-[14px] tabular-nums',
                                      isNext ? 'text-white' : 'text-white/50'
                                    )}
                                  >
                                    {formatDate(session.date)}
                                  </div>
                                  <div className="text-[10px] uppercase tracking-wider text-white/25">
                                    Your Time
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
            </div>
          )
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar */}
            {selectedSession !== 'Summary' && (
              <aside className="hidden w-56 shrink-0 lg:block">
                <div className="sticky top-24 space-y-1.5">
                  <NavItem
                    id="overview"
                    label="Overview"
                    icon={ChampionIcon}
                    active={activeSection === 'overview'}
                    onClick={() => handleSectionChange('overview')}
                  />

                  {selectedSession !== 'Summary' && (
                    <>
                      <NavItem
                        id="replay"
                        label="Replay"
                        icon={PlayCircle02Icon}
                        active={activeSection === 'replay'}
                        onClick={() => handleSectionChange('replay')}
                      />
                      {(selectedSession === 'R' ||
                        selectedSession === 'Sprint' ||
                        isTestingSession) && (
                        <NavItem
                          id="strategy"
                          label="Strategy"
                          icon={TireIcon}
                          active={activeSection === 'strategy'}
                          onClick={() => handleSectionChange('strategy')}
                        />
                      )}
                      {(selectedSession === 'R' || selectedSession === 'Sprint') && (
                        <NavItem
                          id="positions"
                          label="Positions"
                          icon={ChartLineData01Icon}
                          active={activeSection === 'positions'}
                          onClick={() => handleSectionChange('positions')}
                        />
                      )}
                      <NavItem
                        id="laptimes"
                        label="Lap Times"
                        icon={Time01Icon}
                        active={activeSection === 'laptimes'}
                        onClick={() => handleSectionChange('laptimes')}
                      />
                      <NavItem
                        id="dominance"
                        label="Head to Head"
                        icon={GitCompareIcon}
                        active={activeSection === 'dominance'}
                        onClick={() => handleSectionChange('dominance')}
                      />
                      <NavItem
                        id="teampace"
                        label="Team Pace"
                        icon={UserGroupIcon}
                        active={activeSection === 'teampace'}
                        onClick={() => handleSectionChange('teampace')}
                      />
                      <NavItem
                        id="telemetry"
                        label="Telemetry"
                        icon={Analytics01Icon}
                        active={activeSection === 'telemetry'}
                        onClick={() => handleSectionChange('telemetry')}
                      />
                    </>
                  )}
                </div>
              </aside>
            )}

            {/* Main Content */}
            <div className="min-w-0 flex-1 space-y-8">
              {/* Overview */}
              {activeSection === 'overview' && (
                <div className="space-y-10">
                  <section id="overview">
                    <SectionHeader
                      title={`${availableSessions.find((s) => s.type === selectedSession)?.name || 'Race'} Overview`}
                    />
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      {selectedSession === 'R' || selectedSession === 'Sprint' ? (
                        <>
                          {raceWinner && (
                            <F1Card
                              title="WINNER"
                              value={raceWinner.fullName}
                              subValue={formatRaceTime(raceWinner.time, true)}
                              team={getTeamColorClass(raceWinner.team)}
                              icon={<ChampionIcon />}
                              imageUrl={getDriverImage(raceWinner.driverCode, year!)}
                            />
                          )}
                          {poleSitter && (
                            <F1Card
                              title="POLE POSITION"
                              value={poleSitter.fullName}
                              subValue={poleSitter.poleLapTimeValue}
                              team={getTeamColorClass(poleSitter.team)}
                              icon={<FlashIcon />}
                              imageUrl={getDriverImage(poleSitter.driverCode, year!)}
                            />
                          )}
                          {fastestLapHolder && (
                            <F1Card
                              title="FASTEST LAP"
                              value={fastestLapHolder.fullName}
                              subValue={fastestLapHolder.driverFastestLapTime}
                              team={getTeamColorClass(fastestLapHolder.team)}
                              icon={<Clock01Icon />}
                              imageUrl={getDriverImage(fastestLapHolder.driverCode, year!)}
                            />
                          )}
                        </>
                      ) : isTestingSession ? (
                        <>
                          {testingInsights.fastest && (
                            <F1Card
                              title="FASTEST LAP"
                              value={testingInsights.fastest.fullName}
                              subValue={getSessionWindowLapTime(testingInsights.fastest) ?? '-'}
                              team={getTeamColorClass(testingInsights.fastest.team)}
                              icon={<Clock01Icon />}
                              imageUrl={getDriverImage(testingInsights.fastest.driverCode, year!)}
                            />
                          )}
                          {testingInsights.mileage && (
                            <F1Card
                              title="MILEAGE LEADER"
                              value={testingInsights.mileage.fullName}
                              subValue={`${formatDistance(calculateDistance(getSessionWindowLaps(testingInsights.mileage), testingInsights.circuitLength))}`}
                              team={getTeamColorClass(testingInsights.mileage.team)}
                              icon={<TradeUpIcon />}
                              imageUrl={getDriverImage(testingInsights.mileage.driverCode, year!)}
                            />
                          )}
                          <F1Card
                            title="SESSION WORKLOAD"
                            value={`${formatDistance(testingInsights.totalDistance)}`}
                            subValue={`Avg ${testingInsights.averageLaps.toFixed(1)} laps/driver`}
                            team="gray"
                            icon={<Calendar01Icon />}
                          />
                        </>
                      ) : (
                        topPerformers.map((p, i) => (
                          <F1Card
                            key={i}
                            title={`P${i + 1}`}
                            value={p.fullName}
                            subValue={p.fastestLapTimeValue ?? p.fastestLapTime ?? ''}
                            team={getTeamColorClass(p.team)}
                            icon={i === 0 ? <ChampionIcon /> : <TradeUpIcon />}
                            imageUrl={getDriverImage(p.driverCode, year!)}
                          />
                        ))
                      )}
                    </div>
                  </section>

                  <section id="results">
                    <SectionHeader title="Session Results" />

                    {isTestingSession &&
                      !isTestingSplitSession &&
                      selectedSession !== 'Summary' && (
                        <div className="mb-5 flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 w-fit">
                          {(
                            [
                              ['full', 'Full Day'],
                              ['morning', 'Morning'],
                              ['afternoon', 'Afternoon'],
                            ] as const
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() => {
                                setTestingWindow(value);
                                trackInteraction('testing_window_toggled', { window: value });
                              }}
                              className={cn(
                                'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                                testingWindow === value
                                  ? 'bg-white/[0.08] text-white'
                                  : 'text-white/35 hover:text-white/60'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Provisional Results Banner */}
                    {sessionResults && sessionResults.some((r) => r.isProvisional) && (
                      <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-5 py-4">
                        <Alert02Icon className="h-4 w-4 shrink-0 text-amber-400" />
                        <div>
                          <div className="text-[12px] font-semibold uppercase tracking-wider text-amber-400">
                            Provisional Results
                          </div>
                          <div className="text-[13px] text-amber-400/60">
                            Official results are still being processed. Positions shown are
                            provisional.
                          </div>
                        </div>
                      </div>
                    )}

                    {isTestingSession && selectedSession !== 'Summary' && (
                      <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-5 py-4">
                        <Alert02Icon className="h-4 w-4 shrink-0 text-blue-400" />
                        <div>
                          <div className="text-[12px] font-semibold uppercase tracking-wider text-blue-400">
                            Testing Focus
                          </div>
                          <div className="text-[13px] text-blue-400/60">
                            Sorted by fastest lap. Mileage and reliability columns highlight
                            long-run robustness.
                          </div>
                        </div>
                      </div>
                    )}

                    {isTestingSession && selectedSession === 'Summary' && (
                      <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-5 py-4">
                        <Alert02Icon className="h-4 w-4 shrink-0 text-blue-400" />
                        <div>
                          <div className="text-[12px] font-semibold uppercase tracking-wider text-blue-400">
                            3-Day Testing Summary
                          </div>
                          <div className="text-[13px] text-blue-400/60">
                            Aggregated data from all pre-season testing sessions.
                          </div>
                        </div>
                      </div>
                    )}

                    {effectiveSessionResults && (
                      <SessionResultsTable
                        results={effectiveSessionResults}
                        sessionType={selectedSession}
                        favoriteDriver={profile?.favorite_driver}
                        fastestLapHolder={fastestLapHolder}
                        isTestingSession={isTestingSession}
                        isTestingSplitSession={isTestingSplitSession}
                        testingWindow={testingWindow}
                        eventName={eventName}
                      />
                    )}
                  </section>
                </div>
              )}

              {/* 3. Strategy Section */}
              {activeSection === 'strategy' &&
                (selectedSession === 'R' || selectedSession === 'Sprint' || isTestingSession) && (
                  <GatedRoute
                    featureName="Tire Strategy"
                    description="Advanced tire strategy analysis including pit stop patterns and compound selection strategies"
                  >
                    <section id="strategy" className="animate-in fade-in duration-500 space-y-8">
                      <TireStrategy
                        year={year!}
                        event={eventName}
                        session={analysisSession}
                        favoriteDriver={profile?.favorite_driver}
                      />
                    </section>
                  </GatedRoute>
                )}

              {/* 3.5 Positions Section (Race Only) */}
              {activeSection === 'positions' &&
                (selectedSession === 'R' || selectedSession === 'Sprint') && (
                  <GatedRoute
                    featureName="Position Tracking"
                    description="Real-time position changes and overtaking opportunities throughout the race"
                  >
                    <section id="positions" className="animate-in fade-in duration-500">
                      <PositionsTabContent
                        year={year!}
                        event={eventName}
                        session={analysisSession}
                        favoriteDriver={profile?.favorite_driver}
                      />
                    </section>
                  </GatedRoute>
                )}

              {/* 4. Lap Times Section */}
              {activeSection === 'laptimes' && (
                <GatedRoute
                  featureName="Lap Times Analysis"
                  description="Detailed lap-by-lap timing data with pace distribution analysis and comparison charts"
                >
                  <section id="laptimes" className="animate-in fade-in duration-500">
                    <Tabs
                      defaultValue="history"
                      value={lapAnalysisMode}
                      onValueChange={(v) => {
                        setLapAnalysisMode(v as 'history' | 'pace' | 'gap');
                        trackInteraction('desktop_analysis_tab_changed', { tab: v });
                      }}
                      className="w-full"
                    >
                      <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-6 gap-4">
                        <TabsList className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 h-auto gap-1">
                          <TabsTrigger
                            value="history"
                            className="rounded-md data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/40 text-[12px] font-semibold uppercase tracking-wider py-1.5 px-4 transition-all hover:text-white/60"
                          >
                            Lap History
                          </TabsTrigger>
                          <TabsTrigger
                            value="pace"
                            className="rounded-md data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/40 text-[12px] font-semibold uppercase tracking-wider py-1.5 px-4 transition-all hover:text-white/60"
                          >
                            Pace Distribution
                          </TabsTrigger>
                          <TabsTrigger
                            value="gap"
                            className="rounded-md data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-white/40 text-[12px] font-semibold uppercase tracking-wider py-1.5 px-4 transition-all hover:text-white/60"
                          >
                            Gap to Leader
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent
                        value="history"
                        className="mt-0 animate-in fade-in zoom-in-95 duration-300"
                      >
                        {(() => {
                          const favDriverCode = profile?.favorite_driver;
                          let rivalDriverCode = null;

                          if (favDriverCode && sessionResults) {
                            const favResult = sessionResults.find(
                              (r) =>
                                r.driverCode === favDriverCode ||
                                r.fullName.toLowerCase().includes(favDriverCode.toLowerCase())
                            );
                            if (favResult && favResult.position) {
                              const rivalPos =
                                favResult.position === 1 ? 2 : favResult.position - 1;
                              const rivalResult = sessionResults.find(
                                (r) => r.position === rivalPos
                              );
                              if (rivalResult) rivalDriverCode = rivalResult.driverCode;
                            }
                          }

                          return (
                            <RacingChart
                              year={year!}
                              event={eventName}
                              session={analysisSession}
                              title="Lap Time Comparison"
                              autoLoad={true}
                              favoriteDriver={favDriverCode}
                              rivalDriver={rivalDriverCode}
                            />
                          );
                        })()}
                      </TabsContent>

                      <TabsContent
                        value="pace"
                        className="mt-0 animate-in fade-in zoom-in-95 duration-300"
                      >
                        {(() => {
                          const favDriverCode = profile?.favorite_driver;
                          let rivalDriverCode = null;

                          if (favDriverCode && sessionResults) {
                            const favResult = sessionResults.find(
                              (r) =>
                                r.driverCode === favDriverCode ||
                                r.fullName.toLowerCase().includes(favDriverCode.toLowerCase())
                            );
                            if (favResult && favResult.position) {
                              const rivalPos =
                                favResult.position === 1 ? 2 : favResult.position - 1;
                              const rivalResult = sessionResults.find(
                                (r) => r.position === rivalPos
                              );
                              if (rivalResult) rivalDriverCode = rivalResult.driverCode;
                            }
                          }
                          return (
                            <PaceAnalysisChart
                              year={year!}
                              event={eventName}
                              session={analysisSession}
                              initialDrivers={
                                favDriverCode
                                  ? ([favDriverCode, rivalDriverCode].filter(Boolean) as string[])
                                  : []
                              }
                            />
                          );
                        })()}
                      </TabsContent>

                      <TabsContent
                        value="gap"
                        className="mt-0 animate-in fade-in zoom-in-95 duration-300"
                      >
                        {(() => {
                          const favDriverCode = profile?.favorite_driver;
                          let rivalDriverCode = null;

                          if (favDriverCode && sessionResults) {
                            const favResult = sessionResults.find(
                              (r) =>
                                r.driverCode === favDriverCode ||
                                r.fullName.toLowerCase().includes(favDriverCode.toLowerCase())
                            );
                            if (favResult && favResult.position) {
                              const rivalPos =
                                favResult.position === 1 ? 2 : favResult.position - 1;
                              const rivalResult = sessionResults.find(
                                (r) => r.position === rivalPos
                              );
                              if (rivalResult) rivalDriverCode = rivalResult.driverCode;
                            }
                          }

                          return (
                            <GapToLeaderChart
                              year={year!}
                              event={eventName}
                              session={analysisSession}
                              autoLoad={true}
                              favoriteDriver={favDriverCode}
                              rivalDriver={rivalDriverCode}
                            />
                          );
                        })()}
                      </TabsContent>
                    </Tabs>
                  </section>
                </GatedRoute>
              )}

              {/* 5. Dominance Section */}
              {activeSection === 'dominance' && (
                <GatedRoute
                  featureName="Head to Head Analysis"
                  description="Driver comparison and dominance analysis with detailed telemetry overlays including speed, throttle, brake, and DRS patterns"
                >
                  <section id="dominance" className="animate-in fade-in duration-500">
                    {(() => {
                      const favDriverCode = profile?.favorite_driver;
                      let rivalDriverCode = null;

                      if (favDriverCode && sessionResults) {
                        const favResult = sessionResults.find(
                          (r) =>
                            r.driverCode === favDriverCode ||
                            r.fullName.toLowerCase().includes(favDriverCode.toLowerCase())
                        );
                        if (favResult && favResult.position) {
                          // Rival is the driver ahead (pos - 1), or behind (pos + 1) if P1
                          const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
                          const rivalResult = sessionResults.find((r) => r.position === rivalPos);
                          if (rivalResult) rivalDriverCode = rivalResult.driverCode;
                        }
                      }

                      return (
                        <div className="space-y-6">
                          <CircuitComparisonChart
                            year={year!}
                            event={eventName}
                            session={analysisSession}
                            initialDriver1={favDriverCode}
                            initialDriver2={rivalDriverCode || undefined}
                            onDriversSelected={handleCircuitDriversSelected}
                          />

                          {/* Comparison Charts if selected */}
                          {circuitDrivers.shouldLoadChart && (
                            <div className="space-y-6">
                              {/* Race Performance Summary */}
                              <HeadToHeadEnriched
                                year={year!}
                                event={eventName}
                                session={analysisSession}
                                driver1={circuitDrivers.driver1}
                                driver2={circuitDrivers.driver2}
                              />

                              {/* Speed Trace - Full Width */}
                              <DriverComparisonTelemetry
                                year={year!}
                                event={eventName}
                                session={analysisSession}
                                driver1={circuitDrivers.driver1}
                                driver2={circuitDrivers.driver2}
                                lap1={circuitDrivers.lap1}
                                lap2={circuitDrivers.lap2}
                                shouldLoadChart={true}
                                telemetryType="speed"
                                title="Speed Trace"
                              />

                              {/* Other Telemetry - Stacked */}
                              <div className="space-y-6">
                                <DriverComparisonTelemetry
                                  year={year!}
                                  event={eventName}
                                  session={analysisSession}
                                  driver1={circuitDrivers.driver1}
                                  driver2={circuitDrivers.driver2}
                                  lap1={circuitDrivers.lap1}
                                  lap2={circuitDrivers.lap2}
                                  shouldLoadChart={true}
                                  telemetryType="gap"
                                  title="Gap"
                                />
                                <DriverComparisonTelemetry
                                  year={year!}
                                  event={eventName}
                                  session={analysisSession}
                                  driver1={circuitDrivers.driver1}
                                  driver2={circuitDrivers.driver2}
                                  lap1={circuitDrivers.lap1}
                                  lap2={circuitDrivers.lap2}
                                  shouldLoadChart={true}
                                  telemetryType="throttle"
                                  title="Throttle"
                                />
                                <DriverComparisonTelemetry
                                  year={year!}
                                  event={eventName}
                                  session={analysisSession}
                                  driver1={circuitDrivers.driver1}
                                  driver2={circuitDrivers.driver2}
                                  lap1={circuitDrivers.lap1}
                                  lap2={circuitDrivers.lap2}
                                  shouldLoadChart={true}
                                  telemetryType="brake"
                                  title="Brake"
                                />
                                <DriverComparisonTelemetry
                                  year={year!}
                                  event={eventName}
                                  session={analysisSession}
                                  driver1={circuitDrivers.driver1}
                                  driver2={circuitDrivers.driver2}
                                  lap1={circuitDrivers.lap1}
                                  lap2={circuitDrivers.lap2}
                                  shouldLoadChart={true}
                                  telemetryType="rpm"
                                  title="RPM"
                                />
                                <DriverComparisonTelemetry
                                  year={year!}
                                  event={eventName}
                                  session={analysisSession}
                                  driver1={circuitDrivers.driver1}
                                  driver2={circuitDrivers.driver2}
                                  lap1={circuitDrivers.lap1}
                                  lap2={circuitDrivers.lap2}
                                  shouldLoadChart={true}
                                  telemetryType="drs"
                                  title="DRS"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </section>
                </GatedRoute>
              )}

              {/* 6. Team Pace Section */}
              {activeSection === 'teampace' && (
                <GatedRoute
                  featureName="Team Pace Analysis"
                  description="Team-level pace breakdown by tyre compound and sector, with individual driver analysis"
                >
                  <section id="teampace" className="animate-in fade-in duration-500">
                    <TeamPaceBreakdown year={year!} event={eventName} session={analysisSession} />
                  </section>
                </GatedRoute>
              )}

              {/* 7. Telemetry Section */}
              {activeSection === 'telemetry' && (
                <GatedRoute
                  featureName="Advanced Telemetry"
                  description="Complete telemetry analysis with speed traces, throttle/brake patterns, RPM curves, gear selection, and DRS deployment strategies"
                >
                  <section id="telemetry" className="animate-in fade-in duration-500">
                    {(() => {
                      const defaultDriver =
                        profile?.favorite_driver ||
                        (sessionResults && sessionResults.length > 0
                          ? sessionResults[0].driverCode
                          : undefined);

                      return (
                        <div className="flex flex-col space-y-12">
                          <SpeedTraceChart
                            year={year!}
                            event={eventName}
                            session={analysisSession}
                            lap={selectedLap}
                            initialDriver={defaultDriver}
                          />
                          <ThrottleChart
                            year={year!}
                            event={eventName}
                            session={analysisSession}
                            lap={selectedLap}
                            initialDriver={defaultDriver}
                          />
                          <BrakeChart
                            year={year!}
                            event={eventName}
                            session={analysisSession}
                            lap={selectedLap}
                            initialDriver={defaultDriver}
                          />
                          <RPMChart
                            year={year!}
                            event={eventName}
                            session={analysisSession}
                            lap={selectedLap}
                            initialDriver={defaultDriver}
                          />
                          <GearMapChart
                            year={year!}
                            event={eventName}
                            session={analysisSession}
                            lap={selectedLap}
                            initialDriver={defaultDriver}
                          />
                          <DRSChart
                            year={year!}
                            event={eventName}
                            session={analysisSession}
                            lap={selectedLap}
                            initialDriver={defaultDriver}
                          />
                        </div>
                      );
                    })()}
                  </section>
                </GatedRoute>
              )}

              {/* 7. Replay Section */}
              {activeSection === 'replay' && year && eventSlug && selectedSession && (
                <GatedRoute
                  featureName="Session Replay"
                  description="Experience immersive race telemetry with real-time car positions and data overlays"
                >
                  <div className="space-y-6">
                    <div className="relative h-[80vh] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                      <React.Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
                              <div className="text-[11px] text-white/30">Loading replay...</div>
                            </div>
                          </div>
                        }
                      >
                        {(() => {
                          let replaySessionTarget = analysisSession;
                          if (isTestingSession) {
                            if (isTestingSplitSession && testingSessionAlias) {
                              replaySessionTarget = `${analysisSession}_${testingSessionAlias.window.toUpperCase()}`;
                            } else if (effectiveTestingWindow !== 'full') {
                              replaySessionTarget = `${analysisSession}_${effectiveTestingWindow.toUpperCase()}`;
                            }
                          }

                          return (
                            <SessionReplay
                              year={year}
                              event={eventSlug}
                              session={replaySessionTarget}
                              className="h-full"
                            />
                          );
                        })()}
                      </React.Suspense>
                    </div>
                  </div>
                </GatedRoute>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export { Race };
export default Race;
