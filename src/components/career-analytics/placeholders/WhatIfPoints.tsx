import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { WhatIfPointsProps } from '@/lib/types/career-analytics';
import { useRaceResults } from '@/hooks/useCareerAnalytics';
import { recalculateCareer } from '@/lib/career-analytics/points-recalculator';
import { POINTS_SYSTEMS } from '@/lib/career-analytics/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from '@/lib/recharts-lazy';

export default function WhatIfPoints({ slug: slugProp }: WhatIfPointsProps) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = slugProp || routeSlug || '';
  const { data: raceResults, isLoading, error, refetch } = useRaceResults(slug);
  const [selectedSystem, setSelectedSystem] = useState(POINTS_SYSTEMS[0].id);

  const recalculation = useMemo(() => {
    if (!raceResults || raceResults.length === 0) return null;
    return recalculateCareer(raceResults, selectedSystem);
  }, [raceResults, selectedSystem]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-40 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>
        <div className="h-[300px] animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <div className="flex size-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
          <span className="text-sm text-red-400">!</span>
        </div>
        <p className="text-[14px] text-white/40">Failed to load race results data.</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!raceResults || raceResults.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center">
        <p className="text-[14px] text-white/40">
          No race results available for points recalculation.
        </p>
        <p className="text-[11px] text-white/25">Complete races to unlock this analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Points System Selector */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
            Points System
          </h2>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {POINTS_SYSTEMS.map((system) => (
              <button
                key={system.id}
                onClick={() => setSelectedSystem(system.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  selectedSystem === system.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                {system.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      {recalculation && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
              Comparison Summary
            </h2>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                Original Points
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-white">
                {recalculation.originalPoints.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                Recalculated
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-white">
                {recalculation.recalculatedPoints.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                Difference
              </div>
              <div
                className={cn(
                  'mt-2 text-2xl font-bold tabular-nums',
                  recalculation.difference > 0
                    ? 'text-emerald-400'
                    : recalculation.difference < 0
                      ? 'text-red-400'
                      : 'text-white'
                )}
              >
                {recalculation.difference > 0 ? '+' : ''}
                {recalculation.difference.toLocaleString()}
              </div>
              <div
                className={cn(
                  'mt-1 text-[12px] tabular-nums',
                  recalculation.percentageDiff > 0
                    ? 'text-emerald-400/60'
                    : recalculation.percentageDiff < 0
                      ? 'text-red-400/60'
                      : 'text-white/30'
                )}
              >
                ({recalculation.percentageDiff > 0 ? '+' : ''}
                {recalculation.percentageDiff.toFixed(1)}%)
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Season Breakdown Chart */}
      {recalculation && recalculation.seasonBreakdown.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
              Season Breakdown
            </h2>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
            <div className="h-[280px] w-full sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recalculation.seasonBreakdown}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
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
                    contentStyle={{
                      backgroundColor: '#09090b',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      name === 'original' ? 'Original' : 'Recalculated',
                    ]}
                    labelFormatter={(label) => `Season ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: "'Inter', sans-serif" }}
                    formatter={(value) => (
                      <span className="text-white/50">
                        {value === 'original' ? 'Original' : 'Recalculated'}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="original"
                    fill="rgba(255,255,255,0.2)"
                    radius={[3, 3, 0, 0]}
                    name="original"
                  />
                  <Bar
                    dataKey="recalculated"
                    fill="#ef4444"
                    radius={[3, 3, 0, 0]}
                    name="recalculated"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Season Table */}
      {recalculation && recalculation.seasonBreakdown.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
              Season Details
            </h2>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0c0c0e] text-[11px] font-bold uppercase tracking-wider text-white/30">
                    <th className="py-3 px-4 text-left">Season</th>
                    <th className="py-3 px-4 text-right">Original</th>
                    <th className="py-3 px-4 text-right">Recalculated</th>
                    <th className="py-3 px-4 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {recalculation.seasonBreakdown.map((season) => {
                    const diff = season.recalculated - season.original;
                    return (
                      <tr
                        key={season.season}
                        className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="py-3 px-4 text-[15px] font-bold tabular-nums text-white">
                          {season.season}
                        </td>
                        <td className="py-3 px-4 text-right text-[14px] tabular-nums text-white/60">
                          {season.original.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[14px] tabular-nums text-white/60">
                          {season.recalculated.toLocaleString()}
                        </td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right text-[14px] font-medium tabular-nums',
                            diff > 0
                              ? 'text-emerald-400'
                              : diff < 0
                                ? 'text-red-400'
                                : 'text-white/30'
                          )}
                        >
                          {diff > 0 ? '+' : ''}
                          {diff.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
