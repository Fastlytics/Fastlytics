import React, { useState, useMemo, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft01Icon, ChampionIcon, Flag01Icon, Analytics01Icon, Clock01Icon, FlashIcon, Calendar01Icon, Location01Icon, UserGroupIcon, Time01Icon, TradeUpIcon, MapsLocation01Icon, ChartLineData01Icon } from 'hugeicons-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import RacingChart from '@/components/RacingChart';
import TireStrategy from '@/components/TireStrategy';
import SpeedTraceChart from '@/components/SpeedTraceChart';
import GearMapChart from '@/components/GearMapChart';
import CircuitComparisonChart from '@/components/CircuitComparisonChart';
import DriverComparisonTelemetry from '@/components/DriverComparisonTelemetry';
import F1Card from '@/components/F1Card';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Alert02Icon } from "hugeicons-react";
import { fetchSpecificRaceResults, fetchAvailableSessions, fetchEventSessionSchedule, DetailedRaceResult, AvailableSession, EventSessionSchedule } from '@/lib/api';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import ThrottleChart from '@/components/ThrottleChart';
import BrakeChart from '@/components/BrakeChart';
import RPMChart from '@/components/RPMChart';
import DRSChart from '@/components/DRSChart';
import PositionsTabContent from '@/components/PositionsTabContent';
import posthog from 'posthog-js';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileRace } from '@/components/mobile';

// --- Helper Functions ---

const getTeamColorClass = (teamName: string | undefined): string => {
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
}

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
    } catch (e) { return timeStr; }
    return timeStr;
  }
  if (timeStr.match(/^[A-Za-z]/)) return timeStr;

  let processedTime = timeStr.startsWith('+') ? timeStr.substring(1) : timeStr;
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
        const milliseconds = Math.round((seconds % 1) * 1000).toString().padStart(3, '0');
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

