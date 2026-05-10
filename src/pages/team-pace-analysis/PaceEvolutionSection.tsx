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
    <div className="min-w-[200px] rounded-xl border border-zinc-800 bg-black/95 p-4 shadow-2xl backdrop-blur-md">
      <p className="mb-3 border-b border-zinc-800 pb-2 font-mono text-xs uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      {sortedPayload.map((entry) => (
        <div key={String(entry.name)} className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm font-bold text-zinc-200">{entry.name}</span>
          </div>
          <span className="font-mono text-sm font-bold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const TeamPaceLegend = ({ payload }: CustomLegendProps) => {
  if (!payload) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-zinc-800/50 pt-6">
      {payload.map((entry) => (
        <div
          key={String(entry.value)}
          className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:border-zinc-700"
        >
          <div
            className="size-2 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.2)]"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {entry.value}
          </span>
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
  <div
    ref={chartRef}
    className="h-[550px] w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:p-8"
  >
    <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold uppercase italic text-white">
      Pace <span className="text-red-600">Evolution</span>
      <span className="ml-auto rounded border border-zinc-800 px-2 py-1 font-mono text-sm font-normal normal-case not-italic text-zinc-600">
        Rank per session
      </span>
      <ChartExportMenu onExport={onExport} isExporting={isExporting} hasData={data.length > 0} />
    </h3>
    <div className="h-[430px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={{ stroke: '#333' }}
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
                  y={y + 15}
                  textAnchor="middle"
                  fill="#666"
                  fontSize={12}
                  fontWeight="bold"
                  fontFamily="Inter"
                  style={{ textTransform: 'uppercase' }}
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
            stroke="#666"
            tick={{ fill: '#666', fontSize: 12, fontWeight: 'bold' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<TeamPaceTooltip />} />
          <Legend content={<TeamPaceLegend />} verticalAlign="bottom" />
          {activeTeams.map((team) => (
            <Line
              key={team}
              type="monotone"
              dataKey={team}
              stroke={getTeamColor(team)}
              strokeWidth={3}
              dot={{ r: 4, fill: '#000', strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
