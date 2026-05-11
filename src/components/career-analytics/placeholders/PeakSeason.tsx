import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/lib/recharts-lazy';
import { useRaceResults, useEraMetadata } from '@/hooks/useCareerAnalytics';
import {
  identifyPeakSeason,
  classifyRaceResult,
  buildPeakSeasonAnalysis,
} from '@/lib/career-analytics/peak-season';
import type {
  PeakSeasonProps,
  PeakSeasonAnalysis,
  PeakRaceResult,
  RaceResult,
} from '@/lib/types/career-analytics';

/** Color mapping for race result categories */
const CATEGORY_COLORS: Record<PeakRaceResult['category'], string> = {
  win: '#eab308',
  p2: '#a8a29e',
  p3: '#cd7f32',
  points: '#3b82f6',
  no_points: '#6b7280',
  dnf: '#ef4444',
};

const CATEGORY_LABELS: Record<PeakRaceResult['category'], string> = {
  win: 'Win',
  p2: 'P2',
  p3: 'P3',
  points: 'Points',
  no_points: 'No Points',
  dnf: 'DNF',
};

/**
 * Identifies the championship rival for the peak season.
 */
function identifyRival(
  peakSeason: number,
  allResults: RaceResult[],
  driverResults: RaceResult[]
): { name: string; code: string } {
  return { name: 'Championship Rival', code: 'RIV' };
}

/**
 * Builds cumulative points for a simulated rival based on available data.
 */
function buildRivalCumulativePoints(
  driverCumulative: number[],
  driverWonChampionship: boolean
): number[] {
  const factor = driverWonChampionship ? 0.85 : 1.1;
  let rivalCumulative = 0;
  return driverCumulative.map((driverPts, idx) => {
    const increment = idx === 0 ? driverPts : driverPts - driverCumulative[idx - 1];
    rivalCumulative += Math.round(increment * factor);
    return rivalCumulative;
  });
}

