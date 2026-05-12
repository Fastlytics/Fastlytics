import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLapTimes, LapTimesEnrichedResponse, EnrichedLapRecord } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { cn } from '@/lib/utils';

const COMPOUND_BG: Record<string, string> = {
  SOFT: 'bg-red-600',
  MEDIUM: 'bg-yellow-400',
  HARD: 'bg-white',
  INTERMEDIATE: 'bg-emerald-500',
  WET: 'bg-blue-500',
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
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-[16px] font-semibold text-white">Race Performance</h3>
          <p className="mt-0.5 text-[12px] text-white/80">Strategy and stint comparison</p>
        </div>
        <div className="flex h-[200px] items-center justify-center border-t border-white/[0.04]">
          <div className="flex flex-col items-center gap-3">
            <div className="size-5 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/60" />
            <span className="text-[12px] text-white/80">Loading performance data</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !driverLapDetails) return null;

  return (
    <div className={CARD_CONTAINER}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-[16px] font-semibold text-white">Race Performance</h3>
        <p className="mt-0.5 text-[12px] text-white/80">Strategy and stint comparison</p>
      </div>

      {/* Weather conditions */}
      {weatherData && (
        <div className="grid grid-cols-2 divide-x divide-white/[0.04] border-y border-white/[0.04] lg:grid-cols-5">
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Air temp</div>
            <div className="mt-1 text-[14px] font-semibold text-white">
              {weatherData.airTemp.toFixed(1)}°C
            </div>
          </div>
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Track temp</div>
            <div className="mt-1 text-[14px] font-semibold text-white">
              {weatherData.trackTemp.toFixed(1)}°C
            </div>
          </div>
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Humidity</div>
            <div className="mt-1 text-[14px] font-semibold text-white">
              {weatherData.humidity.toFixed(0)}%
            </div>
          </div>
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Wind</div>
            <div className="mt-1 text-[14px] font-semibold text-white">
              {weatherData.windSpeed.toFixed(1)} m/s
            </div>
          </div>
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Conditions</div>
            <div className="mt-1 text-[14px] font-semibold text-white">
              {weatherData.rainfall ? <span className="text-blue-400">Wet</span> : 'Dry'}
            </div>
          </div>
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
                  className="size-8 shrink-0 rounded-full object-cover object-top"
                  style={{ borderWidth: 2, borderColor: drvColor, borderStyle: 'solid' }}
                />
                <span className="text-[14px] font-semibold text-white">{drv}</span>
                <span className="text-[12px] text-white/80">{stints.length} stints</span>
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
                        className={cn(
                          'flex h-6 w-10 items-center justify-center rounded',
                          COMPOUND_BG[stint.compound?.toUpperCase()] || 'bg-white/30'
                        )}
                      >
                        <span className="text-[10px] font-bold text-black">
                          {stint.compound?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-white">
                          Lap {stint.startLap}–{stint.endLap}
                        </div>
                        <div className="text-[11px] text-white/80">{stint.lapCount} laps</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      {/* Avg / Best times */}
                      <div className="hidden text-right sm:block">
                        {stint.avgTime != null && (
                          <div className="text-[12px] text-white/80">
                            Avg{' '}
                            <span className="font-medium text-white">
                              {formatLapTime(stint.avgTime)}
                            </span>
                          </div>
                        )}
                        {stint.bestTime != null && (
                          <div className="text-[11px] text-white/80">
                            Best <span className="text-white">{formatLapTime(stint.bestTime)}</span>
                          </div>
                        )}
                      </div>

                      {/* Tyre state */}
                      <div className="text-right">
                        <div
                          className={cn(
                            'text-[11px] font-medium',
                            stint.freshTyre ? 'text-emerald-400' : 'text-amber-400'
                          )}
                        >
                          {stint.freshTyre ? 'New' : 'Used'}
                        </div>
                        {stint.tyreLifeEnd != null && (
                          <div className="text-[11px] text-white/80">Life {stint.tyreLifeEnd}</div>
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
          <div className="mb-3">
            <span className={CARD_LABEL}>Deleted laps ({deletedLaps.length})</span>
          </div>
          <div className="space-y-1">
            {deletedLaps.slice(0, 10).map((dl, i) => (
              <div
                key={`${dl.driver}-${dl.lapNumber}-${i}`}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 text-[12px]"
              >
                <span
                  className="w-10 font-semibold"
                  style={{ color: driverColor(dl.driver, year) }}
                >
                  {dl.driver}
                </span>
                <span className="text-white/80">Lap {dl.lapNumber}</span>
                {dl.lapTime != null && (
                  <span className="text-white">{formatLapTime(dl.lapTime)}</span>
                )}
                {dl.deletedReason && (
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                    {dl.deletedReason}
                  </span>
                )}
              </div>
            ))}
            {deletedLaps.length > 10 && (
              <span className="px-2 text-[11px] text-white/80">
                +{deletedLaps.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { HeadToHeadEnriched };
export default HeadToHeadEnriched;
