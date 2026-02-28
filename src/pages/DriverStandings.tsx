import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion, useInView } from 'framer-motion';
import {
  ArrowLeft01Icon,
  ChampionIcon,
  MinusSignCircleIcon,
  Award01Icon,
  AlertCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserIcon,
  Flag01Icon,
  Medal01Icon,
  Clock01Icon,
  CrownIcon,
} from 'hugeicons-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { Button } from '@/components/ui/button';
import {
  fetchDriverStandings,
  DriverStanding,
  fetchSchedule,
  fetchRaceResults,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDriverStandings } from '@/components/mobile';

// Define rookies by season year
const rookiesByYear: { [year: string]: string[] } = {
  '2025': ['ANT', 'BOR', 'DOO', 'BEA', 'HAD', 'LAW', 'COL'],
  '2024': ['BEA', 'COL'],
  '2023': ['PIA', 'SAR', 'DEV'],
  '2022': ['ZHO'],
  '2021': ['MSC', 'MAZ', 'TSU'],
  '2020': ['LAT'],
  '2019': ['NOR', 'RUS', 'ALB'],
};

// Helper function to check if a driver is a rookie in a given year
const isRookie = (driverCode: string, year: number): boolean => {
  const yearStr = year.toString();
  return rookiesByYear[yearStr]?.includes(driverCode) || false;
};

// Define driver numbers for recent years
const driverNumbers: { [year: string]: { [driverCode: string]: number } } = {
  '2025': {
    VER: 1,
    HAM: 44,
    NOR: 4,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PIA: 81,
    ALO: 14,
    STR: 18,
    OCO: 31,
    GAS: 10,
    HUL: 27,
    MAG: 20,
    ALB: 23,
    TSU: 22,
    ZHO: 24,
    BOT: 77,
    LAW: 40,
    ANT: 87,
    BOR: 84,
    BEA: 28,
    DOO: 61,
    HAD: 50,
    COL: 43,
  },
  '2024': {
    VER: 1,
    HAM: 44,
    NOR: 4,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PIA: 81,
    ALO: 14,
    STR: 18,
    OCO: 31,
    GAS: 10,
    HUL: 27,
    MAG: 20,
    ALB: 23,
    TSU: 22,
    ZHO: 24,
    BOT: 77,
    RIC: 3,
    SAR: 2,
    BEA: 50,
    COL: 43,
  },
  '2023': {
    VER: 1,
    HAM: 44,
    NOR: 4,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PIA: 81,
    ALO: 14,
    STR: 18,
    OCO: 31,
    GAS: 10,
    HUL: 27,
    MAG: 20,
    ALB: 23,
    TSU: 22,
    ZHO: 24,
    BOT: 77,
    RIC: 3,
    SAR: 2,
    DEV: 21,
  },
  '2022': {
    VER: 1,
    HAM: 44,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PER: 11,
    NOR: 4,
    RIC: 3,
    ALO: 14,
    OCO: 31,
    GAS: 10,
    TSU: 22,
    VET: 5,
    STR: 18,
    ZHO: 24,
    BOT: 77,
    ALB: 23,
    LAT: 6,
    MSC: 47,
    MAG: 20,
  },
  '2021': {
    VER: 33,
    HAM: 44,
    BOT: 77,
    NOR: 4,
    PER: 11,
    LEC: 16,
    RIC: 3,
    SAI: 55,
    TSU: 22,
    STR: 18,
    RAI: 7,
    ALO: 14,
    GAS: 10,
    OCO: 31,
    VET: 5,
    GIO: 99,
    RUS: 63,
    MSC: 47,
    MAZ: 9,
    LAT: 6,
  },
  '2020': {
    HAM: 44,
    BOT: 77,
    VER: 33,
    PER: 11,
    RIC: 3,
    SAI: 55,
    ALB: 23,
    LEC: 16,
    NOR: 4,
    GAS: 10,
    STR: 18,
    OCO: 31,
    VET: 5,
    KVY: 26,
    HUL: 27,
    RAI: 7,
    GIO: 99,
    MAG: 20,
    LAT: 6,
    GRO: 8,
    RUS: 63,
  },
  '2019': {
    HAM: 44,
    BOT: 77,
    VER: 33,
    LEC: 16,
    VET: 5,
    SAI: 55,
    GAS: 10,
    ALB: 23,
    RIC: 3,
    PER: 11,
    NOR: 4,
    RAI: 7,
    KVY: 26,
    HUL: 27,
    STR: 18,
    MAG: 20,
    KUB: 88,
    GRO: 8,
    GIO: 99,
    RUS: 63,
  },
};

