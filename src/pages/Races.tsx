import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowLeft, Flag, Calendar, AlertCircle,
  Clock, Trophy, ChevronDown, Medal, Users
} from 'lucide-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import LandingFooter from '@/components/LandingFooter';
import { Button } from "@/components/ui/button";
import { fetchRaceResults, RaceResult, fetchSchedule, ScheduleEvent } from '@/lib/api';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';

// Country name to ISO country code mapping for flags
const getCountryCode = (location: string | undefined): string => {
  if (!location) return 'xx';
  const cleanLocation = location.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const countryMap: Record<string, string> = {
    'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az', 'Bahrain': 'bh',
    'Belgium': 'be', 'Brazil': 'br', 'Canada': 'ca', 'China': 'cn',
    'Denmark': 'dk', 'Emilia Romagna': 'it', 'France': 'fr', 'Germany': 'de',
    'Great Britain': 'gb', 'United Kingdom': 'gb', 'Hungary': 'hu', 'India': 'in',
    'Italy': 'it', 'Japan': 'jp', 'Las Vegas': 'us', 'Malaysia': 'my',
    'Mexico': 'mx', 'Miami': 'us', 'Monaco': 'mc', 'Netherlands': 'nl',
    'Portugal': 'pt', 'Qatar': 'qa', 'Russia': 'ru', 'Saudi Arabia': 'sa',
    'Singapore': 'sg', 'South Africa': 'za', 'Spain': 'es', 'Styria': 'at',
    'Turkey': 'tr', 'Abu Dhabi': 'ae', 'United States': 'us', 'USA': 'us',
    'Sakhir': 'bh', 'Miami Gardens': 'us', 'Jeddah': 'sa', 'Lusail': 'qa',
    'Imola': 'it', 'Monza': 'it', 'São Paulo': 'br', 'Spielberg': 'at',
    'Silverstone': 'gb', 'Spa': 'be', 'Zandvoort': 'nl', 'Austin': 'us',
    'Montréal': 'ca', 'Montreal': 'ca', 'Shanghai': 'cn', 'Baku': 'az',
    'Barcelona': 'es', 'Budapest': 'hu', 'Suzuka': 'jp', 'Mexico City': 'mx'
  };
  for (const [country, code] of Object.entries(countryMap)) {
    if (cleanLocation.includes(country)) return code.toLowerCase();
  }
  return 'xx';
};

const Races = () => {
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const racesRef = useRef(null);
  const isRacesInView = useInView(racesRef, { once: true, amount: 0.1 });

  // Fetch Full Schedule
  const { data: scheduleData, isLoading: isLoadingSchedule, error: scheduleError } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

  // Fetch Race Results Summary
  const { data: resultsData, isLoading: isLoadingResults, error: resultsError } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
  });

  // Combine schedule and results data
  const combinedRaceData = useMemo(() => {
    if (!scheduleData) return [];
    const resultsMap = new Map(resultsData?.map(res => [res.event, res]));
    const now = new Date();
    const nearFuture = new Date();
    nearFuture.setDate(now.getDate() + 3);

    return scheduleData.map(event => {
      const result = resultsMap.get(event.EventName);
      const eventDate = new Date(event.EventDate);
      const isUpcoming = eventDate > now;
      const isOngoing = isUpcoming && eventDate <= nearFuture;

      return {
        ...event,
        result,
        isUpcoming,
        isOngoing,
        displayDate: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        countryCode: getCountryCode(event.Country || event.Location)
      };
    });
  }, [scheduleData, resultsData]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <DashboardNavbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" ref={racesRef}>
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
                Race <span className="text-red-600">Calendar</span>
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

        {/* Grid Layout */}
        <div className="w-full">
          {isLoadingSchedule || isLoadingResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-900/50 animate-pulse border-2 border-gray-800"></div>
              ))}
            </div>
          ) : scheduleError || resultsError ? (
            <div className="text-center py-20 border-2 border-red-600/50 border-dashed bg-red-900/10">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-xl font-bold uppercase mb-2">Data Unavailable</h3>
              <p className="text-gray-500 font-mono text-sm">
                Could not load race data for {selectedYear}.
              </p>
            </div>
          ) : combinedRaceData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combinedRaceData.map((race, index) => (
                <motion.div
                  key={`${selectedYear}-${race.EventName}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isRacesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/race/${selectedYear}-${race.EventName.toLowerCase().replace(/\s+/g, '-')}`)}
                  className="group cursor-pointer"
                >
                  <div className="bg-black border-2 border-gray-800 hover:border-red-600 transition-colors h-full flex flex-col relative overflow-hidden">
                    {/* Status Indicator */}
                    <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase tracking-wider ${race.isOngoing ? 'bg-yellow-500 text-black' :
                        race.isUpcoming ? 'bg-blue-600 text-white' :
                          'bg-gray-800 text-gray-400'
                      }`}>
                      {race.isOngoing ? 'Live' : race.isUpcoming ? 'Upcoming' : 'Finished'}
                    </div>

                    <div className="p-6 flex-grow">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-8 bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden">
                          {race.countryCode && (
                            <img
                              src={`https://flagcdn.com/h40/${race.countryCode}.png`}
                              alt={race.Country || race.Location}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-mono text-gray-500 uppercase">Round {race.RoundNumber}</div>
                          <h3 className="font-bold text-lg leading-tight uppercase group-hover:text-red-500 transition-colors">{race.EventName}</h3>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="font-mono">{race.displayDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Flag className="w-4 h-4" />
                          <span className="font-mono">{race.Location}</span>
                        </div>
                      </div>

                      {race.result && (
                        <div className="mt-6 pt-4 border-t border-gray-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Medal className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold text-white">{race.result.driver}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono pl-6">
                            <Users className="w-3 h-3" />
                            <span>{race.result.team}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover Effect Bar */}
                    <div className="h-1 w-0 bg-red-600 group-hover:w-full transition-all duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-gray-800 border-dashed">
              <p className="text-gray-500 font-mono">No races found for {selectedYear}.</p>
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default Races;
