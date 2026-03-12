import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
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

  // Total laps for strategy timeline width calc
  const totalLaps = useMemo(() => {
    if (!driverLapDetails) return 0;
    return Math.max(
      ...drivers.map((drv) => {
        const records = driverLapDetails[drv] || [];
        return records.length > 0 ? records[records.length - 1]?.lapNumber || 0 : 0;
      })
    );
  }, [driverLapDetails, drivers]);

  // Speed trap bar chart data
  const speedTrapData = useMemo(() => {
    if (!driverLapDetails) return [];
    return drivers
      .map((drv) => {
        const records = (driverLapDetails[drv] || []).filter((l) => l.speedST != null);
        if (records.length === 0) return null;
        const speeds = records.map((r) => r.speedST!);
        return {
          driver: drv,
          maxSpeed: Math.max(...speeds),
          avgSpeed: +(speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1),
          color: driverColor(drv, year),
        };
      })
      .filter(Boolean) as {
      driver: string;
      maxSpeed: number;
      avgSpeed: number;
      color: string;
    }[];
  }, [driverLapDetails, drivers, year]);

  // Pace comparison line chart data
  const paceData = useMemo(() => {
    if (!driverLapDetails) return [];
    const maxLap = Math.max(
      ...drivers.flatMap((drv) => (driverLapDetails[drv] || []).map((l) => l.lapNumber)),
      0
    );
    const data: Record<string, unknown>[] = [];
    for (let lap = 1; lap <= maxLap; lap++) {
      const point: Record<string, unknown> = { LapNumber: lap };
      drivers.forEach((drv) => {
        const record = (driverLapDetails[drv] || []).find((l) => l.lapNumber === lap);
        point[drv] = record && record.lapTime != null && !record.deleted ? record.lapTime : null;
      });
      data.push(point);
    }
    return data;
  }, [driverLapDetails, drivers]);

  // Deleted laps
  const deletedLaps = useMemo(() => {
    if (!driverLapDetails) return [];
    return drivers.flatMap((drv) =>
      (driverLapDetails[drv] || []).filter((l) => l.deleted).map((l) => ({ driver: drv, ...l }))
    );
  }, [driverLapDetails, drivers]);

  // Active lap for click-to-inspect
  const [activeLap, setActiveLap] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin" />
          <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider animate-pulse">Loading head-to-head...</span>
        </div>
      </div>
    );
  }
  if (isError || !driverLapDetails) return null;

  // Active lap detail
  const activeLapDetails = activeLap
    ? drivers.map((drv) => ({
        driver: drv,
        record: (driverLapDetails[drv] || []).find((l) => l.lapNumber === activeLap),
      }))
    : null;

  return (
    <div className="space-y-0">
      {/* Weather Strip */}
      {weatherData && (
        <div className="flex items-center gap-5 px-4 py-2.5 bg-neutral-900/30 border border-neutral-800/40 rounded-lg text-xs font-mono text-neutral-300">
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mr-1">
            Conditions
          </span>
          <span>
            AIR <span className="font-bold text-white">{weatherData.airTemp.toFixed(1)}°C</span>
          </span>
          <span>
            TRACK <span className="font-bold text-white">{weatherData.trackTemp.toFixed(1)}°C</span>
          </span>
          <span>
            HUM <span className="font-bold text-white">{weatherData.humidity.toFixed(0)}%</span>
          </span>
          <span>
            WIND <span className="font-bold text-white">{weatherData.windSpeed.toFixed(1)} m/s</span>
          </span>
          {weatherData.rainfall && <span className="text-blue-400 font-bold">🌧️ RAIN</span>}
        </div>
      )}

      {/* Strategy Timeline */}
      <div className="px-4 py-4">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Tyre Strategy</h4>
        {drivers.map((drv, drvIdx) => {
          const stints = driverStints[drv] || [];
          const drvColor = driverColor(drv, year);
          const headshot = getDriverImage(drv, year);
          return (
            <div key={drv} className={drvIdx > 0 ? 'mt-2' : ''}>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-7 h-7 rounded-full bg-neutral-800 overflow-hidden border-2 shrink-0"
                  style={{ borderColor: drvColor }}
                >
                  {headshot ? (
                    <img
                      src={headshot}
                      alt={drv}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-mono font-bold">
                      {drv[0]}
                    </div>
                  )}
                </div>
                <span className="text-sm font-mono font-black" style={{ color: drvColor }}>
                  {drv}
                </span>
              </div>
              <div className="flex flex-col gap-1 border border-neutral-800/40 bg-neutral-900/20 p-1.5 rounded-lg">
                {stints.map((stint) => (
                  <div
                    key={stint.stintNum}
                    className="flex justify-between items-center bg-neutral-950/50 px-3 py-2 border border-neutral-800/30 rounded-md transition-colors hover:bg-neutral-800/30 group"
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
                        <span className="text-[10px] sm:text-xs text-neutral-400 font-mono font-bold">
                          ({stint.lapCount} LAPS)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:flex flex-col items-end">
                        {stint.avgTime != null && (
                          <span className="text-xs font-mono text-neutral-300">
                            Avg:{' '}
                            <span className="text-white font-black">
                              {formatLapTime(stint.avgTime)}
                            </span>
                          </span>
                        )}
                        {stint.bestTime != null && (
                          <span className="text-[10px] font-mono text-neutral-500">
                            Best:{' '}
                            <span className="text-neutral-300 font-bold">
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
                          <span className="text-[10px] font-mono text-neutral-500 font-bold mt-0.5">
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

      {/* Race Pace — interactive */}
      {paceData.length > 0 && (
        <div className="px-4 py-4">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Race Pace</h4>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={paceData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              onClick={(e) => {
                if (e?.activeLabel != null) setActiveLap(Number(e.activeLabel));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
              <XAxis
                dataKey="LapNumber"
                stroke="#333"
                tick={{ fill: '#888', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono' }}
              />
              <YAxis
                stroke="#333"
                tick={{ fill: '#888', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono' }}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tickFormatter={(v: number) => formatLapTime(v)}
                width={70}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const lapNum = label as number;
                  return (
                    <div className="bg-neutral-950/95 backdrop-blur-xl border border-neutral-700/40 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[220px]">
                      <div className="text-white font-semibold text-xs mb-2.5 border-b border-neutral-800/50 pb-2 font-mono uppercase tracking-wider">
                        Lap {lapNum}
                      </div>
                      {payload.map((entry) => {
                        const drv = String(entry.name);
                        const time = entry.value as number | null;
                        if (time == null) return null;
                        const detail = driverLapDetails?.[drv]?.find((l) => l.lapNumber === lapNum);
                        return (
                          <div key={drv} className="mb-1.5 last:mb-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-black font-mono"
                                style={{ color: entry.color }}
                              >
                                {drv}
                              </span>
                              <span className="text-sm font-black font-mono text-white">
                                {formatLapTime(time)}
                              </span>
                              {detail?.compound && (
                                <span
                                  className="text-xs font-black px-1.5 py-0.5 rounded-sm"
                                  style={{
                                    backgroundColor:
                                      (COMPOUND_COLORS[detail.compound] || '#666') + '33',
                                    color: COMPOUND_COLORS[detail.compound] || '#FFF',
                                  }}
                                >
                                  {detail.compound[0]}
                                </span>
                              )}
                              {detail?.tyreLife != null && (
                                <span className="text-xs font-bold text-neutral-300 font-mono">
                                  L{detail.tyreLife}
                                </span>
                              )}
                              {detail?.position != null && (
                                <span className="text-xs font-bold text-neutral-400 font-mono">
                                  P{detail.position}
                                </span>
                              )}
                              {detail?.isPersonalBest && (
                                <span className="text-xs font-black text-green-400">PB</span>
                              )}
                              {detail?.deleted && (
                                <span className="text-xs font-black text-red-400">DEL</span>
                              )}
                            </div>
                            {detail &&
                              (detail.sector1 != null ||
                                detail.sector2 != null ||
                                detail.sector3 != null) && (
                                <div className="flex gap-3 ml-0 mt-0.5">
                                  {detail.sector1 != null && (
                                    <span className="text-xs font-mono text-neutral-300 font-bold">
                                      S1 {detail.sector1.toFixed(3)}
                                    </span>
                                  )}
                                  {detail.sector2 != null && (
                                    <span className="text-xs font-mono text-neutral-300 font-bold">
                                      S2 {detail.sector2.toFixed(3)}
                                    </span>
                                  )}
                                  {detail.sector3 != null && (
                                    <span className="text-xs font-mono text-neutral-300 font-bold">
                                      S3 {detail.sector3.toFixed(3)}
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {activeLap && (
                <ReferenceLine
                  x={activeLap}
                  stroke="#FF0000"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
              <Line
                type="monotone"
                dataKey={driver1}
                stroke={color1}
                dot={false}
                strokeWidth={2.5}
                connectNulls
                name={driver1}
                activeDot={{ r: 5, strokeWidth: 0, fill: color1 }}
              />
              <Line
                type="monotone"
                dataKey={driver2}
                stroke={color2}
                dot={false}
                strokeWidth={2.5}
                connectNulls
                name={driver2}
                activeDot={{ r: 5, strokeWidth: 0, fill: color2 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Click-to-inspect detail */}
          {activeLap && activeLapDetails && (
            <div className="mt-0 bg-neutral-950/80 border border-neutral-800/40 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-300 font-mono uppercase tracking-wider">
                  Lap {activeLap} Detail
                </span>
                <button
                  onClick={() => setActiveLap(null)}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-white transition uppercase"
                >
                  Close ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {activeLapDetails.map(({ driver, record }) => {
                  const drvColor = driverColor(driver, year);
                  return (
                    <div key={driver} className="border border-neutral-800/40 p-3 bg-neutral-900/20 rounded-lg">
                      <div
                        className="text-sm font-black font-mono mb-1.5"
                        style={{ color: drvColor }}
                      >
                        {driver}
                      </div>
                      {record ? (
                        <div className="space-y-1">
                          <div className="text-base font-black text-white font-mono">
                            {formatLapTime(record.lapTime)}
                          </div>
                          <div className="flex gap-3">
                            {record.sector1 != null && (
                              <span className="text-sm font-mono text-white font-bold">
                                S1 {record.sector1.toFixed(3)}
                              </span>
                            )}
                            {record.sector2 != null && (
                              <span className="text-sm font-mono text-white font-bold">
                                S2 {record.sector2.toFixed(3)}
                              </span>
                            )}
                            {record.sector3 != null && (
                              <span className="text-sm font-mono text-white font-bold">
                                S3 {record.sector3.toFixed(3)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {record.compound && (
                              <span
                                className="text-xs font-black px-1.5 py-0.5 rounded-sm"
                                style={{
                                  backgroundColor:
                                    (COMPOUND_COLORS[record.compound] || '#666') + '33',
                                  color: COMPOUND_COLORS[record.compound] || '#FFF',
                                }}
                              >
                                {record.compound}
                              </span>
                            )}
                            {record.tyreLife != null && (
                              <span className="text-sm font-bold text-white font-mono">
                                Tyre L{record.tyreLife}
                              </span>
                            )}
                            {record.position != null && (
                              <span className="text-sm font-bold text-white font-mono">
                                P{record.position}
                              </span>
                            )}
                            {record.speedST != null && (
                              <span className="text-sm font-bold text-white font-mono">
                                {record.speedST.toFixed(0)} km/h
                              </span>
                            )}
                            {record.isPersonalBest && (
                              <span className="text-sm font-black text-green-400">PB</span>
                            )}
                            {record.deleted && (
                              <span className="text-sm font-black text-red-400">DEL</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-500 font-bold">No data</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speed Trap Bar Chart */}
      {speedTrapData.length > 0 && (
        <div className="px-4 py-4">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Speed Trap</h4>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart
              data={speedTrapData}
              layout="vertical"
              margin={{ top: 0, right: 50, left: 5, bottom: 0 }}
              barGap={3}
            >
              <XAxis
                type="number"
                domain={[
                  (dataMin: number) => Math.floor(dataMin - 5),
                  (dataMax: number) => Math.ceil(dataMax + 3),
                ]}
                tick={{ fill: '#888', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono' }}
                stroke="#333"
              />
              <YAxis
                type="category"
                dataKey="driver"
                tick={{ fill: '#999', fontSize: 12, fontWeight: 700, fontFamily: 'Geist Mono' }}
                width={48}
                stroke="transparent"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid rgba(115,115,115,0.4)',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Geist Mono',
                  borderRadius: '12px',
                }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} km/h`, name]}
                cursor={{ fill: '#ffffff10' }}
              />
              <Bar
                dataKey="maxSpeed"
                name="Max Speed"
                barSize={18}
                radius={[0, 4, 4, 0]}
                label={{
                  position: 'right',
                  fill: '#FFF',
                  fontSize: 13,
                  fontWeight: 'bold',
                  formatter: (v: number) => `${v.toFixed(0)}`,
                }}
              >
                {speedTrapData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Bar>
              <Bar
                dataKey="avgSpeed"
                name="Avg Speed"
                barSize={18}
                radius={[0, 4, 4, 0]}
                label={{
                  position: 'right',
                  fill: '#999',
                  fontSize: 12,
                  fontWeight: 'bold',
                  formatter: (v: number) => `${v.toFixed(0)}`,
                }}
              >
                {speedTrapData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} fillOpacity={0.3} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-1 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 rounded-sm bg-gray-300 opacity-90" />
              <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase">Max Speed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2.5 rounded-sm bg-gray-300 opacity-30" />
              <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase">Avg Speed</span>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Laps */}
      {deletedLaps.length > 0 && (
        <div className="px-4 py-4">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
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
              <span className="text-xs text-neutral-400 font-bold">
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
