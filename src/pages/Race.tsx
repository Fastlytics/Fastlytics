import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SEO } from '@/components/layout/SEO';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  ArrowLeft01Icon,
  ChampionIcon,
  Flag01Icon,
  Analytics01Icon,
  Clock01Icon,
  FlashIcon,
  Calendar01Icon,
  Location01Icon,
  UserGroupIcon,
  Time01Icon,
  TradeUpIcon,
  MapsLocation01Icon,
  ChartLineData01Icon,
  GitCompareIcon,
  PlayCircle02Icon,
} from 'hugeicons-react';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

// Lazy-loaded replay component for code splitting
const SessionReplay = React.lazy(() => import('@/components/replay/SessionReplay').then(m => ({ default: m.SessionReplay })));

// --- Helper Functions ---

type TeamColorClass =
  | 'ferrari'
  | 'mercedes'
  | 'mclaren'
  | 'redbull'
  | 'astonmartin'
  | 'alpine'
  | 'williams'
  | 'haas'
  | 'alfaromeo'
  | 'alphatauri'
  | 'gray';

const getTeamColorClass = (teamName: string | undefined): TeamColorClass => {
  if (!teamName) return 'gray';
  const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (simpleName.includes('mclaren')) return 'mclaren';
  if (simpleName.includes('mercedes')) return 'mercedes';
  if (simpleName.includes('redbull')) return 'redbull';
  if (simpleName.includes('ferrari')) return 'ferrari';
  if (simpleName.includes('alpine')) return 'alpine';
  if (simpleName.includes('astonmartin')) return 'astonmartin';
  if (simpleName.includes('williams')) return 'williams';
  if (simpleName.includes('haas')) return 'haas';
  if (simpleName.includes('sauber')) return 'alfaromeo';
  if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
  return 'gray';
};

