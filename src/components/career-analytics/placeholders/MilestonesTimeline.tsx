import { useState, useRef, useMemo, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useMilestones } from '@/hooks/useCareerAnalytics';
import type { MilestonesTimelineProps, Milestone } from '@/lib/types/career-analytics';

// ─── Team color hex mapping ───────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  redbull: '#4781D7',
  redbullracing: '#4781D7',
  mercedes: '#6CD3BF',
  ferrari: '#F91536',
  mclaren: '#F58020',
  astonmartin: '#229971',
  alpine: '#0093CC',
  williams: '#64C4FF',
  haas: '#B6BABD',
  alfaromeo: '#C92D4B',
  kicksauber: '#52E252',
  sauber: '#52E252',
  audi: '#00E701',
  cadillac: '#C6A664',
  alphatauri: '#5E8FAA',
  vcarb: '#6692FF',
  racingbulls: '#6692FF',
  rb: '#6692FF',
  renault: '#FFF500',
  lotus: '#006B3F',
  brawn: '#C8FF00',
  jordan: '#EBC94A',
  benetton: '#00A651',
  tyrrell: '#003580',
  minardi: '#FFD700',
  tororosso: '#1E41FF',
  forceindia: '#F596C8',
  racingpoint: '#F596C8',
  manor: '#ED1C24',
  caterham: '#005030',
  marussia: '#6E0000',
  hrt: '#A08A5B',
  virgin: '#CC0000',
};

function getTeamColorHex(teamName: string | undefined): string {
  if (!teamName) return '#666666';
  const normalized = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (normalized.includes(key)) return color;
  }
  return '#666666';
}

// ─── Milestone type → marker color ───────────────────────────────────────────
const MILESTONE_COLORS: Record<Milestone['type'], string> = {
  first_race: '#6CD3BF',
  first_points: '#64C4FF',
  first_podium: '#F58020',
  first_win: '#FFD700',
  first_pole: '#A855F7',
  championship: '#F91536',
  team_change: '#52E252',
  race_milestone: '#B6BABD',
  career_end: '#EF4444',
};

const MILESTONE_LABELS: Record<Milestone['type'], string> = {
  first_race: 'First Race',
  first_points: 'First Points',
  first_podium: 'First Podium',
  first_win: 'First Win',
  first_pole: 'First Pole',
  championship: 'Championship',
  team_change: 'Team Change',
  race_milestone: 'Race Milestone',
  career_end: 'Career End',
};

// ─── SVG Layout Constants ─────────────────────────────────────────────────────
const TIMELINE_HEIGHT = 160;
const MARKER_RADIUS = 8;
const TRACK_Y = 100;
const TRACK_HEIGHT = 6;
const MIN_MARKER_SPACING = 60;
const PADDING_X = 40;

