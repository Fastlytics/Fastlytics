import { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  fetchDriverStandings,
  DriverStanding,
  fetchSchedule,
  fetchRaceResults,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useSeason } from '@/contexts/SeasonContext';
import { useAuth } from '@/contexts/AuthContext';
import { isTestingEvent } from '@/lib/standingsUtils';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER, CARD_GAP } from '@/lib/card-styles';
import { StandingsHeader } from '@/components/standings/StandingsHeader';
import { DriverStandingsCard } from '@/components/standings/DriverStandingsCard';

const HERO_SKELETONS = ['p1', 'p2', 'p3'] as const;
const GRID_SKELETONS = Array.from({ length: 8 }, (_, i) => `ds-${i}`);

const DriverStandings = () => {
  const { selectedYear } = useSeason();
  const { profile } = useAuth();
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

  const [now] = useState(() => Date.now());
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

  const heroDrivers = isPreSeason ? [] : driverStandings?.slice(0, 3) || [];
  const restDrivers = isPreSeason ? driverStandings || [] : driverStandings?.slice(3) || [];

  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (driverStandings && driverStandings.length >= 2 && schedule && raceResults) {
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
    championshipStatus = getChampionshipStatus(
      driverStandings[0].points,
      driverStandings[1].points,
      remainingPoints
    );
  }

  const leaderLabel = championshipStatus === 'champion' ? 'World Champion' : 'Championship Leader';

  const favoriteDriverCode = profile?.favorite_driver ?? null;
  const isFav = (driver: DriverStanding) =>
    !!favoriteDriverCode &&
    (driver.code === favoriteDriverCode ||
      driver.name.toLowerCase().includes(favoriteDriverCode.toLowerCase()));

  return (
    <>
      <SEO
        title="Driver Standings"
        description={`See the ${selectedYear} driver standings with points, wins, podiums, and championship momentum across the season.`}
        keywords={['f1 driver standings', 'f1 championship', `${selectedYear} drivers`]}
      />

      <StandingsHeader
        title="Driver Standings"
        subtitle="World Drivers Championship"
        selectedYear={selectedYear}
      />

      {isLoading ? (
        <div className="space-y-5">
          <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-3`}>
            {HERO_SKELETONS.map((id) => (
              <div key={id} className={`h-[180px] animate-pulse ${CARD_CONTAINER}`} />
            ))}
          </div>
          <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 lg:grid-cols-3`}>
            {GRID_SKELETONS.map((id) => (
              <div key={id} className={`h-[140px] animate-pulse ${CARD_CONTAINER}`} />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className={`${CARD_CONTAINER} px-5 py-12 text-center`}>
          <p className="text-[13px] text-white/80">
            {(error as Error)?.message || 'Could not load driver standings.'}
          </p>
        </div>
      ) : driverStandings && driverStandings.length > 0 ? (
        <div className="space-y-5">
          {/* Hero row — P1/P2/P3 in natural left-to-right order */}
          {heroDrivers.length > 0 && (
            <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-3`}>
              {heroDrivers.map((driver, i) => (
                <div
                  key={driver.code}
                  className={
                    driver.rank === 1
                      ? 'md:order-1'
                      : driver.rank === 2
                        ? 'md:order-2'
                        : 'md:order-3'
                  }
                >
                  <DriverStandingsCard
                    driver={driver}
                    year={selectedYear}
                    variant="hero"
                    leaderLabel={driver.rank === 1 ? leaderLabel : undefined}
                    isFavorite={isFav(driver)}
                    delay={i * 0.03}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Rest of the grid */}
          {restDrivers.length > 0 && (
            <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 lg:grid-cols-3`}>
              {restDrivers.map((driver, i) => (
                <DriverStandingsCard
                  key={driver.code}
                  driver={driver}
                  year={selectedYear}
                  variant="regular"
                  isFavorite={isFav(driver)}
                  delay={Math.min(i * 0.015, 0.2)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`${CARD_CONTAINER} px-5 py-12 text-center`}>
          <p className="text-[13px] text-white/80">No standings data for {selectedYear}.</p>
        </div>
      )}
    </>
  );
};

export default DriverStandings;
