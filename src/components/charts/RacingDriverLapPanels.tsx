import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flag01Icon, ChartLineData01Icon } from 'hugeicons-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';
import type { EnrichedLapRecord } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import { COMPOUND_COLORS, formatLapTime } from './racingChartUtils';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

interface DriverLapPanelsProps {
  driversToDisplay: string[];
  driverLapDetails?: Record<string, EnrichedLapRecord[]>;
  year: number;
}

export const RacingDriverLapPanels: React.FC<DriverLapPanelsProps> = ({
  driversToDisplay,
  driverLapDetails,
  year,
}) => {
  if (!driverLapDetails) {
    return null;
  }

  const deletedLaps = driversToDisplay.flatMap((driverCode) =>
    (driverLapDetails[driverCode] || []).flatMap((lap) =>
      lap.deleted ? [{ driver: driverCode, ...lap }] : []
    )
  );

  const speedData = driversToDisplay.flatMap((driverCode) => {
    const records = (driverLapDetails[driverCode] || []).filter((lap) => lap.speedST != null);

    if (records.length === 0) {
      return [];
    }

    const speeds = records.map((lap) => lap.speedST as number);

    return [
      {
        driver: driverCode,
        maxSpeed: Math.max(...speeds),
        avgSpeed: +(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length).toFixed(1),
        color: driverColor(driverCode, year),
      },
    ];
  });

  speedData.sort((a, b) => b.maxSpeed - a.maxSpeed);
  const chartHeight = Math.max(100, speedData.length * 50);

  return (
    <>
      {(deletedLaps.length > 0 || speedData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deletedLaps.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flag01Icon className="size-4 text-red-400" />
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
                  Deleted Laps ({deletedLaps.length})
                </h4>
              </div>
              <div className="space-y-1.5">
                {deletedLaps.slice(0, 10).map((lap) => (
                  <div
                    key={`deleted-${lap.driver}-${lap.lapNumber || ''}`}
                    className="flex items-center gap-3 text-[12px]"
                  >
                    <span
                      style={{ color: driverColor(lap.driver, year) }}
                      className="font-bold w-10"
                    >
                      {lap.driver}
                    </span>
                    <span className="text-white/70">Lap {lap.lapNumber}</span>
                    {lap.lapTime != null && (
                      <span className="text-white">{formatLapTime(lap.lapTime)}</span>
                    )}
                    {lap.deletedReason && (
                      <span className="text-red-400 text-[10px] bg-red-500/10 px-2 py-0.5 rounded-full font-semibold">
                        {lap.deletedReason}
                      </span>
                    )}
                  </div>
                ))}
                {deletedLaps.length > 10 && (
                  <span className="text-[11px] text-white font-medium">
                    +{deletedLaps.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {speedData.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5" style={inter}>
              <div className="flex items-center gap-2 mb-4">
                <ChartLineData01Icon className="size-4 text-white" />
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
                  Speed Trap (km/h)
                </h4>
              </div>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={speedData}
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
                    tick={{
                      fill: 'rgba(255,255,255,0.5)',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                    }}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis
                    type="category"
                    dataKey="driver"
                    tick={{
                      fill: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                    }}
                    width={48}
                    stroke="transparent"
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) {
                        return null;
                      }

                      return (
                        <div
                          className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl min-w-[150px]"
                          style={inter}
                        >
                          <p className="text-white font-bold border-b border-white/[0.06] pb-1 mb-2 text-[13px]">
                            {label}
                          </p>
                          {payload.map((entry) => (
                            <div
                              key={entry.name}
                              className="flex gap-3 items-center mb-1 last:mb-0"
                            >
                              <div
                                className="size-3 rounded-sm"
                                style={{
                                  backgroundColor: entry.color,
                                  opacity: entry.name === 'Max Speed' ? 0.9 : 0.3,
                                }}
                              />
                              <p className="text-[12px] text-white flex-1">{entry.name}:</p>
                              <span className="text-white font-bold text-[12px]">
                                {Number(entry.value).toFixed(1)} km/h
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="maxSpeed" name="Max Speed" barSize={18} radius={[0, 4, 4, 0]}>
                    {speedData.map((entry) => (
                      <Cell key={entry.driver} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                  <Bar dataKey="avgSpeed" name="Avg Speed" barSize={18} radius={[0, 4, 4, 0]}>
                    {speedData.map((entry) => (
                      <Cell key={`${entry.driver}-avg`} fill={entry.color} fillOpacity={0.3} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-2 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-2.5 rounded-sm bg-white/90" />
                  <span className="text-[10px] text-white font-semibold uppercase">Max</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-2.5 rounded-sm bg-white/30" />
                  <span className="text-[10px] text-white font-semibold uppercase">Avg</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
            Tyre Strategy & Stint Pace
          </h4>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {driversToDisplay.map((driverCode) => {
            const records = driverLapDetails[driverCode] || [];

            if (records.length === 0) {
              return null;
            }

            const stintMap = new Map<number, EnrichedLapRecord[]>();
            records.forEach((lap) => {
              if (lap.stint != null) {
                if (!stintMap.has(lap.stint)) {
                  stintMap.set(lap.stint, []);
                }
                stintMap.get(lap.stint)?.push(lap);
              }
            });

            const color = driverColor(driverCode, year);
            const headshot = getDriverImage(driverCode, year);
            const stintEntries = Array.from(stintMap.entries());

            return (
              <div key={driverCode} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    className="size-8 border border-white/[0.08]"
                    style={{ borderColor: color }}
                  >
                    <AvatarImage src={headshot} className="object-cover object-top" />
                    <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                      {driverCode[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[13px] font-bold" style={{ color }}>
                    {driverCode}
                  </span>
                  <span className="text-[11px] text-white font-medium">
                    {stintEntries.length} stint{stintEntries.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {stintEntries.map(([stintNumber, laps]) => {
                    const compound = laps[0]?.compound || '?';
                    const validTimes = laps.flatMap((lap) =>
                      lap.lapTime != null && !lap.deleted ? [lap.lapTime] : []
                    );
                    const avgTime =
                      validTimes.length > 0
                        ? validTimes.reduce((sum, lapTime) => sum + lapTime, 0) / validTimes.length
                        : null;
                    const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
                    const tyreLifeEnd = laps[laps.length - 1]?.tyreLife;
                    const freshTyre = laps[0]?.freshTyre;

                    return (
                      <div
                        key={stintNumber}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] relative overflow-hidden"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: COMPOUND_COLORS[compound] || '#666' }}
                        />
                        <div className="flex items-center gap-4 pl-3">
                          <span
                            className="text-[12px] font-bold w-20"
                            style={{ color: COMPOUND_COLORS[compound] || '#FFF' }}
                          >
                            {compound}
                          </span>
                          <span className="text-[11px] text-white font-medium">
                            Laps {laps[0]?.lapNumber}–{laps[laps.length - 1]?.lapNumber}{' '}
                            <span className="text-white">({laps.length} laps)</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-5 text-right">
                          {freshTyre != null && (
                            <span
                              className={`text-[10px] uppercase font-semibold ${freshTyre ? 'text-emerald-400' : 'text-amber-400'} hidden sm:inline-block`}
                            >
                              {freshTyre ? 'New' : 'Used'}
                            </span>
                          )}
                          {tyreLifeEnd != null && (
                            <span className="text-[11px] text-white font-medium hidden md:inline-block">
                              Life: {tyreLifeEnd}
                            </span>
                          )}
                          <div className="flex flex-col min-w-[100px] text-left">
                            <span className="text-[11px] text-white font-bold">
                              Avg: {avgTime != null ? formatLapTime(avgTime) : 'N/A'}
                            </span>
                            {bestTime != null && (
                              <span className="text-[10px] text-white font-medium">
                                Best: {formatLapTime(bestTime)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
