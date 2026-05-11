import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useRaceResults } from '@/hooks/useCareerAnalytics';
import { analyzeStreaks } from '@/lib/career-analytics/streak-analyzer';
import type {
  FormStreaksProps,
  Streak,
  StreakType,
  RaceResult,
} from '@/lib/types/career-analytics';

/** Human-readable labels for streak types */
const STREAK_TYPE_LABELS: Record<StreakType, string> = {
  consecutive_wins: 'Consecutive Wins',
  consecutive_podiums: 'Consecutive Podiums',
  consecutive_points: 'Consecutive Points',
  consecutive_dnfs: 'Consecutive DNFs',
  consecutive_no_podium: 'Consecutive No Podium',
};

/** Whether a streak type is "positive" (hot) or "negative" (cold) */
const POSITIVE_TYPES: StreakType[] = [
  'consecutive_wins',
  'consecutive_podiums',
  'consecutive_points',
];

/**
 * Returns the color for a race cell in the strip based on its finish position and DNF status.
 */
function getRaceCellColor(result: RaceResult): string {
  if (result.dnf) return '#ef4444';
  if (result.finishPosition === 1) return '#eab308';
  if (result.finishPosition <= 3) return '#22c55e';
  if (result.finishPosition <= 10) return '#3b82f6';
  return '#6b7280';
}

/**
 * Determines if a race is part of a "hot" streak (3+ consecutive podiums/wins)
 */
function isHotRace(raceIndex: number, hotRanges: [number, number][]): boolean {
  return hotRanges.some(([start, end]) => raceIndex >= start && raceIndex <= end);
}

/**
 * Determines if a race is part of a "cold" streak (5+ consecutive races outside podium)
 */
function isColdRace(raceIndex: number, coldRanges: [number, number][]): boolean {
  return coldRanges.some(([start, end]) => raceIndex >= start && raceIndex <= end);
}

/**
 * Builds index ranges for hot/cold periods from streak analysis.
 */
function buildStreakRanges(
  sortedResults: RaceResult[],
  streaks: Streak[],
  minLength: number
): [number, number][] {
  const ranges: [number, number][] = [];
  for (const streak of streaks) {
    if (streak.length < minLength) continue;
    const startIdx = sortedResults.findIndex(
      (r) => r.season === streak.startRace.season && r.round === streak.startRace.round
    );
    if (startIdx === -1) continue;
    ranges.push([startIdx, startIdx + streak.length - 1]);
  }
  return ranges;
}

/** Detail panel for a hovered streak */
function StreakDetailPanel({ streak }: { streak: Streak }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm"
    >
      <p className="mb-2 text-[12px] font-semibold text-white">
        {STREAK_TYPE_LABELS[streak.type]} — {streak.length} races
      </p>
      <p className="mb-2 text-[10px] text-white/40">
        {streak.startRace.circuit} → {streak.endRace.circuit}
      </p>
      <div className="max-h-32 space-y-1 overflow-y-auto">
        {streak.races.map((race, i) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <span className="truncate text-white/70">{race.circuit}</span>
            <span className="ml-2 flex shrink-0 gap-2">
              <span className="text-white/40">P{race.position}</span>
              <span className="text-white/30">{race.points}pts</span>
            </span>
          </div>
        ))}
      </div>
    </m.div>
  );
}

