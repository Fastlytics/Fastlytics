import React from 'react';
import type { EnrichedLapRecord } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { COMPOUND_COLORS, formatLapTime } from './racingChartUtils';
import type { FastestLapStat } from './racingChartUtils';

interface FastestLapsTableProps {
  fastestLaps: FastestLapStat[];
  driverLapDetails?: Record<string, EnrichedLapRecord[]>;
  driverNameMap: Map<string, string>;
  year: number;
}

export const RacingFastestLapsTable: React.FC<FastestLapsTableProps> = ({
  fastestLaps,
  driverLapDetails,
  driverNameMap,
  year,
}) => (
  <div className="overflow-hidden rounded-lg border border-white/[0.04]">
    <div className="border-b border-white/[0.04] px-5 py-3">
      <h3 className="text-[14px] font-semibold text-white">Fastest Laps</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/[0.04]">
            <th className="px-4 py-2 text-[11px] font-medium text-white/60">Driver</th>
            <th className="px-4 py-2 text-right text-[11px] font-medium text-white/60">Time</th>
            <th className="px-4 py-2 text-center text-[11px] font-medium text-white/60">Lap</th>
            <th className="px-4 py-2 text-right text-[11px] font-medium text-white/60">Gap</th>
            <th className="px-4 py-2 text-center text-[11px] font-medium text-white/60">Tyre</th>
            <th className="px-4 py-2 text-right text-[11px] font-medium text-white/60">S1</th>
            <th className="px-4 py-2 text-right text-[11px] font-medium text-white/60">S2</th>
            <th className="px-4 py-2 text-right text-[11px] font-medium text-white/60">S3</th>
            <th className="px-4 py-2 text-right text-[11px] font-medium text-white/60">ST</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
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
              <tr key={stat.driver} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-2.5">
                  <span className="text-[13px] font-semibold" style={{ color }}>
                    {driverNameMap.get(stat.driver) || stat.driver}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-mono text-[13px] tabular-nums text-white">
                    {formatLapTime(stat.fastestTime)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-[13px] text-white">
                    {stat.lapNumber !== -1 ? stat.lapNumber : '-'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {index === 0 ? (
                    <span className="text-[12px] font-medium text-purple-400">Fastest</span>
                  ) : (
                    <span className="font-mono text-[13px] tabular-nums text-white/80">
                      {gap != null ? `+${gap.toFixed(3)}` : '-'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {lapDetail?.compound ? (
                    <span
                      className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${COMPOUND_COLORS[lapDetail.compound] || '#666'}12`,
                        color: COMPOUND_COLORS[lapDetail.compound] || '#fff',
                      }}
                    >
                      {lapDetail.compound}
                    </span>
                  ) : (
                    <span className="text-white/40">-</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-mono text-[13px] tabular-nums text-white/80">
                    {lapDetail?.sector1 != null ? lapDetail.sector1.toFixed(3) : '-'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-mono text-[13px] tabular-nums text-white/80">
                    {lapDetail?.sector2 != null ? lapDetail.sector2.toFixed(3) : '-'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-mono text-[13px] tabular-nums text-white/80">
                    {lapDetail?.sector3 != null ? lapDetail.sector3.toFixed(3) : '-'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-mono text-[13px] tabular-nums text-white/80">
                    {lapDetail?.speedST != null ? lapDetail.speedST.toFixed(0) : '-'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
