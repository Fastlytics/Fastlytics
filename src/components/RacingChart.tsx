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
import type { CustomTooltipProps, CustomLegendProps } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { fetchLapTimes, fetchSessionDrivers, SessionDriver, LapTimeDataPoint } from '@/lib/api';
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
    if (selectedDrivers.length >= MIN_DRIVERS) return selectedDrivers;
    if (!availableDrivers) return selectedDrivers;

    const needed = MIN_DRIVERS - selectedDrivers.length;
    const candidates = availableDrivers
      .filter((d) => !selectedDrivers.includes(d.code))
      .slice(0, needed)
      .map((d) => d.code);
    return [...selectedDrivers, ...candidates];
  }, [selectedDrivers, availableDrivers, staticData]);

  const driversToDisplay = useMemo(
    () => (staticData ? initialDrivers || [] : effectiveDrivers),
    [staticData, initialDrivers, effectiveDrivers]
  );

  const {
    data: fetchedLapData,
    isLoading: isLoadingLapTimes,
    error,
    isError,
  } = useQuery<LapTimeDataPoint[]>({
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

  const lapData = staticData || fetchedLapData;

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
        <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 gap-4">
          <p className="text-gray-400 font-mono text-sm uppercase">Select drivers to compare</p>
          <Button
            onClick={() => setShouldLoadChart(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-none"
            disabled={selectedDrivers.length < MIN_DRIVERS || isLoadingDrivers}
          >
            <Analytics01Icon className="w-4 h-4 mr-2" />
            Load Data
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-900/50 border border-gray-800">
          <LoadingSpinnerF1 />
        </div>
      );
    }
    if (isError || !lapData) {
      return (
        <div className="w-full h-[300px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500">
          <AlertCircleIcon className="w-10 h-10 mb-2" />
          <p className="font-bold uppercase">Error loading lap times</p>
          <p className="text-xs text-gray-500 mt-1">
            {(error as Error)?.message || 'Could not fetch data.'}
          </p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded-none uppercase font-bold"
            >
              Back
            </Button>
          )}
        </div>
      );
    }
    if (lapData.length === 0) {
      return (
        <div className="w-full h-[300px] bg-black border border-gray-800 flex flex-col items-center justify-center text-gray-500 font-mono uppercase">
          <p>No common lap data found.</p>
          {!staticData && (
            <Button
              onClick={() => setShouldLoadChart(false)}
              variant="outline"
              size="sm"
              className="mt-4 border-gray-700 hover:bg-gray-800 rounded-none"
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis
              dataKey="LapNumber"
              stroke="#666"
              tick={{ fill: '#888', fontSize: 12, fontFamily: 'Geist' }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              stroke="#666"
              tick={{ fill: '#888', fontSize: 12, fontFamily: 'Geist' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tickFormatter={formatLapTime}
              allowDecimals={true}
              width={60}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                // Sort by time (value)
                const sortedPayload = [...payload].sort(
                  (a, b) => ((a.value as number) || Infinity) - ((b.value as number) || Infinity)
                );

                return (
                  <div className="bg-black border border-gray-800 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.9)] max-w-[500px] z-50">
                    <div className="text-white font-black uppercase italic tracking-tighter border-b border-gray-800 pb-2 mb-2 font-mono text-sm">
                      Lap {label}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {sortedPayload.map((entry) => {
                        const driverCode = String(entry.name);
                        const time = entry.value;
                        if (time === null) return null;

                        const headshot = getDriverImage(driverCode, year);
                        const color = entry.color;

                        return (
                          <div key={driverCode} className="flex items-center gap-2 min-w-[120px]">
                            <div className="w-6 h-6 rounded-full bg-gray-900 overflow-hidden shrink-0 border border-gray-800">
                              {headshot ? (
                                <img
                                  src={headshot}
                                  alt={driverCode}
                                  className="w-full h-full object-cover object-top"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">
                                  {driverCode[0]}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-black font-mono" style={{ color }}>
                              {formatLapTime(time as number)}
                            </span>
                            <span className="text-xs font-mono text-gray-400 font-bold">
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
                fontFamily: 'Geist',
                fontSize: '12px',
              }}
              onClick={(e) =>
                e &&
                e.value &&
                (focusedDriver === e.value ? setFocusedDriver(null) : setFocusedDriver(e.value))
              }
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
              height={30}
              stroke="#333"
              fill="#111"
              tickFormatter={() => ''}
              travellerWidth={10}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Fastest Laps Table */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Time01Icon className="w-5 h-5 text-red-600" />
            <h4 className="text-sm font-black uppercase italic text-white">
              Fastest Laps (Selection)
            </h4>
          </div>
          <div className="overflow-hidden border border-gray-800 bg-gray-900/30">
            <Table>
              <TableHeader className="bg-gray-900/80">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8">
                    Driver
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8 text-right">
                    Time
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8 text-center">
                    Lap
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wider h-8 text-right">
                    Gap
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

                  return (
                    <TableRow
                      key={stat.driver}
                      className="border-b border-gray-800/50 hover:bg-gray-800/20"
                    >
                      <TableCell className="py-2 font-mono font-bold" style={{ color }}>
                        {stat.driver}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-gray-300">
                        {formatLapTime(stat.fastestTime)}
                      </TableCell>
                      <TableCell className="py-2 text-center font-mono text-gray-500 text-xs">
                        {stat.lapNumber !== -1 ? `L${stat.lapNumber} ` : '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs">
                        {index === 0 ? (
                          <span className="text-purple-400 font-bold">FASTEST</span>
                        ) : (
                          <span className="text-gray-500">
                            {gap !== null ? `+ ${gap.toFixed(3)} s` : '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      ref={chartRef}
      className={cn('space-y-6 relative', className)}
      style={{ animationDelay: `${delay * 100} ms` } as React.CSSProperties}
    >
      <div className="flex flex-col gap-4 mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase italic text-white tracking-tighter">
            Lap Times
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase">Fuel Corrected</span>
            <Switch checked={fuelCorrectionEnabled} onCheckedChange={setFuelCorrectionEnabled} />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-white"
                >
                  <InformationCircleIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-900 border-gray-800 text-gray-300">
                <div className="space-y-2">
                  <div className="font-bold text-white uppercase text-sm">Fuel Correction</div>
                  <div className="text-xs space-y-1">
                    <p>Applies correction for fuel weight (0.03s per kg)</p>
                    <p className="text-gray-500">
                      Total fuel: {TOTAL_FUEL_KG}kg, burns ~{FUEL_PER_LAP_KG}kg/lap
                    </p>
                    <p className="text-gray-500">Applied to first 60% of laps only</p>
                    <p className="text-gray-500 mt-2 italic">
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
                    'flex items-center gap-2 px-2 py-1 border transition-all duration-200 group',
                    isSelected
                      ? 'bg-gray-900 border-gray-700 hover:border-gray-500'
                      : 'bg-black border-transparent opacity-50 hover:opacity-100 hover:bg-gray-900'
                  )}
                  style={isSelected ? { borderLeftColor: color, borderLeftWidth: '3px' } : {}}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                    {headshot ? (
                      <img
                        src={headshot}
                        alt={driver.code}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">
                        {driver.code[0]}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-mono font-bold',
                      isSelected ? 'text-white' : 'text-gray-500'
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
