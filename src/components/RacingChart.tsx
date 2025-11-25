import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn, exportChartAsImage } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
// Import API functions and types
import { fetchLapTimes, fetchSessionDrivers, SessionDriver, LapTimeDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1"; // Import the spinner
import { AlertCircle, Users, PlusCircle, XCircle, Download, BarChart2 } from 'lucide-react'; // Added BarChart2 icon
import { driverColor } from '@/lib/driverColor';
import { areTeammates, getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';
// Import Select components
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Use Card for layout
import { Button } from "@/components/ui/button"; // Import Button

// Helper function to format seconds into MM:SS.mmm
const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  // Pad seconds with leading zero if needed, keep 3 decimal places for milliseconds
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0'); // 6 = SS.mmm
  return `${minutes}:${formattedSeconds}`;
};

// Define props for the component
interface RacingChartProps {
  className?: string;
  delay?: number;
  year: number;
  event: string;
  session: string;
  initialDrivers?: string[];
  staticData?: LapTimeDataPoint[];
  title?: string;
  hideDownloadButton?: boolean; // Add this prop to control download button visibility
  autoLoad?: boolean; // Add this prop to auto-load the chart
}

// Constants for driver limits
const MIN_DRIVERS = 2;
const MAX_DRIVERS = 5;

const RacingChart: React.FC<RacingChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDrivers, // Should be length 2 to 5
  staticData, // Destructure the new prop
  hideDownloadButton = false, // Default to showing the download button
  autoLoad = false // Default to not auto-loading
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shouldLoadChart, setShouldLoadChart] = useState(autoLoad || !!staticData);

  // Validate initialDrivers prop length and clamp if necessary
  let validatedInitialDrivers = initialDrivers || [];
  if (!staticData) {
      if (validatedInitialDrivers.length < MIN_DRIVERS) {
          validatedInitialDrivers = []; // Don't set default drivers, let user choose
      } else if (validatedInitialDrivers.length > MAX_DRIVERS) {
          console.warn(`RacingChart received more than ${MAX_DRIVERS} initialDrivers. Clamping to ${MAX_DRIVERS}.`);
          validatedInitialDrivers = validatedInitialDrivers.slice(0, MAX_DRIVERS);
      }
  }

   // Always call useState at the top level
   const [selectedDrivers, setSelectedDrivers] = useState<string[]>(validatedInitialDrivers);

   // Determine which drivers to actually display/fetch for
   // Use validatedInitialDrivers if staticData is provided, otherwise use the state
   const driversToDisplay = staticData ? validatedInitialDrivers : selectedDrivers;

   // Fetch available drivers for the session (only if not using static data)
   const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity, // Driver list for a session won't change
    gcTime: 1000 * 60 * 60 * 24, // Keep for a day
    enabled: !staticData && !!year && !!event && !!session, // Disable if staticData is provided
  });

   // Fetch lap time data based on selected drivers (only if not using static data)
   // Use selectedDrivers state for the query key and function when fetching
   const { data: fetchedLapData, isLoading: isLoadingLapTimes, error, isError } = useQuery<LapTimeDataPoint[]>({
     // Sort drivers in the key for consistent caching regardless of selection order
     queryKey: ['lapTimes', year, event, session, ...selectedDrivers.sort()],
     queryFn: () => fetchLapTimes(year, event, session, selectedDrivers),
     staleTime: 1000 * 60 * 5,
     gcTime: 1000 * 60 * 15,
    retry: 1,
    // Ensure we have the minimum number of drivers selected before enabling fetch
    enabled: !staticData && !!year && !!event && !!session && selectedDrivers.length >= MIN_DRIVERS && shouldLoadChart,
  });

  // Use staticData if provided, otherwise use fetched data
  const lapData = staticData || fetchedLapData;

  // --- Driver Selection Handlers ---
  const handleDriverChange = (index: number, value: string) => {
    // Prevent selecting the same driver multiple times
    if (selectedDrivers.includes(value) && selectedDrivers[index] !== value) {
      console.warn("Driver already selected");
      return;
    }
    // This function should only be called when not using static data
    if (!staticData) {
      const newSelection = [...selectedDrivers];
      newSelection[index] = value;
      setSelectedDrivers(newSelection);
      
      // Reset chart loading state when driver changes
      if (shouldLoadChart) {
        setShouldLoadChart(false);
      }
    }
  };

  const addDriver = () => {
    if (selectedDrivers.length < MAX_DRIVERS && availableDrivers) {
      // Find the first available driver not already selected
      const nextDriver = availableDrivers.find(d => !selectedDrivers.includes(d.code));
      if (nextDriver) {
        setSelectedDrivers([...selectedDrivers, nextDriver.code]);
        // Reset chart loading state when adding a driver
        if (shouldLoadChart) {
          setShouldLoadChart(false);
        }
      } else {
        console.warn("No more available drivers to add.");
        // Optionally show a message to the user
      }
    }
  };

  const removeDriver = (indexToRemove: number) => {
    if (selectedDrivers.length > MIN_DRIVERS) {
      setSelectedDrivers(selectedDrivers.filter((_, index) => index !== indexToRemove));
      // Reset chart loading state when removing a driver
      if (shouldLoadChart) {
        setShouldLoadChart(false);
      }
    }
  };

  // Auto-load effect when autoLoad is true and we have enough drivers
  useEffect(() => {
    if (autoLoad && !staticData && availableDrivers && availableDrivers.length >= MIN_DRIVERS && selectedDrivers.length < MIN_DRIVERS) {
      // Auto-select first few drivers if none selected
      const firstDrivers = availableDrivers.slice(0, MIN_DRIVERS).map(d => d.code);
      setSelectedDrivers(firstDrivers);
      setShouldLoadChart(true);
    } else if (autoLoad && selectedDrivers.length >= MIN_DRIVERS && !shouldLoadChart) {
      setShouldLoadChart(true);
    }
  }, [autoLoad, availableDrivers, selectedDrivers.length, staticData, shouldLoadChart]);

  // Initialize with top drivers from session if available and no initialDrivers provided
  useEffect(() => {
    if (
      availableDrivers && 
      availableDrivers.length >= MIN_DRIVERS && 
      selectedDrivers.length === 0 && 
      !staticData
    ) {
      // Take the first 2 drivers by default
      setSelectedDrivers(availableDrivers.slice(0, MIN_DRIVERS).map(d => d.code));
    }
  }, [availableDrivers, selectedDrivers.length, staticData]);

  // Adjust isLoading check for static data
  const isLoading = !staticData && (isLoadingLapTimes);

  // Handle chart download
  const handleDownload = async () => {
    if (!chartRef.current || isLoading || !lapData || lapData.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      // Brief delay to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use event name and session for the filename
      const filename = `${event.toLowerCase().replace(/\s+/g, '-')}_${session.toLowerCase()}_lap_times_comparison`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Render States ---
  const renderContent = () => {
    // If chart shouldn't be loaded yet, show load button
    if (!shouldLoadChart && !staticData) {
      return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-900/50 rounded-lg gap-4">
          <p className="text-gray-400">Select drivers and click load to view lap time comparison</p>
          <Button 
            onClick={() => setShouldLoadChart(true)}
            variant="secondary"
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            disabled={selectedDrivers.length < MIN_DRIVERS || isLoadingDrivers}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Load Chart
          </Button>
        </div>
      );
    }

    if (isLoading) {
      // Use LoadingSpinnerF1 instead of Skeleton
      return (
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-900/50 rounded-lg">
          <LoadingSpinnerF1 />
        </div>
      );
    }
    if (isError || !lapData) {
      return (
        <div className="w-full h-[300px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">Error loading lap times</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
          {!staticData && (
            <Button 
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-gray-700 hover:bg-gray-800"
            >
              Back to Selection
            </Button>
          )}
        </div>
      );
    }
    if (lapData.length === 0) {
      return (
        <div className="w-full h-[300px] bg-gray-900/80 border border-gray-700/50 rounded-lg flex flex-col items-center justify-center text-gray-500">
          <p>No common lap data found for comparison.</p>
          {!staticData && (
            <Button 
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-gray-700 hover:bg-gray-800"
            >
              Back to Selection
            </Button>
          )}
        </div>
      );
    }

    // Group drivers by team to determine styling
    const teamGroups = groupDriversByTeam(driversToDisplay, year);

    // --- Render Chart ---
    return (
      <ResponsiveContainer width="100%" height={300} className="export-chart-container">
        <LineChart data={lapData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.3)" />
          <XAxis dataKey="LapNumber" stroke="rgba(156, 163, 175, 0.7)" tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} padding={{ left: 10, right: 10 }} />
          {/* Updated YAxis tickFormatter */}
          <YAxis stroke="rgba(156, 163, 175, 0.7)" tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={formatLapTime} allowDecimals={true} width={60} />
          {/* Updated Tooltip: isAnimationActive=false helps focus on single item */}
          <Tooltip
            isAnimationActive={false} // Prevent showing all lines on hover
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', // Darker, more solid background
              borderColor: 'rgba(71, 85, 105, 0.6)', 
              color: '#E5E7EB', 
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', // Stronger shadow
              padding: '8px 12px' // More padding
            }}
            labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)', paddingBottom: '4px' }}
            itemStyle={{ padding: '3px 0' }} // More padding between items
            formatter={(value: number | null, name: string, props) => {
                // Only return the value for the specific item being hovered (if active)
                // Note: This might still show multiple if lines overlap perfectly.
                // A fully custom tooltip might be needed for absolute single-item display.
                return [`${formatLapTime(value)}`, name];
            }}
            labelFormatter={(label) => `Lap ${label}`}
            // Sort items by lap time (ascending, so fastest driver comes first)
            itemSorter={(item) => {
              // Sort by lap time (null values at the end)
              return item.value === null ? Infinity : item.value;
            }}
            // cursor={{ stroke: 'rgba(156, 163, 175, 0.5)', strokeWidth: 1 }} // Optional: customize cursor line
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }} 
            formatter={(value, entry) => {
              // Find the team this driver belongs to
              let team = "";
              Object.entries(teamGroups).forEach(([teamName, drivers]) => {
                if (drivers.includes(value)) {
                  team = teamName;
                }
              });
              
              // Find teammates for this driver
              let teammates: string[] = [];
              Object.values(teamGroups).forEach(drivers => {
                if (drivers.includes(value)) {
                  teammates = drivers;
                }
              });
              
              // Determine driver's position in the team
              const driverIndex = teammates.indexOf(value);
              let lineStyle = "";
              
              // Add line style indicator if driver has teammates
              if (teammates.length > 1) {
                switch (driverIndex % 3) {
                  case 0:
                    lineStyle = "solid";
                    break;
                  case 1:
                    lineStyle = "dashed";
                    break;
                  case 2:
                    lineStyle = "dotted";
                    break;
                }
              }
              
              // Determine if driver is part of a team with multiple drivers
              const isInMultiDriverTeam = teammates.length > 1;
              
              // Return with team name and line style if multiple drivers from same team
              if (isInMultiDriverTeam) {
                return (
                  <span style={{ color: entry.color }}>
                    {value} ({team}) 
                    <span style={{ fontSize: '0.85em', opacity: 0.8 }}> - {lineStyle} line</span>
                  </span>
                );
              }
              
              // Regular driver display
              return <span style={{ color: entry.color }}>{value}</span>;
            }}
          />
          {/* Dynamically render lines */}
          {driversToDisplay.map((driverCode, index) => {
            const color = driverColor(driverCode, year); // Pass year to driverColor
            
            // Find teammates for this driver
            let teammates: string[] = [];
            Object.values(teamGroups).forEach(drivers => {
              if (drivers.includes(driverCode)) {
                teammates = drivers;
              }
            });
            
            // Get line style based on teammates
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
                activeDot={{ r: 5, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: color }}
                name={driverCode}
                connectNulls={true}
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
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-white">{title || 'Lap Time Comparison'}</CardTitle>
        </div>
        
        {/* Driver Selectors (Hide if using static data) */}
        {!staticData && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedDrivers.map((driverCode, index) => (
              <div key={index} className="flex items-center gap-1">
                <Select
                  value={driverCode}
                  onValueChange={(value) => handleDriverChange(index, value)}
                  disabled={isLoadingDrivers || !availableDrivers}
                >
                  <SelectTrigger className="w-full sm:w-[150px] bg-gray-800/80 border-gray-700 text-gray-200 text-xs h-8 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-gray-200 max-h-[200px]"> {/* Added max-height */}
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-500">Driver {index + 1}</SelectLabel>
                      {availableDrivers?.map((drv) => (
                        <SelectItem key={drv.code} value={drv.code} className="text-xs">
                          {drv.code} ({drv.name})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* Show remove button only if more than MIN_DRIVERS */}
                {selectedDrivers.length > MIN_DRIVERS && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-gray-700/50"
                    onClick={() => removeDriver(index)}
                    aria-label={`Remove Driver ${index + 1}`}
                    data-umami-event={`RacingChart Remove Driver - ${driverCode}`}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {/* Add Driver Button */}
            {selectedDrivers.length < MAX_DRIVERS && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
                onClick={addDriver}
                disabled={isLoadingDrivers || !availableDrivers}
                data-umami-event="RacingChart Add Driver Button"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Add Driver
              </Button>
            )}
          </div>
        )} {/* End conditional rendering for selectors */}
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
        {!hideDownloadButton && !isLoading && lapData && lapData.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 px-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-1.5 border border-gray-700" 
              onClick={handleDownload}
              disabled={isExporting}
              title="Download chart"
              data-umami-event="RacingChart Download Button"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? "Exporting..." : "Download Chart"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RacingChart;
