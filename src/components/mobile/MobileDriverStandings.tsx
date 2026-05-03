import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
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
import { isTestingEvent, getTeamColorClass, isRookie } from '@/lib/standingsUtils';
import { cn } from '@/lib/utils';
import {
  MobileStandingsShell,
  MobileLeaderCard,
  MobileStandingsRow,
} from './MobileStandingsShared';

const MobileDriverStandings: React.FC = () => {
  const [now] = useState(() => Date.now());
  const { selectedYear } = useSeason();
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const { data: driverStandings, isLoading } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
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
  if (driverStandings && driverStandings.length >= 2 && schedule && raceResults) {
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
    championshipStatus = getChampionshipStatus(
      driverStandings[0].points,
      driverStandings[1].points,
      remainingPoints
    );
  }

  const isPreSeason =
    driverStandings && driverStandings.length > 0 && driverStandings[0].points === 0;
  const leader = isPreSeason ? null : driverStandings?.[0];
  const rest = isPreSeason ? driverStandings || [] : driverStandings?.slice(1) || [];

  return (
    <MobileStandingsShell
      isLoading={isLoading}
      isEmpty={!driverStandings || driverStandings.length === 0}
      emptyYear={selectedYear}
    >
      {leader && (
        <MobileLeaderCard
          championshipStatus={championshipStatus}
          championLabel="World Champion"
          leaderLabel="Championship Leader"
          teamColorClass={getTeamColorClass(leader.team)}
          points={leader.points}
          wins={leader.wins}
          podiums={leader.podiums}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              {getDriverImage(leader.code, selectedYear) ? (
                <img
                  src={getDriverImage(leader.code, selectedYear)!}
                  alt={leader.name}
                  className="w-full h-full object-cover object-top border-2 border-amber-500/20 rounded-md"
                  style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                />
              ) : (
                <Avatar className="w-full h-full border-2 border-amber-500/20 rounded-md">
                  <AvatarFallback className="text-2xl bg-zinc-900 text-amber-400 font-black rounded-md">
                    {leader.code}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black text-sm border-2 border-black rounded-md">
                1
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black uppercase italic tracking-tight">
                  {leader.name}
                </h2>
                {isRookie(leader.code, selectedYear) && (
                  <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-sm">
                    R
                  </span>
                )}
              </div>
              <div className="text-xs text-white/40 uppercase font-mono mb-3">{leader.team}</div>
            </div>
          </div>
        </MobileLeaderCard>
      )}
      <AnimatePresence>
        {rest.map((driver, index) => {
          const driverIsRookie = isRookie(driver.code, selectedYear);
          const driverImage = getDriverImage(driver.code, selectedYear);
          const isExp = expandedDriver === driver.code;
          return (
            <MobileStandingsRow
              key={driver.code}
              rank={driver.rank}
              teamColorClass={getTeamColorClass(driver.team)}
              name={driver.name}
              team={driver.team}
              points={driver.points}
              wins={driver.wins}
              podiums={driver.podiums}
              pointsChange={driver.points_change}
              index={index}
              isExpanded={isExp}
              onToggle={() => setExpandedDriver(isExp ? null : driver.code)}
              rankBadge={
                driverIsRookie ? (
                  <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-sm">
                    R
                  </span>
                ) : undefined
              }
              expandedContent={
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {driverImage ? (
                      <img
                        src={driverImage}
                        alt={driver.name}
                        className="w-full h-full object-cover object-top border-2 border-white/10 rounded-md"
                        style={{
                          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                        }}
                      />
                    ) : (
                      <Avatar className="w-full h-full border-2 border-white/10 rounded-md">
                        <AvatarFallback className="text-xl bg-zinc-900 font-black rounded-md">
                          {driver.code}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center text-xs font-black border-2 border-black rounded-md',
                        driver.rank === 2
                          ? 'bg-gray-300 text-black'
                          : driver.rank === 3
                            ? 'bg-amber-700 text-black'
                            : 'bg-zinc-800 text-white'
                      )}
                    >
                      {driver.rank}
                    </div>
                  </div>
                  <div className="flex-1">
                    {/* uses default expanded content from MobileStandingsRow */}
                  </div>
                </div>
              }
              collapsedContent={
                <>
                  <div className="h-10 w-10 overflow-hidden border-2 border-white/10 bg-zinc-900 flex-shrink-0 rounded-md">
                    {driverImage ? (
                      <img
                        src={driverImage}
                        alt={driver.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <Avatar className="h-full w-full rounded-md">
                        <AvatarFallback className="bg-zinc-900 font-black rounded-md">
                          {driver.code}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-sm uppercase italic truncate">
                        {driver.name}
                      </h3>
                      {driverIsRookie && (
                        <span className="text-[8px] font-black uppercase bg-blue-600 text-white px-1 py-0.5 rounded-sm">
                          R
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase font-mono truncate">
                      {driver.team}
                    </div>
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

export { MobileDriverStandings };
export default MobileDriverStandings;
