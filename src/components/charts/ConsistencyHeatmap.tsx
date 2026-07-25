import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LockKeyIcon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import { fetchLapTimes } from '@/lib/api';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { LapTimeDataPoint } from '@/lib/api';

interface ConsistencyHeatmapProps {
  year: number;
  event: string;
  session: string;
  favoriteDriver?: string;
  rivalDriver?: string;
  sessionDrivers: string[];
}

interface DriverConsistency {
  driver: string;
  median: number;
  lapDeltas: { lap: number; delta: number }[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}

export function ConsistencyHeatmap({ year, event, session, favoriteDriver, rivalDriver, sessionDrivers }: ConsistencyHeatmapProps) {
  const { user, isSubscribed } = useAuth();
  const isPro = user && isSubscribed('pro');
  const [sortBy, setSortBy] = useState<'name' | 'consistency'>('consistency');

  const { data, isLoading } = useQuery({
    queryKey: ['consistencyHeatmap', year, event, session, sessionDrivers],
    queryFn: () => fetchLapTimes(year, event, session, sessionDrivers),
    staleTime: 1000 * 60 * 10,
    enabled: !!year && !!event && !!session && sessionDrivers.length > 0,
  });

  const { drivers, maxLap } = useMemo(() => {
    if (!data?.lapComparison?.length) return { drivers: [] as DriverConsistency[], maxLap: 0 };

    const lapComparison = data.lapComparison as LapTimeDataPoint[];
    const driverCodes = Object.keys(lapComparison[0] || {}).filter((k) => k !== 'LapNumber');
    const maxLapNum = lapComparison.length;

    const list: DriverConsistency[] = driverCodes.map((driver) => {
      const times = lapComparison
        .map((point) => point[driver])
        .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

      const med = median(times);

      const lapDeltas = lapComparison
        .map((point) => ({
          lap: point.LapNumber,
          delta: typeof point[driver] === 'number' ? (point[driver] as number) - med : null,
        }))
        .filter((d): d is { lap: number; delta: number } => d.delta !== null);

      return { driver, median: med, lapDeltas };
    });

    const sorted = sortBy === 'consistency'
      ? list.sort((a, b) => {
          const aStd = stdDev(a.lapDeltas.map((d) => d.delta));
          const bStd = stdDev(b.lapDeltas.map((d) => d.delta));
          return aStd - bStd;
        })
      : list.sort((a, b) => a.driver.localeCompare(b.driver));

    return { drivers: sorted, maxLap: maxLapNum };
  }, [data, sortBy]);

  if (!isPro) {
    return (
      <div className={`${CARD_CONTAINER} flex flex-col items-center justify-center py-16`}>
        <LockKeyIcon className="mb-3 size-6 text-white/30" />
        <p className="text-[14px] font-medium text-white/60">Consistency Heatmap is a Pro feature</p>
        <p className="mt-1 max-w-xs text-center text-[12px] text-white/40">
          Visualize driver consistency lap by lap — spot who's pushing and who's managing pace
        </p>
        <Link
          to="/pricing"
          className="mt-4 inline-flex h-8 items-center rounded-lg bg-white/[0.08] px-4 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.14]"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${CARD_CONTAINER} flex h-[350px] items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/50" />
          <span className="text-[13px] text-white/50">Loading consistency data...</span>
        </div>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className={`${CARD_CONTAINER} flex h-[200px] items-center justify-center`}>
        <span className="text-[13px] text-white/50">No data available</span>
      </div>
    );
  }

  const allStdDevs = drivers.map((d) => stdDev(d.lapDeltas.map((ld) => ld.delta)));
  const maxStdDev = Math.max(...allStdDevs, 0.001);

  return (
    <div className={CARD_CONTAINER}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Consistency</h3>
          <p className="mt-0.5 text-[12px] text-white/40">
            Lap time deviation from each driver's median pace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('consistency')}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              sortBy === 'consistency' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/80'
            )}
          >
            By Consistency
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              sortBy === 'name' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/80'
            )}
          >
            By Name
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.04] px-5 pb-5 pt-3">
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col min-w-full">
            <div className="flex">
              <div className="w-[120px] shrink-0 pr-3">
                <span className="text-[10px] font-medium text-white/50">Driver</span>
              </div>
              <div className="flex gap-px">
                {Array.from({ length: maxLap }, (_, i) => (
                  <div key={i} className="flex w-[14px] items-end justify-center pb-0.5">
                    {(i === 0 || i === maxLap - 1 || i % 5 === 0) && (
                      <span className="text-[8px] text-white/30">{i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {drivers.map((driver) => {
              const std = stdDev(driver.lapDeltas.map((d) => d.delta));
              const isFocused = driver.driver === favoriteDriver;
              const isRival = driver.driver === rivalDriver;

              return (
                <div key={driver.driver} className="flex items-center mt-0.5">
                  <div className="w-[120px] shrink-0 flex items-center gap-1.5 pr-3">
                    <span className={cn(
                      'text-[11px] font-medium truncate',
                      isFocused ? 'text-white' : 'text-white/70'
                    )}>
                      {driver.driver}
                    </span>
                    {isFocused && <span className="shrink-0 text-[9px] text-red-400/70">★</span>}
                    {isRival && !isFocused && <span className="shrink-0 text-[9px] text-blue-400/70">◈</span>}
                  </div>
                  <div className="flex gap-px">
                    {Array.from({ length: maxLap }, (_, i) => {
                      const lap = i + 1;
                      const delta = driver.lapDeltas.find((d) => d.lap === lap)?.delta;
                      if (delta === undefined || delta === null) {
                        return <div key={i} className="h-[18px] w-[14px] rounded-[1px] bg-white/[0.02]" />;
                      }

                      const intensity = Math.min(Math.abs(delta) / (maxStdDev * 2), 1);
                      const isFast = delta < -0.05;
                      const isSlow = delta > 0.05;

                      let r: number, g: number, b: number;
                      if (isFast) {
                        r = 34; g = Math.round(197 - intensity * 140); b = Math.round(94 - intensity * 60);
                      } else if (isSlow) {
                        r = Math.round(220 - intensity * 100); g = 38; b = 38;
                      } else {
                        r = 60; g = 60; b = 60;
                      }

                      return (
                        <div
                          key={i}
                          className="h-[18px] w-[14px] rounded-[1px]"
                          style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                          title={`${driver.driver} L${lap}: ${delta > 0 ? '+' : ''}${delta.toFixed(3)}s`}
                        />
                      );
                    })}
                  </div>
                  <div className="ml-3 shrink-0">
                    <span className="text-[10px] tabular-nums text-white/40">σ {std.toFixed(2)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-white/[0.04] pt-3">
          <span className="text-[10px] text-white/50">Faster</span>
          <div className="flex items-center gap-0.5">
            <div className="h-3 w-4 rounded-[1px]" style={{ backgroundColor: 'rgb(34,197,94)' }} />
            <div className="h-3 w-4 rounded-[1px]" style={{ backgroundColor: 'rgb(34,170,90)' }} />
            <div className="h-3 w-4 rounded-[1px]" style={{ backgroundColor: 'rgb(34,140,80)' }} />
          </div>
          <span className="text-[10px] text-white/50">Median</span>
          <div className="h-3 w-4 rounded-[1px]" style={{ backgroundColor: 'rgb(60,60,60)' }} />
          <span className="text-[10px] text-white/50">Slower</span>
          <div className="flex items-center gap-0.5">
            <div className="h-3 w-4 rounded-[1px]" style={{ backgroundColor: 'rgb(180,38,38)' }} />
            <div className="h-3 w-4 rounded-[1px]" style={{ backgroundColor: 'rgb(200,38,38)' }} />
            <div className="h-3 w-4 rounded-[1px]" style={{ backgroundColor: 'rgb(220,38,38)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
