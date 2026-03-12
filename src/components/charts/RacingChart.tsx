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
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { CustomTooltipProps, CustomLegendProps } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
  fetchLapTimes,
  fetchSessionDrivers,
  SessionDriver,
  LapTimeDataPoint,
  LapTimesEnrichedResponse,
  EnrichedLapRecord,
} from '@/lib/api';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import {
  AlertCircleIcon,
  PlusSignCircleIcon,
  CancelCircleIcon,
  Analytics01Icon,
  Time01Icon,
  InformationCircleIcon,
} from 'hugeicons-react';
import { driverColor } from '@/lib/driverColor';
import { getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDriverImage } from '@/utils/imageMapping';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds} `;
};

interface RacingChartProps {
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

const RacingChart: React.FC<RacingChartProps> = ({
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
    chartName: 'lap_time_chart',
    page: 'race',
    meta: { year, event, session },
  });
  const { trackInteraction } = useAnalytics();
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  const [shouldLoadChart, setShouldLoadChart] = useState(autoLoad || !!staticData);
  const [focusedDriver, setFocusedDriver] = useState<string | null>(null);
  const [fuelCorrectionEnabled, setFuelCorrectionEnabled] = useState(false);

  // Determine initial drivers based on props
  const getInitialDrivers = () => {
    if (initialDrivers && initialDrivers.length >= MIN_DRIVERS) return initialDrivers;

    const defaults: string[] = [];
    if (favoriteDriver) defaults.push(favoriteDriver);
    if (rivalDriver) defaults.push(rivalDriver);

    // If we still need drivers, we'll fill them in after fetching available drivers
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
    data: enrichedResponse,
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

  const lapData = staticData || enrichedResponse?.lapComparison;
  const driverLapDetails = enrichedResponse?.driverLapDetails;
  const weatherData = enrichedResponse?.weather;

  // Fuel correction constants
  const TOTAL_FUEL_KG = 110;
  const FUEL_PER_LAP_KG = 1.8;
  const SECONDS_PER_KG_PER_LAP = 0.03;

  // Apply fuel correction to lap data
  const correctedLapData = useMemo(() => {
    if (!lapData || !fuelCorrectionEnabled) {
      return lapData;
    }

    // Only apply correction for first 60% of laps (fuel effect minimal after)
    const maxLapForCorrection = Math.ceil(lapData.length * 0.6);

    return lapData.map((point) => {
      const lapNumber = point.LapNumber;
      if (lapNumber > maxLapForCorrection) {
        return point;
      }

      const fuelLoad = TOTAL_FUEL_KG - lapNumber * FUEL_PER_LAP_KG;
      const correctionAmount = fuelLoad * SECONDS_PER_KG_PER_LAP;

      // Apply correction to each driver's lap time
      const correctedPoint = { ...point };
      Object.keys(point).forEach((key) => {
        if (key !== 'LapNumber' && typeof point[key] === 'number') {
          correctedPoint[key as keyof LapTimeDataPoint] =
            (point[key as keyof LapTimeDataPoint] as number) - correctionAmount;
        }
      });

      return correctedPoint;
    });
  }, [lapData, fuelCorrectionEnabled]);

  const chartData = correctedLapData;

  const toggleDriver = (driverCode: string) => {
    trackInteraction('driver_toggled', {
      driver: driverCode,
      chart: 'lap_time',
      year,
      event,
      session,
    });
    setSelectedDrivers((prev) => {
      if (prev.includes(driverCode)) {
        if (prev.length > MIN_DRIVERS) {
          return prev.filter((d) => d !== driverCode);
        }
        return prev; // Cannot remove if it would go below MIN_DRIVERS
      }
      return [...prev, driverCode];
    });
  };

  const isLoading = !staticData && isLoadingLapTimes;

  // Calculate Fastest Laps
  const fastestLaps = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    const stats = driversToDisplay.map((driver) => {
      let minTime = Infinity;
      let lapNum = -1;

      chartData.forEach((point) => {
        const time = point[driver] as number | null;
        if (time !== null && time < minTime) {
          minTime = time;
          lapNum = point.LapNumber;
        }
      });

      return {
        driver,
        fastestTime: minTime === Infinity ? null : minTime,
        lapNumber: lapNum,
      };
    });

    // Sort by fastest time
    return stats.sort((a, b) => {
      if (a.fastestTime === null) return 1;
      if (b.fastestTime === null) return -1;
      return a.fastestTime - b.fastestTime;
    });
  }, [chartData, driversToDisplay]);

  const renderContent = () => {
    if (!shouldLoadChart && !staticData) {
      return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center bg-neutral-900/20 border border-neutral-800/40 rounded-xl gap-4">
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Select drivers to compare</p>
          <Button
            onClick={() => {
              trackInteraction('chart_data_loaded', { chart: 'lap_time', year, event, session });
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
            <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider animate-pulse">Loading lap times...</span>
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
    if (lapData.length === 0) {
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
      <>
        <ResponsiveContainer width="100%" height={500} className="export-chart-container mb-8">
          <LineChart data={chartData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
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
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tickFormatter={formatLapTime}
              allowDecimals={true}
              width={60}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const lapNumber = label as number;
                // Sort by time (value)
                const sortedPayload = [...payload].sort(
                  (a, b) => ((a.value as number) || Infinity) - ((b.value as number) || Infinity)
                );

                return (
                  <div className="bg-neutral-950/95 backdrop-blur-xl border border-neutral-700/40 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-[600px] z-50">
                    <div className="text-white font-semibold border-b border-neutral-800/50 pb-2 mb-2.5 font-mono text-xs uppercase tracking-wider">
                      Lap {lapNumber}
                    </div>
                    <div className="space-y-2">
                      {sortedPayload.map((entry) => {
                        const driverCode = String(entry.name);
                        const time = entry.value;
                        if (time === null) return null;

                        const headshot = getDriverImage(driverCode, year);
                        const color = entry.color;
                        // Get enriched details for this lap
                        const lapDetail = driverLapDetails?.[driverCode]?.find(
                          (l: EnrichedLapRecord) => l.lapNumber === lapNumber
                        );

                        const compoundColors: Record<string, string> = {
                          SOFT: '#FF3333',
                          MEDIUM: '#FFC107',
                          HARD: '#EEEEEE',
                          INTERMEDIATE: '#4CAF50',
                          WET: '#2196F3',
                        };

                        return (
                          <div
                            key={driverCode}
                            className="border-b border-neutral-800/50 pb-2 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center gap-2">
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
                                {formatLapTime(time as number)}
                              </span>
                              <span className="text-xs font-mono text-neutral-400 font-black">
                                {driverCode}
                              </span>
                              {lapDetail?.compound && (
                                <span
                                  className="text-[10px] font-black px-1.5 py-0.5"
                                  style={{
                                    backgroundColor:
                                      (compoundColors[lapDetail.compound] || '#666') + '22',
                                    color: compoundColors[lapDetail.compound] || '#666',
                                  }}
                                >
                                  {lapDetail.compound[0]}
                                </span>
                              )}
                              {lapDetail?.tyreLife != null && (
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  L{lapDetail.tyreLife}
                                </span>
                              )}
                              {lapDetail?.position != null && (
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  P{lapDetail.position}
                                </span>
                              )}
                              {lapDetail?.deleted && (
                                <span className="text-[10px] text-red-500 font-black">DEL</span>
                              )}
                              {lapDetail?.isPersonalBest && (
                                <span className="text-[10px] text-green-400 font-black">PB</span>
                              )}
                            </div>
                            {lapDetail &&
                              (lapDetail.sector1 != null ||
                                lapDetail.sector2 != null ||
                                lapDetail.sector3 != null) && (
                                <div className="flex gap-3 mt-1 ml-8">
                                  {lapDetail.sector1 != null && (
                                    <span className="text-[10px] font-mono text-neutral-500">
                                      S1{' '}
                                      <span className="text-neutral-300">
                                        {lapDetail.sector1.toFixed(3)}
                                      </span>
                                    </span>
                                  )}
                                  {lapDetail.sector2 != null && (
                                    <span className="text-[10px] font-mono text-neutral-500">
                                      S2{' '}
                                      <span className="text-neutral-300">
                                        {lapDetail.sector2.toFixed(3)}
                                      </span>
                                    </span>
                                  )}
                                  {lapDetail.sector3 != null && (
                                    <span className="text-[10px] font-mono text-neutral-500">
                                      S3{' '}
                                      <span className="text-neutral-300">
                                        {lapDetail.sector3.toFixed(3)}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              )}
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
                    chart: 'lap_time',
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

        {/* Weather Banner */}
        {weatherData && (
          <div className="flex items-center gap-4 px-4 py-2.5 bg-neutral-900/30 border border-neutral-800/40 rounded-lg text-xs font-mono text-neutral-300 mb-4">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Conditions</span>
            <span>
              AIR <span className="text-white font-bold">{weatherData.airTemp.toFixed(1)}°C</span>
            </span>
            <span>
              TRACK{' '}
              <span className="text-white font-bold">{weatherData.trackTemp.toFixed(1)}°C</span>
            </span>
            <span>
              HUM <span className="text-white font-bold">{weatherData.humidity.toFixed(0)}%</span>
            </span>
            <span>
              WIND{' '}
              <span className="text-white font-bold">{weatherData.windSpeed.toFixed(1)} m/s</span>
            </span>
            {weatherData.rainfall && <span className="text-blue-400 font-bold">🌧️ RAIN</span>}
          </div>
        )}

        {/* Fastest Laps Table — enriched */}
        <div className="border-t border-neutral-800/30 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Time01Icon className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Fastest Laps (Selection)
            </h4>
          </div>
          <div className="overflow-x-auto border border-neutral-800/40 rounded-lg bg-neutral-950/50">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800/30 hover:bg-transparent bg-neutral-900/20">
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8">
                    Driver
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-right">
                    Time
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-center">
                    Lap
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-right">
                    Gap
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-center">
                    Tyre
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-right">
                    S1
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-right">
                    S2
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-right">
                    S3
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider h-8 text-right">
                    ST
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fastestLaps.map((stat, index) => {
                  const gap =
                    stat.fastestTime && fastestLaps[0].fastestTime
                      ? stat.fastestTime - fastestLaps[0].fastestTime
                      : null;
                  const color = driverColor(stat.driver, year);
                  // Get the enriched record for the fastest lap
                  const lapDetail = driverLapDetails?.[stat.driver]?.find(
                    (l: EnrichedLapRecord) => l.lapNumber === stat.lapNumber
                  );
                  const compoundColors: Record<string, string> = {
                    SOFT: '#FF3333',
                    MEDIUM: '#FFC107',
                    HARD: '#EEEEEE',
                    INTERMEDIATE: '#4CAF50',
                    WET: '#2196F3',
                  };

                  return (
                    <TableRow
                      key={stat.driver}
                      className="border-b border-neutral-800/20 hover:bg-neutral-800/15 transition-colors"
                    >
                      <TableCell className="py-2 font-mono font-black" style={{ color }}>
                        {stat.driver}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-neutral-300">
                        {formatLapTime(stat.fastestTime)}
                      </TableCell>
                      <TableCell className="py-2 text-center font-mono text-neutral-500 text-xs">
                        {stat.lapNumber !== -1 ? `L${stat.lapNumber}` : '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs">
                        {index === 0 ? (
                          <span className="text-purple-400 font-black">FASTEST</span>
                        ) : (
                          <span className="text-neutral-500">
                            {gap !== null ? `+${gap.toFixed(3)}s` : '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {lapDetail?.compound ? (
                          <span
                            className="text-[10px] font-black px-1.5 py-0.5"
                            style={{
                              backgroundColor:
                                (compoundColors[lapDetail.compound] || '#666') + '22',
                              color: compoundColors[lapDetail.compound] || '#666',
                            }}
                          >
                            {lapDetail.compound}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs text-neutral-400">
                        {lapDetail?.sector1 != null ? lapDetail.sector1.toFixed(3) : '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs text-neutral-400">
                        {lapDetail?.sector2 != null ? lapDetail.sector2.toFixed(3) : '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs text-neutral-400">
                        {lapDetail?.sector3 != null ? lapDetail.sector3.toFixed(3) : '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs text-neutral-400">
                        {lapDetail?.speedST != null ? `${lapDetail.speedST.toFixed(0)}` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Deleted Laps & Speed Traps Summary */}
        {driverLapDetails && (
          <div className="flex flex-col gap-0 border-t border-neutral-800/30">
            {/* Deleted Laps */}
            {(() => {
              const deletedLaps = driversToDisplay.flatMap((drv) =>
                (driverLapDetails[drv] || [])
                  .filter((l: EnrichedLapRecord) => l.deleted)
                  .map((l: EnrichedLapRecord) => ({ driver: drv, ...l }))
              );
              if (deletedLaps.length === 0) return null;
              return (
                <div className="px-5 py-4 border-r border-neutral-800/30">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                    Deleted Laps ({deletedLaps.length})
                  </h4>
                  <div className="space-y-1">
                    {deletedLaps.slice(0, 10).map((dl, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-mono font-bold">
                        <span
                          style={{ color: driverColor(dl.driver, year) }}
                          className="font-black w-10"
                        >
                          {dl.driver}
                        </span>
                        <span className="text-white">Lap {dl.lapNumber}</span>
                        {dl.lapTime != null && (
                          <span className="text-white">{formatLapTime(dl.lapTime)}</span>
                        )}
                        {dl.deletedReason && (
                          <span className="text-red-400 text-xs bg-red-500/15 px-2 py-0.5 font-bold">
                            {dl.deletedReason}
                          </span>
                        )}
                      </div>
                    ))}
                    {deletedLaps.length > 10 && (
                      <span className="text-xs text-neutral-400 font-bold">
                        +{deletedLaps.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Speed Trap Comparison */}
            {(() => {
              const speedData = driversToDisplay
                .map((drv) => {
                  const records = (driverLapDetails[drv] || []).filter(
                    (l: EnrichedLapRecord) => l.speedST != null
                  );
                  if (records.length === 0) return null;
                  const speeds = records.map((r: EnrichedLapRecord) => r.speedST!);
                  return {
                    driver: drv,
                    maxSpeed: Math.max(...speeds),
                    avgSpeed: +(
                      speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length
                    ).toFixed(1),
                    color: driverColor(drv, year),
                  };
                })
                .filter(Boolean) as {
                driver: string;
                maxSpeed: number;
                avgSpeed: number;
                color: string;
              }[];
              if (speedData.length === 0) return null;
              speedData.sort((a, b) => b.maxSpeed - a.maxSpeed);
              const chartHeight = Math.max(100, speedData.length * 50);
              return (
                <div className="px-5 py-4">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                    Speed Trap (km/h)
                  </h4>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                      data={speedData}
                      layout="vertical"
                      margin={{ top: 0, right: 50, left: 5, bottom: 0 }}
                      barGap={3}
                    >
                      <XAxis
                        type="number"
                        domain={[
                          (dataMin: number) => Math.floor(dataMin - 5),
                          (dataMax: number) => Math.ceil(dataMax + 3),
                        ]}
                        tick={{
                          fill: '#888',
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'Geist Mono',
                        }}
                        stroke="#333"
                      />
                      <YAxis
                        type="category"
                        dataKey="driver"
                        tick={{
                          fill: '#999',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'Geist Mono',
                        }}
                        width={48}
                        stroke="transparent"
                      />
                      <Tooltip
                        cursor={{ fill: '#ffffff10' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-neutral-950/95 backdrop-blur-xl border border-neutral-700/40 rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[150px]">
                                <p className="text-white font-bold font-mono border-b border-neutral-800/50 pb-1.5 mb-2 text-xs">
                                  {label}
                                </p>
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex gap-3 items-center mb-1 last:mb-0"
                                  >
                                    <div
                                      className="w-3 h-3 rounded-sm"
                                      style={{
                                        backgroundColor: entry.color,
                                        opacity: entry.name === 'Max Speed' ? 0.9 : 0.3,
                                      }}
                                    />
                                    <p className="text-xs font-semibold text-neutral-300 flex-1">
                                      {entry.name}:
                                    </p>
                                    <span className="text-white font-bold font-mono text-xs">
                                      {Number(entry.value).toFixed(1)} km/h
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="maxSpeed"
                        name="Max Speed"
                        barSize={18}
                        radius={[0, 4, 4, 0]}
                        label={{
                          position: 'right',
                          fill: '#FFF',
                          fontSize: 13,
                          fontWeight: 'bold',
                          formatter: (v: number) => `${v.toFixed(0)}`,
                        }}
                      >
                        {speedData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} fillOpacity={0.9} />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="avgSpeed"
                        name="Avg Speed"
                        barSize={18}
                        radius={[0, 4, 4, 0]}
                        label={{
                          position: 'right',
                          fill: '#999',
                          fontSize: 12,
                          fontWeight: 'bold',
                          formatter: (v: number) => `${v.toFixed(0)}`,
                        }}
                      >
                        {speedData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} fillOpacity={0.3} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 mt-1 justify-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-2.5 rounded-sm bg-gray-300 opacity-90" />
                      <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase">Max Speed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-2.5 rounded-sm bg-gray-300 opacity-30" />
                      <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase">Avg Speed</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tyre Strategy & Degradation */}
        {driverLapDetails && (
          <div className="border-t border-neutral-800/30">
            <div className="px-5 py-4">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Tyre Strategy & Stint Pace
              </h4>
              <div className="space-y-2">
                {driversToDisplay.map((drv) => {
                  const records = driverLapDetails[drv] || [];
                  if (records.length === 0) return null;
                  const stintMap = new Map<number, EnrichedLapRecord[]>();
                  records.forEach((r: EnrichedLapRecord) => {
                    if (r.stint != null) {
                      if (!stintMap.has(r.stint)) stintMap.set(r.stint, []);
                      stintMap.get(r.stint)!.push(r);
                    }
                  });
                  const color = driverColor(drv, year);
                  const headshot = getDriverImage(drv, year);
                  const compoundColors: Record<string, string> = {
                    SOFT: '#FF3333',
                    MEDIUM: '#FFC107',
                    HARD: '#EEEEEE',
                    INTERMEDIATE: '#4CAF50',
                    WET: '#2196F3',
                  };
                  const totalDriverLaps =
                    records.length > 0
                      ? records[records.length - 1]?.lapNumber || records.length
                      : records.length;
                  const stintEntries = Array.from(stintMap.entries());

                  return (
                    <div key={drv} className="border border-neutral-800/40 bg-neutral-950/50 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <div
                          className="w-7 h-7 rounded-full bg-neutral-800 overflow-hidden border-2 shrink-0"
                          style={{ borderColor: color }}
                        >
                          {headshot ? (
                            <img
                              src={headshot}
                              alt={drv}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-mono font-bold">
                              {drv[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-mono font-black" style={{ color }}>
                          {drv}
                        </span>
                        <span className="text-xs font-mono text-neutral-400 font-bold">
                          {stintEntries.length} stint{stintEntries.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-col border-t border-neutral-800/30 divide-y divide-neutral-800/20 bg-neutral-900/10">
                        {stintEntries.map(([stintNum, laps]) => {
                          const compound = laps[0]?.compound || '?';
                          const lapCount = laps.length;
                          const validTimes = laps
                            .filter((l: EnrichedLapRecord) => l.lapTime != null && !l.deleted)
                            .map((l: EnrichedLapRecord) => l.lapTime!);
                          const avgTime =
                            validTimes.length > 0
                              ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
                              : null;
                          const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
                          const tyreLifeEnd = laps[laps.length - 1]?.tyreLife;
                          const freshTyre = laps[0]?.freshTyre;
                          return (
                            <div
                              key={stintNum}
                              className="flex items-center justify-between px-3 py-2 relative overflow-hidden group hover:bg-neutral-800/30 transition-colors"
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1.5"
                                style={{ backgroundColor: compoundColors[compound] || '#666' }}
                              />
                              <div className="flex items-center gap-4 pl-3">
                                <span
                                  className="text-sm font-black w-24"
                                  style={{ color: compoundColors[compound] || '#FFF' }}
                                >
                                  {compound}
                                </span>
                                <span className="text-xs text-white font-mono font-bold">
                                  Laps {laps[0]?.lapNumber}–{laps[laps.length - 1]?.lapNumber}{' '}
                                  <span className="text-neutral-500">({lapCount} laps)</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-6 text-right">
                                {freshTyre != null && (
                                  <span
                                    className={`text-[10px] uppercase font-mono font-black ${freshTyre ? 'text-green-500' : 'text-yellow-500'} hidden sm:inline-block`}
                                  >
                                    {freshTyre ? 'New' : 'Used'}
                                  </span>
                                )}
                                {tyreLifeEnd != null && (
                                  <span className="text-xs font-mono text-neutral-400 font-bold hidden md:inline-block">
                                    Life: {tyreLifeEnd}
                                  </span>
                                )}
                                <div className="flex flex-col min-w-[100px] text-left">
                                  {avgTime != null ? (
                                    <span className="text-xs font-mono text-white font-black">
                                      Avg: {formatLapTime(avgTime)}
                                    </span>
                                  ) : (
                                    <span className="text-xs font-mono text-neutral-500 font-black">
                                      Avg: N/A
                                    </span>
                                  )}
                                  {bestTime != null && (
                                    <span className="text-[10px] font-mono text-neutral-400 font-bold">
                                      Best: {formatLapTime(bestTime)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
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
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-[0.12em]">Lap Times</h3>
          </div>
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title: 'Lap Times',
                subtitle: fuelCorrectionEnabled
                  ? 'Fuel-corrected lap times'
                  : 'Raw lap times comparison',
                year,
                event,
                session,
                drivers: driversToDisplay,
              })
            }
            isExporting={isExporting}
          />
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Fuel Corrected</span>
            <Switch
              checked={fuelCorrectionEnabled}
              onCheckedChange={(checked) => {
                trackInteraction('fuel_correction_toggled', {
                  enabled: checked,
                  chart: 'lap_time',
                  year,
                  event,
                  session,
                });
                setFuelCorrectionEnabled(checked);
              }}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-neutral-500 hover:text-white"
                >
                  <InformationCircleIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-neutral-900 border-neutral-800 text-neutral-300">
                <div className="space-y-2">
                  <div className="font-semibold text-white uppercase text-xs tracking-wider">Fuel Correction</div>
                  <div className="text-[11px] space-y-1">
                    <p>Applies correction for fuel weight (0.03s per kg)</p>
                    <p className="text-neutral-500">
                      Total fuel: {TOTAL_FUEL_KG}kg, burns ~{FUEL_PER_LAP_KG}kg/lap
                    </p>
                    <p className="text-neutral-500">Applied to first 60% of laps only</p>
                    <p className="text-neutral-500 mt-2 italic">
                      Formula: corrected = raw - (fuelLoad × 0.03)
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
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

export { RacingChart };
export default RacingChart;
