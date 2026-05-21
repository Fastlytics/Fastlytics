import type { RefObject } from 'react';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';

import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { ChartSaveMenu } from '@/components/saved/ChartSaveMenu';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import type { CustomLegendProps, CustomTooltipProps } from '@/types';

interface PaceEvolutionSectionProps {
  chartRef: RefObject<HTMLDivElement | null>;
  data: Array<Record<string, string | number>>;
  activeTeams: string[];
  selectedYear: number;
  selectedEventName: string;
  getTeamColor: (teamName: string) => string;
  onExport: (format: 'png' | 'svg' | 'csv') => Promise<void> | void;
  isExporting: boolean;
}

const TeamPaceTooltip = ({ active, payload, label }: CustomTooltipProps<number>) => {
  if (!active || !payload?.length) return null;

  const sortedPayload = payload.toSorted((a, b) => (a.value || 0) - (b.value || 0));
  return (
    <div className="min-w-[180px] rounded-lg border border-white/[0.08] bg-[#0a0a0a]/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-2 border-b border-white/[0.06] pb-2 text-[11px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </p>
      <div className="space-y-1.5">
        {sortedPayload.map((entry) => (
          <div key={String(entry.name)} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[12px] font-medium text-white/80">{entry.name}</span>
            </div>
            <span className="font text-[12px] tabular-nums text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeamPaceLegend = ({ payload }: CustomLegendProps) => {
  if (!payload) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-white/[0.04] pt-4">
      {payload.map((entry) => (
        <div
          key={String(entry.value)}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.06] px-2.5 py-1"
        >
          <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[10px] font-medium text-white/60">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const PaceEvolutionSection = ({
  chartRef,
  data,
  activeTeams,
  selectedYear,
  selectedEventName,
  getTeamColor,
  onExport,
  isExporting,
}: PaceEvolutionSectionProps) => (
  <div ref={chartRef} className={`${CARD_CONTAINER} h-[480px]`}>
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div>
        <span className={CARD_LABEL}>Pace Evolution</span>
        <p className="mt-0.5 text-[11px] text-white/40">Rank per session</p>
      </div>
      <ChartExportMenu onExport={onExport} isExporting={isExporting} hasData={data.length > 0} />
      <ChartSaveMenu
        chartType="pace_evolution"
        title={`Pace Evolution — ${selectedEventName} ${selectedYear}`}
        raceName={`${selectedYear} ${selectedEventName}`}
        chartConfig={{ year: selectedYear, event: selectedEventName, teams: activeTeams }}
      />
    </div>
    <div className="h-[400px] w-full px-2 pb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            tick={(props) => {
              const { x, y, payload } = props as {
                x: number;
                y: number;
                payload: { value: string };
              };

              return (
                <text
                  x={x}
                  y={y + 14}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.4)"
                  fontSize={11}
                  fontFamily="Inter"
                >
                  {payload.value}
                </text>
              );
            }}
            height={40}
          />
          <YAxis
            reversed
            domain={[1, 'auto']}
            stroke="transparent"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<TeamPaceTooltip />} />
          <Legend content={<TeamPaceLegend />} verticalAlign="bottom" />
          {activeTeams.map((team) => (
            <Line
              key={team}
              type="monotone"
              dataKey={team}
              stroke={getTeamColor(team)}
              strokeWidth={2}
              dot={{ r: 3, fill: '#0a0a0a', strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              animationDuration={1200}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
