import React from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useSeason } from '@/contexts/SeasonContext';
import { Profile } from '@/contexts/AuthContext';
import { ArrowRight01Icon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage, getCarImage } from '@/utils/imageMapping';

interface ChampionshipWidgetProps {
  drivers: DriverStanding[];
  teams: TeamStanding[];
  schedule: ScheduleEvent[];
  raceResults: RaceResult[];
  isLoading: boolean;
  profile?: Profile | null;
}

const ChampionshipWidget: React.FC<ChampionshipWidgetProps> = ({
  drivers,
  teams,
  schedule,
  raceResults,
  isLoading,
  profile,
}) => {
  const topDrivers = drivers.slice(0, 3);
  const topTeams = teams.slice(0, 3);
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
    return <div className="h-96 bg-gray-900/50 animate-pulse border-2 border-gray-800"></div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Drivers Championship */}
      <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-red-600 block"></span>
          Drivers <span className="text-gray-500">Title</span>
        </h3>

        <div className="space-y-4 relative z-10 flex-grow">
          {topDrivers.map((driver, index) => (
            <motion.div
              key={driver.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 border-l-4 ${
                index === 0 && !isPreSeasonDriver
                  ? driverChampionshipStatus === 'champion'
                    ? 'bg-yellow-500/10 border-yellow-500'
                    : 'bg-gray-900 border-yellow-500'
                  : profile?.favorite_driver &&
                      (driver.code === profile.favorite_driver ||
                        driver.name.toLowerCase().includes(profile.favorite_driver.toLowerCase()))
                    ? 'bg-red-600/10 border-red-600'
                    : 'bg-gray-900/50 border-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`font-sans font-bold text-xl w-6 ${index === 0 && !isPreSeasonDriver ? 'text-yellow-500' : 'text-gray-500'}`}
                >
                  {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-gray-700">
                    <AvatarImage
                      src={getDriverImageForYear(driver.code)}
                      className="object-cover object-top bg-gray-800"
                    />
                    <AvatarFallback>{driver.code}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-lg leading-none">
                        {driver.name.split(' ').pop()?.toUpperCase()}
                      </div>
                      {index === 0 && driverChampionshipStatus === 'champion' && (
                        <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                          Champion
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-sans">{driver.team}</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-xl">{driver.points}</div>
                <div className="text-xs font-sans text-gray-500">
                  {getGap(driver.points, topDrivers[0].points)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 relative z-10">
          <Link
            to="/standings/drivers"
            className="flex items-center justify-end gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors"
          >
            Full Standings <ArrowRight01Icon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Constructors Championship */}
      <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-red-600 block"></span>
          Constructors <span className="text-gray-500">Title</span>
        </h3>

        <div className="space-y-4 relative z-10 flex-grow">
          {topTeams.map((team, index) => (
            <motion.div
              key={team.team}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className={`flex items-center justify-between p-3 border-l-4 ${
                index === 0 && !isPreSeasonTeam
                  ? teamChampionshipStatus === 'champion'
                    ? 'bg-yellow-500/10 border-yellow-500'
                    : 'bg-gray-900 border-yellow-500'
                  : profile?.favorite_team &&
                      (team.team === profile.favorite_team ||
                        team.team.toLowerCase().includes(profile.favorite_team.toLowerCase()))
                    ? 'bg-red-600/10 border-red-600'
                    : 'bg-gray-900/50 border-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`font-sans font-bold text-xl w-6 ${index === 0 && !isPreSeasonTeam ? 'text-yellow-500' : 'text-gray-500'}`}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    {getCarImage(team.team, selectedYear) && (
                      <img
                        src={getCarImage(team.team, selectedYear)!}
                        alt={team.team}
                        className="h-8 w-auto object-contain drop-shadow-md [mix-blend-mode:lighten]"
                      />
                    )}
                    <div className="font-bold text-lg leading-none">{team.team.toUpperCase()}</div>
                    {index === 0 && teamChampionshipStatus === 'champion' && (
                      <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                        Champion
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-xl">{team.points}</div>
                <div className="text-xs font-sans text-gray-500">
                  {getGap(team.points, topTeams[0].points)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 relative z-10">
          <Link
            to="/standings/teams"
            className="flex items-center justify-end gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors"
          >
            Full Standings <ArrowRight01Icon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ChampionshipWidget };
export default ChampionshipWidget;
