import React from 'react';
import { m } from 'motion/react';
import { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';
import { Profile } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { useFavoritesWidgetData } from '@/hooks/useFavoritesWidgetData';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';

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
  const getDriverImageForYear = (code: string) => getDriverImage(code, selectedYear);

  const { favoriteDriver, favoriteTeam } = useFavoritesWidgetData(
    profile,
    drivers,
    teams,
    schedule
  );

  if (isLoading) {
    return <div className={`h-full animate-pulse ${CARD_CONTAINER}`} />;
  }

  // No favorites set
  if (!profile?.favorite_driver && !profile?.favorite_team) {
    return (
      <div className={`h-full flex flex-col ${CARD_CONTAINER} p-5`}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-[14px] font-medium text-white">Personalize your dashboard</p>
            <p className="mt-1 text-[13px] text-white/80">
              Select a favorite driver and team to unlock rivalry tracking and custom stats.
            </p>
            <Link
              to="/settings"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-red-400 transition-colors hover:text-red-300"
            >
              Set up preferences
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
  }

  return (
    <div className={`h-full flex flex-col ${CARD_CONTAINER}`}>
      <div className="px-5 pt-5 pb-3">
        <span className={CARD_LABEL}>My Garage</span>
      </div>

      <div className="px-2 pb-3 flex-1 grid grid-cols-2 gap-0.5">
        {favoriteDriver && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-1.5 rounded-md px-3 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <Avatar className="mt-5 size-32 shrink-0 border border-white/[0.06]">
              <AvatarImage
                src={getDriverImageForYear(favoriteDriver.code)}
                className="object-cover object-top"
              />
              <AvatarFallback className="bg-white/[0.04] text-[10px] font-medium text-white/80">
                {favoriteDriver.code}
              </AvatarFallback>
            </Avatar>
            <div className="text-[14px] font-medium text-white text-center leading-tight">
              {favoriteDriver.name}
            </div>
            <div className="text-[12px] text-white/80">{favoriteDriver.team}</div>
            <div className="text-center">
              <div className="font text-[15px] tabular-nums text-white">P{favoriteDriver.rank}</div>
              <div className="font text-[12px] tabular-nums text-white/80">
                {favoriteDriver.points} pts
              </div>
            </div>
          </m.div>
        )}

        {favoriteTeam && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <Link
              to="/standings/teams"
              className="flex flex-col items-center gap-1.5 rounded-md px-3 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <div>
                {getTeamLogo(favoriteTeam.team) ? (
                  <img
                    src={getTeamLogo(favoriteTeam.team)!}
                    alt={favoriteTeam.team}
                    className="h-40 w-22 object-contain"
                  />
                ) : (
                  <span className="text-[12px] font-medium text-white/80">
                    {favoriteTeam.team.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="mt-2 -translate-y-2 text-[14px] font-medium text-white text-center leading-tight">
                {favoriteTeam.team}
              </div>
              <div className="text-center">
                <div className="font text-[15px] tabular-nums text-white">P{favoriteTeam.rank}</div>
                <div className="font text-[12px] tabular-nums text-white/80">
                  {favoriteTeam.points} pts
                </div>
              </div>
            </Link>
          </m.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesWidget;
