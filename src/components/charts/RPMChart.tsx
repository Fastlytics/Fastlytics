import React from 'react';
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
import { fetchTelemetryRPM, RPMDataPoint } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import TelemetryChartWrapper from './TelemetryChartWrapper';

interface RPMChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const RPMChart: React.FC<RPMChartProps> = ({
  className,
  delay = 0,
  title = 'RPM',
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
  }: CustomTooltipProps<RPMDataPoint> & { selectedDriver?: string }) => {
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
                  DIST: {Math.round(Number(label))}m
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider">
                RPM
              </span>
              <span className="text-xl font-black text-white font-mono" style={{ color: color }}>
                {Math.round(data.RPM)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <TelemetryChartWrapper<RPMDataPoint[]>
      className={className}
      title={title}
      icon={Analytics01Icon}
      year={year}
      event={event}
      session={session}
      initialDriver={initialDriver}
      lap={lap}
      queryKey={(driver, lapVal) => ['rpmTrace', year, event, session, driver, lapVal]}
      queryFn={(driver, lapVal) => fetchTelemetryRPM(year, event, session, driver, lapVal)}
      queryEnabled={(driver, lapVal) => !!year && !!event && !!session && !!driver && !!lapVal}
      renderChart={(data, color, selectedDriver) => (
        <ResponsiveContainer width="100%" height={280} className="export-chart-container">
          <LineChart
            data={data}
            margin={{ top: 0, right: 10, left: 0, bottom: 5 }}
            className="chart-main-container"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis
              type="number"
              dataKey="Distance"
              stroke="#666"
              tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
              ticks={Array.from({ length: 8 }, (_, i) => (i + 1) * 1000).filter(
                (t) => t <= (data[data.length - 1]?.Distance ?? 0)
              )}
              tickFormatter={(value: number) => `${value}m`}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              dataKey="RPM"
              stroke="#666"
              tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              domain={[0, 13000]}
              width={35}
            />
            <Tooltip
              content={<CustomTooltip selectedDriver={selectedDriver} />}
              cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="RPM"
              stroke={driverColor(selectedDriver, year)}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 1,
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
        const rpms = data.map((d) => d.RPM);
        const maxRPM = Math.max(...rpms);
        const avgRPM = rpms.reduce((a, b) => a + b, 0) / rpms.length;

        return (
          <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4">
            <div className="flex flex-col gap-2 p-3 bg-black border border-neutral-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider">
                    Max RPM
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {Math.round(maxRPM)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3 bg-black border border-neutral-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-neutral-500 uppercase font-mono tracking-wider">
                    Avg RPM
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {Math.round(avgRPM)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

export { RPMChart };
export default RPMChart;
