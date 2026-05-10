import React from 'react';
import { Time01Icon } from 'hugeicons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EnrichedLapRecord } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { COMPOUND_COLORS, formatLapTime } from './racingChartUtils';
import type { FastestLapStat } from './racingChartUtils';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

interface FastestLapsTableProps {
  fastestLaps: FastestLapStat[];
  driverLapDetails?: Record<string, EnrichedLapRecord[]>;
  year: number;
}

export const RacingFastestLapsTable: React.FC<FastestLapsTableProps> = ({
  fastestLaps,
  driverLapDetails,
  year,
}) => (
  <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
      <Time01Icon className="size-4 text-red-400" />
      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">
        Fastest Laps (Selection)
      </h4>
    </div>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8">
              Driver
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
              Time
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-center">
              Lap
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
              Gap
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-center">
              Tyre
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
              S1
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
              S2
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
              S3
            </TableHead>
            <TableHead className="text-[11px] font-medium text-white uppercase tracking-wider h-8 text-right">
              ST
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
              <TableRow
                key={stat.driver}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] last:border-b-0"
              >
                <TableCell className="py-3 font-semibold text-[13px]" style={{ color }}>
                  {stat.driver}
                </TableCell>
                <TableCell className="py-3 text-right text-white/70 text-[13px]">
                  {formatLapTime(stat.fastestTime)}
                </TableCell>
                <TableCell className="py-3 text-center text-white text-[12px]">
                  {stat.lapNumber !== -1 ? `L${stat.lapNumber}` : '-'}
                </TableCell>
                <TableCell className="py-3 text-right text-[12px]">
                  {index === 0 ? (
                    <span className="text-purple-400 font-bold">Fastest</span>
                  ) : (
                    <span className="text-white">{gap != null ? `+${gap.toFixed(3)}s` : '-'}</span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-center">
                  {lapDetail?.compound ? (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${COMPOUND_COLORS[lapDetail.compound] || '#666'}22`,
                        color: COMPOUND_COLORS[lapDetail.compound] || '#666',
                      }}
                    >
                      {lapDetail.compound}
                    </span>
                  ) : (
                    <span className="text-white">-</span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-right text-white text-[12px]">
                  {lapDetail?.sector1 != null ? lapDetail.sector1.toFixed(3) : '-'}
                </TableCell>
                <TableCell className="py-3 text-right text-white text-[12px]">
                  {lapDetail?.sector2 != null ? lapDetail.sector2.toFixed(3) : '-'}
                </TableCell>
                <TableCell className="py-3 text-right text-white text-[12px]">
                  {lapDetail?.sector3 != null ? lapDetail.sector3.toFixed(3) : '-'}
                </TableCell>
                <TableCell className="py-3 text-right text-white text-[12px]">
                  {lapDetail?.speedST != null ? lapDetail.speedST.toFixed(0) : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  </div>
);
