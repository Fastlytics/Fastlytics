import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowLeft, Trophy, MinusCircle, Award,
  AlertCircle, ArrowUp, ArrowDown, ChevronDown,
  Building
} from 'lucide-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import LandingFooter from '@/components/LandingFooter';
import { Button } from "@/components/ui/button";
import { fetchTeamStandings, TeamStanding } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';

const TeamStandings = () => {
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const standingsRef = useRef(null);
  const isStandingsInView = useInView(standingsRef, { once: true, amount: 0.1 });

  // Fetch Team Standings
  const { data: teamStandings, isLoading, error, isError } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
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
                Constructor <span className="text-red-600">Standings</span>
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
          ) : teamStandings && teamStandings.length > 0 ? (
            <div className="space-y-4">
              {teamStandings.map((team, index) => {
                const indicator = getChangeIndicator(team.points_change);
                const rank = team.rank || index + 1;
                const teamColor = team.teamColor || getTeamColorClass(team.team);

                return (
                  <motion.div
                    key={team.shortName || team.team}
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
                            {rank}
                          </span>
                        </div>

                        {/* Team Info */}
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "hidden md:flex w-12 h-12 rounded-lg items-center justify-center bg-gray-900/50 border border-gray-800",
                            `text-f1-${teamColor}`
                          )}>
                            <Building className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">{team.team}</h2>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                <span className="font-bold text-white">{team.wins || 0}</span>
                                <span className="text-[10px] uppercase tracking-wider">Wins</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Award className="w-3 h-3 text-amber-500" />
                                <span className="font-bold text-white">{team.podiums || 0}</span>
                                <span className="text-[10px] uppercase tracking-wider">Podiums</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="flex items-center gap-8 md:gap-16 pr-4">
                        <div className="text-right min-w-[80px]">
                          <div className="text-3xl font-black text-white">{team.points}</div>
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

export default TeamStandings;
