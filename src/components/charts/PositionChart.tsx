// knip-ignore
import React, { useState, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Label as RechartsLabel,
} from '@/lib/recharts-lazy';
import { cn } from '@/lib/utils';
import { LapPositionDataPoint, SessionIncident, DetailedRaceResult } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { groupDriversByTeam, getLineStylesForDriver } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TooltipPayloadItem {
  value: number | null;
  name: string;
  color?: string;
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
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      {/* Controls row */}
      <div className="mb-4 flex items-center justify-between">
        {/* Driver count badge */}
        <span className="text-[13px] font-medium tabular-nums text-white/80">
          {selectedDrivers.length} of {driverCodes.length} drivers visible
        </span>

        <div className="flex items-center gap-2">
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
                className="h-7 min-w-[140px] justify-between rounded-md border border-white/[0.06] bg-transparent px-2.5 text-[13px] font-medium text-white hover:border-white/[0.12] hover:bg-white/[0.02] hover:text-white"
                disabled={driverCodes.length === 0}
              >
                {selectedDrivers.length === driverCodes.length
                  ? 'All Drivers'
                  : selectedDrivers.length === 0
                    ? 'Select Drivers'
                    : `${selectedDrivers.length} Selected`}
                <svg
                  className="ml-1.5 size-3 shrink-0 opacity-40"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              id="position-chart-driver-list"
              className="w-[260px] rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-0 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.04] px-3 py-2">
                <span className="text-[12px] font-medium text-white">Drivers</span>
                <div className="flex gap-0.5">
                  <button
                    onClick={handleSelectAll}
                    className="rounded px-2 py-0.5 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    All
                  </button>
                  <button
                    onClick={handleSelectNone}
                    className="rounded px-2 py-0.5 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    None
                  </button>
                </div>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="p-1">
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
                          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors',
                          isSelected
                            ? 'bg-white/[0.03] hover:bg-white/[0.05]'
                            : 'opacity-40 hover:opacity-60'
                        )}
                        onMouseEnter={() => setFocusedDriver(driverCode)}
                        onMouseLeave={() => setFocusedDriver(null)}
                      >
                        {/* Team color indicator */}
                        <div
                          className="h-5 w-[3px] shrink-0 rounded-full transition-opacity"
                          style={{
                            backgroundColor: dColor,
                            opacity: isSelected ? 1 : 0.3,
                          }}
                        />

                        {/* Headshot */}
                        <Avatar className="size-6 shrink-0 border border-white/[0.06]">
                          <AvatarImage src={headshot} className="object-cover object-top" />
                          <AvatarFallback className="bg-white/[0.03] text-[15px] font-medium text-white">
                            {driverCode[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name + code */}
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span
                            className={cn(
                              'truncate text-[14px] transition-colors',
                              isSelected ? 'text-white' : 'text-white',
                              isFavorite && 'text-red-400'
                            )}
                          >
                            {fullName}
                          </span>
                          <span className="shrink-0 font-mono text-[14px] text-white">
                            {driverCode}
                          </span>
                        </div>

                        {/* Check */}
                        {isSelected && (
                          <svg
                            className="size-3 shrink-0 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Chart */}
      <PositionContent
        positionData={positionData}
        driverCodes={driverCodes}
        selectedDrivers={selectedDrivers}
        year={year}
        incidents={incidents}
        focusedDriver={focusedDriver}
        favoriteDriver={favoriteDriver}
        setFocusedDriver={setFocusedDriver}
        driverNameMap={driverNameMap}
      />

      {/* Legend grid */}
      <DriverLegend
        selectedDrivers={selectedDrivers}
        year={year}
        focusedDriver={focusedDriver}
        favoriteDriver={favoriteDriver}
        setFocusedDriver={setFocusedDriver}
        driverNameMap={driverNameMap}
      />
    </div>
  );
};

export { PositionChart };

// ---------------------------------------------------------------------------
// Driver Legend (replaces Recharts Legend)
// ---------------------------------------------------------------------------

interface DriverLegendProps {
  selectedDrivers: string[];
  year: number;
  focusedDriver: string | null;
  favoriteDriver?: string | null;
  setFocusedDriver: Dispatch<SetStateAction<string | null>>;
  driverNameMap: Map<string, string>;
}

const DriverLegend: React.FC<DriverLegendProps> = ({
  selectedDrivers,
  year,
  focusedDriver,
  favoriteDriver,
  setFocusedDriver,
  driverNameMap,
}) => {
  const teamGroups = groupDriversByTeam(selectedDrivers, year);

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 border-t border-white/[0.04] pt-3">
      {selectedDrivers.map((driverCode) => {
        const color = driverColor(driverCode, year);
        const isDimmed = focusedDriver && focusedDriver !== driverCode;
        const isFocused = focusedDriver === driverCode;
        const isFavorite = favoriteDriver && driverCode === favoriteDriver;

        // Determine line style for legend indicator
        let teammates: string[] = [];
        Object.values(teamGroups).forEach((drivers) => {
          if (drivers.includes(driverCode)) teammates = drivers;
        });
        const selectedTeammates = teammates.filter((t) => selectedDrivers.includes(t));
        const driverIndex = teammates.indexOf(driverCode);
        const isDashed = selectedTeammates.length > 1 && driverIndex % 3 === 1;
        const isDotted = selectedTeammates.length > 1 && driverIndex % 3 === 2;

        return (
          <button
            key={driverCode}
            className={cn(
              'flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-all',
              isDimmed ? 'opacity-20' : 'opacity-100',
              isFocused && 'bg-white/[0.04]'
            )}
            onMouseEnter={() => setFocusedDriver(driverCode)}
            onMouseLeave={() => setFocusedDriver(null)}
            onClick={() => setFocusedDriver((prev) => (prev === driverCode ? null : driverCode))}
          >
            {/* Line indicator */}
            <span
              className={cn('inline-block h-[2px] w-3 rounded-full')}
              style={{
                backgroundColor: color,
                ...(isDashed
                  ? {
                      background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 4px, transparent 4px, transparent 6px)`,
                    }
                  : {}),
                ...(isDotted
                  ? {
                      background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 2px, transparent 2px, transparent 4px)`,
                    }
                  : {}),
              }}
            />
            <span
              className={cn(
                'text-[11px] font-medium tabular-nums transition-colors',
                isFavorite ? 'text-red-400' : 'text-white/80'
              )}
            >
              {driverNameMap.get(driverCode) || driverCode}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chart Content
// ---------------------------------------------------------------------------

interface PositionContentProps {
  positionData: LapPositionDataPoint[];
  driverCodes: string[];
  selectedDrivers: string[];
  year: number;
  incidents: SessionIncident[];
  focusedDriver: string | null;
  favoriteDriver?: string | null;
  setFocusedDriver: Dispatch<SetStateAction<string | null>>;
  driverNameMap: Map<string, string>;
}

const PositionContent: React.FC<PositionContentProps> = ({
  positionData,
  driverCodes,
  selectedDrivers,
  year,
  incidents,
  focusedDriver,
  favoriteDriver,
  setFocusedDriver,
  driverNameMap,
}) => {
  if (!positionData || positionData.length === 0 || driverCodes.length === 0) {
    return (
      <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-white/[0.04] text-[14px] text-white">
        No position data available
      </div>
    );
  }

  const teamGroups = groupDriversByTeam(selectedDrivers, year);

  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
      <ResponsiveContainer width="100%" height={420} className="export-chart-container">
        <LineChart data={positionData} margin={{ top: 12, right: 16, left: -8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="none" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis
            dataKey="LapNumber"
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            padding={{ left: 8, right: 8 }}
            allowDecimals={false}
            label={{
              value: 'Lap',
              position: 'insideBottomRight',
              offset: -4,
              fill: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
            tickLine={false}
            axisLine={false}
            reversed={true}
            domain={[1, 'dataMax + 1']}
            interval={0}
            tickFormatter={(value) => `P${value}`}
            allowDecimals={false}
            width={36}
          />
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
                <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-3 shadow-2xl">
                  <div className="mb-2 border-b border-white/[0.04] pb-2 font-mono text-[13px] font-medium tabular-nums text-white">
                    Lap {label}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                    {sortedPayload.map((entry) => {
                      const driverCode = entry.name;
                      const position = entry.value;
                      if (position === null) return null;

                      const headshot = getDriverImage(driverCode, year);
                      const color = entry.color;
                      const fullName = driverNameMap.get(driverCode) || driverCode;

                      return (
                        <div key={driverCode} className="flex items-center gap-1.5 min-w-[90px]">
                          <span
                            className="font-mono text-[13px] font-semibold tabular-nums w-5 text-right"
                            style={{ color }}
                          >
                            P{position}
                          </span>
                          <Avatar className="size-5 shrink-0 border border-white/[0.06]">
                            <AvatarImage src={headshot} className="object-cover object-top" />
                            <AvatarFallback className="bg-white/[0.03] text-[7px] font-medium text-white">
                              {driverCode[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-[13px] text-white">{fullName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
          />

          {/* Incident zones */}
          {incidents.map((incident) => (
            <ReferenceArea
              key={`${incident.type}-${incident.startLap}-${incident.endLap}`}
              x1={incident.startLap}
              x2={incident.endLap}
              y1={0}
              y2={22}
              ifOverflow="hidden"
              fill={incident.type === 'RedFlag' ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)'}
              stroke={incident.type === 'RedFlag' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}
              strokeWidth={1}
            >
              <RechartsLabel
                value={incident.type === 'RedFlag' ? 'RED' : 'SC'}
                position="insideTopLeft"
                offset={4}
                fill={incident.type === 'RedFlag' ? 'rgba(239,68,68,0.6)' : 'rgba(234,179,8,0.6)'}
                fontSize={9}
                fontWeight={600}
                fontFamily="Inter, sans-serif"
              />
            </ReferenceArea>
          ))}

          {/* Driver lines */}
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

            const isFocused = focusedDriver === driverCode;
            const isDimmed = focusedDriver && !isFocused;

            return (
              <Line
                key={driverCode}
                type="monotone"
                dataKey={driverCode}
                stroke={color}
                strokeWidth={isFocused ? 3 : lineStyle.strokeWidth}
                strokeDasharray={lineStyle.strokeDasharray}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 0,
                  fill: color,
                  onMouseEnter: () => setFocusedDriver(driverCode),
                  onMouseLeave: () => setFocusedDriver(null),
                }}
                name={driverCode}
                connectNulls={false}
                strokeOpacity={isDimmed ? 0.08 : 1}
                style={
                  favoriteDriver && driverCode === favoriteDriver
                    ? { filter: 'drop-shadow(0 0 3px rgba(220, 38, 38, 0.6))' }
                    : undefined
                }
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PositionChart;
