import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';
import type { CustomTooltipProps } from '@/types';
import type { EnrichedLapRecord, LapTimeDataPoint } from '@/lib/api';
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
}) => {
  const teamGroups = groupDriversByTeam(driversToDisplay, year);

  const renderTooltip = ({ active, payload, label }: CustomTooltipProps<LapTimeDataPoint>) => {
    if (!active || !payload?.length) return null;

    const lapNumber = Number(label);
    const sortedPayload = payload.toSorted(
      (a, b) => (Number(a.value) || Infinity) - (Number(b.value) || Infinity)
    );

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

  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
      <ResponsiveContainer width="100%" height={420} className="export-chart-container">
        <LineChart data={chartData} margin={{ top: 12, right: 10, left: -12, bottom: 8 }}>
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
          <Tooltip
            content={renderTooltip}
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
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
          })}
        </LineChart>
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
    </div>
  );
};