// Get driver number
const getDriverNumber = (driverCode: string, year: number): number | null => {
  const yearStr = year.toString();
  return driverNumbers[yearStr]?.[driverCode] || null;
};

const isTestingEvent = (event: ScheduleEvent): boolean =>
  Boolean(event.EventFormat?.toLowerCase().includes('test') || event.RoundNumber === 0);

const DriverStandings = () => {
  const [now] = useState(() => Date.now());
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const { trackEvent, trackPageView } = useAnalytics();
  const standingsRef = useRef(null);

  useEffect(() => {
    trackPageView('driver_standings', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isStandingsInView = useInView(standingsRef, { once: true, amount: 0.1 });

  const getDriverImg = (driverCode: string) => {
    return getDriverImage(driverCode, selectedYear);
  };

  // Fetch Driver Standings
  const {
    data: driverStandings,
    isLoading: isLoadingStandings,
    error: standingsError,
    isError: isStandingsError,
  } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
  });

  // Fetch Schedule for championship calculation
  const { data: schedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

  const hasCompletedRaceEventsInSchedule = useMemo(
    () =>
      (schedule ?? []).some(
        (event) => !isTestingEvent(event) && new Date(event.EventDate).getTime() <= now
      ),
    [schedule, now]
  );

  // Fetch Race Results for championship calculation
  const { data: raceResults } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
    enabled: hasCompletedRaceEventsInSchedule,
  });

  const isLoading = isLoadingStandings;
  const isError = isStandingsError;
  const error = standingsError;

  // Function to determine change indicator color and icon
  const getChangeIndicator = (change: number | undefined) => {
    if (change === undefined) return null;
    if (change > 0) return { color: 'text-green-500', icon: <ArrowUp01Icon className="h-4 w-4" /> };
    if (change < 0) return { color: 'text-red-500', icon: <ArrowDown01Icon className="h-4 w-4" /> };
    return { color: 'text-gray-500', icon: <MinusSignCircleIcon className="h-4 w-4" /> };
  };

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
    if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri'))
      return 'alphatauri';
    return 'gray';
  };

  const isPreSeason =
    driverStandings && driverStandings.length > 0 && driverStandings[0].points === 0;
  const top3 = isPreSeason ? [] : driverStandings?.slice(0, 3) || [];
  const rest = isPreSeason ? driverStandings || [] : driverStandings?.slice(3) || [];

  // Calculate Championship Status
  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (driverStandings && driverStandings.length >= 2 && schedule && raceResults) {
    const p1Points = driverStandings[0].points;
    const p2Points = driverStandings[1].points;
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
    championshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
  }

  // Render mobile version (after all hooks)
  if (isMobile) {
    return <MobileDriverStandings />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <DashboardNavbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" ref={standingsRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b-2 border-gray-800 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-white hover:bg-gray-800"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft01Icon className="h-6 w-6" />
              </Button>
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                Driver <span className="text-red-600">Standings</span>
              </h1>
            </div>
            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest ml-14">
              {selectedYear} Season Overview
            </p>
          </div>

          {/* Season Selector */}
          <div className="relative">
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => {
                setSelectedYear(Number(value));
                trackEvent('season_changed', { page: 'driver_standings', year: Number(value) });
              }}
            >
              <SelectTrigger className="w-[180px] bg-black border-2 border-gray-800 text-white hover:border-red-600 rounded-none font-bold uppercase tracking-widest h-12">
                <div className="flex items-center gap-2">
                  <ChampionIcon className="w-4 h-4 text-red-600" />
                  <span>{selectedYear} Season</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-2 border-gray-800 text-white rounded-none">
                <SelectGroup>
                  <SelectLabel className="text-gray-500 text-xs uppercase tracking-wider px-2 py-2">
                    Select Season
                  </SelectLabel>
                  {availableYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={String(year)}
                      className="text-sm font-bold uppercase tracking-widest focus:bg-red-600 focus:text-white cursor-pointer rounded-none"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-900/50 animate-pulse border-2 border-gray-800"
                ></div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20 border-2 border-red-600/50 border-dashed bg-red-900/10">
              <AlertCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-xl font-bold uppercase mb-2">Data Unavailable</h3>
              <p className="text-gray-500 font-mono text-sm">
                {(error as Error)?.message || 'Please try again later.'}
              </p>
            </div>
          ) : driverStandings && driverStandings.length > 0 ? (
            <>
              {/* Podium Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end">
                {/* P2 */}
                {top3[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="order-2 md:order-1 relative group"
                  >
                    <div className="bg-black border-2 border-gray-800 hover:border-gray-500 transition-colors p-6 relative overflow-hidden flex flex-col h-full justify-end">
                      <div
                        className={`absolute top-0 left-0 w-full h-1 bg-f1-${getTeamColorClass(top3[1].team)}`}
                      />
                      <div className="text-6xl font-black text-gray-800 absolute top-4 right-4 opacity-50">
                        2
                      </div>

                      {/* Driver Image - Waist Up */}
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 z-0">
                        <img
                          src={getDriverImg(top3[1].code)}
                          alt={top3[1].name}
                          className="w-full h-full object-cover object-top"
                          style={{
                            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                          }}
                        />
                      </div>

                      <div className="relative z-10 mt-32 flex flex-col items-center text-center">
                        <div className="text-xs font-mono text-gray-400 uppercase mb-2">
                          {top3[1].team}
                        </div>
                        <h2 className="text-2xl font-bold uppercase leading-none mb-4">
                          {top3[1].name}
                        </h2>
                        <div className="flex items-end gap-2 mb-6">
                          <span className="text-4xl font-black text-white">{top3[1].points}</span>
                          <span className="text-sm font-mono text-gray-500 mb-1">PTS</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                          <div className="bg-gray-900/50 border border-gray-800 p-2 rounded flex flex-col items-center justify-center group-hover:border-gray-600 transition-colors">
                            <span className="text-xl font-bold text-white leading-none">
                              {top3[1].wins}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">
                              Wins
                            </span>
                          </div>
                          <div className="bg-gray-900/50 border border-gray-800 p-2 rounded flex flex-col items-center justify-center group-hover:border-gray-600 transition-colors">
                            <span className="text-xl font-bold text-white leading-none">
                              {top3[1].podiums}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">
                              Podiums
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* P1 */}
                {top3[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="order-1 md:order-2 relative group transform md:-translate-y-8"
                  >
                    <div className="bg-black border-2 border-yellow-500 p-8 relative overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.1)] flex flex-col h-full justify-end">
                      <div
                        className={`absolute top-0 left-0 w-full h-1 bg-f1-${getTeamColorClass(top3[0].team)}`}
                      />
                      <div className="absolute -top-4 -right-4 text-yellow-500/10">
                        <CrownIcon className="w-32 h-32" />
                      </div>

                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full text-center">
                        <div className="inline-block px-3 py-1 bg-yellow-500 text-black font-bold text-xs uppercase tracking-widest shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                          {championshipStatus === 'champion'
                            ? 'World Champion'
                            : 'World Champion Leader'}
                        </div>
                      </div>

                      {/* Driver Image - Waist Up (Same style as P2/P3 but slightly larger) */}
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-56 h-56 z-0">
                        <img
                          src={getDriverImg(top3[0].code)}
                          alt={top3[0].name}
                          className="w-full h-full object-cover object-top"
                          style={{
                            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                          }}
                        />
                      </div>

                      <div className="relative z-10 mt-48 text-center flex flex-col items-center w-full">
                        <div className="text-sm font-mono text-gray-300 uppercase mb-2">
                          {top3[0].team}
                        </div>
                        <h2 className="text-4xl font-black uppercase leading-none mb-6">
                          {top3[0].name}
                        </h2>
                        <div className="flex justify-center items-end gap-2 mb-8">
                          <span className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            {top3[0].points}
                          </span>
                          <span className="text-lg font-mono text-gray-500 mb-2">PTS</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                          <div className="bg-gradient-to-br from-yellow-500/20 to-black border border-yellow-500/30 p-3 rounded flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white leading-none">
                              {top3[0].wins}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-yellow-500/80 mt-1 font-bold">
                              Wins
                            </span>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-500/20 to-black border border-yellow-500/30 p-3 rounded flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white leading-none">
                              {top3[0].podiums}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-yellow-500/80 mt-1 font-bold">
                              Podiums
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* P3 */}
                {top3[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="order-3 relative group"
                  >
                    <div className="bg-black border-2 border-gray-800 hover:border-amber-700 transition-colors p-6 relative overflow-hidden flex flex-col h-full justify-end">
                      <div
                        className={`absolute top-0 left-0 w-full h-1 bg-f1-${getTeamColorClass(top3[2].team)}`}
                      />
                      <div className="text-6xl font-black text-gray-800 absolute top-4 right-4 opacity-50">
                        3
                      </div>

                      {/* Driver Image - Waist Up */}
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 z-0">
                        <img
                          src={getDriverImg(top3[2].code)}
                          alt={top3[2].name}
                          className="w-full h-full object-cover object-top"
                          style={{
                            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                          }}
                        />
                      </div>

                      <div className="relative z-10 mt-32 flex flex-col items-center text-center">
                        <div className="text-xs font-mono text-gray-400 uppercase mb-2">
                          {top3[2].team}
                        </div>
                        <h2 className="text-2xl font-bold uppercase leading-none mb-4">
                          {top3[2].name}
                        </h2>
                        <div className="flex items-end gap-2 mb-6">
                          <span className="text-4xl font-black text-white">{top3[2].points}</span>
                          <span className="text-sm font-mono text-gray-500 mb-1">PTS</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                          <div className="bg-gray-900/50 border border-gray-800 p-2 rounded flex flex-col items-center justify-center group-hover:border-gray-600 transition-colors">
                            <span className="text-xl font-bold text-white leading-none">
                              {top3[2].wins}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">
                              Wins
                            </span>
                          </div>
                          <div className="bg-gray-900/50 border border-gray-800 p-2 rounded flex flex-col items-center justify-center group-hover:border-gray-600 transition-colors">
                            <span className="text-xl font-bold text-white leading-none">
                              {top3[2].podiums}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">
                              Podiums
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Rest of the Grid */}
              <div className="space-y-2">
                {rest.map((driver, index) => {
                  const indicator = getChangeIndicator(driver.points_change);
                  const teamColor = getTeamColorClass(driver.team);
                  const driverIsRookie = isRookie(driver.code, selectedYear);
                  const driverNumber = getDriverNumber(driver.code, selectedYear);

                  return (
                    <motion.div
                      key={driver.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isStandingsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between p-4 bg-black border border-gray-800 hover:border-red-600 transition-all duration-300 relative overflow-hidden">
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-red-600/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />

                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-8 text-center font-mono text-gray-500 font-bold">
                            {driver.rank}
                          </div>
                          <div className={`w-1 h-8 bg-f1-${teamColor}`} />
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-gray-800">
                              <AvatarImage
                                src={getDriverImg(driver.code)}
                                className="object-cover object-top bg-gray-800"
                              />
                              <AvatarFallback>{driver.code}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold uppercase text-lg">{driver.name}</h3>
                                {driverIsRookie && (
                                  <span className="text-[10px] font-bold uppercase bg-blue-600 text-white px-1.5 py-0.5">
                                    Rookie
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono text-gray-500 uppercase">
                                {driver.team}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 relative z-10">
                          <div className="hidden md:block text-right">
                            <div className="text-sm font-bold text-white">{driver.wins}</div>
                            <div className="text-[10px] text-gray-600 uppercase">Wins</div>
                          </div>
                          <div className="hidden md:block text-right">
                            <div className="text-sm font-bold text-white">{driver.podiums}</div>
                            <div className="text-[10px] text-gray-600 uppercase">Podiums</div>
                          </div>
                          <div className="w-24 text-right">
                            <div className="text-xl font-black text-white">{driver.points}</div>
                            <div className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                              <span>PTS</span>
                              {indicator && (
                                <span className={cn('flex items-center gap-0.5', indicator.color)}>
                                  {indicator.icon}
                                  {driver.points_change !== undefined &&
                                    driver.points_change !== 0 && (
                                      <span>{Math.abs(driver.points_change)}</span>
                                    )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20 border-2 border-gray-800 border-dashed">
              <p className="text-gray-500 font-mono">No standings found for {selectedYear}.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export { DriverStandings };
export default DriverStandings;
