import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
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
import { cn } from '@/lib/utils';
import { getTeamLogo } from '@/lib/teamUtils';
import { getCarImage } from '@/utils/imageMapping';
import { isTestingEvent, getTeamColorClass } from '@/lib/standingsUtils';
import {
  MobileStandingsShell,
  MobileLeaderCard,
  MobileStandingsRow,
} from './MobileStandingsShared';

const MobileTeamStandings: React.FC = () => {
  const [now] = useState(() => Date.now());
  const { selectedYear } = useSeason();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const { data: teamStandings, isLoading } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
  });

  const { data: schedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

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

  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (teamStandings && teamStandings.length >= 2 && schedule && raceResults) {
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
    championshipStatus = getChampionshipStatus(
      teamStandings[0].points,
      teamStandings[1].points,
      remainingPoints
    );
  }

  const isPreSeason = teamStandings && teamStandings.length > 0 && teamStandings[0].points === 0;
  const leader = isPreSeason ? null : teamStandings?.[0];
  const rest = isPreSeason ? teamStandings || [] : teamStandings?.slice(1) || [];

  return (
    <MobileStandingsShell
      isLoading={isLoading}
      isEmpty={!teamStandings || teamStandings.length === 0}
      emptyYear={selectedYear}
    >
      {leader && (
        <MobileLeaderCard
          championshipStatus={championshipStatus}
          championLabel="Constructors' Champion"
          leaderLabel="Constructors' Leader"
          teamColorClass={getTeamColorClass(leader.team)}
          points={leader.points}
          wins={leader.wins}
          podiums={leader.podiums}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-28 flex-shrink-0">
              {getCarImage(leader.team, selectedYear) ? (
                <img
                  src={getCarImage(leader.team, selectedYear)!}
                  alt={leader.team}
                  className="w-full h-auto object-contain drop-shadow-md [mix-blend-mode:lighten]"
                />
              ) : getTeamLogo(leader.team) ? (
                <img
                  src={getTeamLogo(leader.team)}
                  alt={leader.team}
                  className="w-20 h-auto object-contain mx-auto"
                />
              ) : (
                <div className={`w-20 h-12 bg-f1-${getTeamColorClass(leader.team)}/30 mx-auto`} />
              )}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black text-sm border-2 border-black rounded-md">
                1
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black uppercase italic tracking-tight mb-1">
                {leader.team}
              </h2>
            </div>
          </div>
        </MobileLeaderCard>
      )}
      <AnimatePresence>
        {rest.map((team, index) => {
          const carImage = getCarImage(team.team, selectedYear);
          const logo = getTeamLogo(team.team);
          const teamColor = getTeamColorClass(team.team);
          const isExp = expandedTeam === team.team;
          return (
            <MobileStandingsRow
              key={team.team}
              rank={team.rank}
              teamColorClass={teamColor}
              name={team.team}
              points={team.points}
              wins={team.wins}
              podiums={team.podiums}
              pointsChange={team.points_change}
              index={index}
              isExpanded={isExp}
              onToggle={() => setExpandedTeam(isExp ? null : team.team)}
              expandedContent={
                <div className="flex items-center gap-4">
                  <div className="relative w-24 flex-shrink-0">
                    {carImage ? (
                      <img
                        src={carImage}
                        alt={team.team}
                        className="w-full h-auto object-contain drop-shadow-md [mix-blend-mode:lighten]"
                      />
                    ) : logo ? (
                      <img
                        src={logo}
                        alt={team.team}
                        className="w-16 h-auto object-contain mx-auto"
                      />
                    ) : (
                      <div className={`w-16 h-10 bg-f1-${teamColor}/30 mx-auto`} />
                    )}
                    <div
                      className={cn(
                        'absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 flex items-center justify-center text-xs font-black border-2 border-black rounded-md',
                        team.rank === 2
                          ? 'bg-gray-300 text-black'
                          : team.rank === 3
                            ? 'bg-amber-700 text-black'
                            : 'bg-zinc-800 text-white'
                      )}
                    >
                      {team.rank}
                    </div>
                  </div>
                  <div className="flex-1">{/* uses default expanded content */}</div>
                </div>
              }
              collapsedContent={
                <>
                  <div className="w-16 h-10 flex items-center justify-center flex-shrink-0">
                    {carImage ? (
                      <img
                        src={carImage}
                        alt={team.team}
                        className="w-full h-auto object-contain drop-shadow-md [mix-blend-mode:lighten]"
                      />
                    ) : logo ? (
                      <img
                        src={logo}
                        alt={team.team}
                        className={cn(
                          'h-6 w-auto object-contain',
                          team.team.toLowerCase().includes('aston') ? 'h-3' : ''
                        )}
                      />
                    ) : (
                      <div className={`w-12 h-8 bg-f1-${teamColor}/30`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm uppercase italic truncate">{team.team}</h3>
                  </div>
                </>
              }
            />
          );
        })}
      </AnimatePresence>
    </MobileStandingsShell>
  );
};

export { MobileTeamStandings };
export default MobileTeamStandings;
