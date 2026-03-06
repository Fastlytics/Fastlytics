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
    <div className="bg-black border border-gray-700 p-6 mt-4">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
        <FlashIcon className="w-5 h-5 text-red-600" />
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider text-white">Key Moments</h3>
          <p className="text-xs text-gray-400 font-mono uppercase">
            Largest single-lap position changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {biggestGain.change > 1 ? (
          <div className="bg-black border border-green-900/50 p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <ArrowUp01Icon className="w-16 h-16 text-green-500" />
            </div>
            <p className="font-black uppercase tracking-wider text-green-500 flex items-center gap-2 mb-2">
              <ArrowUp01Icon className="w-4 h-4" /> Biggest Gain
            </p>
            <div className="text-2xl font-black text-white mb-1">
              {biggestGain.driver} <span className="text-green-500">+{biggestGain.change}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono uppercase">
              P{biggestGain.from} <span className="text-gray-700">→</span> P{biggestGain.to} • Lap{' '}
              {biggestGain.lap}
            </p>
          </div>
        ) : (
          <div className="bg-black border border-gray-700 p-4 opacity-50">
            <p className="font-black uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-1">
              No Significant Gains
            </p>
            <p className="text-xs text-gray-600 font-mono">
              No driver gained {'>'}1 position in a lap.
            </p>
          </div>
        )}

        {biggestLoss.change < -1 ? (
          <div className="bg-black border border-red-900/50 p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <ArrowDown01Icon className="w-16 h-16 text-red-500" />
            </div>
            <p className="font-black uppercase tracking-wider text-red-500 flex items-center gap-2 mb-2">
              <ArrowDown01Icon className="w-4 h-4" /> Biggest Loss
            </p>
            <div className="text-2xl font-black text-white mb-1">
              {biggestLoss.driver} <span className="text-red-500">{biggestLoss.change}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono uppercase">
              P{biggestLoss.from} <span className="text-gray-700">→</span> P{biggestLoss.to} • Lap{' '}
              {biggestLoss.lap}
            </p>
          </div>
        ) : (
          <div className="bg-black border border-gray-700 p-4 opacity-50">
            <p className="font-black uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-1">
              No Significant Losses
            </p>
            <p className="text-xs text-gray-600 font-mono">
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
