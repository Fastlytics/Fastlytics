import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
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
  Alert01Icon,
  CheckmarkCircle02Icon,
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';

interface FavoritesWidgetProps {
  profile: Profile | null;
  drivers: DriverStanding[];
  teams: TeamStanding[];
  schedule: ScheduleEvent[];
  isLoading: boolean;
}

const FavoritesWidget: React.FC<FavoritesWidgetProps> = ({
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
    const raceMaxPoints = hasFastestLapPoint ? 26 : 25;

    schedule.forEach((event) => {
      // Check Main Race
      // Use Session5Date (Race) if available for precise timing, otherwise fallback to EventDate
      const raceDate = event.Session5Date
        ? new Date(event.Session5Date)
        : event.EventDate
          ? new Date(event.EventDate)
          : null;

      if (raceDate && raceDate > now) {
        points += raceMaxPoints;
      }

      // Check Sprint Race (8 pts)
      if (event.EventFormat.toLowerCase().includes('sprint')) {
        const sessions = [
          { name: event.Session1, date: event.Session1Date },
          { name: event.Session2, date: event.Session2Date },
          { name: event.Session3, date: event.Session3Date },
          { name: event.Session4, date: event.Session4Date },
          { name: event.Session5, date: event.Session5Date },
        ];
        // Assuming Sprint is explicitly named "Sprint"
        const sprintSession = sessions.find((s) => s.name?.toLowerCase() === 'sprint');

        if (sprintSession && sprintSession.date) {
          if (new Date(sprintSession.date) > now) {
            points += 8;
          }
        } else if (raceDate && raceDate > now) {
          // Fallback: if main race is in future, assume sprint is too (or close enough)
          points += 8;
        }
      }
    });
    return points;
  }, [schedule]);

  const driverRivals = useMemo(() => {
    if (!favoriteDriver) return null;
    const index = drivers.findIndex((d) => d === favoriteDriver);
    const leader = drivers[0];

    // Title Contender Logic - ensure season has started (leader has points)
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
    let displayDrivers: {
      driver: DriverStanding;
      label: string;
      status: string;
      type: 'leader' | 'ahead' | 'you' | 'behind' | 'rival';
    }[] = [];

    if (isTitleContender) {
      // Title Contender Mode: Show the most relevant title fight context
      // If P3 or lower, and fighting for title, show the targets ahead (P1, P2...)
      // If P1, show P2, P3 (Threats)
      // If P2, show P1, P3 (Target & Threat)

      // Get all mathematical contenders
      const contenders = drivers.filter((d) => leader.points - d.points <= remainingPoints);

      // We want to show 3 slots.
      // Find where "YOU" are in the contenders list.
      const contenderIndex = contenders.findIndex((d) => d.code === favoriteDriver.code);

      if (contenderIndex === 0) {
        // You are P1 (Leader) -> Show You, P2, P3
        displayDrivers = [
          { driver: favoriteDriver, label: 'LEADER', status: 'active', type: 'you' },
          ...(contenders[1]
            ? [{ driver: contenders[1], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
          ...(contenders[2]
            ? [{ driver: contenders[2], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
        ];
      } else if (contenderIndex === 1) {
        // You are P2 -> Show P1, You, P3
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: favoriteDriver, label: 'CONTENDER', status: 'active', type: 'you' },
          ...(contenders[2]
            ? [{ driver: contenders[2], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
        ];
      } else {
        // You are P3 or lower -> Show P1, Next Target (Ahead), You
        // This gives the "Hunting" perspective
        const immediateAhead = contenders[contenderIndex - 1];
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: immediateAhead, label: 'AHEAD', status: 'active', type: 'ahead' },
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
      } else {
        // If no one ahead (P1 but not title contender context? Should be covered above, but fallback)
        // Just show You and Behind
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
      <div className="h-64 bg-gray-900/50 animate-pulse border-2 border-gray-800 rounded-lg"></div>
    );
  }

  // Fallback State: No favorites selected
  if (!profile?.favorite_driver && !profile?.favorite_team) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 p-8 rounded-lg relative overflow-hidden group">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <Alert01Icon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
              Complete Your Setup
            </h3>
          </div>
          <p className="text-gray-400 mb-6 text-lg">
            Select your favorite driver and team to unlock personalized stats, rivalry tracking, and
            custom highlights across the dashboard.
          </p>
          <Link to="/account">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
              Personalize Dashboard <ArrowRight01Icon className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-12">
      {/* My Garage */}
      <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-red-600 block"></span>
          My <span className="text-gray-500">Garage</span>
        </h3>

        <div className="grid gap-4 relative z-10">
          {favoriteDriver && (
            <div className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 transition-colors group/card">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-700">
                  <AvatarImage
                    src={getDriverImageForYear(favoriteDriver.code)}
                    className="object-cover object-top bg-gray-800"
                  />
                  <AvatarFallback>{favoriteDriver.code}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                    Favorite Driver
                  </div>
                  <div className="font-black text-xl uppercase italic leading-none transition-colors text-white">
                    {favoriteDriver.name}
                  </div>
                  <div className="text-xs font-sans text-gray-500 mt-1">{favoriteDriver.team}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white">
                  {favoriteDriver.rank}
                  <span className="text-sm align-top text-gray-500 ml-1">POS</span>
                </div>
                <div className="text-sm font-sans text-red-500 font-bold">
                  {favoriteDriver.points} PTS
                </div>
              </div>
            </div>
          )}

          {favoriteTeam && (
            <Link
              to="/standings/teams"
              className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 hover:bg-gray-900 transition-colors group/card"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-16 flex items-center justify-center bg-white/5 rounded p-2 border border-gray-700">
                  {getTeamLogo(favoriteTeam.team) ? (
                    <img
                      src={getTeamLogo(favoriteTeam.team)!}
                      alt={favoriteTeam.team}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <UserGroupIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">
                    Favorite Team
                  </div>
                  <div className="font-black text-xl uppercase italic leading-none group-hover/card:text-red-500 transition-colors">
                    {favoriteTeam.team}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white">
                  {favoriteTeam.rank}
                  <span className="text-sm align-top text-gray-500 ml-1">POS</span>
                </div>
                <div className="text-sm font-sans text-red-500 font-bold">
                  {favoriteTeam.points} PTS
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Rivalry Tracker */}
      {favoriteDriver && driverRivals && (
        <div
          className={`bg-black border-2 ${driverRivals.isTitleContender ? 'border-yellow-600/50' : 'border-gray-800'} p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col`}
        >
          <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
            <span
              className={`w-1 h-8 ${driverRivals.isTitleContender ? 'bg-yellow-500' : 'bg-red-600'} block`}
            ></span>
            {driverRivals.isTitleContender ? (
              <span className="text-yellow-500">Title Contender</span>
            ) : (
              <>
                Rivalry <span className="text-gray-500">Tracker</span>
              </>
            )}
          </h3>

          <div className="flex-grow flex flex-col justify-center gap-4 relative z-10">
            {driverRivals.displayDrivers.map((item, idx) => {
              const isYou = item.type === 'you';
              const isConfirmed = item.status === 'confirmed';

              // Dynamic styling based on type
              let containerClass = 'flex items-center gap-4 p-3 border-l-2';
              if (isYou) {
                containerClass = `flex items-center gap-4 p-4 border-l-4 ${driverRivals.isTitleContender ? 'border-yellow-500 bg-yellow-500/10' : 'border-red-600 bg-red-600/10'} my-1`;
              } else if (isConfirmed) {
                containerClass += ' border-gray-800 bg-gray-900/10 opacity-60';
              } else {
                containerClass += ' border-gray-700 bg-gray-900/30';
              }

              return (
                <div key={item.driver.code} className={containerClass}>
                  <div
                    className={`text-xs font-bold ${isYou ? (driverRivals.isTitleContender ? 'text-yellow-500' : 'text-red-500') : 'text-gray-500'} ${isYou ? 'w-24' : 'w-12'} text-right flex-shrink-0`}
                  >
                    {item.label}
                  </div>
                  <Avatar
                    className={`h-8 w-8 ${isYou ? (driverRivals.isTitleContender ? 'border-2 border-yellow-500' : 'border-2 border-red-600') : 'border border-gray-700'}`}
                  >
                    <AvatarImage
                      src={getDriverImageForYear(item.driver.code)}
                      className="object-cover object-top"
                    />
                    <AvatarFallback>{item.driver.code}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow min-w-0">
                    <div
                      className={`font-bold text-sm uppercase truncate ${isYou ? 'italic text-lg' : ''}`}
                    >
                      {item.driver.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{item.driver.team}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isConfirmed ? (
                      <div className="flex items-center gap-1 text-gray-500 justify-end">
                        <CheckmarkCircle02Icon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Safe</span>
                      </div>
                    ) : (
                      <>
                        {isYou ? (
                          <div
                            className={`text-xs ${driverRivals.isTitleContender ? 'text-yellow-500' : 'text-red-400'} font-bold`}
                          >
                            {item.driver.points} PTS
                          </div>
                        ) : (
                          <>
                            <div
                              className={`font-sans font-bold ${item.driver.points > favoriteDriver.points ? 'text-red-500' : 'text-green-500'}`}
                            >
                              {item.driver.points > favoriteDriver.points ? '+' : ''}
                              {item.driver.points - favoriteDriver.points}
                            </div>
                            <div className="text-[10px] text-gray-500 uppercase">Gap</div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {driverRivals.displayDrivers.length === 0 && (
              <div className="p-3 text-center text-gray-500 text-sm italic">
                No active rivalries found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { FavoritesWidget };
export default FavoritesWidget;
