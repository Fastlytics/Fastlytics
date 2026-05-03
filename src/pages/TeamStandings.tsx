import React, { useMemo, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  fetchTeamStandings,
  TeamStanding,
  fetchSchedule,
  fetchRaceResults,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getCarImage } from '@/utils/imageMapping';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTeamStandings } from '@/components/mobile';
import { getTeamColorClass, getChangeIndicator, isTestingEvent } from '@/lib/standingsUtils';
import {
  StandingsLayout,
  StandingsLoadingSkeleton,
  StandingsErrorState,
  StandingsEmptyState,
  StandingsTableRow,
} from '@/components/standings/StandingsPageLayout';
import { PodiumCard } from '@/components/standings/PodiumCard';
import { SEO } from '@/components/layout/SEO';

const TeamStandings = () => {
  const isMobile = useIsMobile();
  const { selectedYear } = useSeason();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('team_standings', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: teamStandings,
    isLoading,
    error,
    isError,
  } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
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

  const isPreSeason = teamStandings && teamStandings.length > 0 && teamStandings[0].points === 0;
  const top3 = isPreSeason ? [] : teamStandings?.slice(0, 3) || [];
  const rest = isPreSeason ? teamStandings || [] : teamStandings?.slice(3) || [];

  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (teamStandings && teamStandings.length >= 2 && schedule && raceResults) {
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
    championshipStatus = getChampionshipStatus(
      teamStandings[0].points,
      teamStandings[1].points,
      remainingPoints
    );
  }

  if (isMobile) {
    return (
      <>
        <SEO
          title={`F1 Constructor Standings ${selectedYear} — Fastlytics`}
          description={`Formula 1 ${selectedYear} Constructor Championship standings, points, wins, and podiums.`}
        />
        <MobileTeamStandings />
      </>
    );
  }

  return (
    <StandingsLayout
      title="Constructor Standings"
      subtitle="World Constructors Championship"
      seoTitle={`F1 Constructor Standings ${selectedYear} — Fastlytics`}
      seoDescription={`Formula 1 ${selectedYear} Constructor Championship standings, points, wins, and podiums.`}
      selectedYear={selectedYear}
    >
      {isLoading ? (
        <StandingsLoadingSkeleton />
      ) : isError ? (
        <StandingsErrorState message={(error as Error)?.message || 'Please try again later.'} />
      ) : teamStandings && teamStandings.length > 0 ? (
        <>
          {/* Podium Section */}
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
            {top3.map((team, i) => {
              const position = (i + 1) as 1 | 2 | 3;
              const carImg = getCarImage(team.team, selectedYear);
              return (
                <PodiumCard
                  key={team.team}
                  position={position}
                  colorClass={getTeamColorClass(team.team)}
                  points={team.points}
                  wins={team.wins}
                  podiums={team.podiums}
                  leaderLabel={
                    position === 1
                      ? championshipStatus === 'champion'
                        ? "Constructors' Champion"
                        : "Constructors' Leader"
                      : undefined
                  }
                >
                  {carImg && (
                    <img
                      src={carImg}
                      alt={team.team}
                      className={
                        position === 1
                          ? 'mb-4 h-20 w-auto object-contain drop-shadow-md [mix-blend-mode:lighten]'
                          : 'mb-4 h-18 w-auto object-contain [mix-blend-mode:lighten]'
                      }
                    />
                  )}
                  <div
                    className={
                      position === 1
                        ? 'text-[22px] font-bold text-white'
                        : 'text-[18px] font-bold text-white'
                    }
                  >
                    {team.team}
                  </div>
                </PodiumCard>
              );
            })}
          </div>

          {/* Rest of the Grid */}
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
            <div className="divide-y divide-white/[0.04]">
              {rest.map((team, index) => {
                const carImg = getCarImage(team.team, selectedYear);
                return (
                  <StandingsTableRow
                    key={team.team}
                    rank={team.rank}
                    colorClass={getTeamColorClass(team.team)}
                    name={team.team}
                    wins={team.wins}
                    podiums={team.podiums}
                    points={team.points}
                    pointsChange={team.points_change}
                    delay={index * 0.04}
                    indicator={getChangeIndicator(team.points_change)}
                    beforeName={
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center">
                        {carImg ? (
                          <img
                            src={carImg}
                            alt={team.team}
                            className="h-full w-full object-contain [mix-blend-mode:lighten]"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#1a1a1e]">
                            <span className="text-[11px] font-bold text-white/55">
                              {team.team.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <StandingsEmptyState year={selectedYear} />
      )}
    </StandingsLayout>
  );
};

export { TeamStandings };
export default TeamStandings;
