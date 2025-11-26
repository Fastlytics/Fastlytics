import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea,
  Label as RechartsLabel
} from 'recharts';
import { cn, exportChartAsImage } from "@/lib/utils";
import { LapPositionDataPoint, SessionIncident, DetailedRaceResult } from '@/lib/api';
import { ChevronsUpDown, Download } from 'lucide-react';
import { driverColor } from '@/lib/driverColor';
import { groupDriversByTeam, getLineStylesForDriver } from '@/lib/teamUtils';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip as ShadTooltip, TooltipContent as ShadTooltipContent, TooltipProvider, TooltipTrigger as ShadTooltipTrigger } from "@/components/ui/tooltip";

interface PositionChartProps {
  className?: string;
  delay?: number;
  year: number;
  lapData: LapPositionDataPoint[];
  incidents?: SessionIncident[];
  sessionResults?: DetailedRaceResult[];
}

const PositionChart: React.FC<PositionChartProps> = ({
  className,
  delay = 0,
  year,
  lapData,
  incidents = [],
  sessionResults
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const positionData = lapData;

  const driverCodes = useMemo(() => {
    if (!positionData || positionData.length === 0) return [];
    if (sessionResults && sessionResults.length > 0) {
      return sessionResults.map(r => r.driverCode).sort();
    }
    return Object.keys(positionData[0]).filter(key => key !== 'LapNumber').sort();
  }, [positionData, sessionResults]);

  useEffect(() => {
    if (driverCodes.length > 0) {
      setSelectedDrivers(driverCodes);
    } else {
      setSelectedDrivers([]);
    }
  }, [driverCodes]);

  const handleDriverSelectionChange = (driverCode: string) => {
    setSelectedDrivers(prevSelected =>
      prevSelected.includes(driverCode)
        ? prevSelected.filter(code => code !== driverCode)
        : [...prevSelected, driverCode]
    );
  };

  const handleSelectAll = () => {
    setSelectedDrivers(driverCodes);
  };

  const handleSelectNone = () => {
    setSelectedDrivers([]);
  };

  const handleDownload = async () => {
    if (!chartRef.current || !positionData || positionData.length === 0) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const filename = `race_position_changes_${year}`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = () => {
    if (!positionData || positionData.length === 0 || driverCodes.length === 0) {
      return (
        <div className="w-full h-[400px] bg-gray-900/50 border border-gray-800 flex items-center justify-center text-gray-500 font-mono uppercase">
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
            tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
            padding={{ left: 10, right: 10 }}
            label={{ value: 'Lap Number', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
            allowDecimals={false}
          />
          <YAxis
            stroke="#666"
            tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
            reversed={true}
            domain={[1, 'dataMax + 1']}
            interval={0}
            tickFormatter={(value) => `P${value}`}
            allowDecimals={false}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000',
              borderColor: '#333',
              color: '#fff',
              borderRadius: '0px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
              padding: '8px 12px',
              fontFamily: 'monospace'
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' }}
            itemStyle={{ padding: '3px 0' }}
            formatter={(value: number | null, name: string) => {
              if (value === null) return ['DNF/N/A', name];
              const color = driverColor(name, year);
              return [
                <span style={{ color: color }}>P{value}</span>,
                name
              ];
            }}
            labelFormatter={(label) => `Lap ${label}`}
            cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }}
            itemSorter={(item) => item.value === null ? Infinity : item.value}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontFamily: 'monospace', fontSize: '12px' }}
            payload={selectedDrivers.map(driverCode => {
              const color = driverColor(driverCode, year);
              let team = "";
              Object.entries(teamGroups).forEach(([teamName, drivers]) => {
                if (drivers.includes(driverCode)) team = teamName;
              });
              let teammates: string[] = [];
              Object.values(teamGroups).forEach(drivers => {
                if (drivers.includes(driverCode)) teammates = drivers;
              });
              const selectedTeammates = teammates.filter(t => selectedDrivers.includes(t));
              let lineStyle = "";
              if (selectedTeammates.length > 1) {
                const driverIndex = teammates.indexOf(driverCode);
                switch (driverIndex % 3) {
                  case 1: lineStyle = "dashed line"; break;
                  case 2: lineStyle = "dotted line"; break;
                }
              }
              const isInMultiDriverTeam = selectedTeammates.length > 1;
              return {
                value: isInMultiDriverTeam && lineStyle !== "" ? `${driverCode} - ${lineStyle}` : driverCode,
                type: 'line', id: driverCode, color: color
              };
            })}
          />

          {incidents.map((incident, index) => (
            <ReferenceArea
              key={`incident-${index}`}
              x1={incident.startLap}
              x2={incident.endLap}
              y1={0}
              y2={22}
              ifOverflow="hidden"
              className={incident.type === 'RedFlag' ? "fill-red-900/20" : "fill-yellow-900/20"}
              stroke={incident.type === 'RedFlag' ? "#ef4444" : "#eab308"}
              strokeOpacity={0.3}
              strokeWidth={1}
            >
              <RechartsLabel
                value={incident.type === 'RedFlag' ? "Red Flag" : "SC/VSC"}
                position="insideTopLeft"
                offset={5}
                fill={incident.type === 'RedFlag' ? "#ef4444" : "#eab308"}
                fontSize={10}
                opacity={0.7}
                fontFamily="monospace"
              />
            </ReferenceArea>
          ))}

          {selectedDrivers.map((driverCode) => {
            const color = driverColor(driverCode, year);
            if (!driverCodes.includes(driverCode)) return null;
            let teammates: string[] = [];
            Object.values(teamGroups).forEach(drivers => {
              if (drivers.includes(driverCode)) teammates = drivers;
            });
            const lineStyle = getLineStylesForDriver(driverCode, teammates.filter(t => selectedDrivers.includes(t)), teammates.indexOf(driverCode));
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
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div
      ref={chartRef}
      className={cn("bg-black border-2 border-gray-800 p-6", className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-gray-800 pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Lap-by-Lap Position Changes</h3>
          <p className="text-xs text-gray-400 font-mono uppercase">Track driver positions throughout the race.</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isPopoverOpen}
                className="w-[180px] justify-between text-xs h-8 bg-gray-900 border-gray-700 text-white hover:bg-gray-800 hover:text-white rounded-none uppercase font-bold tracking-wider"
                disabled={driverCodes.length === 0}
              >
                {selectedDrivers.length === driverCodes.length
                  ? "All Drivers"
                  : selectedDrivers.length === 0
                    ? "Select Drivers..."
                    : `${selectedDrivers.length} Selected`
                }
                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-black border-2 border-gray-800 text-white rounded-none">
              <div className="p-2 border-b border-gray-800 flex justify-between bg-gray-900">
                <Button variant="link" onClick={handleSelectAll} className="p-0 h-auto text-xs text-red-500 hover:text-red-400 font-bold uppercase">All</Button>
                <Button variant="link" onClick={handleSelectNone} className="p-0 h-auto text-xs text-red-500 hover:text-red-400 font-bold uppercase">None</Button>
              </div>
              <ScrollArea className="h-[250px] p-2">
                <div className="grid gap-2">
                  {driverCodes.map((driverCode) => (
                    <Label key={driverCode} className="flex items-center space-x-2 p-1.5 hover:bg-gray-900 cursor-pointer">
                      <Checkbox
                        id={`driver-${driverCode}`}
                        checked={selectedDrivers.includes(driverCode)}
                        onCheckedChange={() => handleDriverSelectionChange(driverCode)}
                        className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 border-gray-600 rounded-none"
                      />
                      <span className="text-xs font-mono font-bold" style={{ color: driverColor(driverCode, year) }}>{driverCode}</span>
                    </Label>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <ShadTooltip>
              <ShadTooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-white hover:bg-transparent"
                  onClick={handleDownload}
                  disabled={isExporting || !positionData || positionData.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </ShadTooltipTrigger>
              <ShadTooltipContent className="bg-black border border-gray-800 text-white rounded-none text-xs uppercase font-bold">
                {isExporting ? "Exporting..." : "Download Chart"}
              </ShadTooltipContent>
            </ShadTooltip>
          </TooltipProvider>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default PositionChart;
