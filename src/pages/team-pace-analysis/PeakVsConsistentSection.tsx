import type { RefObject } from 'react';

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';
import { Cell } from '@/lib/recharts-cell';

import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';

interface ScatterDataPoint {
  teamName: string;
  teamColor: string;
  x: number;
  y: number;
}

interface PeakVsConsistentSectionProps {
  chartRef: RefObject<HTMLDivElement | null>;
  data: ScatterDataPoint[];
  onExport: (format: 'png' | 'svg' | 'csv') => Promise<void> | void;
  isExporting: boolean;
}

export const PeakVsConsistentSection = ({
  chartRef,
  data,
  onExport,
  isExporting,
}: PeakVsConsistentSectionProps) => (
  <div ref={chartRef} className={`${CARD_CONTAINER} h-[420px]`}>
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div>
        <span className={CARD_LABEL}>Peak vs Consistent</span>
        <p className="mt-0.5 text-[11px] text-white/40">Fastest lap vs median pace</p>
      </div>
      <ChartExportMenu onExport={onExport} isExporting={isExporting} hasData={data.length > 0} />
    </div>
    <div className="h-[340px] w-full px-2 pb-4">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            dataKey="x"
            name="Median Pace"
            unit="s"
            domain={['auto', 'auto']}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            label={{
              value: 'Consistency (Median)',
              position: 'bottom',
              fill: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              dy: 10,
            }}
            stroke="rgba(255,255,255,0.06)"
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Fastest Lap"
            unit="s"
            domain={['auto', 'auto']}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            label={{
              value: 'Peak (Fastest)',
              angle: -90,
              position: 'insideLeft',
              fill: 'rgba(255,255,255,0.4)',
              fontSize: 10,
            }}
            stroke="rgba(255,255,255,0.06)"
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              const tooltipData = payload[0].payload as ScatterDataPoint;
              return (
                <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0a]/95 p-3 shadow-xl backdrop-blur-md">
                  <p
                    className="mb-1.5 text-[13px] font-medium"
                    style={{ color: tooltipData.teamColor }}
                  >
                    {tooltipData.teamName}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] text-white/50">Median</span>
                      <span className="font text-[12px] tabular-nums text-white">
                        {tooltipData.x.toFixed(3)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] text-white/50">Fastest</span>
                      <span className="font text-[12px] tabular-nums text-white">
                        {tooltipData.y.toFixed(3)}s
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Scatter name="Teams" data={data} fill="#8884d8">
            {data.map((entry) => (
              <Cell
                key={entry.teamName}
                fill={entry.teamColor}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </div>
);
