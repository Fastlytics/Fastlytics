import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { MovementMapProps } from '@/lib/types/career-analytics';
import type { TeamStint, MovementIndicator } from '@/lib/types/career-analytics';
import type { DriverSeason } from '@/lib/api';
import { extractStints, analyzeMovements } from '@/lib/career-analytics/movement-analyzer';

type ViewMode = 'timeline' | 'sankey';

// === Tooltip Component ===
function StintTooltip({ stint, x, y }: { stint: TeamStint; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm"
      style={{ left: x, top: y, transform: 'translate(-50%, -120%)' }}
    >
      <p className="text-[12px] font-semibold text-white">{stint.team}</p>
      <p className="mt-1 text-[11px] text-white/40">
        {stint.startYear}–{stint.endYear}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <span className="text-white/30">Races</span>
        <span className="text-right text-white/70">{stint.races}</span>
        <span className="text-white/30">Wins</span>
        <span className="text-right text-white/70">{stint.wins}</span>
        <span className="text-white/30">Podiums</span>
        <span className="text-right text-white/70">{stint.podiums}</span>
        <span className="text-white/30">Positions</span>
        <span className="text-right text-white/70">
          {stint.positions.length > 0 ? stint.positions.join(', ') : '—'}
        </span>
      </div>
    </div>
  );
}

// === Direction Indicator ===
function DirectionBadge({ movement }: { movement: MovementIndicator }) {
  const config = {
    improved: { label: '↑ Improved', color: 'text-emerald-400' },
    declined: { label: '↓ Declined', color: 'text-red-400' },
    lateral: { label: '→ Lateral', color: 'text-white/40' },
  };
  const { label, color } = config[movement.direction];
  return <span className={cn('text-[10px] font-medium', color)}>{label}</span>;
}

