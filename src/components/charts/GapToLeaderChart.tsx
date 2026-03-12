import React, { useState, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  fetchLapTimes,
  fetchSessionDrivers,
  SessionDriver,
  LapTimeDataPoint,
  LapTimesEnrichedResponse,
} from '@/lib/api';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { AlertCircleIcon, Analytics01Icon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { Button } from '@/components/ui/button';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

const formatGap = (gap: number | null): string => {
  if (gap === null || isNaN(gap)) {
    return 'N/A';
  }
  if (gap === 0) {
    return '+0.000';
  }
  return gap > 0 ? `+${gap.toFixed(3)}` : gap.toFixed(3);
};

interface GapToLeaderChartProps {
  className?: string;
  delay?: number;
  year: number;
  event: string;
  session: string;
  initialDrivers?: string[];
  staticData?: LapTimeDataPoint[];
  title?: string;
  autoLoad?: boolean;
  favoriteDriver?: string | null;
  rivalDriver?: string | null;
}

const MIN_DRIVERS = 2;

const GapToLeaderChart: React.FC<GapToLeaderChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDrivers,
  staticData,
  autoLoad = false,
  favoriteDriver,
  rivalDriver,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartVisRef = useChartVisibility({
    chartName: 'gap_to_leader_chart',
    page: 'race',
    meta: { year, event, session },
  });
  const { trackInteraction } = useAnalytics();
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  const [shouldLoadChart, setShouldLoadChart] = useState(autoLoad || !!staticData);
  const [focusedDriver, setFocusedDriver] = useState<string | null>(null);

  const getInitialDrivers = () => {
    if (initialDrivers && initialDrivers.length >= MIN_DRIVERS) return initialDrivers;

    const defaults: string[] = [];
    if (favoriteDriver) defaults.push(favoriteDriver);
    if (rivalDriver) defaults.push(rivalDriver);

    return defaults;
  };

  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(getInitialDrivers());

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !staticData && !!year && !!event && !!session,
  });

  const effectiveDrivers = useMemo(() => {
    if (staticData) return selectedDrivers;

    // Filter out any selected drivers that are not in this session
    const validCodes = availableDrivers ? new Set(availableDrivers.map((d) => d.code)) : null;
    const validSelected = validCodes
      ? selectedDrivers.filter((d) => validCodes.has(d))
      : selectedDrivers;

    if (validSelected.length >= MIN_DRIVERS) return validSelected;
    if (!availableDrivers) return validSelected;

    const needed = MIN_DRIVERS - validSelected.length;
    const candidates = availableDrivers
      .filter((d) => !validSelected.includes(d.code))
      .slice(0, needed)
      .map((d) => d.code);
    return [...validSelected, ...candidates];
  }, [selectedDrivers, availableDrivers, staticData]);

  const driversToDisplay = useMemo(
    () => (staticData ? initialDrivers || [] : effectiveDrivers),
    [staticData, initialDrivers, effectiveDrivers]
  );

  const {
    data: fetchedEnrichedData,
    isLoading: isLoadingLapTimes,
    error,
    isError,
  } = useQuery<LapTimesEnrichedResponse>({
    queryKey: ['lapTimes', year, event, session, ...effectiveDrivers.sort()],
    queryFn: () => fetchLapTimes(year, event, session, effectiveDrivers),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
    enabled:
      !staticData &&
      !!year &&
      !!event &&
      !!session &&
      effectiveDrivers.length >= MIN_DRIVERS &&
      shouldLoadChart,
  });

  const lapData = staticData || fetchedEnrichedData?.lapComparison;

  // Calculate gap to leader for each lap
  const gapData = useMemo(() => {
    if (!lapData || lapData.length === 0) return [];

    // Calculate cumulative times for each driver
    const cumulativeTimes: Record<string, number[]> = {};
    driversToDisplay.forEach((driver) => {
      cumulativeTimes[driver] = [];
      let cumulative = 0;
      lapData.forEach((point) => {
        const time = point[driver] as number | null;
        cumulative += time || 0;
        cumulativeTimes[driver].push(cumulative);
      });
    });

    // Find leader for each lap (driver with lowest cumulative time)
    const leaderPerLap = lapData.map((point) => {
      let minCumulative = Infinity;
      let leader: string | null = null;

      driversToDisplay.forEach((driver) => {
        const lapIndex = point.LapNumber - 1;
        if (cumulativeTimes[driver][lapIndex] < minCumulative) {
          minCumulative = cumulativeTimes[driver][lapIndex];
          leader = driver;
        }
      });

      return leader;
    });

    // Calculate gap to leader for each lap
    const gapPoints = lapData.map((point) => {
      const lapIndex = point.LapNumber - 1;
      const leader = leaderPerLap[lapIndex];
      const gapPoint: LapTimeDataPoint = { LapNumber: point.LapNumber };

      driversToDisplay.forEach((driver) => {
        if (point[driver] !== null && leader !== null && cumulativeTimes[leader]) {
          const driverCumulative = cumulativeTimes[driver][lapIndex];
          const leaderCumulative = cumulativeTimes[leader][lapIndex];
          gapPoint[driver] = driverCumulative - leaderCumulative;
        } else {
          gapPoint[driver] = null;
        }
      });

      return gapPoint;
    });

    return gapPoints;
  }, [lapData, driversToDisplay]);

  const toggleDriver = (driverCode: string) => {
    trackInteraction('driver_toggled', {
      driver: driverCode,
      chart: 'gap_to_leader',
      year,
      event,
      session,
    });
    setSelectedDrivers((prev) => {
      if (prev.includes(driverCode)) {
        if (prev.length > MIN_DRIVERS) {
          return prev.filter((d) => d !== driverCode);
        }
        return prev;
      }
      return [...prev, driverCode];
    });
  };

  const isLoading = !staticData && isLoadingLapTimes;

  const renderContent = () => {
    if (!shouldLoadChart && !staticData) {
      return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center bg-neutral-900/20 border border-neutral-800/40 rounded-xl gap-4">
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Select drivers to compare</p>
          <Button
            onClick={() => {
              trackInteraction('chart_data_loaded', {
                chart: 'gap_to_leader',
                year,
                event,
                session,
              });
              setShouldLoadChart(true);
            }}
            className="bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs"
            disabled={selectedDrivers.length < MIN_DRIVERS || isLoadingDrivers}
          >
            <Analytics01Icon className="w-3.5 h-3.5 mr-1.5" />
            Load Data
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center bg-neutral-900/10 border border-neutral-800/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin" />
            <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider animate-pulse">Loading gap data...</span>
          </div>
        </div>
      );
    }

    if (isError || !lapData) {
      return (
        <div className="w-full h-[300px] bg-red-500/5 border border-red-500/20 rounded-xl flex flex-col items-center justify-center text-red-400">
          <AlertCircleIcon className="w-8 h-8 mb-2 opacity-60" />
          <p className="text-sm font-semibold">Error loading lap times</p>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            {(error as Error)?.message || 'Could not fetch data.'}
          </p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-xs uppercase font-semibold"
            >
              Back
            </Button>
          )}
        </div>
      );
    }

    if (lapData.length === 0 || gapData.length === 0) {
      return (
        <div className="w-full h-[300px] bg-neutral-900/10 border border-neutral-800/30 rounded-xl flex flex-col items-center justify-center text-neutral-500">
          <p className="text-xs font-mono uppercase tracking-widest">No common lap data found</p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-neutral-800 hover:bg-neutral-800 rounded-md"
            >
              Back
            </Button>
          )}
        </div>
      );
    }

    const teamGroups = groupDriversByTeam(driversToDisplay, year);

    return (
      <ResponsiveContainer width="100%" height={500} className="export-chart-container mb-8">
        <LineChart data={gapData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
          <XAxis
            dataKey="LapNumber"
            stroke="#333"
            tick={{ fill: '#888', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono' }}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            stroke="#333"
            tick={{ fill: '#888', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono' }}
            domain={['auto', 'auto']}
            tickFormatter={formatGap}
            allowDecimals={true}
            width={60}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const sortedPayload = [...payload].sort(
                (a, b) => ((a.value as number) || Infinity) - ((b.value as number) || Infinity)
              );

              return (
                <div className="bg-neutral-950/95 backdrop-blur-xl border border-neutral-700/40 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-[500px] z-50">
                  <div className="text-white font-semibold border-b border-neutral-800/50 pb-2 mb-2.5 font-mono text-xs uppercase tracking-wider">
                    Lap {label}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {sortedPayload.map((entry) => {
                      const driverCode = String(entry.name);
                      const gap = entry.value;
                      if (gap === null) return null;

                      const headshot = getDriverImage(driverCode, year);
                      const color = entry.color;

                      return (
                        <div key={driverCode} className="flex items-center gap-2 min-w-[120px]">
                          <div className="w-6 h-6 rounded-full bg-black overflow-hidden shrink-0 border border-neutral-800">
                            {headshot ? (
                              <img
                                src={headshot}
                                alt={driverCode}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-500">
                                {driverCode[0]}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-black font-mono" style={{ color }}>
                            {formatGap(gap as number)}
                          </span>
                          <span className="text-xs font-mono text-neutral-400 font-black">
                            {driverCode}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              paddingBottom: '10px',
              fontFamily: 'Geist Mono',
              fontSize: '12px',
            }}
            onClick={(e) => {
              if (e && e.value) {
                trackInteraction('legend_driver_focused', {
                  chart: 'gap_to_leader',
                  year,
                  event,
                  session,
                });
                if (focusedDriver === e.value) {
                  setFocusedDriver(null);
                } else {
                  setFocusedDriver(e.value);
                }
              }
            }}
            onMouseEnter={(e) => e && e.value && setFocusedDriver(e.value)}
            onMouseLeave={() => setFocusedDriver(null)}
            formatter={(value, entry) => {
              const isFocused = focusedDriver === value;
              const isDimmed = focusedDriver && focusedDriver !== value;
              return (
                <span
                  style={{
                    color: entry.color,
                    opacity: isDimmed ? 0.3 : 1,
                    fontWeight: isFocused ? 'bold' : 'normal',
                  }}
                >
                  {value}
                </span>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#888" strokeWidth={1} strokeDasharray="4 4" label="Leader" />
          {driversToDisplay.map((driverCode, index) => {
            const color = driverColor(driverCode, year);
            let teammates: string[] = [];
            Object.values(teamGroups).forEach((drivers) => {
              if (drivers.includes(driverCode)) teammates = drivers;
            });
            const lineStyle = getLineStylesForDriver(driverCode, teammates, index);
            const isFocused = focusedDriver === driverCode;
            const isDimmed = focusedDriver && !isFocused;

            return (
              <Line
                key={driverCode}
                type="monotone"
                dataKey={driverCode}
                stroke={color}
                strokeWidth={isFocused ? 4 : lineStyle.strokeWidth}
                strokeOpacity={isDimmed ? 0.1 : 1}
                strokeDasharray={lineStyle.strokeDasharray}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                name={driverCode}
                connectNulls={true}
              />
            );
          })}
          <Brush
            dataKey="LapNumber"
            height={28}
            stroke="#333"
            fill="#0a0a0a"
            tickFormatter={() => ''}
            travellerWidth={10}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div
      ref={(el) => {
        chartRef.current = el;
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn('space-y-6 relative', className)}
      style={{ animationDelay: `${delay * 100} ms` } as React.CSSProperties}
    >
      <div className="flex flex-col gap-4 mb-6 border-b border-neutral-800/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-red-500 rounded-full" />
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-[0.12em]">Gap to Leader</h3>
          </div>
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title: 'Gap to Leader',
                subtitle: 'Cumulative gap to race leader over laps',
                year,
                event,
                session,
                drivers: driversToDisplay,
              })
            }
            isExporting={isExporting}
          />
        </div>
        {!staticData && availableDrivers && (
          <div className="flex flex-wrap gap-2">
            {availableDrivers.map((driver) => {
              const isSelected = selectedDrivers.includes(driver.code);
              const headshot = getDriverImage(driver.code, year);
              const color = driverColor(driver.code, year);

              return (
                <button
                  key={driver.code}
                  onClick={() => toggleDriver(driver.code)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 group',
                    isSelected
                      ? 'bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600/60'
                      : 'bg-transparent border-transparent opacity-40 hover:opacity-80 hover:bg-neutral-800/30'
                  )}
                  style={isSelected ? { borderLeftColor: color, borderLeftWidth: '3px' } : {}}
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-800 overflow-hidden border border-neutral-800 shrink-0">
                    {headshot ? (
                      <img
                        src={headshot}
                        alt={driver.code}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-500 font-mono">
                        {driver.code[0]}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-mono font-bold',
                      isSelected ? 'text-white' : 'text-neutral-500'
                    )}
                  >
                    {driver.code}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

export { GapToLeaderChart };
export default GapToLeaderChart;
