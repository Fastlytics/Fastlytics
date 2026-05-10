import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircleIcon, ChartLineData01Icon, Flag01Icon, Time01Icon } from 'hugeicons-react';
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';
import type { CustomTooltipProps } from '@/types';
import type { EnrichedLapRecord, LapTimeDataPoint, WeatherSummary } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import { getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFC107',
  HARD: '#EEEEEE',
  INTERMEDIATE: '#4CAF50',
  WET: '#2196F3',
};

export interface FastestLapStat {
  driver: string;
  fastestTime: number | null;
  lapNumber: number;
}

interface RacingLapTimeChartProps {
  chartData: LapTimeDataPoint[];
  driversToDisplay: string[];
  driverNameMap: Map<string, string>;
  driverLapDetails?: Record<string, EnrichedLapRecord[]>;
  focusedDriver: string | null;
  setFocusedDriver: (driver: string | null) => void;
  trackInteraction: (name: string, meta: Record<string, unknown>) => void;
  year: number;
  event: string;
  session: string;
}

interface WeatherBannerProps {
  weatherData: WeatherSummary | null;
}

interface FastestLapsTableProps {
  fastestLaps: FastestLapStat[];
  driverLapDetails?: Record<string, EnrichedLapRecord[]>;
  year: number;
}

interface DriverLapPanelsProps {
  driversToDisplay: string[];
  driverLapDetails?: Record<string, EnrichedLapRecord[]>;
  year: number;
}

