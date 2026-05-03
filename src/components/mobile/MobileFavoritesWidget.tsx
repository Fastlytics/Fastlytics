import React from 'react';
import { motion } from 'motion/react';
import { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';
import { Profile } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { useFavoritesWidgetData } from '@/hooks/useFavoritesWidgetData';
import {
  ChampionIcon,
  UserGroupIcon,
  ArrowRight01Icon,
  Settings02Icon,
  FireIcon,
  CheckmarkCircle02Icon,
  StarIcon,
  Award01Icon,
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';

interface MobileFavoritesWidgetProps {
  profile: Profile | null;
  drivers: DriverStanding[];
  teams: TeamStanding[];
  schedule: ScheduleEvent[];
  isLoading: boolean;
}

const MobileFavoritesWidget: React.FC<MobileFavoritesWidgetProps> = ({
  profile,
  drivers,
  teams,
  schedule,
  isLoading,
}) => {
  const { selectedYear } = useSeason();
  const getDriverImageForYear = (driverCode: string) => getDriverImage(driverCode, selectedYear);

  const { favoriteDriver, remainingPoints, driverRivals } = useFavoritesWidgetData(
    profile,
    drivers,
    teams,
    schedule
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-zinc-900/50 animate-pulse border-2 border-white/5" />
        <div className="h-24 bg-zinc-900/50 animate-pulse border-2 border-white/5" />
      </div>
    );
  }

  // No favorites - show setup CTA
  if (!profile?.favorite_driver && !profile?.favorite_team) {
    return (
      <Link to="/account">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black border-2 border-white/10 p-4 active:bg-zinc-900 transition-colors group rounded-xl"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-zinc-900 border border-white/10 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Settings02Icon className="w-5 h-5 text-red-600 group-hover:text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-base text-white uppercase italic mb-1">
                Complete Setup
              </h3>
              <p className="text-xs text-gray-500 font-mono uppercase leading-relaxed">
                Select your favorite driver and team for personalized stats
              </p>
            </div>
            <ArrowRight01Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - changes based on title contention */}
      <div className="flex items-center justify-between border-b-2 border-white/10 pb-2">
        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
          <span
            className={cn(
              'w-2 h-6 block',
              driverRivals?.isTitleContender ? 'bg-yellow-500' : 'bg-red-600'
            )}
          ></span>
          {driverRivals?.isTitleContender ? (
            <>
              Title <span className="text-yellow-500">Fight</span>
            </>
          ) : (
            <>
              My <span className="text-gray-500">Garage</span>
            </>
          )}
        </h3>
        {driverRivals?.isTitleContender && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30">
            <Award01Icon className="w-3 h-3 text-yellow-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">
              Contender
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Favorite Driver Card - Enhanced with Title Fight */}
        {favoriteDriver && (
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-4 transition-colors">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'border-2 active:scale-[0.99] transition-transform bg-black rounded-xl',
                driverRivals?.isTitleContender ? 'border-yellow-600/50' : 'border-white/10'
              )}
            >
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar & Position */}
                  <div className="relative">
                    <Avatar
                      className={cn(
                        'h-16 w-16 rounded-md border-2',
                        driverRivals?.isTitleContender ? 'border-yellow-500' : 'border-red-600'
                      )}
                    >
                      <AvatarImage
                        src={getDriverImageForYear(favoriteDriver.code)}
                        className="object-cover object-top bg-zinc-900"
                      />
                      <AvatarFallback className="bg-zinc-900 rounded-md font-black text-lg">
                        {favoriteDriver.code}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'absolute -bottom-2 -right-2 w-7 h-7 flex items-center justify-center text-xs font-black border-2 border-black rounded-md',
                        driverRivals?.isTitleContender
                          ? 'bg-yellow-500 text-black'
                          : 'bg-red-600 text-white'
                      )}
                    >
                      P{favoriteDriver.rank}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1 font-mono">
                      {driverRivals?.isTitleContender ? (
                        <>
                          <Award01Icon className="w-3 h-3 text-yellow-500" />
                          <span className="text-yellow-500">Title Contender</span>
                        </>
                      ) : (
                        <>
                          <StarIcon className="w-3 h-3 text-red-500" />
                          Favorite Driver
                        </>
                      )}
                    </div>
                    <div className="font-black text-2xl uppercase italic truncate leading-none mb-1">
                      {favoriteDriver.name.split(' ').pop()}
                    </div>
                    <div className="text-xs text-gray-400 font-mono uppercase">
                      {favoriteDriver.team}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-3xl font-black leading-none',
                        driverRivals?.isTitleContender ? 'text-yellow-500' : 'text-red-600'
                      )}
                    >
                      {favoriteDriver.points}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">PTS</div>
                  </div>
                </div>

                {/* Title Fight Rivalry Display */}
                {driverRivals?.isTitleContender && driverRivals.displayDrivers.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-yellow-600/20 space-y-2">
                    {driverRivals.displayDrivers
                      .filter((item) => item.type !== 'you')
                      .slice(0, 1)
                      .map((item) => (
                        <div
                          key={item.driver.code}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 rounded-none border border-white/20">
                              <AvatarImage
                                src={getDriverImageForYear(item.driver.code)}
                                className="object-cover object-top"
                              />
                              <AvatarFallback className="text-[8px] rounded-none">
                                {item.driver.code}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-bold text-white uppercase italic">
                                {item.driver.name.split(' ').pop()}
                              </span>
                              <span className="text-gray-500 text-xs ml-2 font-mono">
                                P{item.driver.rank}
                              </span>
                            </div>
                          </div>
                          <div
                            className={cn(
                              'font-mono font-bold',
                              item.driver.points > favoriteDriver.points
                                ? 'text-red-500'
                                : 'text-green-500'
                            )}
                          >
                            {item.driver.points > favoriteDriver.points ? '+' : ''}
                            {item.driver.points - favoriteDriver.points} pts
                          </div>
                        </div>
                      ))}

                    {/* Gap to Leader if not P1 */}
                    {driverRivals.gapToLeader > 0 && (
                      <div className="text-[10px] text-gray-500 text-center mt-2 font-mono uppercase bg-zinc-900/50 py-1">
                        {remainingPoints} pts remaining • Gap: {driverRivals.gapToLeader} pts
                      </div>
                    )}
                  </div>
                )}

                {/* Standard Rivalry (non-title contender) */}
                {!driverRivals?.isTitleContender && driverRivals && (
                  <div className="mt-4 pt-4 border-t-2 border-white/5 flex gap-4">
                    {driverRivals.displayDrivers
                      .filter((item) => item.type === 'ahead')
                      .map((item) => (
                        <div
                          key={item.driver.code}
                          className="flex-1 flex items-center justify-between text-xs bg-zinc-900/30 p-2 border border-white/5"
                        >
                          <div className="flex flex-col">
                            <span className="text-gray-600 font-mono uppercase text-[10px] mb-0.5">
                              Ahead
                            </span>
                            <span className="font-bold text-white uppercase italic">
                              {item.driver.name.split(' ').pop()}
                            </span>
                          </div>
                          <span className="text-red-500 font-mono font-bold">
                            +{item.driver.points - favoriteDriver.points}
                          </span>
                        </div>
                      ))}
                    {driverRivals.displayDrivers
                      .filter((item) => item.type === 'behind')
                      .map((item) => (
                        <div
                          key={item.driver.code}
                          className="flex-1 flex items-center justify-between text-xs bg-zinc-900/30 p-2 border border-white/5"
                        >
                          <div className="flex flex-col">
                            <span className="text-gray-600 font-mono uppercase text-[10px] mb-0.5">
                              Behind
                            </span>
                            <span className="font-bold text-white uppercase italic">
                              {item.driver.name.split(' ').pop()}
                            </span>
                          </div>
                          <span className="text-green-500 font-mono font-bold">
                            +{favoriteDriver.points - item.driver.points}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Favorite Team Card */}
        {favoriteTeam && (
          <Link to="/standings/teams">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black border-2 border-white/10 p-4 active:bg-zinc-900 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-4">
                {/* Logo & Position */}
                <div className="relative">
                  <div className="h-16 w-24 flex items-center justify-center bg-transparent rounded-md border-2 border-white/10 p-2">
                    {getTeamLogo(favoriteTeam.team) ? (
                      <img
                        src={getTeamLogo(favoriteTeam.team)!}
                        alt={favoriteTeam.team}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-red-600 flex items-center justify-center text-xs font-black text-white border-2 border-black rounded-md">
                    P{favoriteTeam.rank}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1 font-mono">
                    <StarIcon className="w-3 h-3 text-red-500" />
                    Favorite Team
                  </div>
                  <div className="font-black text-xl uppercase italic truncate leading-none">
                    {favoriteTeam.team}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-3xl font-black text-red-600 leading-none">
                    {favoriteTeam.points}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">PTS</div>
                </div>
              </div>
            </motion.div>
          </Link>
        )}
      </div>
    </div>
  );
};

export { MobileFavoritesWidget };
export default MobileFavoritesWidget;