const parseLapTime = (timeStr: string | null | undefined): number => {
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

const TESTING_SESSION_ALIAS_PATTERN = /^DAY([1-3])_(AM|PM)$/i;

const parseTestingSessionAlias = (
  sessionType: string
): { day: number; window: 'morning' | 'afternoon' } | null => {
  const match = sessionType.match(TESTING_SESSION_ALIAS_PATTERN);
  if (!match) return null;
  return {
    day: Number(match[1]),
    window: match[2].toUpperCase() === 'AM' ? 'morning' : 'afternoon',
  };
};

const resolveSessionForAnalysis = (sessionType: string): string => {
  const parsed = parseTestingSessionAlias(sessionType);
  if (!parsed) return sessionType;
  return `FP${parsed.day}`;
};

const formatRaceTime = (timeStr: string | null | undefined, isWinner: boolean = false): string => {
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
    <div className="bg-black border border-gray-700 overflow-hidden">
      <Table>
        <TableHeader className="bg-black border-b border-gray-700">
          <TableRow className="border-gray-700 hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(
                  'text-gray-400 font-black uppercase tracking-wider text-xs py-4',
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
                  'border-gray-700/50 transition-colors group',
                  isFavorite
                    ? 'bg-red-600/10 hover:bg-red-600/20 border-l-2 border-l-red-600'
                    : 'hover:bg-gray-800/30'
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${res.driverCode}-${String(col.key)}`}
                    className={cn('py-3', col.className)}
                  >
                    {col.key === 'displayPosition' ? (
                      isPractice || isQualifying ? (
                        index + 1
                      ) : (
                        (res.position ?? '-')
                      )
                    ) : col.key === 'driver' ? (
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white group-hover:text-red-500 transition-colors">
                          {res.fullName}
                        </span>
                        {((fastestLapHolder && res.driverCode === fastestLapHolder.driverCode) ||
                          (!fastestLapHolder && res.isFastestLap)) && (
                          <Clock01Icon className="w-3 h-3 text-purple-500" />
                        )}
                      </div>
                    ) : col.key === 'team' ? (
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            `bg-f1-${getTeamColorClass(res.team)}`
                          )}
                        ></span>
                        {res.team}
                      </span>
                    ) : col.key === 'points' ? (
                      <span
                        className={cn(
                          'flex items-center justify-end gap-2 font-black',
                          res.isProvisional ? 'text-yellow-500' : 'text-red-500'
                        )}
                      >
                        {res.points !== null ? res.points : '-'}
                        {res.isProvisional && (
                          <span className="text-[10px] uppercase tracking-tighter bg-yellow-500/20 px-1 rounded">
                            Prov
                          </span>
                        )}
                      </span>
                    ) : col.key === 'time' ? (
                      <span className="text-gray-300">
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
                            <span className="text-red-500 font-black uppercase text-[10px]">
                              {res.status}
                            </span>
                          );
                        })()}
                      </span>
                    ) : col.key === 'laps' ? (
                      <span className="text-gray-500">{res.laps ?? '-'}</span>
                    ) : col.key === 'fastestLapTime' && isPractice ? (
                      <span className="text-gray-300">{getPracticeLapTime(res) ?? '-'}</span>
                    ) : col.key === 'lapsCompleted' && isPractice ? (
                      <span className="text-gray-500">{getPracticeLaps(res) || '-'}</span>
                    ) : col.key === 'mileage' ? (
                      <span className="text-gray-300">
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
                          'font-black',
                          (() => {
                            const laps = getPracticeLaps(res);
                            const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                            if (pct >= 90) return 'text-green-400';
                            if (pct >= 75) return 'text-yellow-400';
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
                              ? 'text-purple-400 font-black'
                              : 'text-gray-400'
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
  icon: Icon,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
    {Icon && <Icon className="w-6 h-6 text-red-600" />}
    <h2 className="text-2xl font-black uppercase tracking-wider text-white">{title}</h2>
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
      'w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-wider transition-all duration-300 border-l-2 text-left',
      active
        ? 'border-red-600 bg-red-600/10 text-white'
        : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
    )}
  >
    <Icon className={cn('w-4 h-4', active ? 'text-red-500' : 'text-gray-600')} />
    {label}
  </button>
);

const Race = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
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

  const { year, eventSlug, eventName } = useMemo(() => {
    if (!raceId) return { year: null, eventSlug: null, eventName: 'Race' };
    const parts = raceId.split('-');
    const parsedYear = parseInt(parts[0], 10);
    if (isNaN(parsedYear)) return { year: null, eventSlug: raceId, eventName: 'Invalid Race ID' };
    const slug = parts.slice(1).join('-');
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return { year: parsedYear, eventSlug: slug, eventName: name };
  }, [raceId]);

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

  useEffect(() => {
    if (!isTestingSession || isTestingSplitSession || selectedSession === 'Summary') {
      setTestingWindow('full');
    }
  }, [isTestingSession, isTestingSplitSession, selectedSession]);

  const getSessionWindowLapTime = useCallback(
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

  const getSessionWindowLaps = useCallback(
    (result: DetailedRaceResult): number => {
      if (!isTestingSession || isTestingSplitSession || selectedSession === 'Summary')
        return result.lapsCompleted ?? 0;
      if (testingWindow === 'morning')
        return result.morningLapsCompleted ?? result.lapsCompleted ?? 0;
      if (testingWindow === 'afternoon') {
        return result.afternoonLapsCompleted ?? result.lapsCompleted ?? 0;
      }
      return result.lapsCompleted ?? 0;
    },
    [isTestingSession, isTestingSplitSession, testingWindow, selectedSession]
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
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin"></div>
          <div className="text-gray-500 font-mono text-sm animate-pulse">
            LOADING SESSION DATA...
          </div>
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
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

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-6 border-b border-gray-700 pb-8">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="pl-0 text-gray-500 hover:text-white hover:bg-transparent -ml-2 mb-2"
              onClick={() => {
                if (showAnalysis && !hasRaceData) {
                  setShowAnalysis(false);
                } else {
                  navigate(-1);
                }
              }}
            >
              <ArrowLeft01Icon className="mr-2 h-4 w-4" />{' '}
              {showAnalysis && !hasRaceData ? 'Back to Schedule' : 'Back'}
            </Button>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider text-white">
              {eventName}
            </h1>
            <div className="flex items-center gap-4 text-gray-400 font-mono text-sm">
              <span className="bg-black px-2 py-1 border border-gray-700">{year} SEASON</span>
              {selectedSession && availableSessions.find((s) => s.type === selectedSession) && (
                <span className="text-red-500 font-black uppercase">
                  {availableSessions.find((s) => s.type === selectedSession)?.name}
                </span>
              )}
            </div>
          </div>

          {!shouldShowSchedule &&
            availableSessions.length > 0 &&
            (isTestingEvent ? (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[300px] bg-red-900/20 border border-red-600/50 text-white font-black uppercase tracking-widest h-14 text-lg">
                  <SelectValue placeholder="SELECT SESSION" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-gray-700 text-white">
                  <SelectItem
                    value="Summary"
                    className="uppercase font-black text-red-500 focus:bg-red-900/30 focus:text-red-400 py-3 border-b border-gray-700"
                  >
                    3-DAY TESTING SUMMARY
                  </SelectItem>
                  {availableSessions
                    .filter((s) => s.type !== 'Q' && s.type !== 'Summary')
                    .map((s) => (
                      <SelectItem
                        key={s.type}
                        value={s.type}
                        className="uppercase font-black focus:bg-gray-800 focus:text-white py-2"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[200px] bg-black border border-gray-700 text-white font-black uppercase tracking-wider h-12">
                  <SelectValue placeholder="SESSION" />
                </SelectTrigger>
                <SelectContent className="bg-black border border-gray-700 text-white">
                  {availableSessions
                    .filter((s) => s.type !== 'Q')
                    .map((s) => (
                      <SelectItem
                        key={s.type}
                        value={s.type}
                        className="uppercase font-black focus:bg-gray-800 focus:text-red-500"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ))}
        </header>

        {shouldShowSchedule ? (
          sessionSchedule ? (
            // --- UPCOMING RACE DISPLAY ---
            <div className="space-y-12">
              {/* Hero Countdown Section */}
              <div className="bg-black/30 border border-gray-700 p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Flag01Icon className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-500 font-black uppercase tracking-widest text-sm">
                        Upcoming Session
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white mb-2">
                      Countdown to {nextSession ? nextSession.name : 'Race Weekend'}
                    </h2>
                    <div className="text-gray-400 font-mono text-lg">
                      {nextSession
                        ? new Date(nextSession.date).toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Dates TBD'}
                    </div>
                  </div>

                  {countdown ? (
                    <div className="flex gap-4 md:gap-8 text-center">
                      {[
                        { label: 'DAYS', value: countdown.days },
                        { label: 'HRS', value: countdown.hours },
                        { label: 'MIN', value: countdown.minutes },
                        { label: 'SEC', value: countdown.seconds },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-tighter leading-none">
                            {item.value.toString().padStart(2, '0')}
                          </div>
                          <div className="text-xs text-gray-500 font-black uppercase tracking-widest mt-2">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-4xl md:text-6xl font-mono font-bold text-white tracking-tighter leading-none">
                      SESSION IN PROGRESS
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                  <h3 className="text-2xl font-black uppercase tracking-wider text-white">
                    Weekend Schedule
                  </h3>
                  <div className="flex items-center gap-2 bg-black p-1 border border-gray-700">
                    <button
                      onClick={() => {
                        setIs24Hour(true);
                        trackInteraction('time_format_changed', { format: '24h' });
                      }}
                      className={cn(
                        'px-3 py-1 text-xs font-black transition-colors',
                        is24Hour ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
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
                        'px-3 py-1 text-xs font-black transition-colors',
                        !is24Hour ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
                      )}
                    >
                      12H
                    </button>
                  </div>
                </div>

                <div className="grid gap-px bg-gray-800 border border-gray-700 overflow-hidden">
                  {/* Table Header */}
                  {/* Table Header Removed as per request */}

                  {/* Table Body */}
                  {sessionSchedule.sessions.map((session, idx) => {
                    const isNext = nextSession && session.name === nextSession.name;
                    // Map session name to type for available check (simplified mapping)
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
                          'grid grid-cols-1 md:grid-cols-4 p-6 gap-4 transition-colors group items-center',
                          isNext
                            ? 'bg-red-900/10 hover:bg-red-900/20'
                            : 'bg-black hover:bg-gray-800/30'
                        )}
                      >
                        {/* Date Column */}
                        <div className="flex flex-col justify-center border-r border-gray-700 pr-4">
                          <div
                            className={cn(
                              'font-mono text-xl font-black',
                              isNext ? 'text-white' : 'text-gray-300'
                            )}
                          >
                            {new Date(session.date)
                              .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                              .toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600 uppercase font-black tracking-wider">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                            })}
                          </div>
                        </div>

                        {/* Session Name */}
                        <div className="flex flex-col justify-center pl-2">
                          <div
                            className={cn(
                              'font-black text-lg uppercase tracking-tight mb-1',
                              isNext ? 'text-red-500' : 'text-white'
                            )}
                          >
                            {session.name}
                          </div>
                        </div>

                        {/* Local Time (Hidden if Results available) */}
                        <div className="hidden md:flex flex-col justify-center">
                          {!isAvailable && (
                            <>
                              <div className="font-mono text-gray-300 text-lg">
                                {formatTimeStr(session.localTime)}
                              </div>
                              <div className="text-xs text-gray-600 uppercase font-black tracking-wider">
                                Local
                              </div>
                            </>
                          )}
                        </div>

                        {/* Your Time / Results Button / LIVE Indicator */}
                        <div className="hidden md:flex flex-col justify-center items-end md:items-start">
                          {(() => {
                            // Check if session is LIVE
                            const sessionDate = new Date(session.date);
                            const now = new Date();
                            const diffMs = now.getTime() - sessionDate.getTime();
                            const diffMins = diffMs / (1000 * 60);

                            // Define durations (in minutes)
                            let duration = 60; // Default 1 hour
                            if (sessionType === 'R')
                              duration = 180; // Race: 3 hours
                            else if (sessionType === 'Sprint') duration = 60; // Sprint: 1 hour

                            const isLive = diffMins >= 0 && diffMins < duration;

                            if (isLive) {
                              return (
                                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                  <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                  </div>
                                  <span className="font-black uppercase tracking-wider text-sm">
                                    LIVE
                                  </span>
                                </div>
                              );
                            }

                            if (isAvailable) {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white uppercase font-black tracking-wider w-full md:w-auto"
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
                                >
                                  Results
                                </Button>
                              );
                            }

                            return (
                              <>
                                <div
                                  className={cn(
                                    'font-mono text-lg',
                                    isNext ? 'text-white' : 'text-gray-300'
                                  )}
                                >
                                  {formatDate(session.date)}
                                </div>
                                <div className="text-xs text-gray-600 uppercase font-black tracking-wider">
                                  Your Time
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          )
        ) : (
          // --- FINISHED RACE DISPLAY (Vertical Scroll) ---
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sticky Sidebar */}
            {selectedSession !== 'Summary' && (
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-32 space-y-1">
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

            {/* Main Content Stream */}
            <div className="flex-1 space-y-8">
              {/* 1. Overview Section (Includes Results) */}
              {activeSection === 'overview' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  <section id="overview">
                    <SectionHeader
                      title={`${availableSessions.find((s) => s.type === selectedSession)?.name || 'Race'} Overview`}
                      icon={ChampionIcon}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <SectionHeader title="Session Results" icon={UserGroupIcon} />

                    {isTestingSession &&
                      !isTestingSplitSession &&
                      selectedSession !== 'Summary' && (
                        <div className="mb-6 flex items-center gap-2 bg-black border border-gray-700 p-2 w-fit">
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
                                'px-3 py-1 text-xs font-black uppercase tracking-wider transition-colors border',
                                testingWindow === value
                                  ? 'bg-white border-white text-black'
                                  : 'bg-black border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Provisional Results Banner */}
                    {sessionResults && sessionResults.some((r) => r.isProvisional) && (
                      <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
                        <Alert02Icon className="h-4 w-4" />
                        <AlertTitle className="font-black uppercase tracking-wider">
                          Provisional Results
                        </AlertTitle>
                        <AlertDescription>
                          Official race results are still being processed. Points and positions
                          shown are provisional and subject to confirmation.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isTestingSession && selectedSession !== 'Summary' && (
                      <Alert className="mb-6 border-blue-500/50 bg-blue-500/10 text-blue-200">
                        <Alert02Icon className="h-4 w-4 text-blue-400" />
                        <AlertTitle className="font-black uppercase tracking-wider text-blue-300">
                          Testing Focus
                        </AlertTitle>
                        <AlertDescription>
                          Results are sorted by fastest lap. Mileage and reliability columns
                          highlight long-run robustness.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isTestingSession && selectedSession === 'Summary' && (
                      <Alert className="mb-6 border-blue-500/50 bg-blue-500/10 text-blue-200">
                        <Alert02Icon className="h-4 w-4 text-blue-400" />
                        <AlertTitle className="font-black uppercase tracking-wider text-blue-300">
                          3-Day Testing Summary
                        </AlertTitle>
                        <AlertDescription>
                          Aggregated data from all pre-season testing sessions. Total mileage and
                          fastest laps are combined.
                        </AlertDescription>
                      </Alert>
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
                        <TabsList className="bg-transparent p-0 h-auto rounded-none gap-2">
                          <TabsTrigger
                            value="history"
                            className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 border border-gray-700 data-[state=active]:border-white text-sm font-black uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-500"
                          >
                            Lap History
                          </TabsTrigger>
                          <TabsTrigger
                            value="pace"
                            className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 border border-gray-700 data-[state=active]:border-white text-sm font-black uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-500"
                          >
                            Pace Distribution
                          </TabsTrigger>
                          <TabsTrigger
                            value="gap"
                            className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 border border-gray-700 data-[state=active]:border-white text-sm font-black uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-500"
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
                        <div className="space-y-12">
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
                            <div className="space-y-12">
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
                              <div className="space-y-12">
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
                    <TeamPaceBreakdown
                      year={year!}
                      event={eventName}
                      session={analysisSession}
                      isProvisional={sessionResults?.some((r) => r.isProvisional)}
                    />
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


              {/* Replay Section */}
              {activeSection === 'replay' && year && eventSlug && selectedSession && (
                <GatedRoute
                  featureName="Session Replay"
                  description="Experience immersive race telemetry with real-time car positions and data overlays"
                >
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-black border border-gray-700 overflow-hidden h-[80vh] relative">
                      <React.Suspense
                        fallback={
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-gray-700 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
                              <div className="text-xs text-gray-500 font-mono">LOADING REPLAY MODULE...</div>
                            </div>
                          </div>
                        }
                      >
                        <SessionReplay
                          year={parseInt(String(year))}
                          event={eventSlug}
                          session={(() => {
                            let s = analysisSession;
                            if (isTestingSession) {
                              if (isTestingSplitSession && testingSessionAlias) {
                                s = `${analysisSession}_${testingSessionAlias.window.toUpperCase()}`;
                              } else if (testingWindow !== 'full') {
                                s = `${analysisSession}_${testingWindow.toUpperCase()}`;
                              }
                            }
                            return s;
                          })()}
                          className="h-full"
                        />
                      </React.Suspense>
                    </div>
                  </div>
                </GatedRoute>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Race };
export default Race;
