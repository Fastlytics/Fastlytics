import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowLeft, Trophy, MinusCircle, Award,
  AlertCircle, ArrowUp, ArrowDown, ChevronDown,
  User, Flag, Medal, Clock
} from 'lucide-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import LandingFooter from '@/components/LandingFooter';
import { Button } from "@/components/ui/button";
import { fetchDriverStandings, DriverStanding } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';

// Define rookies by season year
const rookiesByYear: { [year: string]: string[] } = {
  '2025': ['ANT', 'BOR', 'DOO', 'BEA', 'HAD', 'LAW', 'COL'],
  '2024': ['BEA', 'COL'],
  '2023': ['PIA', 'SAR', 'DEV'],
  '2022': ['ZHO'],
  '2021': ['MSC', 'MAZ', 'TSU'],
  '2020': ['LAT'],
  '2019': ['NOR', 'RUS', 'ALB']
};

// Helper function to check if a driver is a rookie in a given year
const isRookie = (driverCode: string, year: number): boolean => {
  const yearStr = year.toString();
  return rookiesByYear[yearStr]?.includes(driverCode) || false;
};

// Define driver numbers for recent years
const driverNumbers: { [year: string]: { [driverCode: string]: number } } = {
  '2025': {
    'VER': 1, 'HAM': 44, 'NOR': 4, 'LEC': 16, 'SAI': 55, 'RUS': 63, 'PIA': 81,
    'ALO': 14, 'STR': 18, 'OCO': 31, 'GAS': 10, 'HUL': 27, 'MAG': 20,
    'ALB': 23, 'TSU': 22, 'ZHO': 24, 'BOT': 77, 'LAW': 40, 'ANT': 87, 'BOR': 84,
    'BEA': 28, 'DOO': 61, 'HAD': 50, 'COL': 43
  },
  '2024': {
    'VER': 1, 'HAM': 44, 'NOR': 4, 'LEC': 16, 'SAI': 55, 'RUS': 63, 'PIA': 81,
    'ALO': 14, 'STR': 18, 'OCO': 31, 'GAS': 10, 'HUL': 27, 'MAG': 20,
    'ALB': 23, 'TSU': 22, 'ZHO': 24, 'BOT': 77, 'RIC': 3, 'SAR': 2, 'BEA': 50, 'COL': 43
  },
  '2023': {
    'VER': 1, 'HAM': 44, 'NOR': 4, 'LEC': 16, 'SAI': 55, 'RUS': 63, 'PIA': 81,
    'ALO': 14, 'STR': 18, 'OCO': 31, 'GAS': 10, 'HUL': 27, 'MAG': 20,
    'ALB': 23, 'TSU': 22, 'ZHO': 24, 'BOT': 77, 'RIC': 3, 'SAR': 2, 'DEV': 21
  },
  '2022': {
    'VER': 1, 'HAM': 44, 'LEC': 16, 'SAI': 55, 'RUS': 63,
    'PER': 11, 'NOR': 4, 'RIC': 3, 'ALO': 14, 'OCO': 31,
    'GAS': 10, 'TSU': 22, 'VET': 5, 'STR': 18, 'ZHO': 24,
    'BOT': 77, 'ALB': 23, 'LAT': 6, 'MSC': 47, 'MAG': 20
  },
  '2021': {
    'VER': 33, 'HAM': 44, 'BOT': 77, 'NOR': 4, 'PER': 11,
    'LEC': 16, 'RIC': 3, 'SAI': 55, 'TSU': 22, 'STR': 18,
    'RAI': 7, 'ALO': 14, 'GAS': 10, 'OCO': 31, 'VET': 5,
    'GIO': 99, 'RUS': 63, 'MSC': 47, 'MAZ': 9, 'LAT': 6
  },
  '2020': {
    'HAM': 44, 'BOT': 77, 'VER': 33, 'PER': 11, 'RIC': 3,
    'SAI': 55, 'ALB': 23, 'LEC': 16, 'NOR': 4, 'GAS': 10,
    'STR': 18, 'OCO': 31, 'VET': 5, 'KVY': 26, 'HUL': 27,
    'RAI': 7, 'GIO': 99, 'MAG': 20, 'LAT': 6, 'GRO': 8, 'RUS': 63
  },
  '2019': {
    'HAM': 44, 'BOT': 77, 'VER': 33, 'LEC': 16, 'VET': 5,
    'SAI': 55, 'GAS': 10, 'ALB': 23, 'RIC': 3, 'PER': 11,
    'NOR': 4, 'RAI': 7, 'KVY': 26, 'HUL': 27, 'STR': 18,
    'MAG': 20, 'KUB': 88, 'GRO': 8, 'GIO': 99, 'RUS': 63
  }
};

