import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchTelemetrySpeed, SpeedDataPoint } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { OpenF1Driver } from '@/lib/openf1';
import TelemetryChartWrapper from './TelemetryChartWrapper';

interface SpeedTraceChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
  openF1Drivers?: OpenF1Driver[];
}

const SpeedTraceChart: React.FC<SpeedTraceChartProps> = ({
  className,
  delay = 0,
  title = "Speed Trace",
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
  openF1Drivers = []
}) => {

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label, selectedDriver }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const openF1Driver = openF1Drivers.find(d => d.name_acronym === selectedDriver || d.last_name.toUpperCase().slice(0, 3) === selectedDriver);
      const color = driverColor(selectedDriver, year);

      return (
        <div className="bg-black/95 border border-gray-700 p-4 rounded-none shadow-2xl backdrop-blur-md min-w-[200px]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                {openF1Driver?.headshot_url ? (
                  <img src={openF1Driver.headshot_url} alt={selectedDriver} className="w-full h-full object-cover scale-125 translate-y-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-mono">{selectedDriver[0]}</div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-300 font-mono">{selectedDriver}</span>
                <span className="text-[10px] text-gray-500 font-mono">DIST: {Math.round(label)}m</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Speed</span>
              <span className="text-xl font-bold text-white font-mono" style={{ color: color }}>
                {Math.round(data.Speed)} <span className="text-xs text-gray-500">km/h</span>
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <TelemetryChartWrapper<SpeedDataPoint>
      className={className}
      title={title}
      icon={Analytics01Icon}
      year={year}
      event={event}
      session={session}
      initialDriver={initialDriver}
      lap={lap}
      openF1Drivers={openF1Drivers}
      onLoadData={(driver, lapVal) => {
        return useQuery<SpeedDataPoint[]>({
          queryKey: ['speedTrace', year, event, session, driver, lapVal],
          queryFn: () => fetchTelemetrySpeed(year, event, session, driver, lapVal),
          staleTime: 1000 * 60 * 10,
          gcTime: 1000 * 60 * 30,
          retry: 1,
          enabled: !!year && !!event && !!session && !!driver && !!lapVal,
        });
      }}
      renderChart={(data, color, selectedDriver) => (
        <ResponsiveContainer width="100%" height={350} className="export-chart-container">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
            className="chart-main-container"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis
              type="number"
              dataKey="Distance"
              stroke="#666"
              tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(value: number) => {
                return window.innerWidth < 768 ? `${Math.round(value)}m` : `${value.toFixed(0)}m`;
              }}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              dataKey="Speed"
              stroke="#666"
              tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
              domain={['auto', 'dataMax + 10']}
              tickFormatter={(value) => `${value}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip selectedDriver={selectedDriver} />} cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey="Speed"
              stroke={driverColor(selectedDriver, year)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: driverColor(selectedDriver, year) }}
              name={selectedDriver}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      renderStats={(data) => {
        const speeds = data.map(d => d.Speed);
        const maxSpeed = Math.max(...speeds);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

        return (
          <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Max Speed</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(maxSpeed)} <span className="text-[10px] text-gray-500">km/h</span></span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Avg Speed</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(avgSpeed)} <span className="text-[10px] text-gray-500">km/h</span></span>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

export default SpeedTraceChart;
