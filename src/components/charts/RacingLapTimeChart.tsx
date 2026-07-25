import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CartesianGrid,
  Line,
  LineChart,
  ComposedChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from '@/lib/recharts-lazy';
import type { CustomTooltipProps } from '@/types';
import type { EnrichedLapRecord, LapTimeDataPoint, WeatherSummary } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import { getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';
import { COMPOUND_COLORS, formatLapTime } from './racingChartUtils';

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
  weatherOverlayEnabled?: boolean;
  wetLapZones?: { start: number; end: number }[];
  weatherData?: WeatherSummary | null;
}

interface WeatherTimelinePoint {
  lap: number;
  condition: 'dry' | 'wet' | 'intermediate';
  compound: string | null;
  rainfall: boolean;
}

function getConditionFromStatus(status: string | null | undefined): 'dry' | 'wet' | 'intermediate' {
  if (!status) return 'dry';
  const s = status.toLowerCase();
  if (s.includes('wet')) return 'wet';
  if (s.includes('inter')) return 'intermediate';
  return 'dry';
}

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
  weatherOverlayEnabled,
  wetLapZones,
  weatherData,
}) => {
  const teamGroups = groupDriversByTeam(driversToDisplay, year);

  const weatherTimeline = useMemo(() => {
    if (!weatherOverlayEnabled || !driverLapDetails) return [];
    const firstDriver = Object.keys(driverLapDetails)[0];
    if (!firstDriver) return [];
    const laps = driverLapDetails[firstDriver];
    return laps
      .filter((l) => l.lapNumber != null)
      .map((l) => ({
        lap: l.lapNumber!,
        condition: getConditionFromStatus(l.trackStatus),
        compound: l.compound,
        rainfall: weatherData?.rainfall ?? false,
      }));
  }, [weatherOverlayEnabled, driverLapDetails, weatherData]);

  const chartDataWithWeather = useMemo(() => {
    if (!weatherOverlayEnabled || weatherTimeline.length === 0) return chartData;
    return chartData.map((point) => {
      const wt = weatherTimeline.find((w) => w.lap === point.LapNumber);
      return {
        ...point,
        __wet: wt?.condition === 'wet' ? 0.6 : wt?.condition === 'intermediate' ? 0.3 : 0,
      };
    });
  }, [weatherOverlayEnabled, weatherTimeline, chartData]);

  const renderTooltip = ({ active, payload, label }: CustomTooltipProps<LapTimeDataPoint>) => {
    if (!active || !payload?.length) return null;

    const lapNumber = Number(label);
    const sortedPayload = payload
      .filter((p) => p.name !== '__wet')
      .toSorted((a, b) => (Number(a.value) || Infinity) - (Number(b.value) || Infinity));

    return (
      <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-3 shadow-2xl max-w-[550px]">
        <div className="mb-2 border-b border-white/[0.04] pb-2 font-mono text-[13px] font-medium tabular-nums text-white">
          Lap {lapNumber}
        </div>
        <div className="space-y-1.5">
          {sortedPayload.map((entry) => {
            const driverCode = String(entry.name);
            const time = entry.value;
            if (time === null || time === undefined) return null;

            const headshot = getDriverImage(driverCode, year);
            const fullName = driverNameMap.get(driverCode) || driverCode;
            const lapDetail = driverLapDetails?.[driverCode]?.find(
              (lap) => lap.lapNumber === lapNumber
            );

            return (
              <div key={driverCode} className="flex items-center gap-2">
                <Avatar className="size-5 shrink-0 border border-white/[0.06]">
                  <AvatarImage src={headshot} className="object-cover object-top" />
                  <AvatarFallback className="bg-white/[0.03] text-[7px] font-medium text-white/40">
                    {driverCode[0]}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="font-mono text-[13px] font-semibold tabular-nums"
                  style={{ color: entry.color }}
                >
                  {formatLapTime(Number(time))}
                </span>
                <span className="text-[13px] text-white truncate">{fullName}</span>
                {lapDetail?.compound && (
                  <span
                    className="text-[11px] font-semibold px-1 py-px rounded"
                    style={{
                      backgroundColor: `${COMPOUND_COLORS[lapDetail.compound] || '#666'}15`,
                      color: COMPOUND_COLORS[lapDetail.compound] || '#666',
                    }}
                  >
                    {lapDetail.compound[0]}
                  </span>
                )}
                {lapDetail?.tyreLife != null && (
                  <span className="text-[11px] text-white/60">L{lapDetail.tyreLife}</span>
                )}
                {lapDetail?.isPersonalBest && (
                  <span className="text-[11px] text-purple-400 font-medium">PB</span>
                )}
                {lapDetail?.deleted && (
                  <span className="text-[11px] text-red-400 font-medium">DEL</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ChartType = weatherOverlayEnabled ? ComposedChart : LineChart;

  const lineElements = driversToDisplay.map((driverCode, index) => {
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
        strokeWidth={isFocused ? 3 : lineStyle.strokeWidth}
        strokeOpacity={isDimmed ? 0.08 : 1}
        strokeDasharray={lineStyle.strokeDasharray}
        dot={false}
        activeDot={{
          r: 4,
          strokeWidth: 0,
          fill: color,
          onMouseEnter: () => setFocusedDriver(driverCode),
          onMouseLeave: () => setFocusedDriver(null),
        }}
        name={driverCode}
        connectNulls
      />
    );
  });

  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
      <ResponsiveContainer width="100%" height={420} className="export-chart-container">
        <ChartType data={weatherOverlayEnabled ? chartDataWithWeather : chartData} margin={{ top: 12, right: 10, left: -12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="none" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis
            dataKey="LapNumber"
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            padding={{ left: 8, right: 8 }}
            label={{
              value: 'Lap',
              position: 'insideBottomRight',
              offset: -4,
              fill: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tickFormatter={formatLapTime}
            allowDecimals
            width={58}
          />
          {weatherOverlayEnabled && (
            <YAxis
              yAxisId="weather"
              orientation="right"
              stroke="rgba(59,130,246,0.3)"
              tick={{ fill: 'rgba(59,130,246,0.5)', fontSize: 9, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              tickFormatter={(v: number) => v > 0.4 ? 'Wet' : v > 0.1 ? 'Int' : 'Dry'}
              width={32}
            />
          )}
          <Tooltip
            content={renderTooltip}
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
          />

          {/* Wet lap zones as ReferenceArea (background blue) */}
          {weatherOverlayEnabled && wetLapZones && wetLapZones.map((zone, i) => (
            <ReferenceArea
              key={`wet-bg-${i}`}
              x1={zone.start}
              x2={zone.end}
              y1="dataMin"
              y2="dataMax"
              fill="rgba(59,130,246,0.08)"
            />
          ))}

          {/* Weather condition area on right Y-axis */}
          {weatherOverlayEnabled && (
            <Area
              yAxisId="weather"
              type="monotone"
              dataKey="__wet"
              stroke="none"
              fill="rgba(59,130,246,0.15)"
              name="Track Condition"
              legendType="none"
              isAnimationActive={false}
            />
          )}

          {lineElements}
        </ChartType>
      </ResponsiveContainer>

      {/* Inline legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 border-t border-white/[0.04] pt-3">
        {driversToDisplay.map((driverCode) => {
          const color = driverColor(driverCode, year);
          const isDimmed = focusedDriver && focusedDriver !== driverCode;
          const isFocused = focusedDriver === driverCode;

          return (
            <button
              key={driverCode}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-all"
              style={{ opacity: isDimmed ? 0.2 : 1 }}
              onMouseEnter={() => setFocusedDriver(driverCode)}
              onMouseLeave={() => setFocusedDriver(null)}
              onClick={() => {
                trackInteraction('legend_driver_focused', {
                  chart: 'lap_time',
                  year,
                  event,
                  session,
                });
                setFocusedDriver(focusedDriver === driverCode ? null : driverCode);
              }}
            >
              <span
                className="inline-block h-[2px] w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                className="text-[11px] font-medium tabular-nums transition-colors"
                style={{ color: isFocused ? color : 'rgba(255,255,255,0.8)' }}
              >
                {driverNameMap.get(driverCode) || driverCode}
              </span>
            </button>
          );
        })}
      </div>

      {/* Weather status bar */}
      {weatherOverlayEnabled && weatherData && weatherTimeline.length > 0 && (
        <div className="mt-2 border-t border-white/[0.04] pt-2">
          <div className="flex flex-wrap items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-white/50">
                Air {weatherData.airTemp.toFixed(1)}° · Track {weatherData.trackTemp.toFixed(1)}° · Hum {weatherData.humidity.toFixed(0)}%
              </span>
              <span className="text-white/50">Wind {weatherData.windSpeed.toFixed(1)} m/s</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="inline-block w-3 h-2 rounded-[1px] bg-blue-500/40" />
                Wet
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="inline-block w-3 h-2 rounded-[1px] bg-sky-400/30" />
                Int
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <span className="inline-block w-3 h-2 rounded-[1px] bg-white/[0.06]" />
                Dry
              </span>
            </div>
          </div>

          {/* Compound + condition timeline strip */}
          <div className="overflow-x-auto">
            <div className="inline-flex gap-px">
              {weatherTimeline.map((wt) => {
                const bgColor = wt.condition === 'wet'
                  ? 'rgba(59,130,246,0.45)'
                  : wt.condition === 'intermediate'
                    ? 'rgba(56,189,248,0.3)'
                    : (wt.compound && COMPOUND_COLORS[wt.compound]
                      ? `${COMPOUND_COLORS[wt.compound]}25`
                      : 'rgba(255,255,255,0.04)');

                return (
                  <div
                    key={wt.lap}
                    className="w-2 h-4 rounded-[1px]"
                    style={{ backgroundColor: bgColor }}
                    title={`L${wt.lap}: ${wt.condition}${wt.compound ? ` (${wt.compound})` : ''}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-1 flex justify-between text-[9px] text-white/30">
            <span>L1</span>
            <span>L{weatherTimeline.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
