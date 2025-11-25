import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn, exportChartAsImage } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchTelemetryBrake, fetchSessionDrivers, fetchLapTimes, SessionDriver, BrakeDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircle, User, Clock, Download, BarChart2 } from 'lucide-react';
import { driverColor } from '@/lib/driverColor';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BrakeChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const BrakeChart: React.FC<BrakeChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>(initialDriver || '');
  const [selectedLap, setSelectedLap] = useState<string | number>(lap);
  const [lapOptions, setLapOptions] = useState<Array<string | number>>(['fastest']);
  const [isExporting, setIsExporting] = useState(false);
  const [shouldLoadChart, setShouldLoadChart] = useState(false);

  // Fetch available drivers
  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  // Fetch lap times to populate lap options
  const { data: lapTimes } = useQuery({
    queryKey: ['lapTimes', year, event, session, selectedDriver],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver]),
    enabled: !!year && !!event && !!session && !!selectedDriver,
  });

  useEffect(() => {
    if (lapTimes && lapTimes.length > 0) {
      const validLaps = lapTimes
        .filter(lap => lap[selectedDriver] !== null)
        .map(lap => lap.LapNumber.toString());
      setLapOptions(['fastest', ...validLaps]);
    } else {
      setLapOptions(['fastest']); // Reset if no lap times
    }
    // Reset selected lap when driver changes, unless it's the initial load
    if (selectedDriver !== initialDriver) {
        setSelectedLap('fastest');
    } else {
        setSelectedLap(lap); // Ensure initial lap prop is respected on mount
    }
  }, [lapTimes, selectedDriver, initialDriver, lap]);

  // Fetch brake data
  const { data: brakeData, isLoading: isLoadingBrake, error } = useQuery<BrakeDataPoint[]>({
    queryKey: ['brakeTrace', year, event, session, selectedDriver, selectedLap],
    queryFn: () => fetchTelemetryBrake(year, event, session, selectedDriver, selectedLap),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver && !!selectedLap && shouldLoadChart,
  });

  const color = driverColor(selectedDriver, year);
  const isLoading = isLoadingBrake;
  const chartTitle = title || (selectedDriver 
    ? `${selectedDriver}'s ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`} Brake Input` 
    : "Brake Input");

  // Handle chart download
  const handleDownload = async () => {
    if (!chartRef.current || isLoading || !brakeData || brakeData.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      // Brief delay to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use event name, driver, and lap for the filename
      const filename = `${event.toLowerCase().replace(/\s+/g, '-')}_${selectedDriver}_${selectedLap === 'fastest' ? 'fastest' : `lap${selectedLap}`}_brake`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = () => {
    // If chart shouldn't be loaded yet, show load button
    if (!shouldLoadChart) {
      return (
        <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gray-900/50 rounded-lg gap-4">
          <p className="text-gray-400">Select a driver and click load to view brake data</p>
          <Button 
            onClick={() => setShouldLoadChart(true)}
            variant="secondary"
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            disabled={!selectedDriver}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Load Chart
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
    if (error || !brakeData) {
      return (
        <div className="w-full h-[280px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">Error loading brake data</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
        </div>
      );
    }
    if (brakeData.length === 0) {
      return (
        <div className="w-full h-[260px] bg-gray-900/80 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-500">
          No brake telemetry data found for {selectedDriver} lap {selectedLap}.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={280} className="export-chart-container">
        <LineChart data={brakeData} margin={{ top: 0, right: 10, left: -15, bottom: 5 }} className="chart-main-container">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.3)" />
          <XAxis 
            type="number" 
            dataKey="Distance" 
            stroke="rgba(156, 163, 175, 0.7)" 
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} 
            tickFormatter={(value: number) => {
              // Use shorter label on small screens
              return window.innerWidth < 768 ? `${Math.round(value)}m` : `${value.toFixed(2)}m`;
            }} 
            domain={['dataMin', 'dataMax']} 
          />
          <YAxis 
            dataKey="Brake" 
            stroke="rgba(156, 163, 175, 0.7)" 
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }}  
            tickFormatter={(value) => `${value}%`} 
            domain={[0, 100]}
            width={50} 
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
            itemStyle={{ color: '#ef4444' }} 
            formatter={(value: any) => [`${typeof value === 'number' ? value : 0}%`, 'Brake']} 
            labelFormatter={(label: number) => `Distance: ${label.toFixed(2)}m`} 
          />
          <Line 
            type="monotone" 
            dataKey="Brake" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 4, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: "#ef4444" }} 
            name={selectedDriver} 
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
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-white">{chartTitle}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedDriver}
              onValueChange={(value) => {
                setSelectedDriver(value);
                setSelectedLap('fastest');
                // Reset chart loading state when driver changes
                if (shouldLoadChart) {
                  setShouldLoadChart(false);
                }
              }}
               disabled={isLoadingDrivers || !availableDrivers}
             >
               <SelectTrigger className="w-full sm:w-[150px] min-w-[100px] bg-gray-800/80 border-gray-700 text-gray-200 text-sm h-9">
                 <User className="w-4 h-4 mr-2 opacity-70"/>
                 <SelectValue placeholder="Select Driver" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500">Driver</SelectLabel>
                  {availableDrivers?.map((drv) => (
                    <SelectItem key={drv.code} value={drv.code} className="text-sm">
                      {drv.code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={selectedLap.toString()}
              onValueChange={(value) => setSelectedLap(value === 'fastest' ? 'fastest' : parseInt(value))}
              disabled={lapOptions.length <= 1}
            >
              <SelectTrigger className="w-full sm:w-[120px] bg-gray-800/80 border-gray-700 text-gray-200 text-sm h-9">
                <Clock className="w-4 h-4 mr-2 opacity-70"/>
                <SelectValue placeholder="Lap" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500">Lap</SelectLabel>
                  {lapOptions.map((lap) => (
                    <SelectItem key={lap.toString()} value={lap.toString()} className="text-sm">
                      {lap === 'fastest' ? 'Fastest' : lap}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
        {shouldLoadChart && !isLoading && brakeData && brakeData.length > 0 && (
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

export default BrakeChart; 