import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn, exportChartAsImage } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchTelemetryRPM, fetchSessionDrivers, fetchLapTimes, SessionDriver, RPMDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircle, User, Clock, Download, BarChart2 } from 'lucide-react';
import { driverColor } from '@/lib/driverColor';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

interface RPMChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const RPMChart: React.FC<RPMChartProps> = ({
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

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

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
      setLapOptions(['fastest']);
    }
    if (selectedDriver !== initialDriver) {
      setSelectedLap('fastest');
    } else {
      setSelectedLap(lap);
    }
  }, [lapTimes, selectedDriver, initialDriver, lap]);

  const { data: rpmData, isLoading: isLoadingRPM, error } = useQuery<RPMDataPoint[]>({
    queryKey: ['rpmTrace', year, event, session, selectedDriver, selectedLap],
    queryFn: () => fetchTelemetryRPM(year, event, session, selectedDriver, selectedLap),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver && !!selectedLap && shouldLoadChart,
  });

  const color = driverColor(selectedDriver, year);
  const isLoading = isLoadingRPM;
  const chartTitle = title || (selectedDriver
    ? `${selectedDriver}'s ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`} RPM`
    : "RPM");

  const handleDownload = async () => {
    if (!chartRef.current || isLoading || !rpmData || rpmData.length === 0) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const filename = `${event.toLowerCase().replace(/\s+/g, '-')}_${selectedDriver}_${selectedLap === 'fastest' ? 'fastest' : `lap${selectedLap}`}_rpm`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = () => {
    if (!shouldLoadChart) {
      return (
        <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 gap-4">
          <p className="text-gray-400 font-mono text-sm uppercase">Select a driver and click load to view RPM data</p>
          <Button
            onClick={() => setShouldLoadChart(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-none"
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
        <div className="w-full h-[280px] flex items-center justify-center bg-gray-900/50 border border-gray-800">
          <LoadingSpinnerF1 />
        </div>
      );
    }
    if (error || !rpmData) {
      return (
        <div className="w-full h-[280px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-bold uppercase">Error loading RPM data</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
        </div>
      );
    }
    if (rpmData.length === 0) {
      return (
        <div className="w-full h-[260px] bg-black border border-gray-800 flex items-center justify-center text-gray-500 font-mono uppercase">
          No RPM telemetry data found for {selectedDriver} lap {selectedLap}.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={280} className="export-chart-container">
        <LineChart data={rpmData} margin={{ top: 0, right: 10, left: -15, bottom: 5 }} className="chart-main-container">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis
            type="number"
            dataKey="Distance"
            stroke="#666"
            tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
            tickFormatter={(value: number) => {
              return window.innerWidth < 768 ? `${Math.round(value)}m` : `${value.toFixed(2)}m`;
            }}
            domain={['dataMin', 'dataMax']}
          />
          <YAxis
            dataKey="RPM"
            stroke="#666"
            tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
            tickFormatter={(value) => `${Math.round(value)}`}
            domain={[0, 13000]}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#000',
              borderColor: '#333',
              color: '#fff',
              borderRadius: '0px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
              fontFamily: 'monospace'
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid #333' }}
            itemStyle={{ color: color }}
            formatter={(value: number) => [`${Math.round(value)}`, 'RPM']}
            labelFormatter={(label: number) => `DIST: ${label.toFixed(2)}m`}
          />
          <Line
            type="monotone"
            dataKey="RPM"
            stroke="#fb923c"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#fb923c" }}
            name={selectedDriver}
            connectNulls={true}
          />
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
        <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">{chartTitle}</h3>
        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedDriver}
            onValueChange={(value) => {
              setSelectedDriver(value);
              setSelectedLap('fastest');
              if (shouldLoadChart) {
                setShouldLoadChart(false);
              }
            }}
            disabled={isLoadingDrivers || !availableDrivers}
          >
            <SelectTrigger className="w-full sm:w-[150px] min-w-[100px] bg-gray-900 border-gray-700 text-white text-xs h-8 rounded-none focus:ring-red-600">
              <User className="w-3 h-3 mr-2 opacity-50" />
              <SelectValue placeholder="Select Driver" />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-700 text-white rounded-none">
              <SelectGroup>
                <SelectLabel className="text-xs text-gray-500 uppercase">Driver</SelectLabel>
                {availableDrivers?.map((drv) => (
                  <SelectItem key={drv.code} value={drv.code} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
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
            <SelectTrigger className="w-full sm:w-[120px] bg-gray-900 border-gray-700 text-white text-xs h-8 rounded-none focus:ring-red-600">
              <Clock className="w-3 h-3 mr-2 opacity-50" />
              <SelectValue placeholder="Lap" />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[200px]">
              <SelectGroup>
                <SelectLabel className="text-xs text-gray-500 uppercase">Lap</SelectLabel>
                {lapOptions.map((lap) => (
                  <SelectItem key={lap.toString()} value={lap.toString()} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
                    {lap === 'fastest' ? 'Fastest' : lap}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderContent()}

      {shouldLoadChart && !isLoading && rpmData && rpmData.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-gray-500 hover:text-white flex items-center gap-1.5 uppercase font-bold tracking-wider"
            onClick={handleDownload}
            disabled={isExporting}
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Download Chart"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RPMChart;