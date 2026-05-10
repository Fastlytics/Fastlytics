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
import { fetchTelemetryDRS, DRSDataPoint } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import TelemetryChartWrapper from './TelemetryChartWrapper';

interface DRSChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const DRSTooltip = ({
  active,
  payload,
  label,
  selectedDriver,
  year,
}: CustomTooltipProps<DRSDataPoint> & { selectedDriver?: string; year?: number }) => {
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
                DIST: {Math.round(label)}m
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className="text-[9px] text-white uppercase tracking-wider"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              DRS Status
            </span>
            <span
              className="text-xl font-black text-white"
              style={{ color: color, fontFamily: "'Inter', sans-serif" }}
            >
              {data.DRS === 1 ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const DRSChart: React.FC<DRSChartProps> = ({
  className,
  delay = 0,
  title = 'DRS Usage',
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
}) => {
  return (
    <TelemetryChartWrapper<DRSDataPoint[]>
      className={className}
      title={title}
      icon={Analytics01Icon}
      year={year}
      event={event}
      session={session}
      initialDriver={initialDriver}
      lap={lap}
      queryKey={(driver, lapVal) => ['drsTrace', year, event, session, driver, lapVal]}
      queryFn={(driver, lapVal) => fetchTelemetryDRS(year, event, session, driver, lapVal)}
      queryEnabled={(driver, lapVal) => !!year && !!event && !!session && !!driver && !!lapVal}
      renderChart={(data, color, selectedDriver) => (
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
              dataKey="DRS"
              stroke="rgba(255,255,255,0.08)"
              tick={{
                fill: '#FFF',
                fontSize: 13,
                fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
              }}
              tickFormatter={(value) => ''}
              domain={[0, 1]}
              ticks={[0, 1]}
              width={25}
            />
            <Tooltip
              content={<DRSTooltip selectedDriver={selectedDriver} year={year} />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '4 4' }}
            />
            <Line
              type="stepBefore"
              dataKey="DRS"
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
        const drsActive = data.filter((d) => d.DRS === 1).length;
        const drsPercentage = (drsActive / data.length) * 100;

        return (
          <div className="grid grid-cols-1 gap-4 border-t border-white/[0.06] pt-4">
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span
                    className="text-[9px] text-white uppercase tracking-wider"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    DRS Active
                  </span>
                  <span
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {Math.round(drsPercentage)} <span className="text-[10px] text-white">%</span>
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

export { DRSChart };
export default DRSChart;
