// knip-ignore
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
} from '@/lib/recharts-lazy';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TooltipPayloadItem {
  value: number | null;
  name: string;
  color?: string;
}

interface CustomLegendPayload {
  value?: string;
  color?: string;
  id?: string;
  dataKey?: string;
}

interface PositionChartProps {
  className?: string;
  delay?: number;
  year: number;
  lapData: LapPositionDataPoint[];
  incidents?: SessionIncident[];
  sessionResults?: DetailedRaceResult[];
  favoriteDriver?: string | null;
}

const inter = { fontFamily: "'Inter', sans-serif" } as const;
const EMPTY_INCIDENTS: SessionIncident[] = [];

const PositionChart: React.FC<PositionChartProps> = ({
  className,
  delay = 0,
  year,
  lapData,
  incidents = EMPTY_INCIDENTS,
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

  const driverNameMap = useMemo(() => {
    if (!sessionResults) return new Map<string, string>();
    const map = new Map<string, string>();
    sessionResults.forEach((r) => {
      if (r.driverCode && r.fullName) map.set(r.driverCode, r.fullName);
    });
    return map;
  }, [sessionResults]);

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

  const getLegendDriverCode = (entry?: CustomLegendPayload | null) => {
    if (!entry) return null;

    const rawDriverCode = entry.dataKey || entry.id || entry.value;
    if (!rawDriverCode) return null;

    return String(rawDriverCode).replace(/\s+\((?:dashed|dotted)\)$/, '');
  };

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

  return (
    <div
      ref={(el) => {
        chartRef.current = el;
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn('', className)}
      style={{ animationDelay: `${delay * 100}ms`, ...inter } as React.CSSProperties}
    >
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-end gap-3">
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
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isPopoverOpen}
                aria-controls="position-chart-driver-list"
                className="w-auto min-w-[180px] justify-between text-[11px] font-semibold h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06] hover:text-white uppercase tracking-wider"
                disabled={driverCodes.length === 0}
              >
                {selectedDrivers.length === driverCodes.length
                  ? 'All Drivers'
                  : selectedDrivers.length === 0
                    ? 'Select Drivers...'
                    : `${selectedDrivers.length} Selected`}
                <ArrowUpDownIcon className="ml-2 size-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              id="position-chart-driver-list"
              className="w-[280px] p-1.5 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
              style={inter}
            >
              <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-white/[0.06] pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                  {selectedDrivers.length} / {driverCodes.length} visible
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={handleSelectAll}
                    className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                  >
                    All
                  </button>
                  <button
                    onClick={handleSelectNone}
                    className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="grid gap-0.5">
                  {driverCodes.map((driverCode) => {
                    const headshot = getDriverImage(driverCode, year);
                    const fullName = driverNameMap.get(driverCode) || driverCode;
                    const isSelected = selectedDrivers.includes(driverCode);
                    const isFavorite = favoriteDriver && driverCode === favoriteDriver;
                    const dColor = driverColor(driverCode, year);

                    return (
                      <button
                        key={driverCode}
                        onClick={() => handleDriverSelectionChange(driverCode)}
                        className={cn(
                          'flex items-center gap-3 w-full px-2.5 py-2 rounded-lg transition-all text-left',
                          isSelected ? 'bg-white/[0.04]' : 'opacity-50 hover:opacity-70',
                          isFavorite && isSelected && 'bg-red-500/[0.06]',
                          focusedDriver && focusedDriver !== driverCode && '!opacity-20'
                        )}
                        onMouseEnter={() => setFocusedDriver(driverCode)}
                        onMouseLeave={() => setFocusedDriver(null)}
                      >
                        {/* Check indicator */}
                        <div
                          className={cn(
                            'size-4 rounded shrink-0 flex items-center justify-center border transition-all',
                            isSelected
                              ? 'bg-red-500 border-red-500'
                              : 'border-white/[0.15] bg-transparent'
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="size-2.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>

                        {/* Team color bar */}
                        <div
                          className={cn(
                            'h-8 w-0.5 rounded-full shrink-0 transition-opacity',
                            isSelected ? 'opacity-100' : 'opacity-30'
                          )}
                          style={{ backgroundColor: dColor }}
                        />

                        {/* Headshot */}
                        <Avatar className="size-8 shrink-0 border border-white/[0.08]">
                          <AvatarImage src={headshot} className="object-cover object-top" />
                          <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                            {driverCode[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={cn(
                              'text-[12px] font-semibold truncate transition-colors',
                              isFavorite ? 'text-red-400' : isSelected ? 'text-white' : 'text-white'
                            )}
                          >
                            {fullName}
                          </span>
                          <span className="text-[10px] font-medium text-white/80">
                            {driverCode}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <PositionContent />
    </div>
  );
};

export { PositionChart };

const PositionContent: React.FC<Record<string, unknown>> = () => {
  if (!positionData || positionData.length === 0 || driverCodes.length === 0) {
    return (
      <div className="w-full h-[480px] flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-[13px] font-medium uppercase tracking-wider">
        No position data found or provided.
      </div>
    );
  }

  const teamGroups = groupDriversByTeam(selectedDrivers, year);

  return (
    <ResponsiveContainer width="100%" height={480} className="export-chart-container">
      <LineChart data={positionData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="LapNumber"
          stroke="rgba(255,255,255,0.15)"
          tick={{
            fill: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
          padding={{ left: 10, right: 10 }}
          label={{
            value: 'LAP NUMBER',
            position: 'insideBottom',
            offset: -5,
            fill: 'rgba(255,255,255,0.4)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
          allowDecimals={false}
        />
        <YAxis
          stroke="rgba(255,255,255,0.15)"
          tick={{
            fill: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
          reversed={true}
          domain={[1, 'dataMax + 1']}
          interval={0}
          tickFormatter={(value) => `P${value}`}
          allowDecimals={false}
          width={40}
        />
        <Brush
          dataKey="LapNumber"
          height={24}
          stroke="rgba(255,255,255,0.1)"
          fill="rgba(255,255,255,0.03)"
          tickFormatter={() => ''}
          travellerWidth={8}
        />
        <ReferenceLine x={currentLap} stroke="#ef4444" strokeDasharray="3 3" />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const typedPayload = payload as TooltipPayloadItem[];
            const sortedPayload = typedPayload.toSorted((a, b) => {
              if (a.value === null) return 1;
              if (b.value === null) return -1;
              return a.value - b.value;
            });

            return (
              <div
                className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl max-w-[500px] z-50"
                style={inter}
              >
                <div className="text-white font-bold uppercase tracking-wider border-b border-white/[0.06] pb-2 mb-2 text-[12px]">
                  Lap {label}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                  {sortedPayload.map((entry) => {
                    const driverCode = entry.name;
                    const position = entry.value;
                    if (position === null) return null;

                    const headshot = getDriverImage(driverCode, year);
                    const color = entry.color;
                    const fullName = driverNameMap.get(driverCode) || driverCode;

                    return (
                      <div key={driverCode} className="flex items-center gap-2 min-w-[100px]">
                        <span className="text-[11px] font-bold w-5 text-right" style={{ color }}>
                          P{position}
                        </span>
                        <Avatar className="size-6 shrink-0 border border-white/[0.08]">
                          <AvatarImage src={headshot} className="object-cover object-top" />
                          <AvatarFallback className="bg-[#1a1a1e] text-[8px] font-bold text-white">
                            {driverCode[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-semibold text-white/80 truncate">
                          {fullName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
          cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}
          payload={selectedDrivers.map((driverCode) => {
            const color = driverColor(driverCode, year);
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
                  lineStyle = 'dashed';
                  break;
                case 2:
                  lineStyle = 'dotted';
                  break;
              }
            }
            const isInMultiDriverTeam = selectedTeammates.length > 1;
            return {
              value:
                isInMultiDriverTeam && lineStyle !== ''
                  ? `${driverCode} (${lineStyle})`
                  : driverCode,
              type: 'line',
              id: driverCode,
              dataKey: driverCode,
              color: color,
            };
          })}
          onClick={(e: CustomLegendPayload) => {
            const driverCode = getLegendDriverCode(e);
            if (driverCode) toggleDriverFocus(driverCode);
          }}
          onMouseEnter={(e: CustomLegendPayload) => {
            const driverCode = getLegendDriverCode(e);
            if (driverCode) setFocusedDriver(driverCode);
          }}
          onMouseLeave={() => setFocusedDriver(null)}
          formatter={(value, entry) => {
            const driverCode = getLegendDriverCode(entry as CustomLegendPayload) || String(value);
            const isFocused = focusedDriver === driverCode;
            const isDimmed = focusedDriver && focusedDriver !== driverCode;

            return (
              <span
                style={{
                  color: entry.color,
                  opacity: isDimmed ? 0.3 : 1,
                  fontWeight: isFocused ? 700 : 400,
                }}
              >
                {value}
              </span>
            );
          }}
        />

        {incidents.map((incident) => (
          <ReferenceArea
            key={`${incident.type}-${incident.startLap}-${incident.endLap}`}
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
              fontWeight={600}
              fontFamily="Inter, sans-serif"
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
              strokeWidth={focusedDriver === driverCode ? 4 : lineStyle.strokeWidth}
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

export default PositionChart;
