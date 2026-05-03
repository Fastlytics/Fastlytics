import React, { useMemo, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion } from 'motion/react';
import {
  fetchDriverStandings,
  DriverStanding,
  fetchSchedule,
  fetchRaceResults,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getDriverImage } from '@/utils/imageMapping';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDriverStandings } from '@/components/mobile';
import {
  getTeamColorClass,
  getChangeIndicator,
  isRookie,
  isTestingEvent,
} from '@/lib/standingsUtils';
import {
  StandingsLayout,
  StandingsLoadingSkeleton,
  StandingsErrorState,
  StandingsEmptyState,
  StandingsTableRow,
} from '@/components/standings/StandingsPageLayout';
import { PodiumCard } from '@/components/standings/PodiumCard';
import { SEO } from '@/components/layout/SEO';

const DriverStandings = () => {
  const isMobile = useIsMobile();
  const { selectedYear } = useSeason();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('driver_standings', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: driverStandings,
    isLoading,
    error,
    isError,
  } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
  });

  const { data: schedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

  const [now] = React.useState(() => Date.now());
  const hasCompletedRaceEventsInSchedule = useMemo(
    () =>
      (schedule ?? []).some(
        (event) => !isTestingEvent(event) && new Date(event.EventDate).getTime() <= now
      ),
    [schedule, now]
  );

  const { data: raceResults } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
    enabled: hasCompletedRaceEventsInSchedule,
  });

  const isPreSeason =
    driverStandings && driverStandings.length > 0 && driverStandings[0].points === 0;
  const top3 = isPreSeason ? [] : driverStandings?.slice(0, 3) || [];
  const rest = isPreSeason ? driverStandings || [] : driverStandings?.slice(3) || [];

  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (driverStandings && driverStandings.length >= 2 && schedule && raceResults) {
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
    championshipStatus = getChampionshipStatus(
      driverStandings[0].points,
      driverStandings[1].points,
      remainingPoints
    );
  }

  if (isMobile) {
    return (
      <>
        <SEO
          title={`F1 Driver Standings ${selectedYear} — Fastlytics`}
          description={`Formula 1 ${selectedYear} Driver Championship standings, points, wins, and podiums.`}
        />
        <MobileDriverStandings />
      </>
    );
  }

  return (
    <StandingsLayout
      title="Driver Standings"
      subtitle="World Drivers Championship"
      seoTitle={`F1 Driver Standings ${selectedYear} — Fastlytics`}
      seoDescription={`Formula 1 ${selectedYear} Driver Championship standings, points, wins, and podiums.`}
      selectedYear={selectedYear}
    >
      {isLoading ? (
        <StandingsLoadingSkeleton />
      ) : isError ? (
        <StandingsErrorState message={(error as Error)?.message || 'Please try again later.'} />
      ) : driverStandings && driverStandings.length > 0 ? (
        <>
          {/* Podium Section */}
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
            {top3.map((driver, i) => {
              const position = (i + 1) as 1 | 2 | 3;
              return (
                <PodiumCard
                  key={driver.code}
                  position={position}
                  colorClass={getTeamColorClass(driver.team)}
                  points={driver.points}
                  wins={driver.wins}
                  podiums={driver.podiums}
                  leaderLabel={
                    position === 1
                      ? championshipStatus === 'champion'
                        ? 'World Champion'
                        : 'Championship Leader'
                      : undefined
                  }
                >
                  <Avatar
                    className={
                      position === 1
                        ? 'mb-4 h-36 w-36 border border-amber-500/20'
                        : 'mb-4 h-36 w-36 border border-white/[0.08]'
                    }
                  >
                    <AvatarImage
                      src={getDriverImage(driver.code, selectedYear)}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="bg-[#1a1a1e] text-[14px] font-bold">
                      {driver.code}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-[12px] font-medium tracking-wider text-white/40">
                    {driver.team}
                  </div>
                  <div className="mt-1 text-[18px] font-bold text-white">{driver.name}</div>
                </PodiumCard>
              );
            })}
          </div>

          {/* Rest of the Grid */}
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
            <div className="divide-y divide-white/[0.04]">
              {rest.map((driver, index) => (
                <StandingsTableRow
                  key={driver.code}
                  rank={driver.rank}
                  colorClass={getTeamColorClass(driver.team)}
                  name={driver.name}
                  team={driver.team}
                  wins={driver.wins}
                  podiums={driver.podiums}
                  points={driver.points}
                  pointsChange={driver.points_change}
                  delay={index * 0.04}
                  indicator={getChangeIndicator(driver.points_change)}
                  beforeName={
                    <Avatar className="h-22 w-22 shrink-0 border border-white/[0.08]">
                      <AvatarImage
                        src={getDriverImage(driver.code, selectedYear)}
                        className="object-cover object-top"
                      />
                      <AvatarFallback className="bg-[#1a1a1e] text-[11px] font-bold">
                        {driver.code}
                      </AvatarFallback>
                    </Avatar>
                  }
                  nameExtras={
                    isRookie(driver.code, selectedYear) && (
                      <span className="inline-flex rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                        R
                      </span>
                    )
                  }
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <StandingsEmptyState year={selectedYear} />
      )}
    </StandingsLayout>
  );
};

export { DriverStandings };
export default DriverStandings;
