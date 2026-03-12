import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  MinusSignCircleIcon,
  CrownIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
} from 'hugeicons-react';
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

const isTestingEvent = (event: ScheduleEvent): boolean =>
  Boolean(event.EventFormat?.toLowerCase().includes('test') || event.RoundNumber === 0);

// Native Season Selector Modal
interface SeasonSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  availableYears: number[];
  onSelect: (year: number) => void;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  isOpen,
  onClose,
  selectedYear,
  availableYears,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-black border-t-2 border-white/10 pb-24 rounded-t-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b-2 border-white/10">
            <h3 className="text-lg font-black uppercase italic tracking-tight">Select Season</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 transition-colors">
              <Cancel01Icon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => {
                  onSelect(year);
                  onClose();
                }}
                className={`w-full p-4 text-left border-2 transition-colors flex items-center justify-between mb-2 rounded-xl ${
                  selectedYear === year
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-black hover:bg-zinc-900 text-gray-300 border-white/10'
                }`}
              >
                <span className="text-lg font-black uppercase italic">{year} Season</span>
                {selectedYear === year && <CheckmarkCircle02Icon className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper to get team color class
const getTeamColorClass = (teamName: string | undefined): string => {
  if (!teamName) return 'gray';
  const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (simpleName.includes('mclaren')) return 'mclaren';
  if (simpleName.includes('mercedes')) return 'mercedes';
  if (simpleName.includes('redbull')) return 'redbull';
  if (simpleName.includes('ferrari')) return 'ferrari';
  if (simpleName.includes('alpine')) return 'alpine';
  if (simpleName.includes('astonmartin')) return 'astonmartin';
  if (simpleName.includes('williams')) return 'williams';
  if (simpleName.includes('haas')) return 'haas';
  if (simpleName.includes('sauber')) return 'alfaromeo';
  if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
  return 'gray';
};

// Get team car image

// Leader Card Component - P1
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-black border-2 border-yellow-600 rounded-xl"
    >
      {/* Crown Icon */}
      <div className="absolute -top-2 -right-2 text-yellow-600/20">
        <CrownIcon className="w-24 h-24" />
      </div>

      {/* Team Color Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-f1-${teamColor}`} />

      <div className="relative z-10 p-4">
        {/* Champion Badge */}
        <div className="text-center mb-3">
          <span className="inline-block px-3 py-1 bg-yellow-600 text-black font-black text-[10px] uppercase tracking-widest rounded-sm">
            {championshipStatus === 'champion' ? "Constructors' Champion" : "Constructors' Leader"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Team Logo & Car */}
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
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-600 flex items-center justify-center text-black font-black text-sm border-2 border-black rounded-md">
              1
            </div>
          </div>

          {/* Team Info */}
          <div className="flex-1">
            <h2 className="text-lg font-black uppercase italic tracking-tight mb-1">{team.team}</h2>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-3xl font-black text-white italic">{team.points}</span>
                <span className="text-xs text-gray-500 ml-1 font-mono">PTS</span>
              </div>
              <div className="flex gap-3 text-center">
                <div>
                  <div className="text-lg font-black text-yellow-600">{team.wins}</div>
                  <div className="text-[9px] text-gray-500 uppercase font-mono">Wins</div>
                </div>
                <div>
                  <div className="text-lg font-black text-gray-300">{team.podiums}</div>
                  <div className="text-[9px] text-gray-500 uppercase font-mono">Pods</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Regular Team Row Component (Expandable)
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

  const getChangeIndicator = (change: number | undefined) => {
    if (change === undefined) return null;
    if (change > 0) return { color: 'text-green-500', icon: <ArrowUp01Icon className="h-3 w-3" /> };
    if (change < 0) return { color: 'text-red-500', icon: <ArrowDown01Icon className="h-3 w-3" /> };
    return { color: 'text-gray-500', icon: <MinusSignCircleIcon className="h-3 w-3" /> };
  };

  const indicator = getChangeIndicator(team.points_change);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      layout
      onClick={onToggle}
      className="relative bg-black border-2 border-white/10 active:scale-[0.98] transition-transform cursor-pointer group hover:border-white/20 rounded-xl"
    >
      {/* Team Color Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-f1-${teamColor}`} />

      <AnimatePresence mode="wait">
        {isExpanded ? (
          // Expanded View - Similar to Leader Card
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <div className="flex items-center gap-4">
              {/* Team Logo/Car - Larger */}
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

              {/* Team Info */}
              <div className="flex-1">
                <h2 className="text-lg font-black uppercase italic tracking-tight mb-2">
                  {team.team}
                </h2>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-2xl font-black text-white italic">{team.points}</span>
                    <span className="text-xs text-gray-500 ml-1 font-mono">PTS</span>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <div className="text-base font-black text-yellow-600">{team.wins}</div>
                      <div className="text-[9px] text-gray-500 uppercase font-mono">Wins</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-gray-300">{team.podiums}</div>
                      <div className="text-[9px] text-gray-500 uppercase font-mono">Pods</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Collapsed View - Compact Row
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 pl-4"
          >
            {/* Position */}
            <div className="w-8 text-center">
              <span
                className={cn(
                  'text-lg font-black italic',
                  team.rank === 2
                    ? 'text-gray-300'
                    : team.rank === 3
                      ? 'text-amber-700'
                      : 'text-gray-500'
                )}
              >
                {team.rank}
              </span>
            </div>

            {/* Team Logo/Car */}
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

            {/* Team Name */}
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm uppercase italic truncate">{team.team}</h3>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="text-right min-w-[50px]">
                <div className="text-lg font-black italic">{team.points}</div>
                <div className="flex items-center justify-end gap-0.5 text-[9px] text-gray-500 font-mono">
                  <span>PTS</span>
                  {indicator && (
                    <span className={cn('flex items-center', indicator.color)}>
                      {indicator.icon}
                    </span>
                  )}
                </div>
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
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Fetch Team Standings
  const { data: teamStandings, isLoading } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
  });

  // Fetch Schedule for championship calculation
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

  // Fetch Race Results for championship calculation
  const { data: raceResults } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
    enabled: hasCompletedRaceEventsInSchedule,
  });

  // Calculate Championship Status
  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (teamStandings && teamStandings.length >= 2 && schedule && raceResults) {
    const p1Points = teamStandings[0].points;
    const p2Points = teamStandings[1].points;
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
    championshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
  }

  const isPreSeason = teamStandings && teamStandings.length > 0 && teamStandings[0].points === 0;
  const leader = isPreSeason ? null : teamStandings?.[0];
  const rest = isPreSeason ? teamStandings || [] : teamStandings?.slice(1) || [];

  return (
    <MobileLayout>
      <div className="min-h-screen bg-black text-white">
        <MobilePageHeader />

        {/* Season Selector */}
        <div className="px-4 py-3">
          <button
            onClick={() => setShowSeasonSelector(true)}
            className="flex items-center gap-2 bg-black border-2 border-white/10 rounded-xl px-3 py-2 text-sm font-black uppercase italic active:scale-95 transition-transform hover:bg-zinc-900"
          >
            <span>{selectedYear} Season</span>
            <ArrowDown01Icon className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-36 bg-zinc-900 animate-pulse border-2 border-white/5" />
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900 animate-pulse border-2 border-white/5" />
              ))}
            </div>
          ) : teamStandings && teamStandings.length > 0 ? (
            <>
              {/* P1 Leader Card */}
              {leader && (
                <LeaderCard
                  team={leader}
                  championshipStatus={championshipStatus}
                  selectedYear={selectedYear}
                />
              )}

              {/* Rest of the grid */}
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
            <div className="text-center py-12 text-gray-500 border-2 border-white/10 bg-zinc-900/30">
              <p className="text-sm font-mono uppercase">
                No standings available for {selectedYear}
              </p>
            </div>
          )}
        </div>

        {/* Season Selector Modal */}
        <SeasonSelector
          isOpen={showSeasonSelector}
          onClose={() => setShowSeasonSelector(false)}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onSelect={setSelectedYear}
        />
      </div>
    </MobileLayout>
  );
};

export { MobileTeamStandings };
export default MobileTeamStandings;
