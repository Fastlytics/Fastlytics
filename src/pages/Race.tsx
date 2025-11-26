import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Flag, BarChart2, Clock, Zap, Calendar, MapPin, Users, Timer, TrendingUp, Map } from 'lucide-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import RacingChart from '@/components/RacingChart';
import TireStrategy from '@/components/TireStrategy';
import SpeedTraceChart from '@/components/SpeedTraceChart';
import GearMapChart from '@/components/GearMapChart';
import CircuitComparisonChart from '@/components/CircuitComparisonChart';
import DriverComparisonTelemetry from '@/components/DriverComparisonTelemetry';
import F1Card from '@/components/F1Card';
import { Button } from "@/components/ui/button";
import { fetchSpecificRaceResults, fetchAvailableSessions, fetchEventSessionSchedule, DetailedRaceResult, AvailableSession, EventSessionSchedule } from '@/lib/api';
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

const SessionResultsTable: React.FC<{ results: DetailedRaceResult[], sessionType: string, year: number }> = ({ results, sessionType, year }) => {
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
    columns.push({ key: 'time', label: 'TIME', className: 'text-right font-mono' });
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
          {sortedResults?.map((res, index) => (
            <TableRow key={res.driverCode} className="border-gray-800/50 hover:bg-gray-900/50 transition-colors group">
              {columns.map(col => (
                <TableCell key={`${res.driverCode}-${String(col.key)}`} className={cn("py-3", col.className)}>
                  {col.key === 'displayPosition' ? (
                    (isPractice || isQualifying) ? index + 1 : (res.position ?? '-')
                  ) : col.key === 'driver' ? (
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white group-hover:text-red-500 transition-colors">{res.fullName}</span>
                      {res.isFastestLap && <Clock className="w-3 h-3 text-purple-500" />}
                    </div>
                  ) : col.key === 'team' ? (
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                      <span className={cn("w-1.5 h-1.5 rounded-full", `bg-f1-${getTeamColorClass(res.team)}`)}></span>
                      {res.team}
                    </span>
                  ) : col.key === 'points' ? (
                    res.points ?? 0
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
          ))}
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
  const navigate = useNavigate();
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('R');
  const [selectedLap, setSelectedLap] = useState<string | number>('fastest');
  const [activeSection, setActiveSection] = useState('overview');

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
    enabled: !!year && !!eventSlug && !isLoadingSessions && (!fetchedAvailableSessions || fetchedAvailableSessions.length === 0),
  });

  const { data: sessionResults, isLoading: isLoadingResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, eventSlug, selectedSession],
    queryFn: () => fetchSpecificRaceResults(year!, eventSlug!, selectedSession),
    enabled: !!year && !!eventSlug && !!selectedSession && (fetchedAvailableSessions && fetchedAvailableSessions.length > 0),
  });

  useEffect(() => {
    if (fetchedAvailableSessions && fetchedAvailableSessions.length > 0) {
      setAvailableSessions(fetchedAvailableSessions);
      if (fetchedAvailableSessions.some(s => s.type === 'R')) setSelectedSession('R');
      else setSelectedSession(fetchedAvailableSessions[fetchedAvailableSessions.length - 1].type);
    } else if (fetchedAvailableSessions) {
      setAvailableSessions([]);
    }
  }, [fetchedAvailableSessions]);

  // Derived Data
  const raceWinner = useMemo(() => selectedSession === 'R' ? sessionResults?.find(r => r.position === 1) : null, [sessionResults, selectedSession]);
  const poleSitter = useMemo(() => selectedSession === 'R' ? sessionResults?.find(r => r.gridPosition === 1) : null, [sessionResults, selectedSession]);
  const fastestLapHolder = useMemo(() => selectedSession === 'R' ? sessionResults?.find(r => r.isFastestLap) : null, [sessionResults, selectedSession]);

  const topPerformers = useMemo(() => {
    if (!sessionResults || !selectedSession || (selectedSession === 'R' || selectedSession === 'Sprint')) return [];
    return [...sessionResults]
      .filter(r => r.fastestLapTime)
      .sort((a, b) => parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime))
      .slice(0, 3);
  }, [sessionResults, selectedSession]);

  // Scroll Handler
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Navbar height + padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  // Intersection Observer for Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'results', 'strategy', 'laptimes', 'dominance', 'telemetry'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!year || !eventSlug) return null;

  const isUpcoming = !fetchedAvailableSessions || fetchedAvailableSessions.length === 0;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <DashboardNavbar />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-6 border-b border-gray-800 pb-8">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="pl-0 text-gray-500 hover:text-white hover:bg-transparent -ml-2 mb-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
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

          {!isUpcoming && availableSessions.length > 0 && (
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

        {isUpcoming && sessionSchedule ? (
          // --- UPCOMING RACE DISPLAY ---
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-gray-900/30 border border-gray-800 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Flag className="w-32 h-32" />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Next Session</h2>
                <div className="text-5xl md:text-7xl font-mono font-bold text-white tracking-tighter mb-4">
                  {/* Placeholder for countdown logic, using static for design */}
                  02:14:33
                </div>
                <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Incoming Transmission
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold uppercase tracking-wider text-gray-500">Weekend Schedule</h3>
                <div className="grid gap-3">
                  {sessionSchedule.sessions.map((session, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-black border border-gray-800 hover:border-red-600/50 transition-colors group">
                      <div>
                        <div className="font-bold text-white group-hover:text-red-500 transition-colors">{session.name.toUpperCase()}</div>
                        <div className="text-xs text-gray-500 font-mono">{new Date(session.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right font-mono text-gray-400">
                        {session.localTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative h-[500px] bg-gray-900/20 border border-gray-800 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-gray-700" />
              <p className="absolute bottom-4 right-4 text-gray-600 font-mono text-xs uppercase">Circuit Map Unavailable</p>
            </div>
          </div>
        ) : (
          // --- FINISHED RACE DISPLAY (Vertical Scroll) ---
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sticky Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-32 space-y-1">
                <NavItem id="overview" label="Overview" icon={Trophy} active={activeSection === 'overview'} onClick={() => scrollToSection('overview')} />
                <NavItem id="results" label="Results" icon={Users} active={activeSection === 'results'} onClick={() => scrollToSection('results')} />
                {(selectedSession === 'R' || selectedSession === 'Sprint') && (
                  <NavItem id="strategy" label="Strategy" icon={Flag} active={activeSection === 'strategy'} onClick={() => scrollToSection('strategy')} />
                )}
                <NavItem id="laptimes" label="Lap Times" icon={Timer} active={activeSection === 'laptimes'} onClick={() => scrollToSection('laptimes')} />
                <NavItem id="dominance" label="Dominance" icon={Map} active={activeSection === 'dominance'} onClick={() => scrollToSection('dominance')} />
                <NavItem id="telemetry" label="Telemetry" icon={BarChart2} active={activeSection === 'telemetry'} onClick={() => scrollToSection('telemetry')} />
              </div>
            </aside>

            {/* Main Content Stream */}
            <div className="flex-1 space-y-24">

              {/* 1. Overview Section */}
              <section id="overview" className="scroll-mt-32">
                <SectionHeader title="Race Overview" icon={Trophy} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(selectedSession === 'R' || selectedSession === 'Sprint') ? (
                    <>
                      {raceWinner && <F1Card title="WINNER" value={raceWinner.fullName} subValue={formatRaceTime(raceWinner.time, true)} team={getTeamColorClass(raceWinner.team) as any} icon={<Trophy />} />}
                      {poleSitter && <F1Card title="POLE POSITION" value={poleSitter.fullName} subValue={poleSitter.poleLapTimeValue} team={getTeamColorClass(poleSitter.team) as any} icon={<Zap />} />}
                      {fastestLapHolder && <F1Card title="FASTEST LAP" value={fastestLapHolder.fullName} subValue={fastestLapHolder.fastestLapTimeValue} team={getTeamColorClass(fastestLapHolder.team) as any} icon={<Clock />} />}
                    </>
                  ) : (
                    topPerformers.map((p, i) => (
                      <F1Card key={i} title={`P${i + 1}`} value={p.fullName} subValue={p.fastestLapTimeValue ?? p.fastestLapTime ?? ''} team={getTeamColorClass(p.team) as any} icon={i === 0 ? <Trophy /> : <TrendingUp />} />
                    ))
                  )}
                </div>
              </section>

              {/* 2. Results Section */}
              <section id="results" className="scroll-mt-32">
                <SectionHeader title="Session Results" icon={Users} />
                {sessionResults && <SessionResultsTable results={sessionResults} sessionType={selectedSession} year={year!} />}
              </section>

              {/* 3. Strategy Section (Race Only) */}
              {(selectedSession === 'R' || selectedSession === 'Sprint') && (
                <section id="strategy" className="scroll-mt-32">
                  <SectionHeader title="Tire Strategy" icon={Flag} />
                  <div className="bg-black border-2 border-gray-800 p-6">
                    <TireStrategy year={year!} event={eventName} session={selectedSession} />
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl font-bold uppercase italic mb-4 text-gray-400">Position Changes</h3>
                    <div className="bg-black border-2 border-gray-800 p-6 h-[500px]">
                      <PositionsTabContent year={year!} event={eventName} session={selectedSession} />
                    </div>
                  </div>
                </section>
              )}

              {/* 4. Lap Times Section */}
              <section id="laptimes" className="scroll-mt-32">
                <SectionHeader title="Lap Time Analysis" icon={Timer} />
                <div className="bg-black border-2 border-gray-800 p-6">
                  <RacingChart year={year!} event={eventName} session={selectedSession} title="Lap Time Comparison" autoLoad={true} />
                </div>
              </section>

              {/* 5. Dominance Section */}
              <section id="dominance" className="scroll-mt-32">
                <SectionHeader title="Track Dominance" icon={Map} />
                <div className="bg-black border-2 border-gray-800 p-6">
                  <CircuitComparisonChart year={year!} event={eventName} session={selectedSession} onDriversSelected={setCircuitDrivers} />
                </div>
              </section>

              {/* 6. Telemetry Section */}
              <section id="telemetry" className="scroll-mt-32">
                <SectionHeader title="Telemetry Data" icon={BarChart2} />

                {/* Comparison Charts if selected */}
                {circuitDrivers.shouldLoadChart && (
                  <div className="mb-12 space-y-8">
                    <h3 className="text-xl font-bold uppercase italic text-gray-400 border-l-4 border-red-600 pl-4">Head-to-Head Comparison</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="throttle" title="Throttle" />
                      <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="brake" title="Brake" />
                      <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="rpm" title="RPM" />
                      <DriverComparisonTelemetry year={year!} event={eventName} session={selectedSession} driver1={circuitDrivers.driver1} driver2={circuitDrivers.driver2} lap1={circuitDrivers.lap1} lap2={circuitDrivers.lap2} shouldLoadChart={true} telemetryType="drs" title="DRS" />
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-bold uppercase italic text-gray-400 border-l-4 border-gray-700 pl-4 mb-6">Full Field Telemetry</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-black border border-gray-800 p-4"><SpeedTraceChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} title="" /></div>
                  <div className="bg-black border border-gray-800 p-4"><GearMapChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} /></div>
                  <div className="bg-black border border-gray-800 p-4"><ThrottleChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} /></div>
                  <div className="bg-black border border-gray-800 p-4"><BrakeChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} /></div>
                  <div className="bg-black border border-gray-800 p-4"><RPMChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} /></div>
                  <div className="bg-black border border-gray-800 p-4"><DRSChart year={year!} event={eventName} session={selectedSession} lap={selectedLap} /></div>
                </div>
              </section>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Race;
