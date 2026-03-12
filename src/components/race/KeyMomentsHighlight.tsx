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
    <div className="bg-neutral-950/80 border border-neutral-800/60 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800/40">
        <FlashIcon className="w-4 h-4 text-red-500" />
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-[0.1em]">Key Moments</h3>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
            Largest single-lap position changes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-800/30 p-px">
        {biggestGain.change > 1 ? (
          <div className="bg-neutral-950 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <ArrowUp01Icon className="w-20 h-20 text-green-500" />
            </div>
            <p className="text-xs font-semibold text-green-400/80 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <ArrowUp01Icon className="w-3.5 h-3.5" /> Biggest Gain
            </p>
            <div className="text-xl font-black text-white mb-1.5">
              {biggestGain.driver} <span className="text-green-400">+{biggestGain.change}</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              P{biggestGain.from} <span className="text-neutral-700">→</span> P{biggestGain.to} • Lap{' '}
              {biggestGain.lap}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-950 p-5 opacity-40">
            <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5 mb-1">
              No Significant Gains
            </p>
            <p className="text-[11px] text-neutral-600 font-mono">
              No driver gained {'>'}1 position in a lap.
            </p>
          </div>
        )}

        {biggestLoss.change < -1 ? (
          <div className="bg-neutral-950 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <ArrowDown01Icon className="w-20 h-20 text-red-500" />
            </div>
            <p className="text-xs font-semibold text-red-400/80 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <ArrowDown01Icon className="w-3.5 h-3.5" /> Biggest Loss
            </p>
            <div className="text-xl font-black text-white mb-1.5">
              {biggestLoss.driver} <span className="text-red-400">{biggestLoss.change}</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              P{biggestLoss.from} <span className="text-neutral-700">→</span> P{biggestLoss.to} • Lap{' '}
              {biggestLoss.lap}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-950 p-5 opacity-40">
            <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5 mb-1">
              No Significant Losses
            </p>
            <p className="text-[11px] text-neutral-600 font-mono">
              No driver lost {'>'}1 position in a lap.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { KeyMomentsHighlight };
export default KeyMomentsHighlight;
