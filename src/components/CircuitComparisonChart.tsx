import React, { useState, useEffect, useMemo, useRef } from 'react'; // Import useMemo and useRef
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
// Import new API function and update existing one
import { fetchSessionDrivers, fetchSectorComparison, fetchDriverLapNumbers, fetchTelemetrySpeed, fetchLapTimes, SessionDriver, SectorComparisonData, SpeedDataPoint, LapTimeDataPoint } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { cn, exportChartAsImage } from "@/lib/utils";
import { User, Clock, Download, BarChart2 } from 'lucide-react'; // Import icons including Download and BarChart2
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircle } from 'lucide-react';
import { areTeammates } from '@/lib/teamUtils';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Interface definitions
interface CircuitComparisonChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver1?: string;
  initialDriver2?: string;
  onDriversSelected?: (data: {driver1: string, driver2: string, lap1: string | number, lap2: string | number, shouldLoadChart: boolean}) => void;
}

// Define a new interface for lap time information
interface LapTimeInfo {
  lapNumber: number;
  lapTime: string; // formatted as "1:23.456"
  lapTimeRaw: number; // raw time in seconds
}

// Note: TrackSection and SectorComparisonData interfaces remain the same as before

// Define circuit comparison chart component
const CircuitComparisonChart: React.FC<CircuitComparisonChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDriver1 = '',
  initialDriver2 = '',
  onDriversSelected
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  // State for selected drivers and laps
  const [selectedDriver1, setSelectedDriver1] = useState<string>(initialDriver1);
  const [selectedDriver2, setSelectedDriver2] = useState<string>(initialDriver2);
  const [selectedLap1, setSelectedLap1] = useState<string | number>('fastest');
  const [selectedLap2, setSelectedLap2] = useState<string | number>('fastest');

  // Add state for tracking fastest lap information
  const [fastestLapInfo1, setFastestLapInfo1] = useState<LapTimeInfo | null>(null);
  const [fastestLapInfo2, setFastestLapInfo2] = useState<LapTimeInfo | null>(null);

  // Add shouldLoadChart state
  const [shouldLoadChart, setShouldLoadChart] = useState(false);

  // Callback to parent component when drivers or shouldLoadChart changes
  useEffect(() => {
    if (onDriversSelected) {
      onDriversSelected({
        driver1: selectedDriver1,
        driver2: selectedDriver2,
        lap1: selectedLap1,
        lap2: selectedLap2,
        shouldLoadChart
      });
    }
  }, [selectedDriver1, selectedDriver2, selectedLap1, selectedLap2, shouldLoadChart, onDriversSelected]);

  // Fetch available drivers for this session
  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session], // Keep this query
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity, gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  // Initialize driver selections when data is available
  useEffect(() => {
    if (availableDrivers && availableDrivers.length >= 2) {
      // Set defaults to the first two drivers if available
      setSelectedDriver1(availableDrivers[0]?.code || "");
      setSelectedDriver2(availableDrivers[1]?.code || "");
      // Reset laps to fastest when drivers are initialized/changed by availableDrivers
      setSelectedLap1('fastest');
      setSelectedLap2('fastest');
    }
  }, [availableDrivers]);

  // Fetch lap numbers for Driver 1
  const { data: lapTimes1, isLoading: isLoadingLaps1 } = useQuery<number[]>({
    queryKey: ['driverLapNumbers', year, event, session, selectedDriver1],
    queryFn: () => fetchDriverLapNumbers(year, event, session, selectedDriver1),
    staleTime: 1000 * 60 * 15, // Cache for 15 mins
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver1,
  });

  // Fetch lap numbers for Driver 2
  const { data: lapTimes2, isLoading: isLoadingLaps2 } = useQuery<number[]>({
    queryKey: ['driverLapNumbers', year, event, session, selectedDriver2],
    queryFn: () => fetchDriverLapNumbers(year, event, session, selectedDriver2),
    staleTime: 1000 * 60 * 15, // Cache for 15 mins
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver2,
  });

  // Update lap options when lap times change and handle reset
  const [lapOptions1, setLapOptions1] = useState<(number | 'fastest')[]>(['fastest']);
  const [lapOptions2, setLapOptions2] = useState<(number | 'fastest')[]>(['fastest']);

  // Handle lap options for driver 1
  useEffect(() => {
    // Don't update if there are no valid lap times
    if (lapTimes1 && lapTimes1.length > 0) {
      setLapOptions1(['fastest', ...lapTimes1]);
    } else {
      // Reset to default if no lap times
      setLapOptions1(['fastest']);
    }

    // Reset selected lap when driver changes (not on initial load)
    if (selectedDriver1 && lapTimes1 !== undefined && selectedLap1 !== 'fastest') {
      setSelectedLap1('fastest');
    }
  }, [lapTimes1, selectedDriver1]);

  // Handle lap options for driver 2
  useEffect(() => {
    // Don't update if there are no valid lap times
    if (lapTimes2 && lapTimes2.length > 0) {
      setLapOptions2(['fastest', ...lapTimes2]);
    } else {
      // Reset to default if no lap times
      setLapOptions2(['fastest']);
    }

    // Reset selected lap when driver changes (not on initial load)
    if (selectedDriver2 && lapTimes2 !== undefined && selectedLap2 !== 'fastest') {
      setSelectedLap2('fastest');
    }
  }, [lapTimes2, selectedDriver2]);

  // Fetch sector comparison data - now includes selected laps
  const { data: comparisonData, isLoading: isLoadingComparison, error, isError } = useQuery<SectorComparisonData>({
    // Include selected laps in the query key
    queryKey: ['sectorComparison', year, event, session, selectedDriver1, selectedDriver2, selectedLap1, selectedLap2],
    // Pass selected laps to the API function
    queryFn: () => fetchSectorComparison(year, event, session, selectedDriver1, selectedDriver2, selectedLap1, selectedLap2),
    staleTime: 1000 * 60 * 10, // Cache comparison for 10 mins
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver1 && !!selectedDriver2 && selectedDriver1 !== selectedDriver2 && shouldLoadChart, // Include shouldLoadChart
  });

  // Fetch speed telemetry data for Driver 1
  const { data: speedData1, isLoading: isLoadingSpeed1 } = useQuery<SpeedDataPoint[]>({
    queryKey: ['speedTrace', year, event, session, selectedDriver1, selectedLap1],
    queryFn: () => fetchTelemetrySpeed(year, event, session, selectedDriver1, selectedLap1),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver1 && !!selectedLap1 && shouldLoadChart,
  });

  // Fetch speed telemetry data for Driver 2
  const { data: speedData2, isLoading: isLoadingSpeed2 } = useQuery<SpeedDataPoint[]>({
    queryKey: ['speedTrace', year, event, session, selectedDriver2, selectedLap2],
    queryFn: () => fetchTelemetrySpeed(year, event, session, selectedDriver2, selectedLap2),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver2 && !!selectedLap2 && shouldLoadChart,
  });

  // Fetch lap times data for driver 1
  const { data: lapTimesData1 } = useQuery<LapTimeDataPoint[]>({
    queryKey: ['lapTimes', year, event, session, [selectedDriver1]],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver1]),
    staleTime: 1000 * 60 * 15, // Cache for 15 mins
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver1 && shouldLoadChart,
  });

  // Fetch lap times data for driver 2
  const { data: lapTimesData2 } = useQuery<LapTimeDataPoint[]>({
    queryKey: ['lapTimes', year, event, session, [selectedDriver2]],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver2]),
    staleTime: 1000 * 60 * 15, // Cache for 15 mins
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver2 && shouldLoadChart,
  });

  // Format lap time from seconds to min:sec.ms format
  const formatLapTime = (timeInSeconds: number | null): string => {
    if (timeInSeconds === null || isNaN(timeInSeconds)) return "--:--.---";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds % 1) * 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Process fastest lap information for driver 1
  useEffect(() => {
    if (lapTimesData1 && selectedLap1 === 'fastest' && selectedDriver1) {
      // Find the fastest lap
      let fastestLapNumber = 0;
      let fastestTime = Infinity;
      
      lapTimesData1.forEach(lap => {
        const lapTime = lap[selectedDriver1] as number;
        if (lapTime && lapTime > 0 && lapTime < fastestTime) {
          fastestTime = lapTime;
          fastestLapNumber = lap.LapNumber;
        }
      });
      
      if (fastestLapNumber > 0) {
        setFastestLapInfo1({
          lapNumber: fastestLapNumber,
          lapTime: formatLapTime(fastestTime),
          lapTimeRaw: fastestTime
        });
      } else {
        setFastestLapInfo1(null);
      }
    } else if (selectedLap1 !== 'fastest' && lapTimesData1 && typeof selectedLap1 === 'number') {
      // Get info for the specific selected lap
      const lapData = lapTimesData1.find(lap => lap.LapNumber === selectedLap1);
      const lapTime = lapData ? lapData[selectedDriver1] as number : null;
      
      if (lapTime && lapTime > 0) {
        setFastestLapInfo1({
          lapNumber: selectedLap1,
          lapTime: formatLapTime(lapTime),
          lapTimeRaw: lapTime
        });
      } else {
        setFastestLapInfo1(null);
      }
    }
  }, [lapTimesData1, selectedDriver1, selectedLap1]);

  // Process fastest lap information for driver 2
  useEffect(() => {
    if (lapTimesData2 && selectedLap2 === 'fastest' && selectedDriver2) {
      // Find the fastest lap
      let fastestLapNumber = 0;
      let fastestTime = Infinity;
      
      lapTimesData2.forEach(lap => {
        const lapTime = lap[selectedDriver2] as number;
        if (lapTime && lapTime > 0 && lapTime < fastestTime) {
          fastestTime = lapTime;
          fastestLapNumber = lap.LapNumber;
        }
      });
      
      if (fastestLapNumber > 0) {
        setFastestLapInfo2({
          lapNumber: fastestLapNumber,
          lapTime: formatLapTime(fastestTime),
          lapTimeRaw: fastestTime
        });
      } else {
        setFastestLapInfo2(null);
      }
    } else if (selectedLap2 !== 'fastest' && lapTimesData2 && typeof selectedLap2 === 'number') {
      // Get info for the specific selected lap
      const lapData = lapTimesData2.find(lap => lap.LapNumber === selectedLap2);
      const lapTime = lapData ? lapData[selectedDriver2] as number : null;
      
      if (lapTime && lapTime > 0) {
        setFastestLapInfo2({
          lapNumber: selectedLap2,
          lapTime: formatLapTime(lapTime),
          lapTimeRaw: lapTime
        });
      } else {
        setFastestLapInfo2(null);
      }
    }
  }, [lapTimesData2, selectedDriver2, selectedLap2]);

  // Combine speed data for both drivers
  const combinedSpeedData = useMemo(() => {
    if (!speedData1 || !speedData2) return [];
    
    // Helper function to find nearest data points for interpolation
    const findInterpolationPoints = (distance: number, data: SpeedDataPoint[]) => {
      // Find the closest points before and after the target distance
      let beforePoint: SpeedDataPoint | null = null;
      let afterPoint: SpeedDataPoint | null = null;
      
      for (let i = 0; i < data.length; i++) {
        if (data[i].Distance <= distance) {
          beforePoint = data[i];
        } else {
          afterPoint = data[i];
          break;
        }
      }
      
      return { beforePoint, afterPoint };
    };
    
    // Linear interpolation function
    const interpolateSpeed = (distance: number, data: SpeedDataPoint[]) => {
      // If no data, return null
      if (!data.length) return null;
      
      // If exact match found, return that value
      const exactMatch = data.find(point => point.Distance === distance);
      if (exactMatch) return exactMatch.Speed;
      
      // Find before and after points
      const { beforePoint, afterPoint } = findInterpolationPoints(distance, data);
      
      // If only one point found, return that point's speed
      if (!beforePoint) return afterPoint?.Speed || null;
      if (!afterPoint) return beforePoint?.Speed || null;
      
      // Calculate interpolated speed
      const distRatio = (distance - beforePoint.Distance) / (afterPoint.Distance - beforePoint.Distance);
      return beforePoint.Speed + distRatio * (afterPoint.Speed - beforePoint.Speed);
    };
    
    // Get all unique distances from both datasets
    const allDistances = new Set<number>();
    speedData1.forEach(point => allDistances.add(point.Distance));
    speedData2.forEach(point => allDistances.add(point.Distance));
    
    // Convert to array and sort
    const distances = Array.from(allDistances).sort((a, b) => a - b);
    
    // Sort speed data by distance
    const sortedSpeedData1 = [...speedData1].sort((a, b) => a.Distance - b.Distance);
    const sortedSpeedData2 = [...speedData2].sort((a, b) => a.Distance - b.Distance);
    
    // Create interpolated data points
    return distances.map(distance => ({
      Distance: distance,
      [`Speed_${selectedDriver1}`]: interpolateSpeed(distance, sortedSpeedData1),
      [`Speed_${selectedDriver2}`]: interpolateSpeed(distance, sortedSpeedData2)
    }));
    
  }, [speedData1, speedData2, selectedDriver1, selectedDriver2]);

  // Combined loading state including speed data
  const isLoading = isLoadingDrivers || isLoadingComparison || isLoadingLaps1 || isLoadingLaps2 || isLoadingSpeed1 || isLoadingSpeed2;

  // Get driver colors
  let driver1Color = driverColor(selectedDriver1, year);
  let driver2Color = driverColor(selectedDriver2, year);

  // Check if drivers are teammates
  const sameTeam = selectedDriver1 && selectedDriver2 ? areTeammates(selectedDriver1, selectedDriver2, year) : false;

  // Override driver 2 color to white if they are teammates
  if (sameTeam) {
    driver2Color = '#FFFFFF'; // Use white for driver 2 when teammates
  }

  // Handle chart download
  const handleDownload = async () => {
    if (!chartRef.current || isLoading || !comparisonData) {
      return;
    }

    setIsExporting(true);
    try {
      // Brief delay to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use event name and drivers for the filename
      const filename = `${event.toLowerCase().replace(/\s+/g, '-')}_${selectedDriver1}_vs_${selectedDriver2}_circuit_comparison`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Update chartTitle
  const chartTitle = title || "Track Dominance Comparison";

  // Update renderContent
  const renderContent = () => {
    // If chart shouldn't be loaded yet, show load button
    if (!shouldLoadChart) {
      return (
        <div className="w-full h-[450px] flex flex-col items-center justify-center bg-gray-900/50 rounded-lg gap-4">
          <p className="text-gray-400">Select drivers and click load to view track dominance data</p>
          <Button 
            onClick={() => setShouldLoadChart(true)}
            variant="secondary"
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            disabled={!selectedDriver1 || !selectedDriver2}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Load Comparison
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[500px] flex items-center justify-center bg-gray-900/50 rounded-lg">
          <LoadingSpinnerF1 />
        </div>
      );
    }

    if (isError || !comparisonData) {
      return (
        <div className="w-full h-[500px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">Error loading circuit comparison data</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
          {selectedDriver1 === selectedDriver2 && (
            <p className="text-sm text-amber-400 mt-4">Please select two different drivers to compare.</p>
          )}
        </div>
      );
    }

    // Map through track sections and render with appropriate colors
    return (
      <div className="w-full">
        {/* Display selected laps */}
        <div className="flex justify-between items-center mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: driver1Color }}></div>
            <span className="font-semibold">{selectedDriver1}</span>
            {selectedLap1 === 'fastest' && fastestLapInfo1 ? (
              <span className="text-xs text-gray-400">
                (Lap {fastestLapInfo1.lapNumber} - {fastestLapInfo1.lapTime})
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                (Lap {selectedLap1 === 'fastest' ? 'Fastest' : selectedLap1}
                {selectedLap1 !== 'fastest' && fastestLapInfo1 ? ` - ${fastestLapInfo1.lapTime}` : ''})
              </span>
            )}
          </div>
          <div className="text-gray-500">vs</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedDriver2}</span>
            {selectedLap2 === 'fastest' && fastestLapInfo2 ? (
              <span className="text-xs text-gray-400">
                (Lap {fastestLapInfo2.lapNumber} - {fastestLapInfo2.lapTime})
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                (Lap {selectedLap2 === 'fastest' ? 'Fastest' : selectedLap2}
                {selectedLap2 !== 'fastest' && fastestLapInfo2 ? ` - ${fastestLapInfo2.lapTime}` : ''})
              </span>
            )}
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: driver2Color }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Circuit map container */}
          <div className="circuit-map-container relative w-full h-[400px] bg-gray-900/50 rounded-lg overflow-hidden" data-export="true">
            <svg viewBox="0 0 1000 500" className="w-full h-full">
              <g transform="scale(1,-1) translate(0,-500)">
                {/* Circuit base outline */}
                <path
                  d={comparisonData.circuitLayout}
                  fill="none"
                  stroke="rgba(255, 255, 0, 0.9)"
                  strokeWidth="10" // Slightly thinner base outline
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Circuit sections highlighting advantages */}
                {comparisonData.sections.map((section) => {
                  // Determine which driver has advantage
                  let strokeColor = "rgba(255, 255, 0, 0.9)"; // Bright yellow
                  let advantageText = "Neutral or negligible difference";

                  // Check advantage without threshold
                  if (section.driver1Advantage && section.driver1Advantage > 0) {
                    // Driver 1 advantage
                    strokeColor = driver1Color;
                    advantageText = `${selectedDriver1} faster by ${Math.abs(section.driver1Advantage).toFixed(3)}s`;
                  } else if (section.driver1Advantage && section.driver1Advantage < 0) {
                    // Driver 2 advantage
                    strokeColor = driver2Color; // Will be white if sameTeam is true due to override above
                    advantageText = `${selectedDriver2} faster by ${Math.abs(section.driver1Advantage).toFixed(3)}s`;
                  } else if (section.driver1Advantage === 0) {
                    // Explicitly handle exact zero difference as neutral
                    advantageText = "Identical time";
                  }

                  return (
                    <path
                      key={section.id}
                      d={section.path}
                      fill="none" // No fill for section paths
                      stroke={strokeColor}
                      strokeWidth="12" // Make section highlight slightly thicker than base
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      data-section-name={section.name}
                    >
                      <title>{section.name}: {advantageText}</title>
                    </path>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Speed Trace Chart */}
          <div className="speed-trace-container relative w-full h-[400px] bg-gray-900/50 rounded-lg overflow-hidden">
            {combinedSpeedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={combinedSpeedData} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.3)" />
                  <XAxis 
                    type="number" 
                    dataKey="Distance" 
                    stroke="rgba(156, 163, 175, 0.7)" 
                    tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} 
                    tickFormatter={(value: number) => `${value.toFixed(0)}m`} 
                    domain={['dataMin', 'dataMax']} 
                    label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -5, fill: 'rgba(156, 163, 175, 0.9)' }}
                  />
                  <YAxis 
                    stroke="rgba(156, 163, 175, 0.7)" 
                    tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} 
                    domain={['auto', 'auto']} 
                    tickFormatter={(value) => `${value}`} 
                    label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: 'rgba(156, 163, 175, 0.9)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(31, 41, 55, 0.9)', 
                      borderColor: 'rgba(100, 116, 139, 0.5)', 
                      color: '#E5E7EB', 
                      borderRadius: '6px', 
                      boxShadow: '0 2px 10px rgba(0,0,0,0.5)' 
                    }} 
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '5px' }} 
                    labelFormatter={(label: number) => `Distance: ${label.toFixed(2)}m`}
                    isAnimationActive={false}
                    animationDuration={0}
                    animationEasing="linear"
                    allowEscapeViewBox={{ x: false, y: true }}
                    position={{ y: 100 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        // Find the actual data point
                        const dataPoint = payload[0].payload;
                        
                        // Get both speeds regardless of which line is hovered
                        const speed1 = dataPoint[`Speed_${selectedDriver1}`];
                        const speed2 = dataPoint[`Speed_${selectedDriver2}`];
                        
                        return (
                          <div className="custom-tooltip p-2" style={{ 
                            backgroundColor: 'rgba(31, 41, 55, 0.95)',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                          }}>
                            <p className="font-bold text-white border-b border-gray-600 pb-1 mb-2">
                              Distance: {label.toFixed(2)}m
                            </p>
                            <div className="grid grid-cols-2 gap-x-3 text-sm">
                              <span>Driver</span>
                              <span>Speed</span>
                              
                              <span style={{ color: driver1Color }}>{selectedDriver1}</span>
                              <span style={{ color: driver1Color }}>
                                {speed1 !== null && speed1 !== undefined ? `${speed1.toFixed(1)} km/h` : '-'}
                              </span>
                              
                              <span style={{ color: driver2Color }}>{selectedDriver2}</span>
                              <span style={{ color: driver2Color }}>
                                {speed2 !== null && speed2 !== undefined ? `${speed2.toFixed(1)} km/h` : '-'}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={`Speed_${selectedDriver1}`} 
                    stroke={driver1Color} 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 4, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: driver1Color }} 
                    name={`Speed_${selectedDriver1}`} 
                    connectNulls={true} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey={`Speed_${selectedDriver2}`} 
                    stroke={driver2Color} 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 4, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: driver2Color }} 
                    name={`Speed_${selectedDriver2}`}
                    connectNulls={true} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Select two drivers and their laps to view speed comparison
              </div>
            )}
          </div>
        </div>

        {/* Legend - Updated for lap display */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block">
              <line x1="0" y1="8" x2="16" y2="8" stroke={driver1Color} strokeWidth="3" />
            </svg>
            <span>
              {selectedDriver1} Advantage 
              {selectedLap1 === 'fastest' && fastestLapInfo1 ? 
                ` (Lap ${fastestLapInfo1.lapNumber} - ${fastestLapInfo1.lapTime})` : 
                ` (Lap ${selectedLap1 === 'fastest' ? 'F' : selectedLap1}${selectedLap1 !== 'fastest' && fastestLapInfo1 ? ` - ${fastestLapInfo1.lapTime}` : ''})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block">
              <line x1="0" y1="8" x2="16" y2="8" stroke={driver2Color} strokeWidth="3" />
            </svg>
            <span>
              {selectedDriver2} Advantage
              {selectedLap2 === 'fastest' && fastestLapInfo2 ? 
                ` (Lap ${fastestLapInfo2.lapNumber} - ${fastestLapInfo2.lapTime})` : 
                ` (Lap ${selectedLap2 === 'fastest' ? 'F' : selectedLap2}${selectedLap2 !== 'fastest' && fastestLapInfo2 ? ` - ${fastestLapInfo2.lapTime}` : ''})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block">
               <line x1="0" y1="8" x2="16" y2="8" stroke="rgba(255, 255, 0, 0.9)" strokeWidth="3" />
            </svg>
            <span>Neutral</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card 
      ref={chartRef}
      className={cn("bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm overflow-hidden rounded-md p-4", className)}
    >
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-white">Track Dominance by Lap with Speed Trace</CardTitle>
          </div>

          {/* Driver and Lap selectors */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Driver 1 Controls */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedDriver1}
                onValueChange={(value) => {
                  setSelectedDriver1(value);
                  setSelectedLap1('fastest');
                  // Reset chart loading state when driver changes
                  if (shouldLoadChart) {
                    setShouldLoadChart(false);
                  }
                }}
                disabled={isLoadingDrivers || !availableDrivers}
              >
                <SelectTrigger className="w-full sm:w-[150px] min-w-[100px] bg-gray-800/80 border-gray-700 text-gray-200 text-sm h-9">
                   <User className="w-4 h-4 mr-2 opacity-70"/>
                   <SelectValue placeholder="Select Driver 1" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectGroup>
                    <SelectLabel className="text-xs text-gray-500">Driver 1</SelectLabel>
                    {availableDrivers?.map((drv) => (
                      <SelectItem key={`d1-${drv.code}`} value={drv.code} className="text-sm">
                        {drv.code}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={String(selectedLap1)}
                onValueChange={(value) => setSelectedLap1(value === 'fastest' ? 'fastest' : parseInt(value))}
                disabled={isLoadingLaps1 || !selectedDriver1 || lapOptions1.length <= 1}
              >
                <SelectTrigger className="w-full sm:w-[100px] bg-gray-800/80 border-gray-700 text-gray-200 text-xs h-8 focus:border-red-500 focus:ring-red-500">
                   <Clock className="w-3 h-3 mr-1 opacity-70"/>
                   <SelectValue placeholder="Lap" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200 max-h-[200px]">
                  <SelectGroup>
                    <SelectLabel className="text-xs text-gray-500">Lap</SelectLabel>
                    {lapOptions1.map((lapOpt) => (
                      <SelectItem key={`d1-lap-${lapOpt}`} value={String(lapOpt)} className="text-xs">
                        {lapOpt === 'fastest' ? 'Fastest' : lapOpt}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <span className="text-gray-500 mx-2">vs</span>

            {/* Driver 2 Controls */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedDriver2}
                onValueChange={(value) => {
                  setSelectedDriver2(value);
                  setSelectedLap2('fastest');
                  // Reset chart loading state when driver changes
                  if (shouldLoadChart) {
                    setShouldLoadChart(false);
                  }
                }}
                disabled={isLoadingDrivers || !availableDrivers}
              >
                <SelectTrigger className="w-full sm:w-[150px] min-w-[100px] bg-gray-800/80 border-gray-700 text-gray-200 text-sm h-9">
                   <User className="w-4 h-4 mr-2 opacity-70"/>
                   <SelectValue placeholder="Select Driver 2" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectGroup>
                    <SelectLabel className="text-xs text-gray-500">Driver 2</SelectLabel>
                    {availableDrivers?.map((drv) => (
                      <SelectItem key={`d2-${drv.code}`} value={drv.code} className="text-sm">
                        {drv.code}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={String(selectedLap2)}
                onValueChange={(value) => setSelectedLap2(value === 'fastest' ? 'fastest' : parseInt(value))}
                disabled={isLoadingLaps2 || !selectedDriver2 || lapOptions2.length <= 1}
              >
                <SelectTrigger className="w-full sm:w-[100px] bg-gray-800/80 border-gray-700 text-gray-200 text-xs h-8 focus:border-red-500 focus:ring-red-500">
                   <Clock className="w-3 h-3 mr-1 opacity-70"/>
                   <SelectValue placeholder="Lap" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200 max-h-[200px]">
                  <SelectGroup>
                    <SelectLabel className="text-xs text-gray-500">Lap</SelectLabel>
                    {lapOptions2.map((lapOpt) => (
                      <SelectItem key={`d2-lap-${lapOpt}`} value={String(lapOpt)} className="text-xs">
                        {lapOpt === 'fastest' ? 'Fastest' : lapOpt}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
        {!isLoading && comparisonData && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 px-2.5 text-xs bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-1.5 border border-gray-700" 
              onClick={handleDownload}
              disabled={isExporting}
              title="Download chart"
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

export default CircuitComparisonChart;
