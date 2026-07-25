import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useSeason } from '@/contexts/SeasonContext';
import { Profile } from '@/contexts/AuthContext';
import { ChampionIcon, UserGroupIcon, ArrowRight01Icon, StarIcon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamLogo } from '@/lib/teamUtils';
import { cn } from '@/lib/utils';
import { getDriverImage, getCarImage } from '@/utils/imageMapping';

interface MobileChampionshipWidgetProps {
  drivers: DriverStanding[];
  teams: TeamStanding[];
  schedule: ScheduleEvent[];
  raceResults: RaceResult[];
  isLoading: boolean;
  profile?: Profile | null;
}

const MobileChampionshipWidget: React.FC<MobileChampionshipWidgetProps> = ({
  drivers,
  teams,
  schedule,
  raceResults,
  isLoading,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<'drivers' | 'constructors'>('drivers');
  const topDrivers = drivers.slice(0, 5);
  const topTeams = teams.slice(0, 5);
  const { selectedYear } = useSeason();
  const getDriverImageForYear = (driverCode: string) => getDriverImage(driverCode, selectedYear);

  const isPreSeasonDriver = drivers.length > 0 && drivers[0].points === 0;
  const isPreSeasonTeam = teams.length > 0 && teams[0].points === 0;

  const getGap = (points: number, leaderPoints: number) => {
    const gap = leaderPoints - points;
    return gap === 0 ? 'LEADER' : `-${gap}`;
  };

  // Calculate Driver Championship Status
  let driverChampionshipStatus: 'leader' | 'champion' = 'leader';
  if (drivers.length >= 2 && schedule.length > 0 && raceResults) {
    const p1Points = drivers[0].points;
    const p2Points = drivers[1].points;
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
    driverChampionshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
  }

  // Calculate Team Championship Status
  let teamChampionshipStatus: 'leader' | 'champion' = 'leader';
  if (teams.length >= 2 && schedule.length > 0 && raceResults) {
    const p1Points = teams[0].points;
    const p2Points = teams[1].points;
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
    teamChampionshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-12 bg-zinc-900/50 animate-pulse border-2 border-white/5" />
        <div className="h-64 bg-zinc-900/50 animate-pulse border-2 border-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Selector - Brutalist Style */}
      <div className="flex bg-black border-2 border-white/10 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('drivers')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-black uppercase italic tracking-wider transition-all clip-path-slant rounded-lg',
            activeTab === 'drivers' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
          )}
        >
          <ChampionIcon className="w-4 h-4" />
          Drivers
        </button>
        <button
          onClick={() => setActiveTab('constructors')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-black uppercase italic tracking-wider transition-all clip-path-slant rounded-lg',
            activeTab === 'constructors'
              ? 'bg-red-600 text-white'
              : 'text-gray-500 hover:text-white'
          )}
        >
          <UserGroupIcon className="w-4 h-4" />
          Teams
        </button>
      </div>

      {/* Championship Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: activeTab === 'drivers' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-black border-2 border-white/10 overflow-hidden rounded-xl"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-white/10 flex items-center justify-between bg-zinc-900/30">
          <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
            <span className="w-2 h-6 bg-red-600 block"></span>
            {activeTab === 'drivers' ? 'Drivers' : 'Constructors'}
            <span className="text-gray-500 ml-1">Standings</span>
          </h3>
          <Link
            to={activeTab === 'drivers' ? '/standings/drivers' : '/standings/teams'}
            className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1 hover:text-white transition-colors"
          >
            View All <ArrowRight01Icon className="w-3 h-3" />
          </Link>
        </div>

        {/* Standings List */}
        <div className="divide-y-2 divide-white/5">
          {activeTab === 'drivers'
            ? topDrivers.map((driver, index) => {
                const isFavorite =
                  profile?.favorite_driver &&
                  (driver.code === profile.favorite_driver ||
                    driver.name.toLowerCase().includes(profile.favorite_driver.toLowerCase()));
                const isLeader = index === 0 && !isPreSeasonDriver;
                const isChampion = isLeader && driverChampionshipStatus === 'champion';

                return (
                  <div
                    key={driver.code}
                    className={cn(
                      'flex items-center gap-4 p-4 transition-colors border-l-4',
                      isFavorite ? 'bg-red-600/5 border-red-600' : 'bg-black border-transparent'
                    )}
                  >
                    {/* Position */}
                    <div
                      className={cn(
                        'w-8 h-8 flex items-center justify-center text-sm font-black border-2 rounded-md',
                        isLeader
                          ? 'bg-yellow-500 text-black border-yellow-500'
                          : 'bg-zinc-900 text-gray-400 border-white/10'
                      )}
                    >
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar
                      className={cn(
                        'h-10 w-10 border-2 rounded-md',
                        isFavorite ? 'border-red-600' : 'border-white/10'
                      )}
                    >
                      <AvatarImage
                        src={getDriverImageForYear(driver.code)}
                        className="object-cover object-top bg-zinc-900"
                      />
                      <AvatarFallback className="bg-zinc-900 text-xs rounded-md font-bold">
                        {driver.code}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Team */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base uppercase italic truncate text-white">
                          {driver.name.split(' ').pop()}
                        </span>
                        {isChampion && (
                          <span className="bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                            Champ
                          </span>
                        )}
                        {isFavorite && !isChampion && (
                          <StarIcon className="w-3 h-3 text-red-600 fill-red-600" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase truncate">
                        {driver.team}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-lg font-black tabular-nums text-white leading-none">
                        {driver.points}
                      </div>
                      <div
                        className={cn(
                          'text-[10px] font-mono mt-0.5',
                          isLeader ? 'text-yellow-500' : 'text-gray-600'
                        )}
                      >
                        {getGap(driver.points, topDrivers[0].points)}
                      </div>
                    </div>
                  </div>
                );
              })
            : topTeams.map((team, index) => {
                const isFavorite =
                  profile?.favorite_team &&
                  (team.team === profile.favorite_team ||
                    team.team.toLowerCase().includes(profile.favorite_team.toLowerCase()));
                const isLeader = index === 0 && !isPreSeasonTeam;
                const isChampion = isLeader && teamChampionshipStatus === 'champion';

                return (
                  <Link
                    key={team.team}
                    to="/standings/teams"
                    className={cn(
                      'flex items-center gap-4 p-4 active:bg-zinc-900 transition-colors border-l-4',
                      isFavorite ? 'bg-red-600/5 border-red-600' : 'bg-black border-transparent'
                    )}
                  >
                    {/* Position */}
                    <div
                      className={cn(
                        'w-8 h-8 flex items-center justify-center text-sm font-black border-2 rounded-md',
                        isLeader
                          ? 'bg-yellow-500 text-black border-yellow-500'
                          : 'bg-zinc-900 text-gray-400 border-white/10'
                      )}
                    >
                      {index + 1}
                    </div>

                    {/* Car Image */}
                    <div className="h-10 w-16 flex items-center justify-center bg-transparent rounded-md border-2 border-white/10 p-1">
                      {getCarImage(team.team, selectedYear) ? (
                        <img
                          src={getCarImage(team.team, selectedYear)!}
                          alt={team.team}
                          className="w-full h-full object-contain drop-shadow-md [mix-blend-mode:lighten]"
                        />
                      ) : (
                        <UserGroupIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base uppercase italic truncate text-white">
                          {team.team}
                        </span>
                        {isChampion && (
                          <span className="bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                            Champ
                          </span>
                        )}
                        {isFavorite && !isChampion && (
                          <StarIcon className="w-3 h-3 text-red-600 fill-red-600" />
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-lg font-black tabular-nums text-white leading-none">
                        {team.points}
                      </div>
                      <div
                        className={cn(
                          'text-[10px] font-mono mt-0.5',
                          isLeader ? 'text-yellow-500' : 'text-gray-600'
                        )}
                      >
                        {getGap(team.points, topTeams[0].points)}
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* View All Link */}
        <Link
          to={activeTab === 'drivers' ? '/standings/drivers' : '/standings/teams'}
          className="flex items-center justify-center gap-2 p-4 border-t-2 border-white/10 text-xs font-bold uppercase tracking-widest text-gray-500 active:bg-zinc-900 transition-colors hover:text-white"
        >
          Full Standings <ArrowRight01Icon className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
};

export { MobileChampionshipWidget };
export default MobileChampionshipWidget;
