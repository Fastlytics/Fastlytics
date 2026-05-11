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
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fetchDriverCareer, fetchDriverStandings, DriverCareer } from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import { cn } from '@/lib/utils';
import type {
  TrajectoryChartProps,
  TrajectoryMetric,
  TrajectoryDataPoint,
} from '@/lib/types/career-analytics';
import {
  computeTrajectory,
  alignCalendarYear,
  invertPositionValues,
} from '@/lib/career-analytics/trajectory';

const METRIC_LABELS: Record<TrajectoryMetric, string> = {
  points: 'Points',
  wins: 'Wins',
  podiums: 'Podiums',
  poles: 'Poles',
  position: 'Position',
  winRate: 'Win Rate',
  podiumRate: 'Podium Rate',
};

const LINE_COLORS = ['#ef4444', '#3b82f6', '#22c55e'];
const LINE_STYLES: Array<string | undefined> = [undefined, '5 5', '3 3'];

const ALL_METRICS: TrajectoryMetric[] = [
  'points',
  'wins',
  'podiums',
  'poles',
  'position',
  'winRate',
  'podiumRate',
];

export default function TrajectoryChart({ career, entityType }: TrajectoryChartProps) {
  const { selectedYear } = useSeason();
  const [selectedMetrics, setSelectedMetrics] = useState<TrajectoryMetric[]>(['points']);
  const [comparisonSlugs, setComparisonSlugs] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { data: standings } = useQuery({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
    enabled: showComparison && entityType === 'driver',
    staleTime: 5 * 60 * 1000,
  });

  const { data: comparisonCareers } = useQuery({
    queryKey: ['comparisonCareers', ...comparisonSlugs, retryCount],
    queryFn: async () => {
      return Promise.all(comparisonSlugs.map((slug) => fetchDriverCareer(slug)));
    },
    enabled: comparisonSlugs.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const seasons = useMemo(() => {
    if (!career) return [];
    return (career as DriverCareer).seasons || [];
  }, [career]);

  const hasInsufficientData = seasons.length < 2;
  const hasError = !career;

  const primaryData = useMemo(() => {
    if (hasInsufficientData || !seasons.length) return new Map<string, TrajectoryDataPoint[]>();
    const result = new Map<string, TrajectoryDataPoint[]>();
    for (const metric of selectedMetrics) {
      let dataPoints = computeTrajectory(seasons, metric);
      if (metric === 'position') dataPoints = invertPositionValues(dataPoints);
      result.set(metric, dataPoints);
    }
    return result;
  }, [seasons, selectedMetrics, hasInsufficientData]);

  const comparisonData = useMemo(() => {
    if (!comparisonCareers || comparisonCareers.length === 0 || selectedMetrics.length === 0)
      return null;
    const metric = selectedMetrics[0];
    const trajectories = new Map<string, TrajectoryDataPoint[]>();
    let primaryPoints = computeTrajectory(seasons, metric);
    if (metric === 'position') primaryPoints = invertPositionValues(primaryPoints);
    trajectories.set('primary', primaryPoints);
    comparisonCareers.forEach((compCareer, idx) => {
      let points = computeTrajectory(compCareer.seasons, metric);
      if (metric === 'position') points = invertPositionValues(points);
      trajectories.set(compCareer.code || `comp-${idx}`, points);
    });
    return alignCalendarYear(trajectories);
  }, [comparisonCareers, seasons, selectedMetrics]);

  const chartData = useMemo(() => {
    if (comparisonData && comparisonSlugs.length > 0) {
      const allSeasons = new Set<number>();
      for (const [, points] of comparisonData) points.forEach((p) => allSeasons.add(p.season));
      return Array.from(allSeasons)
        .sort((a, b) => a - b)
        .map((season) => {
          const entry: Record<string, number | string | null> = { season };
          for (const [driverId, points] of comparisonData) {
            const point = points.find((p) => p.season === season);
            entry[driverId] = point ? point.value : null;
          }
          return entry;
        });
    }
    if (!primaryData.size) return [];
    const allSeasons = new Set<number>();
    for (const [, points] of primaryData) points.forEach((p) => allSeasons.add(p.season));
    return Array.from(allSeasons)
      .sort((a, b) => a - b)
      .map((season) => {
        const entry: Record<string, number | string | null> = { season };
        for (const [metric, points] of primaryData) {
          const point = points.find((p) => p.season === season);
          entry[metric] = point ? point.value : null;
        }
        const firstMetricPoints = primaryData.values().next().value;
        const seasonPoint = firstMetricPoints?.find(
          (p: TrajectoryDataPoint) => p.season === season
        );
        if (seasonPoint) {
          entry.team = seasonPoint.team || '';
          entry.position = seasonPoint.position ?? null;
        }
        return entry;
      });
  }, [primaryData, comparisonData, comparisonSlugs]);

  const handleMetricChange = useCallback((metric: string) => {
    const m = metric as TrajectoryMetric;
    setSelectedMetrics((prev) => {
      if (prev.includes(m)) return prev.length === 1 ? prev : prev.filter((x) => x !== m);
      if (prev.length >= 3) return [...prev.slice(1), m];
      return [...prev, m];
    });
  }, []);

  const handleAddComparison = useCallback(
    (slug: string) => {
      if (!slug || comparisonSlugs.includes(slug) || comparisonSlugs.length >= 3) return;
      setComparisonSlugs((prev) => [...prev, slug]);
    },
    [comparisonSlugs]
  );

  const handleRemoveComparison = useCallback((slug: string) => {
    setComparisonSlugs((prev) => prev.filter((s) => s !== slug));
  }, []);

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
      return (
        <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/50">
            Season {label}
          </p>
          {payload.map((entry: Record<string, unknown>, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: entry.color as string }}
              />
              <span className="text-white/50">{entry.name as string}:</span>
              <span className="font-medium tabular-nums text-white">
                {typeof entry.value === 'number' ? (entry.value as number).toFixed(1) : '—'}
              </span>
            </div>
          ))}
        </div>
      );
    },
    []
  );

  if (hasError) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">Unable to load career trajectory data.</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (hasInsufficientData) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">Insufficient data for trajectory visualization</p>
      </div>
    );
  }

  const hasPositionMetric = selectedMetrics.includes('position');
  const isComparisonMode = comparisonSlugs.length > 0;
  const lineKeys = isComparisonMode ? Array.from(comparisonData?.keys() || []) : selectedMetrics;

  const getLineLabel = (key: string) => {
    if (isComparisonMode) {
      if (key === 'primary')
        return (career as DriverCareer).code || (career as DriverCareer).name || 'Driver';
      const compCareer = comparisonCareers?.find((cc) => cc.code === key);
      return compCareer?.code || key;
    }
    return METRIC_LABELS[key as TrajectoryMetric] || key;
  };

  return (
    <div className="space-y-10">
      {/* Controls */}
      <section>
        <SectionHeader title="Metric Selection" />
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
              {ALL_METRICS.map((metric) => (
                <button
                  key={metric}
                  onClick={() => handleMetricChange(metric)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                    selectedMetrics.includes(metric)
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/35 hover:text-white/60'
                  )}
                >
                  {METRIC_LABELS[metric]}
                </button>
              ))}
            </div>

            {entityType === 'driver' && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={cn(
                  'self-start rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  showComparison
                    ? 'bg-red-500/[0.08] text-red-400 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.2)]'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                Compare Drivers
              </button>
            )}
          </div>

          {showComparison && entityType === 'driver' && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.04] pt-4">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                Compare with:
              </span>
              {comparisonSlugs.map((slug) => {
                const compCareer = comparisonCareers?.find(
                  (cc) => cc.driverId === slug || cc.code === slug
                );
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/70"
                  >
                    {compCareer?.code || slug}
                    <button
                      onClick={() => handleRemoveComparison(slug)}
                      className="ml-0.5 text-white/30 hover:text-white/70"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              {comparisonSlugs.length < 3 && (
                <Select value="" onValueChange={(val) => handleAddComparison(val)}>
                  <SelectTrigger className="h-7 w-40 rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-white/50">
                    <SelectValue placeholder="Add driver..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                    {standings
                      ?.filter((d) => {
                        const c = career as DriverCareer;
                        return (
                          d.code !== c.code &&
                          !comparisonSlugs.includes(d.name.toLowerCase().replace(/\s+/g, '-'))
                        );
                      })
                      .map((d) => (
                        <SelectItem
                          key={d.code}
                          value={d.name.toLowerCase().replace(/\s+/g, '-')}
                          className="text-[12px] text-white/70 focus:bg-white/[0.06] focus:text-white"
                        >
                          {d.name} ({d.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Chart */}
      <section>
        <SectionHeader title="Trajectory" />
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
          <div className="h-[280px] w-full sm:h-[320px] lg:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
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
                />
                <YAxis
                  tick={{
                    fill: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                  }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  reversed={hasPositionMetric && selectedMetrics.length === 1}
                />
                <Tooltip content={renderTooltip} />
                <Legend
                  wrapperStyle={{ paddingTop: 8 }}
                  formatter={(value: string) => (
                    <span className="text-[11px] text-white/50">{value}</span>
                  )}
                />
                {lineKeys.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={getLineLabel(key)}
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2}
                    strokeDasharray={LINE_STYLES[idx % LINE_STYLES.length]}
                    dot={{ r: 3, fill: LINE_COLORS[idx % LINE_COLORS.length] }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {hasPositionMetric && (
            <p className="mt-3 text-center text-[11px] text-white/30">
              Championship position uses inverted axis — higher on chart = better position
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
