import React from 'react';
import { cn } from '@/lib/utils';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/recharts-lazy';
import { Cell } from '@/lib/recharts-cell';
import type { EnrichedLapRecord } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import { COMPOUND_COLORS, formatLapTime } from './racingChartUtils';

interface DriverLapPanelsProps {
  driversToDisplay: string[];
  driverLapDetails?: Record<string, EnrichedLapRecord[]>;
  driverNameMap: Map<string, string>;
  year: number;
}

export const RacingDriverLapPanels: React.FC<DriverLapPanelsProps> = ({
  driversToDisplay,
  driverLapDetails,
  driverNameMap,
  year,
}) => {
  if (!driverLapDetails) return null;

  const deletedLaps = driversToDisplay.flatMap((driverCode) =>
    (driverLapDetails[driverCode] || []).flatMap((lap) =>
      lap.deleted ? [{ driver: driverCode, ...lap }] : []
    )
  );

  const speedData = driversToDisplay.flatMap((driverCode) => {
    const records = (driverLapDetails[driverCode] || []).filter((lap) => lap.speedST != null);
    if (records.length === 0) return [];

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

  return (
    <>
      {/* Speed Trap + Stint Pace — side by side */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Speed Trap */}
        {speedData.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-lg border border-white/[0.04]">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
              <div>
                <h3 className="text-[14px] font-semibold text-white">Speed Trap</h3>
                <p className="mt-0.5 text-[12px] text-white/60">Top speed comparison (km/h)</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={speedData}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 5, bottom: 0 }}
                    barGap={2}
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
                        fontWeight: 500,
                        fontFamily: 'Inter, sans-serif',
                      }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="driver"
                      tick={{
                        fill: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                      }}
                      width={40}
                      stroke="transparent"
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-2.5 shadow-2xl">
                            <p className="mb-1.5 text-[13px] font-medium text-white">{label}</p>
                            {payload.map((entry) => (
                              <div key={entry.name} className="flex items-center gap-2 text-[12px]">
                                <span
                                  className="size-2 rounded-sm"
                                  style={{
                                    backgroundColor: entry.color,
                                    opacity: entry.name === 'Max Speed' ? 0.9 : 0.3,
                                  }}
                                />
                                <span className="text-white/80">{entry.name}</span>
                                <span className="ml-auto font-mono tabular-nums text-white">
                                  {Number(entry.value).toFixed(1)} km/h
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="maxSpeed" name="Max Speed" barSize={14} radius={[0, 3, 3, 0]}>
                      {speedData.map((entry) => (
                        <Cell key={entry.driver} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <Bar dataKey="avgSpeed" name="Avg Speed" barSize={14} radius={[0, 3, 3, 0]}>
                      {speedData.map((entry) => (
                        <Cell key={`${entry.driver}-avg`} fill={entry.color} fillOpacity={0.25} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 border-t border-white/[0.04] pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-white/70" />
                  <span className="text-[11px] text-white/80">Max</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm bg-white/25" />
                  <span className="text-[11px] text-white/80">Avg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stint Pace — matching head-to-head design */}
        <div className="overflow-hidden rounded-lg border border-white/[0.04]">
          <div className="border-b border-white/[0.04] px-5 py-3">
            <h3 className="text-[14px] font-semibold text-white">Stint Pace</h3>
            <p className="mt-0.5 text-[12px] text-white/60">Average and best lap per stint</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-5 space-y-5">
            {driversToDisplay.map((driverCode) => {
              const records = driverLapDetails[driverCode] || [];
              if (records.length === 0) return null;

              const stintMap = new Map<number, EnrichedLapRecord[]>();
              records.forEach((lap) => {
                if (lap.stint != null) {
                  if (!stintMap.has(lap.stint)) stintMap.set(lap.stint, []);
                  stintMap.get(lap.stint)?.push(lap);
                }
              });

              const headshot = getDriverImage(driverCode, year);
              const stintEntries = Array.from(stintMap.entries());

              return (
                <div key={driverCode}>
                  {/* Driver header */}
                  <div className="mb-3 flex items-center gap-2.5">
                    <img
                      src={headshot}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                    />
                    <span className="text-[14px] font-semibold text-white">
                      {driverNameMap.get(driverCode) || driverCode}
                    </span>
                    <span className="text-[13px] text-white/60">
                      {stintEntries.length} stint{stintEntries.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Stint rows */}
                  <div className="space-y-1.5">
                    {stintEntries.map(([stintNumber, laps]) => {
                      const compound = laps[0]?.compound || '?';
                      const validTimes = laps.flatMap((lap) =>
                        lap.lapTime != null && !lap.deleted ? [lap.lapTime] : []
                      );
                      const avgTime =
                        validTimes.length > 0
                          ? validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length
                          : null;
                      const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
                      const tyreLifeEnd = laps[laps.length - 1]?.tyreLife;
                      const freshTyre = laps[0]?.freshTyre;

                      return (
                        <div
                          key={stintNumber}
                          className="flex items-center justify-between rounded-lg border border-white/[0.04] px-4 py-3 transition-colors hover:border-white/[0.08]"
                        >
                          <div className="flex items-center gap-3">
                            {/* Compound indicator */}
                            <div
                              className="flex h-6 w-10 items-center justify-center rounded"
                              style={{
                                backgroundColor: COMPOUND_COLORS[compound?.toUpperCase()] || '#666',
                              }}
                            >
                              <span className="text-[10px] font-bold text-black">
                                {compound?.[0] || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="text-[13px] font-medium text-white">
                                Lap {laps[0]?.lapNumber}–{laps[laps.length - 1]?.lapNumber}
                              </div>
                              <div className="text-[12px] text-white/60">{laps.length} laps</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            {/* Avg / Best times */}
                            <div className="hidden text-right sm:block">
                              {avgTime != null && (
                                <div className="text-[13px] text-white">
                                  Avg{' '}
                                  <span className="font-mono tabular-nums font-medium text-white">
                                    {formatLapTime(avgTime)}
                                  </span>
                                </div>
                              )}
                              {bestTime != null && (
                                <div className="text-[12px] text-white/60">
                                  Best{' '}
                                  <span className="font-mono tabular-nums text-white/80">
                                    {formatLapTime(bestTime)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Tyre state */}
                            <div className="text-right">
                              {freshTyre != null && (
                                <div
                                  className={cn(
                                    'text-[12px] font-medium',
                                    freshTyre ? 'text-emerald-400' : 'text-amber-400'
                                  )}
                                >
                                  {freshTyre ? 'New' : 'Used'}
                                </div>
                              )}
                              {tyreLifeEnd != null && (
                                <div className="text-[12px] text-white/60">Life {tyreLifeEnd}</div>
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
      </div>

      {/* Deleted Laps (below, only if present) */}
      {deletedLaps.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-white/[0.04]">
          <div className="border-b border-white/[0.04] px-5 py-3">
            <h3 className="text-[14px] font-semibold text-white">
              Deleted Laps
              <span className="ml-1.5 text-white/60">{deletedLaps.length}</span>
            </h3>
          </div>
          <div className="divide-y divide-white/[0.03] px-4">
            {deletedLaps.slice(0, 10).map((lap) => (
              <div
                key={`deleted-${lap.driver}-${lap.lapNumber || ''}`}
                className="flex items-center gap-3 py-2.5 text-[13px]"
              >
                <span
                  className="w-9 shrink-0 font-semibold"
                  style={{ color: driverColor(lap.driver, year) }}
                >
                  {lap.driver}
                </span>
                <span className="text-white">Lap {lap.lapNumber}</span>
                {lap.lapTime != null && (
                  <span className="font-mono tabular-nums text-white/80">
                    {formatLapTime(lap.lapTime)}
                  </span>
                )}
                {lap.deletedReason && (
                  <span className="ml-auto text-[12px] font-medium text-red-400">
                    {lap.deletedReason}
                  </span>
                )}
              </div>
            ))}
            {deletedLaps.length > 10 && (
              <div className="py-2 text-[12px] text-white/60">+{deletedLaps.length - 10} more</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
