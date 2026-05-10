import type { RefObject } from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';

import ChartExportMenu from '@/components/charts/ChartExportMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeamPaceSession } from '@/lib/api';

interface PaceGapSectionProps {
  chartRef: RefObject<HTMLDivElement | null>;
  data: Array<TeamPaceSession & { gapToLeader: number }>;
  selectedSession: string;
  availableSessions: string[];
  onSessionChange: (session: string) => void;
  getTeamColor: (teamName: string) => string;
  onExport: (format: 'png' | 'svg' | 'csv') => Promise<void> | void;
  isExporting: boolean;
}

export const PaceGapSection = ({
  chartRef,
  data,
  selectedSession,
  availableSessions,
  onSessionChange,
  getTeamColor,
  onExport,
  isExporting,
}: PaceGapSectionProps) => (
  <div
    ref={chartRef}
    className="h-[450px] w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:p-8"
  >
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <h3 className="flex items-center gap-2 text-xl font-semibold uppercase italic text-white">
        Pace <span className="text-red-600">Gap</span>
        <ChartExportMenu onExport={onExport} isExporting={isExporting} hasData={data.length > 0} />
      </h3>

      <Select value={selectedSession} onValueChange={onSessionChange}>
        <SelectTrigger className="h-8 w-[100px] border-zinc-700 bg-zinc-900 text-xs font-bold uppercase tracking-wider text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900 text-white">
          {availableSessions.map((session) => (
            <SelectItem
              key={session}
              value={session}
              className="cursor-pointer text-xs font-bold uppercase tracking-wider focus:bg-zinc-800 focus:text-white"
            >
              {session}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="h-[350px] w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ left: 20, right: 30 }}>
            <CartesianGrid stroke="#333" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="teamName"
              type="category"
              width={100}
              tick={{ fill: '#999', fontSize: 12, fontWeight: 'bold' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;

                const tooltipData = payload[0].payload as TeamPaceSession & { gapToLeader: number };
                return (
                  <div className="rounded-xl border border-zinc-800 bg-black/95 p-4 shadow-2xl backdrop-blur-md">
                    <p className="mb-1 font-bold text-white">{tooltipData.teamName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-zinc-400">
                        Median:
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {tooltipData.medianTime.toFixed(3)}s
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-zinc-400">Gap:</span>
                      <span className="font-mono text-sm font-bold text-red-500">
                        +{tooltipData.gapToLeader.toFixed(3)}s
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="gapToLeader" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000}>
              {data.map((entry) => (
                <Cell key={entry.teamName} fill={getTeamColor(entry.teamName)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center font-mono text-sm uppercase tracking-widest text-zinc-600">
          No data available for {selectedSession}
        </div>
      )}
    </div>
  </div>
);
