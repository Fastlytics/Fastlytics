import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLapTimes, LapTimesEnrichedResponse, EnrichedLapRecord } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { getDriverImage } from '@/utils/imageMapping';

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFC107',
  HARD: '#EEEEEE',
  INTERMEDIATE: '#4CAF50',
  WET: '#2196F3',
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

  const color1 = driverColor(driver1, year);
  const color2 = driverColor(driver2, year);

  // Compute stint info per driver
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

  // Deleted laps
  const deletedLaps = useMemo(() => {
    if (!driverLapDetails) return [];
    return drivers.flatMap((drv) =>
      (driverLapDetails[drv] || []).filter((l) => l.deleted).map((l) => ({ driver: drv, ...l }))
    );
  }, [driverLapDetails, drivers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinnerF1 />
      </div>
    );
  }
  if (isError || !driverLapDetails) return null;

  return (
    <div className="space-y-0">
      {/* Weather Strip */}
      {weatherData && (
        <div className="flex items-center gap-5 px-4 py-2 bg-black border border-gray-700 text-sm font-mono text-white font-black">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider mr-1">
            CONDITIONS
          </span>
          <span>
            AIR <span className="font-black">{weatherData.airTemp.toFixed(1)}°C</span>
          </span>
          <span>
            TRACK <span className="font-black">{weatherData.trackTemp.toFixed(1)}°C</span>
          </span>
          <span>
            HUM <span className="font-black">{weatherData.humidity.toFixed(0)}%</span>
          </span>
          <span>
            WIND <span className="font-black">{weatherData.windSpeed.toFixed(1)} m/s</span>
          </span>
          {weatherData.rainfall && <span className="text-blue-400 font-black">🌧 RAIN</span>}
        </div>
      )}

      {/* Strategy Timeline */}
      <div className="bg-black border-x border-gray-700 px-4 py-3">
        <h4 className="text-base font-black uppercase italic text-white mb-3">Tyre Strategy</h4>
        {drivers.map((drv, drvIdx) => {
          const stints = driverStints[drv] || [];
          const drvColor = driverColor(drv, year);
          const headshot = getDriverImage(drv, year);
          return (
            <div key={drv} className={drvIdx > 0 ? 'mt-2' : ''}>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-7 h-7 rounded-full bg-gray-800 overflow-hidden border-2 shrink-0"
                  style={{ borderColor: drvColor }}
                >
                  {headshot ? (
                    <img
                      src={headshot}
                      alt={drv}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-mono font-bold">
                      {drv[0]}
                    </div>
                  )}
                </div>
                <span className="text-sm font-mono font-black" style={{ color: drvColor }}>
                  {drv}
                </span>
              </div>
              <div className="flex flex-col gap-1 border border-gray-800 bg-gray-900/40 p-1 rounded-sm">
                {stints.map((stint) => (
                  <div
                    key={stint.stintNum}
                    className="flex justify-between items-center bg-black px-3 py-2 border border-gray-800 transition-colors hover:bg-gray-800/50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-6 flex items-center justify-center rounded-[3px] shadow-sm"
                        style={{ backgroundColor: COMPOUND_COLORS[stint.compound] || '#666' }}
                      >
                        <span className="text-black font-black text-xs uppercase tracking-wider">
                          {stint.compound[0]}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="text-sm text-white font-mono font-black">
                          L{stint.startLap}–{stint.endLap}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400 font-mono font-bold">
                          ({stint.lapCount} LAPS)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:flex flex-col items-end">
                        {stint.avgTime != null && (
                          <span className="text-xs font-mono text-gray-300">
                            Avg:{' '}
                            <span className="text-white font-black">
                              {formatLapTime(stint.avgTime)}
                            </span>
                          </span>
                        )}
                        {stint.bestTime != null && (
                          <span className="text-[10px] font-mono text-gray-500">
                            Best:{' '}
                            <span className="text-gray-300 font-bold">
                              {formatLapTime(stint.bestTime)}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end min-w-[70px]">
                        <span
                          className={`text-[10px] font-mono uppercase font-black ${
                            stint.freshTyre ? 'text-green-400' : 'text-yellow-400'
                          }`}
                        >
                          {stint.freshTyre ? '● NEW' : '● USED'}
                        </span>
                        {stint.tyreLifeEnd != null && (
                          <span className="text-[10px] font-mono text-gray-500 font-bold mt-0.5">
                            Life: {stint.tyreLifeEnd}
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
        <div className="bg-black border-x border-b border-gray-700 px-4 py-3">
          <h4 className="text-base font-black uppercase italic text-white mb-2">
            Deleted Laps ({deletedLaps.length})
          </h4>
          <div className="space-y-1">
            {deletedLaps.slice(0, 10).map((dl, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-mono font-bold">
                <span style={{ color: driverColor(dl.driver, year) }} className="font-black w-10">
                  {dl.driver}
                </span>
                <span className="text-white">Lap {dl.lapNumber}</span>
                {dl.lapTime != null && (
                  <span className="text-white">{formatLapTime(dl.lapTime)}</span>
                )}
                {dl.deletedReason && (
                  <span className="text-red-400 text-xs bg-red-500/15 px-2 py-0.5 font-bold">
                    {dl.deletedReason}
                  </span>
                )}
              </div>
            ))}
            {deletedLaps.length > 10 && (
              <span className="text-xs text-gray-400 font-bold">
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
