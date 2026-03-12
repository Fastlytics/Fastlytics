import React, { useMemo } from 'react';
import type { CustomTooltipProps } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchTelemetrySpeed, SpeedDataPoint, SpeedTraceResponse, LapMeta } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import TelemetryChartWrapper from './TelemetryChartWrapper';
import { cn } from '@/lib/utils';

interface SpeedTraceChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const SpeedTraceChart: React.FC<SpeedTraceChartProps> = ({
  className,
  delay = 0,
  title = 'Speed Trace',
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
}) => {
  // Custom Tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
    selectedDriver,
  }: CustomTooltipProps<SpeedDataPoint> & { selectedDriver?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const headshot = getDriverImage(selectedDriver, year);
      const color = driverColor(selectedDriver, year);

      return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 shadow-xl min-w-[200px]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-black overflow-hidden border border-neutral-800 shrink-0">
                {headshot ? (
                  <img
                    src={headshot}
                    alt={selectedDriver}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 font-mono">
                    {selectedDriver[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-neutral-300 font-mono">{selectedDriver}</span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  DIST: {Math.round(label)}m
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider">
                Speed
              </span>
              <span className="text-xl font-black text-white font-mono" style={{ color: color }}>
                {Math.round(data.Speed)} <span className="text-xs text-neutral-500">km/h</span>
              </span>
            </div>

            {/* Extra telemetry channels */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-neutral-400 border-t border-neutral-800 pt-2 mt-1">
              {data.Throttle != null && (
                <>
                  <span>Throttle</span>
                  <span className="text-right text-white">{Math.round(data.Throttle)}%</span>
                </>
              )}
              {data.Brake != null && (
                <>
                  <span>Brake</span>
                  <span
                    className={cn(
                      'text-right font-black',
                      data.Brake > 0 ? 'text-red-400' : 'text-neutral-500'
                    )}
                  >
                    {data.Brake > 0 ? 'ON' : 'OFF'}
                  </span>
                </>
              )}
              {data.nGear != null && (
                <>
                  <span>Gear</span>
                  <span className="text-right text-white">{data.nGear}</span>
                </>
              )}
              {data.DRS != null && (
                <>
                  <span>DRS</span>
                  <span
                    className={cn(
                      'text-right font-black',
                      data.DRS >= 10 ? 'text-green-400' : 'text-neutral-500'
                    )}
                  >
                    {data.DRS >= 10 ? 'OPEN' : 'CLOSED'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <TelemetryChartWrapper<SpeedTraceResponse>
      className={className}
      title={title}
      icon={Analytics01Icon}
      year={year}
      event={event}
      session={session}
      initialDriver={initialDriver}
      lap={lap}
      queryKey={(driver, lapVal) => ['speedTrace', year, event, session, driver, lapVal]}
      queryFn={async (driver, lapVal) => {
        const result = await fetchTelemetrySpeed(year, event, session, driver, lapVal);
        if (Array.isArray(result)) return { trace: result, lapMeta: {} };
        return result;
      }}
      queryEnabled={(driver, lapVal) => !!year && !!event && !!session && !!driver && !!lapVal}
      renderChart={(data, color, selectedDriver) => (
        <ResponsiveContainer width="100%" height={350} className="export-chart-container">
          <LineChart
            data={data.trace}
            margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
            className="chart-main-container"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis
              type="number"
              dataKey="Distance"
              stroke="#666"
              tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
              ticks={Array.from({ length: 8 }, (_, i) => (i + 1) * 1000).filter(
                (t) => t <= (data.trace[data.trace.length - 1]?.Distance ?? 0)
              )}
              tickFormatter={(value: number) => `${value}m`}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              dataKey="Speed"
              stroke="#666"
              tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
              domain={['auto', 'dataMax + 10']}
              tickFormatter={(value) => `${value}`}
              width={40}
            />
            <Tooltip
              content={<CustomTooltip selectedDriver={selectedDriver} />}
              cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="Speed"
              stroke={driverColor(selectedDriver, year)}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: '#fff',
                fill: driverColor(selectedDriver, year),
              }}
              name={selectedDriver}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      renderStats={(data) => {
        const speeds = data.trace.map((d) => d.Speed);
        const maxSpeed = Math.max(...speeds);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const meta = data.lapMeta as LapMeta | undefined;

        const formatSectorTime = (s: number | undefined) => {
          if (s == null) return null;
          return s.toFixed(3);
        };

        const compoundColors: Record<string, string> = {
          SOFT: 'bg-red-600',
          MEDIUM: 'bg-yellow-400',
          HARD: 'bg-white',
          INTERMEDIATE: 'bg-green-500',
          WET: 'bg-blue-500',
        };

        return (
          <div className="space-y-4 border-t border-neutral-800 pt-4">
            {/* Speed stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 p-3 bg-black border border-neutral-800">
                <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-black">
                  Max Speed
                </span>
                <span className="text-lg font-black text-white font-mono">
                  {Math.round(maxSpeed)} <span className="text-[10px] text-neutral-500">km/h</span>
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-black border border-neutral-800">
                <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-black">
                  Avg Speed
                </span>
                <span className="text-lg font-black text-white font-mono">
                  {Math.round(avgSpeed)} <span className="text-[10px] text-neutral-500">km/h</span>
                </span>
              </div>
              {meta?.lapTime != null && (
                <div className="flex flex-col gap-1 p-3 bg-black border border-neutral-800">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-black">
                    Lap Time
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {Math.floor(meta.lapTime / 60)}:
                    {(meta.lapTime % 60).toFixed(3).padStart(6, '0')}
                  </span>
                </div>
              )}
              {meta?.position != null && (
                <div className="flex flex-col gap-1 p-3 bg-black border border-neutral-800">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wider font-black">
                    Position
                  </span>
                  <span className="text-lg font-black text-white font-mono">P{meta.position}</span>
                </div>
              )}
            </div>

            {/* Lap metadata row */}
            {meta && (meta.compound || meta.sector1Time != null || meta.deleted != null) && (
              <div className="flex flex-wrap items-center gap-3 px-3 py-2.5 bg-black border border-neutral-800 text-xs font-mono">
                {meta.compound && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        compoundColors[meta.compound.toUpperCase()] || 'bg-gray-500'
                      )}
                    ></span>
                    <span className="text-neutral-400 uppercase font-black">{meta.compound}</span>
                    {meta.tyreLife != null && (
                      <span className="text-neutral-500 ml-1">({meta.tyreLife} laps)</span>
                    )}
                    {meta.freshTyre != null && (
                      <span
                        className={cn(
                          'text-[9px] font-black px-1 py-0.5 ml-1',
                          meta.freshTyre
                            ? 'bg-green-900/60 text-green-400'
                            : 'bg-neutral-800 text-neutral-500'
                        )}
                      >
                        {meta.freshTyre ? 'NEW' : 'USED'}
                      </span>
                    )}
                  </div>
                )}

                {/* Sector times */}
                {(meta.sector1Time != null ||
                  meta.sector2Time != null ||
                  meta.sector3Time != null) && (
                  <div className="flex items-center gap-3 border-l border-neutral-800 pl-3 text-neutral-400">
                    {meta.sector1Time != null && (
                      <span>
                        S1{' '}
                        <span className="text-white font-black">
                          {formatSectorTime(meta.sector1Time)}
                        </span>
                      </span>
                    )}
                    {meta.sector2Time != null && (
                      <span>
                        S2{' '}
                        <span className="text-white font-black">
                          {formatSectorTime(meta.sector2Time)}
                        </span>
                      </span>
                    )}
                    {meta.sector3Time != null && (
                      <span>
                        S3{' '}
                        <span className="text-white font-black">
                          {formatSectorTime(meta.sector3Time)}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Speed traps */}
                {(meta.speedI1 != null || meta.speedFL != null || meta.speedST != null) && (
                  <div className="flex items-center gap-3 border-l border-neutral-800 pl-3 text-neutral-400">
                    {meta.speedI1 != null && (
                      <span>
                        I1 <span className="text-white">{meta.speedI1}</span>
                      </span>
                    )}
                    {meta.speedI2 != null && (
                      <span>
                        I2 <span className="text-white">{meta.speedI2}</span>
                      </span>
                    )}
                    {meta.speedFL != null && (
                      <span>
                        FL <span className="text-white">{meta.speedFL}</span>
                      </span>
                    )}
                    {meta.speedST != null && (
                      <span>
                        ST <span className="text-white font-black">{meta.speedST}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 ml-auto">
                  {meta.isPersonalBest && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-purple-900/60 text-purple-300 rounded-sm uppercase tracking-wider">
                      PB
                    </span>
                  )}
                  {meta.deleted && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-900/60 text-red-400 rounded-sm uppercase tracking-wider">
                      DELETED{meta.deletedReason ? ` — ${meta.deletedReason}` : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

export { SpeedTraceChart };
export default SpeedTraceChart;