const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || Number.isNaN(totalSeconds)) {
    return 'N/A';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds}`;
};

export const RacingLapTimeChart: React.FC<RacingLapTimeChartProps> = ({
  chartData,
  driversToDisplay,
  driverNameMap,
  driverLapDetails,
  focusedDriver,
  setFocusedDriver,
  trackInteraction,
  year,
  event,
  session,
}) => {
  const teamGroups = groupDriversByTeam(driversToDisplay, year);

  const renderTooltip = ({ active, payload, label }: CustomTooltipProps<LapTimeDataPoint>) => {
    if (!active || !payload?.length) {
      return null;
    }

    const lapNumber = Number(label);
    const sortedPayload = [...payload].sort(
      (a, b) => (Number(a.value) || Infinity) - (Number(b.value) || Infinity)
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

            if (time === null || time === undefined) {
              return null;
            }

            const headshot = getDriverImage(driverCode, year);
            const fullName = driverNameMap.get(driverCode) || driverCode;
            const lapDetail = driverLapDetails?.[driverCode]?.find(
              (lap) => lap.lapNumber === lapNumber
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
                  <span className="text-[12px] font-bold" style={{ color: entry.color }}>
                    {formatLapTime(Number(time))}
                  </span>
                  <span className="text-[12px] font-semibold text-white/80">{fullName}</span>
                  {lapDetail?.compound && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${COMPOUND_COLORS[lapDetail.compound] || '#666'}22`,
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
  };

  return (
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
          allowDecimals
          width={65}
        />
        <Tooltip
          content={renderTooltip}
          cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Legend
          wrapperStyle={{
            paddingTop: '20px',
            paddingBottom: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
          }}
          onClick={(entry: { value?: string } | undefined) => {
            if (!entry?.value) {
              return;
            }

            trackInteraction('legend_driver_focused', {
              chart: 'lap_time',
              year,
              event,
              session,
            });
            setFocusedDriver(focusedDriver === entry.value ? null : entry.value);
          }}
          onMouseEnter={(entry: { value?: string } | undefined) =>
            entry?.value && setFocusedDriver(entry.value)
          }
          onMouseLeave={() => setFocusedDriver(null)}
          formatter={(value: string, entry: { color?: string }) => {
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
          const teammates =
            Object.values(teamGroups).find((drivers) => drivers.includes(driverCode)) || [];
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
              connectNulls
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

export const RacingWeatherBanner: React.FC<WeatherBannerProps> = ({ weatherData }) => {
  if (!weatherData) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[12px]"
      style={inter}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
        Conditions
      </span>
      <span>
        Air <span className="text-white font-semibold">{weatherData.airTemp.toFixed(1)}°C</span>
      </span>
      <span>
        Track <span className="text-white font-semibold">{weatherData.trackTemp.toFixed(1)}°C</span>
      </span>
      <span>
        Hum <span className="text-white font-semibold">{weatherData.humidity.toFixed(0)}%</span>
      </span>
      <span>
        Wind{' '}
        <span className="text-white font-semibold">{weatherData.windSpeed.toFixed(1)} m/s</span>
      </span>
      {weatherData.rainfall && <span className="text-blue-400 font-semibold">Rain</span>}
    </div>
  );
};

export const RacingFastestLapsTable: React.FC<FastestLapsTableProps> = ({
  fastestLaps,
  driverLapDetails,
  year,
}) => (
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
              stat.fastestTime != null && fastestLaps[0]?.fastestTime != null
                ? stat.fastestTime - fastestLaps[0].fastestTime
                : null;
            const color = driverColor(stat.driver, year);
            const lapDetail = driverLapDetails?.[stat.driver]?.find(
              (lap) => lap.lapNumber === stat.lapNumber
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
                    <span className="text-white">{gap != null ? `+${gap.toFixed(3)}s` : '-'}</span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-center">
                  {lapDetail?.compound ? (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${COMPOUND_COLORS[lapDetail.compound] || '#666'}22`,
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
                  {lapDetail?.speedST != null ? lapDetail.speedST.toFixed(0) : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  </div>
);

export const RacingDriverLapPanels: React.FC<DriverLapPanelsProps> = ({
  driversToDisplay,
  driverLapDetails,
  year,
}) => {
  if (!driverLapDetails) {
    return null;
  }

  const deletedLaps = driversToDisplay.flatMap((driverCode) =>
    (driverLapDetails[driverCode] || []).flatMap((lap) =>
      lap.deleted ? [{ driver: driverCode, ...lap }] : []
    )
  );

  const speedData = driversToDisplay.flatMap((driverCode) => {
    const records = (driverLapDetails[driverCode] || []).filter((lap) => lap.speedST != null);

    if (records.length === 0) {
      return [];
    }

    const speeds = records.map((lap) => lap.speedST as number);

    return [
      {
        driver: driverCode,
        maxSpeed: Math.max(...speeds),
        avgSpeed: +(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length).toFixed(1),
        color: driverColor(driverCode, year),
      },
    ];
  });

  speedData.sort((a, b) => b.maxSpeed - a.maxSpeed);
  const chartHeight = Math.max(100, speedData.length * 50);

  return (
    <>
      {(deletedLaps.length > 0 || speedData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deletedLaps.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flag01Icon className="size-4 text-red-400" />
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
                  Deleted Laps ({deletedLaps.length})
                </h4>
              </div>
              <div className="space-y-1.5">
                {deletedLaps.slice(0, 10).map((lap) => (
                  <div
                    key={`deleted-${lap.driver}-${lap.lapNumber || ''}`}
                    className="flex items-center gap-3 text-[12px]"
                  >
                    <span
                      style={{ color: driverColor(lap.driver, year) }}
                      className="font-bold w-10"
                    >
                      {lap.driver}
                    </span>
                    <span className="text-white/70">Lap {lap.lapNumber}</span>
                    {lap.lapTime != null && (
                      <span className="text-white">{formatLapTime(lap.lapTime)}</span>
                    )}
                    {lap.deletedReason && (
                      <span className="text-red-400 text-[10px] bg-red-500/10 px-2 py-0.5 rounded-full font-semibold">
                        {lap.deletedReason}
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
          )}

          {speedData.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5" style={inter}>
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
                      if (!active || !payload?.length) {
                        return null;
                      }

                      return (
                        <div
                          className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl min-w-[150px]"
                          style={inter}
                        >
                          <p className="text-white font-bold border-b border-white/[0.06] pb-1 mb-2 text-[13px]">
                            {label}
                          </p>
                          {payload.map((entry) => (
                            <div
                              key={entry.name}
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
                    }}
                  />
                  <Bar dataKey="maxSpeed" name="Max Speed" barSize={18} radius={[0, 4, 4, 0]}>
                    {speedData.map((entry) => (
                      <Cell key={entry.driver} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                  <Bar dataKey="avgSpeed" name="Avg Speed" barSize={18} radius={[0, 4, 4, 0]}>
                    {speedData.map((entry) => (
                      <Cell key={`${entry.driver}-avg`} fill={entry.color} fillOpacity={0.3} />
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
          )}
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
            Tyre Strategy & Stint Pace
          </h4>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {driversToDisplay.map((driverCode) => {
            const records = driverLapDetails[driverCode] || [];

            if (records.length === 0) {
              return null;
            }

            const stintMap = new Map<number, EnrichedLapRecord[]>();
            records.forEach((lap) => {
              if (lap.stint != null) {
                if (!stintMap.has(lap.stint)) {
                  stintMap.set(lap.stint, []);
                }
                stintMap.get(lap.stint)?.push(lap);
              }
            });

            const color = driverColor(driverCode, year);
            const headshot = getDriverImage(driverCode, year);
            const stintEntries = Array.from(stintMap.entries());

            return (
              <div key={driverCode} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    className="size-8 border border-white/[0.08]"
                    style={{ borderColor: color }}
                  >
                    <AvatarImage src={headshot} className="object-cover object-top" />
                    <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                      {driverCode[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[13px] font-bold" style={{ color }}>
                    {driverCode}
                  </span>
                  <span className="text-[11px] text-white font-medium">
                    {stintEntries.length} stint{stintEntries.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {stintEntries.map(([stintNumber, laps]) => {
                    const compound = laps[0]?.compound || '?';
                    const validTimes = laps.flatMap((lap) =>
                      lap.lapTime != null && !lap.deleted ? [lap.lapTime] : []
                    );
                    const avgTime =
                      validTimes.length > 0
                        ? validTimes.reduce((sum, lapTime) => sum + lapTime, 0) / validTimes.length
                        : null;
                    const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
                    const tyreLifeEnd = laps[laps.length - 1]?.tyreLife;
                    const freshTyre = laps[0]?.freshTyre;

                    return (
                      <div
                        key={stintNumber}
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
                            <span className="text-white">({laps.length} laps)</span>
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
                            <span className="text-[11px] text-white font-bold">
                              Avg: {avgTime != null ? formatLapTime(avgTime) : 'N/A'}
                            </span>
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
    </>
  );
};
