import { useState, useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from '@/lib/recharts-lazy';
import { cn } from '@/lib/utils';
import { useDrivingFingerprint } from '@/hooks/useCareerAnalytics';
import type { DrivingFingerprintProps, FingerprintScores } from '@/lib/types/career-analytics';

/** Axis labels for the 6 fingerprint dimensions */
const AXES: { key: keyof FingerprintScores; label: string }[] = [
  { key: 'brakingStyle', label: 'Braking' },
  { key: 'throttleApplication', label: 'Throttle' },
  { key: 'corneringApproach', label: 'Cornering' },
  { key: 'tireManagement', label: 'Tire Mgmt' },
  { key: 'wetWeatherAbility', label: 'Wet Weather' },
  { key: 'overtakingStyle', label: 'Overtaking' },
];

/** Colors for the primary driver and up to 2 comparison drivers */
const DRIVER_COLORS = ['#ef4444', '#3b82f6', '#f59e0b'] as const;

interface ComparisonDriver {
  slug: string;
  name: string;
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-[350px] items-center justify-center">
      <div className="size-64 animate-pulse rounded-full bg-white/[0.04]" />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
      <div className="flex size-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
        <span className="text-sm text-red-400">!</span>
      </div>
      <p className="text-[14px] text-white/40">
        Driving style analysis is temporarily unavailable.
      </p>
      <button
        onClick={onRetry}
        className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        Retry
      </button>
    </div>
  );
}

function NoDataState() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center">
      <p className="text-[14px] text-white/40">
        Driving style analysis requires telemetry data available only from 2018 onward.
      </p>
      <p className="text-[11px] text-white/30">This driver's career predates the telemetry era.</p>
    </div>
  );
}

export default function DrivingFingerprint({ slug }: DrivingFingerprintProps) {
  const { data, isLoading, isError, refetch } = useDrivingFingerprint(slug);
  const [comparisonDrivers, setComparisonDrivers] = useState<ComparisonDriver[]>([]);
  const [comparisonInput, setComparisonInput] = useState('');

  // Fetch comparison driver data
  const comparison1 = useDrivingFingerprint(comparisonDrivers[0]?.slug || '');
  const comparison2 = useDrivingFingerprint(comparisonDrivers[1]?.slug || '');

  const chartData = useMemo(() => {
    if (!data?.scores) return [];

    return AXES.map((axis) => {
      const point: Record<string, string | number> = {
        axis: axis.label,
        value: data.scores[axis.key],
        fullMark: 100,
      };

      // Add comparison data if available
      if (comparison1.data?.scores) {
        point.comparison0 = comparison1.data.scores[axis.key];
      }
      if (comparison2.data?.scores) {
        point.comparison1 = comparison2.data.scores[axis.key];
      }

      return point;
    });
  }, [data, comparison1.data, comparison2.data]);

  const handleAddComparison = () => {
    const trimmed = comparisonInput.trim();
    if (!trimmed || comparisonDrivers.length >= 2) return;
    if (trimmed === slug || comparisonDrivers.some((d) => d.slug === trimmed)) return;

    setComparisonDrivers((prev) => [...prev, { slug: trimmed, name: trimmed }]);
    setComparisonInput('');
  };

  const handleRemoveComparison = (slugToRemove: string) => {
    setComparisonDrivers((prev) => prev.filter((d) => d.slug !== slugToRemove));
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  // No data state: scores are null (career ended before 2018)
  if (!data || !data.scores) {
    return <NoDataState />;
  }

  const { metadata } = data;
  const seasonsText =
    metadata?.seasonsCovered && metadata.seasonsCovered.length > 0
      ? `${metadata.seasonsCovered[0]}–${metadata.seasonsCovered[metadata.seasonsCovered.length - 1]}`
      : '2018–2024';

  return (
    <div className="space-y-4">
      {/* Radar Chart */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="h-[280px] sm:h-[340px] lg:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{
                  fill: 'rgba(255,255,255,0.4)',
                  fontSize: 11,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  if (!item) return null;
                  return (
                    <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                      <p className="mb-1 text-[11px] font-bold text-white">{item.axis}</p>
                      <div className="space-y-0.5 text-[11px]">
                        <p style={{ color: DRIVER_COLORS[0] }}>
                          {slug}: {item.value}
                        </p>
                        {item.comparison0 !== undefined && (
                          <p style={{ color: DRIVER_COLORS[1] }}>
                            {comparisonDrivers[0]?.slug}: {item.comparison0}
                          </p>
                        )}
                        {item.comparison1 !== undefined && (
                          <p style={{ color: DRIVER_COLORS[2] }}>
                            {comparisonDrivers[1]?.slug}: {item.comparison1}
                          </p>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-white/30">50 = field average</p>
                    </div>
                  );
                }}
              />
              {/* Primary driver */}
              <Radar
                name={slug}
                dataKey="value"
                stroke={DRIVER_COLORS[0]}
                fill={DRIVER_COLORS[0]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
              {/* Comparison driver 1 */}
              {comparison1.data?.scores && (
                <Radar
                  name={comparisonDrivers[0]?.slug}
                  dataKey="comparison0"
                  stroke={DRIVER_COLORS[1]}
                  fill={DRIVER_COLORS[1]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
              {/* Comparison driver 2 */}
              {comparison2.data?.scores && (
                <Radar
                  name={comparisonDrivers[1]?.slug}
                  dataKey="comparison1"
                  stroke={DRIVER_COLORS[2]}
                  fill={DRIVER_COLORS[2]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Telemetry coverage notice */}
        <p className="mt-3 text-center text-[11px] text-white/30">
          Based on telemetry from {seasonsText}
          {metadata?.totalLapCount
            ? ` · ${metadata.totalLapCount.toLocaleString()} laps analyzed`
            : ''}
        </p>
      </div>

      {/* Comparison controls */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Compare Driving Styles
          </h3>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        {/* Added comparison drivers */}
        {comparisonDrivers.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {comparisonDrivers.map((driver, i) => (
              <span
                key={driver.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-[11px] text-white/70"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: DRIVER_COLORS[i + 1] }}
                />
                {driver.slug}
                <button
                  onClick={() => handleRemoveComparison(driver.slug)}
                  className="ml-1 text-white/30 transition-colors hover:text-white/70"
                  aria-label={`Remove ${driver.slug}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add comparison input */}
        {comparisonDrivers.length < 2 && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={comparisonInput}
              onChange={(e) => setComparisonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComparison();
              }}
              placeholder="Enter driver slug to compare..."
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder:text-white/30 focus:border-white/[0.12] focus:outline-none sm:py-1.5"
            />
            <button
              onClick={handleAddComparison}
              disabled={!comparisonInput.trim()}
              className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
            >
              Add
            </button>
          </div>
        )}

        {comparisonDrivers.length >= 2 && (
          <p className="text-[11px] text-white/30">Maximum of 2 comparison drivers reached.</p>
        )}
      </div>

      {/* Score breakdown */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Score Breakdown
          </h3>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AXES.map((axis) => {
            const score = data.scores[axis.key];
            const isAboveAvg = score > 50;
            return (
              <div
                key={axis.key}
                className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-3"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                  {axis.label}
                </p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-bold tabular-nums',
                    isAboveAvg ? 'text-emerald-400' : 'text-white/70'
                  )}
                >
                  {score}
                </p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isAboveAvg ? 'bg-emerald-400/60' : 'bg-white/20'
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="mt-1 text-[9px] text-white/25">50 = field avg</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
