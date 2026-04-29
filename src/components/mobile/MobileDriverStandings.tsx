import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp01Icon, ArrowDown01Icon, MinusSignCircleIcon, CrownIcon } from 'hugeicons-react';
import {
  fetchDriverStandings,
  DriverStanding,
  fetchSchedule,
  fetchRaceResults,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getDriverImage } from '@/utils/imageMapping';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';
import { isTestingEvent, getTeamColorClass, isRookie } from '@/lib/standingsUtils';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const getChangeIndicator = (change: number | undefined) => {
  if (change === undefined) return null;
  if (change > 0) return { color: 'text-emerald-400', icon: <ArrowUp01Icon className="h-3 w-3" /> };
  if (change < 0) return { color: 'text-red-400', icon: <ArrowDown01Icon className="h-3 w-3" /> };
  return { color: 'text-white/30', icon: <MinusSignCircleIcon className="h-3 w-3" /> };
};

const LeaderCard: React.FC<{
  driver: DriverStanding;
  championshipStatus: 'leader' | 'champion';
  selectedYear: number;
}> = ({ driver, championshipStatus, selectedYear }) => {
  const teamColor = getTeamColorClass(driver.team);
  const driverIsRookie = isRookie(driver.code, selectedYear);
  const driverImage = getDriverImage(driver.code, selectedYear);

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
            {championshipStatus === 'champion' ? 'World Champion' : 'Championship Leader'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            {driverImage ? (
              <img
                src={driverImage}
                alt={driver.name}
                className="w-full h-full object-cover object-top border-2 border-amber-500/20 rounded-md"
                style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
              />
            ) : (
              <Avatar className="w-full h-full border-2 border-amber-500/20 rounded-md">
                <AvatarFallback className="text-2xl bg-zinc-900 text-amber-400 font-black rounded-md">
                  {driver.code}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black text-sm border-2 border-black rounded-md">
              1
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black uppercase italic tracking-tight">{driver.name}</h2>
              {driverIsRookie && (
                <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-sm">
                  R
                </span>
              )}
            </div>
            <div className="text-xs text-white/40 uppercase font-mono mb-3">{driver.team}</div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-3xl font-black text-amber-400 italic">{driver.points}</span>
                <span className="text-xs text-white/40 ml-1 font-mono">PTS</span>
              </div>
              <div className="flex gap-3 text-center">
                <div>
                  <div className="text-lg font-black text-amber-400">{driver.wins}</div>
                  <div className="text-[9px] text-white/40 uppercase font-mono">Wins</div>
                </div>
                <div>
                  <div className="text-lg font-black text-white/60">{driver.podiums}</div>
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

const DriverRow: React.FC<{
  driver: DriverStanding;
  index: number;
  selectedYear: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ driver, index, selectedYear, isExpanded, onToggle }) => {
  const teamColor = getTeamColorClass(driver.team);
  const driverIsRookie = isRookie(driver.code, selectedYear);
  const indicator = getChangeIndicator(driver.points_change);
  const driverImage = getDriverImage(driver.code, selectedYear);

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
              <div className="relative w-20 h-20 flex-shrink-0">
                {driverImage ? (
                  <img
                    src={driverImage}
                    alt={driver.name}
                    className="w-full h-full object-cover object-top border-2 border-white/10 rounded-md"
                    style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
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
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-black uppercase italic tracking-tight">
                    {driver.name}
                  </h2>
                  {driverIsRookie && (
                    <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-sm">
                      R
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/40 uppercase font-mono mb-2">{driver.team}</div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-2xl font-black text-white italic">{driver.points}</span>
                    <span className="text-xs text-white/40 ml-1 font-mono">PTS</span>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <div className="text-base font-black text-amber-400">{driver.wins}</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono">Wins</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-white/60">{driver.podiums}</div>
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
                  driver.rank === 2
                    ? 'text-gray-300'
                    : driver.rank === 3
                      ? 'text-amber-700'
                      : 'text-white/40'
                )}
              >
                {driver.rank}
              </span>
            </div>
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
                <h3 className="font-black text-sm uppercase italic truncate">{driver.name}</h3>
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="text-lg font-black italic">{driver.points}</span>
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
          ) : driverStandings && driverStandings.length > 0 ? (
            <>
              {leader && (
                <LeaderCard
                  driver={leader}
                  championshipStatus={championshipStatus}
                  selectedYear={selectedYear}
                />
              )}
              <AnimatePresence>
                {rest.map((driver, index) => (
                  <DriverRow
                    key={driver.code}
                    driver={driver}
                    index={index}
                    selectedYear={selectedYear}
                    isExpanded={expandedDriver === driver.code}
                    onToggle={() =>
                      setExpandedDriver(expandedDriver === driver.code ? null : driver.code)
                    }
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

export { MobileDriverStandings };
export default MobileDriverStandings;
