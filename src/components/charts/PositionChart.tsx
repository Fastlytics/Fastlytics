import React, { useState, useMemo, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  ReferenceLine,
  Label as RechartsLabel,
  Brush,
} from 'recharts';
import { cn } from '@/lib/utils';
import { LapPositionDataPoint, SessionIncident, DetailedRaceResult } from '@/lib/api';
import { Slider } from '@/components/ui/slider';
import { ArrowUpDownIcon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { groupDriversByTeam, getLineStylesForDriver } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

interface TooltipPayloadItem {
  value: number | null;
  name: string;
  color?: string;
}

// Extended LegendPayload type with custom id field
interface CustomLegendPayload {
  value?: string;
  color?: string;
  id?: string;
}

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip as ShadTooltip,
  TooltipContent as ShadTooltipContent,
  TooltipProvider,
  TooltipTrigger as ShadTooltipTrigger,
} from '@/components/ui/tooltip';

interface PositionChartProps {
  className?: string;
  delay?: number;
  year: number;
  lapData: LapPositionDataPoint[];
  incidents?: SessionIncident[];
  sessionResults?: DetailedRaceResult[];
  favoriteDriver?: string | null;
}

const PositionChart: React.FC<PositionChartProps> = ({
  className,
  delay = 0,
  year,
  lapData,
  incidents = [],
  sessionResults,
  favoriteDriver,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { trackInteraction } = useAnalytics();
  const chartVisRef = useChartVisibility({
    chartName: 'position_chart',
    page: 'race',
    meta: { year },
  });
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();
  const positionData = lapData;

  const driverCodes = useMemo(() => {
    if (!positionData || positionData.length === 0) return [];
    if (sessionResults && sessionResults.length > 0) {
      return sessionResults.map((r) => r.driverCode).sort();
    }
    return Object.keys(positionData[0])
      .filter((key) => key !== 'LapNumber')
      .sort();
  }, [positionData, sessionResults]);

  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(() => {
    if (!lapData || lapData.length === 0) return [];
    if (sessionResults && sessionResults.length > 0) {
      return sessionResults.map((r) => r.driverCode).sort();
    }
    return Object.keys(lapData[0])
      .filter((key) => key !== 'LapNumber')
      .sort();
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [focusedDriver, setFocusedDriver] = useState<string | null>(null);
  const [currentLap, setCurrentLap] = useState<number>(0);

  const toggleDriverFocus = (driver: string) => {
    setFocusedDriver((prev) => (prev === driver ? null : driver));
  };

  const handleDriverSelectionChange = (driverCode: string) => {
    trackInteraction('driver_toggled', { driver: driverCode, chart: 'position', year });
    setSelectedDrivers((prevSelected) =>
      prevSelected.includes(driverCode)
        ? prevSelected.filter((code) => code !== driverCode)
        : [...prevSelected, driverCode]
    );
  };

  const handleSelectAll = () => {
    trackInteraction('select_all_drivers', { chart: 'position', year });
    setSelectedDrivers(driverCodes);
  };

  const handleSelectNone = () => {
    trackInteraction('deselect_all_drivers', { chart: 'position', year });
    setSelectedDrivers([]);
  };

  const renderContent = () => {
    if (!positionData || positionData.length === 0 || driverCodes.length === 0) {
      return (
        <div className="w-full h-[400px] bg-black border border-gray-700 flex items-center justify-center text-gray-500 font-mono uppercase">
          No position data found or provided.
        </div>
      );
    }

    const teamGroups = groupDriversByTeam(selectedDrivers, year);

    return (
      <ResponsiveContainer width="100%" height={400} className="export-chart-container">
        <LineChart data={positionData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis
            dataKey="LapNumber"
            stroke="#666"
            tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
            padding={{ left: 10, right: 10 }}
            label={{
              value: 'Lap Number',
              position: 'insideBottom',
              offset: -5,
              fill: '#FFF',
              fontSize: 13,
              fontFamily: 'Geist Mono',
            }}
            allowDecimals={false}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
            reversed={true}
            domain={[1, 'dataMax + 1']}
            interval={0}
            tickFormatter={(value) => `P${value}`}
            allowDecimals={false}
            width={45}
          />
          <Brush
            dataKey="LapNumber"
            height={30}
            stroke="#333"
            fill="#111"
            tickFormatter={() => ''}
            travellerWidth={10}
          />
          <ReferenceLine x={currentLap} stroke="red" strokeDasharray="3 3" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              // Sort by position
              const typedPayload = payload as TooltipPayloadItem[];
              const sortedPayload = [...typedPayload].sort((a, b) => {
                if (a.value === null) return 1;
                if (b.value === null) return -1;
                return a.value - b.value;
              });

              return (
                <div className="bg-black border border-gray-700 p-3 shadow-xl max-w-[500px] z-50">
                  <div className="text-white font-black uppercase tracking-wider border-b border-gray-700 pb-2 mb-2 font-mono text-sm">
                    Lap {label}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                    {sortedPayload.map((entry) => {
                      const driverCode = entry.name;
                      const position = entry.value;
                      if (position === null) return null;

                      const headshot = getDriverImage(driverCode, year);
                      const color = entry.color;

                      return (
                        <div key={driverCode} className="flex items-center gap-2 min-w-[100px]">
                          <span
                            className="text-xs font-black font-mono w-5 text-right"
                            style={{ color }}
                          >
                            P{position}
                          </span>
                          <div className="w-6 h-6 rounded-full bg-black overflow-hidden shrink-0 border border-gray-700">
                            {headshot ? (
                              <img
                                src={headshot}
                                alt={driverCode}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">
                                {driverCode[0]}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-mono text-gray-300 font-black">
                            {driverCode}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontFamily: 'Geist Mono', fontSize: '12px' }}
            payload={selectedDrivers.map((driverCode) => {
              const color = driverColor(driverCode, year);
              let team = '';
              Object.entries(teamGroups).forEach(([teamName, drivers]) => {
                if (drivers.includes(driverCode)) team = teamName;
              });
              let teammates: string[] = [];
              Object.values(teamGroups).forEach((drivers) => {
                if (drivers.includes(driverCode)) teammates = drivers;
              });
              const selectedTeammates = teammates.filter((t) => selectedDrivers.includes(t));
              let lineStyle = '';
              if (selectedTeammates.length > 1) {
                const driverIndex = teammates.indexOf(driverCode);
                switch (driverIndex % 3) {
                  case 1:
                    lineStyle = 'dashed line';
                    break;
                  case 2:
                    lineStyle = 'dotted line';
                    break;
                }
              }
              const isInMultiDriverTeam = selectedTeammates.length > 1;
              return {
                value:
                  isInMultiDriverTeam && lineStyle !== ''
                    ? `${driverCode} - ${lineStyle}`
                    : driverCode,
                type: 'line',
                id: driverCode,
                color: color,
              };
            })}
            onClick={(e: CustomLegendPayload) => e && e.id && toggleDriverFocus(String(e.id))}
            onMouseEnter={(e: CustomLegendPayload) => e && e.id && setFocusedDriver(String(e.id))}
            onMouseLeave={() => setFocusedDriver(null)}
          />

          {incidents.map((incident, index) => (
            <ReferenceArea
              key={`incident-${index}`}
              x1={incident.startLap}
              x2={incident.endLap}
              y1={0}
              y2={22}
              ifOverflow="hidden"
              className={incident.type === 'RedFlag' ? 'fill-red-900/20' : 'fill-yellow-900/20'}
              stroke={incident.type === 'RedFlag' ? '#ef4444' : '#eab308'}
              strokeOpacity={0.3}
              strokeWidth={1}
            >
              <RechartsLabel
                value={incident.type === 'RedFlag' ? 'Red Flag' : 'SC/VSC'}
                position="insideTopLeft"
                offset={5}
                fill={incident.type === 'RedFlag' ? '#ef4444' : '#eab308'}
                fontSize={10}
                opacity={0.7}
                fontFamily="Geist Mono"
              />
            </ReferenceArea>
          ))}

          {selectedDrivers.map((driverCode) => {
            const color = driverColor(driverCode, year);
            if (!driverCodes.includes(driverCode)) return null;
            let teammates: string[] = [];
            Object.values(teamGroups).forEach((drivers) => {
              if (drivers.includes(driverCode)) teammates = drivers;
            });
            const lineStyle = getLineStylesForDriver(
              driverCode,
              teammates.filter((t) => selectedDrivers.includes(t)),
              teammates.indexOf(driverCode)
            );
            return (
              <Line
                key={driverCode}
                type="monotone"
                dataKey={driverCode}
                stroke={color}
                strokeWidth={lineStyle.strokeWidth}
                strokeDasharray={lineStyle.strokeDasharray}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: color }}
                name={driverCode}
                connectNulls={false}
                strokeOpacity={
                  focusedDriver
                    ? focusedDriver === driverCode
                      ? 1
                      : 0.1
                    : favoriteDriver &&
                        driverCode !== favoriteDriver &&
                        !selectedDrivers.includes(favoriteDriver)
                      ? 0.3
                      : 1
                }
                style={
                  favoriteDriver && driverCode === favoriteDriver
                    ? { filter: 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.8))' }
                    : undefined
                }
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div
      ref={(el) => {
        chartRef.current = el;
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn('bg-black p-0', className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-gray-700 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Lap-by-Lap Position Changes
            </h3>
            <ChartExportMenu
              onExport={(format) =>
                exportChart(format, {
                  title: 'Position Changes',
                  subtitle: 'Lap-by-lap position changes throughout the race',
                  year,
                  drivers: selectedDrivers,
                })
              }
              isExporting={isExporting}
            />
          </div>
          <p className="text-xs text-gray-400 font-mono uppercase">
            Track driver positions throughout the race.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isPopoverOpen}
                className="w-[180px] justify-between text-xs h-8 bg-black border-gray-700 text-white hover:bg-gray-800 hover:text-white rounded-none uppercase font-black tracking-wider"
                disabled={driverCodes.length === 0}
              >
                {selectedDrivers.length === driverCodes.length
                  ? 'All Drivers'
                  : selectedDrivers.length === 0
                    ? 'Select Drivers...'
                    : `${selectedDrivers.length} Selected`}
                <ArrowUpDownIcon className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-black border border-gray-700 text-white rounded-none">
              <div className="p-2 border-b border-gray-700 flex justify-between bg-black">
                <Button
                  variant="link"
                  onClick={handleSelectAll}
                  className="p-0 h-auto text-xs text-red-500 hover:text-red-400 font-black uppercase"
                >
                  All
                </Button>
                <Button
                  variant="link"
                  onClick={handleSelectNone}
                  className="p-0 h-auto text-xs text-red-500 hover:text-red-400 font-black uppercase"
                >
                  None
                </Button>
              </div>
              <ScrollArea className="h-[250px] p-2">
                <div className="grid gap-2">
                  {driverCodes.map((driverCode) => {
                    const headshot = getDriverImage(driverCode, year);
                    const formattedName = driverCode;
                    const isFavorite = favoriteDriver && driverCode === favoriteDriver;

                    return (
                      <Label
                        key={driverCode}
                        className={cn(
                          'flex items-center space-x-2 p-2 hover:bg-gray-800/30 cursor-pointer transition-colors',
                          isFavorite && 'bg-red-900/20 border-l-2 border-red-600',
                          focusedDriver && focusedDriver !== driverCode && 'opacity-30'
                        )}
                        onMouseEnter={() => setFocusedDriver(driverCode)}
                        onMouseLeave={() => setFocusedDriver(null)}
                      >
                        <Checkbox
                          id={`driver-${driverCode}`}
                          checked={selectedDrivers.includes(driverCode)}
                          onCheckedChange={() => handleDriverSelectionChange(driverCode)}
                          className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 border-gray-600 rounded-none"
                        />
                        <div className="flex items-center gap-3">
                          {headshot ? (
                            <img
                              src={headshot}
                              alt={driverCode}
                              className="w-6 h-6 object-cover object-top rounded-full bg-black"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-[10px] font-black text-gray-500">
                              {driverCode.substring(0, 1)}
                            </div>
                          )}
                          <span
                            className={cn(
                              'text-xs font-mono font-black',
                              isFavorite ? 'text-red-500' : 'text-white'
                            )}
                            style={{
                              color: !isFavorite ? driverColor(driverCode, year) : undefined,
                            }}
                          >
                            {formattedName}
                          </span>
                        </div>
                      </Label>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export { PositionChart };
export default PositionChart;
