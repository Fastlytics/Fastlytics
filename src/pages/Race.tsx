import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Flag, BarChart2, Clock, Cpu, ArrowRightLeft, Gauge, User, Lock, AlertCircle, Zap, Calendar, MapPin, Users, Timer, TrendingUp, Map } from 'lucide-react'; // Removed Sparkles
import Navbar from '@/components/Navbar';
import RacingChart from '@/components/RacingChart';
import TireStrategy from '@/components/TireStrategy';
import SpeedTraceChart from '@/components/SpeedTraceChart';
import GearMapChart from '@/components/GearMapChart';
import PositionChart from '@/components/PositionChart';
// Import TrackEvolutionChart for merging with Lap Times
// import TrackEvolutionChart from '@/components/TrackEvolutionChart';
// Import the new CircuitComparisonChart component
import CircuitComparisonChart from '@/components/CircuitComparisonChart';
import DriverComparisonTelemetry from '@/components/DriverComparisonTelemetry';
import F1Card from '@/components/F1Card';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchSpecificRaceResults, fetchAvailableSessions, fetchEventSessionSchedule, DetailedRaceResult, AvailableSession, EventSessionSchedule } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1'; // Import spinner
import ThrottleChart from '@/components/ThrottleChart';
import BrakeChart from '@/components/BrakeChart';
import RPMChart from '@/components/RPMChart';
import DRSChart from '@/components/DRSChart';
import PositionsTabContent from '@/components/PositionsTabContent';

// Helper to get team color class
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

// Define rookies by season year
const rookiesByYear: { [year: string]: string[] } = {
  '2025': ['ANT', 'BOR', 'DOO', 'BEA', 'HAD', 'LAW', 'COL'], // Antonelli, Bortoleto, Doohan, Bearman, Hadjar, Lawson, Colapinto
  '2024': ['BEA', 'COL'], // Bearman, Colapinto
  '2023': ['PIA', 'SAR', 'DEV'], // Piastri, Sargeant, De Vries
  '2022': ['ZHO'], // Zhou
  '2021': ['MSC', 'MAZ', 'TSU'], // Mick Schumacher, Mazepin, Tsunoda
  '2020': ['LAT'], // Latifi
  '2019': ['NOR', 'RUS', 'ALB'] // Norris, Russell, Albon
};

// Define F2 drivers who participated in F1 practice sessions by season year
const f2DriversByYear: { [year: string]: string[] } = {
  '2025': ['HIR', 'DRU', 'BEG', 'IWA', 'VES', 'BRO'], 
  '2024': ['HAD', 'BRO', 'DRU', 'IWA', 'CRA', 'ARO', 'BOR', 'LEL'], // Hadjar, Colapinto, Bearman, Browning, Drugovich, Leclerc, Iwasa, Crawford, Aron, Bortoleto
  '2023': ['POU', 'VES', 'DOO', 'SHW', 'DRU', 'MAR', 'HAD', 'BEA'], // Pourchaire, Vesti, Doohan, Shwartzman, Drugovich, Martins, Hadjar, Bearman
  '2022': ['POU', 'DOO', 'SAR', 'LAW', 'VIP', 'SHW'], // Pourchaire, Doohan, Sargeant, Lawson, Vips, Shwartzman
  '2021': ['SHW', 'ZHO', 'ILO'], // Shwartzman, Zhou, Ilott
  '2020': ['SHW', 'ILO', 'ZHO'], // Shwartzman, Ilott, Zhou
  '2019': ['LAT', 'GHI', 'MAZ'] // Latifi, Ghiotto, Mazepin
};

// Helper function to check if a driver is a rookie in a given year
const isRookie = (driverCode: string, year: number): boolean => {
  const yearStr = year.toString();
  return rookiesByYear[yearStr]?.includes(driverCode) || false;
};

// Helper function to check if a driver is an F2 driver participating in F1 session
const isF2Driver = (driverCode: string, year: number): boolean => {
  const yearStr = year.toString();
  return f2DriversByYear[yearStr]?.includes(driverCode) || false;
};

// Helper function to parse lap time string (e.g., "1:30.123") to seconds
const parseLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Infinity; // Treat null/undefined as slowest
  try {
    const parts = timeStr.split(/[:.]/);
    if (parts.length === 3) { // MM:SS.ms
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const milliseconds = parseInt(parts[2], 10);
      return minutes * 60 + seconds + milliseconds / 1000;
    } else if (parts.length === 2) { // SS.ms - less likely but handle
      const seconds = parseInt(parts[0], 10);
      const milliseconds = parseInt(parts[1], 10);
      return seconds + milliseconds / 1000;
    }
  } catch (e) {
    console.error(`Error parsing lap time: ${timeStr}`, e);
  }
  return Infinity; // Return Infinity if parsing fails
};