// === Timeline View ===
function TimelineView({
  stints,
  movements,
}: {
  stints: TeamStint[];
  movements: MovementIndicator[];
}) {
  const [hoveredStint, setHoveredStint] = useState<{
    stint: TeamStint;
    x: number;
    y: number;
  } | null>(null);

  const totalYears = useMemo(() => {
    if (stints.length === 0) return 1;
    const first = stints[0].startYear;
    const last = stints[stints.length - 1].endYear;
    return Math.max(last - first + 1, 1);
  }, [stints]);

  const firstYear = stints.length > 0 ? stints[0].startYear : 0;

  return (
    <div className="relative">
      {hoveredStint && (
        <StintTooltip stint={hoveredStint.stint} x={hoveredStint.x} y={hoveredStint.y} />
      )}
      <svg viewBox={`0 0 800 120`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Background track */}
        <rect x="40" y="45" width="720" height="30" rx="15" fill="rgba(255,255,255,0.04)" />

        {/* Stint segments */}
        {stints.map((stint, i) => {
          const startPct = (stint.startYear - firstYear) / totalYears;
          const endPct = (stint.endYear - firstYear + 1) / totalYears;
          const x = 40 + startPct * 720;
          const width = (endPct - startPct) * 720;

          return (
            <g key={i}>
              <rect
                x={x}
                y="45"
                width={Math.max(width, 8)}
                height="30"
                rx="4"
                fill={stint.teamColor}
                opacity="0.85"
                className="cursor-pointer transition-opacity hover:opacity-100"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  const parent = (e.target as SVGRectElement).closest('.relative');
                  const parentRect = parent?.getBoundingClientRect();
                  setHoveredStint({
                    stint,
                    x: rect.left - (parentRect?.left || 0) + rect.width / 2,
                    y: rect.top - (parentRect?.top || 0),
                  });
                }}
                onMouseLeave={() => setHoveredStint(null)}
              />
              {/* Team label */}
              {width > 40 && (
                <text
                  x={x + Math.max(width, 8) / 2}
                  y="64"
                  textAnchor="middle"
                  className="pointer-events-none text-[9px] font-medium"
                  fill="white"
                >
                  {stint.team.length > width / 8
                    ? stint.team.slice(0, Math.floor(width / 8)) + '…'
                    : stint.team}
                </text>
              )}
              {/* Year labels */}
              <text x={x + 2} y="92" className="text-[9px]" fill="rgba(255,255,255,0.5)">
                {stint.startYear}
              </text>
              {stint.endYear !== stint.startYear && width > 30 && (
                <text
                  x={x + Math.max(width, 8) - 2}
                  y="92"
                  textAnchor="end"
                  className="text-[9px]"
                  fill="rgba(255,255,255,0.5)"
                >
                  {stint.endYear}
                </text>
              )}
            </g>
          );
        })}

        {/* Direction indicators between stints */}
        {movements.map((movement, i) => {
          const prevStint = stints[i];
          const nextStint = stints[i + 1];
          const prevEndPct = (prevStint.endYear - firstYear + 1) / totalYears;
          const nextStartPct = (nextStint.startYear - firstYear) / totalYears;
          const midX = 40 + ((prevEndPct + nextStartPct) / 2) * 720;

          const arrowColor =
            movement.direction === 'improved'
              ? '#34d399'
              : movement.direction === 'declined'
                ? '#f87171'
                : '#a1a1aa';

          return (
            <g key={`movement-${i}`}>
              <circle cx={midX} cy="35" r="8" fill={arrowColor} opacity="0.2" />
              <text
                x={midX}
                y="39"
                textAnchor="middle"
                fill={arrowColor}
                className="text-[10px] font-bold"
              >
                {movement.direction === 'improved'
                  ? '↑'
                  : movement.direction === 'declined'
                    ? '↓'
                    : '→'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// === Sankey Diagram View ===
function SankeyView({
  stints,
  movements,
}: {
  stints: TeamStint[];
  movements: MovementIndicator[];
}) {
  const [hoveredStint, setHoveredStint] = useState<{
    stint: TeamStint;
    x: number;
    y: number;
  } | null>(null);

  // Layout: nodes on left/right columns with flow links between them
  const nodeHeight = 50;
  const nodeWidth = 140;
  const svgWidth = 800;
  const svgHeight = Math.max(stints.length * (nodeHeight + 20) + 40, 200);
  const leftX = 60;
  const rightX = svgWidth - nodeWidth - 60;

  return (
    <div className="relative">
      {hoveredStint && (
        <StintTooltip stint={hoveredStint.stint} x={hoveredStint.x} y={hoveredStint.y} />
      )}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Nodes and flow links */}
        {stints.map((stint, i) => {
          const y = 20 + i * (nodeHeight + 20);
          // Alternate left/right for visual flow
          const x = i % 2 === 0 ? leftX : rightX;

          return (
            <g key={i}>
              {/* Flow link from previous stint */}
              {i > 0 && (
                <path
                  d={(() => {
                    const prevY = 20 + (i - 1) * (nodeHeight + 20) + nodeHeight / 2;
                    const prevX = (i - 1) % 2 === 0 ? leftX + nodeWidth : rightX;
                    const currX = i % 2 === 0 ? leftX : rightX + nodeWidth;
                    const currY = y + nodeHeight / 2;
                    const midX = (prevX + currX) / 2;
                    return `M ${prevX} ${prevY} C ${midX} ${prevY}, ${midX} ${currY}, ${currX} ${currY}`;
                  })()}
                  fill="none"
                  stroke={
                    movements[i - 1]?.direction === 'improved'
                      ? '#34d399'
                      : movements[i - 1]?.direction === 'declined'
                        ? '#f87171'
                        : '#71717a'
                  }
                  strokeWidth="3"
                  opacity="0.5"
                />
              )}

              {/* Node rectangle */}
              <rect
                x={x}
                y={y}
                width={nodeWidth}
                height={nodeHeight}
                rx="6"
                fill={stint.teamColor}
                opacity="0.8"
                className="cursor-pointer transition-opacity hover:opacity-100"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  const parent = (e.target as SVGRectElement).closest('.relative');
                  const parentRect = parent?.getBoundingClientRect();
                  setHoveredStint({
                    stint,
                    x: rect.left - (parentRect?.left || 0) + rect.width / 2,
                    y: rect.top - (parentRect?.top || 0),
                  });
                }}
                onMouseLeave={() => setHoveredStint(null)}
              />

              {/* Team name */}
              <text
                x={x + nodeWidth / 2}
                y={y + 22}
                textAnchor="middle"
                className="pointer-events-none text-[11px] font-semibold"
                fill="white"
              >
                {stint.team.length > 16 ? stint.team.slice(0, 14) + '…' : stint.team}
              </text>

              {/* Years */}
              <text
                x={x + nodeWidth / 2}
                y={y + 38}
                textAnchor="middle"
                className="pointer-events-none text-[9px]"
                fill="rgba(255,255,255,0.7)"
              >
                {stint.startYear}–{stint.endYear} · {stint.races} races
              </text>

              {/* Direction indicator label */}
              {i > 0 && movements[i - 1] && (
                <text
                  x={svgWidth / 2}
                  y={y + nodeHeight / 2 - 15}
                  textAnchor="middle"
                  className="text-[9px] font-medium"
                  fill={
                    movements[i - 1].direction === 'improved'
                      ? '#34d399'
                      : movements[i - 1].direction === 'declined'
                        ? '#f87171'
                        : '#a1a1aa'
                  }
                >
                  {movements[i - 1].direction === 'improved'
                    ? '↑ Improved'
                    : movements[i - 1].direction === 'declined'
                      ? '↓ Declined'
                      : '→ Lateral'}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// === Main Component ===
export default function MovementMap({ career, entityType }: MovementMapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  const { stints, movements } = useMemo(() => {
    const careerData = career as { seasons?: DriverSeason[] };
    const seasons = careerData?.seasons || [];

    if (entityType === 'team') {
      return { stints: [] as TeamStint[], movements: [] as MovementIndicator[] };
    }

    const extracted = extractStints(seasons);
    const analyzed = analyzeMovements(extracted);
    return { stints: extracted, movements: analyzed };
  }, [career, entityType]);

  // No data available
  if (stints.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">
          Team movement data is unavailable for this {entityType === 'driver' ? 'driver' : 'team'}.
        </p>
      </div>
    );
  }

  // Single stint — no movement
  if (stints.length === 1) {
    const stint = stints[0];
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: stint.teamColor }} />
          <div>
            <p className="text-[13px] font-medium text-white">{stint.team}</p>
            <p className="text-[11px] text-white/40">
              {stint.startYear}–{stint.endYear} · {stint.races} races
            </p>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-white/30">
          Entire career spent with one team — no team movements to display.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">Wins</p>
            <p className="text-2xl font-bold tabular-nums text-white">{stint.wins}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
              Podiums
            </p>
            <p className="text-2xl font-bold tabular-nums text-white">{stint.podiums}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
              Pts/Race
            </p>
            <p className="text-2xl font-bold tabular-nums text-white">
              {stint.pointsPerRace.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {movements.map((m, i) => (
            <DirectionBadge key={i} movement={m} />
          ))}
        </div>
        <div className="flex self-start rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 sm:self-auto">
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
              viewMode === 'timeline'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/35 hover:text-white/60'
            )}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('sankey')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
              viewMode === 'sankey'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/35 hover:text-white/60'
            )}
          >
            Sankey
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        {viewMode === 'timeline' ? (
          <TimelineView stints={stints} movements={movements} />
        ) : (
          <SankeyView stints={stints} movements={movements} />
        )}
      </div>

      {/* Stint summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stints.map((stint, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stint.teamColor }} />
              <p className="text-[13px] font-medium text-white">{stint.team}</p>
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              {stint.startYear}–{stint.endYear}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-white/30">Races</span>
                <span className="ml-2 text-white/70">{stint.races}</span>
              </div>
              <div>
                <span className="text-white/30">Wins</span>
                <span className="ml-2 text-white/70">{stint.wins}</span>
              </div>
              <div>
                <span className="text-white/30">Podiums</span>
                <span className="ml-2 text-white/70">{stint.podiums}</span>
              </div>
              <div>
                <span className="text-white/30">Pts/Race</span>
                <span className="ml-2 text-white/70">{stint.pointsPerRace.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
