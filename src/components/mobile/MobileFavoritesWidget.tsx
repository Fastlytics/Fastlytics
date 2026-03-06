import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';
import { Profile } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
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

  const favoriteDriver = useMemo(() => {
    if (!profile?.favorite_driver || !drivers.length) return null;
    return drivers.find(
      (d) =>
        d.code === profile.favorite_driver ||
        d.name.toLowerCase().includes(profile.favorite_driver.toLowerCase())
    );
  }, [profile, drivers]);

  const favoriteTeam = useMemo(() => {
    if (!profile?.favorite_team || !teams.length) return null;
    return teams.find(
      (t) =>
        t.team === profile.favorite_team ||
        t.team.toLowerCase().includes(profile.favorite_team.toLowerCase())
    );
  }, [profile, teams]);

  // Calculate remaining points in the season
  // 2025+: 25 pts per race (no fastest lap bonus), 8 pts for sprint = 33 max for sprint weekend
  // 2019-2024: 26 pts per race (25 + 1 fastest lap), 8 pts for sprint = 34 max for sprint weekend
  const remainingPoints = useMemo(() => {
    if (!schedule || schedule.length === 0) return 0;
    const now = new Date();
    let points = 0;

    // Determine the season year from the first event
    const seasonYear = schedule[0]?.EventDate
      ? new Date(schedule[0].EventDate).getFullYear()
      : getCurrentSeasonYear();
    const hasFastestLapPoint = seasonYear >= 2019 && seasonYear <= 2024;
    const raceMaxPoints = hasFastestLapPoint ? 26 : 25; // 25 for win + 1 fastest lap (2019-2024 only)

    schedule.forEach((event) => {
      const raceDate = event.Session5Date
        ? new Date(event.Session5Date)
        : event.EventDate
          ? new Date(event.EventDate)
          : null;
      if (raceDate && raceDate > now) {
        points += raceMaxPoints;
      }
      if (event.EventFormat.toLowerCase().includes('sprint')) {
        const sessions = [
          { name: event.Session1, date: event.Session1Date },
          { name: event.Session2, date: event.Session2Date },
          { name: event.Session3, date: event.Session3Date },
          { name: event.Session4, date: event.Session4Date },
          { name: event.Session5, date: event.Session5Date },
        ];
        const sprintSession = sessions.find((s) => s.name?.toLowerCase() === 'sprint');
        if (sprintSession && sprintSession.date) {
          if (new Date(sprintSession.date) > now) {
            points += 8;
          }
        } else if (raceDate && raceDate > now) {
          points += 8;
        }
      }
    });
    return points;
  }, [schedule]);

  // Full rivalry tracker with title contention logic
  const driverRivals = useMemo(() => {
    if (!favoriteDriver || drivers.length < 2) return null;

    const index = drivers.findIndex((d) => d === favoriteDriver);
    const leader = drivers[0];

    // Title Contender Logic - same as desktop (ensure leader has points)
    const isTitleContender =
      leader.points > 0 && leader.points - favoriteDriver.points <= remainingPoints;

    // Rivalry Status Logic
    const getRivalryStatus = (rival: DriverStanding | null) => {
      if (!rival) return 'none';
      const gap = Math.abs(favoriteDriver.points - rival.points);
      if (gap > remainingPoints) return 'confirmed';
      return 'active';
    };

    // Determine which drivers to display
    type DisplayDriver = {
      driver: DriverStanding;
      label: string;
      status: string;
      type: 'leader' | 'ahead' | 'you' | 'behind' | 'rival';
    };
    let displayDrivers: DisplayDriver[] = [];

    if (isTitleContender) {
      // Title Contender Mode
      const contenders = drivers.filter((d) => leader.points - d.points <= remainingPoints);
      const contenderIndex = contenders.findIndex((d) => d.code === favoriteDriver.code);

      if (contenderIndex === 0) {
        // P1 (Leader)
        displayDrivers = [
          { driver: favoriteDriver, label: 'LEADER', status: 'active', type: 'you' },
          ...(contenders[1]
            ? [{ driver: contenders[1], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
        ];
      } else if (contenderIndex === 1) {
        // P2
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: favoriteDriver, label: 'CONTENDER', status: 'active', type: 'you' },
        ];
      } else {
        // P3 or lower
        const immediateAhead = contenders[contenderIndex - 1];
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: favoriteDriver, label: 'CONTENDER', status: 'active', type: 'you' },
        ];
      }
    } else {
      // Standard Mode: Ahead / You / Behind
      const ahead = index > 0 ? drivers[index - 1] : null;
      const behind = index < drivers.length - 1 ? drivers[index + 1] : null;

      if (ahead) {
        displayDrivers.push({
          driver: ahead,
          label: getRivalryStatus(ahead) === 'confirmed' ? 'LOCKED' : 'AHEAD',
          status: getRivalryStatus(ahead),
          type: 'ahead',
        });
      }

      displayDrivers.push({
        driver: favoriteDriver,
        label: 'YOUR FAV',
        status: 'active',
        type: 'you',
      });

      if (behind) {
        displayDrivers.push({
          driver: behind,
          label: getRivalryStatus(behind) === 'confirmed' ? 'SAFE' : 'BEHIND',
          status: getRivalryStatus(behind),
          type: 'behind',
        });
      }
    }

    return {
      displayDrivers,
      isTitleContender,
      gapToLeader: leader.points - favoriteDriver.points,
    };
  }, [favoriteDriver, drivers, remainingPoints]);

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