// Helper function to format race time for display
const formatRaceTime = (timeStr: string | null | undefined, isWinner: boolean = false): string => {
  if (!timeStr) return '-';
  
  // For winner's absolute time, convert "MMM:SS.ms" to "H:MM:SS.ms"
  if (isWinner) {
    try {
      const parts = timeStr.split(/[:.]/); 
      if (parts.length === 3) { // MMM:SS.ms format
        const totalMinutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        const milliseconds = parts[2];
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
      }
    } catch (e) {
      return timeStr; // Return original if parsing fails
    }
    return timeStr;
  }
  
  // Handle status strings (DNF, Lapped, etc.)
  if (timeStr.match(/^[A-Za-z]/)) {
    return timeStr; // Return status as-is
  }
  
  // For all non-winner times, ensure they have a + prefix and are in seconds.milliseconds format
  let processedTime = timeStr;
  
  // Remove existing + if present
  if (processedTime.startsWith('+')) {
    processedTime = processedTime.substring(1);
  }
  
  try {
    const parts = processedTime.split(/[:.]/); 
    if (parts.length === 3) { // MM:SS.ms format - convert to total seconds, then format appropriately
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const milliseconds = parts[2];
      const totalSeconds = minutes * 60 + seconds;
      
      // If total is 60+ seconds, show as +M:SS.ms, otherwise +SS.ms
      if (totalSeconds >= 60) {
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        return `+${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds}`;
      } else {
        return `+${totalSeconds}.${milliseconds}`;
      }
    } else if (parts.length === 2) { // SS.ms format
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
    // If parsing fails, just add + prefix if it's numeric
    if (processedTime.match(/^\d/)) {
      return `+${processedTime}`;
    }
  }
  
  return timeStr; // Return as-is for other cases
};// Component for rendering the results table dynamically
const SessionResultsTable: React.FC<{ results: DetailedRaceResult[], sessionType: string, year: number }> = ({ results, sessionType, year }) => {
  const isPractice = sessionType.startsWith('FP');
  const isQualifying = sessionType.startsWith('Q') || sessionType.startsWith('SQ');
  const isRaceOrSprint = sessionType === 'R' || sessionType === 'Sprint';

  // Sort results for Practice or Qualifying sessions by fastest lap time
  const sortedResults = useMemo(() => {
    // Sort if Practice OR Qualifying
    if ((isPractice || isQualifying) && results) {
      // Create a copy before sorting to avoid mutating the prop
      return [...results].sort((a, b) => {
        const timeA = parseLapTime(a.fastestLapTime);
        const timeB = parseLapTime(b.fastestLapTime);
        return timeA - timeB;
      });
    } 
    // For other sessions, assume backend provides sorted data or default order is fine
    return results;
  }, [results, isPractice, isQualifying]);

  // Determine columns based on session type
  const columns: { key: keyof DetailedRaceResult | 'driver' | 'team' | 'displayPosition', label: string, className?: string }[] = [
    // Use 'displayPosition' key for the first column
    { key: 'displayPosition', label: 'Pos', className: 'w-[50px] text-center' },
    { key: 'driver', label: 'Driver' }, // Combine name/code later
    { key: 'team', label: 'Team' }, // Combine color/name later
  ];

  if (isRaceOrSprint) {
    columns.push({ key: 'time', label: 'Time', className: 'text-right text-sm' });
    columns.push({ key: 'laps', label: 'Laps', className: 'text-center' });
    columns.push({ key: 'gridPosition', label: 'Grid', className: 'text-center' });
    columns.push({ key: 'driverFastestLapTime', label: 'Fastest Lap', className: 'text-right text-sm' });
    columns.push({ key: 'points', label: 'Points', className: 'text-right font-bold' });
  } else if (isQualifying) {
    // Remove Q1, Q2, Q3 columns
    // if (sessionType === 'Q1' || sessionType === 'Q' || sessionType === 'SQ1' || sessionType === 'SQ') columns.push({ key: 'q1Time', label: 'Q1', className: 'text-right font-mono text-sm' });
    // if (sessionType === 'Q2' || sessionType === 'Q' || sessionType === 'SQ2' || sessionType === 'SQ') columns.push({ key: 'q2Time', label: 'Q2', className: 'text-right font-mono text-sm' });
    // if (sessionType === 'Q3' || sessionType === 'Q' || sessionType === 'SQ3' || sessionType === 'SQ') columns.push({ key: 'q3Time', label: 'Q3', className: 'text-right font-mono text-sm' });
    
    // Add Fastest Lap column for Qualifying instead
    columns.push({ key: 'fastestLapTime', label: 'Fastest Lap', className: 'text-right font-mono text-sm' });
  } else if (isPractice) {
    columns.push({ key: 'fastestLapTime', label: 'Fastest Lap', className: 'text-right font-mono text-sm' });
    columns.push({ key: 'lapsCompleted', label: 'Laps', className: 'text-center' });
  }

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-lg overflow-hidden shadow-lg backdrop-blur-sm">
      <Table>
        <TableHeader className="bg-gray-800/50">
          <TableRow className="border-gray-700">
            {columns.map(col => (
              <TableHead key={String(col.key)} className={cn("text-white font-semibold", col.className)}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Use sortedResults for rendering */}
          {sortedResults?.map((res, index) => (
            <TableRow key={res.driverCode} className="border-gray-700/50 hover:bg-gray-800/40 transition-colors">
              {columns.map(col => (
                <TableCell key={`${res.driverCode}-${String(col.key)}`} className={cn(col.className)}>
                  {/* Handle the display position based on session type */}
                  {col.key === 'displayPosition' ? (
                    // Show index+1 for Practice and Qualifying (since we sorted by time)
                    (isPractice || isQualifying) ? index + 1 : (res.position ?? '-') 
                  ) : col.key === 'driver' ? (
                    <div className="flex items-center gap-2">
                      <span>{res.fullName}</span>
                      {isRookie(res.driverCode, year) && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-600/40 text-blue-200 rounded font-medium">
                          Rookie
                        </span>
                      )}
                      {isPractice && isF2Driver(res.driverCode, year) && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-600/40 text-purple-200 rounded font-medium">
                          Formula 2
                        </span>
                      )}
                    </div>
                  ) : col.key === 'team' ? (
                    <span className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", `bg-f1-${getTeamColorClass(res.team)}`)}></span>
                      {res.team}
                    </span>
                  ) : col.key === 'points' ? (
                     res.points ?? 0 // Default points to 0 if null/undefined
                  ) : col.key === 'time' ? (
                    formatRaceTime(res.time, res.position === 1) // Format race time with winner flag
                  ) : col.key === 'laps' ? (
                    res.laps ?? '-' // Show laps completed or dash if not available
                  ) : col.key === 'driverFastestLapTime' ? (
                    // Custom rendering for fastest lap column
                    res.driverFastestLapTime ? (
                      <span className={cn(
                        res.isFastestLap ? 'text-purple-400 font-bold' : 'text-white'
                      )}>
                        {res.driverFastestLapTime}
                        {res.driverFastestLapNumber && (
                          <span className="text-gray-400 ml-1">
                            (L{res.driverFastestLapNumber})
                          </span>
                        )}
                      </span>
                    ) : '-'
                  ) : (
                    res[col.key as keyof DetailedRaceResult] ?? '-' // Access other keys directly
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

const Race = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('R'); // Default to Race
  const [selectedLap, setSelectedLap] = useState<string | number>('fastest'); // For telemetry
  
  // State for circuit comparison drivers
  const [circuitDrivers, setCircuitDrivers] = useState<{
    driver1: string;
    driver2: string;
    lap1: string | number;
    lap2: string | number;
    shouldLoadChart: boolean;
  }>({
    driver1: '',
    driver2: '',
    lap1: 'fastest',
    lap2: 'fastest',
    shouldLoadChart: false
  });

  // Parse year and event slug from raceId
  const { year, eventSlug, eventName } = useMemo(() => {
    if (!raceId) return { year: null, eventSlug: null, eventName: 'Race' };
    const parts = raceId.split('-');
    const parsedYear = parseInt(parts[0], 10);
    if (isNaN(parsedYear)) return { year: null, eventSlug: raceId, eventName: 'Invalid Race ID' };

    const slug = parts.slice(1).join('-');
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return { year: parsedYear, eventSlug: slug, eventName: name };
  }, [raceId]);

  // Fetch available sessions using the updated backend endpoint
  const { data: fetchedAvailableSessions, isLoading: isLoadingSessions } = useQuery<AvailableSession[]>({
    queryKey: ['availableSessions', year, eventName], // Use eventName as key if API expects it
    queryFn: () => {
        if (!year || !eventName) throw new Error("Invalid year or event name");
        // Pass eventName or eventSlug based on what the updated API expects
        return fetchAvailableSessions(year, eventName);
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for a day
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!eventName,
  });

  // Fetch session schedule for upcoming races (when no sessions are available)
  const { data: sessionSchedule, isLoading: isLoadingSchedule } = useQuery<EventSessionSchedule>({
    queryKey: ['sessionSchedule', year, eventSlug],
    queryFn: () => {
        if (!year || !eventSlug) throw new Error("Invalid year or event slug");
        return fetchEventSessionSchedule(year, eventSlug);
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for a day
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep for a week
    enabled: !!year && !!eventSlug && !isLoadingSessions && (!fetchedAvailableSessions || fetchedAvailableSessions.length === 0),
  });

  // Effect to update state when available sessions data is fetched
  useEffect(() => {
    if (fetchedAvailableSessions && fetchedAvailableSessions.length > 0) {
        setAvailableSessions(fetchedAvailableSessions);
        // Set default selected session to 'R' if available, otherwise last session in list
        if (fetchedAvailableSessions.some(s => s.type === 'R')) {
            setSelectedSession('R');
        } else {
            setSelectedSession(fetchedAvailableSessions[fetchedAvailableSessions.length - 1].type);
        }
    } else if (fetchedAvailableSessions) { // Handle case where fetch returns empty array
        setAvailableSessions([]);
    }
  }, [fetchedAvailableSessions]);

  // Fetch detailed results for the selected session
  const { data: sessionResults, isLoading: isLoadingResults, error, isError } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, eventSlug, selectedSession],
    queryFn: () => {
        if (!year || !eventSlug || !selectedSession) throw new Error("Invalid year, event slug, or session");
        return fetchSpecificRaceResults(year, eventSlug, selectedSession); // Pass selectedSession
    },
    staleTime: 1000 * 60 * 5, // Shorter stale time for potentially live data
    gcTime: 1000 * 60 * 15,
    retry: 1,
    enabled: !!year && !!eventSlug && !!selectedSession && (fetchedAvailableSessions && fetchedAvailableSessions.length > 0),
  });

  // --- Derived Data (Winner, Pole, Fastest Lap - specific to Race 'R') ---
  const raceWinner = useMemo(() => {
    if (selectedSession !== 'R' || !sessionResults) return null;
    return sessionResults.find(r => r.position === 1);
  }, [sessionResults, selectedSession]);

  const poleSitter = useMemo(() => {
     if (selectedSession !== 'R' || !sessionResults) return null;
     return sessionResults.find(r => r.gridPosition === 1);
  }, [sessionResults, selectedSession]);

  const fastestLapHolder = useMemo(() => {
    // Find the driver marked with the fastest lap flag by the backend
    if (selectedSession !== 'R' || !sessionResults) return null;
    return sessionResults.find(r => r.isFastestLap === true);
  }, [sessionResults, selectedSession]);

  // NEW: Derive top 3 performers for non-Race/Sprint sessions
  const topPerformers = useMemo(() => {
    if (!sessionResults || !selectedSession) return [];

    const isPractice = selectedSession.startsWith('FP');
    const isQualifying = selectedSession.startsWith('Q') || selectedSession.startsWith('SQ');

    // Only calculate for Practice or Qualifying sessions
    if (!(isPractice || isQualifying)) {
      return [];
    }

    // Sort by fastest lap time (ascending) using the existing helper
    const sorted = [...sessionResults]
      .filter(r => r.fastestLapTime) // Ensure they have a lap time set
      .sort((a, b) => {
        const timeA = parseLapTime(a.fastestLapTime);
        const timeB = parseLapTime(b.fastestLapTime);
        return timeA - timeB;
      });

    return sorted.slice(0, 3); // Get top 3

  }, [sessionResults, selectedSession]);

  // --- Loading and Error States ---
  const isLoading = isLoadingSessions || isLoadingResults || isLoadingSchedule;

  if (!year || !eventSlug) {
     // Render Invalid URL state
     return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white flex flex-col items-center justify-center p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-white">Invalid Race URL</h1>
          <p className="text-gray-400 mb-6">Could not parse year or event from the URL.</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      );
  }

  // --- Render Page ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-3 text-gray-400 hover:bg-gray-800 hover:text-white" 
              onClick={() => navigate(-1)}
              data-umami-event="Race Page Back Button"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {eventName}{selectedSession && availableSessions.find(s => s.type === selectedSession) ? 
                  ` - ${availableSessions.find(s => s.type === selectedSession)?.name}` : ''}
              </h1>
              <p className="text-lg text-gray-400">{year} Season</p>
            </div>
          </div>
          {/* Session Selector */}
          <div className="w-full md:w-auto">
             {isLoadingSessions ? (
                 <Skeleton className="h-10 w-[200px] bg-gray-800/60" />
             ) : availableSessions.length > 0 ? (
                 <Select 
                   value={selectedSession} 
                   onValueChange={(value) => {
                     setSelectedSession(value);
                     // Track session change event
                     const session = availableSessions.find(s => s.type === value);
                     if (session) {
                       const event = document.createElement('div');
                       event.setAttribute('data-umami-event', `Race Session Change - ${session.name}`);
                       document.body.appendChild(event);
                       event.remove();
                     }
                   }}
                 >
                     <SelectTrigger className="w-full md:w-[220px] bg-gray-800/70 border-gray-700 text-white backdrop-blur-sm h-10">
                         <Calendar className="w-4 h-4 mr-2 opacity-70" />
                         <SelectValue placeholder="Select Session" />
                     </SelectTrigger>
                     <SelectContent className="bg-gray-900 border-gray-700 text-white">
                         {availableSessions
                            .filter(session => session.type !== 'Q') // Filter out the 'Qualifying' session type
                            .map(session => (
                                <SelectItem
                                    key={session.type}
                                    value={session.type}
                                    className="hover:bg-gray-800 focus:bg-gray-700"
                                    data-umami-event={`Race Session Select - ${session.name}`}
                                >
                                    {session.name}
                                </SelectItem>
                            ))}
                     </SelectContent>
                 </Select>
             ) : sessionSchedule ? (
                 <div className="flex items-center gap-2 text-blue-400">
                   
                 </div>
             ) : (
                 <p className="text-sm text-gray-500">No sessions available.</p>
             )}
          </div>
        </header>

                {/* Session Schedule for Upcoming Races - Bold Modern Design */}
        {sessionSchedule && (!fetchedAvailableSessions || fetchedAvailableSessions.length === 0) && (
          <div className="mb-12">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border border-gray-800/50 shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              
              {/* Header Section */}
              <div className="relative p-8 pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-white">
                          RACE WEEKEND
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                          <p className="text-lg text-white/80 font-semibold">
                            {sessionSchedule.eventFormat?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <MapPin className="w-5 h-5 text-white/60" />
                      <p className="text-xl font-bold text-white/90">
                        {sessionSchedule.location}
                      </p>
                      <div className="w-px h-6 bg-white/30"></div>
                      <p className="text-lg text-white/70 font-medium">
                        {sessionSchedule.country}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2">
                    <span className="text-green-300 font-bold text-sm tracking-wide">UPCOMING</span>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="relative px-8 pb-8">
                <div className="space-y-1">
                  {sessionSchedule.sessions.map((session, index) => {
                    const sessionDate = new Date(session.date);
                    const isToday = sessionDate.toDateString() === new Date().toDateString();
                    const isPast = sessionDate < new Date();
                    const isNext = !isPast && !isToday && index === sessionSchedule.sessions.findIndex(s => new Date(s.date) > new Date());
                    
                    return (
                      <div key={index} className="relative">
                        {/* Timeline connector */}
                        {index < sessionSchedule.sessions.length - 1 && (
                          <div className="absolute left-6 top-16 w-0.5 h-6 bg-gradient-to-b from-white/30 to-white/10"></div>
                        )}
                        
                        <div className={cn(
                          "relative group transition-all duration-300 rounded-2xl border backdrop-blur-sm",
                          isToday 
                            ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/40 shadow-lg shadow-blue-500/20" 
                            : isNext 
                            ? "bg-gradient-to-r from-white/10 to-white/5 border-white/20 hover:border-white/40 hover:bg-white/15" 
                            : isPast 
                            ? "bg-gradient-to-r from-gray-800/40 to-gray-900/40 border-gray-700/30 opacity-70" 
                            : "bg-gradient-to-r from-white/8 to-white/3 border-white/15 hover:border-white/30 hover:bg-white/12"
                        )}>
                          <div className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-6">
                              {/* Status Indicator */}
                              <div className="relative">
                                <div className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg tracking-wider shadow-lg",
                                  isToday 
                                    ? "bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-blue-500/40" 
                                    : isNext 
                                    ? "bg-gradient-to-br from-white to-gray-200 text-black shadow-white/20" 
                                    : isPast 
                                    ? "bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300" 
                                    : "bg-gradient-to-br from-gray-700 to-gray-800 text-white border border-gray-600"
                                )}>
                                  {(() => {
                                    const sessionName = session.name.toLowerCase();
                                    if (sessionName.includes('practice 1') || sessionName.includes('fp1')) return 'FP1';
                                    if (sessionName.includes('practice 2') || sessionName.includes('fp2')) return 'FP2';
                                    if (sessionName.includes('practice 3') || sessionName.includes('fp3')) return 'FP3';
                                    if (sessionName.includes('sprint shootout') || sessionName.includes('sq')) return 'SQ';
                                    if (sessionName.includes('sprint qualifying')) return 'SQ';
                                    if (sessionName.includes('sprint')) return 'S';
                                    if (sessionName.includes('qualifying') || sessionName.includes('quali')) return 'Q';
                                    if (sessionName.includes('race')) return 'R';
                                    return session.name.substring(0, 2).toUpperCase();
                                  })()}
                                </div>
                                {isNext && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                                )}
                              </div>
                              
                              {/* Session Info */}
                              <div className="space-y-1">
                                <h3 className={cn(
                                  "text-xl font-black tracking-tight",
                                  isToday ? "text-white" : isPast ? "text-gray-400" : "text-white"
                                )}>
                                  {session.name.toUpperCase()}
                                </h3>
                                <p className={cn(
                                  "text-sm font-bold tracking-wide",
                                  isToday ? "text-blue-200" : isPast ? "text-gray-500" : "text-white/70"
                                )}>
                                  {sessionDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  }).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            
                            {/* Time Display */}
                            <div className="text-right space-y-1">
                              {session.localTime && (() => {
                                const sessionDate = new Date(session.date);
                                const userLocalTime = sessionDate.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                });
                                
                                return (
                                  <div className="space-y-1">
                                    {/* Times side by side */}
                                    <div className="flex items-center justify-end gap-3">
                                      {/* Circuit Local Time */}
                                      <div className="text-right">
                                        <div className={cn(
                                          "text-2xl font-black font-mono tracking-tighter",
                                          isToday ? "text-white" : isPast ? "text-gray-400" : "text-white"
                                        )}>
                                          {session.localTime}
                                        </div>
                                        <div className={cn(
                                          "text-xs font-bold tracking-widest uppercase",
                                          isToday ? "text-blue-300" : isPast ? "text-gray-600" : "text-white/50"
                                        )}>
                                          CIRCUIT
                                        </div>
                                      </div>
                                      
                                      {/* Separator */}
                                      <div className="w-px h-12 bg-white/20"></div>
                                      
                                      {/* User Local Time */}
                                      <div className="text-right">
                                        <div className={cn(
                                          "text-2xl font-black font-mono tracking-tighter",
                                          isToday ? "text-blue-200" : isPast ? "text-gray-500" : "text-white/80"
                                        )}>
                                          {userLocalTime}
                                        </div>
                                        <div className={cn(
                                          "text-xs font-bold tracking-widest uppercase",
                                          isToday ? "text-blue-300/80" : isPast ? "text-gray-600" : "text-white/40"
                                        )}>
                                          YOUR TIME
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Info Cards - Conditional Rendering */}
        {!isLoadingResults && sessionResults && sessionResults.length > 0 && ( // Only render if results are loaded and not empty
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 animate-fade-in">
            {/* Case 1: Race or Sprint */}
            {(selectedSession === 'R' || selectedSession === 'Sprint') && (
              <>
                {raceWinner && (
                    <F1Card 
                        title="Race Winner" 
                        value={raceWinner.fullName} 
                        subValue={formatRaceTime(raceWinner.time, true)} // Format race time as H:MM:SS.ms
                        team={getTeamColorClass(raceWinner.team) as any} 
                        icon={<Trophy />} 
                    />
                )}
                {poleSitter && (
                     <F1Card
                        title="Pole Position"
                        value={poleSitter.fullName}
                        subValue={poleSitter.poleLapTimeValue} // Pass the pole lap time
                        team={getTeamColorClass(poleSitter.team) as any}
                        icon={<Zap />}
                     />
                 )}
                {fastestLapHolder && (
                     <F1Card
                        title="Fastest Lap"
                        value={fastestLapHolder.fullName}
                        subValue={fastestLapHolder.fastestLapTimeValue} // Pass the fastest lap time
                        team={getTeamColorClass(fastestLapHolder.team) as any}
                        icon={<Clock />}
                     />
                 )}
              </>
            )}

            {/* Case 2: Practice or Qualifying */}
            {(selectedSession?.startsWith('FP') || selectedSession?.startsWith('Q') || selectedSession?.startsWith('SQ')) && topPerformers.length > 0 && (
              <>
                {topPerformers[0] && (
                  <F1Card
                    title="P1"
                    value={topPerformers[0].fullName}
                    // Prefer formatted value, fallback to raw time string
                    subValue={topPerformers[0].fastestLapTimeValue ?? topPerformers[0].fastestLapTime ?? ''}
                    team={getTeamColorClass(topPerformers[0].team) as any}
                    icon={<Trophy />}
                  />
                )}
                {topPerformers[1] && (
                  <F1Card
                    title="P2"
                    value={topPerformers[1].fullName}
                    subValue={topPerformers[1].fastestLapTimeValue ?? topPerformers[1].fastestLapTime ?? ''}
                    team={getTeamColorClass(topPerformers[1].team) as any}
                    icon={<TrendingUp />} // Use TrendingUp for P2
                  />
                )}
                {topPerformers[2] && (
                  <F1Card
                    title="P3"
                    value={topPerformers[2].fullName}
                    subValue={topPerformers[2].fastestLapTimeValue ?? topPerformers[2].fastestLapTime ?? ''}
                    team={getTeamColorClass(topPerformers[2].team) as any}
                    icon={<TrendingUp />} // Use TrendingUp for P3
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Main Content Area */}
        {isLoadingResults ? (
             <div className="space-y-6 mt-6">
                 <Skeleton className="h-10 w-1/3 bg-gray-800/60 rounded-lg" />
                 <Skeleton className="h-10 w-full bg-gray-800/60 rounded-lg" />
                 <Skeleton className="h-80 w-full bg-gray-800/60 rounded-lg" />
             </div>
        ) : isError && !sessionSchedule ? (
             // Only show error if it's not an upcoming race (no session schedule available)
             <Card className="bg-red-900/20 border-red-500/50 text-red-300 mt-6">
                 <CardHeader>
                     <CardTitle className="flex items-center gap-2"><AlertCircle /> Error Loading Data</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p>{(error as Error)?.message || 'Could not fetch data for the selected session.'}</p>
                     <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm" className="mt-4 border-red-500/50 hover:bg-red-900/30">
                         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                     </Button>
                 </CardContent>
             </Card>
        ) : (!sessionSchedule || (fetchedAvailableSessions && fetchedAvailableSessions.length > 0)) ? (
          <Tabs defaultValue="results" className="mt-6">
            {/* Adjust grid columns based on number of tabs */}
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 p-1 bg-gray-800/80 border border-gray-700 rounded-lg h-auto mb-6">
              <TabsTrigger value="results" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-700/50 rounded-md px-3 py-1.5 text-sm transition-colors"><Users className="w-4 h-4 mr-1.5 inline"/>Results</TabsTrigger>
              {/* Only show Positions tab if it's Race or Sprint */}
              {(selectedSession === 'R' || selectedSession === 'Sprint') && (
                <TabsTrigger value="positions" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-700/50 rounded-md px-3 py-1.5 text-sm transition-colors"><MapPin className="w-4 h-4 mr-1.5 inline"/>Positions</TabsTrigger>
              )}
              <TabsTrigger value="strategy" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-700/50 rounded-md px-3 py-1.5 text-sm transition-colors"><Flag className="w-4 h-4 mr-1.5 inline"/>Strategy</TabsTrigger>
              {/* Show Lap Times, Circuit, Telemetry for all applicable sessions */}
              <TabsTrigger value="laptimes" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-700/50 rounded-md px-3 py-1.5 text-sm transition-colors"><Timer className="w-4 h-4 mr-1.5 inline"/>Lap Times</TabsTrigger>
              <TabsTrigger value="circuit" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-700/50 rounded-md px-3 py-1.5 text-sm transition-colors"><Map className="w-4 h-4 mr-1.5 inline"/>Track Dominance</TabsTrigger>
              <TabsTrigger value="telemetry" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300 hover:bg-gray-700/50 rounded-md px-3 py-1.5 text-sm transition-colors"><BarChart2 className="w-4 h-4 mr-1.5 inline"/>Telemetry</TabsTrigger>
            </TabsList>

            {/* Results Tab */}
            <TabsContent value="results" className="pt-2">
               <h2 className="text-xl font-semibold mb-4 text-white">Session Results: {availableSessions.find(s => s.type === selectedSession)?.name}</h2>
               <SessionResultsTable results={sessionResults} sessionType={selectedSession} year={year} />
            </TabsContent>

            {/* Position Changes Tab (Only for Race 'R' or Sprint) */}
            {(selectedSession === 'R' || selectedSession === 'Sprint') && (
              <TabsContent value="positions" className="pt-2">
                {year && eventName && (
                   <PositionsTabContent year={year} event={eventName} session={selectedSession} />
                )}
              </TabsContent>
            )}

            {/* Lap Times Tab (Show for all sessions now) */}
            <TabsContent value="laptimes" className="pt-2">
              {year && eventName && (
                <>
                  <RacingChart 
                    year={year} 
                    event={eventName} 
                    session={selectedSession} 
                    title="Lap Time Comparison"
                    autoLoad={true}
                  />
                </>
              )}
            </TabsContent>

            {/* Circuit Comparison Tab (Show for all sessions now) */}
            <TabsContent value="circuit" className="pt-2">
              {year && eventName && (
                <>
                  <CircuitComparisonChart
                    year={year}
                    event={eventName}
                    session={selectedSession}
                    onDriversSelected={setCircuitDrivers}
                  />
                  
                  <h2 className="text-xl font-semibold mt-8 mb-4 text-white">Additional Telemetry Comparison</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                    {/* Throttle Comparison */}
                    <DriverComparisonTelemetry
                      year={year}
                      event={eventName}
                      session={selectedSession}
                      driver1={circuitDrivers.driver1}
                      driver2={circuitDrivers.driver2}
                      lap1={circuitDrivers.lap1}
                      lap2={circuitDrivers.lap2}
                      shouldLoadChart={circuitDrivers.shouldLoadChart}
                      telemetryType="throttle"
                      title="Throttle Comparison"
                    />
                    
                    {/* Brake Comparison */}
                    <DriverComparisonTelemetry
                      year={year}
                      event={eventName}
                      session={selectedSession}
                      driver1={circuitDrivers.driver1}
                      driver2={circuitDrivers.driver2}
                      lap1={circuitDrivers.lap1}
                      lap2={circuitDrivers.lap2}
                      shouldLoadChart={circuitDrivers.shouldLoadChart}
                      telemetryType="brake"
                      title="Brake Input Comparison"
                    />
                    
                    {/* RPM Comparison */}
                    <DriverComparisonTelemetry
                      year={year}
                      event={eventName}
                      session={selectedSession}
                      driver1={circuitDrivers.driver1}
                      driver2={circuitDrivers.driver2}
                      lap1={circuitDrivers.lap1}
                      lap2={circuitDrivers.lap2}
                      shouldLoadChart={circuitDrivers.shouldLoadChart}
                      telemetryType="rpm"
                      title="RPM Comparison"
                    />
                    
                    {/* DRS Comparison */}
                    <DriverComparisonTelemetry
                      year={year}
                      event={eventName}
                      session={selectedSession}
                      driver1={circuitDrivers.driver1}
                      driver2={circuitDrivers.driver2}
                      lap1={circuitDrivers.lap1}
                      lap2={circuitDrivers.lap2}
                      shouldLoadChart={circuitDrivers.shouldLoadChart}
                      telemetryType="drs"
                      title="DRS Usage Comparison"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Strategy Tab (Only Race or Sprint) */}
            <TabsContent value="strategy" className="pt-2">
               {year && eventName && (
                 <TireStrategy year={year} event={eventName} session={selectedSession} />
               )}
            </TabsContent>

            {/* Telemetry Tab (Show for all sessions now) */}
            <TabsContent value="telemetry" className="pt-2">
               {year && eventName && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Speed Trace */}
                      <SpeedTraceChart
                          year={year}
                          event={eventName}
                          session={selectedSession}
                          lap={selectedLap} // Pass selected lap state
                          title="" // Title is handled internally now
                      />
                      {/* Gear Map */}
                      <GearMapChart
                          year={year}
                          event={eventName}
                          session={selectedSession}
                          lap={selectedLap} // Pass selected lap state
                      />
                      {/* Throttle */}
                      <ThrottleChart
                          year={year}
                          event={eventName}
                          session={selectedSession}
                          lap={selectedLap}
                      />
                      {/* Brake */}
                      <BrakeChart
                          year={year}
                          event={eventName}
                          session={selectedSession}
                          lap={selectedLap}
                      />
                      {/* RPM */}
                      <RPMChart
                          year={year}
                          event={eventName}
                          session={selectedSession}
                          lap={selectedLap}
                      />
                      {/* DRS */}
                      <DRSChart
                          year={year}
                          event={eventName}
                          session={selectedSession}
                          lap={selectedLap}
                      />
                  </div>
               )}
            </TabsContent>

          </Tabs>
        ) : (
          // Show message for upcoming races with no session data
          <div className="mt-6 text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Race Weekend Awaits</h3>
            <p className="text-gray-400">
              This race hasn't started yet. Check the schedule above for session times.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Race;
