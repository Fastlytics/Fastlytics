import React from 'react';
import { m } from 'motion/react';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useSeason } from '@/contexts/SeasonContext';
import { Profile } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCarImage, getDriverImage } from '@/utils/imageMapping';

const WIDGET_SKELETONS = ['ws-0', 'ws-1'];

interface ChampionshipWidgetProps {
  drivers: DriverStanding[];
  teams: TeamStanding[];
  schedule: ScheduleEvent[];
  raceResults: RaceResult[];
  isLoading: boolean;
  profile?: Profile | null;
}

const inter = { fontFamily: "'Inter', sans-serif" } as const;

function DriverRow({
  driver,
  index,
  isLeader,
  isPreSeason,
  champStatus,
  isFav,
  leaderPts,
  getDriverImageForYear,
  getGap,
}: {
  driver: DriverStanding;
  index: number;
  isLeader: boolean;
  isPreSeason: boolean;
  champStatus: 'leader' | 'champion';
  isFav: boolean;
  leaderPts: number;
  getDriverImageForYear: (code: string) => string;
  getGap: (pts: number, leaderPts: number) => string;
}) {
  return (
    <m.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
        isLeader && champStatus === 'champion'
          ? 'bg-amber-500/[0.06]'
          : isLeader
            ? 'bg-white/[0.03]'
            : isFav
              ? 'bg-red-500/[0.05]'
              : 'transparent'
      }`}
    >
      <span
        className={`w-5 shrink-0 text-[15px] tabular-nums font-medium ${isLeader ? 'text-amber-400' : 'text-white/40'}`}
      >
        {index + 1}
      </span>
      <div
        className={`h-8 w-0.5 shrink-0 rounded-full ${isFav ? 'bg-red-500' : isLeader ? 'bg-amber-400/60' : 'bg-white/10'}`}
      />
      <Avatar className="size-15 shrink-0 border border-white/[0.08]">
        <AvatarImage src={getDriverImageForYear(driver.code)} className="object-cover object-top" />
        <AvatarFallback className="bg-[#1a1a1e] text-[12px] font-bold text-white">
          {driver.code}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[16px] font-semibold text-white">
            {driver.name.split(' ').pop()?.toUpperCase()}
          </span>
          {isLeader && champStatus === 'champion' && (
            <span className="inline-flex rounded bg-amber-500/15 px-1.5 py-0.5 text-[12px] font-semibold text-amber-400">
              Champ
            </span>
          )}
          {isFav && (
            <span className="inline-flex rounded bg-red-500/10 px-1.5 py-0.5 text-[12px] font-semibold text-red-400">
              Fav
            </span>
          )}
        </div>
        <div className="text-[13px] text-white/45">{driver.team}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[18px] font-bold tabular-nums text-white">{driver.points}</div>
        <div
          className={`text-[13px] tabular-nums ${isLeader ? 'text-amber-400' : 'text-white/45'}`}
        >
          {getGap(driver.points, leaderPts)}
        </div>
      </div>
    </m.div>
  );
}

const ChampionshipWidget: React.FC<ChampionshipWidgetProps> = ({
  drivers,
  teams,
  schedule,
  raceResults,
  isLoading,
  profile,
}) => {
  const { selectedYear } = useSeason();
  const topDrivers = drivers.slice(0, 3);
  const topTeams = teams.slice(0, 3);
  const isPreSeasonDriver = drivers.length > 0 && drivers[0].points === 0;
  const isPreSeasonTeam = teams.length > 0 && teams[0].points === 0;

  const getDriverImageForYear = (code: string) => getDriverImage(code, selectedYear);
  const getGap = (pts: number, leaderPts: number) =>
    leaderPts - pts === 0 ? 'Leader' : `−${leaderPts - pts}`;

  let driverChampStatus: 'leader' | 'champion' = 'leader';
  if (drivers.length >= 2 && schedule.length > 0 && raceResults) {
    const remaining = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
    driverChampStatus = getChampionshipStatus(drivers[0].points, drivers[1].points, remaining);
  }

  let teamChampStatus: 'leader' | 'champion' = 'leader';
  if (teams.length >= 2 && schedule.length > 0 && raceResults) {
    const remaining = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
    teamChampStatus = getChampionshipStatus(teams[0].points, teams[1].points, remaining);
  }

  if (isLoading)
    return (
      <div style={inter} className="grid gap-6 md:grid-cols-2">
        {WIDGET_SKELETONS.map((id) => (
          <div
            key={id}
            className="h-80 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
          />
        ))}
      </div>
    );

  return (
    <div style={inter} className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-white/40">
              World Drivers Championship
            </p>
            <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">
              Driver Standings
            </p>
          </div>
          {driverChampStatus === 'champion' && !isPreSeasonDriver && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[13px] font-semibold text-amber-400 border border-amber-500/20">
              Sealed
            </span>
          )}
        </div>
        <div className="flex-1 divide-y divide-white/[0.04] p-3">
          {topDrivers.map((driver, i) => (
            <DriverRow
              key={driver.code}
              driver={driver}
              index={i}
              isLeader={i === 0 && !isPreSeasonDriver}
              isPreSeason={isPreSeasonDriver}
              champStatus={driverChampStatus}
              isFav={
                !!profile?.favorite_driver &&
                (driver.code === profile.favorite_driver ||
                  driver.name.toLowerCase().includes(profile.favorite_driver.toLowerCase()))
              }
              leaderPts={topDrivers[0].points}
              getDriverImageForYear={getDriverImageForYear}
              getGap={getGap}
            />
          ))}
        </div>
        <div className="border-t border-white/[0.06] px-6 py-3.5 flex items-center justify-between">
          <Link
            to="/standings/progression"
            className="flex items-center gap-1.5 text-[13px] font-medium text-red-500/70 transition-colors hover:text-red-400"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 10l3-4 2 2 3-5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Progression
          </Link>
          <Link
            to="/standings/drivers"
            className="flex items-center justify-end gap-1.5 text-[14px] font-medium text-white/45 transition-colors hover:text-white"
          >
            FULL STANDINGS
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
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-white/40">
              World Constructors Championship
            </p>
            <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">
              Constructor Standings
            </p>
          </div>
          {teamChampStatus === 'champion' && !isPreSeasonTeam && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[13px] font-semibold text-amber-400 border border-amber-500/20">
              Sealed
            </span>
          )}
        </div>
        <div className="flex-1 divide-y divide-white/[0.04] p-3">
          {topTeams.map((team, i) => {
            const isLeader = i === 0 && !isPreSeasonTeam;
            const isFav =
              !!profile?.favorite_team &&
              (team.team === profile.favorite_team ||
                team.team.toLowerCase().includes(profile.favorite_team.toLowerCase()));
            const carImg = getCarImage(team.team, selectedYear);
            return (
              <m.div
                key={team.team}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 + 0.2, duration: 0.4 }}
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${isLeader && teamChampStatus === 'champion' ? 'bg-amber-500/[0.06]' : isLeader ? 'bg-white/[0.03]' : isFav ? 'bg-red-500/[0.05]' : 'transparent'}`}
              >
                <span
                  className={`w-5 shrink-0 text-[15px] tabular-nums font-medium ${isLeader ? 'text-amber-400' : 'text-white/40'}`}
                >
                  {i + 1}
                </span>
                <div
                  className={`h-8 w-0.5 shrink-0 rounded-full ${isFav ? 'bg-red-500' : isLeader ? 'bg-amber-400/60' : 'bg-white/10'}`}
                />
                <div className="flex h-16 w-[72px] shrink-0 items-center justify-center">
                  {carImg ? (
                    <img
                      src={carImg}
                      alt={team.team}
                      className="size-full object-contain [mix-blend-mode:lighten]"
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-full border border-white/[0.08] bg-[#1a1a1e]">
                      <span className="text-[12px] font-bold text-white/55">
                        {team.team.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[16px] font-semibold text-white">
                      {team.team.toUpperCase()}
                    </span>
                    {isLeader && teamChampStatus === 'champion' && (
                      <span className="inline-flex rounded bg-amber-500/15 px-1.5 py-0.5 text-[12px] font-semibold text-amber-400">
                        Champ
                      </span>
                    )}
                    {isFav && (
                      <span className="inline-flex rounded bg-red-500/10 px-1.5 py-0.5 text-[12px] font-semibold text-red-400">
                        Fav
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[18px] font-bold tabular-nums text-white">{team.points}</div>
                  <div
                    className={`text-[13px] tabular-nums ${isLeader ? 'text-amber-400' : 'text-white/45'}`}
                  >
                    {getGap(team.points, topTeams[0].points)}
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>
        <div className="border-t border-white/[0.06] px-6 py-3.5 flex items-center justify-between">
          <Link
            to="/team-pace"
            className="flex items-center gap-1.5 text-[13px] font-medium text-red-500/70 transition-colors hover:text-red-400"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 8l3-3 2 2 3-4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Pace Analysis
          </Link>
          <Link
            to="/standings/teams"
            className="flex items-center justify-end gap-1.5 text-[14px] font-medium text-white/45 transition-colors hover:text-white"
          >
            FULL STANDINGS
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
};

export default ChampionshipWidget;
