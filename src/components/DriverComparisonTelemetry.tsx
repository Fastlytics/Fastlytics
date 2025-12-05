import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
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
import { driverColor } from '@/lib/driverColor';
import { OpenF1Driver } from '@/lib/openf1';
import { Analytics01Icon } from 'hugeicons-react';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";

type TelemetryType = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gap';
type TelemetryDataPoint = ThrottleDataPoint | BrakeDataPoint | RPMDataPoint | DRSDataPoint | SpeedDataPoint;

interface DriverComparisonTelemetryProps {
  year: number;
  event: string;
  session: string;
  driver1: string;
  driver2: string;
  lap1: string | number;
  lap2: string | number;
  shouldLoadChart: boolean;
  telemetryType: TelemetryType;
  title: string;
  openF1Drivers?: OpenF1Driver[];
}

const DriverComparisonTelemetry: React.FC<DriverComparisonTelemetryProps> = ({
  year,
  event,
  session,
  driver1,
  driver2,
  lap1,
  lap2,
  shouldLoadChart,
  telemetryType,
  title,
  openF1Drivers = []
}) => {

  const fetchTelemetry = async (driver: string, lap: string | number) => {
    // For 'gap', we need speed data to calculate time
    const typeToFetch = telemetryType === 'gap' ? 'speed' : telemetryType;

    switch (typeToFetch) {
      case 'throttle': return fetchTelemetryThrottle(year, event, session, driver, lap);
      case 'brake': return fetchTelemetryBrake(year, event, session, driver, lap);
      case 'rpm': return fetchTelemetryRPM(year, event, session, driver, lap);
      case 'drs': return fetchTelemetryDRS(year, event, session, driver, lap);
      case 'speed': return fetchTelemetrySpeed(year, event, session, driver, lap);
      default: return fetchTelemetrySpeed(year, event, session, driver, lap);
    }
  };

  const { data: telemetryData1, isLoading: isLoading1 } = useQuery({
    queryKey: ['comparisonTelemetry', telemetryType, year, event, session, driver1, lap1],
    queryFn: () => fetchTelemetry(driver1, lap1),
    enabled: shouldLoadChart && !!driver1 && !!lap1,
    staleTime: Infinity,
  });

  const { data: telemetryData2, isLoading: isLoading2 } = useQuery({
    queryKey: ['comparisonTelemetry', telemetryType, year, event, session, driver2, lap2],
    queryFn: () => fetchTelemetry(driver2, lap2),
    enabled: shouldLoadChart && !!driver2 && !!lap2,
    staleTime: Infinity,
  });

  const combinedTelemetryData = React.useMemo(() => {
    if (!telemetryData1 || !telemetryData2) return [];

    // --- GAP CALCULATION LOGIC ---
    if (telemetryType === 'gap') {
      const speedData1 = telemetryData1 as SpeedDataPoint[];
      const speedData2 = telemetryData2 as SpeedDataPoint[];

      const calculateTime = (speedData: SpeedDataPoint[]) => {
        let time = 0;
        return speedData.map((point, i) => {
          if (i === 0) return { ...point, time: 0 };
          const prev = speedData[i - 1];
          const distDelta = point.Distance - prev.Distance;
          const avgSpeed = (point.Speed + prev.Speed) / 2 / 3.6; // km/h to m/s
          const timeDelta = avgSpeed > 0 ? distDelta / avgSpeed : 0;
          time += timeDelta;
          return { ...point, time };
        });
      };

      const timeData1 = calculateTime(speedData1);
      const timeData2 = calculateTime(speedData2);

      // Interpolate Driver 2 Time to Driver 1 Distances
      // We will plot Gap relative to Driver 2 (so Driver 2 is the baseline 0)
      // Gap = Driver 1 Time - Driver 2 Time (at same distance)
      // If Driver 1 is slower, Time is higher -> Gap > 0
      // If Driver 1 is faster, Time is lower -> Gap < 0

      return timeData1.map(d1 => {
        // Find corresponding time for d2 at d1.Distance
        let t2 = 0;
        const exactMatch = timeData2.find(d => d.Distance === d1.Distance);
        if (exactMatch) {
          t2 = exactMatch.time;
        } else {
          const before = timeData2.filter(d => d.Distance < d1.Distance).pop();
          const after = timeData2.find(d => d.Distance > d1.Distance);

          if (before && after) {
            const ratio = (d1.Distance - before.Distance) / (after.Distance - before.Distance);
            t2 = before.time + ratio * (after.time - before.time);
          } else if (before) {
            t2 = before.time;
          } else if (after) {
            t2 = after.time;
          }
        }

        return {
          Distance: d1.Distance,
          Gap: d1.time - t2, // Gap of Driver 1 relative to Driver 2
          Baseline: 0 // Driver 2 is baseline
        };
      });
    }

    // --- STANDARD TELEMETRY LOGIC ---
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

    // Use the dataset with more points as the base for distance
    const baseData = telemetryData1.length > telemetryData2.length ? telemetryData1 : telemetryData2;
    const otherData = telemetryData1.length > telemetryData2.length ? telemetryData2 : telemetryData1;
    const isDriver1Base = telemetryData1.length > telemetryData2.length;

    return baseData.map(point => {
      const distance = point.Distance;
      const baseValue = (point as any)[dataKey];
      const otherValue = interpolateTelemetry(distance, otherData, dataKey);

      return {
        Distance: distance,
        [isDriver1Base ? driver1 : driver2]: baseValue,
        [isDriver1Base ? driver2 : driver1]: otherValue,
      };
    });
  }, [telemetryData1, telemetryData2, telemetryType, driver1, driver2]);

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
          yAxisFormatter: (value: number) => `${value}`,
          color1: '#fb923c',
          color2: '#fb923c',
          domain: [0, 13000] as [number, number],
          tooltipUnit: ' RPM',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
      case 'drs':
        return {
          dataKey: 'DRS',
          yAxisFormatter: (value: number) => value === 1 ? 'ON' : 'OFF',
          color1: '#3b82f6',
          color2: '#3b82f6',
          domain: [-0.1, 1.1] as [number, number],
          tooltipUnit: '',
          type: 'stepAfter' as const,
          showYAxisTicks: false,
          showActiveDot: false
        };
      case 'speed':
        return {
          dataKey: 'Speed',
          yAxisFormatter: (value: number) => `${Math.round(value)}`,
          color1: '#3b82f6',
          color2: '#3b82f6',
          domain: ['auto', 'auto'] as [any, any],
          tooltipUnit: ' km/h',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
      case 'gap':
        return {
          dataKey: 'Gap',
          yAxisFormatter: (value: number) => `${value.toFixed(2)}s`,
          color1: '#ef4444', // Driver 1 Gap Color
          color2: '#666666', // Baseline Color
          domain: ['auto', 'auto'] as [any, any],
          tooltipUnit: 's',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
      default:
        return {
          dataKey: 'Value',
          yAxisFormatter: (value: number) => `${value}`,
          color1: '#8884d8',
          color2: '#82ca9d',
          domain: ['auto', 'auto'] as [any, any],
          tooltipUnit: '',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true
        };
    }
  };

  const props = getTelemetryProps();
  const color1 = driverColor(driver1, year);
  const color2 = driverColor(driver2, year);

  if (!shouldLoadChart) return null;

  return (
    <div className="w-full h-[400px] bg-black/40 border border-gray-800 p-4 rounded-lg relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Analytics01Icon className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-black uppercase italic text-white tracking-tighter">{title}</h3>
        </div>
        {(isLoading1 || isLoading2) && <LoadingSpinnerF1 className="w-4 h-4" />}
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={combinedTelemetryData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis
              dataKey="Distance"
              stroke="#666"
              tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${Math.round(val)}m`}
            />
            <YAxis
              stroke="#666"
              tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
              domain={props.domain}
              tickFormatter={props.yAxisFormatter}
              hide={!props.showYAxisTicks}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-black border border-gray-800 p-3 shadow-xl z-50">
                      <div className="text-gray-400 text-xs font-mono mb-2 border-b border-gray-800 pb-1">
                        {Math.round(Number(label))}m
                      </div>
                      {payload.map((entry: any, index: number) => {
                        const isGap = telemetryType === 'gap';
                        const name = entry.name;
                        const value = entry.value;
                        const color = entry.color;

                        // For Gap, we handle names differently
                        if (isGap) {
                          if (name === 'Gap') {
                            return (
                              <div key={index} className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color1 }}></div>
                                <span className="text-xs font-bold text-white font-mono">{driver1} vs {driver2}:</span>
                                <span className="text-xs font-mono text-gray-300">
                                  {value > 0 ? '+' : ''}{value.toFixed(3)}s
                                </span>
                              </div>
                            );
                          }
                          return null; // Don't show baseline in tooltip
                        }

                        return (
                          <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                            <span className="text-xs font-bold text-white font-mono">{name}:</span>
                            <span className="text-xs font-mono text-gray-300">
                              {typeof value === 'number' ? value.toFixed(telemetryType === 'rpm' ? 0 : 2) : value}{props.tooltipUnit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontFamily: 'monospace', fontSize: '10px' }} />

            {telemetryType === 'gap' ? (
              <>
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Line
                  type={props.type}
                  dataKey="Gap"
                  name={`${driver1} vs ${driver2}`}
                  stroke={color1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={props.showActiveDot ? { r: 4, strokeWidth: 0, fill: color1 } : false}
                  connectNulls={true}
                />
              </>
            ) : (
              <>
                <Line
                  type={props.type}
                  dataKey={driver1}
                  stroke={color1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={props.showActiveDot ? { r: 4, strokeWidth: 0, fill: color1 } : false}
                  connectNulls={true}
                />
                <Line
                  type={props.type}
                  dataKey={driver2}
                  stroke={color2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={props.showActiveDot ? { r: 4, strokeWidth: 0, fill: color2 } : false}
                  connectNulls={true}
                  strokeOpacity={0.7}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DriverComparisonTelemetry;