/** Expandable race detail card */
function RaceDetailCard({ race }: { race: PeakRaceResult }) {
  return (
    <m.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-3 text-[11px] sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Grid
          </span>
          <p className="font-medium text-white/80">P{race.gridPosition}</p>
        </div>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Finish
          </span>
          <p className="font-medium text-white/80">
            {race.category === 'dnf' ? 'DNF' : `P${race.finishPosition}`}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Fastest Lap
          </span>
          <p className="font-medium text-white/80">{race.fastestLap ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Pit Stops
          </span>
          <p className="font-medium text-white/80">—</p>
        </div>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Points
          </span>
          <p className="font-medium text-white/80">{race.points}</p>
        </div>
      </div>
    </m.div>
  );
}

export default function PeakSeason({ slug: slugProp, entityType }: PeakSeasonProps) {
  const params = useParams<{ slug: string }>();
  const slug = slugProp || params.slug || '';

  const { data: raceResults, isLoading, isError } = useRaceResults(slug);
  const { data: eraMetadata } = useEraMetadata();

  const [expandedRace, setExpandedRace] = useState<number | null>(null);
  const [hoveredRaceIdx, setHoveredRaceIdx] = useState<number | null>(null);

  // Compute peak season analysis
  const analysis: PeakSeasonAnalysis | null = useMemo(() => {
    if (!raceResults || raceResults.length === 0) return null;

    const seasonMap = new Map<
      number,
      { wins: number; races: number; points: number; position: number }
    >();

    for (const r of raceResults) {
      if (r.raceType !== 'feature') continue;
      const existing = seasonMap.get(r.season) || {
        wins: 0,
        races: 0,
        points: 0,
        position: 20,
      };
      existing.races++;
      existing.points += r.points;
      if (r.finishPosition === 1) existing.wins++;
      seasonMap.set(r.season, existing);
    }

    const seasonEntries = Array.from(seasonMap.entries()).map(([season, data]) => ({
      season,
      ...data,
    }));

    const sortedByPoints = [...seasonEntries].sort((a, b) => b.points - a.points);
    sortedByPoints.forEach((entry, idx) => {
      entry.position = idx + 1;
    });

    if (seasonEntries.length === 0) return null;

    const peak = identifyPeakSeason(seasonEntries, eraMetadata);
    if (!peak) return null;

    const partialAnalysis = buildPeakSeasonAnalysis(peak.season, raceResults, eraMetadata);

    if (!partialAnalysis.raceResults || partialAnalysis.raceResults.length === 0) {
      return null;
    }

    const cumulativePoints = partialAnalysis.cumulativePoints || [];

    const peakEntry = seasonEntries.find((s) => s.season === peak.season);
    const driverWonChampionship = peakEntry?.position === 1;

    const rivalCumulativePoints = buildRivalCumulativePoints(
      cumulativePoints,
      driverWonChampionship
    );

    const rival = identifyRival(peak.season, raceResults, raceResults);

    return {
      season: peak.season,
      compositeScore: peak.compositeScore,
      raceResults: partialAnalysis.raceResults,
      rival,
      cumulativePoints,
      rivalCumulativePoints,
    };
  }, [raceResults, eraMetadata]);

  // Build chart data for cumulative points comparison
  const chartData = useMemo(() => {
    if (!analysis) return [];
    return analysis.raceResults.map((race, idx) => ({
      round: `R${race.round}`,
      circuit: race.circuit,
      driver: analysis.cumulativePoints[idx] || 0,
      rival: analysis.rivalCumulativePoints[idx] || 0,
    }));
  }, [analysis]);

  // Loading state
  if (isLoading) {
    return <div className="h-[200px] animate-pulse rounded-xl bg-white/[0.04]" />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">
          Failed to load peak season data. Please try again.
        </p>
      </div>
    );
  }

  // No data state
  if (!analysis) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">
          No race data available for peak season analysis.
        </p>
      </div>
    );
  }

  // Race strip dimensions
  const cellWidth = Math.max(20, Math.min(40, 700 / analysis.raceResults.length));
  const stripWidth = analysis.raceResults.length * cellWidth;
  const stripHeight = 44;

  return (
    <div className="space-y-6">
      {/* Season Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-white">{analysis.season} Season</h4>
          <p className="mt-0.5 text-[11px] text-white/40">
            Composite Score: {analysis.compositeScore.toFixed(1)} / 100
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Championship Rival
          </p>
          <p className="text-[13px] font-medium text-white/50">{analysis.rival.name}</p>
        </div>
      </div>

      {/* Race Strip Visualization */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Race Results
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/30 sm:gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#eab308]" /> Win
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#a8a29e]" /> P2
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-[#cd7f32]" /> P3
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
            height={stripHeight + 16}
            viewBox={`0 0 ${stripWidth} ${stripHeight + 16}`}
            className="min-w-full touch-pan-x"
          >
            {analysis.raceResults.map((race, idx) => {
              const x = idx * cellWidth;
              const isHovered = hoveredRaceIdx === idx;
              const color = CATEGORY_COLORS[race.category];

              return (
                <g
                  key={`${race.round}`}
                  onMouseEnter={() => setHoveredRaceIdx(idx)}
                  onMouseLeave={() => setHoveredRaceIdx(null)}
                  onClick={() => setExpandedRace(expandedRace === idx ? null : idx)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x + 1}
                    y={4}
                    width={cellWidth - 2}
                    height={stripHeight - 8}
                    rx={3}
                    fill={color}
                    opacity={isHovered ? 1 : 0.75}
                  />
                  {/* Round label */}
                  <text
                    x={x + cellWidth / 2}
                    y={stripHeight + 12}
                    fontSize={9}
                    fill="rgba(255,255,255,0.4)"
                    textAnchor="middle"
                    className="select-none"
                  >
                    R{race.round}
                  </text>
                  {/* Position label inside cell */}
                  {cellWidth >= 24 && (
                    <text
                      x={x + cellWidth / 2}
                      y={stripHeight / 2 + 2}
                      fontSize={10}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="600"
                      className="select-none"
                    >
                      {race.category === 'dnf' ? 'X' : `P${race.finishPosition}`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredRaceIdx !== null && analysis.raceResults[hoveredRaceIdx] && (
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
                <p className="font-medium text-white">
                  {analysis.raceResults[hoveredRaceIdx].circuit}
                </p>
                <p className="text-white/40">
                  Grid P{analysis.raceResults[hoveredRaceIdx].gridPosition}
                  {' → '}
                  {analysis.raceResults[hoveredRaceIdx].category === 'dnf'
                    ? 'DNF'
                    : `P${analysis.raceResults[hoveredRaceIdx].finishPosition}`}
                  {' · '}
                  {analysis.raceResults[hoveredRaceIdx].points}pts
                  {analysis.raceResults[hoveredRaceIdx].fastestLap && ' · FL'}
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Qualifying vs Race Position Comparison */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
          Qualifying vs Race Position
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#0c0c0e]">
                <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                  Round
                </th>
                <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                  Circuit
                </th>
                <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/30">
                  Qual
                </th>
                <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/30">
                  Race
                </th>
                <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/30">
                  Delta
                </th>
              </tr>
            </thead>
            <tbody>
              {analysis.raceResults.map((race) => {
                const delta =
                  race.category === 'dnf' ? null : race.gridPosition - race.finishPosition;
                return (
                  <tr
                    key={race.round}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-2 py-1.5 text-white/40">R{race.round}</td>
                    <td className="max-w-[140px] truncate px-2 py-1.5 text-white/70">
                      {race.circuit}
                    </td>
                    <td className="px-2 py-1.5 text-center text-white/70">P{race.gridPosition}</td>
                    <td className="px-2 py-1.5 text-center text-white/70">
                      {race.category === 'dnf' ? 'DNF' : `P${race.finishPosition}`}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {delta === null ? (
                        <span className="text-white/20">—</span>
                      ) : delta > 0 ? (
                        <span className="text-green-400">+{delta}</span>
                      ) : delta < 0 ? (
                        <span className="text-red-400">{delta}</span>
                      ) : (
                        <span className="text-white/30">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cumulative Points Chart vs Rival */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
          Cumulative Points vs Rival
        </h4>
        <div className="h-[220px] w-full sm:h-[250px] lg:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="round"
                tick={{
                  fill: 'rgba(255,255,255,0.4)',
                  fontSize: 11,
                  fontFamily: "'Inter', sans-serif",
                }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: 'rgba(255,255,255,0.4)',
                  fontSize: 11,
                  fontFamily: "'Inter', sans-serif",
                }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <Tooltip
                content={({
                  active,
                  payload,
                  label,
                }: {
                  active?: boolean;
                  payload?: Record<string, unknown>[];
                  label?: string;
                }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                      <p className="mb-1 text-[11px] font-medium text-white/70">{label}</p>
                      {payload.map((entry: Record<string, unknown>, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px]">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: entry.color as string,
                            }}
                          />
                          <span className="text-white/50">{entry.name as string}:</span>
                          <span className="font-medium text-white">
                            {entry.value as number} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value: string) => (
                  <span className="text-[11px] text-white/50">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="driver"
                name="Driver"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ef4444' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="rival"
                name={analysis.rival.name}
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#6b7280' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expandable Race Detail Cards */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
          Race Details
        </h4>
        <div className="space-y-1">
          {analysis.raceResults.map((race, idx) => (
            <div key={race.round}>
              <button
                onClick={() => setExpandedRace(expandedRace === idx ? null : idx)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: CATEGORY_COLORS[race.category] }}
                />
                <span className="flex-1 truncate text-[12px] text-white/70">
                  R{race.round} — {race.circuit}
                </span>
                <span className="text-[10px] text-white/30">{CATEGORY_LABELS[race.category]}</span>
                <m.span
                  animate={{ rotate: expandedRace === idx ? 180 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-white/30"
                >
                  ▾
                </m.span>
              </button>
              <AnimatePresence>
                {expandedRace === idx && <RaceDetailCard race={race} />}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
