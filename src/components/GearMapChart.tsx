import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ZAxis, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchTelemetryGear, GearMapDataPoint } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { OpenF1Driver } from '@/lib/openf1';
import TelemetryChartWrapper from './TelemetryChartWrapper';

const gearColors = [
  '#33bbee', // 1st Gear (Cyan)
  '#ee7733', // 2nd Gear (Orange)
  '#009988', // 3rd Gear (Teal)
  '#cc3311', // 4th Gear (Red)
  '#ee3377', // 5th Gear (Magenta)
  '#0077bb', // 6th Gear (Blue)
  '#aacc00', // 7th Gear (Lime Green)
  '#ffdd55'  // 8th Gear (Yellow)
];
const getGearColor = (gear: number): string => {
  if (gear >= 1 && gear <= gearColors.length) {
    return gearColors[gear - 1];
  }
  return '#6B7280';
};

interface GearMapChartProps {
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

const GearMapChart: React.FC<GearMapChartProps> = ({
  className,
  delay = 0,
  title = "Gear Shifts",
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
                <span className="text-[10px] text-gray-500 font-mono">Gear Map</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Current Gear</span>
              <span className="text-xl font-bold text-white font-mono" style={{ color: getGearColor(data.z) }}>
                {data.z}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <TelemetryChartWrapper<GearMapDataPoint>
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
        return useQuery<GearMapDataPoint[]>({
          queryKey: ['gearTrace', year, event, session, driver, lapVal],
          queryFn: () => fetchTelemetryGear(year, event, session, driver, lapVal),
          staleTime: 1000 * 60 * 10,
          gcTime: 1000 * 60 * 30,
          retry: 1,
          enabled: !!year && !!event && !!session && !!driver && !!lapVal,
        });
      }}
      renderChart={(data, color, selectedDriver) => {
        const scatterData = data.map(point => ({
          x: point.X,
          y: point.Y,
          z: point.nGear
        }));

        return (
          <ResponsiveContainer width="100%" height={350} className="export-chart-container">
            <ScatterChart margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
              <XAxis type="number" dataKey="x" hide={true} domain={['dataMin', 'dataMax']} />
              <YAxis type="number" dataKey="y" hide={true} domain={['dataMin', 'dataMax']} axisLine={false} tickLine={false} />
              <ZAxis type="number" dataKey="z" range={[1, 8]} name="Gear" />
              <Tooltip content={<CustomTooltip selectedDriver={selectedDriver} />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                payload={gearColors.map((c, i) => ({
                  value: `Gear ${i + 1}`,
                  type: 'circle',
                  id: `ID${i}`,
                  color: c
                }))}
                formatter={(value) => <span className="text-gray-400 font-mono text-[10px] uppercase ml-1">{value}</span>}
                {...({} as any)}
              />
              <Scatter name="Track Position" data={scatterData} fill="#8884d8" shape="circle">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getGearColor(entry.z)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      }}
      renderStats={(data) => {
        // Calculate gear usage stats
        const gears = data.map(d => d.nGear);
        const gearCounts = gears.reduce((acc, gear) => {
          acc[gear] = (acc[gear] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        // Find most used gear
        let mostUsedGear = 0;
        let maxCount = 0;
        Object.entries(gearCounts).forEach(([gear, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mostUsedGear = parseInt(gear);
          }
        });

        const avgGear = gears.reduce((a, b) => a + b, 0) / gears.length;

        return (
          <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Avg Gear</span>
                  <span className="text-lg font-bold text-white font-mono">{avgGear.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Most Used</span>
                  <span className="text-lg font-bold text-white font-mono" style={{ color: getGearColor(mostUsedGear) }}>{mostUsedGear}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

export default GearMapChart;
