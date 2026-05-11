import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/lib/recharts-lazy';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  fetchDriverCareer,
  fetchTeamCareer,
  fetchDriverStandings,
  fetchTeamStandings,
  DriverCareer,
  TeamCareer,
} from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import type {
  CareerComparisonProps,
  AlignmentMode,
  TrajectoryDataPoint,
} from '@/lib/types/career-analytics';
import {
  computeTrajectory,
  alignCalendarYear,
  alignCareerYear,
} from '@/lib/career-analytics/trajectory';

/** Distinct colors for comparison entities */
const ENTITY_COLORS = ['#ef4444', '#3b82f6', '#22c55e'];

/** Summary stats for the comparison table */
interface EntitySummary {
  slug: string;
  name: string;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  championships: number;
  seasonCount: number;
}

function extractSummary(
  slug: string,
  career: DriverCareer | TeamCareer,
  entityType: 'driver' | 'team'
): EntitySummary {
  if (entityType === 'driver') {
    const dc = career as DriverCareer;
    return {
      slug,
      name: dc.name,
      races: dc.careerSummary.races,
      wins: dc.careerSummary.wins,
      podiums: dc.careerSummary.podiums,
      poles: dc.careerSummary.poles,
      points: dc.careerSummary.points,
      championships: dc.seasons.filter((s) => s.position === 1).length,
      seasonCount: dc.seasons.length,
    };
  }
  const tc = career as TeamCareer;
  return {
    slug,
    name: tc.name,
    races: tc.careerSummary.races,
    wins: tc.careerSummary.wins,
    podiums: tc.careerSummary.podiums,
    poles: tc.careerSummary.poles,
    points: tc.careerSummary.points,
    championships: tc.careerSummary.constructorsChampionships,
    seasonCount: tc.seasons.length,
  };
}

