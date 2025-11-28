import React, { useState, useEffect, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis, Cell
} from 'recharts';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchTelemetryGear, fetchSessionDrivers, fetchLapTimes, SessionDriver, GearMapDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircleIcon, UserIcon, Clock01Icon, Analytics01Icon } from 'hugeicons-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

const gearColors = [
  '#33bbee', // 1st Gear (Cyan)
  '#ee7733', // 2nd Gear (Orange)
  '#009988', // 3rd Gear (Teal)
  '#cc3311', // 4th Gear (Red)
  '#ee3377', // 5th Gear (Magenta)
  '#0077bb', // 6th Gear (Blue)
  '#aacc00', // 7th Gear (Lime Green)
  '#ffdd55'  // 8th Gear (Yellow)
];
const getGearColor = (gear: number): string => {
  if (gear >= 1 && gear <= gearColors.length) {
    return gearColors[gear - 1];
  }
  return '#6B7280';
};

interface GearMapChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
}

const GearMapChart: React.FC<GearMapChartProps> = ({
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

  const [shouldLoadChart, setShouldLoadChart] = useState(false);

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity, gcTime: 1000 * 60 * 60 * 24, enabled: !!year && !!event && !!session,
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

  const { data: gearData, isLoading: isLoadingGear, error, isError } = useQuery<GearMapDataPoint[]>({
    queryKey: ['gearTrace', year, event, session, selectedDriver, selectedLap],
    queryFn: () => fetchTelemetryGear(year, event, session, selectedDriver, selectedLap),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver && !!selectedLap && shouldLoadChart,
  });

  const isLoading = isLoadingDrivers || isLoadingGear;
  const chartTitle = title || (selectedDriver
    ? `${selectedDriver}'s ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`} Gear Shifts`
    : "Gear Shifts");



  const renderContent = () => {
    if (!shouldLoadChart) {
      return (
        <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 gap-4">
          <p className="text-gray-400 font-mono text-sm uppercase">Select a driver and click load to view gear data</p>
          <Button
            onClick={() => setShouldLoadChart(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-none"
            disabled={!selectedDriver}
          >
            <Analytics01Icon className="w-4 h-4 mr-2" />
            Load Chart
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[350px] flex items-center justify-center bg-gray-900/50 border border-gray-800">
          <LoadingSpinnerF1 />
        </div>
      );
    }

    if (isError || !gearData || gearData.length === 0) {
      const message = isError
        ? (error as Error)?.message || 'Could not fetch data.'
        : `No gear telemetry data found for ${selectedDriver} lap ${selectedLap}.`;
      const title = isError ? "Error loading gear map" : "No Data Available";
      return (
        <div className="w-full h-[350px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500">
          <AlertCircleIcon className={`w-10 h-10 mb-2 ${isError ? 'text-red-400' : ''}`} />
          <p className={`font-bold uppercase ${isError ? 'text-red-400' : ''}`}>{title}</p>
          <p className="text-xs mt-1 text-gray-500">{message}</p>
        </div>
      );
    }

    const scatterData = gearData.map(point => ({
      x: point.X,
      y: point.Y,
      z: point.nGear
    }));

    return (
      <ResponsiveContainer width="100%" height={350} className="export-chart-container">
        <ScatterChart margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
          <XAxis type="number" dataKey="x" hide={true} domain={['dataMin', 'dataMax']} />
          <YAxis type="number" dataKey="y" hide={true} domain={['dataMin', 'dataMax']} axisLine={false} tickLine={false} />
          <ZAxis type="number" dataKey="z" range={[1, 8]} name="Gear" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#000',
              borderColor: '#333',
              color: '#fff',
              borderRadius: '0px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
              fontFamily: 'monospace'
            }}
            labelStyle={{ display: 'none' }}
            formatter={(value: number, name: string, props: any) => [`Gear: ${props.payload.z}`, null]}
          />
          <Legend
            {...({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: (value: any, entry: any, index: number) => <span className="text-gray-400 font-mono text-xs uppercase">Gear {index + 1}</span>,
              iconSize: 10,
              wrapperStyle: { paddingTop: '10px' },
              payload: gearColors.map((color, index) => ({
                value: `Gear ${index + 1}`, type: 'circle', id: `ID${index}`, color: color
              }))
            } as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          />
          <Scatter name="Track Position" data={scatterData} fill="#8884d8" shape="circle">
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getGearColor(entry.z)} />
            ))}
          </Scatter>
        </ScatterChart>
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
              <UserIcon className="w-3 h-3 mr-2 opacity-50" />
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
              <Clock01Icon className="w-3 h-3 mr-2 opacity-50" />
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


    </div>
  );
};

export default GearMapChart;
