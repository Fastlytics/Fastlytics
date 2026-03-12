import React from 'react';
import { fetchGearShiftMap, GearShiftMapData } from '@/lib/api';
import { Analytics01Icon } from 'hugeicons-react';
import TelemetryChartWrapper from './TelemetryChartWrapper';

const gearColors = [
  '#33bbee', // 1st Gear (Cyan)
  '#ee7733', // 2nd Gear (Orange)
  '#009988', // 3rd Gear (Teal)
  '#cc3311', // 4th Gear (Red)
  '#ee3377', // 5th Gear (Magenta)
  '#0077bb', // 6th Gear (Blue)
  '#aacc00', // 7th Gear (Lime Green)
  '#ffdd55', // 8th Gear (Yellow)
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
}

const GearMapChart: React.FC<GearMapChartProps> = ({
  className,
  delay = 0,
  title = 'Gear Shifts',
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
}) => {
  const [hoveredGear, setHoveredGear] = React.useState<number | null>(null);

  return (
    <TelemetryChartWrapper<GearShiftMapData>
      className={className}
      title={title}
      icon={Analytics01Icon}
      year={year}
      event={event}
      session={session}
      initialDriver={initialDriver}
      lap={lap}
      queryKey={(driver, lapVal) => ['gearMap', year, event, session, driver, lapVal]}
      queryFn={(driver, lapVal) => fetchGearShiftMap(year, event, session, driver, lapVal)}
      queryEnabled={(driver, lapVal) => !!year && !!event && !!session && !!driver && !!lapVal}
      renderChart={(data, color, selectedDriver) => {
        return (
          <div className="relative w-full h-[350px] flex items-center justify-center bg-black border border-gray-700 overflow-hidden">
            {/* Legend */}
            <div className="absolute top-4 right-4 flex flex-col gap-1 z-10 bg-black p-2 border border-gray-700">
              {gearColors.map((c, i) => {
                const gear = i + 1;
                const isHovered = hoveredGear === gear;
                const isDimmed = hoveredGear !== null && !isHovered;
                return (
                  <div
                    key={gear}
                    className={`flex items-center gap-2 transition-opacity duration-200 ${isDimmed ? 'opacity-30' : 'opacity-100'} cursor-pointer`}
                    onMouseEnter={() => setHoveredGear(gear)}
                    onMouseLeave={() => setHoveredGear(null)}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }}></div>
                    <span className="text-[10px] font-mono text-gray-300">GEAR {gear}</span>
                  </div>
                );
              })}
            </div>

            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full p-4"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Base Track */}
              <path
                d={data.circuitLayout}
                fill="none"
                stroke="#1f2937"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Gear Segments */}
              {data.segments.map((segment, index) => (
                <path
                  key={index}
                  d={segment.path}
                  fill="none"
                  stroke={getGearColor(segment.gear)}
                  strokeWidth={hoveredGear === segment.gear ? '14' : '8'}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                  className="transition-all duration-200 cursor-pointer hover:opacity-100"
                  style={{
                    opacity: hoveredGear !== null && hoveredGear !== segment.gear ? 0.3 : 1,
                  }}
                  onMouseEnter={() => setHoveredGear(segment.gear)}
                  onMouseLeave={() => setHoveredGear(null)}
                />
              ))}
            </svg>

            {/* Tooltip for Hovered Gear */}
            {hoveredGear && (
              <div className="absolute bottom-4 left-4 bg-black/80 border border-gray-700 p-2 rounded backdrop-blur text-xs font-mono text-white pointer-events-none transition-all duration-200">
                Current Gear:{' '}
                <span
                  style={{ color: getGearColor(hoveredGear) }}
                  className="font-black text-lg ml-1"
                >
                  {hoveredGear}
                </span>
              </div>
            )}
          </div>
        );
      }}
      renderStats={(data) => {
        return (
          <div className="border-t border-gray-700 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 p-3 bg-black border border-gray-700">
                <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">
                  Most Used
                </span>
                <span
                  className="text-lg font-black font-mono"
                  style={{ color: getGearColor(data.stats.mostUsedGear) }}
                >
                  Gear {data.stats.mostUsedGear}
                </span>
              </div>
              {data.stats.avgGear != null && (
                <div className="flex flex-col gap-1 p-3 bg-black border border-gray-700">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">
                    Avg Gear
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {data.stats.avgGear.toFixed(1)}
                  </span>
                </div>
              )}
              {data.lapNumber != null && (
                <div className="flex flex-col gap-1 p-3 bg-black border border-gray-700">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">
                    Lap
                  </span>
                  <span className="text-lg font-black text-white font-mono">{data.lapNumber}</span>
                </div>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export { GearMapChart };
export default GearMapChart;
