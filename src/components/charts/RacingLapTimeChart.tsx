import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Brush,
  CartesianGrid,
  Legend,
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

const inter = { fontFamily: "'Inter', sans-serif" } as const;

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
    if (!active || !payload?.length) {
      return null;
    }

    const lapNumber = Number(label);
    const sortedPayload = payload.toSorted(
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
