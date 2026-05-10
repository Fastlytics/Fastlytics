import type { SectorPace } from '@/lib/api';

import { formatLapTime, getSectorHeatColor, getTeamColor } from './utils';

interface SectorDominanceViewProps {
  sectorData: SectorPace[];
  bestS1: number;
  bestS2: number;
  bestS3: number;
}

const getBestSectorIndex = (
  sectorData: SectorPace[],
  key: 'sector1Median' | 'sector2Median' | 'sector3Median'
) =>
  sectorData.findIndex(
    (row) => (row[key] ?? 999) === Math.min(...sectorData.map((sector) => sector[key] ?? 999))
  );

export const SectorDominanceView = ({
  sectorData,
  bestS1,
  bestS2,
  bestS3,
}: SectorDominanceViewProps) => {
  if (!sectorData.length) {
    return (
      <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e]">
        <div className="flex h-32 items-center justify-center text-[13px] text-white">
          No sector data available
        </div>
      </div>
    );
  }

  const bestSector1Index = getBestSectorIndex(sectorData, 'sector1Median');
  const bestSector2Index = getBestSectorIndex(sectorData, 'sector2Median');
  const bestSector3Index = getBestSectorIndex(sectorData, 'sector3Median');

  return (
    <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="w-[140px] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white">
                Team
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Sector 1
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Sector 2
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Sector 3
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sectorData.map((row, index) => {
              const s1 = row.sector1Median ?? 0;
              const s2 = row.sector2Median ?? 0;
              const s3 = row.sector3Median ?? 0;
              const total = s1 + s2 + s3;
              const bestTotal =
                (sectorData[0].sector1Median ?? 0) +
                (sectorData[0].sector2Median ?? 0) +
                (sectorData[0].sector3Median ?? 0);
              const totalDelta = total - bestTotal;

              return (
                <tr
                  key={row.teamName}
                  className="border-b border-white/[0.04] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: getTeamColor(row.teamName) }}
                      />
                      <span className="text-[13px] font-semibold text-white">{row.teamName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: getSectorHeatColor(s1, bestS1) }}
                      >
                        {s1.toFixed(3)}
                      </span>
                      {s1 - bestS1 > 0.001 && (
                        <span className="text-[11px] text-white">+{(s1 - bestS1).toFixed(3)}</span>
                      )}
                      {s1 - bestS1 < 0.001 && index === bestSector1Index && (
                        <span className="text-[10px] font-semibold text-emerald-400">BEST</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: getSectorHeatColor(s2, bestS2) }}
                      >
                        {s2.toFixed(3)}
                      </span>
                      {s2 - bestS2 > 0.001 && (
                        <span className="text-[11px] text-white">+{(s2 - bestS2).toFixed(3)}</span>
                      )}
                      {s2 - bestS2 < 0.001 && index === bestSector2Index && (
                        <span className="text-[10px] font-semibold text-emerald-400">BEST</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: getSectorHeatColor(s3, bestS3) }}
                      >
                        {s3.toFixed(3)}
                      </span>
                      {s3 - bestS3 > 0.001 && (
                        <span className="text-[11px] text-white">+{(s3 - bestS3).toFixed(3)}</span>
                      )}
                      {s3 - bestS3 < 0.001 && index === bestSector3Index && (
                        <span className="text-[10px] font-semibold text-emerald-400">BEST</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-[13px] font-semibold text-white">
                        {formatLapTime(total)}
                      </span>
                      {totalDelta > 0.001 && (
                        <span className="text-[11px] text-white">+{totalDelta.toFixed(3)}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
