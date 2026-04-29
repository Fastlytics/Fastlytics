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
import { AlertCircleIcon } from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { Button } from '@/components/ui/button';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpDownIcon } from 'hugeicons-react';

const formatGap = (gap: number | null): string => {
  if (gap === null || isNaN(gap)) return 'N/A';
  if (gap === 0) return '+0.000';
  return gap > 0 ? `+${gap.toFixed(3)}` : gap.toFixed(3);
};

const inter = { fontFamily: "'Inter', sans-serif" } as const;

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
  const [isDriverPopoverOpen, setIsDriverPopoverOpen] = useState(false);

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

  const driverNameMap = useMemo(() => {
    if (!availableDrivers) return new Map<string, string>();
    const map = new Map<string, string>();
    availableDrivers.forEach((d) => {
      if (d.code && d.name) map.set(d.code, d.name);
    });
    return map;
  }, [availableDrivers]);

  const effectiveDrivers = useMemo(() => {
    if (staticData) return selectedDrivers;
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

  const gapData = useMemo(() => {
    if (!lapData || lapData.length === 0) return [];
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
        if (prev.length > MIN_DRIVERS) return prev.filter((d) => d !== driverCode);
        return prev;
      }
      return [...prev, driverCode];
    });
  };

  const isLoading = !staticData && isLoadingLapTimes;

  const renderContent = () => {
    if (!shouldLoadChart && !staticData) {
      return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] gap-4">
          <p className="text-white text-[13px] font-medium uppercase tracking-wider">
            Select drivers to compare
          </p>
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
            className="rounded-lg bg-white hover:bg-white/90 text-black font-semibold text-[12px] uppercase tracking-wider"
            disabled={selectedDrivers.length < MIN_DRIVERS || isLoadingDrivers}
          >
            Load Data
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <LoadingSpinnerF1 />
        </div>
      );
    }

    if (isError || !lapData) {
      return (
        <div className="w-full h-[300px] rounded-xl border border-red-500/20 bg-red-500/[0.04] flex flex-col items-center justify-center text-red-400">
          <AlertCircleIcon className="w-10 h-10 mb-2" />
          <p className="font-semibold uppercase text-[13px]">Error loading lap times</p>
          <p className="text-xs text-white mt-1">
            {(error as Error)?.message || 'Could not fetch data.'}
          </p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold text-[11px] uppercase tracking-wider"
            >
              Back
            </Button>
          )}
        </div>
      );
    }

    if (lapData.length === 0 || gapData.length === 0) {
      return (
        <div className="w-full h-[300px] rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center justify-center text-white text-[13px] font-medium uppercase tracking-wider">
          <p>No common lap data found.</p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg border-white/[0.08] text-white hover:bg-white/[0.06] font-semibold text-[11px] uppercase tracking-wider"
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="LapNumber"
            stroke="rgba(255,255,255,0.15)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.15)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
            domain={['auto', 'auto']}
            tickFormatter={formatGap}
            allowDecimals={true}
            width={65}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const sortedPayload = [...payload].sort(
                (a, b) => ((a.value as number) || Infinity) - ((b.value as number) || Infinity)
              );

              return (
                <div
                  className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl max-w-[500px] z-50"
                  style={inter}
                >
                  <div className="text-white font-bold uppercase tracking-wider border-b border-white/[0.06] pb-2 mb-2 text-[12px]">
                    Lap {label}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {sortedPayload.map((entry) => {
                      const driverCode = String(entry.name);
                      const gap = entry.value;
                      if (gap === null) return null;
                      const headshot = getDriverImage(driverCode, year);
                      const color = entry.color;
                      const fullName = driverNameMap.get(driverCode) || driverCode;

                      return (
                        <div key={driverCode} className="flex items-center gap-2 min-w-[120px]">
                          <Avatar className="h-6 w-6 shrink-0 border border-white/[0.08]">
                            <AvatarImage src={headshot} className="object-cover object-top" />
                            <AvatarFallback className="bg-[#1a1a1e] text-[8px] font-bold text-white">
                              {driverCode[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] font-bold" style={{ color }}>
                            {formatGap(gap as number)}
                          </span>
                          <span className="text-[12px] font-semibold text-white/80 truncate">
                            {fullName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              paddingBottom: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
            }}
            onClick={(e) => {
              if (e && e.value) {
                trackInteraction('legend_driver_focused', {
                  chart: 'gap_to_leader',
                  year,
                  event,
                  session,
                });
                if (focusedDriver === e.value) setFocusedDriver(null);
                else setFocusedDriver(e.value);
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
                    fontWeight: isFocused ? 700 : 400,
                  }}
                >
                  {value}
                </span>
              );
            }}
          />
          <ReferenceLine
            y={0}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
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
            height={24}
            stroke="rgba(255,255,255,0.1)"
            fill="rgba(255,255,255,0.03)"
            tickFormatter={() => ''}
            travellerWidth={8}
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
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold uppercase tracking-wider text-white">
            Gap to Leader
          </h3>
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
          <Popover open={isDriverPopoverOpen} onOpenChange={setIsDriverPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06] hover:text-white transition-all text-[11px] font-semibold uppercase tracking-wider w-fit">
                <span>
                  {selectedDrivers.length === availableDrivers.length
                    ? 'All Drivers'
                    : `${selectedDrivers.length} / ${availableDrivers.length} Selected`}
                </span>
                <ArrowUpDownIcon className="h-3.5 w-3.5 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[280px] p-1.5 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
              style={inter}
              align="end"
            >
              <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-white/[0.06] pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                  {selectedDrivers.length} / {availableDrivers.length} visible
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      trackInteraction('select_all_drivers', {
                        chart: 'gap_to_leader',
                        year,
                        event,
                        session,
                      });
                      setSelectedDrivers(availableDrivers.map((d) => d.code));
                    }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      trackInteraction('deselect_all_drivers', {
                        chart: 'gap_to_leader',
                        year,
                        event,
                        session,
                      });
                      setSelectedDrivers(availableDrivers.slice(0, MIN_DRIVERS).map((d) => d.code));
                    }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="grid gap-0.5">
                  {availableDrivers.map((driver) => {
                    const isSelected = selectedDrivers.includes(driver.code);
                    const headshot = getDriverImage(driver.code, year);
                    const color = driverColor(driver.code, year);
                    const fullName = driverNameMap.get(driver.code) || driver.code;
                    const isFavorite = favoriteDriver && driver.code === favoriteDriver;

                    return (
                      <button
                        key={driver.code}
                        onClick={() => toggleDriver(driver.code)}
                        className={cn(
                          'flex items-center gap-3 w-full px-2.5 py-2 rounded-lg transition-all text-left',
                          isSelected ? 'bg-white/[0.04]' : 'opacity-50 hover:opacity-70',
                          isFavorite && isSelected && 'bg-red-500/[0.06]',
                          focusedDriver && focusedDriver !== driver.code && '!opacity-20'
                        )}
                        onMouseEnter={() => setFocusedDriver(driver.code)}
                        onMouseLeave={() => setFocusedDriver(null)}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all',
                            isSelected
                              ? 'bg-red-500 border-red-500'
                              : 'border-white/[0.15] bg-transparent'
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div
                          className={cn(
                            'h-8 w-0.5 rounded-full shrink-0 transition-opacity',
                            isSelected ? 'opacity-100' : 'opacity-30'
                          )}
                          style={{ backgroundColor: color }}
                        />
                        <Avatar className="h-8 w-8 shrink-0 border border-white/[0.08]">
                          <AvatarImage src={headshot} className="object-cover object-top" />
                          <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                            {driver.code[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={cn(
                              'text-[12px] font-semibold truncate transition-colors',
                              isFavorite ? 'text-red-400' : isSelected ? 'text-white' : 'text-white'
                            )}
                          >
                            {fullName}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-medium',
                              isSelected ? 'text-white/80' : 'text-white/80'
                            )}
                          >
                            {driver.code}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

export { GapToLeaderChart };
export default GapToLeaderChart;
