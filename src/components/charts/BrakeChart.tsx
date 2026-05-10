// knip-ignore
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/lib/recharts-lazy';
import { fetchTelemetryBrake, BrakeDataPoint } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import TelemetryChartWrapper from './TelemetryChartWrapper';
import { DriverChartTooltip } from './shared/DriverChartTooltip';

interface BrakeChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const BrakeChart: React.FC<BrakeChartProps> = ({
  className,
  delay = 0,
  title = 'Brake Input',
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
}) => {
  return (
    <TelemetryChartWrapper<BrakeDataPoint[]>
      className={className}
      title={title}
      icon={Analytics01Icon}
      year={year}
      event={event}
      session={session}
      initialDriver={initialDriver}
      lap={lap}
      queryKey={(driver, lapVal) => ['brakeTrace', year, event, session, driver, lapVal]}
      queryFn={(driver, lapVal) => fetchTelemetryBrake(year, event, session, driver, lapVal)}
      queryEnabled={(driver, lapVal) => !!year && !!event && !!session && !!driver && !!lapVal}
      renderChart={(data, _color, selectedDriver) => (
        <ResponsiveContainer width="100%" height={280} className="export-chart-container">
          <LineChart
            data={data}
            margin={{ top: 0, right: 10, left: -15, bottom: 5 }}
            className="chart-main-container"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              type="number"
              dataKey="Distance"
              stroke="rgba(255,255,255,0.08)"
              tick={{
                fill: '#FFF',
                fontSize: 13,
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
              }}
              ticks={Array.from({ length: 8 }, (_, i) => (i + 1) * 1000).filter(
                (t) => t <= (data[data.length - 1]?.Distance ?? 0)
              )}
              tickFormatter={(value: number) => `${value}m`}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              dataKey="Brake"
              stroke="rgba(255,255,255,0.08)"
              tick={{
                fill: '#FFF',
                fontSize: 13,
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
              }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              width={40}
            />
            <Tooltip
              content={
                <DriverChartTooltip
                  selectedDriver={selectedDriver}
                  year={year}
                  valueKey="Brake"
                  unit="%"
                  title="Brake"
                />
              }
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="Brake"
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
        const brakes = data.map((d) => d.Brake);
        const hardBraking = brakes.filter((b) => b >= 80).length;
        const hardBrakingPercentage = (hardBraking / brakes.length) * 100;

        return (
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span
                    className="text-[9px] text-white uppercase tracking-wider"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Hard Braking
                  </span>
                  <span
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {Math.round(hardBrakingPercentage)}{' '}
                    <span className="text-[10px] text-white">%</span>
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

export { BrakeChart };
export default BrakeChart;