// Get driver number
const getDriverNumber = (driverCode: string, year: number): number | null => {
  const yearStr = year.toString();
  return driverNumbers[yearStr]?.[driverCode] || null;
};

const DriverStandings = () => {
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const standingsRef = useRef(null);
  const isStandingsInView = useInView(standingsRef, { once: true, amount: 0.1 });

  // Fetch Driver Standings
  const { data: driverStandings, isLoading, error, isError } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
  });

  // Function to determine change indicator color and icon
  const getChangeIndicator = (change: number | undefined) => {
    if (change === undefined) return null;
    if (change > 0) return { color: 'text-green-500', icon: <ArrowUp className="h-4 w-4" /> };
    if (change < 0) return { color: 'text-red-500', icon: <ArrowDown className="h-4 w-4" /> };
    return { color: 'text-gray-500', icon: <MinusCircle className="h-4 w-4" /> };
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
    if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
    return 'gray';
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
                <ArrowLeft className="h-6 w-6" />
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
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-[180px] bg-black border-2 border-gray-800 text-white hover:border-red-600 rounded-none font-bold uppercase tracking-widest h-12">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-red-600" />
                  <span>{selectedYear} Season</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-2 border-gray-800 text-white rounded-none">
                <SelectGroup>
                  <SelectLabel className="text-gray-500 text-xs uppercase tracking-wider px-2 py-2">Select Season</SelectLabel>
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

        {/* Standings List */}
        <div className="w-full">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-900/50 animate-pulse border-2 border-gray-800"></div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20 border-2 border-red-600/50 border-dashed bg-red-900/10">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-xl font-bold uppercase mb-2">Data Unavailable</h3>
              <p className="text-gray-500 font-mono text-sm">
                {(error as Error)?.message || 'Please try again later.'}
              </p>
            </div>
          ) : driverStandings && driverStandings.length > 0 ? (
            <div className="space-y-4">
              {driverStandings.map((driver, index) => {
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
                    <div className={cn(
                      "flex items-center justify-between p-4 md:p-6 bg-black border-2 border-gray-800 hover:border-red-600 transition-all duration-300 relative overflow-hidden",
                      index === 0 ? "border-yellow-500/50" : ""
                    )}>
                      {/* Team Color Bar */}
                      <div className={cn("absolute left-0 top-0 bottom-0 w-2", `bg-f1-${teamColor}`)} />

                      <div className="flex items-center gap-6 md:gap-12 pl-4">
                        {/* Rank */}
                        <div className="w-12 text-center">
                          <span className={cn(
                            "text-3xl md:text-4xl font-black italic tracking-tighter",
                            index === 0 ? "text-yellow-500" :
                              index === 1 ? "text-gray-300" :
                                index === 2 ? "text-amber-700" : "text-white"
                          )}>
                            {driver.rank}
                          </span>
                        </div>

                        {/* Driver Info */}
                        <div className="flex items-center gap-4">
                          {driverNumber && (
                            <div className="hidden md:flex w-12 h-12 items-center justify-center font-black text-xl bg-gray-900 border border-gray-800 text-gray-500 group-hover:text-white transition-colors">
                              {driverNumber}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">{driver.name}</h2>
                              {driverIsRookie && (
                                <span className="text-[10px] font-bold uppercase bg-blue-600 text-white px-1.5 py-0.5">Rookie</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-500">
                              <span className={cn("w-2 h-2 rounded-full", `bg-f1-${teamColor}`)}></span>
                              <span>{driver.team}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-8 md:gap-16 pr-4">
                        <div className="hidden md:block text-right">
                          <div className="text-2xl font-bold">{driver.wins}</div>
                          <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Wins</div>
                        </div>
                        <div className="hidden md:block text-right">
                          <div className="text-2xl font-bold">{driver.podiums}</div>
                          <div className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Podiums</div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className="text-3xl font-black text-white">{driver.points}</div>
                          <div className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                            <span>PTS</span>
                            {indicator && (
                              <span className={indicator.color}>
                                {indicator.icon}
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
          ) : (
            <div className="text-center py-20 border-2 border-gray-800 border-dashed">
              <p className="text-gray-500 font-mono">No standings found for {selectedYear}.</p>
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default DriverStandings;
