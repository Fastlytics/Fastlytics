import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchLapTimes, fetchSessionDrivers, SessionDriver, LapTimeDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircleIcon, PlusSignCircleIcon, CancelCircleIcon, Analytics01Icon, Time01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds}`;
};

interface RacingChartProps {
  className?: string;
  delay?: number;
  year: number;
  event: string;
  session: string;
  initialDrivers?: string[];
  staticData?: LapTimeDataPoint[];
  title?: string;
  autoLoad?: boolean;
}

const MIN_DRIVERS = 2;
const MAX_DRIVERS = 5;

const RacingChart: React.FC<RacingChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDrivers,
  staticData,
  autoLoad = false
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const [shouldLoadChart, setShouldLoadChart] = useState(autoLoad || !!staticData);

  let validatedInitialDrivers = initialDrivers || [];
  if (!staticData) {
    if (validatedInitialDrivers.length < MIN_DRIVERS) {
      validatedInitialDrivers = [];
    } else if (validatedInitialDrivers.length > MAX_DRIVERS) {
      validatedInitialDrivers = validatedInitialDrivers.slice(0, MAX_DRIVERS);
    }
  }

  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(validatedInitialDrivers);
  const driversToDisplay = staticData ? validatedInitialDrivers : selectedDrivers;

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !staticData && !!year && !!event && !!session,
  });

  const { data: fetchedLapData, isLoading: isLoadingLapTimes, error, isError } = useQuery<LapTimeDataPoint[]>({
    queryKey: ['lapTimes', year, event, session, ...selectedDrivers.sort()],
    queryFn: () => fetchLapTimes(year, event, session, selectedDrivers),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
    enabled: !staticData && !!year && !!event && !!session && selectedDrivers.length >= MIN_DRIVERS && shouldLoadChart,
  });

  const lapData = staticData || fetchedLapData;

  const handleDriverChange = (index: number, value: string) => {
    if (selectedDrivers.includes(value) && selectedDrivers[index] !== value) return;
    if (!staticData) {
      const newSelection = [...selectedDrivers];
      newSelection[index] = value;
      setSelectedDrivers(newSelection);
      if (shouldLoadChart) setShouldLoadChart(false);
    }
  };

  const addDriver = () => {
    if (selectedDrivers.length < MAX_DRIVERS && availableDrivers) {
      const nextDriver = availableDrivers.find(d => !selectedDrivers.includes(d.code));
      if (nextDriver) {
        setSelectedDrivers([...selectedDrivers, nextDriver.code]);
        if (shouldLoadChart) setShouldLoadChart(false);
      }
    }
  };

  const removeDriver = (indexToRemove: number) => {
    if (selectedDrivers.length > MIN_DRIVERS) {
      setSelectedDrivers(selectedDrivers.filter((_, index) => index !== indexToRemove));
      if (shouldLoadChart) setShouldLoadChart(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !staticData && availableDrivers && availableDrivers.length >= MIN_DRIVERS && selectedDrivers.length < MIN_DRIVERS) {
      const firstDrivers = availableDrivers.slice(0, MIN_DRIVERS).map(d => d.code);
      setSelectedDrivers(firstDrivers);
      setShouldLoadChart(true);
    } else if (autoLoad && selectedDrivers.length >= MIN_DRIVERS && !shouldLoadChart) {
      setShouldLoadChart(true);
    }
  }, [autoLoad, availableDrivers, selectedDrivers.length, staticData, shouldLoadChart]);

  useEffect(() => {
    if (availableDrivers && availableDrivers.length >= MIN_DRIVERS && selectedDrivers.length === 0 && !staticData) {
      setSelectedDrivers(availableDrivers.slice(0, MIN_DRIVERS).map(d => d.code));
    }
  }, [availableDrivers, selectedDrivers.length, staticData]);

  const isLoading = !staticData && (isLoadingLapTimes);

  // Calculate Fastest Laps
  const fastestLaps = useMemo(() => {
    if (!lapData || lapData.length === 0) return [];

    const stats = driversToDisplay.map(driver => {
      let minTime = Infinity;
      let lapNum = -1;

      lapData.forEach(point => {
        const time = point[driver] as number | null;
        if (time !== null && time < minTime) {
          minTime = time;
          lapNum = point.LapNumber;
        }
      });

      return {
        driver,
        fastestTime: minTime === Infinity ? null : minTime,
        lapNumber: lapNum
      };
    });

    // Sort by fastest time
    return stats.sort((a, b) => {
      if (a.fastestTime === null) return 1;
      if (b.fastestTime === null) return -1;
      return a.fastestTime - b.fastestTime;
    });
  }, [lapData, driversToDisplay]);

  const renderContent = () => {
    if (!shouldLoadChart && !staticData) {
      return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 gap-4">
          <p className="text-gray-400 font-mono text-sm uppercase">Select drivers to compare</p>
          <Button
            onClick={() => setShouldLoadChart(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-none"
            disabled={selectedDrivers.length < MIN_DRIVERS || isLoadingDrivers}
          >
            <Analytics01Icon className="w-4 h-4 mr-2" />
            Load Data
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-900/50 border border-gray-800">
          <LoadingSpinnerF1 />
        </div>
      );
    }
    if (isError || !lapData) {
      return (
        <div className="w-full h-[300px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500">
          <AlertCircleIcon className="w-10 h-10 mb-2" />
          <p className="font-bold uppercase">Error loading lap times</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded-none uppercase font-bold"
            >
              Back
            </Button>
          )}
        </div>
      );
    }
    if (lapData.length === 0) {
      return (
        <div className="w-full h-[300px] bg-black border border-gray-800 flex flex-col items-center justify-center text-gray-500 font-mono uppercase">
          <p>No common lap data found.</p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-gray-700 hover:bg-gray-800 rounded-none"
            >
              Back
            </Button>
          )}
        </div>
      );
    }

    const teamGroups = groupDriversByTeam(driversToDisplay, year);

    return (
      <>
        <ResponsiveContainer width="100%" height={400} className="export-chart-container mb-8">
          <LineChart data={lapData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis dataKey="LapNumber" stroke="#666" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} padding={{ left: 10, right: 10 }} />
            <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={formatLapTime} allowDecimals={true} width={60} />
            <Tooltip
              isAnimationActive={false}
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
              formatter={(value: number | null, name: string) => [`${formatLapTime(value)}`, name]}
              labelFormatter={(label) => `LAP ${label}`}
              itemSorter={(item) => item.value === null ? Infinity : item.value}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px', fontFamily: 'monospace', fontSize: '12px' }}
              formatter={(value, entry) => {
                let team = "";
                Object.entries(teamGroups).forEach(([teamName, drivers]) => {
                  if (drivers.includes(value)) team = teamName;
                });

                let teammates: string[] = [];
                Object.values(teamGroups).forEach(drivers => {
                  if (drivers.includes(value)) teammates = drivers;
                });

                const driverIndex = teammates.indexOf(value);
                let lineStyle = "";

                if (teammates.length > 1) {
                  switch (driverIndex % 3) {
                    case 0: lineStyle = "solid"; break;
                    case 1: lineStyle = "dashed"; break;
                    case 2: lineStyle = "dotted"; break;
                  }
                }

                const isInMultiDriverTeam = teammates.length > 1;

                if (isInMultiDriverTeam) {
                  return (
                    <span style={{ color: entry.color }}>
                      {value} ({team})
                      <span style={{ fontSize: '0.85em', opacity: 0.8 }}> - {lineStyle}</span>
                    </span>
                  );
                }
                return <span style={{ color: entry.color }}>{value}</span>;
              }}
            />
            {driversToDisplay.map((driverCode, index) => {
              const color = driverColor(driverCode, year);
              let teammates: string[] = [];
              Object.values(teamGroups).forEach(drivers => {
                if (drivers.includes(driverCode)) teammates = drivers;
              });
              const lineStyle = getLineStylesForDriver(driverCode, teammates, index);

              return (
                <Line
                  key={driverCode}
                  type="monotone"
                  dataKey={driverCode}
                  stroke={color}
                  strokeWidth={lineStyle.strokeWidth}
                  strokeDasharray={lineStyle.strokeDasharray}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                  name={driverCode}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Fastest Laps Table */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Time01Icon className="w-5 h-5 text-red-600" />
            <h4 className="text-sm font-black uppercase italic text-white">Fastest Laps (Selection)</h4>
          </div>
          <div className="overflow-hidden border border-gray-800 bg-gray-900/30">
            <Table>
              <TableHeader className="bg-gray-900/80">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8">Driver</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8 text-right">Time</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8 text-center">Lap</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8 text-right">Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fastestLaps.map((stat, index) => {
                  const gap = stat.fastestTime && fastestLaps[0].fastestTime
                    ? stat.fastestTime - fastestLaps[0].fastestTime
                    : null;
                  const color = driverColor(stat.driver, year);

                  return (
                    <TableRow key={stat.driver} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <TableCell className="py-2 font-mono font-bold" style={{ color }}>{stat.driver}</TableCell>
                      <TableCell className="py-2 text-right font-mono text-gray-300">
                        {formatLapTime(stat.fastestTime)}
                      </TableCell>
                      <TableCell className="py-2 text-center font-mono text-gray-500 text-xs">
                        {stat.lapNumber !== -1 ? `L${stat.lapNumber}` : '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs">
                        {index === 0 ? (
                          <span className="text-purple-400 font-bold">FASTEST</span>
                        ) : (
                          <span className="text-gray-500">
                            {gap !== null ? `+${gap.toFixed(3)}s` : '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      ref={chartRef}
      className={cn("bg-black border-2 border-gray-800 p-6", className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
          <span className="w-1 h-6 bg-red-600 block"></span>
          {title || 'Lap Time Comparison'}
        </h3>

        {!staticData && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedDrivers.map((driverCode, index) => (
              <div key={index} className="flex items-center gap-1">
                <Select
                  value={driverCode}
                  onValueChange={(value) => handleDriverChange(index, value)}
                  disabled={isLoadingDrivers || !availableDrivers}
                >
                  <SelectTrigger className="w-[100px] bg-gray-900 border-gray-700 text-white text-xs h-8 rounded-none focus:ring-red-600 font-mono font-bold">
                    <SelectValue placeholder="Driver" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-700 text-white rounded-none">
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-500 uppercase">Driver {index + 1}</SelectLabel>
                      {availableDrivers?.map((drv) => (
                        <SelectItem key={drv.code} value={drv.code} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
                          {drv.code}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedDrivers.length > MIN_DRIVERS && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-transparent"
                    onClick={() => removeDriver(index)}
                  >
                    <CancelCircleIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {selectedDrivers.length < MAX_DRIVERS && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-gray-700 text-gray-400 hover:bg-gray-900 hover:text-white rounded-none uppercase"
                onClick={addDriver}
                disabled={isLoadingDrivers || !availableDrivers}
              >
                <PlusSignCircleIcon className="h-3 w-3 mr-1.5" />
                Add
              </Button>
            )}
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

export default RacingChart;
