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
  year?: number | null;
}> = ({
  results,
  sessionType,
  favoriteDriver,
  fastestLapHolder,
  isTestingSession = false,
  isTestingSplitSession = false,
  testingWindow = 'full',
  eventName,
  year,
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

  const circuitLength = useMemo(() => getCircuitLength(eventName), [eventName]);

  // Compute gap to leader for practice/qualifying
  const leaderTime = useMemo(() => {
    if (!sortedResults?.length) return Infinity;
    return parseLapTime(getPracticeLapTime(sortedResults[0]));
  }, [sortedResults, getPracticeLapTime]);

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-800 hover:bg-transparent bg-neutral-900/50">
            <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 w-[52px] text-center">
              Pos
            </TableHead>
            <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3">
              Driver
            </TableHead>
            {isRaceOrSprint && (
              <>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right">
                  Time / Gap
                </TableHead>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right">
                  Fastest Lap
                </TableHead>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-center">
                  Grid
                </TableHead>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-center">
                  Laps
                </TableHead>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-center">
                  Pts
                </TableHead>
              </>
            )}
            {isQualifying && (
              <>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right">
                  Best Lap
                </TableHead>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right">
                  Gap
                </TableHead>
                {results?.[0]?.q1Time !== undefined && (
                  <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right hidden lg:table-cell">
                    Q1
                  </TableHead>
                )}
                {results?.[0]?.q2Time !== undefined && (
                  <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right hidden lg:table-cell">
                    Q2
                  </TableHead>
                )}
                {results?.[0]?.q3Time !== undefined && (
                  <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right hidden lg:table-cell">
                    Q3
                  </TableHead>
                )}
              </>
            )}
            {isPractice && (
              <>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right">
                  Best Lap
                </TableHead>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right">
                  Gap
                </TableHead>
                <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-center">
                  Laps
                </TableHead>
                {isTestingSession && (
                  <>
                    <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right hidden lg:table-cell">
                      Mileage
                    </TableHead>
                    <TableHead className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] py-3 text-right hidden lg:table-cell">
                      Reliability
                    </TableHead>
                  </>
                )}
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedResults?.map((res, index) => {
            const isFavorite =
              favoriteDriver &&
              (res.driverCode === favoriteDriver ||
                res.fullName.toLowerCase().includes(favoriteDriver.toLowerCase()));
            const displayPos = isPractice || isQualifying ? index + 1 : (res.position ?? '-');
            const teamColor = getTeamColorClass(res.team);
            const imageUrl = year ? getDriverImage(res.driverCode, year) : '';

            // Position change for race (grid → finish)
            const posChange = isRaceOrSprint && res.gridPosition && res.position
              ? res.gridPosition - res.position
              : null;

            const hasFastestLap = (fastestLapHolder && res.driverCode === fastestLapHolder.driverCode) ||
              (!fastestLapHolder && res.isFastestLap);

            // Gap to leader for practice/qualifying
            const currentTime = parseLapTime(getPracticeLapTime(res));
            const gapToLeader = (isPractice || isQualifying) && index > 0 && currentTime !== Infinity && leaderTime !== Infinity
              ? `+${(currentTime - leaderTime).toFixed(3)}`
              : null;

            return (
              <TableRow
                key={res.driverCode}
                className={cn(
                  'border-neutral-800/50 transition-colors group',
                  isFavorite
                    ? 'bg-red-500/[0.06] hover:bg-red-500/10'
                    : 'hover:bg-neutral-900/80'
                )}
              >
                {/* Position */}
                <TableCell className="py-2.5 text-center w-[52px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn(
                      'font-mono font-bold text-sm',
                      displayPos === 1 ? 'text-amber-400' :
                      displayPos === 2 ? 'text-neutral-300' :
                      displayPos === 3 ? 'text-amber-600' :
                      'text-neutral-400'
                    )}>
                      {displayPos}
                    </span>
                    {posChange !== null && posChange !== 0 && (
                      <span className={cn(
                        'text-[10px] font-mono font-semibold',
                        posChange > 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {posChange > 0 ? `▲${posChange}` : `▼${Math.abs(posChange)}`}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Driver with headshot and team */}
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-3">
                    {/* Team color bar */}
                    <div className={cn('w-0.5 h-10 rounded-full shrink-0', `bg-f1-${teamColor}`)} />

                    {/* Headshot */}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={res.fullName}
                        className="w-8 h-8 rounded-full object-cover object-top bg-neutral-900 border border-neutral-800 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-neutral-500">{res.driverCode}</span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">
                          {res.fullName}
                        </span>
                        {hasFastestLap && (
                          <span className="shrink-0 w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center" title="Fastest Lap">
                            <Clock01Icon className="w-2.5 h-2.5 text-purple-400" />
                          </span>
                        )}
                        {isFavorite && (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold uppercase tracking-wider">
                            Fav
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-neutral-400 truncate">
                          {res.team}
                        </span>
                        <span className="text-neutral-600 text-[10px] font-mono">{res.driverCode}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Race/Sprint columns */}
                {isRaceOrSprint && (
                  <>
                    <TableCell className="py-2.5 text-right">
                      <span className="font-mono text-sm text-white">
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
                            <span className="text-red-400 font-semibold uppercase text-[10px] tracking-wider">
                              {res.status}
                            </span>
                          );
                        })()}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      {res.driverFastestLapTime ? (
                        <span className={cn(
                          'font-mono text-sm',
                          hasFastestLap ? 'text-purple-400 font-semibold' : 'text-neutral-300'
                        )}>
                          {res.driverFastestLapTime}
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className="font-mono text-sm text-neutral-400">
                        {res.gridPosition ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className="font-mono text-sm text-neutral-400">{res.laps ?? '-'}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className={cn(
                        'font-mono text-sm font-bold',
                        res.points && res.points > 0 ? 'text-white' : 'text-neutral-600',
                        res.isProvisional && 'text-yellow-400'
                      )}>
                        {res.points !== null && res.points !== undefined ? res.points : '-'}
                      </span>
                    </TableCell>
                  </>
                )}

                {/* Qualifying columns */}
                {isQualifying && (
                  <>
                    <TableCell className="py-2.5 text-right">
                      <span className={cn(
                        'font-mono text-sm',
                        index === 0 ? 'text-white font-semibold' : 'text-neutral-200'
                      )}>
                        {getPracticeLapTime(res) ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className="font-mono text-sm text-neutral-400">
                        {index === 0 ? '-' : (gapToLeader ?? '-')}
                      </span>
                    </TableCell>
                    {results?.[0]?.q1Time !== undefined && (
                      <TableCell className="py-2.5 text-right hidden lg:table-cell">
                        <span className="font-mono text-xs text-neutral-400">{res.q1Time ?? '-'}</span>
                      </TableCell>
                    )}
                    {results?.[0]?.q2Time !== undefined && (
                      <TableCell className="py-2.5 text-right hidden lg:table-cell">
                        <span className="font-mono text-xs text-neutral-400">{res.q2Time ?? '-'}</span>
                      </TableCell>
                    )}
                    {results?.[0]?.q3Time !== undefined && (
                      <TableCell className="py-2.5 text-right hidden lg:table-cell">
                        <span className="font-mono text-xs text-neutral-400">{res.q3Time ?? '-'}</span>
                      </TableCell>
                    )}
                  </>
                )}

                {/* Practice columns */}
                {isPractice && (
                  <>
                    <TableCell className="py-2.5 text-right">
                      <span className={cn(
                        'font-mono text-sm',
                        index === 0 ? 'text-white font-semibold' : 'text-neutral-200'
                      )}>
                        {getPracticeLapTime(res) ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className="font-mono text-sm text-neutral-400">
                        {index === 0 ? '-' : (gapToLeader ?? '-')}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className="font-mono text-sm text-neutral-400">{getPracticeLaps(res) || '-'}</span>
                    </TableCell>
                    {isTestingSession && (
                      <>
                        <TableCell className="py-2.5 text-right hidden lg:table-cell">
                          <span className="font-mono text-xs text-neutral-300">
                            {(() => {
                              const laps = getPracticeLaps(res);
                              const distance = calculateDistance(laps, circuitLength);
                              const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                              return `${formatDistance(distance)} (${pct}%)`;
                            })()}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-right hidden lg:table-cell">
                          <span className={cn(
                            'text-xs font-semibold',
                            (() => {
                              const laps = getPracticeLaps(res);
                              const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                              if (pct >= 90) return 'text-green-400';
                              if (pct >= 75) return 'text-yellow-400';
                              return 'text-red-400';
                            })()
                          )}>
                            {(() => {
                              const laps = getPracticeLaps(res);
                              const pct = leaderLaps > 0 ? Math.round((laps / leaderLaps) * 100) : 0;
                              if (pct >= 90) return 'HIGH';
                              if (pct >= 75) return 'MED';
                              return 'LOW';
                            })()}
                          </span>
                        </TableCell>
                      </>
                    )}
                  </>
                )}
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
  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-neutral-800">
    {Icon && <Icon className="w-5 h-5 text-neutral-400" />}
    <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
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
      'w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-200 rounded-md text-left',
      active
        ? 'bg-neutral-800 text-white'
        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
    )}
  >
    <Icon className={cn('w-4 h-4', active ? 'text-red-500' : 'text-neutral-500')} />
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
          <div className="w-10 h-10 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin"></div>
          <div className="text-neutral-400 font-mono text-xs tracking-wider">
            LOADING SESSION DATA
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

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-6 border-b border-neutral-800 pb-6">
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="pl-0 text-neutral-500 hover:text-white hover:bg-transparent -ml-2 mb-1 text-sm"
              onClick={() => {
                if (showAnalysis && !hasRaceData) {
                  setShowAnalysis(false);
                } else {
                  navigate(-1);
                }
              }}
            >
              <ArrowLeft01Icon className="mr-1.5 h-3.5 w-3.5" />{' '}
              {showAnalysis && !hasRaceData ? 'Back to Schedule' : 'Back'}
            </Button>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              {eventName}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-neutral-400 font-mono">{year}</span>
              {selectedSession && availableSessions.find((s) => s.type === selectedSession) && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-200 font-medium">
                    {availableSessions.find((s) => s.type === selectedSession)?.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {!shouldShowSchedule &&
            availableSessions.length > 0 &&
            (isTestingEvent ? (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[280px] bg-neutral-900 border border-neutral-700 text-white font-medium h-11 text-sm rounded-lg hover:border-neutral-600 transition-colors">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border border-neutral-700 text-white rounded-lg">
                  <SelectItem
                    value="Summary"
                    className="font-semibold text-red-400 focus:bg-neutral-800 focus:text-red-400 py-2.5 border-b border-neutral-800"
                  >
                    3-Day Testing Summary
                  </SelectItem>
                  {availableSessions
                    .filter((s) => s.type !== 'Q' && s.type !== 'Summary')
                    .map((s) => (
                      <SelectItem
                        key={s.type}
                        value={s.type}
                        className="font-medium focus:bg-neutral-800 focus:text-white py-2"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[200px] bg-neutral-900 border border-neutral-700 text-white font-medium h-10 text-sm rounded-lg hover:border-neutral-600 transition-colors">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border border-neutral-700 text-white rounded-lg">
                  {availableSessions
                    .filter((s) => s.type !== 'Q')
                    .map((s) => (
                      <SelectItem
                        key={s.type}
                        value={s.type}
                        className="font-medium focus:bg-neutral-800 focus:text-white"
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
            <div className="space-y-10">
              {/* Hero Countdown Section */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Flag01Icon className="w-48 h-48" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 font-medium text-xs tracking-widest uppercase">
                        Upcoming Session
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                      {nextSession ? nextSession.name : 'Race Weekend'}
                    </h2>
                    <div className="text-neutral-400 text-sm">
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
                    <div className="flex gap-6 md:gap-8 text-center">
                      {[
                        { label: 'Days', value: countdown.days },
                        { label: 'Hrs', value: countdown.hours },
                        { label: 'Min', value: countdown.minutes },
                        { label: 'Sec', value: countdown.seconds },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="text-3xl md:text-5xl font-mono font-bold text-white tracking-tighter leading-none tabular-nums">
                            {item.value.toString().padStart(2, '0')}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest mt-2">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-2xl md:text-4xl font-mono font-bold text-white tracking-tight">
                      SESSION IN PROGRESS
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    Weekend Schedule
                  </h3>
                  <div className="flex items-center bg-neutral-900 rounded-md p-0.5 border border-neutral-800">
                    <button
                      onClick={() => {
                        setIs24Hour(true);
                        trackInteraction('time_format_changed', { format: '24h' });
                      }}
                      className={cn(
                        'px-3 py-1 text-xs font-medium transition-colors rounded-sm',
                        is24Hour ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
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
                        'px-3 py-1 text-xs font-medium transition-colors rounded-sm',
                        !is24Hour ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
                      )}
                    >
                      12H
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800/50">

                  {/* Table Body */}
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
                          'grid grid-cols-1 md:grid-cols-4 px-5 py-4 gap-3 transition-colors items-center',
                          isNext
                            ? 'bg-red-500/[0.04] hover:bg-red-500/[0.08]'
                            : 'hover:bg-neutral-900/50'
                        )}
                      >
                        {/* Date Column */}
                        <div className="flex flex-col justify-center">
                          <div className={cn(
                            'font-mono text-base font-semibold',
                            isNext ? 'text-white' : 'text-neutral-200'
                          )}>
                            {new Date(session.date)
                              .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                              .toUpperCase()}
                          </div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                            })}
                          </div>
                        </div>

                        {/* Session Name */}
                        <div className="flex flex-col justify-center">
                          <div className={cn(
                            'font-semibold text-sm',
                            isNext ? 'text-red-400' : 'text-white'
                          )}>
                            {session.name}
                          </div>
                        </div>

                        {/* Local Time */}
                        <div className="hidden md:flex flex-col justify-center">
                          {!isAvailable && (
                            <>
                              <div className="font-mono text-neutral-300 text-sm">
                                {formatTimeStr(session.localTime)}
                              </div>
                              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                                Local
                              </div>
                            </>
                          )}
                        </div>

                        {/* Your Time / Results Button / LIVE Indicator */}
                        <div className="hidden md:flex flex-col justify-center items-end md:items-start">
                          {(() => {
                            const sessionDate = new Date(session.date);
                            const now = new Date();
                            const diffMs = now.getTime() - sessionDate.getTime();
                            const diffMins = diffMs / (1000 * 60);

                            let duration = 60;
                            if (sessionType === 'R') duration = 180;
                            else if (sessionType === 'Sprint') duration = 60;

                            const isLive = diffMins >= 0 && diffMins < duration;

                            if (isLive) {
                              return (
                                <div className="flex items-center gap-2 text-red-400">
                                  <div className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                  </div>
                                  <span className="font-semibold uppercase tracking-wider text-xs">
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
                                  className="border-neutral-700 text-white hover:bg-neutral-800 hover:text-white font-medium text-xs rounded-md w-full md:w-auto"
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
                                  View Results
                                </Button>
                              );
                            }

                            return (
                              <>
                                <div className={cn(
                                  'font-mono text-sm',
                                  isNext ? 'text-white' : 'text-neutral-300'
                                )}>
                                  {formatDate(session.date)}
                                </div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
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
              <div className="w-10 h-10 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin"></div>
            </div>
          )
        ) : (
          // --- FINISHED RACE DISPLAY (Vertical Scroll) ---
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sticky Sidebar */}
            {selectedSession !== 'Summary' && (
              <aside className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-32 space-y-0.5 bg-neutral-950 border border-neutral-800 rounded-lg p-2">
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
            <div className="flex-1 min-w-0 space-y-8">
              {/* 1. Overview Section (Includes Results) */}
              {activeSection === 'overview' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <section id="overview">
                    <SectionHeader
                      title={`${availableSessions.find((s) => s.type === selectedSession)?.name || 'Race'} Overview`}
                      icon={ChampionIcon}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="mb-5 flex items-center bg-neutral-900 rounded-md p-0.5 border border-neutral-800 w-fit">
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
                                'px-3 py-1.5 text-xs font-medium transition-colors rounded-sm',
                                testingWindow === value
                                  ? 'bg-neutral-700 text-white'
                                  : 'text-neutral-400 hover:text-white'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Provisional Results Banner */}
                    {sessionResults && sessionResults.some((r) => r.isProvisional) && (
                      <Alert className="mb-5 border-yellow-500/30 bg-yellow-500/5 text-yellow-200 rounded-lg">
                        <Alert02Icon className="h-4 w-4 text-yellow-400" />
                        <AlertTitle className="font-semibold text-yellow-300 text-sm">
                          Provisional Results
                        </AlertTitle>
                        <AlertDescription className="text-yellow-200/80 text-sm">
                          Official results are still being processed. Points and positions
                          shown are provisional and subject to confirmation.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isTestingSession && selectedSession !== 'Summary' && (
                      <Alert className="mb-5 border-blue-500/30 bg-blue-500/5 text-blue-200 rounded-lg">
                        <Alert02Icon className="h-4 w-4 text-blue-400" />
                        <AlertTitle className="font-semibold text-blue-300 text-sm">
                          Testing Focus
                        </AlertTitle>
                        <AlertDescription className="text-blue-200/80 text-sm">
                          Results are sorted by fastest lap. Mileage and reliability columns
                          highlight long-run robustness.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isTestingSession && selectedSession === 'Summary' && (
                      <Alert className="mb-5 border-blue-500/30 bg-blue-500/5 text-blue-200 rounded-lg">
                        <Alert02Icon className="h-4 w-4 text-blue-400" />
                        <AlertTitle className="font-semibold text-blue-300 text-sm">
                          3-Day Testing Summary
                        </AlertTitle>
                        <AlertDescription className="text-blue-200/80 text-sm">
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
                        year={year}
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
                        <TabsList className="bg-neutral-900 p-0.5 h-auto rounded-lg border border-neutral-800 gap-0.5">
                          <TabsTrigger
                            value="history"
                            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 text-xs font-medium py-2 px-4 rounded-md transition-all hover:text-white"
                          >
                            Lap History
                          </TabsTrigger>
                          <TabsTrigger
                            value="pace"
                            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 text-xs font-medium py-2 px-4 rounded-md transition-all hover:text-white"
                          >
                            Pace Distribution
                          </TabsTrigger>
                          <TabsTrigger
                            value="gap"
                            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 text-xs font-medium py-2 px-4 rounded-md transition-all hover:text-white"
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
                    <div className="bg-black border border-neutral-800 overflow-hidden rounded-lg h-[80vh] relative">
                      <React.Suspense
                        fallback={
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin mx-auto mb-2"></div>
                              <div className="text-xs text-neutral-500 font-mono">Loading replay...</div>
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
