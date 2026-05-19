// knip-ignore
import React from 'react';
import { LapPositionDataPoint } from '@/lib/api';
import { ArrowDown01Icon, ArrowUp01Icon, FlashIcon } from 'hugeicons-react';

interface KeyMomentsHighlightProps {
  lapData?: LapPositionDataPoint[];
}

const KeyMomentsHighlight: React.FC<KeyMomentsHighlightProps> = ({ lapData }) => {
  if (!lapData || lapData.length === 0) {
    return null;
  }

  let biggestGain = { driver: '', change: 0, lap: 0, from: 0, to: 0 };
  let biggestLoss = { driver: '', change: 0, lap: 0, from: 0, to: 0 };

  const positionsByLap: { [lap: number]: { [driver: string]: number } } = {};

  lapData.forEach((lapEntry) => {
    if (!positionsByLap[lapEntry.lap_number]) {
      positionsByLap[lapEntry.lap_number] = {};
    }
    positionsByLap[lapEntry.lap_number][lapEntry.driver_code] = lapEntry.position;
  });

  const laps = Object.keys(positionsByLap)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 1; i < laps.length; i++) {
    const currentLapNumber = laps[i];
    const previousLapNumber = laps[i - 1];
    const currentLapPositions = positionsByLap[currentLapNumber];
    const previousLapPositions = positionsByLap[previousLapNumber];

    for (const driver in currentLapPositions) {
      if (previousLapPositions && driver in previousLapPositions) {
        const currentPos = currentLapPositions[driver];
        const previousPos = previousLapPositions[driver];
        const change = previousPos - currentPos;

        if (change > biggestGain.change) {
          biggestGain = {
            driver,
            change,
            lap: currentLapNumber,
            from: previousPos,
            to: currentPos,
          };
        }
        if (change < biggestLoss.change) {
          biggestLoss = {
            driver,
            change,
            lap: currentLapNumber,
            from: previousPos,
            to: currentPos,
          };
        }
      }
    }
  }

  if (biggestGain.change <= 1 && biggestLoss.change >= -1) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <FlashIcon className="size-4 text-red-400" />
        <div>
          <h3 className="text-[14px] font-semibold text-white">Key Moments</h3>
          <p className="text-[11px] text-white">Largest single-lap position changes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {biggestGain.change > 1 ? (
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
            <div className="absolute right-3 top-3 text-emerald-500/[0.08]">
              <ArrowUp01Icon className="size-14" />
            </div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              <ArrowUp01Icon className="size-3.5" /> Biggest Gain
            </p>
            <div className="mb-1 text-[20px] font-bold text-white">
              {biggestGain.driver} <span className="text-emerald-400">+{biggestGain.change}</span>
            </div>
            <p className="text-[12px] text-white">
              P{biggestGain.from} → P{biggestGain.to} · Lap {biggestGain.lap}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              No Significant Gains
            </p>
            <p className="text-[11px] text-white">No driver gained {'>'}1 position in a lap.</p>
          </div>
        )}

        {biggestLoss.change < -1 ? (
          <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
            <div className="absolute right-3 top-3 text-red-500/[0.08]">
              <ArrowDown01Icon className="size-14" />
            </div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-red-400">
              <ArrowDown01Icon className="size-3.5" /> Biggest Loss
            </p>
            <div className="mb-1 text-[20px] font-bold text-white">
              {biggestLoss.driver} <span className="text-red-400">{biggestLoss.change}</span>
            </div>
            <p className="text-[12px] text-white">
              P{biggestLoss.from} → P{biggestLoss.to} · Lap {biggestLoss.lap}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              No Significant Losses
            </p>
            <p className="text-[11px] text-white">No driver lost {'>'}1 position in a lap.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { KeyMomentsHighlight };
export default KeyMomentsHighlight;