// ─── Detail Card ──────────────────────────────────────────────────────────────
function DetailCard({
  milestone,
  x,
  containerWidth,
}: {
  milestone: Milestone;
  x: number;
  containerWidth: number;
}) {
  // Position card so it doesn't overflow the container
  const cardWidth = 220;
  let cardX = x - cardWidth / 2;
  if (cardX < 8) cardX = 8;
  if (cardX + cardWidth > containerWidth - 8) cardX = containerWidth - cardWidth - 8;

  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none absolute z-20"
      style={{ left: cardX, top: TRACK_Y + 28, width: cardWidth }}
    >
      <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        <div className="mb-1 flex items-center gap-2">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: MILESTONE_COLORS[milestone.type] }}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
            {MILESTONE_LABELS[milestone.type]}
          </span>
        </div>
        <p className="text-[12px] leading-snug text-white/70">{milestone.description}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/40">
          {milestone.date && (
            <span>
              {new Date(milestone.date).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          {milestone.circuit && <span>{milestone.circuit}</span>}
          {milestone.season && <span>S{milestone.season}</span>}
        </div>
        {milestone.context && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-white/30">
            {Object.entries(milestone.context).map(([key, val]) => (
              <span key={key}>
                {key.replace(/_/g, ' ')}: {val}
              </span>
            ))}
          </div>
        )}
      </div>
    </m.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MilestonesTimeline({ slug, entityType }: MilestonesTimelineProps) {
  const { data: milestones, isLoading, isError, refetch } = useMilestones(slug, entityType);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Derive team stints from milestones (team_change events define boundaries)
  const teamStints = useMemo(() => {
    if (!milestones?.length) return [];
    const sorted = [...milestones].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const stints: { team: string; color: string; startDate: string; endDate: string }[] = [];
    let currentTeam: string | null = null;

    for (const m of sorted) {
      if (m.type === 'team_change' && m.context) {
        if (currentTeam && stints.length > 0) {
          stints[stints.length - 1].endDate = m.date;
        }
        const newTeam = (m.context.new_team as string) || (m.context.team as string) || '';
        currentTeam = newTeam;
        stints.push({
          team: newTeam,
          color: getTeamColorHex(newTeam),
          startDate: m.date,
          endDate: '',
        });
      } else if (m.type === 'first_race' && m.context) {
        const team = (m.context.team as string) || '';
        if (team && !currentTeam) {
          currentTeam = team;
          stints.push({
            team,
            color: getTeamColorHex(team),
            startDate: m.date,
            endDate: '',
          });
        }
      }
    }

    if (stints.length > 0 && !stints[stints.length - 1].endDate) {
      stints[stints.length - 1].endDate = sorted[sorted.length - 1].date;
    }

    return stints;
  }, [milestones]);

  // Compute SVG positions
  const { svgWidth, positions, timeRange } = useMemo(() => {
    if (!milestones?.length) return { svgWidth: 400, positions: [], timeRange: { min: 0, max: 1 } };

    const sorted = [...milestones].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const minTime = new Date(sorted[0].date).getTime();
    const maxTime = new Date(sorted[sorted.length - 1].date).getTime();
    const range = maxTime - minTime || 1;

    const width = Math.max(400, sorted.length * MIN_MARKER_SPACING + PADDING_X * 2);

    const pos = sorted.map((m) => {
      const t = new Date(m.date).getTime();
      const ratio = (t - minTime) / range;
      return PADDING_X + ratio * (width - PADDING_X * 2);
    });

    return { svgWidth: width, positions: pos, timeRange: { min: minTime, max: maxTime } };
  }, [milestones]);

  // Get stint segment positions on the timeline
  const stintSegments = useMemo(() => {
    if (!teamStints.length || !timeRange) return [];
    const range = timeRange.max - timeRange.min || 1;
    const trackWidth = svgWidth - PADDING_X * 2;

    return teamStints.map((stint) => {
      const startT = new Date(stint.startDate).getTime();
      const endT = stint.endDate ? new Date(stint.endDate).getTime() : timeRange.max;
      const x1 = PADDING_X + ((startT - timeRange.min) / range) * trackWidth;
      const x2 = PADDING_X + ((endT - timeRange.min) / range) * trackWidth;
      return { ...stint, x1, x2: Math.max(x2, x1 + 4) };
    });
  }, [teamStints, timeRange, svgWidth]);

  const sortedMilestones = useMemo(() => {
    if (!milestones?.length) return [];
    return [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [milestones]);

  const handleMarkerEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMarkerLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // ─── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <div className="flex items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
          <span className="text-[14px] text-white/40">Loading milestones…</span>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">Failed to load milestones</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Empty / Single Milestone State ───────────────────────────────────────
  if (!milestones?.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">No milestones available</p>
      </div>
    );
  }

  if (milestones.length === 1) {
    const single = milestones[0];
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="flex items-center gap-3">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: MILESTONE_COLORS[single.type] }}
          />
          <span className="text-[13px] font-medium text-white/80">
            {MILESTONE_LABELS[single.type]}
          </span>
          <span className="text-[11px] text-white/40">
            {new Date(single.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
          </span>
        </div>
        <p className="mt-2 text-[13px] text-white/50">{single.description}</p>
        <p className="mt-3 text-[11px] italic text-white/30">Career in progress</p>
      </div>
    );
  }

  // ─── Full Timeline ────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
        {Object.entries(MILESTONE_COLORS).map(([type, color]) => {
          const hasType = sortedMilestones.some((m) => m.type === type);
          if (!hasType) return null;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-white/40">
                {MILESTONE_LABELS[type as Milestone['type']]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable Timeline */}
      <div
        ref={scrollRef}
        className="relative overflow-x-auto overflow-y-visible pb-2 touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="relative" style={{ width: svgWidth, height: TIMELINE_HEIGHT + 60 }}>
          <svg
            width={svgWidth}
            height={TIMELINE_HEIGHT}
            className="block"
            aria-label="Career milestones timeline"
          >
            {/* Background track */}
            <rect
              x={PADDING_X}
              y={TRACK_Y - TRACK_HEIGHT / 2}
              width={svgWidth - PADDING_X * 2}
              height={TRACK_HEIGHT}
              rx={TRACK_HEIGHT / 2}
              fill="rgba(255,255,255,0.04)"
            />

            {/* Team stint colored segments */}
            {stintSegments.map((seg, i) => (
              <rect
                key={`stint-${i}`}
                x={seg.x1}
                y={TRACK_Y - TRACK_HEIGHT / 2}
                width={seg.x2 - seg.x1}
                height={TRACK_HEIGHT}
                rx={TRACK_HEIGHT / 2}
                fill={seg.color}
                opacity={0.35}
              />
            ))}

            {/* Milestone markers */}
            {sortedMilestones.map((milestone, i) => {
              const cx = positions[i];
              const color = MILESTONE_COLORS[milestone.type];
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={`marker-${i}`}
                  onMouseEnter={() => handleMarkerEnter(i)}
                  onMouseLeave={handleMarkerLeave}
                  onClick={() => setHoveredIndex(isHovered ? null : i)}
                  className="cursor-pointer"
                >
                  {/* Invisible larger touch target for mobile */}
                  <circle
                    cx={cx}
                    cy={TRACK_Y - 24}
                    r={22}
                    fill="transparent"
                    className="pointer-events-auto"
                  />

                  {/* Vertical connector line */}
                  <line
                    x1={cx}
                    y1={TRACK_Y - TRACK_HEIGHT / 2 - 2}
                    x2={cx}
                    y2={TRACK_Y - 20}
                    stroke={color}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={isHovered ? 0.9 : 0.4}
                  />

                  {/* Marker circle */}
                  <circle
                    cx={cx}
                    cy={TRACK_Y - 24}
                    r={isHovered ? MARKER_RADIUS + 2 : MARKER_RADIUS}
                    fill={color}
                    opacity={isHovered ? 1 : 0.8}
                    stroke={isHovered ? 'white' : 'transparent'}
                    strokeWidth={2}
                    style={{ transition: 'all 0.15s ease' }}
                  />

                  {/* Marker icon (first letter of type) */}
                  <text
                    x={cx}
                    y={TRACK_Y - 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize={9}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {milestone.type === 'championship'
                      ? '★'
                      : milestone.type === 'race_milestone'
                        ? '#'
                        : milestone.type === 'team_change'
                          ? '→'
                          : milestone.type === 'career_end'
                            ? '■'
                            : milestone.type[milestone.type.lastIndexOf('_') + 1]?.toUpperCase() ||
                              '•'}
                  </text>

                  {/* Season label below track */}
                  <text
                    x={cx}
                    y={TRACK_Y + 20}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontSize={10}
                    className="pointer-events-none select-none"
                  >
                    {milestone.season}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover detail card (positioned absolutely over SVG) */}
          <AnimatePresence>
            {hoveredIndex !== null && sortedMilestones[hoveredIndex] && (
              <DetailCard
                key={hoveredIndex}
                milestone={sortedMilestones[hoveredIndex]}
                x={positions[hoveredIndex]}
                containerWidth={svgWidth}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
