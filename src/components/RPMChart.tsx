import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchTelemetryRPM, RPMDataPoint } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { OpenF1Driver } from '@/lib/openf1';
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
  openF1Drivers?: OpenF1Driver[];
}

const RPMChart: React.FC<RPMChartProps> = ({
  className,
  delay = 0,
  title = "RPM",
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
              <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">RPM</span>
              <span className="text-xl font-bold text-white font-mono" style={{ color: color }}>
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
    <TelemetryChartWrapper<RPMDataPoint>
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
        return useQuery<RPMDataPoint[]>({
          queryKey: ['rpmTrace', year, event, session, driver, lapVal],
          queryFn: () => fetchTelemetryRPM(year, event, session, driver, lapVal),
          staleTime: 1000 * 60 * 10,
          gcTime: 1000 * 60 * 30,
          retry: 1,
          enabled: !!year && !!event && !!session && !!driver && !!lapVal,
        });
      }}
      renderChart={(data, color, selectedDriver) => (
        <ResponsiveContainer width="100%" height={280} className="export-chart-container">
          <LineChart data={data} margin={{ top: 0, right: 10, left: -15, bottom: 5 }} className="chart-main-container">
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
              dataKey="RPM"
              stroke="#666"
              tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(value) => `${Math.round(value)}`}
              domain={[0, 13000]}
              width={40}
            />
            <Tooltip content={<CustomTooltip selectedDriver={selectedDriver} />} cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey="RPM"
              stroke={driverColor(selectedDriver, year)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1, stroke: '#fff', fill: driverColor(selectedDriver, year) }}
              name={selectedDriver}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      renderStats={(data) => {
        const rpms = data.map(d => d.RPM);
        const maxRPM = Math.max(...rpms);
        const avgRPM = rpms.reduce((a, b) => a + b, 0) / rpms.length;

        return (
          <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Max RPM</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(maxRPM)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Avg RPM</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(avgRPM)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

export default RPMChart;