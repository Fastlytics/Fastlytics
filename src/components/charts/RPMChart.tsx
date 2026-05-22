// knip-ignore
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
} from '@/lib/recharts-lazy';
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

const RPMTooltip = ({
  active,
  payload,
  label,
  selectedDriver,
  year,
}: CustomTooltipProps<RPMDataPoint> & { selectedDriver?: string; year?: number }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const headshot = getDriverImage(selectedDriver, year);
    const color = driverColor(selectedDriver, year);

    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-4 shadow-2xl min-w-[200px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 mb-1">
            <div className="size-8 rounded-full bg-[#1a1a1e] overflow-hidden border border-white/[0.08] shrink-0">
              {headshot ? (
                <img
                  src={headshot}
                  alt={selectedDriver}
                  className="size-full object-cover object-top"
                />
              ) : (
                <div
                  className="size-full flex items-center justify-center text-[10px] text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {selectedDriver?.[0]}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span
                className="text-xs font-semibold text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {selectedDriver}
              </span>
              <span
                className="text-[10px] text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                DIST: {Math.round(Number(label))}m
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className="text-[9px] text-white uppercase tracking-wider"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              RPM
            </span>
            <span
              className="text-xl font-semibold text-white"
              style={{ color: color, fontFamily: "'Inter', sans-serif" }}
            >
              {Math.round(data.RPM)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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
      computeMetrics={(data) => {
        const values = data.map((d) => d.RPM);
        return {
          max: Math.max(...values),
          min: Math.min(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      }}
      renderChart={(data, color, selectedDriver) => (
        <ResponsiveContainer width="100%" height={280} className="export-chart-container">
          <LineChart
            data={data}
            margin={{ top: 0, right: 10, left: 0, bottom: 5 }}
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
              dataKey="RPM"
              stroke="rgba(255,255,255,0.06)"
              tick={{
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              domain={[0, 13000]}
              width={35}
            />
            <Tooltip
              content={<RPMTooltip selectedDriver={selectedDriver} year={year} />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '4 4' }}
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
          <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span
                    className="text-[9px] text-white uppercase tracking-wider"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Max RPM
                  </span>
                  <span
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {Math.round(maxRPM)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span
                    className="text-[9px] text-white uppercase tracking-wider"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Avg RPM
                  </span>
                  <span
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
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
