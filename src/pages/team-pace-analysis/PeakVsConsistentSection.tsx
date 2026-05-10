import type { RefObject } from 'react';

import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts-lazy';

import ChartExportMenu from '@/components/charts/ChartExportMenu';

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
  <div
    ref={chartRef}
    className="h-[450px] w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:p-8"
  >
    <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold uppercase italic text-white">
      Peak <span className="text-zinc-600">vs</span> Consistent
      <ChartExportMenu
        onExport={onExport}
        isExporting={isExporting}
        hasData={data.length > 0}
        className="ml-auto"
      />
    </h3>
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            type="number"
            dataKey="x"
            name="Median Pace"
            unit="s"
            domain={['auto', 'auto']}
            tick={{ fill: '#666', fontSize: 10 }}
            label={{
              value: 'Consistency (Median Time)',
              position: 'bottom',
              fill: '#666',
              fontSize: 10,
              dy: 10,
            }}
            stroke="#444"
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Fastest Lap"
            unit="s"
            domain={['auto', 'auto']}
            tick={{ fill: '#666', fontSize: 10 }}
            label={{
              value: 'Peak (Fastest Lap)',
              angle: -90,
              position: 'insideLeft',
              fill: '#666',
              fontSize: 10,
            }}
            stroke="#444"
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#666' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              const tooltipData = payload[0].payload as ScatterDataPoint;
              return (
                <div className="rounded-xl border border-zinc-800 bg-black/95 p-4 shadow-2xl backdrop-blur-md">
                  <p
                    className="mb-2 border-b border-zinc-800 pb-1 font-bold text-white"
                    style={{ color: tooltipData.teamColor }}
                  >
                    {tooltipData.teamName}
                  </p>
                  <div className="space-y-1">
                    <p className="flex justify-between gap-4 text-xs text-zinc-400">
                      <span>Median:</span>
                      <span className="font-mono text-white">{tooltipData.x.toFixed(3)}s</span>
                    </p>
                    <p className="flex justify-between gap-4 text-xs text-zinc-400">
                      <span>Fastest:</span>
                      <span className="font-mono text-white">{tooltipData.y.toFixed(3)}s</span>
                    </p>
                  </div>
                </div>
              );
            }}
          />
          <Scatter name="Teams" data={data} fill="#8884d8">
            {data.map((entry) => (
              <Cell key={entry.teamName} fill={entry.teamColor} stroke="white" strokeWidth={1} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </div>
);
