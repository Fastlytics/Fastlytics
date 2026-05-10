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
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { CustomTooltipProps, CustomLegendProps } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { EnrichedLapRecord, LapTimeDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import {
  AlertCircleIcon,
  Time01Icon,
  InformationCircleIcon,
  Flag01Icon,
  ChartLineData01Icon,
  ArrowUpDownIcon,
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
import { useAnalytics } from '@/hooks/useAnalytics';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLapChartData, MIN_DRIVERS } from '@/hooks/useLapChartData';

const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds}`;
};

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFC107',
  HARD: '#EEEEEE',
  INTERMEDIATE: '#4CAF50',
  WET: '#2196F3',
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
  const [fuelCorrectionEnabled, setFuelCorrectionEnabled] = useState(false);
  const [isDriverPopoverOpen, setIsDriverPopoverOpen] = useState(false);

  const {
    chartRef,
    chartVisRef,
    exportRef,
    exportChart,
    isExporting,
    shouldLoadChart,
    setShouldLoadChart,
    focusedDriver,
    setFocusedDriver,
    selectedDrivers,
    availableDrivers,
    isLoadingDrivers,
    driverNameMap,
    effectiveDrivers,
    driversToDisplay,
    lapData: rawLapData,
    isLoadingLapTimes,
    error,
    isError,
    isLoading,
    toggleDriver,
    trackInteraction,
    enrichedResponse,
    setSelectedDrivers,
  } = useLapChartData({
    year,
    event,
    session,
    initialDrivers,
    staticData,
    autoLoad,
    favoriteDriver,
    rivalDriver,
    chartName: 'lap_time_chart',
  });

  const weatherData = enrichedResponse?.weather;
  const driverLapDetails = enrichedResponse?.driverLapDetails;

  const TOTAL_FUEL_KG = 110;
  const FUEL_PER_LAP_KG = 1.8;
  const SECONDS_PER_KG_PER_LAP = 0.03;

  const correctedLapData = useMemo(() => {
    if (!rawLapData || !fuelCorrectionEnabled) return rawLapData;
    const maxLapForCorrection = Math.ceil(rawLapData.length * 0.6);
    return rawLapData.map((point) => {
      const lapNumber = point.LapNumber;
      if (lapNumber > maxLapForCorrection) return point;
      const fuelLoad = TOTAL_FUEL_KG - lapNumber * FUEL_PER_LAP_KG;
      const correctionAmount = fuelLoad * SECONDS_PER_KG_PER_LAP;
      const correctedPoint = { ...point };
      Object.keys(point).forEach((key) => {
        if (key !== 'LapNumber' && typeof point[key] === 'number') {
          correctedPoint[key as keyof LapTimeDataPoint] =
            (point[key as keyof LapTimeDataPoint] as number) - correctionAmount;
        }
      });
      return correctedPoint;
    });
  }, [rawLapData, fuelCorrectionEnabled]);

  const chartData = correctedLapData;

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
      return { driver, fastestTime: minTime === Infinity ? null : minTime, lapNumber: lapNum };
    });
    return stats.sort((a, b) => {
      if (a.fastestTime === null) return 1;
      if (b.fastestTime === null) return -1;
      return a.fastestTime - b.fastestTime;
    });
  }, [chartData, driversToDisplay]);

  const renderContent = () => {
    if (!shouldLoadChart && !staticData) {
      return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] gap-4">
          <p className="text-white text-[13px] font-medium uppercase tracking-wider">
            Select drivers to compare
          </p>
          <Button
            onClick={() => {
              trackInteraction('chart_data_loaded', { chart: 'lap_time', year, event, session });
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
    if (isError || !chartData) {
      return (
        <div className="w-full h-[300px] rounded-xl border border-red-500/20 bg-red-500/[0.04] flex flex-col items-center justify-center text-red-400">
          <AlertCircleIcon className="size-10 mb-2" />
          <p className="font-semibold uppercase text-[13px]">Error loading lap times</p>
          <p className="text-xs text-white mt-1">
            {typeof (error as Error)?.message === 'string'
              ? (error as Error).message
              : 'Could not fetch data.'}
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
    if (chartData.length === 0) {
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
      <>
        <ResponsiveContainer width="100%" height={500} className="export-chart-container mb-8">
          <LineChart data={chartData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
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
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tickFormatter={formatLapTime}
              allowDecimals={true}
              width={65}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const lapNumber = label as number;
                const sortedPayload = payload.toSorted(
                  (a, b) => ((a.value as number) || Infinity) - ((b.value as number) || Infinity)
                );

                return (
                  <div
                    className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl max-w-[600px] z-50"
                    style={inter}
                  >
                    <div className="text-white font-bold uppercase tracking-wider border-b border-white/[0.06] pb-2 mb-2 text-[12px]">
                      Lap {lapNumber}
                    </div>
                    <div className="space-y-2">
                      {sortedPayload.map((entry) => {
                        const driverCode = String(entry.name);
                        const time = entry.value;
                        if (time === null) return null;
                        const headshot = getDriverImage(driverCode, year);
                        const color = entry.color;
                        const fullName = driverNameMap.get(driverCode) || driverCode;
                        const lapDetail = driverLapDetails?.[driverCode]?.find(
                          (l: EnrichedLapRecord) => l.lapNumber === lapNumber
                        );

                        return (
                          <div
                            key={driverCode}
                            className="border-b border-white/[0.04] pb-2 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6 shrink-0 border border-white/[0.08]">
                                <AvatarImage src={headshot} className="object-cover object-top" />
                                <AvatarFallback className="bg-[#1a1a1e] text-[8px] font-bold text-white">
                                  {driverCode[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[12px] font-bold" style={{ color }}>
                                {formatLapTime(time as number)}
                              </span>
                              <span className="text-[12px] font-semibold text-white/80">
                                {fullName}
                              </span>
                              {lapDetail?.compound && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor:
                                      (COMPOUND_COLORS[lapDetail.compound] || '#666') + '22',
                                    color: COMPOUND_COLORS[lapDetail.compound] || '#666',
                                  }}
                                >
                                  {lapDetail.compound[0]}
                                </span>
                              )}
                              {lapDetail?.tyreLife != null && (
                                <span className="text-[10px] text-white font-medium">
                                  L{lapDetail.tyreLife}
                                </span>
                              )}
                              {lapDetail?.position != null && (
                                <span className="text-[10px] text-white font-medium">
                                  P{lapDetail.position}
                                </span>
                              )}
                              {lapDetail?.deleted && (
                                <span className="text-[10px] text-red-400 font-bold">DEL</span>
                              )}
                              {lapDetail?.isPersonalBest && (
                                <span className="text-[10px] text-purple-400 font-bold">PB</span>
                              )}
                            </div>
                            {lapDetail &&
                              (lapDetail.sector1 != null ||
                                lapDetail.sector2 != null ||
                                lapDetail.sector3 != null) && (
                                <div className="flex gap-3 mt-1 ml-8">
                                  {lapDetail.sector1 != null && (
                                    <span className="text-[10px] text-white">
                                      S1{' '}
                                      <span className="text-white/70 font-medium">
                                        {lapDetail.sector1.toFixed(3)}
                                      </span>
                                    </span>
                                  )}
                                  {lapDetail.sector2 != null && (
                                    <span className="text-[10px] text-white">
                                      S2{' '}
                                      <span className="text-white/70 font-medium">
                                        {lapDetail.sector2.toFixed(3)}
                                      </span>
                                    </span>
                                  )}
                                  {lapDetail.sector3 != null && (
                                    <span className="text-[10px] text-white">
                                      S3{' '}
                                      <span className="text-white/70 font-medium">
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
                    chart: 'lap_time',
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

        {/* Weather Banner */}
        {weatherData && (
          <div
            className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[12px]"
            style={inter}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
              Conditions
            </span>
            <span>
              Air{' '}
              <span className="text-white font-semibold">{weatherData.airTemp.toFixed(1)}°C</span>
            </span>
            <span>
              Track{' '}
              <span className="text-white font-semibold">{weatherData.trackTemp.toFixed(1)}°C</span>
            </span>
            <span>
              Hum{' '}
              <span className="text-white font-semibold">{weatherData.humidity.toFixed(0)}%</span>
            </span>
            <span>
              Wind{' '}
              <span className="text-white font-semibold">
                {weatherData.windSpeed.toFixed(1)} m/s
              </span>
            </span>
            {weatherData.rainfall && <span className="text-blue-400 font-semibold">Rain</span>}
          </div>
        )}

        {/* Fastest Laps Table */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
            <Time01Icon className="size-4 text-red-400" />
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
              Fastest Laps (Selection)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8">
                    Driver
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
                    Time
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-center">
                    Lap
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
                    Gap
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-center">
                    Tyre
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
                    S1
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
                    S2
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
                    S3
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
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
                  const lapDetail = driverLapDetails?.[stat.driver]?.find(
                    (l: EnrichedLapRecord) => l.lapNumber === stat.lapNumber
                  );

                  return (
                    <TableRow
                      key={stat.driver}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] last:border-b-0"
                    >
                      <TableCell className="py-3 font-semibold text-[13px]" style={{ color }}>
                        {stat.driver}
                      </TableCell>
                      <TableCell className="py-3 text-right text-white/70 text-[13px]">
                        {formatLapTime(stat.fastestTime)}
                      </TableCell>
                      <TableCell className="py-3 text-center text-white text-[12px]">
                        {stat.lapNumber !== -1 ? `L${stat.lapNumber}` : '-'}
                      </TableCell>
                      <TableCell className="py-3 text-right text-[12px]">
                        {index === 0 ? (
                          <span className="text-purple-400 font-bold">Fastest</span>
                        ) : (
                          <span className="text-white">
                            {gap !== null ? `+${gap.toFixed(3)}s` : '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        {lapDetail?.compound ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor:
                                (COMPOUND_COLORS[lapDetail.compound] || '#666') + '22',
                              color: COMPOUND_COLORS[lapDetail.compound] || '#666',
                            }}
                          >
                            {lapDetail.compound}
                          </span>
                        ) : (
                          <span className="text-white">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right text-white text-[12px]">
                        {lapDetail?.sector1 != null ? lapDetail.sector1.toFixed(3) : '-'}
                      </TableCell>
                      <TableCell className="py-3 text-right text-white text-[12px]">
                        {lapDetail?.sector2 != null ? lapDetail.sector2.toFixed(3) : '-'}
                      </TableCell>
                      <TableCell className="py-3 text-right text-white text-[12px]">
                        {lapDetail?.sector3 != null ? lapDetail.sector3.toFixed(3) : '-'}
                      </TableCell>
                      <TableCell className="py-3 text-right text-white text-[12px]">
                        {lapDetail?.speedST != null ? `${lapDetail.speedST.toFixed(0)}` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Deleted Laps & Speed Traps */}
        {driverLapDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deleted Laps */}
            {(() => {
              const deletedLaps = driversToDisplay.flatMap((drv) =>
                (driverLapDetails[drv] || [])
                  .filter((l: EnrichedLapRecord) => l.deleted)
                  .map((l: EnrichedLapRecord) => ({ driver: drv, ...l }))
              );
              if (deletedLaps.length === 0) return null;
              return (
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Flag01Icon className="size-4 text-red-400" />
                    <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
                      Deleted Laps ({deletedLaps.length})
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {deletedLaps.slice(0, 10).map((dl, i) => (
                      <div key={i} className="flex items-center gap-3 text-[12px]">
                        <span
                          style={{ color: driverColor(dl.driver, year) }}
                          className="font-bold w-10"
                        >
                          {dl.driver}
                        </span>
                        <span className="text-white/70">Lap {dl.lapNumber}</span>
                        {dl.lapTime != null && (
                          <span className="text-white">{formatLapTime(dl.lapTime)}</span>
                        )}
                        {dl.deletedReason && (
                          <span className="text-red-400 text-[10px] bg-red-500/10 px-2 py-0.5 rounded-full font-semibold">
                            {dl.deletedReason}
                          </span>
                        )}
                      </div>
                    ))}
                    {deletedLaps.length > 10 && (
                      <span className="text-[11px] text-white font-medium">
                        +{deletedLaps.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Speed Trap */}
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
                <div
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5"
                  style={inter}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <ChartLineData01Icon className="size-4 text-white" />
                    <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
                      Speed Trap (km/h)
                    </h4>
                  </div>
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
                          fill: 'rgba(255,255,255,0.5)',
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'Inter, sans-serif',
                        }}
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <YAxis
                        type="category"
                        dataKey="driver"
                        tick={{
                          fill: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'Inter, sans-serif',
                        }}
                        width={48}
                        stroke="transparent"
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div
                                className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl min-w-[150px]"
                                style={inter}
                              >
                                <p className="text-white font-bold border-b border-white/[0.06] pb-1 mb-2 text-[13px]">
                                  {label}
                                </p>
                                {payload.map((entry, index) => (
                                  <div
                                    key={index}
                                    className="flex gap-3 items-center mb-1 last:mb-0"
                                  >
                                    <div
                                      className="size-3 rounded-sm"
                                      style={{
                                        backgroundColor: entry.color,
                                        opacity: entry.name === 'Max Speed' ? 0.9 : 0.3,
                                      }}
                                    />
                                    <p className="text-[12px] text-white flex-1">{entry.name}:</p>
                                    <span className="text-white font-bold text-[12px]">
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
                      <Bar dataKey="maxSpeed" name="Max Speed" barSize={18} radius={[0, 4, 4, 0]}>
                        {speedData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} fillOpacity={0.9} />
                        ))}
                      </Bar>
                      <Bar dataKey="avgSpeed" name="Avg Speed" barSize={18} radius={[0, 4, 4, 0]}>
                        {speedData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} fillOpacity={0.3} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 mt-2 justify-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-2.5 rounded-sm bg-white/90" />
                      <span className="text-[10px] text-white font-semibold uppercase">Max</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-2.5 rounded-sm bg-white/30" />
                      <span className="text-[10px] text-white font-semibold uppercase">Avg</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tyre Strategy & Degradation */}
        {driverLapDetails && (
          <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
                Tyre Strategy & Stint Pace
              </h4>
            </div>
            <div className="divide-y divide-white/[0.04]">
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
                const stintEntries = Array.from(stintMap.entries());

                return (
                  <div key={drv} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        className="size-8 border border-white/[0.08]"
                        style={{ borderColor: color }}
                      >
                        <AvatarImage src={headshot} className="object-cover object-top" />
                        <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                          {drv[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-bold" style={{ color }}>
                        {drv}
                      </span>
                      <span className="text-[11px] text-white font-medium">
                        {stintEntries.length} stint{stintEntries.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1.5">
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
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] relative overflow-hidden"
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1"
                              style={{ backgroundColor: COMPOUND_COLORS[compound] || '#666' }}
                            />
                            <div className="flex items-center gap-4 pl-3">
                              <span
                                className="text-[12px] font-bold w-20"
                                style={{ color: COMPOUND_COLORS[compound] || '#FFF' }}
                              >
                                {compound}
                              </span>
                              <span className="text-[11px] text-white font-medium">
                                Laps {laps[0]?.lapNumber}–{laps[laps.length - 1]?.lapNumber}{' '}
                                <span className="text-white">({lapCount} laps)</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-5 text-right">
                              {freshTyre != null && (
                                <span
                                  className={`text-[10px] uppercase font-semibold ${freshTyre ? 'text-emerald-400' : 'text-amber-400'} hidden sm:inline-block`}
                                >
                                  {freshTyre ? 'New' : 'Used'}
                                </span>
                              )}
                              {tyreLifeEnd != null && (
                                <span className="text-[11px] text-white font-medium hidden md:inline-block">
                                  Life: {tyreLifeEnd}
                                </span>
                              )}
                              <div className="flex flex-col min-w-[100px] text-left">
                                {avgTime != null ? (
                                  <span className="text-[11px] text-white font-bold">
                                    Avg: {formatLapTime(avgTime)}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-white font-bold">Avg: N/A</span>
                                )}
                                {bestTime != null && (
                                  <span className="text-[10px] text-white font-medium">
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
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3">
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
            {!staticData && availableDrivers && (
              <Popover open={isDriverPopoverOpen} onOpenChange={setIsDriverPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06] hover:text-white transition-all text-[11px] font-semibold uppercase tracking-wider w-fit">
                    <span>
                      {selectedDrivers.length === availableDrivers.length
                        ? 'All Drivers'
                        : `${selectedDrivers.length} / ${availableDrivers.length} Selected`}
                    </span>
                    <ArrowUpDownIcon className="size-3.5 opacity-50" />
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
                            chart: 'lap_time',
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
                            chart: 'lap_time',
                            year,
                            event,
                            session,
                          });
                          setSelectedDrivers(
                            availableDrivers.slice(0, MIN_DRIVERS).map((d) => d.code)
                          );
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
                            {/* Check indicator */}
                            <div
                              className={cn(
                                'size-4 rounded shrink-0 flex items-center justify-center border transition-all',
                                isSelected
                                  ? 'bg-red-500 border-red-500'
                                  : 'border-white/[0.15] bg-transparent'
                              )}
                            >
                              {isSelected && (
                                <svg
                                  className="size-2.5 text-white"
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

                            {/* Team color bar */}
                            <div
                              className={cn(
                                'h-8 w-0.5 rounded-full shrink-0 transition-opacity',
                                isSelected ? 'opacity-100' : 'opacity-30'
                              )}
                              style={{ backgroundColor: color }}
                            />

                            {/* Headshot */}
                            <Avatar className="size-8 shrink-0 border border-white/[0.08]">
                              <AvatarImage src={headshot} className="object-cover object-top" />
                              <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                                {driver.code[0]}
                              </AvatarFallback>
                            </Avatar>

                            {/* Name */}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span
                                className={cn(
                                  'text-[12px] font-semibold truncate transition-colors',
                                  isFavorite
                                    ? 'text-red-400'
                                    : isSelected
                                      ? 'text-white'
                                      : 'text-white'
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
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
            Fuel
          </span>
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
                className="size-7 p-0 text-white hover:text-white hover:bg-white/[0.06]"
              >
                <InformationCircleIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
              style={inter}
            >
              <div className="space-y-2">
                <div className="font-bold text-white uppercase text-[12px] tracking-wider">
                  Fuel Correction
                </div>
                <div className="text-[12px] space-y-1 text-white">
                  <p>Applies correction for fuel weight (0.03s per kg)</p>
                  <p className="text-white">
                    Total fuel: {TOTAL_FUEL_KG}kg, burns ~{FUEL_PER_LAP_KG}kg/lap
                  </p>
                  <p className="text-white">Applied to first 60% of laps only</p>
                  <p className="text-white mt-2 italic">
                    Formula: corrected = raw - (fuelLoad × 0.03)
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export { RacingChart };
export default RacingChart;
