import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchLapTimes,
  fetchSessionDrivers,
  LapTimesEnrichedResponse,
  EnrichedLapRecord,
  SessionDriver,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { cn } from '@/lib/utils';

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFC107',
  HARD: '#EEEEEE',
  INTERMEDIATE: '#4CAF50',
  WET: '#2196F3',
};

const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) return '—';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

interface StintInfo {
  stintNum: number;
  compound: string;
  startLap: number;
  endLap: number;
  lapCount: number;
  avgTime: number | null;
  bestTime: number | null;
  tyreLifeEnd: number | null;
  freshTyre: boolean | null;
}

interface HeadToHeadEnrichedProps {
  year: number;
  event: string;
  session: string;
  driver1: string;
  driver2: string;
}

const HeadToHeadEnriched: React.FC<HeadToHeadEnrichedProps> = ({
  year,
  event,
  session,
  driver1,
  driver2,
}) => {
  const drivers = useMemo(() => [driver1, driver2], [driver1, driver2]);

  const {
    data: enrichedResponse,
    isLoading,
    isError,
  } = useQuery<LapTimesEnrichedResponse>({
    queryKey: ['lapTimes', year, event, session, ...[driver1, driver2].sort()],
    queryFn: () => fetchLapTimes(year, event, session, [driver1, driver2]),
    staleTime: 1000 * 60 * 5,
    enabled: !!driver1 && !!driver2 && driver1 !== driver2,
  });

  const driverLapDetails = enrichedResponse?.driverLapDetails;
  const weatherData = enrichedResponse?.weather;

  const { data: sessionDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
  });

  const driverNameMap = useMemo(() => {
    if (!sessionDrivers) return new Map<string, string>();
    const map = new Map<string, string>();
    sessionDrivers.forEach((d) => {
      if (d.code && d.name) map.set(d.code, d.name);
    });
    return map;
  }, [sessionDrivers]);

  const driverStints = useMemo(() => {
    if (!driverLapDetails) return {} as Record<string, StintInfo[]>;
    const result: Record<string, StintInfo[]> = {};

    drivers.forEach((drv) => {
      const records = driverLapDetails[drv] || [];
      const stintMap = new Map<number, EnrichedLapRecord[]>();
      records.forEach((r) => {
        if (r.stint != null) {
          if (!stintMap.has(r.stint)) stintMap.set(r.stint, []);
          stintMap.get(r.stint)!.push(r);
        }
      });

      result[drv] = Array.from(stintMap.entries()).map(([stintNum, laps]) => {
        const validTimes = laps.flatMap((l) =>
          l.lapTime != null && !l.deleted ? [l.lapTime!] : []
        );
        return {
          stintNum,
          compound: laps[0]?.compound || '?',
          startLap: laps[0]?.lapNumber || 0,
          endLap: laps[laps.length - 1]?.lapNumber || 0,
          lapCount: laps.length,
          avgTime:
            validTimes.length > 0
              ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
              : null,
          bestTime: validTimes.length > 0 ? Math.min(...validTimes) : null,
          tyreLifeEnd: laps[laps.length - 1]?.tyreLife ?? null,
          freshTyre: laps[0]?.freshTyre ?? null,
        };
      });
    });

    return result;
  }, [driverLapDetails, drivers]);

  const deletedLaps = useMemo(() => {
    if (!driverLapDetails) return [];
    return drivers.flatMap((drv) =>
      (driverLapDetails[drv] || []).flatMap((l) => (l.deleted ? [{ driver: drv, ...l }] : []))
    );
  }, [driverLapDetails, drivers]);

  if (isLoading) {
    return (
      <div className={CARD_CONTAINER}>
        <div className="border-b border-white/[0.04] px-5 py-4">
          <h3 className="text-[14px] font-semibold text-white">Race Performance</h3>
        </div>
        <div className="flex h-[200px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-5 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/50" />
            <span className="text-[14px] text-white">Loading performance data</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !driverLapDetails) return null;

  return (
    <div className={CARD_CONTAINER}>
      {/* Header */}
      <div className="border-b border-white/[0.04] px-5 py-4">
        <h3 className="text-[14px] font-semibold text-white">Race Performance</h3>
      </div>

      {/* Weather conditions */}
      {weatherData && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/[0.04] px-5 py-3">
          <span className="text-[12px] font-medium text-white/60">Conditions</span>
          <span className="text-[13px] text-white">
            Air <span className="font-mono tabular-nums">{weatherData.airTemp.toFixed(1)}°C</span>
          </span>
          <span className="text-[13px] text-white">
            Track{' '}
            <span className="font-mono tabular-nums">{weatherData.trackTemp.toFixed(1)}°C</span>
          </span>
          <span className="text-[13px] text-white">
            Humidity{' '}
            <span className="font-mono tabular-nums">{weatherData.humidity.toFixed(0)}%</span>
          </span>
          <span className="text-[13px] text-white">
            Wind{' '}
            <span className="font-mono tabular-nums">{weatherData.windSpeed.toFixed(1)} m/s</span>
          </span>
          {weatherData.rainfall && (
            <span className="text-[13px] font-medium text-blue-400">Rain</span>
          )}
        </div>
      )}

      {/* Strategy comparison */}
      <div className="p-5 space-y-5">
        {drivers.map((drv) => {
          const stints = driverStints[drv] || [];
          const drvColor = driverColor(drv, year);
          const headshot = getDriverImage(drv, year);

          return (
            <div key={drv}>
              {/* Driver header */}
              <div className="mb-3 flex items-center gap-2.5">
                <img
                  src={headshot}
                  alt=""
                  className="size-9 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                />
                <span className="text-[14px] font-semibold text-white">
                  {driverNameMap.get(drv) || drv}
                </span>
                <span className="text-[13px] text-white/60">{stints.length} stints</span>
              </div>

              {/* Stint rows */}
              <div className="space-y-1.5">
                {stints.map((stint) => (
                  <div
                    key={stint.stintNum}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] px-4 py-3 transition-colors hover:border-white/[0.08]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Compound indicator */}
                      <div
                        className="flex h-6 w-10 items-center justify-center rounded"
                        style={{
                          backgroundColor: COMPOUND_COLORS[stint.compound?.toUpperCase()] || '#666',
                        }}
                      >
                        <span className="text-[10px] font-bold text-black">
                          {stint.compound?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-white">
                          Lap {stint.startLap}–{stint.endLap}
                        </div>
                        <div className="text-[12px] text-white">{stint.lapCount} laps</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      {/* Avg / Best times */}
                      <div className="hidden text-right sm:block">
                        {stint.avgTime != null && (
                          <div className="text-[13px] text-white">
                            Avg{' '}
                            <span className="font-mono tabular-nums font-medium text-white">
                              {formatLapTime(stint.avgTime)}
                            </span>
                          </div>
                        )}
                        {stint.bestTime != null && (
                          <div className="text-[12px] text-white">
                            Best{' '}
                            <span className="font-mono tabular-nums text-white">
                              {formatLapTime(stint.bestTime)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tyre state */}
                      <div className="text-right">
                        <div
                          className={cn(
                            'text-[12px] font-medium',
                            stint.freshTyre ? 'text-emerald-400' : 'text-amber-400'
                          )}
                        >
                          {stint.freshTyre ? 'New' : 'Used'}
                        </div>
                        {stint.tyreLifeEnd != null && (
                          <div className="text-[12px] text-white">Life {stint.tyreLifeEnd}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deleted laps */}
      {deletedLaps.length > 0 && (
        <div className="border-t border-white/[0.04] px-5 py-4">
          <div className="mb-3 text-[13px] font-medium text-white">
            Deleted laps ({deletedLaps.length})
          </div>
          <div className="divide-y divide-white/[0.03]">
            {deletedLaps.slice(0, 10).map((dl, i) => (
              <div
                key={`${dl.driver}-${dl.lapNumber}-${i}`}
                className="flex items-center gap-3 py-2.5 text-[13px]"
              >
                <span
                  className="w-10 shrink-0 font-semibold"
                  style={{ color: driverColor(dl.driver, year) }}
                >
                  {dl.driver}
                </span>
                <span className="text-white">Lap {dl.lapNumber}</span>
                {dl.lapTime != null && (
                  <span className="font-mono tabular-nums text-white">
                    {formatLapTime(dl.lapTime)}
                  </span>
                )}
                {dl.deletedReason && (
                  <span className="ml-auto text-[12px] font-medium text-red-400">
                    {dl.deletedReason}
                  </span>
                )}
              </div>
            ))}
            {deletedLaps.length > 10 && (
              <div className="py-2.5 text-[13px] text-white">+{deletedLaps.length - 10} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { HeadToHeadEnriched };
export default HeadToHeadEnriched;
