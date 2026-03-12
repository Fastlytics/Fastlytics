import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
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
  SpeedDataPoint,
  SpeedTraceResponse,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

type TelemetryType = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gap';
type TelemetryDataPoint =
  | ThrottleDataPoint
  | BrakeDataPoint
  | RPMDataPoint
  | DRSDataPoint
  | SpeedDataPoint;

type TelemetryKey = 'Speed' | 'Throttle' | 'Brake' | 'RPM' | 'DRS';

function getTelemetryValue(
  point: TelemetryDataPoint,
  key: TelemetryKey
): number | null | undefined {
  if (key === 'Speed' && 'Speed' in point) return (point as SpeedDataPoint).Speed;
  if (key === 'Throttle' && 'Throttle' in point) return (point as ThrottleDataPoint).Throttle;
  if (key === 'Brake' && 'Brake' in point) return (point as BrakeDataPoint).Brake;
  if (key === 'RPM' && 'RPM' in point) return (point as RPMDataPoint).RPM;
  if (key === 'DRS' && 'DRS' in point) return (point as DRSDataPoint).DRS;
  return null;
}

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string | null;
  color?: string;
}

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
}) => {
  const fetchTelemetry = async (
    driver: string,
    lap: string | number
  ): Promise<TelemetryDataPoint[]> => {
    // For 'gap', we need speed data to calculate time
    const typeToFetch = telemetryType === 'gap' ? 'speed' : telemetryType;

    switch (typeToFetch) {
      case 'throttle':
        return fetchTelemetryThrottle(year, event, session, driver, lap);
      case 'brake':
        return fetchTelemetryBrake(year, event, session, driver, lap);
      case 'rpm':
        return fetchTelemetryRPM(year, event, session, driver, lap);
      case 'drs':
        return fetchTelemetryDRS(year, event, session, driver, lap);
      case 'speed':
      default: {
        const result = await fetchTelemetrySpeed(year, event, session, driver, lap);
        // Handle both new SpeedTraceResponse and old SpeedDataPoint[] format
        if (Array.isArray(result)) return result;
        return result.trace ?? [];
      }
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
      // Handle both new SpeedTraceResponse format and old SpeedDataPoint[] format
      const extractSpeedData = (data: unknown): SpeedDataPoint[] => {
        if (Array.isArray(data)) return data as SpeedDataPoint[];
        if (data && typeof data === 'object' && 'trace' in data)
          return (data as SpeedTraceResponse).trace;
        return [];
      };
      const speedData1 = extractSpeedData(telemetryData1);
      const speedData2 = extractSpeedData(telemetryData2);

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

      return timeData1.map((d1) => {
        // Find corresponding time for d2 at d1.Distance
        let t2 = 0;
        const exactMatch = timeData2.find((d) => d.Distance === d1.Distance);
        if (exactMatch) {
          t2 = exactMatch.time;
        } else {
          const before = timeData2.filter((d) => d.Distance < d1.Distance).pop();
          const after = timeData2.find((d) => d.Distance > d1.Distance);

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
          Baseline: 0, // Driver 2 is baseline
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

    const getDataKey = (type: string): TelemetryKey => {
      switch (type) {
        case 'throttle':
          return 'Throttle';
        case 'brake':
          return 'Brake';
        case 'rpm':
          return 'RPM';
        case 'drs':
          return 'DRS';
        case 'speed':
        default:
          return 'Speed';
      }
    };

    const dataKey = getDataKey(telemetryType);

    const interpolateTelemetry = (
      distance: number,
      data: TelemetryDataPoint[],
      key: TelemetryKey
    ): number | null => {
      if (!data.length) return null;
      const exactMatch = data.find((point) => point.Distance === distance);
      if (exactMatch) {
        const val = getTelemetryValue(exactMatch, key);
        return val !== undefined ? val : null;
      }
      const { beforePoint, afterPoint } = findInterpolationPoints(distance, data);
      if (!beforePoint) {
        if (!afterPoint) return null;
        const val = getTelemetryValue(afterPoint, key);
        return val !== undefined ? val : null;
      }
      if (!afterPoint) {
        const val = getTelemetryValue(beforePoint, key);
        return val !== undefined ? val : null;
      }
      const beforeValue = getTelemetryValue(beforePoint, key);
      const afterValue = getTelemetryValue(afterPoint, key);
      if (beforeValue === null || beforeValue === undefined) return afterValue ?? null;
      if (afterValue === null || afterValue === undefined) return beforeValue;
      const distRatio =
        (distance - beforePoint.Distance) / (afterPoint.Distance - beforePoint.Distance);
      return beforeValue + distRatio * (afterValue - beforeValue);
    };

    // Use the dataset with more points as the base for distance
    const baseData =
      telemetryData1.length > telemetryData2.length ? telemetryData1 : telemetryData2;
    const otherData =
      telemetryData1.length > telemetryData2.length ? telemetryData2 : telemetryData1;
    const isDriver1Base = telemetryData1.length > telemetryData2.length;

    return baseData.map((point) => {
      const distance = point.Distance;
      const baseValue = getTelemetryValue(point, dataKey);
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
          showActiveDot: true,
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
          showActiveDot: true,
        };
      case 'rpm':
        return {
          dataKey: 'RPM',
          yAxisFormatter: (value: number) => `${Math.round(value / 1000)}k`,
          color1: '#fb923c',
          color2: '#fb923c',
          domain: [0, 13000] as [number, number],
          tooltipUnit: ' RPM',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true,
        };
      case 'drs':
        return {
          dataKey: 'DRS',
          yAxisFormatter: (value: number) => (value === 1 ? 'ON' : 'OFF'),
          color1: '#3b82f6',
          color2: '#3b82f6',
          domain: [-0.1, 1.1] as [number, number],
          tooltipUnit: '',
          type: 'stepAfter' as const,
          showYAxisTicks: false,
          showActiveDot: false,
        };
      case 'speed':
        return {
          dataKey: 'Speed',
          yAxisFormatter: (value: number) => `${Math.round(value)}`,
          color1: '#3b82f6',
          color2: '#3b82f6',
          domain: ['auto', 'auto'] as [
            number | 'auto' | 'dataMin' | 'dataMax',
            number | 'auto' | 'dataMin' | 'dataMax',
          ],
          tooltipUnit: ' km/h',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true,
        };
      case 'gap':
        return {
          dataKey: 'Gap',
          yAxisFormatter: (value: number) => `${value.toFixed(2)}s`,
          color1: '#ef4444', // Driver 1 Gap Color
          color2: '#666666', // Baseline Color
          domain: ['auto', 'auto'] as [
            number | 'auto' | 'dataMin' | 'dataMax',
            number | 'auto' | 'dataMin' | 'dataMax',
          ],
          tooltipUnit: 's',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true,
        };
      default:
        return {
          dataKey: 'Value',
          yAxisFormatter: (value: number) => `${value}`,
          color1: '#8884d8',
          color2: '#82ca9d',
          domain: ['auto', 'auto'] as [
            number | 'auto' | 'dataMin' | 'dataMax',
            number | 'auto' | 'dataMin' | 'dataMax',
          ],
          tooltipUnit: '',
          type: 'monotone' as const,
          showYAxisTicks: true,
          showActiveDot: true,
        };
    }
  };

  const props = getTelemetryProps();
  const color1 = driverColor(driver1, year);
  const color2 = driverColor(driver2, year);

  const chartVisRef = useChartVisibility({
    chartName: 'driver_comparison_telemetry',
    page: 'race',
    meta: { year, event, session },
  });
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  if (!shouldLoadChart) return null;

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className="w-full h-[400px] bg-neutral-950/80 border border-neutral-800/60 rounded-xl p-4 relative group overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 bg-red-500 rounded-full" />
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-[0.12em]">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title,
                subtitle: `${driver1} vs ${driver2} — ${telemetryType.toUpperCase()} comparison`,
                year,
                event,
                session,
                drivers: [driver1, driver2],
              })
            }
            isExporting={isExporting}
          />
          {(isLoading1 || isLoading2) && (
            <div className="w-4 h-4 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin" />
          )}
        </div>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={combinedTelemetryData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
            <XAxis
              dataKey="Distance"
              type="number"
              stroke="#333"
              tick={{ fill: '#888', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono' }}
              ticks={Array.from({ length: 8 }, (_, i) => (i + 1) * 1000).filter(
                (t) => t <= (combinedTelemetryData[combinedTelemetryData.length - 1]?.Distance ?? 0)
              )}
              tickFormatter={(val: number) => `${val}m`}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              stroke="#333"
              tick={{ fill: '#888', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono' }}
              domain={props.domain}
              tickFormatter={props.yAxisFormatter}
              hide={!props.showYAxisTicks}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-neutral-950/95 backdrop-blur-xl border border-neutral-700/40 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50">
                      <div className="text-neutral-500 text-[10px] font-mono mb-2 border-b border-neutral-800/50 pb-1.5 uppercase tracking-wider">
                        {Math.round(Number(label))}m
                      </div>
                      {payload.map((entry: TooltipPayloadEntry, index: number) => {
                        const isGap = telemetryType === 'gap';
                        const name = entry.name;
                        const value = entry.value;
                        const color = entry.color;

                        if (isGap) {
                          if (name === 'Gap' && typeof value === 'number') {
                            return (
                              <div key={index} className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: color1 }}
                                ></div>
                                <span className="text-xs font-black text-white font-mono">
                                  {driver1} vs {driver2}:
                                </span>
                                <span className="text-xs font-mono text-neutral-300">
                                  {value > 0 ? '+' : ''}
                                  {value.toFixed(3)}s
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }

                        return (
                          <div key={index} className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-xs font-black text-white font-mono">{name}:</span>
                            <span className="text-xs font-mono text-neutral-300">
                              {typeof value === 'number'
                                ? value.toFixed(telemetryType === 'rpm' ? 0 : 2)
                                : value}
                              {props.tooltipUnit}
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
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontFamily: 'Geist Mono', fontSize: '10px' }}
            />

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

export { DriverComparisonTelemetry };
export default DriverComparisonTelemetry;