export default function CareerComparison({
  entityType = 'driver',
  initialSlug,
}: CareerComparisonProps) {
  const { selectedYear } = useSeason();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlug ? [initialSlug] : []);
  const [alignmentMode, setAlignmentMode] = useState<AlignmentMode>('calendar');
  const [entityErrors, setEntityErrors] = useState<Record<string, string>>({});

  // Fetch standings for the searchable dropdown
  const { data: driverStandings } = useQuery({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
    enabled: entityType === 'driver',
    staleTime: 5 * 60 * 1000,
  });

  const { data: teamStandings } = useQuery({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
    enabled: entityType === 'team',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch career data for all selected entities
  const {
    data: careerData,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['careerComparison', entityType, ...selectedSlugs],
    queryFn: async () => {
      const results: Record<string, DriverCareer | TeamCareer> = {};
      const errors: Record<string, string> = {};

      await Promise.all(
        selectedSlugs.map(async (slug) => {
          try {
            if (entityType === 'driver') {
              results[slug] = await fetchDriverCareer(slug);
            } else {
              results[slug] = await fetchTeamCareer(slug);
            }
          } catch (err) {
            errors[slug] = err instanceof Error ? err.message : 'Failed to load data';
          }
        })
      );

      setEntityErrors(errors);
      return results;
    },
    enabled: selectedSlugs.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  // Compute trajectory data for all loaded entities
  const trajectoryData = useMemo(() => {
    if (!careerData || Object.keys(careerData).length === 0) return null;

    const trajectories = new Map<string, TrajectoryDataPoint[]>();

    for (const [slug, career] of Object.entries(careerData)) {
      const seasons = (career as DriverCareer | TeamCareer).seasons || [];
      const dataPoints = computeTrajectory(seasons, 'position');
      trajectories.set(slug, dataPoints);
    }

    // Apply alignment
    if (alignmentMode === 'calendar') {
      return alignCalendarYear(trajectories);
    }
    return alignCareerYear(trajectories);
  }, [careerData, alignmentMode]);

  // Build chart data for Recharts
  const chartData = useMemo(() => {
    if (!trajectoryData || trajectoryData.size === 0) return [];

    const allSeasons = new Set<number>();
    for (const [, points] of trajectoryData) {
      points.forEach((p) => allSeasons.add(p.season));
    }
    const sortedSeasons = Array.from(allSeasons).sort((a, b) => a - b);

    return sortedSeasons.map((season) => {
      const entry: Record<string, number | string | null> = { season };
      for (const [slug, points] of trajectoryData) {
        const point = points.find((p) => p.season === season);
        entry[slug] = point ? point.value : null;
      }
      return entry;
    });
  }, [trajectoryData]);

  // Determine career end seasons for each entity (for dashed line indication)
  const careerEndSeasons = useMemo(() => {
    if (!careerData) return new Map<string, number>();
    const ends = new Map<string, number>();
    for (const [slug, career] of Object.entries(careerData)) {
      const seasons = (career as DriverCareer | TeamCareer).seasons || [];
      if (seasons.length > 0) {
        const maxSeason = Math.max(...seasons.map((s) => s.season));
        ends.set(slug, maxSeason);
      }
    }
    return ends;
  }, [careerData]);

  // Determine the max season across all entities (for detecting ended careers)
  const maxSeasonAcrossAll = useMemo(() => {
    if (!careerEndSeasons.size) return 0;
    return Math.max(...careerEndSeasons.values());
  }, [careerEndSeasons]);

  // Build entity summaries for the comparison table
  const summaries = useMemo(() => {
    if (!careerData) return [];
    return Object.entries(careerData).map(([slug, career]) =>
      extractSummary(slug, career, entityType)
    );
  }, [careerData, entityType]);

  // Get entity name from slug
  const getEntityName = useCallback(
    (slug: string): string => {
      if (careerData && careerData[slug]) {
        if (entityType === 'driver') {
          return (careerData[slug] as DriverCareer).name;
        }
        return (careerData[slug] as TeamCareer).name;
      }
      return slug;
    },
    [careerData, entityType]
  );

  // Handle adding an entity
  const handleAddEntity = useCallback(
    (slug: string) => {
      if (!slug || selectedSlugs.includes(slug) || selectedSlugs.length >= 3) return;
      setSelectedSlugs((prev) => [...prev, slug]);
    },
    [selectedSlugs]
  );

  // Handle removing an entity
  const handleRemoveEntity = useCallback((slug: string) => {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
    setEntityErrors((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }, []);

  // Get available options for the dropdown (filter out already selected)
  const availableOptions = useMemo(() => {
    if (entityType === 'driver' && driverStandings) {
      return driverStandings
        .filter((d) => {
          const slug = d.name.toLowerCase().replace(/\s+/g, '-');
          return !selectedSlugs.includes(slug);
        })
        .map((d) => ({
          slug: d.name.toLowerCase().replace(/\s+/g, '-'),
          label: `${d.name} (${d.code})`,
        }));
    }
    if (entityType === 'team' && teamStandings) {
      return teamStandings
        .filter((t) => {
          const slug = t.team.toLowerCase().replace(/\s+/g, '-');
          return !selectedSlugs.includes(slug);
        })
        .map((t) => ({
          slug: t.team.toLowerCase().replace(/\s+/g, '-'),
          label: t.team,
        }));
    }
    return [];
  }, [entityType, driverStandings, teamStandings, selectedSlugs]);

  // Custom tooltip
  const renderTooltip = useCallback(
    ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: Record<string, unknown>[];
      label?: string | number;
    }) => {
      if (!active || !payload || !payload.length) return null;

      const seasonLabel = alignmentMode === 'career' ? `Career Year ${label}` : `Season ${label}`;

      return (
        <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <p className="mb-1 text-[11px] font-medium text-white/70">{seasonLabel}</p>
          {payload.map((entry: Record<string, unknown>, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color as string }}
              />
              <span className="text-white/50">{getEntityName(entry.dataKey as string)}:</span>
              <span className="font-medium text-white">
                {entry.value != null ? `P${entry.value}` : '—'}
              </span>
            </div>
          ))}
        </div>
      );
    },
    [alignmentMode, getEntityName]
  );

  // Determine if an entity's career has ended (for dashed line styling)
  const hasCareerEnded = useCallback(
    (slug: string): boolean => {
      if (alignmentMode === 'career') return false;
      const endSeason = careerEndSeasons.get(slug);
      if (!endSeason) return false;
      return endSeason < maxSeasonAcrossAll;
    },
    [careerEndSeasons, maxSeasonAcrossAll, alignmentMode]
  );

  // Not enough entities selected
  if (selectedSlugs.length === 0) {
    return (
      <div className="space-y-4">
        {/* Entity selector */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
          <span className="text-[12px] text-white/50">
            Select {entityType === 'driver' ? 'drivers' : 'teams'} to compare (2-3):
          </span>
          <Select onValueChange={handleAddEntity}>
            <SelectTrigger className="h-8 w-52 border-white/[0.06] bg-white/[0.04] text-[12px] text-white/70">
              <SelectValue placeholder={`Add ${entityType === 'driver' ? 'driver' : 'team'}...`} />
            </SelectTrigger>
            <SelectContent className="border-white/[0.06] bg-[#0c0c0e]">
              {availableOptions.map((opt) => (
                <SelectItem key={opt.slug} value={opt.slug} className="text-[12px] text-white/70">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
          <p className="text-[14px] text-white/40">
            Select at least 2 {entityType === 'driver' ? 'drivers' : 'teams'} to begin comparison
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Entity selector */}
      <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <span className="text-[12px] text-white/50">
          Comparing {entityType === 'driver' ? 'drivers' : 'teams'}:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {selectedSlugs.map((slug, idx) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-white/80"
              style={{ backgroundColor: `${ENTITY_COLORS[idx]}20` }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: ENTITY_COLORS[idx] }}
              />
              {getEntityName(slug)}
              {entityErrors[slug] && (
                <span className="text-red-400" title={entityErrors[slug]}>
                  ⚠
                </span>
              )}
              <button
                onClick={() => handleRemoveEntity(slug)}
                className="ml-0.5 text-white/40 hover:text-white/70"
                aria-label={`Remove ${getEntityName(slug)}`}
              >
                ×
              </button>
            </span>
          ))}
          {selectedSlugs.length < 3 && (
            <Select onValueChange={handleAddEntity}>
              <SelectTrigger className="h-7 w-full border-white/[0.06] bg-white/[0.04] text-[11px] text-white/70 sm:w-44">
                <SelectValue
                  placeholder={`Add ${entityType === 'driver' ? 'driver' : 'team'}...`}
                />
              </SelectTrigger>
              <SelectContent className="border-white/[0.06] bg-[#0c0c0e]">
                {availableOptions.map((opt) => (
                  <SelectItem key={opt.slug} value={opt.slug} className="text-[11px] text-white/70">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Error messages for individual entity failures */}
      {Object.keys(entityErrors).length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
          {Object.entries(entityErrors).map(([slug, error]) => (
            <p key={slug} className="text-[11px] text-red-400">
              Failed to load data for {slug}: {error}
            </p>
          ))}
          <p className="mt-1 text-[11px] text-white/50">
            Showing data for successfully loaded entities.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
            <p className="text-[14px] text-white/40">Loading career data...</p>
          </div>
        </div>
      )}

      {/* Main content (only show when we have data) */}
      {!isLoading && careerData && Object.keys(careerData).length > 0 && (
        <>
          {/* Alignment toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
              Alignment:
            </span>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
              <button
                onClick={() => setAlignmentMode('calendar')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  alignmentMode === 'calendar'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                Calendar Year
              </button>
              <button
                onClick={() => setAlignmentMode('career')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  alignmentMode === 'career'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                Career Year
              </button>
            </div>
          </div>

          {/* Trajectory chart */}
          {chartData.length > 0 && (
            <div className="h-[250px] w-full sm:h-[300px] lg:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="season"
                    tick={{
                      fill: 'rgba(255,255,255,0.4)',
                      fontSize: 11,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    label={
                      alignmentMode === 'career'
                        ? {
                            value: 'Career Year',
                            position: 'insideBottom',
                            offset: -5,
                            style: { fill: 'rgba(255,255,255,0.4)', fontSize: 11 },
                          }
                        : undefined
                    }
                  />
                  <YAxis
                    tick={{
                      fill: 'rgba(255,255,255,0.4)',
                      fontSize: 11,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    reversed
                    domain={['dataMin', 'dataMax']}
                    label={{
                      value: 'Championship Position',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'rgba(255,255,255,0.4)', fontSize: 11 },
                    }}
                  />
                  <Tooltip content={renderTooltip} />
                  <Legend
                    wrapperStyle={{ paddingTop: 8 }}
                    formatter={(value: string) => (
                      <span className="text-[11px] text-white/50">{getEntityName(value)}</span>
                    )}
                  />
                  {selectedSlugs
                    .filter((slug) => careerData[slug])
                    .map((slug, idx) => (
                      <Line
                        key={slug}
                        type="monotone"
                        dataKey={slug}
                        name={slug}
                        stroke={ENTITY_COLORS[idx % ENTITY_COLORS.length]}
                        strokeWidth={2}
                        strokeDasharray={hasCareerEnded(slug) ? '5 5' : undefined}
                        strokeOpacity={hasCareerEnded(slug) ? 0.6 : 1}
                        dot={{
                          r: 3,
                          fill: ENTITY_COLORS[idx % ENTITY_COLORS.length],
                        }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                      />
                    ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Career end indication note */}
          {alignmentMode === 'calendar' && selectedSlugs.some((slug) => hasCareerEnded(slug)) && (
            <p className="text-center text-[11px] text-white/40">
              Dashed lines indicate careers that have ended while others continue
            </p>
          )}

          {/* Summary comparison table */}
          {summaries.length >= 2 && (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#0c0c0e]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                      Stat
                    </th>
                    {summaries.map((summary, idx) => (
                      <th
                        key={summary.slug}
                        className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: ENTITY_COLORS[idx] }}
                      >
                        {summary.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50">Seasons</td>
                    {summaries.map((s) => (
                      <td key={s.slug} className="px-4 py-2 text-right font-medium text-white/80">
                        {s.seasonCount}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50">Races</td>
                    {summaries.map((s) => (
                      <td key={s.slug} className="px-4 py-2 text-right font-medium text-white/80">
                        {s.races}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50">Wins</td>
                    {summaries.map((s) => (
                      <td key={s.slug} className="px-4 py-2 text-right font-medium text-white/80">
                        {s.wins}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50">Podiums</td>
                    {summaries.map((s) => (
                      <td key={s.slug} className="px-4 py-2 text-right font-medium text-white/80">
                        {s.podiums}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50">Poles</td>
                    {summaries.map((s) => (
                      <td key={s.slug} className="px-4 py-2 text-right font-medium text-white/80">
                        {s.poles}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50">Points</td>
                    {summaries.map((s) => (
                      <td key={s.slug} className="px-4 py-2 text-right font-medium text-white/80">
                        {s.points.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/50">Championships</td>
                    {summaries.map((s) => (
                      <td key={s.slug} className="px-4 py-2 text-right font-medium text-white/80">
                        {s.championships}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Insufficient data for comparison */}
          {Object.keys(careerData).length < 2 && selectedSlugs.length >= 2 && (
            <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
              <p className="text-[14px] text-white/40">
                Need at least 2 successfully loaded entities for comparison
              </p>
            </div>
          )}
        </>
      )}

      {/* Global fetch error */}
      {fetchError && !isLoading && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
          <p className="text-[14px] text-white/40">Unable to load comparison data.</p>
          <button
            onClick={() => setSelectedSlugs([...selectedSlugs])}
            className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
