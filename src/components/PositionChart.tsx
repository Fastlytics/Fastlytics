import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea,
  Label as RechartsLabel
} from 'recharts';
import { cn, exportChartAsImage } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchLapPositions, LapPositionDataPoint, SessionIncident, DetailedRaceResult } from '@/lib/api'; // Import new fetch function and type
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircle, Check, ChevronsUpDown, Download, Flag, Siren } from 'lucide-react';
import { driverColor } from '@/lib/driverColor'; // Use existing driver color mapping
import { groupDriversByTeam, getLineStylesForDriver } from '@/lib/teamUtils'; // Import team utilities
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip as ShadTooltip, TooltipContent as ShadTooltipContent, TooltipProvider, TooltipTrigger as ShadTooltipTrigger } from "@/components/ui/tooltip"; // Alias shadcn tooltip

interface PositionChartProps {
  className?: string;
  delay?: number;
  year: number;
  lapData: LapPositionDataPoint[];
  incidents?: SessionIncident[]; // Optional incidents data
  sessionResults?: DetailedRaceResult[]; // Optional results data
}

const PositionChart: React.FC<PositionChartProps> = ({
  className,
  delay = 0,
  year,
  lapData, // Use prop
  incidents = [], // Default to empty array
  sessionResults // Use prop
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // No internal fetching needed anymore
  const positionData = lapData;
  const isLoading = false; // Data is passed in, no loading state here
  const isError = false; // Assuming parent handles errors
  const error = null;

  // Extract driver codes from the first data point
  const driverCodes = useMemo(() => {
    if (!positionData || positionData.length === 0) return [];
    // Use sessionResults if available for a potentially more complete driver list
    // (covers drivers who might have DNFed early)
    if (sessionResults && sessionResults.length > 0) {
      return sessionResults.map(r => r.driverCode).sort();
    }
    // Fallback to lap data
    return Object.keys(positionData[0]).filter(key => key !== 'LapNumber').sort();
  }, [positionData, sessionResults]);

  // Initialize selected drivers when data loads or driver codes change
  useEffect(() => {
    if (driverCodes.length > 0) {
      setSelectedDrivers(driverCodes); // Select all by default
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

  // Handle chart download
  const handleDownload = async () => {
    if (!chartRef.current || !positionData || positionData.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      // Use a generic filename as event name isn't directly available here
      const filename = `race_position_changes_${year}`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Render States (Simplified as data is passed in) ---
  const renderContent = () => {
    if (!positionData || positionData.length === 0 || driverCodes.length === 0) {
     return (
        <div className="w-full h-[400px] bg-gray-900/80 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-500">
           No position data found or provided.
        </div>
      );
    }

    // Group drivers by team to determine styling
    const teamGroups = groupDriversByTeam(selectedDrivers, year);

    // --- Render Chart ---
    return (
      <ResponsiveContainer width="100%" height={400} className="export-chart-container">
        <LineChart data={positionData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.3)" />
          <XAxis
            dataKey="LapNumber"
            stroke="rgba(156, 163, 175, 0.7)"
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }}
            padding={{ left: 10, right: 10 }}
            label={{ value: 'Lap Number', position: 'insideBottom', offset: -5, fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }}
            allowDecimals={false}
          />
          <YAxis
            stroke="rgba(156, 163, 175, 0.7)"
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }}
            reversed={true}
            domain={[1, 'dataMax + 1']} // Domain from P1 up to max position + buffer
            interval={0} // Show ticks like P1, P2, P3...
            tickFormatter={(value) => `P${value}`}
            allowDecimals={false}
            width={45}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(71, 85, 105, 0.6)',
              color: '#E5E7EB',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              padding: '8px 12px'
            }}
            labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)', paddingBottom: '4px' }}
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
            cursor={{ stroke: 'rgba(156, 163, 175, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }}
            itemSorter={(item) => item.value === null ? Infinity : item.value}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
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
          
          {/* Render Incident Markers */}
          {incidents.map((incident, index) => (
            <ReferenceArea
              key={`incident-${index}`}
              x1={incident.startLap}
              x2={incident.endLap}
              y1={0} // Extend full height
              y2={22} // Adjust based on expected max positions
              ifOverflow="hidden"
              className={incident.type === 'RedFlag' ? "fill-red-500/20" : "fill-yellow-500/15"}
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
              />
            </ReferenceArea>
          ))}

          {/* Dynamically render lines for selected drivers */}
          {selectedDrivers.map((driverCode) => {
            const color = driverColor(driverCode, year);
            if (!driverCodes.includes(driverCode)) return null;
            let teammates: string[] = [];
            Object.values(teamGroups).forEach(drivers => {
              if (drivers.includes(driverCode)) teammates = drivers;
            });
            const lineStyle = getLineStylesForDriver(driverCode, teammates.filter(t => selectedDrivers.includes(t)), teammates.indexOf(driverCode)); // Ensure only selected teammates influence style
            return (
              <Line
                key={driverCode}
                type="monotone"
                dataKey={driverCode}
                stroke={color}
                strokeWidth={lineStyle.strokeWidth}
                strokeDasharray={lineStyle.strokeDasharray}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: color }}
                name={driverCode}
                connectNulls={false} // Don't connect across DNF/nulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card 
      ref={chartRef}
      className={cn("chart-container bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm animate-fade-in", className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-white">Lap-by-Lap Position Changes</CardTitle>
              <CardDescription className="text-xs text-gray-400">Track driver positions throughout the race. Use selector to filter.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Driver Selector Popover */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isPopoverOpen}
                  className="w-[180px] justify-between text-xs h-8 bg-gray-800/80 border-gray-700 hover:bg-gray-700/80"
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
              <PopoverContent className="w-[200px] p-0 bg-gray-900 border-gray-700 text-gray-200">
                  <div className="p-2 border-b border-gray-700 flex justify-between">
                      <Button variant="link" onClick={handleSelectAll} className="p-0 h-auto text-xs text-red-400 hover:text-red-300">All</Button>
                      <Button variant="link" onClick={handleSelectNone} className="p-0 h-auto text-xs text-red-400 hover:text-red-300">None</Button>
                  </div>
                  <ScrollArea className="h-[250px] p-2">
                      <div className="grid gap-2">
                          {driverCodes.map((driverCode) => (
                          <Label key={driverCode} className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-800 cursor-pointer">
                              <Checkbox
                                  id={`driver-${driverCode}`}
                                  checked={selectedDrivers.includes(driverCode)}
                                  onCheckedChange={() => handleDriverSelectionChange(driverCode)}
                                  className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 border-gray-600"
                              />
                              <span className="text-xs font-medium" style={{ color: driverColor(driverCode, year) }}>{driverCode}</span>
                          </Label>
                          ))}
                      </div>
                  </ScrollArea>
              </PopoverContent>
            </Popover>
            
            {/* Download Button */}
            <TooltipProvider>
              <ShadTooltip>
                <ShadTooltipTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700" 
                    onClick={handleDownload}
                    disabled={isExporting || !positionData || positionData.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </ShadTooltipTrigger>
                <ShadTooltipContent className="bg-black/80 text-white border-gray-700">
                  {isExporting ? "Exporting..." : "Download Chart"}
                </ShadTooltipContent>
              </ShadTooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default PositionChart;
