import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import {
  fetchTelemetryThrottle,
  fetchTelemetryBrake,
  fetchTelemetryRPM,
  fetchTelemetryDRS,
  fetchTelemetrySpeed,
  ThrottleDataPoint,
  BrakeDataPoint,
  RPMDataPoint,
  DRSDataPoint,
  SpeedDataPoint
} from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircleIcon, Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { areTeammates } from '@/lib/teamUtils';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { OpenF1Driver } from '@/lib/openf1';

type TelemetryDataPoint = ThrottleDataPoint | BrakeDataPoint | RPMDataPoint | DRSDataPoint | SpeedDataPoint;

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
  telemetryType: 'throttle' | 'brake' | 'rpm' | 'drs' | 'speed';
  openF1Drivers?: OpenF1Driver[];
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
  telemetryType,
  openF1Drivers = []
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (shouldLoadChart && driver1 && driver2) {
      trackEvent('driver_comparison', {
        driver_1: driver1,
        driver_2: driver2,
        circuit: event,
        telemetry_type: telemetryType
      });
    }
  }, [shouldLoadChart, driver1, driver2, event, telemetryType]);

  const { data: telemetryData1, isLoading: isLoadingTelemetry1, error: error1 } = useQuery<TelemetryDataPoint[]>({
    queryKey: [`${telemetryType}Trace`, year, event, session, driver1, lap1],
    queryFn: () => {
      switch (telemetryType) {
        case 'throttle': return fetchTelemetryThrottle(year, event, session, driver1, lap1);
        case 'brake': return fetchTelemetryBrake(year, event, session, driver1, lap1);
        case 'rpm': return fetchTelemetryRPM(year, event, session, driver1, lap1);
        case 'drs': return fetchTelemetryDRS(year, event, session, driver1, lap1);
        case 'speed': return fetchTelemetrySpeed(year, event, session, driver1, lap1);
        default: return fetchTelemetryThrottle(year, event, session, driver1, lap1);
      }
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!driver1 && !!lap1 && shouldLoadChart,
  });

  const { data: telemetryData2, isLoading: isLoadingTelemetry2, error: error2 } = useQuery<TelemetryDataPoint[]>({
    queryKey: [`${telemetryType}Trace`, year, event, session, driver2, lap2],
    queryFn: () => {
      switch (telemetryType) {
        case 'throttle': return fetchTelemetryThrottle(year, event, session, driver2, lap2);
        case 'brake': return fetchTelemetryBrake(year, event, session, driver2, lap2);
        case 'rpm': return fetchTelemetryRPM(year, event, session, driver2, lap2);
        case 'drs': return fetchTelemetryDRS(year, event, session, driver2, lap2);
        case 'speed': return fetchTelemetrySpeed(year, event, session, driver2, lap2);
        default: return fetchTelemetryThrottle(year, event, session, driver2, lap2);
      }
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!driver2 && !!lap2 && shouldLoadChart && driver1 !== driver2,
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
        case 'speed': return 'Speed';
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

    // Special handling for Gear (no interpolation, just nearest or previous)
    const getNearestGear = (distance: number, data: TelemetryDataPoint[]) => {
      if (!data.length) return null;
      // Find the point with the largest distance <= current distance
      const point = data.reduce((prev, curr) => {
        return (curr.Distance <= distance && curr.Distance > prev.Distance) ? curr : prev;
      }, data[0]);
      return (point as any).nGear;
    };

    const allDistances = new Set<number>();
    telemetryData1.forEach(point => allDistances.add(point.Distance));
    telemetryData2.forEach(point => allDistances.add(point.Distance));
    const distances = Array.from(allDistances).sort((a, b) => a - b);
    const sortedTelemetryData1 = [...telemetryData1].sort((a, b) => a.Distance - b.Distance);
    const sortedTelemetryData2 = [...telemetryData2].sort((a, b) => a.Distance - b.Distance);

    return distances.map(distance => {
      const point: any = {
        Distance: distance,
        [`${dataKey}_${driver1}`]: interpolateTelemetry(distance, sortedTelemetryData1, dataKey),
        [`${dataKey}_${driver2}`]: interpolateTelemetry(distance, sortedTelemetryData2, dataKey)
      };
      return point;
    });
  }, [telemetryData1, telemetryData2, driver1, driver2, telemetryType]);

  const driver1Color = driverColor(driver1, year);
  let driver2Color = driverColor(driver2, year);
  const sameTeam = driver1 && driver2 ? areTeammates(driver1, driver2, year) : false;
  if (sameTeam) {
    driver2Color = '#FFFFFF';
  }

  const isLoading = isLoadingTelemetry1 || isLoadingTelemetry2;
  const error = error1 || error2;

  // Stats Calculation
  const stats = useMemo(() => {
    if (telemetryType !== 'speed' || !telemetryData1 || !telemetryData2) return null;

    const calcStats = (data: SpeedDataPoint[]) => {
      const speeds = data.map(d => d.Speed);
      const max = Math.max(...speeds);
      const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      return { max, avg };
    };

    return {
      driver1: calcStats(telemetryData1 as SpeedDataPoint[]),
      driver2: calcStats(telemetryData2 as SpeedDataPoint[])
    };
  }, [telemetryData1, telemetryData2, telemetryType]);


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
      case 'speed':
        return {
          dataKey: 'Speed',
          yAxisFormatter: (value: number) => `${Math.round(value)}`,
          color1: '#3b82f6', // Will be overridden by driver colors
          color2: '#3b82f6',
          domain: ['auto', 'auto'] as [any, any],
          tooltipUnit: ' kph',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 border border-gray-700 p-4 rounded-none shadow-2xl backdrop-blur-md min-w-[250px]">
          <div className="flex flex-col gap-3">
            <div className="border-b border-gray-800 pb-2 mb-1">
              <span className="text-[10px] text-gray-500 font-mono">DIST: {Math.round(label)}m</span>
            </div>

            {/* Driver 1 */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                  {(() => {
                    const openF1Driver = openF1Drivers.find(d => d.name_acronym === driver1 || d.last_name.toUpperCase().slice(0, 3) === driver1);
                    return openF1Driver?.headshot_url ? (
                      <img src={openF1Driver.headshot_url} alt={driver1} className="w-full h-full object-cover scale-125 translate-y-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{driver1[0]}</div>
                    );
                  })()}
                </div>
                <span className="text-xs font-bold font-mono" style={{ color: driver1Color }}>{driver1}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-gray-500 uppercase font-mono">{props.dataKey}</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {Math.round(payload[0].value)}{props.tooltipUnit}
                  </span>
                </div>
              </div>
            </div>

            {/* Driver 2 */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                  {(() => {
                    const openF1Driver = openF1Drivers.find(d => d.name_acronym === driver2 || d.last_name.toUpperCase().slice(0, 3) === driver2);
                    return openF1Driver?.headshot_url ? (
                      <img src={openF1Driver.headshot_url} alt={driver2} className="w-full h-full object-cover scale-125 translate-y-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{driver2[0]}</div>
                    );
                  })()}
                </div>
                <span className="text-xs font-bold font-mono" style={{ color: driver2Color }}>{driver2}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-gray-500 uppercase font-mono">{props.dataKey}</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {Math.round(payload[1]?.value ?? 0)}{props.tooltipUnit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (!shouldLoadChart) {
      return (
        <div className="w-full h-[280px] flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 gap-4">
          <p className="text-gray-400 font-mono text-sm uppercase">Waiting for driver selection...</p>
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
          <AlertCircleIcon className="w-10 h-10 mb-2" />
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
      <div className="flex flex-col gap-4">
        <ResponsiveContainer width="100%" height={280} className="export-chart-container">
          <LineChart data={combinedTelemetryData} margin={{ top: 0, right: 10, left: -15, bottom: 5 }} className="chart-main-container">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis
              type="number"
              dataKey="Distance"
              stroke="#666"
              tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
              tickFormatter={(value: number) => `${value.toFixed(0)}m`}
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
              content={<CustomTooltip />}
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

        {/* Stats Section for Speed */}
        {telemetryType === 'speed' && stats && (
          <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
            {/* Driver 1 Stats */}
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver1Color }}></div>
                <span className="text-xs font-bold text-gray-300 font-mono">{driver1}</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Max</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(stats.driver1.max)} <span className="text-[10px] text-gray-500">km/h</span></span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Avg</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(stats.driver1.avg)} <span className="text-[10px] text-gray-500">km/h</span></span>
                </div>
              </div>
            </div>

            {/* Driver 2 Stats */}
            <div className="flex flex-col gap-2 p-3 bg-gray-900/30 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver2Color }}></div>
                <span className="text-xs font-bold text-gray-300 font-mono">{driver2}</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Max</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(stats.driver2.max)} <span className="text-[10px] text-gray-500">km/h</span></span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Avg</span>
                  <span className="text-lg font-bold text-white font-mono">{Math.round(stats.driver2.avg)} <span className="text-[10px] text-gray-500">km/h</span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={chartRef}
      className={cn("bg-black border-2 border-gray-800 p-6", className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">{title}</h3>

        {shouldLoadChart && !isLoading && combinedTelemetryData && combinedTelemetryData.length > 0 && (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver1Color }}></div>
              <span className="text-xs font-bold text-gray-300 font-mono">{driver1}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver2Color }}></div>
              <span className="text-xs font-bold text-gray-300 font-mono">{driver2}</span>
              {sameTeam && <span className="text-[10px] text-gray-500 uppercase font-mono">(teammate)</span>}
            </div>
          </div>
        )}
      </div>

      {renderContent()}


    </div>
  );
};

export default DriverComparisonTelemetry;