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
import { fetchTelemetryThrottle, ThrottleDataPoint } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import TelemetryChartWrapper from './TelemetryChartWrapper';
import { DriverChartTooltip } from './shared/DriverChartTooltip';

interface ThrottleChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const ThrottleChart: React.FC<ThrottleChartProps> = ({
  className,
  delay = 0,
  title = 'Throttle Input',
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
}) => {
  return (
    <TelemetryChartWrapper<ThrottleDataPoint[]>
      className={className}
      title={title}
      icon={Analytics01Icon}
      year={year}
      event={event}
      session={session}
      initialDriver={initialDriver}
      lap={lap}
      queryKey={(driver, lapVal) => ['throttleTrace', year, event, session, driver, lapVal]}
      queryFn={(driver, lapVal) => fetchTelemetryThrottle(year, event, session, driver, lapVal)}
      queryEnabled={(driver, lapVal) => !!year && !!event && !!session && !!driver && !!lapVal}
      computeMetrics={(data) => {
        const values = data.map((d) => d.Throttle);
        return {
          max: Math.max(...values),
          min: Math.min(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      }}
      renderChart={(data, _color, selectedDriver) => (
        <ResponsiveContainer width="100%" height={280} className="export-chart-container">
          <LineChart
            data={data}
            margin={{ top: 0, right: 10, left: -15, bottom: 5 }}
            className="chart-main-container"
          >
            <CartesianGrid
              strokeDasharray="none"
              vertical={false}
              stroke="rgba(255,255,255,0.03)"
            />
            <XAxis
              type="number"
              dataKey="Distance"
              stroke="rgba(255,255,255,0.06)"
              tick={{
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
              ticks={Array.from({ length: 8 }, (_, i) => (i + 1) * 1000).filter(
                (t) => t <= (data[data.length - 1]?.Distance ?? 0)
              )}
              tickFormatter={(value: number) => `${value}m`}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              dataKey="Throttle"
              stroke="rgba(255,255,255,0.06)"
              tick={{
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 500,
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
                  valueKey="Throttle"
                  unit="%"
                  title="Throttle"
                />
              }
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="Throttle"
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
        const throttle = data.map((d) => d.Throttle);
        const fullThrottle = throttle.filter((t) => t >= 95).length;
        const fullThrottlePercentage = (fullThrottle / throttle.length) * 100;

        return (
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span
                    className="text-[9px] text-white uppercase tracking-wider"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Full Throttle
                  </span>
                  <span
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {Math.round(fullThrottlePercentage)}{' '}
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

export { ThrottleChart };
export default ThrottleChart;
