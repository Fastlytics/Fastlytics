import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLapTimes, LapTimesEnrichedResponse, EnrichedLapRecord } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';
import { AlertCircleIcon } from 'hugeicons-react';

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#ff2800',
  MEDIUM: '#ffcc00',
  HARD: '#ffffff',
  INTERMEDIATE: '#43b02a',
  WET: '#0067ad',
};

const COMPOUND_BG: Record<string, string> = {
  SOFT: 'bg-[#ff2800]',
  MEDIUM: 'bg-[#ffcc00]',
  HARD: 'bg-white',
  INTERMEDIATE: 'bg-[#43b02a]',
  WET: 'bg-[#0067ad]',
};

const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) return 'N/A';
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
        const validTimes = laps
          .filter((l) => l.lapTime != null && !l.deleted)
          .map((l) => l.lapTime!);
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
      (driverLapDetails[drv] || []).filter((l) => l.deleted).map((l) => ({ driver: drv, ...l }))
    );
  }, [driverLapDetails, drivers]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
        <div className="mb-6">
          <p
            className="text-[12px] font-semibold uppercase tracking-wider text-white/80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Comparison
          </p>
          <p
            className="mt-0.5 text-[18px] font-bold uppercase italic text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Race Performance
          </p>
        </div>
        <div className="flex h-[200px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="size-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
            <p
              className="text-[12px] text-white animate-pulse"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Loading performance data…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !driverLapDetails) return null;

  return (
    <div className="space-y-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Weather Strip */}
      {weatherData && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-t-xl border border-b-0 border-white/[0.06] bg-[#0c0c0e] px-5 py-3">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider text-white/80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Conditions
          </span>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="text-white">Air</span>
            <span className="font-semibold text-white">{weatherData.airTemp.toFixed(1)}°C</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="text-white">Track</span>
            <span className="font-semibold text-white">{weatherData.trackTemp.toFixed(1)}°C</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="text-white">Humidity</span>
            <span className="font-semibold text-white">{weatherData.humidity.toFixed(0)}%</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="text-white">Wind</span>
            <span className="font-semibold text-white">{weatherData.windSpeed.toFixed(1)} m/s</span>
          </div>
          {weatherData.rainfall && (
            <span
              className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              RAIN
            </span>
          )}
        </div>
      )}

      {/* Strategy Timeline */}
      <div className="border-x border-white/[0.06] bg-[#0c0c0e] px-5 py-5">
        <p
          className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-white/80"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Strategy
        </p>
        {drivers.map((drv, drvIdx) => {
          const stints = driverStints[drv] || [];
          const drvColor = driverColor(drv, year);
          const headshot = getDriverImage(drv, year);
          return (
            <div
              key={drv}
              className={`${drvIdx > 0 ? 'mt-4' : ''} animate-in fade-in slide-in-from-left-2 duration-500`}
              style={{ animationDelay: `${drvIdx * 150}ms` }}
            >
              <div className="mb-2 flex items-center gap-2.5">
                <Avatar className="size-7 shrink-0 border-2" style={{ borderColor: drvColor }}>
                  <AvatarImage src={headshot} className="object-cover object-top" />
                  <AvatarFallback
                    className="bg-[#1a1a1e] text-[10px] font-bold text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {drv}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="text-[13px] font-bold uppercase tracking-wide"
                  style={{ color: drvColor, fontFamily: "'Inter', sans-serif" }}
                >
                  {drv}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {stints.map((stint, stintIdx) => (
                  <div
                    key={stint.stintNum}
                    className="group flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
                    style={{ animationDelay: `${drvIdx * 150 + stintIdx * 80}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-7 w-11 items-center justify-center rounded-md ${COMPOUND_BG[stint.compound] || 'bg-white/30'}`}
                      >
                        <span
                          className="text-[11px] font-bold uppercase text-black"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {stint.compound[0]}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-[13px] font-bold text-white"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          L{stint.startLap}–{stint.endLap}
                        </span>
                        <span
                          className="text-[11px] text-white"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {stint.lapCount} laps
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="hidden sm:flex flex-col items-end gap-0.5">
                        {stint.avgTime != null && (
                          <span
                            className="text-[12px] text-white"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Avg{' '}
                            <span className="font-semibold text-white">
                              {formatLapTime(stint.avgTime)}
                            </span>
                          </span>
                        )}
                        {stint.bestTime != null && (
                          <span
                            className="text-[11px] text-white"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Best <span className="text-white">{formatLapTime(stint.bestTime)}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-[64px] flex-col items-end gap-0.5">
                        <span
                          className={`text-[10px] font-semibold uppercase ${
                            stint.freshTyre ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {stint.freshTyre ? '● NEW' : '● USED'}
                        </span>
                        {stint.tyreLifeEnd != null && (
                          <span
                            className="text-[10px] text-white"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Life {stint.tyreLifeEnd}
                          </span>
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

      {/* Deleted Laps */}
      {deletedLaps.length > 0 && (
        <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e] px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircleIcon className="size-3.5 text-red-400/60" />
            <p
              className="text-[12px] font-semibold uppercase tracking-wider text-white/80"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Deleted Laps ({deletedLaps.length})
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {deletedLaps.slice(0, 10).map((dl, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.02]"
              >
                <span
                  className="w-10 text-[12px] font-bold uppercase"
                  style={{ color: driverColor(dl.driver, year), fontFamily: "'Inter', sans-serif" }}
                >
                  {dl.driver}
                </span>
                <span
                  className="text-[12px] text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Lap {dl.lapNumber}
                </span>
                {dl.lapTime != null && (
                  <span
                    className="text-[12px] text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {formatLapTime(dl.lapTime)}
                  </span>
                )}
                {dl.deletedReason && (
                  <span
                    className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {dl.deletedReason}
                  </span>
                )}
              </div>
            ))}
            {deletedLaps.length > 10 && (
              <span
                className="px-2 text-[11px] text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
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
