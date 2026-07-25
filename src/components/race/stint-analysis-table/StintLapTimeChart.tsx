import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from '@/lib/recharts-lazy';
import type { LapDetail } from '@/lib/api';
import { formatLapTime } from './helpers';
import { cn } from '@/lib/utils';

interface StintLapTimeChartProps {
  lapDetails: LapDetail[];
  compoundColor: string;
  driverName: string;
  stintStart: number;
  stintEnd: number;
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  if (points.length < 2) return null;
  const n = points.length;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxy += p.x * p.y;
    sx2 += p.x * p.x;
  }
  const denom = n * sx2 - sx * sx;
  if (denom === 0) return null;
  return { slope: (n * sxy - sx * sy) / denom, intercept: (sy * sx2 - sx * sxy) / denom };
}

export function StintLapTimeChart({ lapDetails, compoundColor, driverName, stintStart, stintEnd }: StintLapTimeChartProps) {
  const chartData = useMemo(() => {
    return lapDetails.map((lap) => ({
      lap: lap.lapNumber,
      time: lap.lapTime,
      s1: lap.sector1,
      s2: lap.sector2,
      s3: lap.sector3,
      tyreLife: lap.tyreLife,
      position: lap.position,
    }));
  }, [lapDetails]);

  const stats = useMemo(() => {
    const valid = chartData.filter((d) => d.time > 0);
    if (valid.length === 0) return null;
    const times = valid.map((d) => d.time);
    const best = Math.min(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const variance = times.reduce((s, t) => s + (t - avg) ** 2, 0) / times.length;
    const consistency = Math.sqrt(variance);
    const regression = linearRegression(valid.map((d) => ({ x: d.lap, y: d.time })));
    return { best, avg, median, consistency, degradation: regression?.slope ?? null, bestLap: valid.find((d) => d.time === best)?.lap ?? null };
  }, [chartData]);

  if (chartData.length < 2) {
    return (
      <div className="py-4 text-center text-[12px] text-white/50">
        Not enough lap data to chart
      </div>
    );
  }

  const validData = chartData.filter((d) => d.time > 0);
  const dataMin = Math.min(...validData.map((d) => d.time));
  const dataMax = Math.max(...validData.map((d) => d.time));
  const padding = Math.max((dataMax - dataMin) * 0.2, 0.3);

  const trendLine = stats?.degradation != null && stats ? [
    { lap: validData[0].lap, time: stats.degradation * validData[0].lap + stats.intercept! },
    { lap: validData[validData.length - 1].lap, time: stats.degradation * validData[validData.length - 1].lap + stats.intercept! },
  ] : null;

  const sectorColors = ['#ef4444', '#3b82f6', '#22c55e'];

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
          Stint detail — {driverName}
        </span>
        <span className="text-[10px] text-white/40">
          L{stintStart} → L{stintEnd}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="none" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis
            dataKey="lap"
            stroke="rgba(255,255,255,0.06)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="rgba(255,255,255,0.06)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            domain={[dataMin - padding, dataMax + padding]}
            tickFormatter={formatLapTime}
            width={48}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0]?.payload as typeof chartData[number];
              return (
                <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] px-3 py-2 shadow-2xl">
                  <div className="mb-1.5 text-[11px] font-medium text-white/60">L{data.lap}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] text-white/50">Time</span>
                      <span className="text-[11px] font-semibold text-white tabular-nums">{formatLapTime(data.time)}</span>
                    </div>
                    {data.s1 != null && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-red-400/80">S1</span>
                        <span className="text-[11px] tabular-nums text-white">{formatLapTime(data.s1)}</span>
                      </div>
                    )}
                    {data.s2 != null && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-blue-400/80">S2</span>
                        <span className="text-[11px] tabular-nums text-white">{formatLapTime(data.s2)}</span>
                      </div>
                    )}
                    {data.s3 != null && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-emerald-400/80">S3</span>
                        <span className="text-[11px] tabular-nums text-white">{formatLapTime(data.s3)}</span>
                      </div>
                    )}
                    {data.tyreLife != null && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-white/50">Tyre age</span>
                        <span className="text-[11px] tabular-nums text-white">L{data.tyreLife}</span>
                      </div>
                    )}
                    {data.position != null && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-white/50">Position</span>
                        <span className="text-[11px] tabular-nums text-white">P{data.position}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />

          {/* Degradation trend line */}
          {trendLine && (
            <Line
              type="linear"
              data={trendLine}
              dataKey="time"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name="trend"
              legendType="none"
              isAnimationActive={false}
            />
          )}

          {/* Best lap reference */}
          {stats?.best != null && (
            <ReferenceLine
              y={stats.best}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}

          <Line
            type="monotone"
            dataKey="time"
            stroke={compoundColor}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1, stroke: '#fff', fill: compoundColor }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Sector delta mini bars */}
      <div className="mt-2 flex items-end gap-px overflow-x-auto" style={{ height: 32 }}>
        {chartData.map((d) => {
          if (!d.s1 && !d.s2 && !d.s3) return null;
          const max = Math.max(d.s1 || 0, d.s2 || 0, d.s3 || 0);
          return (
            <div key={d.lap} className="flex flex-col justify-end gap-px" style={{ width: 4, minWidth: 4 }}>
              {([d.s1, d.s2, d.s3] as (number | undefined)[]).map((s, i) => (
                <div
                  key={i}
                  className="rounded-t-[1px]"
                  style={{
                    height: s && max ? Math.max((s / max) * 30, 1) : 1,
                    backgroundColor: s ? sectorColors[i] : 'transparent',
                    opacity: s ? 0.5 : 0,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="mt-2 grid grid-cols-5 gap-2 border-t border-white/[0.04] pt-2">
          <StatCell label="Best" value={formatLapTime(stats.best)} highlight />
          <StatCell label="Median" value={formatLapTime(stats.median)} />
          <StatCell label="Avg" value={formatLapTime(stats.avg)} />
          <StatCell label="σ" value={stats.consistency.toFixed(3) + 's'} />
          {stats.degradation != null && (
            <StatCell
              label="Δ/lap"
              value={(stats.degradation > 0 ? '+' : '') + stats.degradation.toFixed(3) + 's'}
              warn={stats.degradation > 0.01}
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[8px] font-medium uppercase tracking-wider text-white/40">{label}</span>
      <span className={cn(
        'text-[10px] font-semibold tabular-nums',
        highlight ? 'text-purple-400' : warn ? 'text-red-400' : 'text-white'
      )}>
        {value}
      </span>
    </div>
  );
}
