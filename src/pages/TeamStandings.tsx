import { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileTeamStandings from '@/components/mobile/pages/MobileTeamStandings';
import {
  fetchTeamStandings,
  TeamStanding,
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
import { TeamStandingsCard } from '@/components/standings/TeamStandingsCard';

const HERO_SKELETONS = ['p1', 'p2', 'p3'] as const;
const GRID_SKELETONS = Array.from({ length: 8 }, (_, i) => `ts-${i}`);

const TeamStandings = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileTeamStandings />;

  return <TeamStandingsDesktop />;
};

const TeamStandingsDesktop = () => {
  const { selectedYear } = useSeason();
  const { profile } = useAuth();
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

  const isPreSeason = teamStandings && teamStandings.length > 0 && teamStandings[0].points === 0;
  const heroTeams = isPreSeason ? [] : teamStandings?.slice(0, 3) || [];
  const restTeams = isPreSeason ? teamStandings || [] : teamStandings?.slice(3) || [];

  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (teamStandings && teamStandings.length >= 2 && schedule && raceResults) {
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
    championshipStatus = getChampionshipStatus(
      teamStandings[0].points,
      teamStandings[1].points,
      remainingPoints
    );
  }

  const leaderLabel =
    championshipStatus === 'champion' ? "Constructors' Champion" : "Constructors' Leader";

  const favoriteTeam = profile?.favorite_team ?? null;
  const isFav = (team: TeamStanding) =>
    !!favoriteTeam &&
    (team.team === favoriteTeam || team.team.toLowerCase().includes(favoriteTeam.toLowerCase()));

  return (
    <>
      <SEO
        title="Team Standings"
        description={`See the ${selectedYear} team standings with points, wins, podiums, and constructors championship context.`}
        keywords={['f1 constructor standings', 'f1 teams', `${selectedYear} constructors`]}
      />

      <StandingsHeader
        title="Constructor Standings"
        subtitle="World Constructors Championship"
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
            {(error as Error)?.message || 'Could not load team standings.'}
          </p>
        </div>
      ) : teamStandings && teamStandings.length > 0 ? (
        <div className="space-y-5">
          {/* Hero row — P1 / P2 / P3 in natural left-to-right order */}
          {heroTeams.length > 0 && (
            <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-3`}>
              {heroTeams.map((team, i) => (
                <div
                  key={team.team}
                  className={
                    team.rank === 1 ? 'md:order-1' : team.rank === 2 ? 'md:order-2' : 'md:order-3'
                  }
                >
                  <TeamStandingsCard
                    team={team}
                    year={selectedYear}
                    variant="hero"
                    leaderLabel={team.rank === 1 ? leaderLabel : undefined}
                    isFavorite={isFav(team)}
                    delay={i * 0.03}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Rest of the grid */}
          {restTeams.length > 0 && (
            <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 lg:grid-cols-3`}>
              {restTeams.map((team, i) => (
                <TeamStandingsCard
                  key={team.team}
                  team={team}
                  year={selectedYear}
                  variant="regular"
                  isFavorite={isFav(team)}
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

export default TeamStandings;
