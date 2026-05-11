import { useState, useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import type { ConsistencyScoreProps } from '@/lib/types/career-analytics';
import type { ConsistencyMetrics, ConsistencyComparison } from '@/lib/types/career-analytics';
import type { DriverCareer, TeamCareer } from '@/lib/api';
import {
  computeFullConsistencyMetrics,
  compareToEraAverage,
  compareToAllTimeGreats,
  computeRateMetrics,
} from '@/lib/career-analytics/consistency-scorer';
import { ALL_TIME_GREATS } from '@/lib/career-analytics/constants';

type ComparisonMode = 'none' | 'era' | 'greats';

interface GaugeProps {
  label: string;
  value: number;
  max: number;
  comparisonValue?: number;
  unit?: string;
  invertedIsBetter?: boolean;
}

/**
 * Custom SVG radial gauge component.
 * Renders an arc-based gauge matching the dark theme.
 */
function RadialGauge({
  label,
  value,
  max,
  comparisonValue,
  unit = '%',
  invertedIsBetter = false,
}: GaugeProps) {
  const radius = 54;
  const strokeWidth = 8;
  const center = 64;
  // Arc spans 270 degrees (from 135° to 405°)
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;

  const normalizedValue = max > 0 ? Math.min(value / max, 1) : 0;
  const valueAngle = startAngle + normalizedValue * totalAngle;

  // Comparison baseline arc
  const normalizedComparison =
    comparisonValue !== undefined && max > 0 ? Math.min(comparisonValue / max, 1) : undefined;
  const comparisonAngle =
    normalizedComparison !== undefined ? startAngle + normalizedComparison * totalAngle : undefined;

  // Determine color based on value vs comparison (or absolute)
  const getColor = () => {
    if (comparisonValue !== undefined) {
      if (invertedIsBetter) {
        return value < comparisonValue
          ? '#22c55e'
          : value > comparisonValue
            ? '#ef4444'
            : '#a1a1aa';
      }
      return value > comparisonValue ? '#22c55e' : value < comparisonValue ? '#ef4444' : '#a1a1aa';
    }
    // No comparison: color by percentage of max
    if (normalizedValue >= 0.7) return '#22c55e';
    if (normalizedValue >= 0.4) return '#eab308';
    return '#ef4444';
  };

  const color = getColor();

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="128" height="128" viewBox="0 0 128 128" className="drop-shadow-sm">
        {/* Background track */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Comparison baseline indicator */}
        {comparisonAngle !== undefined && (
          <path
            d={describeArc(startAngle, comparisonAngle)}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Value arc */}
        <m.path
          d={describeArc(startAngle, valueAngle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Comparison marker tick */}
        {comparisonAngle !== undefined && (
          <>
            {(() => {
              const innerRadius = radius - strokeWidth / 2 - 4;
              const outerRadius = radius + strokeWidth / 2 + 4;
              const radAngle = ((comparisonAngle - 90) * Math.PI) / 180;
              const x1 = center + innerRadius * Math.cos(radAngle);
              const y1 = center + innerRadius * Math.sin(radAngle);
              const x2 = center + outerRadius * Math.cos(radAngle);
              const y2 = center + outerRadius * Math.sin(radAngle);
              return (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              );
            })()}
          </>
        )}

        {/* Center value text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="fill-white text-lg font-bold"
          fontSize="18"
          fontWeight="700"
        >
          {value.toFixed(1)}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="11"
        >
          {unit}
        </text>
      </svg>
      <span className="text-xs font-medium text-white/70">{label}</span>
    </div>
  );
}

/**
 * Extracts career summary data from the career prop (DriverCareer or TeamCareer).
 */
function extractCareerData(career: unknown, entityType: 'driver' | 'team') {
  const c = career as DriverCareer | TeamCareer;

  if (entityType === 'driver') {
    const dc = c as DriverCareer;
    return {
      races: dc.careerSummary.races,
      wins: dc.careerSummary.wins,
      podiums: dc.careerSummary.podiums,
      points: dc.careerSummary.points,
      dnfs: dc.careerSummary.dnfs,
      seasons: dc.seasons.map((s) => ({
        pointsPerRace: s.races > 0 ? s.points / s.races : 0,
      })),
    };
  }

  const tc = c as TeamCareer;
  return {
    races: tc.careerSummary.races,
    wins: tc.careerSummary.wins,
    podiums: tc.careerSummary.podiums,
    points: tc.careerSummary.points,
    dnfs: 0, // Teams don't have a DNF count in the summary
    seasons: tc.seasons.map((s) => ({
      pointsPerRace: s.races > 0 ? s.points / s.races : 0,
    })),
  };
}

/**
 * ConsistencyScore component.
 *
 * Displays radial gauges for win rate, podium rate, points-per-race, DNF rate,
 * and composite consistency score. Supports comparison modes:
 * - "Era Average": compares to drivers from the same era
 * - "All-Time Greats": compares to a curated list of historically significant drivers
 */
export default function ConsistencyScore({ career, entityType }: ConsistencyScoreProps) {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('none');

  const careerData = useMemo(() => extractCareerData(career, entityType), [career, entityType]);

  const metrics: ConsistencyMetrics = useMemo(() => {
    return computeFullConsistencyMetrics(
      {
        races: careerData.races,
        wins: careerData.wins,
        podiums: careerData.podiums,
        points: careerData.points,
        dnfs: careerData.dnfs,
      },
      careerData.seasons
    );
  }, [careerData]);

  // Pre-compute all-time greats metrics for comparison
  const greatsMetrics: ConsistencyMetrics[] = useMemo(() => {
    const greatsData: {
      races: number;
      wins: number;
      podiums: number;
      points: number;
      dnfs: number;
    }[] = [
      { races: 308, wins: 91, podiums: 155, points: 1566, dnfs: 26 },
      { races: 356, wins: 105, podiums: 202, points: 4829, dnfs: 31 },
      { races: 161, wins: 41, podiums: 80, points: 614, dnfs: 29 },
      { races: 199, wins: 51, podiums: 106, points: 798, dnfs: 26 },
      { races: 209, wins: 63, podiums: 111, points: 2998, dnfs: 10 },
      { races: 299, wins: 53, podiums: 122, points: 3098, dnfs: 18 },
      { races: 401, wins: 32, podiums: 106, points: 2329, dnfs: 32 },
      { races: 72, wins: 25, podiums: 32, points: 255, dnfs: 14 },
      { races: 51, wins: 24, podiums: 35, points: 245, dnfs: 5 },
      { races: 171, wins: 25, podiums: 54, points: 420, dnfs: 27 },
      { races: 99, wins: 27, podiums: 43, points: 360, dnfs: 14 },
      { races: 204, wins: 23, podiums: 60, points: 485, dnfs: 36 },
    ];

    return greatsData.map((d) => computeRateMetrics(d));
  }, []);

  const comparison: ConsistencyComparison | null = useMemo(() => {
    if (comparisonMode === 'greats') {
      return compareToAllTimeGreats(metrics, greatsMetrics);
    }
    if (comparisonMode === 'era') {
      const eraDrivers =
        greatsMetrics.length >= 5
          ? ALL_TIME_GREATS.map((_, i) => {
              const d = [
                { races: 308, wins: 91, podiums: 155, points: 1566, dnfs: 26 },
                { races: 356, wins: 105, podiums: 202, points: 4829, dnfs: 31 },
                { races: 161, wins: 41, podiums: 80, points: 614, dnfs: 29 },
                { races: 199, wins: 51, podiums: 106, points: 798, dnfs: 26 },
                { races: 209, wins: 63, podiums: 111, points: 2998, dnfs: 10 },
                { races: 299, wins: 53, podiums: 122, points: 3098, dnfs: 18 },
                { races: 401, wins: 32, podiums: 106, points: 2329, dnfs: 32 },
                { races: 72, wins: 25, podiums: 32, points: 255, dnfs: 14 },
                { races: 51, wins: 24, podiums: 35, points: 245, dnfs: 5 },
                { races: 171, wins: 25, podiums: 54, points: 420, dnfs: 27 },
                { races: 99, wins: 27, podiums: 43, points: 360, dnfs: 14 },
                { races: 204, wins: 23, podiums: 60, points: 485, dnfs: 36 },
              ];
              return d[i];
            })
          : [];
      const result = compareToEraAverage(metrics, eraDrivers);
      return result;
    }
    return null;
  }, [comparisonMode, metrics, greatsMetrics]);

  // Loading state not needed since computation is synchronous from career data
  if (careerData.races === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center">
        <p className="text-[14px] text-white/40">
          No race data available for consistency analysis.
        </p>
        <p className="text-[11px] text-white/25">Complete races to unlock this analysis</p>
      </div>
    );
  }

  const comparisonMetrics = comparison?.comparison;

  // Max values for gauges
  const maxWinRate = 100;
  const maxPodiumRate = 100;
  const maxPointsPerRace = 25;
  const maxDnfRate = 100;
  const maxComposite = 100;

  return (
    <div className="space-y-6">
      {/* Comparison Mode Toggle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
          Compare:
        </span>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
          <button
            onClick={() => setComparisonMode('none')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
              comparisonMode === 'none'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/35 hover:text-white/60'
            )}
          >
            None
          </button>
          <button
            onClick={() => setComparisonMode('era')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
              comparisonMode === 'era'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/35 hover:text-white/60'
            )}
          >
            Era Average
          </button>
          <button
            onClick={() => setComparisonMode('greats')}
            className={cn(
              'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
              comparisonMode === 'greats'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/35 hover:text-white/60'
            )}
          >
            All-Time Greats
          </button>
        </div>
      </div>

      {/* Comparison label */}
      {comparison && (
        <p className="text-[11px] text-white/30">
          Comparing to: <span className="text-white/70">{comparison.comparisonLabel}</span>
          {comparisonMode === 'era' && (
            <span className="ml-1 text-white/20">(tick mark = baseline)</span>
          )}
          {comparisonMode === 'greats' && (
            <span className="ml-1 text-white/20">(tick mark = baseline)</span>
          )}
        </p>
      )}

      {/* Gauges Grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        <RadialGauge
          label="Win Rate"
          value={metrics.winRate}
          max={maxWinRate}
          comparisonValue={comparisonMetrics?.winRate}
          unit="%"
        />
        <RadialGauge
          label="Podium Rate"
          value={metrics.podiumRate}
          max={maxPodiumRate}
          comparisonValue={comparisonMetrics?.podiumRate}
          unit="%"
        />
        <RadialGauge
          label="Pts/Race"
          value={metrics.pointsPerRace}
          max={maxPointsPerRace}
          comparisonValue={comparisonMetrics?.pointsPerRace}
          unit="pts"
        />
        <RadialGauge
          label="DNF Rate"
          value={metrics.dnfRate}
          max={maxDnfRate}
          comparisonValue={comparisonMetrics?.dnfRate}
          unit="%"
          invertedIsBetter
        />
        <RadialGauge
          label="Consistency"
          value={metrics.compositeScore}
          max={maxComposite}
          comparisonValue={comparisonMetrics?.compositeScore}
          unit="/100"
        />
      </div>

      {/* Insufficient comparison data message */}
      {comparisonMode === 'era' && !comparison && (
        <p className="text-center text-[11px] text-white/30">
          Insufficient comparison data. At least 5 drivers from the same era are required.
        </p>
      )}

      {/* Metric Details */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Metric Breakdown
          </h3>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>
        <div className="space-y-2">
          <MetricRow
            label="Win Rate"
            value={metrics.winRate}
            unit="%"
            comparison={comparisonMetrics?.winRate}
          />
          <MetricRow
            label="Podium Rate"
            value={metrics.podiumRate}
            unit="%"
            comparison={comparisonMetrics?.podiumRate}
          />
          <MetricRow
            label="Points per Race"
            value={metrics.pointsPerRace}
            unit="pts"
            comparison={comparisonMetrics?.pointsPerRace}
          />
          <MetricRow
            label="DNF Rate"
            value={metrics.dnfRate}
            unit="%"
            comparison={comparisonMetrics?.dnfRate}
            invertedIsBetter
          />
          <MetricRow
            label="Composite Score"
            value={metrics.compositeScore}
            unit="/100"
            comparison={comparisonMetrics?.compositeScore}
          />
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  unit,
  comparison,
  invertedIsBetter = false,
}: {
  label: string;
  value: number;
  unit: string;
  comparison?: number;
  invertedIsBetter?: boolean;
}) {
  const diff = comparison !== undefined ? value - comparison : undefined;
  const isPositive = diff !== undefined ? (invertedIsBetter ? diff < 0 : diff > 0) : false;
  const isNegative = diff !== undefined ? (invertedIsBetter ? diff > 0 : diff < 0) : false;

  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 last:border-0">
      <span className="text-[12px] text-white/40">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium text-white">
          {value.toFixed(1)}
          <span className="text-white/30">{unit}</span>
        </span>
        {diff !== undefined && (
          <span
            className={cn(
              'text-[11px] font-medium',
              isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white/30'
            )}
          >
            {diff > 0 ? '+' : ''}
            {diff.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
