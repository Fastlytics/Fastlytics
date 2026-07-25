import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLapTimes, type EnrichedLapRecord } from '@/lib/api';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { useAuth } from '@/contexts/AuthContext';
import { driverColor } from '@/lib/driverColor';
import { areTeammates } from '@/lib/teamUtils';
import { LockKeyIcon } from 'hugeicons-react';
import { Link } from 'react-router-dom';

interface SectorDeltaChartProps {
  year: number;
  event: string;
  session: string;
  driver1: string;
  driver2: string;
}

interface SectorDeltaRow {
  lap: number;
  s1: number;
  s2: number;
  s3: number;
  total: number;
}

function formatDelta(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(3)}s`;
}

export function SectorDeltaChart({ year, event, session, driver1, driver2 }: SectorDeltaChartProps) {
  const { user, isSubscribed } = useAuth();
  const isPro = user && isSubscribed('pro');

  const { data, isLoading } = useQuery({
    queryKey: ['sectorDelta', year, event, session, driver1, driver2],
    queryFn: () => fetchLapTimes(year, event, session, [driver1, driver2]),
    enabled: !!driver1 && !!driver2 && !!year && !!event && !!session,
    staleTime: 1000 * 60 * 10,
  });

  const color1 = driverColor(driver1, year);
  let color2 = driverColor(driver2, year);
  if (areTeammates(driver1, driver2, year)) {
    color2 = '#FFFFFF';
  }

  const chartData = useMemo(() => {
    if (!data?.driverLapDetails) return [] as SectorDeltaRow[];
    const d1Laps = data.driverLapDetails[driver1] ?? [];
    const d2Laps = data.driverLapDetails[driver2] ?? [];
    const d2Map = new Map<number, EnrichedLapRecord>();
    for (const lap of d2Laps) {
      if (lap.lapNumber != null) d2Map.set(lap.lapNumber, lap);
    }
    const result: SectorDeltaRow[] = [];
    for (const d1Lap of d1Laps) {
      const d2Lap = d1Lap.lapNumber != null ? d2Map.get(d1Lap.lapNumber) : undefined;
      if (!d2Lap || d1Lap.lapNumber == null) continue;
      result.push({
        lap: d1Lap.lapNumber,
        s1: (d1Lap.sector1 ?? 0) - (d2Lap.sector1 ?? 0),
        s2: (d1Lap.sector2 ?? 0) - (d2Lap.sector2 ?? 0),
        s3: (d1Lap.sector3 ?? 0) - (d2Lap.sector3 ?? 0),
        total:
          (d1Lap.sector1 ?? 0) - (d2Lap.sector1 ?? 0) +
          (d1Lap.sector2 ?? 0) - (d2Lap.sector2 ?? 0) +
          (d1Lap.sector3 ?? 0) - (d2Lap.sector3 ?? 0),
      });
    }
    return result;
  }, [data, driver1, driver2]);

  if (isLoading) {
    return (
      <div className={CARD_CONTAINER}>
        <div className="flex h-[280px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-4 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/50" />
            <span className="text-[13px] text-white/50">Loading sector deltas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={CARD_CONTAINER}>
        <div className="flex h-[200px] items-center justify-center">
          <span className="text-[13px] text-white/50">No common lap data for sector comparison</span>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className={CARD_CONTAINER}>
        <div className="flex flex-col items-center justify-center py-10">
          <LockKeyIcon className="mb-2 size-5 text-white/30" />
          <p className="text-[13px] font-medium text-white/60">Sector Delta Chart is a Pro feature</p>
          <p className="mt-1 text-[11px] text-white/40">See where each driver gains or loses time across sectors</p>
          <Link to="/pricing" className="mt-3 inline-flex h-7 items-center rounded-md bg-white/[0.08] px-3 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.14]">
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const maxAbs = Math.max(...chartData.map((d) => Math.max(Math.abs(d.s1), Math.abs(d.s2), Math.abs(d.s3))), 0.1);

  return (
    <div className={CARD_CONTAINER}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Sector Delta</h3>
          <p className="mt-0.5 text-[12px] text-white/40">
            Where {driver1} gains or loses time against {driver2} per lap
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-white/60">
            <span className="size-2 rounded-sm" style={{ backgroundColor: color1 }} />
            {driver1}
          </span>
          <span className="flex items-center gap-1 text-white/60">
            <span className="size-2 rounded-sm" style={{ backgroundColor: color2 }} />
            {driver2}
          </span>
        </div>
      </div>

      <div className="border-t border-white/[0.04] px-5 pb-5 pt-3">
        {/* Center zero line */}
        <div className="flex items-end text-[8px] text-white/30 mb-1">
          <span className="w-0 h-4 border-l border-dashed border-white/[0.10]" />
        </div>

        {/* Scale axis */}
        <div className="flex items-center mb-2 text-[9px] text-white/30">
          <span>{formatDelta(-maxAbs)}</span>
          <div className="flex-1" />
          <span>0</span>
          <div className="flex-1" />
          <span>{formatDelta(maxAbs)}</span>
        </div>

        <div className="overflow-y-auto max-h-[400px]" style={{ direction: 'rtl' }}>
          <div style={{ direction: 'ltr' }}>
            {chartData.map((row) => {
              const pctS1 = (Math.abs(row.s1) / maxAbs) * 100;
              const pctS2 = (Math.abs(row.s2) / maxAbs) * 100;
              const pctS3 = (Math.abs(row.s3) / maxAbs) * 100;
              const totalPct = (Math.abs(row.total) / maxAbs) * 100;

              return (
                <div key={row.lap} className="flex items-center gap-1 group mb-0.5">
                  <span className="w-8 shrink-0 text-right text-[10px] font-medium text-white/50">
                    L{row.lap}
                  </span>

                  <div className="flex-1 relative h-5 flex items-center">
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06]" />

                    {/* Negative side bars (driver2 faster) */}
                    {row.total < 0 && (
                      <div className="absolute right-1/2 flex items-center gap-px justify-end h-full" style={{ width: `${Math.min(totalPct / 2, 50)}%` }}>
                        {row.s1 < 0 && <BarSegment pct={pctS1} color={color2} height="70%" />}
                        {row.s2 < 0 && <BarSegment pct={pctS2} color={color2} height="50%" />}
                        {row.s3 < 0 && <BarSegment pct={pctS3} color={color2} height="30%" />}
                      </div>
                    )}
                    {row.total === 0 && (
                      <>
                        {row.s1 < 0 && (
                          <div className="absolute right-1/2 flex items-center gap-px justify-end h-full" style={{ width: `${Math.min(pctS1 / 2, 50)}%` }}>
                            <BarSegment pct={pctS1} color={color2} height="70%" />
                          </div>
                        )}
                        {row.s2 < 0 && (
                          <div className="absolute right-1/2 flex items-center gap-px justify-end h-full" style={{ width: `${Math.min(pctS2 / 2, 50)}%` }}>
                            <BarSegment pct={pctS2} color={color2} height="50%" />
                          </div>
                        )}
                        {row.s3 < 0 && (
                          <div className="absolute right-1/2 flex items-center gap-px justify-end h-full" style={{ width: `${Math.min(pctS3 / 2, 50)}%` }}>
                            <BarSegment pct={pctS3} color={color2} height="30%" />
                          </div>
                        )}
                      </>
                    )}

                    {/* Positive side bars (driver1 faster) */}
                    {row.total > 0 && (
                      <div className="absolute left-1/2 flex items-center gap-px h-full" style={{ width: `${Math.min(totalPct / 2, 50)}%` }}>
                        {row.s1 > 0 && <BarSegment pct={pctS1} color={color1} height="70%" />}
                        {row.s2 > 0 && <BarSegment pct={pctS2} color={color1} height="50%" />}
                        {row.s3 > 0 && <BarSegment pct={pctS3} color={color1} height="30%" />}
                      </div>
                    )}
                    {row.total === 0 && (
                      <>
                        {row.s1 > 0 && (
                          <div className="absolute left-1/2 flex items-center gap-px h-full" style={{ width: `${Math.min(pctS1 / 2, 50)}%` }}>
                            <BarSegment pct={pctS1} color={color1} height="70%" />
                          </div>
                        )}
                        {row.s2 > 0 && (
                          <div className="absolute left-1/2 flex items-center gap-px h-full" style={{ width: `${Math.min(pctS2 / 2, 50)}%` }}>
                            <BarSegment pct={pctS2} color={color1} height="50%" />
                          </div>
                        )}
                        {row.s3 > 0 && (
                          <div className="absolute left-1/2 flex items-center gap-px h-full" style={{ width: `${Math.min(pctS3 / 2, 50)}%` }}>
                            <BarSegment pct={pctS3} color={color1} height="30%" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <span className="w-16 shrink-0 text-left text-[10px] tabular-nums text-white/50 group-hover:text-white/80">
                    {formatDelta(row.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 border-t border-white/[0.04] pt-2 flex items-center gap-3">
          <span className="text-[10px] text-white/50">
            Left = {driver2} faster. Right = {driver1} faster.
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/40">
            <span className="w-6 h-1.5 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
            S1 (thick)
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/40">
            <span className="w-6 h-1 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
            S2
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/40">
            <span className="w-6 h-0.5 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
            S3
          </span>
        </div>
      </div>
    </div>
  );
}

function BarSegment({ pct, color, height }: { pct: number; color: string; height: string }) {
  const minVisiblePct = Math.max(pct, 1.5);
  return (
    <div
      className="rounded-r-[2px] shrink-0"
      style={{
        width: `${minVisiblePct}%`,
        height,
        backgroundColor: color,
        opacity: 0.85,
      }}
      title={`${(pct / 100).toFixed(3)}s`}
    />
  );
}
