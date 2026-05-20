import type { RefObject } from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';
import { Cell } from '@/lib/recharts-cell';

import PngExportMenu from '@/components/charts/PngExportMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import type { PngExportPreset } from '@/lib/premium-export';
import type { TeamPaceSession } from '@/lib/api';

interface PaceGapSectionProps {
  chartRef: RefObject<HTMLDivElement | null>;
  data: Array<TeamPaceSession & { gapToLeader: number }>;
  selectedSession: string;
  availableSessions: string[];
  onSessionChange: (session: string) => void;
  getTeamColor: (teamName: string) => string;
  onExport: (preset: PngExportPreset) => Promise<void> | void;
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
  <div ref={chartRef} className={`${CARD_CONTAINER} h-[420px]`}>
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div>
        <span className={CARD_LABEL}>Pace Gap</span>
        <p className="mt-0.5 text-[11px] text-white/40">Gap to leader</p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedSession} onValueChange={onSessionChange}>
          <SelectTrigger className="h-7 w-[80px] border-white/[0.08] bg-transparent text-[11px] font-medium text-white/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/[0.08] bg-[#141414] text-white">
            {availableSessions.map((session) => (
              <SelectItem
                key={session}
                value={session}
                className="cursor-pointer text-[12px] focus:bg-white/[0.04] focus:text-white"
              >
                {session}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PngExportMenu onExport={onExport} isExporting={isExporting} hasData={data.length > 0} />
      </div>
    </div>

    <div className="h-[340px] w-full px-2 pb-4">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ left: 20, right: 30 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="teamName"
              type="category"
              width={90}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;

                const tooltipData = payload[0].payload as TeamPaceSession & { gapToLeader: number };
                return (
                  <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0a]/95 p-3 shadow-xl backdrop-blur-md">
                    <p className="mb-1.5 text-[13px] font-medium text-white">
                      {tooltipData.teamName}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-white/50">Median</span>
                        <span className="font text-[12px] tabular-nums text-white">
                          {tooltipData.medianTime.toFixed(3)}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] text-white/50">Gap</span>
                        <span className="font text-[12px] tabular-nums text-red-400">
                          +{tooltipData.gapToLeader.toFixed(3)}s
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="gapToLeader" radius={[0, 3, 3, 0]} barSize={20} animationDuration={800}>
              {data.map((entry) => (
                <Cell key={entry.teamName} fill={getTeamColor(entry.teamName)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-[12px] text-white/40">No data available for {selectedSession}</span>
        </div>
      )}
    </div>
  </div>
);