/** Single streak badge showing type and length */
function StreakBadge({
  streak,
  label,
  isPositive,
}: {
  streak: Streak;
  label?: string;
  isPositive: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <m.div
        whileHover={{ scale: 1.05 }}
        className={cn(
          'cursor-pointer rounded-md border px-3 py-2 text-xs',
          isPositive
            ? 'border-green-500/20 bg-green-500/[0.06]'
            : 'border-red-500/20 bg-red-500/[0.06]'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold', isPositive ? 'text-green-400' : 'text-red-400')}>
            {streak.length}
          </span>
          <span className="text-white/70">{STREAK_TYPE_LABELS[streak.type]}</span>
        </div>
        <div className="mt-1 text-[10px] text-white/30">
          {streak.seasons.length > 1
            ? `${streak.seasons[0]}–${streak.seasons[streak.seasons.length - 1]}`
            : streak.seasons[0]}
        </div>
        {label && (
          <span
            className={cn(
              'mt-1 inline-block rounded-sm px-1.5 py-0.5 text-[9px] font-medium uppercase',
              isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            )}
          >
            {label}
          </span>
        )}
      </m.div>
      <AnimatePresence>{hovered && <StreakDetailPanel streak={streak} />}</AnimatePresence>
    </div>
  );
}

export default function FormStreaks(_props: FormStreaksProps) {
  const { slug } = useParams<{ slug: string }>();
  const { data: raceResults, isLoading, isError } = useRaceResults(slug || '');
  const [hoveredRaceIdx, setHoveredRaceIdx] = useState<number | null>(null);

  const analysis = useMemo(() => {
    if (!raceResults || raceResults.length === 0) return null;
    return analyzeStreaks(raceResults);
  }, [raceResults]);

  // Sort results chronologically for the race strip
  const sortedResults = useMemo(() => {
    if (!raceResults) return [];
    return [...raceResults]
      .filter((r) => r.raceType === 'feature')
      .sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.round - b.round;
      });
  }, [raceResults]);

  // Build hot/cold ranges for visual highlighting
  const hotRanges = useMemo(() => {
    if (!analysis) return [];
    const podiumStreaks = [
      ...analysis.streaks.consecutive_podiums,
      ...analysis.streaks.consecutive_wins,
    ];
    return buildStreakRanges(sortedResults, podiumStreaks, 3);
  }, [analysis, sortedResults]);

  const coldRanges = useMemo(() => {
    if (!analysis) return [];
    return buildStreakRanges(sortedResults, analysis.streaks.consecutive_no_podium, 5);
  }, [analysis, sortedResults]);

  // Loading state
  if (isLoading) {
    return <div className="h-[200px] animate-pulse rounded-xl bg-white/[0.04]" />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">Failed to load streak data. Please try again.</p>
      </div>
    );
  }

  // No data / no streaks edge case
  if (!analysis || sortedResults.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">No race data available for streak analysis.</p>
      </div>
    );
  }

  const hasAnyStreaks = analysis.longestPositive !== null || analysis.longestNegative !== null;

  // Cell width calculation for the SVG strip
  const cellWidth = Math.max(4, Math.min(12, 800 / sortedResults.length));
  const stripWidth = sortedResults.length * cellWidth;
  const stripHeight = 40;

  return (
    <div className="space-y-6">
      {/* Race Strip Visualization */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Career Race Strip
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/30 sm:gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#eab308]" /> Win
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#22c55e]" /> Podium
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#3b82f6]" /> Points
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#6b7280]" /> No Points
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#ef4444]" /> DNF
            </span>
          </div>
        </div>

        <div className="relative overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <svg
            width={stripWidth}
            height={stripHeight + 20}
            viewBox={`0 0 ${stripWidth} ${stripHeight + 20}`}
            className="min-w-full touch-pan-x"
          >
            {sortedResults.map((result, idx) => {
              const x = idx * cellWidth;
              const isHot = isHotRace(idx, hotRanges);
              const isCold = isColdRace(idx, coldRanges);
              const isHovered = hoveredRaceIdx === idx;

              return (
                <g
                  key={`${result.season}-${result.round}`}
                  onMouseEnter={() => setHoveredRaceIdx(idx)}
                  onMouseLeave={() => setHoveredRaceIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Hot/cold background indicator */}
                  {(isHot || isCold) && (
                    <rect
                      x={x}
                      y={0}
                      width={cellWidth}
                      height={stripHeight}
                      fill={isHot ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'}
                    />
                  )}
                  {/* Race cell */}
                  <rect
                    x={x + 0.5}
                    y={4}
                    width={cellWidth - 1}
                    height={stripHeight - 8}
                    rx={2}
                    fill={getRaceCellColor(result)}
                    opacity={isHovered ? 1 : 0.7}
                  />
                  {/* Season markers */}
                  {(idx === 0 || sortedResults[idx - 1].season !== result.season) && (
                    <text
                      x={x + 1}
                      y={stripHeight + 14}
                      fontSize={8}
                      fill="rgba(255,255,255,0.4)"
                      className="select-none"
                    >
                      {result.season}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip for individual race */}
          <AnimatePresence>
            {hoveredRaceIdx !== null && sortedResults[hoveredRaceIdx] && (
              <m.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.1 }}
                className="pointer-events-none absolute top-0 z-40 -translate-y-full rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 text-[10px] shadow-lg backdrop-blur-sm"
                style={{
                  left: Math.min(hoveredRaceIdx * cellWidth, stripWidth - 160),
                }}
              >
                <p className="font-medium text-white">{sortedResults[hoveredRaceIdx].circuit}</p>
                <p className="text-white/40">
                  {sortedResults[hoveredRaceIdx].season} R{sortedResults[hoveredRaceIdx].round}
                  {' · '}
                  {sortedResults[hoveredRaceIdx].dnf
                    ? 'DNF'
                    : `P${sortedResults[hoveredRaceIdx].finishPosition}`}
                  {' · '}
                  {sortedResults[hoveredRaceIdx].points}pts
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Streak Summary */}
      {!hasAnyStreaks ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center">
          <p className="text-[14px] text-white/40">
            No significant streaks found (minimum 2 consecutive races required).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Career Best / Worst */}
          <div className="grid gap-4 sm:grid-cols-2">
            {analysis.longestPositive && (
              <StreakBadge
                streak={analysis.longestPositive}
                label="Career Best"
                isPositive={true}
              />
            )}
            {analysis.longestNegative && (
              <StreakBadge
                streak={analysis.longestNegative}
                label="Career Worst"
                isPositive={false}
              />
            )}
          </div>

          {/* All streak types */}
          <div className="space-y-3">
            {(Object.keys(analysis.streaks) as StreakType[]).map((type) => {
              const streaks = analysis.streaks[type];
              if (streaks.length === 0)
                return (
                  <div
                    key={type}
                    className="rounded-md border border-white/[0.04] bg-white/[0.01] px-3 py-2"
                  >
                    <p className="text-[11px] text-white/30">
                      {STREAK_TYPE_LABELS[type]}: <span className="italic">None</span>
                    </p>
                  </div>
                );

              const isPositive = POSITIVE_TYPES.includes(type);
              return (
                <div key={type} className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                    {STREAK_TYPE_LABELS[type]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {streaks.map((streak, i) => (
                      <StreakBadge key={`${type}-${i}`} streak={streak} isPositive={isPositive} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
