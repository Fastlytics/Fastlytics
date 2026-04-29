import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp01Icon, ArrowDown01Icon, MinusSignCircleIcon, CrownIcon } from 'hugeicons-react';
import {
  fetchTeamStandings,
  TeamStanding,
  fetchSchedule,
  fetchRaceResults,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getTeamLogo } from '@/lib/teamUtils';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';
import { getCarImage } from '@/utils/imageMapping';
import { isTestingEvent, getTeamColorClass } from '@/lib/standingsUtils';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const getChangeIndicator = (change: number | undefined) => {
  if (change === undefined) return null;
  if (change > 0) return { color: 'text-emerald-400', icon: <ArrowUp01Icon className="h-3 w-3" /> };
  if (change < 0) return { color: 'text-red-400', icon: <ArrowDown01Icon className="h-3 w-3" /> };
  return { color: 'text-white/30', icon: <MinusSignCircleIcon className="h-3 w-3" /> };
};

const LeaderCard: React.FC<{
  team: TeamStanding;
  championshipStatus: 'leader' | 'champion';
  selectedYear: number;
}> = ({ team, championshipStatus, selectedYear }) => {
  const teamColor = getTeamColorClass(team.team);
  const carImage = getCarImage(team.team, selectedYear);
  const logo = getTeamLogo(team.team);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-black border-2 border-amber-500/50 rounded-xl"
    >
      <div className="absolute -top-2 -right-2 text-amber-500/15">
        <CrownIcon className="w-24 h-24" />
      </div>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-f1-${teamColor}`} />
      <div className="relative z-10 p-4">
        <div className="text-center mb-3">
          <span className="inline-block px-3 py-1 bg-amber-500/15 text-amber-400 font-black text-[10px] uppercase tracking-widest rounded-full border border-amber-500/20">
            {championshipStatus === 'champion' ? "Constructors' Champion" : "Constructors' Leader"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-28 flex-shrink-0">
            {carImage ? (
              <img
                src={carImage}
                alt={team.team}
                className="w-full h-auto object-contain drop-shadow-md [mix-blend-mode:lighten]"
              />
            ) : logo ? (
              <img src={logo} alt={team.team} className="w-20 h-auto object-contain mx-auto" />
            ) : (
              <div className={`w-20 h-12 bg-f1-${teamColor}/30 mx-auto`} />
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black text-sm border-2 border-black rounded-md">
              1
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black uppercase italic tracking-tight mb-1">{team.team}</h2>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-3xl font-black text-amber-400 italic">{team.points}</span>
                <span className="text-xs text-white/40 ml-1 font-mono">PTS</span>
              </div>
              <div className="flex gap-3 text-center">
                <div>
                  <div className="text-lg font-black text-amber-400">{team.wins}</div>
                  <div className="text-[9px] text-white/40 uppercase font-mono">Wins</div>
                </div>
                <div>
                  <div className="text-lg font-black text-white/60">{team.podiums}</div>
                  <div className="text-[9px] text-white/40 uppercase font-mono">Pods</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TeamRow: React.FC<{
  team: TeamStanding;
  index: number;
  selectedYear: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ team, index, selectedYear, isExpanded, onToggle }) => {
  const teamColor = getTeamColorClass(team.team);
  const carImage = getCarImage(team.team, selectedYear);
  const logo = getTeamLogo(team.team);
  const indicator = getChangeIndicator(team.points_change);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      layout
      onClick={onToggle}
      className="relative bg-black border-2 border-white/10 active:scale-[0.98] transition-transform cursor-pointer group hover:border-white/20 rounded-xl"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-f1-${teamColor}`} />

      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-24 flex-shrink-0">
                {carImage ? (
                  <img
                    src={carImage}
                    alt={team.team}
                    className="w-full h-auto object-contain drop-shadow-md [mix-blend-mode:lighten]"
                  />
                ) : logo ? (
                  <img src={logo} alt={team.team} className="w-16 h-auto object-contain mx-auto" />
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
              <div className="flex-1">
                <h2 className="text-lg font-black uppercase italic tracking-tight mb-2">
                  {team.team}
                </h2>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-2xl font-black text-white italic">{team.points}</span>
                    <span className="text-xs text-white/40 ml-1 font-mono">PTS</span>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <div className="text-base font-black text-amber-400">{team.wins}</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono">Wins</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-white/60">{team.podiums}</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono">Pods</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 pl-4"
          >
            <div className="w-8 text-center">
              <span
                className={cn(
                  'text-lg font-black italic',
                  team.rank === 2
                    ? 'text-gray-300'
                    : team.rank === 3
                      ? 'text-amber-700'
                      : 'text-white/40'
                )}
              >
                {team.rank}
              </span>
            </div>
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="text-lg font-black italic">{team.points}</span>
                  {indicator && (
                    <span
                      className={cn('flex items-center text-[11px] font-medium', indicator.color)}
                    >
                      {indicator.icon}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-white/40 font-mono">PTS</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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
    <MobileLayout>
      <div style={inter} className="min-h-screen bg-[#09090b] text-white">
        <MobilePageHeader />
        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-36 bg-zinc-900 animate-pulse border-2 border-white/5 rounded-xl" />
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-zinc-900 animate-pulse border-2 border-white/5 rounded-xl"
                />
              ))}
            </div>
          ) : teamStandings && teamStandings.length > 0 ? (
            <>
              {leader && (
                <LeaderCard
                  team={leader}
                  championshipStatus={championshipStatus}
                  selectedYear={selectedYear}
                />
              )}
              <AnimatePresence>
                {rest.map((team, index) => (
                  <TeamRow
                    key={team.team}
                    team={team}
                    index={index}
                    selectedYear={selectedYear}
                    isExpanded={expandedTeam === team.team}
                    onToggle={() => setExpandedTeam(expandedTeam === team.team ? null : team.team)}
                  />
                ))}
              </AnimatePresence>
            </>
          ) : (
            <div className="text-center py-12 text-white/40 border-2 border-white/10 bg-zinc-900/30 rounded-xl">
              <p className="text-sm font-mono uppercase">
                No standings available for {selectedYear}
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export { MobileTeamStandings };
export default MobileTeamStandings;
