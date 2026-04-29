import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';
import { Profile } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';

interface FavoritesWidgetProps {
  profile: Profile | null;
  drivers: DriverStanding[];
  teams: TeamStanding[];
  schedule: ScheduleEvent[];
  isLoading: boolean;
}

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const FavoritesWidget: React.FC<FavoritesWidgetProps> = ({
  profile,
  drivers,
  teams,
  schedule,
  isLoading,
}) => {
  const { selectedYear } = useSeason();
  const getDriverImageForYear = (code: string) => getDriverImage(code, selectedYear);

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

  const remainingPoints = useMemo(() => {
    if (!schedule?.length) return 0;
    const now = new Date();
    let pts = 0;
    const seasonYear = schedule[0]?.EventDate
      ? new Date(schedule[0].EventDate).getFullYear()
      : getCurrentSeasonYear();
    const hasFastestLap = seasonYear >= 2019 && seasonYear <= 2024;
    const raceMax = hasFastestLap ? 26 : 25;

    schedule.forEach((event) => {
      const raceDate = event.Session5Date
        ? new Date(event.Session5Date)
        : event.EventDate
          ? new Date(event.EventDate)
          : null;
      if (raceDate && raceDate > now) pts += raceMax;
      if (event.EventFormat.toLowerCase().includes('sprint')) {
        const sessions = [
          { name: event.Session1, date: event.Session1Date },
          { name: event.Session2, date: event.Session2Date },
          { name: event.Session3, date: event.Session3Date },
          { name: event.Session4, date: event.Session4Date },
          { name: event.Session5, date: event.Session5Date },
        ];
        const sprint = sessions.find((s) => s.name?.toLowerCase() === 'sprint');
        if (sprint?.date && new Date(sprint.date) > now) pts += 8;
        else if (raceDate && raceDate > now) pts += 8;
      }
    });
    return pts;
  }, [schedule]);

  const driverRivals = useMemo(() => {
    if (!favoriteDriver) return null;
    const index = drivers.findIndex((d) => d === favoriteDriver);
    const leader = drivers[0];
    const isTitleContender =
      leader.points > 0 && leader.points - favoriteDriver.points <= remainingPoints;

    const getRivalryStatus = (rival: DriverStanding | null) => {
      if (!rival) return 'none';
      return Math.abs(favoriteDriver.points - rival.points) > remainingPoints
        ? 'confirmed'
        : 'active';
    };

    let displayDrivers: {
      driver: DriverStanding;
      label: string;
      status: string;
      type: 'leader' | 'ahead' | 'you' | 'behind' | 'rival';
    }[] = [];

    if (isTitleContender) {
      const contenders = drivers.filter((d) => leader.points - d.points <= remainingPoints);
      const ci = contenders.findIndex((d) => d.code === favoriteDriver.code);
      if (ci === 0) {
        displayDrivers = [
          { driver: favoriteDriver, label: 'LEADER', status: 'active', type: 'you' },
          ...(contenders[1]
            ? [{ driver: contenders[1], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
          ...(contenders[2]
            ? [{ driver: contenders[2], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
        ];
      } else if (ci === 1) {
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: favoriteDriver, label: 'CONTENDER', status: 'active', type: 'you' },
          ...(contenders[2]
            ? [{ driver: contenders[2], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
        ];
      } else {
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: contenders[ci - 1], label: 'AHEAD', status: 'active', type: 'ahead' },
          { driver: favoriteDriver, label: 'CONTENDER', status: 'active', type: 'you' },
        ];
      }
    } else {
      const ahead = index > 0 ? drivers[index - 1] : null;
      const behind = index < drivers.length - 1 ? drivers[index + 1] : null;
      if (ahead)
        displayDrivers.push({
          driver: ahead,
          label: getRivalryStatus(ahead) === 'confirmed' ? 'LOCKED' : 'AHEAD',
          status: getRivalryStatus(ahead),
          type: 'ahead',
        });
      displayDrivers.push({
        driver: favoriteDriver,
        label: 'YOUR FAV',
        status: 'active',
        type: 'you',
      });
      if (behind)
        displayDrivers.push({
          driver: behind,
          label: getRivalryStatus(behind) === 'confirmed' ? 'SAFE' : 'BEHIND',
          status: getRivalryStatus(behind),
          type: 'behind',
        });
    }

    return { displayDrivers, isTitleContender, gapToLeader: leader.points - favoriteDriver.points };
  }, [favoriteDriver, drivers, remainingPoints]);

  if (isLoading) {
    return (
      <div style={inter} className="grid gap-6 lg:grid-cols-2 mb-8">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
          />
        ))}
      </div>
    );
  }

  // No favorites set
  if (!profile?.favorite_driver && !profile?.favorite_team) {
    return (
      <div
        style={inter}
        className="mb-8 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-7"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v6M9 12v1" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <circle cx="9" cy="9" r="7.5" stroke="#ef4444" strokeWidth="1.2" opacity="0.5" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-semibold text-white">Personalize your dashboard</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-white/55">
              Select a favorite driver and team to unlock rivalry tracking, personalized highlights
              and custom stats.
            </p>
            <Link
              to="/account"
              className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-red-400 transition-colors hover:text-red-300"
            >
              Set up preferences
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 6h10M7 2l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={inter} className="mb-8 grid gap-6 lg:grid-cols-2">
      {/* ── My Garage ── */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-white/40">
            My Garage
          </p>
          <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">Your picks</p>
        </div>

        <div className="divide-y divide-white/[0.04] p-3">
          {favoriteDriver && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 rounded-lg p-4"
            >
              <Avatar className="h-15 w-15 shrink-0 border border-white/[0.08]">
                <AvatarImage
                  src={getDriverImageForYear(favoriteDriver.code)}
                  className="object-cover object-top"
                />
                <AvatarFallback className="bg-[#1a1a1e] text-[13px] font-bold text-white">
                  {favoriteDriver.code}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white/45">Favourite Driver</div>
                <div className="mt-0.5 text-[16px] font-semibold text-white">
                  {favoriteDriver.name}
                </div>
                <div className="text-[13px] text-white/45">{favoriteDriver.team}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[22px] font-bold tabular-nums text-white">
                  P{favoriteDriver.rank}
                </div>
                <div className="text-[14px] font-medium text-red-400">
                  {favoriteDriver.points} pts
                </div>
              </div>
            </motion.div>
          )}

          {favoriteTeam && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              <Link
                to="/standings/teams"
                className="flex items-center gap-3 rounded-lg p-4 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] p-1.5">
                  {getTeamLogo(favoriteTeam.team) ? (
                    <img
                      src={getTeamLogo(favoriteTeam.team)!}
                      alt={favoriteTeam.team}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[12px] font-bold text-white/55">
                      {favoriteTeam.team.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-white/45">Favourite Team</div>
                  <div className="mt-0.5 text-[16px] font-semibold text-white">
                    {favoriteTeam.team}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[22px] font-bold tabular-nums text-white">
                    P{favoriteTeam.rank}
                  </div>
                  <div className="text-[14px] font-medium text-red-400">
                    {favoriteTeam.points} pts
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Rivalry Tracker ── */}
      {favoriteDriver && driverRivals && (
        <div
          className={`overflow-hidden rounded-xl border bg-[#0c0c0e] ${driverRivals.isTitleContender ? 'border-amber-500/20' : 'border-white/[0.06]'}`}
        >
          <div className="border-b border-white/[0.06] px-6 py-5">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-white/40">
              {driverRivals.isTitleContender ? 'Title Fight' : 'Rivalry Tracker'}
            </p>
            <p
              className={`mt-0.5 text-[18px] font-bold uppercase italic ${driverRivals.isTitleContender ? 'text-amber-400' : 'text-white'}`}
            >
              {driverRivals.isTitleContender ? 'In the hunt' : 'Your position'}
            </p>
          </div>

          <div className="divide-y divide-white/[0.04] p-3">
            {driverRivals.displayDrivers.map((item) => {
              const isYou = item.type === 'you';
              const isConfirmed = item.status === 'confirmed';

              return (
                <motion.div
                  key={item.driver.code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`flex items-center gap-3 rounded-lg p-4 transition-colors ${
                    isYou
                      ? driverRivals.isTitleContender
                        ? 'bg-amber-500/[0.06]'
                        : 'bg-red-500/[0.05]'
                      : isConfirmed
                        ? 'opacity-40'
                        : ''
                  }`}
                >
                  {/* Label */}
                  <div
                    className={`w-16 shrink-0 text-right text-[12px] font-semibold uppercase tracking-wider ${
                      isYou
                        ? driverRivals.isTitleContender
                          ? 'text-amber-400'
                          : 'text-red-400'
                        : 'text-white/40'
                    }`}
                  >
                    {item.label}
                  </div>

                  {/* Accent */}
                  <div
                    className={`h-8 w-0.5 shrink-0 rounded-full ${
                      isYou
                        ? driverRivals.isTitleContender
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                        : 'bg-white/10'
                    }`}
                  />

                  {/* Avatar */}
                  <Avatar
                    className={`h-15 w-15 shrink-0 ${isYou ? 'border border-red-500/40' : 'border border-white/[0.06]'}`}
                  >
                    <AvatarImage
                      src={getDriverImageForYear(item.driver.code)}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="bg-[#1a1a1e] text-[12px] font-bold text-white">
                      {item.driver.code}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-[15px] font-semibold ${isYou ? 'text-white' : 'text-white/80'}`}
                    >
                      {item.driver.name.split(' ').pop()?.toUpperCase()}
                    </div>
                    <div className="text-[13px] text-white/40 truncate">{item.driver.code}</div>
                  </div>

                  {/* Points/gap */}
                  <div className="shrink-0 text-right">
                    {isConfirmed ? (
                      <span className="text-[13px] font-medium text-white/40">Safe</span>
                    ) : isYou ? (
                      <div
                        className={`text-[16px] font-bold tabular-nums ${driverRivals.isTitleContender ? 'text-amber-400' : 'text-red-400'}`}
                      >
                        {item.driver.points}
                      </div>
                    ) : (
                      <div
                        className={`text-[16px] font-bold tabular-nums ${item.driver.points > (favoriteDriver?.points ?? 0) ? 'text-red-400' : 'text-emerald-400'}`}
                      >
                        {item.driver.points > (favoriteDriver?.points ?? 0) ? '+' : ''}
                        {item.driver.points - (favoriteDriver?.points ?? 0)}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export { FavoritesWidget };
export default FavoritesWidget;
