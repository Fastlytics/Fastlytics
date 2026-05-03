import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CrownIcon, ArrowUp01Icon, ArrowDown01Icon, MinusSignCircleIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

interface MobileStandingsShellProps {
  isLoading: boolean;
  isEmpty: boolean;
  emptyYear: number;
  children: React.ReactNode;
}

export const MobileStandingsShell: React.FC<MobileStandingsShellProps> = ({
  isLoading,
  isEmpty,
  emptyYear,
  children,
}) => (
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
        ) : isEmpty ? (
          <div className="text-center py-12 text-white/40 border-2 border-white/10 bg-zinc-900/30 rounded-xl">
            <p className="text-sm font-mono uppercase">No standings available for {emptyYear}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  </MobileLayout>
);

interface MobileLeaderCardProps {
  championshipStatus: 'leader' | 'champion';
  championLabel: string;
  leaderLabel: string;
  teamColorClass: string;
  points: number;
  wins: number;
  podiums: number;
  children: React.ReactNode;
}

export const MobileLeaderCard: React.FC<MobileLeaderCardProps> = ({
  championshipStatus,
  championLabel,
  leaderLabel,
  teamColorClass,
  points,
  wins,
  podiums,
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden bg-black border-2 border-amber-500/50 rounded-xl"
  >
    <div className="absolute -top-2 -right-2 text-amber-500/15">
      <CrownIcon className="w-24 h-24" />
    </div>
    <div className={`absolute top-0 left-0 right-0 h-1 bg-f1-${teamColorClass}`} />
    <div className="relative z-10 p-4">
      <div className="text-center mb-3">
        <span className="inline-block px-3 py-1 bg-amber-500/15 text-amber-400 font-black text-[10px] uppercase tracking-widest rounded-full border border-amber-500/20">
          {championshipStatus === 'champion' ? championLabel : leaderLabel}
        </span>
      </div>
      {children}
      <div className="flex items-center gap-4 mt-3">
        <div>
          <span className="text-3xl font-black text-amber-400 italic">{points}</span>
          <span className="text-xs text-white/40 ml-1 font-mono">PTS</span>
        </div>
        <div className="flex gap-3 text-center">
          <div>
            <div className="text-lg font-black text-amber-400">{wins}</div>
            <div className="text-[9px] text-white/40 uppercase font-mono">Wins</div>
          </div>
          <div>
            <div className="text-lg font-black text-white/60">{podiums}</div>
            <div className="text-[9px] text-white/40 uppercase font-mono">Pods</div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

interface MobileStandingsRowProps {
  rank: number;
  teamColorClass: string;
  name: string;
  team?: string;
  points: number;
  wins: number;
  podiums: number;
  pointsChange?: number;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  rankBadge?: React.ReactNode;
  expandedContent?: React.ReactNode;
  collapsedContent?: React.ReactNode;
}

export const MobileStandingsRow: React.FC<MobileStandingsRowProps> = ({
  rank,
  teamColorClass,
  name,
  team,
  points,
  wins,
  podiums,
  pointsChange,
  index,
  isExpanded,
  onToggle,
  rankBadge,
  expandedContent,
  collapsedContent,
}) => {
  const indicator =
    pointsChange !== undefined
      ? (() => {
          if (pointsChange > 0)
            return { color: 'text-emerald-400', icon: <ArrowUp01Icon className="h-3 w-3" /> };
          if (pointsChange < 0)
            return { color: 'text-red-400', icon: <ArrowDown01Icon className="h-3 w-3" /> };
          return { color: 'text-white/30', icon: <MinusSignCircleIcon className="h-3 w-3" /> };
        })()
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      layout
      onClick={onToggle}
      className="relative bg-black border-2 border-white/10 active:scale-[0.98] transition-transform cursor-pointer group hover:border-white/20 rounded-xl"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-f1-${teamColorClass}`} />
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {expandedContent || (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-black uppercase italic tracking-tight">{name}</h2>
                  {rankBadge}
                </div>
                {team && (
                  <div className="text-xs text-white/40 uppercase font-mono mb-2">{team}</div>
                )}
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-2xl font-black text-white italic">{points}</span>
                    <span className="text-xs text-white/40 ml-1 font-mono">PTS</span>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <div className="text-base font-black text-amber-400">{wins}</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono">Wins</div>
                    </div>
                    <div>
                      <div className="text-base font-black text-white/60">{podiums}</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono">Pods</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-700' : 'text-white/40'
                )}
              >
                {rank}
              </span>
            </div>
            {collapsedContent || (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm uppercase italic truncate">{name}</h3>
                  {rankBadge}
                </div>
                {team && (
                  <div className="text-[10px] text-white/40 uppercase font-mono truncate">
                    {team}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="text-lg font-black italic">{points}</span>
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
