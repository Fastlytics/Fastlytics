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
import { Button } from '@/components/ui/button';

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
  shouldLoadChart: boolean;
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
  const [shouldLoadTelemetry, setShouldLoadTelemetry] = useState(false);

  useEffect(() => {
    if (shouldLoadTelemetry && (driver1 !== prevDriver1.current || driver2 !== prevDriver2.current)) {
      setShouldLoadTelemetry(false);
    }
    prevDriver1.current = driver1;
    prevDriver2.current = driver2;
  }, [driver1, driver2, shouldLoadTelemetry]);

  const prevDriver1 = useRef(driver1);
  const prevDriver2 = useRef(driver2);

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

  const combinedTelemetryData = React.useMemo(() => {
    if (!telemetryData1 || !telemetryData2) return [];

    const findInterpolationPoints = (distance: number, data: TelemetryDataPoint[]) => {
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

    const getDataKey = (type: string) => {
      switch (type) {
        case 'throttle': return 'Throttle';
        case 'brake': return 'Brake';
        case 'rpm': return 'RPM';
        case 'drs': return 'DRS';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
      }
    };

    const dataKey = getDataKey(telemetryType);

    const interpolateTelemetry = (distance: number, data: TelemetryDataPoint[], key: string) => {
      if (!data.length) return null;
      const exactMatch = data.find(point => point.Distance === distance);
      if (exactMatch) return (exactMatch as any)[key];
      const { beforePoint, afterPoint } = findInterpolationPoints(distance, data);
      if (!beforePoint) return afterPoint ? (afterPoint as any)[key] || null : null;
      if (!afterPoint) return beforePoint ? (beforePoint as any)[key] || null : null;
      const beforeValue = (beforePoint as any)[key];
      const afterValue = (afterPoint as any)[key];
      if (beforeValue === null || beforeValue === undefined) return afterValue;
      if (afterValue === null || afterValue === undefined) return beforeValue;
      const distRatio = (distance - beforePoint.Distance) / (afterPoint.Distance - beforePoint.Distance);
      return beforeValue + distRatio * (afterValue - beforeValue);
    };

    const allDistances = new Set<number>();
    telemetryData1.forEach(point => allDistances.add(point.Distance));
    telemetryData2.forEach(point => allDistances.add(point.Distance));
    const distances = Array.from(allDistances).sort((a, b) => a - b);
    const sortedTelemetryData1 = [...telemetryData1].sort((a, b) => a.Distance - b.Distance);
    const sortedTelemetryData2 = [...telemetryData2].sort((a, b) => a.Distance - b.Distance);

    return distances.map(distance => ({
      Distance: distance,
      [`${dataKey}_${driver1}`]: interpolateTelemetry(distance, sortedTelemetryData1, dataKey),
      [`${dataKey}_${driver2}`]: interpolateTelemetry(distance, sortedTelemetryData2, dataKey)
    }));
  }, [telemetryData1, telemetryData2, driver1, driver2, telemetryType]);

  const driver1Color = driverColor(driver1, year);
  let driver2Color = driverColor(driver2, year);
  const sameTeam = driver1 && driver2 ? areTeammates(driver1, driver2, year) : false;
  if (sameTeam) {
    driver2Color = '#FFFFFF';
  }

  const isLoading = isLoadingTelemetry1 || isLoadingTelemetry2;
  const error = error1 || error2;

  const handleDownload = async () => {
    if (!chartRef.current || isLoading || !combinedTelemetryData || combinedTelemetryData.length === 0) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const filename = `${event.toLowerCase().replace(/\s+/g, '-')}_${driver1}_vs_${driver2}_${telemetryType}`;
      await exportChartAsImage(chartRef, filename);
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getTelemetryProps = () => {
    switch (telemetryType) {
      case 'throttle':
        return {
          dataKey: 'Throttle',
          yAxisFormatter: (value: number) => `${value.toFixed(1)}%`,
          color1: '#10b981',
          color2: '#10b981',
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
          color1: '#ef4444',
          color2: '#ef4444',
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
          color1: '#fb923c',
          color2: '#fb923c',
          domain: [0, 13000] as [number, number],
          tooltipUnit: '',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
      case 'drs':
        return {
          dataKey: 'DRS',
          yAxisFormatter: (value: number) => value === 1 ? 'On' : 'Off',
          color1: '#3b82f6',
          color2: '#3b82f6',
          domain: [-0.1, 1.1] as [number, number],
          tooltipUnit: '',
          type: 'step' as const,
          showYAxisTicks: false,
          showActiveDot: false
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
    if (!shouldLoadTelemetry) {
      return (
        <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 gap-4">
          <p className="text-gray-400 font-mono text-sm uppercase">Click load to view {telemetryType} comparison</p>
          <Button
            onClick={() => setShouldLoadTelemetry(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-none"
            disabled={!driver1 || !driver2 || driver1 === driver2}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Load Data
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

    if (error || !telemetryData1 || !telemetryData2) {
      return (
        <div className="w-full h-[280px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-bold uppercase">Error loading {telemetryType} data</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
        </div>
      );
    }
    if (combinedTelemetryData.length === 0) {
      return (
        <div className="w-full h-[260px] bg-black border border-gray-800 flex items-center justify-center text-gray-500 font-mono uppercase">
          No {telemetryType} telemetry data found.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={280} className="export-chart-container">
        <LineChart data={combinedTelemetryData} margin={{ top: 0, right: 10, left: -15, bottom: 5 }} className="chart-main-container">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis
            type="number"
            dataKey="Distance"
            stroke="#666"
            tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
            tickFormatter={(value: number) => `${value.toFixed(2)}m`}
            domain={['dataMin', 'dataMax']}
          />
          <YAxis
            dataKey={`${props.dataKey}_${driver1}`}
            stroke="#666"
            tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
            tickFormatter={props.yAxisFormatter}
            domain={props.domain}
            width={50}
            hide={!props.showYAxisTicks}
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
            formatter={(value: any, name: string) => {
              const isDriver1 = name.endsWith(driver1);
              const driverName = isDriver1 ? driver1 : driver2;
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

              return [
                <span style={colorStyle}>{formattedValue}</span>,
                <span style={colorStyle}>{formattedName}</span>
              ];
            }}
            labelFormatter={(label: number) => `DIST: ${label.toFixed(2)}m`}
            cursor={telemetryType !== 'drs'}
          />
          <Line
            type={props.type}
            dataKey={`${props.dataKey}_${driver1}`}
            stroke={driver1Color}
            strokeWidth={2}
            dot={false}
            activeDot={props.showActiveDot ? { r: 4, strokeWidth: 0, fill: driver1Color } : false}
            name={driver1}
            connectNulls={true}
          />
          <Line
            type={props.type}
            dataKey={`${props.dataKey}_${driver2}`}
            stroke={driver2Color}
            strokeWidth={2}
            dot={false}
            activeDot={props.showActiveDot ? { r: 4, strokeWidth: 0, fill: driver2Color } : false}
            name={driver2}
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
        <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">{title}</h3>

        {shouldLoadTelemetry && !isLoading && combinedTelemetryData && combinedTelemetryData.length > 0 && (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver1Color }}></div>
              <span className="text-xs font-bold text-gray-300">{driver1}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver2Color }}></div>
              <span className="text-xs font-bold text-gray-300">{driver2}</span>
              {sameTeam && <span className="text-[10px] text-gray-500 uppercase">(teammate)</span>}
            </div>
          </div>
        )}
      </div>

      {renderContent()}

      {shouldLoadTelemetry && !isLoading && combinedTelemetryData && combinedTelemetryData.length > 0 && (
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

export default DriverComparisonTelemetry;