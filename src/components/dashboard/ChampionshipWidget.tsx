import React from 'react';
import { m } from 'motion/react';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useSeason } from '@/contexts/SeasonContext';
import { Profile } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';
import { getTeamLogo } from '@/lib/teamUtils';
import { CARD_CONTAINER, CARD_GAP, CARD_DATA_VALUE, CARD_LABEL } from '@/lib/card-styles';

const WIDGET_SKELETONS = ['ws-0', 'ws-1'];

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

  if (isLoading) {
    return (
      <div className={`grid h-full ${CARD_GAP} md:grid-cols-2`}>
        {WIDGET_SKELETONS.map((id) => (
          <div key={id} className={`h-full animate-pulse ${CARD_CONTAINER}`} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid h-full ${CARD_GAP} md:grid-cols-2`}>
      {/* Drivers */}
      <div className={`flex flex-col ${CARD_CONTAINER}`}>
        <div className="px-5 pt-5 pb-3">
          <span className={CARD_LABEL}>Drivers Championship</span>
        </div>

        <div className="flex-1 px-2">
          {topDrivers.map((driver, i) => {
            const isLeader = i === 0 && !isPreSeasonDriver;
            const isFav =
              !!profile?.favorite_driver &&
              (driver.code === profile.favorite_driver ||
                driver.name.toLowerCase().includes(profile.favorite_driver.toLowerCase()));

            return (
              <m.div
                key={driver.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="w-4 shrink-0 font-mono text-[13px] tabular-nums text-white">
                  {i + 1}
                </span>

                <Avatar className="size-8 shrink-0 border border-white/[0.06]">
                  <AvatarImage
                    src={getDriverImageForYear(driver.code)}
                    className="object-cover object-top"
                  />
                  <AvatarFallback className="bg-white/[0.04] text-[10px] font-medium text-white/80">
                    {driver.code}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14px] font-medium text-white">
                      {driver.name}
                    </span>
                    {isLeader && driverChampStatus === 'champion' && (
                      <span className="text-[11px] font-medium text-amber-400">WDC</span>
                    )}
                    {isFav && <span className="text-[11px] font-medium text-red-400">★</span>}
                  </div>
                  <div className="text-[12px] text-white/80">{driver.team}</div>
                </div>

                <div className="shrink-0 text-right">
                  <div className={CARD_DATA_VALUE}>{driver.points}</div>
                  <div className="font-mono text-[11px] tabular-nums text-white/80">
                    {getGap(driver.points, topDrivers[0].points)}
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>

        <div className="mt-auto border-t border-white/[0.04] px-5 py-3 flex items-center justify-between">
          <Link
            to="/standings/progression"
            className="text-[12px] font-medium text-white/80 transition-colors hover:text-white"
          >
            Progression
          </Link>
          <Link
            to="/standings/drivers"
            className="flex items-center gap-1 text-[12px] font-medium text-white/80 transition-colors hover:text-white"
          >
            Full Standings
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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

      {/* Constructors */}
      <div className={`flex flex-col ${CARD_CONTAINER}`}>
        <div className="px-5 pt-5 pb-3">
          <span className={CARD_LABEL}>Constructors Championship</span>
        </div>

        <div className="flex-1 px-2">
          {topTeams.map((team, i) => {
            const isLeader = i === 0 && !isPreSeasonTeam;
            const isFav =
              !!profile?.favorite_team &&
              (team.team === profile.favorite_team ||
                team.team.toLowerCase().includes(profile.favorite_team.toLowerCase()));

            return (
              <m.div
                key={team.team}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="w-4 shrink-0 font-mono text-[13px] tabular-nums text-white">
                  {i + 1}
                </span>

                <div className="flex size-8 shrink-0 items-center justify-center rounded border border-white/[0.06]">
                  {getTeamLogo(team.team) ? (
                    <img
                      src={getTeamLogo(team.team)!}
                      alt={team.team}
                      className="size-6 object-contain"
                    />
                  ) : (
                    <span className="text-[10px] font-medium text-white/80">
                      {team.team.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14px] font-medium text-white">{team.team}</span>
                    {isLeader && teamChampStatus === 'champion' && (
                      <span className="text-[11px] font-medium text-amber-400">WCC</span>
                    )}
                    {isFav && <span className="text-[11px] font-medium text-red-400">★</span>}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className={CARD_DATA_VALUE}>{team.points}</div>
                  <div className="font-mono text-[11px] tabular-nums text-white/80">
                    {getGap(team.points, topTeams[0].points)}
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>

        <div className="mt-auto border-t border-white/[0.04] px-5 py-3 flex items-center justify-between">
          <Link
            to="/team-pace"
            className="text-[12px] font-medium text-white/80 transition-colors hover:text-white"
          >
            Pace Analysis
          </Link>
          <Link
            to="/standings/teams"
            className="flex items-center gap-1 text-[12px] font-medium text-white/80 transition-colors hover:text-white"
          >
            Full Standings
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
