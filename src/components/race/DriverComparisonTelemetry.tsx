// knip-ignore
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
} from '@/lib/recharts-lazy';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTelemetryThrottle,
  fetchTelemetryBrake,
  fetchTelemetryRPM,
  fetchTelemetryDRS,
  fetchTelemetrySpeed,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import {
  buildCombinedTelemetryData,
  getTelemetryProps,
  TelemetryDataPoint,
  TelemetryType,
} from './driverComparisonTelemetryUtils';

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

  const combinedTelemetryData = useMemo(
    () =>
      buildCombinedTelemetryData(telemetryData1, telemetryData2, telemetryType, driver1, driver2),
    [telemetryData1, telemetryData2, telemetryType, driver1, driver2]
  );
  const props = getTelemetryProps(telemetryType);
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
      className="group relative h-[400px] w-full rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full" style={{ backgroundColor: color1 }} />
            <span
              className="text-[11px] font-semibold text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {driver1}
            </span>
          </div>
          <span className="text-[11px] text-white">vs</span>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full" style={{ backgroundColor: color2 }} />
            <span
              className="text-[11px] font-semibold text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {driver2}
            </span>
          </div>
          <div className="ml-2 h-4 w-px bg-white/[0.08]" />
          <h3
            className="text-[13px] font-semibold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {(isLoading1 || isLoading2) && <LoadingSpinnerF1 className="size-4" />}
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
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={combinedTelemetryData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="Distance"
              type="number"
              stroke="rgba(255,255,255,0.08)"
              tick={{
                fill: 'rgba(255,255,255,0.4)',
                fontSize: 11,
                fontFamily: "'Inter', sans-serif",
              }}
              ticks={Array.from({ length: 8 }, (_, i) => (i + 1) * 1000).filter(
                (t) => t <= (combinedTelemetryData[combinedTelemetryData.length - 1]?.Distance ?? 0)
              )}
              tickFormatter={(val: number) => `${val}m`}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              stroke="rgba(255,255,255,0.08)"
              tick={{
                fill: 'rgba(255,255,255,0.4)',
                fontSize: 11,
                fontFamily: "'Inter', sans-serif",
              }}
              domain={props.domain}
              tickFormatter={props.yAxisFormatter}
              hide={!props.showYAxisTicks}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl">
                      <div
                        className="mb-2 border-b border-white/[0.06] pb-1.5 text-[11px] font-medium text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {Math.round(Number(label))}m
                      </div>
                      {payload.map((entry: TooltipPayloadEntry) => {
                        const isGap = telemetryType === 'gap';
                        const name = entry.name;
                        const value = entry.value;
                        const color = entry.color;

                        if (isGap) {
                          if (name === 'Gap' && typeof value === 'number') {
                            return (
                              <div key={name || entry.dataKey} className="flex items-center gap-2">
                                <div
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: color1 }}
                                />
                                <span
                                  className="text-[12px] font-semibold text-white"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                  {driver1} vs {driver2}:
                                </span>
                                <span
                                  className="text-[12px] text-white"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                  {value > 0 ? '+' : ''}
                                  {value.toFixed(3)}s
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }

                        return (
                          <div key={name || entry.dataKey} className="mb-1 flex items-center gap-2">
                            <div
                              className="size-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span
                              className="text-[12px] font-semibold text-white"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {name}:
                            </span>
                            <span
                              className="text-[12px] text-white"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
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
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '10px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
              }}
            />

            {telemetryType === 'gap' ? (
              <>
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
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
