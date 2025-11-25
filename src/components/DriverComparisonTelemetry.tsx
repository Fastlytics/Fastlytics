import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn, exportChartAsImage } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { 
  fetchTelemetryThrottle, 
  fetchTelemetryBrake, 
  fetchTelemetryRPM, 
  fetchTelemetryDRS, 
  ThrottleDataPoint, 
  BrakeDataPoint, 
  RPMDataPoint, 
  DRSDataPoint 
} from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircle, Download, BarChart2 } from 'lucide-react';
import { driverColor } from '@/lib/driverColor';
import { areTeammates } from '@/lib/teamUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Define union type for telemetry data
type TelemetryDataPoint = ThrottleDataPoint | BrakeDataPoint | RPMDataPoint | DRSDataPoint;

interface DriverComparisonTelemetryProps {
  className?: string;
  delay?: number;
  title: string;
  year: number;
  event: string;
  session: string;
  driver1: string;
  driver2: string;
  lap1: string | number;
  lap2: string | number;
  shouldLoadChart: boolean; // This is now just used to check if parent comparison is loaded
  telemetryType: 'throttle' | 'brake' | 'rpm' | 'drs';
}

const DriverComparisonTelemetry: React.FC<DriverComparisonTelemetryProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  driver1,
  driver2,
  lap1,
  lap2,
  shouldLoadChart,
  telemetryType
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Add separate load state for this specific chart
  const [shouldLoadTelemetry, setShouldLoadTelemetry] = useState(false);

  // Reset telemetry loading when parent chart data changes
  useEffect(() => {
    // Only reset if the chart was previously loaded and drivers changed
    if (shouldLoadTelemetry && (driver1 !== prevDriver1.current || driver2 !== prevDriver2.current)) {
      setShouldLoadTelemetry(false);
    }
    
    prevDriver1.current = driver1;
    prevDriver2.current = driver2;
  }, [driver1, driver2, shouldLoadTelemetry]);
  
  // Keep track of previous drivers for comparison
  const prevDriver1 = useRef(driver1);
  const prevDriver2 = useRef(driver2);

  // Fetch telemetry data for Driver 1
  const { data: telemetryData1, isLoading: isLoadingTelemetry1, error: error1 } = useQuery<TelemetryDataPoint[]>({
    queryKey: [`${telemetryType}Trace`, year, event, session, driver1, lap1],
    queryFn: () => {
      switch (telemetryType) {
        case 'throttle': return fetchTelemetryThrottle(year, event, session, driver1, lap1);
        case 'brake': return fetchTelemetryBrake(year, event, session, driver1, lap1);
        case 'rpm': return fetchTelemetryRPM(year, event, session, driver1, lap1);
        case 'drs': return fetchTelemetryDRS(year, event, session, driver1, lap1);
        default: return fetchTelemetryThrottle(year, event, session, driver1, lap1);
      }
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!driver1 && !!lap1 && shouldLoadTelemetry,
  });

  // Fetch telemetry data for Driver 2
  const { data: telemetryData2, isLoading: isLoadingTelemetry2, error: error2 } = useQuery<TelemetryDataPoint[]>({
    queryKey: [`${telemetryType}Trace`, year, event, session, driver2, lap2],
    queryFn: () => {
      switch (telemetryType) {
        case 'throttle': return fetchTelemetryThrottle(year, event, session, driver2, lap2);
        case 'brake': return fetchTelemetryBrake(year, event, session, driver2, lap2);
        case 'rpm': return fetchTelemetryRPM(year, event, session, driver2, lap2);
        case 'drs': return fetchTelemetryDRS(year, event, session, driver2, lap2);
        default: return fetchTelemetryThrottle(year, event, session, driver2, lap2);
      }
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!driver2 && !!lap2 && shouldLoadTelemetry && driver1 !== driver2,
  });

  // Combine telemetry data for both drivers
  const combinedTelemetryData = React.useMemo(() => {
    if (!telemetryData1 || !telemetryData2) return [];
    
    // Helper function to find nearest data points for interpolation
    const findInterpolationPoints = (distance: number, data: TelemetryDataPoint[]) => {
      // Find the closest points before and after the target distance
      let beforePoint: TelemetryDataPoint | null = null;
      let afterPoint: TelemetryDataPoint | null = null;
      
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
    
    // Get data key based on telemetry type
    const getDataKey = (type: string) => {
      switch (type) {
        case 'throttle': return 'Throttle';
        case 'brake': return 'Brake';
        case 'rpm': return 'RPM';
        case 'drs': return 'DRS';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
      }
    };
    
    // Get actual data key for this telemetry type
    const dataKey = getDataKey(telemetryType);
    
    // Debug log to check data structure of the first points
    if (telemetryData1.length > 0 && telemetryData2.length > 0) {
      console.log(`${telemetryType} sample data:`, {
        driver1_sample: telemetryData1[0],
        driver2_sample: telemetryData2[0],
        dataKey
      });
    }
    
    // Linear interpolation function
    const interpolateTelemetry = (distance: number, data: TelemetryDataPoint[], key: string) => {
      // If no data, return null
      if (!data.length) return null;
      
      // If exact match found, return that value
      const exactMatch = data.find(point => point.Distance === distance);
      if (exactMatch) return (exactMatch as any)[key];
      
      // Find before and after points
      const { beforePoint, afterPoint } = findInterpolationPoints(distance, data);
      
      // If only one point found, return that point's value
      if (!beforePoint) return afterPoint ? (afterPoint as any)[key] || null : null;
      if (!afterPoint) return beforePoint ? (beforePoint as any)[key] || null : null;
      
      // Get the values, handling potential undefined values
      const beforeValue = (beforePoint as any)[key];
      const afterValue = (afterPoint as any)[key];
      
      // If either value is null or undefined, return the other one
      if (beforeValue === null || beforeValue === undefined) return afterValue;
      if (afterValue === null || afterValue === undefined) return beforeValue;
      
      // Calculate interpolated value
      const distRatio = (distance - beforePoint.Distance) / (afterPoint.Distance - beforePoint.Distance);
      return beforeValue + distRatio * (afterValue - beforeValue);
    };
    
    // Get all unique distances from both datasets
    const allDistances = new Set<number>();
    telemetryData1.forEach(point => allDistances.add(point.Distance));
    telemetryData2.forEach(point => allDistances.add(point.Distance));
    
    // Convert to array and sort
    const distances = Array.from(allDistances).sort((a, b) => a - b);
    
    // Sort telemetry data by distance
    const sortedTelemetryData1 = [...telemetryData1].sort((a, b) => a.Distance - b.Distance);
    const sortedTelemetryData2 = [...telemetryData2].sort((a, b) => a.Distance - b.Distance);
    
    // Create interpolated data points
    return distances.map(distance => ({
      Distance: distance,
      [`${dataKey}_${driver1}`]: interpolateTelemetry(distance, sortedTelemetryData1, dataKey),
      [`${dataKey}_${driver2}`]: interpolateTelemetry(distance, sortedTelemetryData2, dataKey)
    }));
  }, [telemetryData1, telemetryData2, driver1, driver2, telemetryType]);

  // Get driver colors
  const driver1Color = driverColor(driver1, year);
  let driver2Color = driverColor(driver2, year);

  // Check if drivers are teammates
  const sameTeam = driver1 && driver2 ? areTeammates(driver1, driver2, year) : false;

  // Override driver 2 color to white if they are teammates
  if (sameTeam) {
    driver2Color = '#FFFFFF'; // Use white for driver 2 when teammates
  }

  // Combined loading state
  const isLoading = isLoadingTelemetry1 || isLoadingTelemetry2;
  const error = error1 || error2;

  // Handle chart download
  const handleDownload = async () => {
    if (!chartRef.current || isLoading || !combinedTelemetryData || combinedTelemetryData.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      // Brief delay to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use event name, drivers, and telemetry type for the filename
      const filename = `${event.toLowerCase().replace(/\s+/g, '-')}_${driver1}_vs_${driver2}_${telemetryType}`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Get appropriate properties based on telemetry type
  const getTelemetryProps = () => {
    switch (telemetryType) {
      case 'throttle':
        return {
          dataKey: 'Throttle',
          yAxisFormatter: (value: number) => `${value.toFixed(1)}%`,
          color1: '#10b981', // green
          color2: '#10b981', // green
          domain: [0, 100] as [number, number],
          tooltipUnit: '%',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
      case 'brake':
        return {
          dataKey: 'Brake',
          yAxisFormatter: (value: number) => `${value.toFixed(1)}%`,
          color1: '#ef4444', // red
          color2: '#ef4444', // red
          domain: [0, 100] as [number, number],
          tooltipUnit: '%',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
      case 'rpm':
        return {
          dataKey: 'RPM',
          yAxisFormatter: (value: number) => `${Math.round(value)}`,
          color1: '#fb923c', // orange
          color2: '#fb923c', // orange
          domain: [0, 13000] as [number, number], // Increased to 13000 RPM
          tooltipUnit: '',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
      case 'drs':
        return {
          dataKey: 'DRS',
          yAxisFormatter: (value: number) => value === 1 ? 'On' : 'Off',
          color1: '#3b82f6', // blue
          color2: '#3b82f6', // blue
          domain: [-0.1, 1.1] as [number, number], // Add some padding for better visibility
          tooltipUnit: '',
          type: 'step' as const,
          showYAxisTicks: false, // Hide Y-axis ticks for DRS
          showActiveDot: false // Disable hover dots for DRS
        };
      default:
        return {
          dataKey: 'Throttle',
          yAxisFormatter: (value: number) => `${value}%`,
          color1: '#10b981',
          color2: '#10b981',
          domain: [0, 100] as [number, number],
          tooltipUnit: '%',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
    }
  };

  const props = getTelemetryProps();

  const renderContent = () => {
    // If chart isn't loaded yet
    if (!shouldLoadTelemetry) {
      return (
        <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gray-900/50 rounded-lg gap-4">
          <p className="text-gray-400">Click load to view {telemetryType} comparison for selected drivers</p>
          <Button 
            onClick={() => setShouldLoadTelemetry(true)}
            variant="secondary"
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            disabled={!driver1 || !driver2 || driver1 === driver2}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Load {telemetryType.charAt(0).toUpperCase() + telemetryType.slice(1)} Chart
          </Button>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="w-full h-[280px] flex items-center justify-center bg-gray-900/50 rounded-lg">
          <LoadingSpinnerF1 />
        </div>
      );
    }
    
    // Debug log to see what data we're getting
    console.log(`${telemetryType} data:`, { 
      driver1Data: telemetryData1?.length || 0, 
      driver2Data: telemetryData2?.length || 0,
      combinedData: combinedTelemetryData.length || 0,
      error: error
    });
    
    if (error || !telemetryData1 || !telemetryData2) {
      return (
        <div className="w-full h-[280px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">Error loading {telemetryType} data</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
        </div>
      );
    }
    if (combinedTelemetryData.length === 0) {
      return (
        <div className="w-full h-[260px] bg-gray-900/80 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-500">
          No {telemetryType} telemetry data found for the selected drivers and laps.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={280} className="export-chart-container">
        <LineChart data={combinedTelemetryData} margin={{ top: 0, right: 10, left: -15, bottom: 5 }} className="chart-main-container">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.3)" />
          <XAxis 
            type="number" 
            dataKey="Distance" 
            stroke="rgba(156, 163, 175, 0.7)" 
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} 
            tickFormatter={(value: number) => `${value.toFixed(2)}m`} 
            domain={['dataMin', 'dataMax']} 
          />
          <YAxis 
            dataKey={`${props.dataKey}_${driver1}`}
            stroke="rgba(156, 163, 175, 0.7)" 
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }}  
            tickFormatter={props.yAxisFormatter}
            domain={props.domain}
            width={50}
            hide={!props.showYAxisTicks}
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
            formatter={(value: any, name: string) => {
              // Get the actual driver from the name
              const isDriver1 = name.endsWith(driver1);
              const driverName = isDriver1 ? driver1 : driver2;
              
              // Set the text color in the component's style
              const colorStyle = { color: isDriver1 ? driver1Color : driver2Color };
              
              let formattedValue: string | number;
              let formattedName: string;
              
              if (telemetryType === 'drs') {
                formattedValue = value === 1 ? 'Enabled' : 'Disabled';
                formattedName = `${driverName} DRS`;
              } else if (telemetryType === 'rpm' && typeof value === 'number') {
                formattedValue = Math.round(value);
                formattedName = `${driverName} RPM`;
              } else if ((telemetryType === 'throttle' || telemetryType === 'brake') && typeof value === 'number') {
                formattedValue = `${value.toFixed(1)}${props.tooltipUnit}`;
                formattedName = `${driverName} ${props.dataKey}`;
              } else {
                formattedValue = `${typeof value === 'number' ? value : 0}${props.tooltipUnit}`;
                formattedName = `${driverName} ${props.dataKey}`;
              }
              
              // Return value with custom style
              return [
                <span style={colorStyle}>{formattedValue}</span>,
                <span style={colorStyle}>{formattedName}</span>
              ];
            }}
            labelFormatter={(label: number) => `Distance: ${label.toFixed(2)}m`}
            cursor={telemetryType !== 'drs'}
          />
          <Line 
            type={props.type} 
            dataKey={`${props.dataKey}_${driver1}`} 
            stroke={driver1Color} 
            strokeWidth={2} 
            dot={false} 
            activeDot={props.showActiveDot ? { r: 4, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: driver1Color } : false} 
            name={driver1} 
            connectNulls={true} 
          />
          <Line 
            type={props.type} 
            dataKey={`${props.dataKey}_${driver2}`} 
            stroke={driver2Color} 
            strokeWidth={2} 
            dot={false} 
            activeDot={props.showActiveDot ? { r: 4, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: driver2Color } : false} 
            name={driver2} 
            connectNulls={true} 
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card 
      ref={chartRef}
      className={cn("chart-container bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm animate-fade-in overflow-hidden", className)} 
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
          
          {/* Display color-coded driver indicators */}
          {shouldLoadTelemetry && !isLoading && combinedTelemetryData && combinedTelemetryData.length > 0 && (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver1Color }}></div>
                <span className="text-sm text-gray-300">{driver1}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver2Color }}></div>
                <span className="text-sm text-gray-300">{driver2}</span>
                {sameTeam && <span className="text-xs text-gray-400">(teammate)</span>}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
        {shouldLoadTelemetry && !isLoading && combinedTelemetryData && combinedTelemetryData.length > 0 && (
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

export default DriverComparisonTelemetry; 