const SessionResultsTable: React.FC<{ results: DetailedRaceResult[], sessionType: string, year: number, favoriteDriver?: string | null }> = ({ results, sessionType, year, favoriteDriver }) => {
  const isPractice = sessionType.startsWith('FP');
  const isQualifying = sessionType.startsWith('Q') || sessionType.startsWith('SQ');
  const isRaceOrSprint = sessionType === 'R' || sessionType === 'Sprint';

  const sortedResults = useMemo(() => {
    if ((isPractice || isQualifying) && results) {
      return [...results].sort((a, b) => parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime));
    }
    return results;
  }, [results, isPractice, isQualifying]);

  const columns: { key: keyof DetailedRaceResult | 'driver' | 'team' | 'displayPosition', label: string, className?: string }[] = [
    { key: 'displayPosition', label: 'POS', className: 'w-[60px] text-center font-mono font-bold text-gray-400' },
    { key: 'driver', label: 'DRIVER' },
    { key: 'team', label: 'TEAM' },
  ];

  if (isRaceOrSprint) {
    columns.push({ key: 'time', label: 'TIME/GAP', className: 'text-right font-mono' });
    columns.push({ key: 'laps', label: 'LAPS', className: 'text-center font-mono' });
    columns.push({ key: 'points', label: 'PTS', className: 'text-right font-bold text-red-500' });
  } else if (isQualifying) {
    columns.push({ key: 'fastestLapTime', label: 'FASTEST LAP', className: 'text-right font-mono' });
  } else if (isPractice) {
    columns.push({ key: 'fastestLapTime', label: 'FASTEST LAP', className: 'text-right font-mono' });
    columns.push({ key: 'lapsCompleted', label: 'LAPS', className: 'text-center font-mono' });
  }

  return (
    <div className="bg-black border-2 border-gray-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-900/50 border-b border-gray-800">
          <TableRow className="border-gray-800 hover:bg-transparent">
            {columns.map(col => (
              <TableHead key={String(col.key)} className={cn("text-gray-500 font-bold uppercase tracking-wider text-xs py-4", col.className)}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedResults?.map((res, index) => {
            const isFavorite = favoriteDriver && (res.driverCode === favoriteDriver || res.fullName.toLowerCase().includes(favoriteDriver.toLowerCase()));
            return (
              <TableRow
                key={res.driverCode}
                className={cn(
                  "border-gray-800/50 transition-colors group",
                  isFavorite ? "bg-red-600/10 hover:bg-red-600/20 border-l-2 border-l-red-600" : "hover:bg-gray-900/50"
                )}
              >
                {columns.map(col => (
                  <TableCell key={`${res.driverCode}-${String(col.key)}`} className={cn("py-3", col.className)}>
                    {col.key === 'displayPosition' ? (
                      (isPractice || isQualifying) ? index + 1 : (res.position ?? '-')
                    ) : col.key === 'driver' ? (
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white group-hover:text-red-500 transition-colors">{res.fullName}</span>
                        {res.isFastestLap && <Clock01Icon className="w-3 h-3 text-purple-500" />}
                      </div>
                    ) : col.key === 'team' ? (
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <span className={cn("w-1.5 h-1.5 rounded-full", `bg-f1-${getTeamColorClass(res.team)}`)}></span>
                        {res.team}
                      </span>
                    ) : col.key === 'points' ? (
                      <span className={cn("flex items-center justify-end gap-2 font-bold", res.isProvisional ? "text-yellow-500" : "text-red-500")}>
                        {res.points !== null ? res.points : '-'}
                        {res.isProvisional && <span className="text-[10px] uppercase tracking-tighter bg-yellow-500/20 px-1 rounded">Prov</span>}
                      </span>
                    ) : col.key === 'time' ? (
                      <span className="text-gray-300">{formatRaceTime(res.time, res.position === 1)}</span>
                    ) : col.key === 'laps' ? (
                      <span className="text-gray-500">{res.laps ?? '-'}</span>
                    ) : col.key === 'driverFastestLapTime' ? (
                      res.driverFastestLapTime ? (
                        <span className={cn(res.isFastestLap ? 'text-purple-400 font-bold' : 'text-gray-400')}>
                          {res.driverFastestLapTime}
                        </span>
                      ) : '-'
                    ) : (
                      res[col.key as keyof DetailedRaceResult] ?? '-'
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

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
  <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
    {Icon && <Icon className="w-6 h-6 text-red-600" />}
    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
      {title}
    </h2>
  </div>
);

const NavItem = ({ id, label, icon: Icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 border-l-2 text-left",
      active
        ? "border-red-600 bg-red-600/10 text-white"
        : "border-transparent text-gray-500 hover:text-white hover:bg-gray-900"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-red-500" : "text-gray-600")} />
    {label}
  </button>
);

const Race = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSession = searchParams.get('session') || '';
  const showAnalysis = searchParams.get('view') === 'analysis';

  const setSelectedSession = (session: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('session', session);
      return newParams;
    }, { replace: true });
  };

  const setShowAnalysis = (show: boolean) => {
    setSearchParams(prev => {
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
  const [activeSection, setActiveSection] = useState('overview');
  const [openF1Drivers, setOpenF1Drivers] = useState<OpenF1Driver[]>([]);

  // New State for Redesign
  const [now, setNow] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadOpenF1Data = async () => {
      const drivers = await fetchAllOpenF1Drivers();
      setOpenF1Drivers(drivers);
    };
    loadOpenF1Data();
  }, []);

  const getDriverImage = (driverName: string) => {
    const driver = openF1Drivers.find(d => d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || ''));
    return driver?.headshot_url;
  };

  // Circuit Comparison State
  const [circuitDrivers, setCircuitDrivers] = useState<{
    driver1: string; driver2: string; lap1: string | number; lap2: string | number; shouldLoadChart: boolean;
  }>({ driver1: '', driver2: '', lap1: 'fastest', lap2: 'fastest', shouldLoadChart: false });

  // Parse ID
  const { year, eventSlug, eventName } = useMemo(() => {
    if (!raceId) return { year: null, eventSlug: null, eventName: 'Race' };
    const parts = raceId.split('-');
    const parsedYear = parseInt(parts[0], 10);
    if (isNaN(parsedYear)) return { year: null, eventSlug: raceId, eventName: 'Invalid Race ID' };
    const slug = parts.slice(1).join('-');
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (parsedYear && name) {
      posthog.capture('race_analysis_viewed', { year: parsedYear, race: name });
    }

    return { year: parsedYear, eventSlug: slug, eventName: name };
  }, [raceId]);

  // Queries
  const { data: fetchedAvailableSessions, isLoading: isLoadingSessions } = useQuery<AvailableSession[]>({
    queryKey: ['availableSessions', year, eventName],
    queryFn: () => fetchAvailableSessions(year!, eventName),
    enabled: !!year && !!eventName,
  });

  const { data: sessionSchedule } = useQuery<EventSessionSchedule>({
    queryKey: ['sessionSchedule', year, eventSlug],
    queryFn: () => fetchEventSessionSchedule(year!, eventSlug!),
    enabled: !!year && !!eventSlug && !isLoadingSessions && (!fetchedAvailableSessions || !fetchedAvailableSessions.some(s => s.type === 'R')),
  });

  const { data: sessionResults, isLoading: isLoadingResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, eventSlug, selectedSession],
    queryFn: () => fetchSpecificRaceResults(year!, eventSlug!, selectedSession),
    enabled: !!year && !!eventSlug && !!selectedSession && (fetchedAvailableSessions && fetchedAvailableSessions.length > 0),
  });

  useEffect(() => {
    if (fetchedAvailableSessions && fetchedAvailableSessions.length > 0) {
      setAvailableSessions(fetchedAvailableSessions);

      // Only set default session if not already in params
      if (!searchParams.get('session')) {
        let defaultSession = '';
        if (fetchedAvailableSessions.some(s => s.type === 'R')) {
          defaultSession = 'R';
        } else {
          defaultSession = fetchedAvailableSessions[fetchedAvailableSessions.length - 1].type;
        }

        // Update params without pushing to history for initial load
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('session', defaultSession);
          return newParams;
        }, { replace: true });
      }
    } else if (fetchedAvailableSessions) {
      setAvailableSessions([]);
    }
  }, [fetchedAvailableSessions]);

  // Derived Data
  const raceWinner = useMemo(() => (selectedSession === 'R' || selectedSession === 'Sprint') ? sessionResults?.find(r => r.position === 1) : null, [sessionResults, selectedSession]);
  const poleSitter = useMemo(() => (selectedSession === 'R' || selectedSession === 'Sprint') ? sessionResults?.find(r => r.gridPosition === 1) : null, [sessionResults, selectedSession]);
  const fastestLapHolder = useMemo(() => (selectedSession === 'R' || selectedSession === 'Sprint') ? sessionResults?.find(r => r.isFastestLap) : null, [sessionResults, selectedSession]);

  const topPerformers = useMemo(() => {
    if (!sessionResults || !selectedSession || (selectedSession === 'R' || selectedSession === 'Sprint')) return [];
    return [...sessionResults]
      .filter(r => r.fastestLapTime)
      .sort((a, b) => parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime))
      .slice(0, 3);
  }, [sessionResults, selectedSession]);

  const nextSession = useMemo(() => {
    if (!sessionSchedule) return null;
    return sessionSchedule.sessions.find(s => new Date(s.date) > now);
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
    } catch (e) { return timeStr; }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour
      });
    } catch (e) { return '-'; }
  };

  const handleCircuitDriversSelected = React.useCallback((drivers: { driver1: string; driver2: string; lap1: string | number; lap2: string | number; shouldLoadChart: boolean; }) => {
    setCircuitDrivers(drivers);
    if (drivers.shouldLoadChart) {
      posthog.capture('chart_interaction', {
        chart: 'circuit_comparison',
        action: 'compare_drivers',
        driver1: drivers.driver1,
        driver2: drivers.driver2
      });
    }
  }, []);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    posthog.capture('tab_switched', { tab: section, context: 'race_analysis' });
  };

  if (!year || !eventSlug) return null;

  // Mobile version
  if (isMobile) {
    return (
      <>
        <SEO
          title={`${eventName} ${year} - F1 Race Analysis`}
          description={`Detailed analysis of the ${year} ${eventName}. View race results, tire strategy, lap times, telemetry, and track dominance.`}
          keywords={['f1 race analysis', 'race results', 'tire strategy', 'f1 telemetry', eventName, `${year} f1 season`]}
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
          <div className="text-gray-500 font-mono text-sm animate-pulse">LOADING SESSION DATA...</div>
        </div>
      </div>
    );
  }

  const isRaceFuture = !availableSessions.some(s => s.type === 'R');
  const shouldShowSchedule = isRaceFuture && !showAnalysis;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <SEO
        title={`${eventName} ${year} - F1 Race Analysis`}
        description={`Detailed analysis of the ${year} ${eventName}. View race results, tire strategy, lap times, telemetry, and track dominance.`}
        keywords={['f1 race analysis', 'race results', 'tire strategy', 'f1 telemetry', eventName, `${year} f1 season`]}
      />
      <DashboardNavbar />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-6 border-b border-gray-800 pb-8">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="pl-0 text-gray-500 hover:text-white hover:bg-transparent -ml-2 mb-2"
              onClick={() => {
                if (showAnalysis && isRaceFuture) {
                  setShowAnalysis(false);
                } else {
                  navigate(-1);
                }
              }}
            >
              <ArrowLeft01Icon className="mr-2 h-4 w-4" /> {showAnalysis && isRaceFuture ? 'Back to Schedule' : 'Back'}
            </Button>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
              {eventName}
            </h1>
            <div className="flex items-center gap-4 text-gray-400 font-mono text-sm">
              <span className="bg-gray-900 px-2 py-1 border border-gray-800 rounded">{year} SEASON</span>
              {selectedSession && availableSessions.find(s => s.type === selectedSession) && (
                <span className="text-red-500 font-bold uppercase">
                  {availableSessions.find(s => s.type === selectedSession)?.name}
                </span>
              )}
            </div>
          </div>

          {!shouldShowSchedule && availableSessions.length > 0 && (
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[200px] bg-black border-2 border-gray-800 text-white font-bold uppercase tracking-wider h-12">
                <SelectValue placeholder="SESSION" />
              </SelectTrigger>
              <SelectContent className="bg-black border-2 border-gray-800 text-white">
                {availableSessions.filter(s => s.type !== 'Q').map(s => (
                  <SelectItem key={s.type} value={s.type} className="uppercase font-bold focus:bg-gray-900 focus:text-red-500">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </header>

        {shouldShowSchedule ? (
          sessionSchedule ? (
            // --- UPCOMING RACE DISPLAY ---
            <div className="space-y-12">
              {/* Hero Countdown Section */}
              <div className="bg-gray-900/30 border border-gray-800 p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Flag01Icon className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-500 font-bold uppercase tracking-widest text-sm">Upcoming Session</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white mb-2">
                      Countdown to {nextSession ? nextSession.name : 'Race Weekend'}
                    </h2>
                    <div className="text-gray-400 font-mono text-lg">
                      {nextSession ? new Date(nextSession.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Dates TBD'}
                    </div>
                  </div>

                  {countdown ? (
                    <div className="flex gap-4 md:gap-8 text-center">
                      {[
                        { label: 'DAYS', value: countdown.days },
                        { label: 'HRS', value: countdown.hours },
                        { label: 'MIN', value: countdown.minutes },
                        { label: 'SEC', value: countdown.seconds }
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="text-4xl md:text-6xl font-mono font-bold text-white tracking-tighter leading-none">
                            {item.value.toString().padStart(2, '0')}
                          </div>
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{item.label}</div>
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
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <h3 className="text-2xl font-bold uppercase italic tracking-wider text-white">Weekend Schedule</h3>
                  <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                    <button
                      onClick={() => setIs24Hour(true)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded transition-colors",
                        is24Hour ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      24H
                    </button>
                    <button
                      onClick={() => setIs24Hour(false)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded transition-colors",
                        !is24Hour ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      12H
                    </button>
                  </div>
                </div>

                <div className="grid gap-px bg-gray-800 border border-gray-800 overflow-hidden rounded-lg">
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
                    else if (lowerName.includes('sprint qualifying') || lowerName.includes('sprint shootout')) sessionType = 'SQ';
                    else if (lowerName.includes('sprint') && !lowerName.includes('qualifying')) sessionType = 'Sprint';
                    else if (lowerName.includes('qualifying') && !lowerName.includes('sprint')) sessionType = 'Q';
                    else if (lowerName === 'race') sessionType = 'R';

                    const isAvailable = availableSessions.some(s => {
                      if (sessionType === 'Q') return s.type === 'Q' || s.type === 'Q1' || s.type === 'Q2' || s.type === 'Q3';
                      if (sessionType === 'SQ') return s.type === 'SQ' || s.type === 'SQ1' || s.type === 'SQ2' || s.type === 'SQ3';
                      return s.type === sessionType;
                    });

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-4 p-6 gap-4 transition-colors group items-center",
                          isNext ? "bg-red-900/10 hover:bg-red-900/20" : "bg-black hover:bg-gray-900/50"
                        )}
                      >
                        {/* Date Column */}
                        <div className="flex flex-col justify-center border-r border-gray-800 pr-4">
                          <div className={cn("font-mono text-xl font-bold", isNext ? "text-white" : "text-gray-300")}>
                            {new Date(session.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600 uppercase font-bold tracking-wider">
                            {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </div>
                        </div>

                        {/* Session Name */}
                        <div className="flex flex-col justify-center pl-2">
                          <div className={cn("font-bold text-lg uppercase tracking-tight mb-1", isNext ? "text-red-500" : "text-white")}>
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
                              <div className="text-xs text-gray-600 uppercase font-bold tracking-wider">Local</div>
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
                            if (sessionType === 'R') duration = 180; // Race: 3 hours
                            else if (sessionType === 'Sprint') duration = 60; // Sprint: 1 hour

                            const isLive = diffMins >= 0 && diffMins < duration;

                            if (isLive) {
                              return (
                                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                  <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                  </div>
                                  <span className="font-bold uppercase tracking-wider text-sm">LIVE</span>
                                </div>
                              );
                            }

                            if (isAvailable) {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white uppercase font-bold tracking-wider w-full md:w-auto"
                                  onClick={() => {
                                    let targetSession = sessionType;
                                    if (sessionType === 'Q' && !availableSessions.some(s => s.type === 'Q')) {
                                      if (availableSessions.some(s => s.type === 'Q3')) targetSession = 'Q3';
                                      else if (availableSessions.some(s => s.type === 'Q2')) targetSession = 'Q2';
                                      else if (availableSessions.some(s => s.type === 'Q1')) targetSession = 'Q1';
                                    }
                                    if (sessionType === 'SQ' && !availableSessions.some(s => s.type === 'SQ')) {
                                      if (availableSessions.some(s => s.type === 'SQ3')) targetSession = 'SQ3';
                                      else if (availableSessions.some(s => s.type === 'SQ2')) targetSession = 'SQ2';
                                      else if (availableSessions.some(s => s.type === 'SQ1')) targetSession = 'SQ1';
                                    }
                                    setSelectedSession(targetSession);
                                    setShowAnalysis(true);
                                  }}
                                >
                                  Results
                                </Button>
                              );
                            }

                            return (
                              <>
                                <div className={cn("font-mono text-lg", isNext ? "text-white" : "text-gray-300")}>
                                  {formatDate(session.date)}
                                </div>
                                <div className="text-xs text-gray-600 uppercase font-bold tracking-wider">Your Time</div>
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
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-32 space-y-1">
                <NavItem id="overview" label="Overview" icon={ChampionIcon} active={activeSection === 'overview'} onClick={() => handleSectionChange('overview')} />
                {(selectedSession === 'R' || selectedSession === 'Sprint') && (
                  <NavItem id="strategy" label="Strategy" icon={Flag01Icon} active={activeSection === 'strategy'} onClick={() => handleSectionChange('strategy')} />
                )}
                {(selectedSession === 'R' || selectedSession === 'Sprint') && (
                  <NavItem id="positions" label="Positions" icon={ChartLineData01Icon} active={activeSection === 'positions'} onClick={() => handleSectionChange('positions')} />
                )}
                <NavItem id="laptimes" label="Lap Times" icon={Time01Icon} active={activeSection === 'laptimes'} onClick={() => handleSectionChange('laptimes')} />
                <NavItem id="dominance" label="Head to Head" icon={MapsLocation01Icon} active={activeSection === 'dominance'} onClick={() => handleSectionChange('dominance')} />
                <NavItem id="telemetry" label="Telemetry" icon={Analytics01Icon} active={activeSection === 'telemetry'} onClick={() => handleSectionChange('telemetry')} />
              </div>
            </aside>

            {/* Main Content Stream */}
            <div className="flex-1 space-y-8">

              {/* 1. Overview Section (Includes Results) */}
              {activeSection === 'overview' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  <section id="overview">
                    <SectionHeader title={`${availableSessions.find(s => s.type === selectedSession)?.name || 'Race'} Overview`} icon={ChampionIcon} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(selectedSession === 'R' || selectedSession === 'Sprint') ? (
                        <>
                          {raceWinner && <F1Card title="WINNER" value={raceWinner.fullName} subValue={formatRaceTime(raceWinner.time, true)} team={getTeamColorClass(raceWinner.team) as any} icon={<ChampionIcon />} imageUrl={getDriverImage(raceWinner.fullName)} />}
                          {poleSitter && <F1Card title="POLE POSITION" value={poleSitter.fullName} subValue={poleSitter.poleLapTimeValue} team={getTeamColorClass(poleSitter.team) as any} icon={<FlashIcon />} imageUrl={getDriverImage(poleSitter.fullName)} />}
                          {fastestLapHolder && <F1Card title="FASTEST LAP" value={fastestLapHolder.fullName} subValue={fastestLapHolder.fastestLapTimeValue} team={getTeamColorClass(fastestLapHolder.team) as any} icon={<Clock01Icon />} imageUrl={getDriverImage(fastestLapHolder.fullName)} />}
                        </>
                      ) : (
                        topPerformers.map((p, i) => (
                          <F1Card key={i} title={`P${i + 1}`} value={p.fullName} subValue={p.fastestLapTimeValue ?? p.fastestLapTime ?? ''} team={getTeamColorClass(p.team) as any} icon={i === 0 ? <ChampionIcon /> : <TradeUpIcon />} imageUrl={getDriverImage(p.fullName)} />
                        ))
                      )}
                    </div>
                  </section>

                  <section id="results">
                    <SectionHeader title="Session Results" icon={UserGroupIcon} />

                    {/* Provisional Results Banner */}
                    {sessionResults && sessionResults.some(r => r.isProvisional) && (
                      <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
                        <Alert02Icon className="h-4 w-4" />
                        <AlertTitle className="font-bold uppercase tracking-wider">Provisional Results</AlertTitle>
                        <AlertDescription>
                          Official race results are still being processed. Points and positions shown are provisional and subject to confirmation.
                        </AlertDescription>
                      </Alert>
                    )}

                    {sessionResults && <SessionResultsTable results={sessionResults} sessionType={selectedSession} year={year!} favoriteDriver={profile?.favorite_driver} />}
                  </section>
                </div>
              )}

              {/* 3. Strategy Section (Race Only) */}
              {activeSection === 'strategy' && (selectedSession === 'R' || selectedSession === 'Sprint') && (
                <section id="strategy" className="animate-in fade-in duration-500 space-y-8">

                  <TireStrategy year={year!} event={eventName} session={selectedSession} favoriteDriver={profile?.favorite_driver} />

                </section>
              )}

              {/* 3.5 Positions Section (Race Only) */}
              {activeSection === 'positions' && (selectedSession === 'R' || selectedSession === 'Sprint') && (
                <section id="positions" className="animate-in fade-in duration-500">
                  <PositionsTabContent
                    year={year!}
                    event={eventName}
                    session={selectedSession}
                    openF1Drivers={openF1Drivers}
                    favoriteDriver={profile?.favorite_driver}
                  />
                </section>
              )}

              {/* 4. Lap Times Section */}
              {activeSection === 'laptimes' && (
                <section id="laptimes" className="animate-in fade-in duration-500">
                  <SectionHeader title="Lap Time Analysis" icon={Time01Icon} />
                  {(() => {
                    const favDriverCode = profile?.favorite_driver;
                    let rivalDriverCode = null;

                    if (favDriverCode && sessionResults) {
                      const favResult = sessionResults.find(r => r.driverCode === favDriverCode || r.fullName.toLowerCase().includes(favDriverCode.toLowerCase()));
                      if (favResult && favResult.position) {
                        // Rival is the driver ahead (pos - 1), or behind (pos + 1) if P1
                        const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
                        const rivalResult = sessionResults.find(r => r.position === rivalPos);
                        if (rivalResult) rivalDriverCode = rivalResult.driverCode;
                      }
                    }

                    return (
                      <RacingChart
                        year={year!}
                        event={eventName}
                        session={selectedSession}
                        title="Lap Time Comparison"
                        autoLoad={true}
                        openF1Drivers={openF1Drivers}
                        favoriteDriver={favDriverCode}
                        rivalDriver={rivalDriverCode}
                      />
                    );
                  })()}
                </section>
              )}

              {/* 5. Dominance Section */}
              {activeSection === 'dominance' && (
                <section id="dominance" className="animate-in fade-in duration-500">
                  <SectionHeader title="Head to Head" icon={MapsLocation01Icon} />

                  {(() => {
                    const favDriverCode = profile?.favorite_driver;
                    let rivalDriverCode = null;

                    if (favDriverCode && sessionResults) {
                      const favResult = sessionResults.find(r => r.driverCode === favDriverCode || r.fullName.toLowerCase().includes(favDriverCode.toLowerCase()));
                      if (favResult && favResult.position) {
                        // Rival is the driver ahead (pos - 1), or behind (pos + 1) if P1
                        const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
                        const rivalResult = sessionResults.find(r => r.position === rivalPos);
                        if (rivalResult) rivalDriverCode = rivalResult.driverCode;
                      }
                    }

                    return (
                      <div className="space-y-12">
                        <CircuitComparisonChart
                          year={year!}
                          event={eventName}
                          session={selectedSession}
                          initialDriver1={favDriverCode}
                          initialDriver2={rivalDriverCode || undefined}
                          onDriversSelected={handleCircuitDriversSelected}
                          openF1Drivers={openF1Drivers}
                        />

                        {/* Comparison Charts if selected */}
                        {circuitDrivers.shouldLoadChart && (
                          <div className="space-y-12">
                            {/* Speed Trace - Full Width */}
                            <DriverComparisonTelemetry
                              year={year!}
                              event={eventName}
                              session={selectedSession}
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
                              <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="throttle" title="Throttle" />
                              <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="brake" title="Brake" />
                              <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="rpm" title="RPM" />
                              <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="drs" title="DRS" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </section>
              )}

              {/* 6. Telemetry Section */}
              {activeSection === 'telemetry' && (
                <section id="telemetry" className="animate-in fade-in duration-500">
                  <SectionHeader title="Telemetry Data" icon={Analytics01Icon} />

                  <h3 className="text-xl font-bold uppercase italic text-gray-400 border-l-4 border-gray-700 pl-4 mb-6">Full Field Telemetry</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SpeedTraceChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} title="" />
                    <GearMapChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} />
                    <ThrottleChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} />
                    <BrakeChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} />
                    <RPMChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} />
                    <DRSChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} />
                  </div>
                </section>
              )}

            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default Race;
