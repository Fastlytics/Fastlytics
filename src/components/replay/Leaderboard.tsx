import React from 'react';
import { getDriverImage } from '@/utils/imageMapping';
import { getTyreCompoundName } from './replay-utils';

interface LeaderboardDriver {
  code: string;
  originalCode?: string;
  pos: number;
  lap: number;
  speed: number;
  ref_dist: number;
  color?: string;
  tyre?: number;
  bestLap?: {
    driver: string;
    lap: number;
    time_str: string;
    seconds: number;
    timestamp: number;
    compound: string;
  } | null;
}

interface LeaderboardProps {
  leaderboard: LeaderboardDriver[];
  selectedDriver: string | null;
  driverVisuals: {
    outStatus: Record<string, boolean>;
    visibility: Record<string, string>;
  };
  isRace: boolean;
  isQualifying: boolean;
  replayMode: string;
  currentTime: number;
  totalLaps: number;
  year: number;
  sessionTimeRemaining: { formatted: string; remaining: number; isRed: boolean } | null;
  pitIntervals?: Record<string, { start: number; end: number }[]>;
  circuitLength: number;
  tyreAge?: Record<string, number>;
  onSelectDriver: (code: string | null) => void;
  onFollow: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  leaderboard,
  selectedDriver,
  driverVisuals,
  isRace,
  isQualifying,
  replayMode,
  currentTime,
  totalLaps,
  year,
  sessionTimeRemaining,
  pitIntervals,
  circuitLength,
  tyreAge,
  onSelectDriver,
  onFollow,
}) => {
  return (
    <div className="absolute top-0 right-0 max-h-full h-auto w-64 bg-black/50 backdrop-blur border-l border-b border-gray-800 rounded-bl-lg overflow-y-auto hidden md:block z-10">
      <div className="p-3 border-b border-gray-800 font-bold text-sm tracking-widest uppercase flex justify-between items-center text-gray-200">
        <span>{isRace ? 'Leaderboard' : 'Classification'}</span>
        {isRace && replayMode !== 'ghost' ? (
          <span className="text-white">
            LAP {leaderboard[0]?.lap || 0} <span className="text-gray-500">/ {totalLaps}</span>
          </span>
        ) : sessionTimeRemaining && replayMode !== 'ghost' && !isQualifying ? (
          <span
            className={`tabular-nums tracking-tight ${sessionTimeRemaining.isRed ? 'text-red-500 font-bold animate-pulse' : 'text-white'}`}
          >
            TIME {sessionTimeRemaining.formatted}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col">
        {leaderboard.map((driver, index) => {
          const isOut = driverVisuals.outStatus?.[driver.code];

          // Interval Calculation
          let intervalText = 'LEADER';
          let isPitting = false;

          // Check Pit Status
          if (pitIntervals?.[driver.code]) {
            isPitting = pitIntervals[driver.code].some(
              (interval) => currentTime >= interval.start && currentTime <= interval.end
            );
          }

          if (isOut) {
            intervalText = 'OUT';
          } else if (isPitting) {
            intervalText = 'PIT';
          } else {
            if (isRace) {
              if (index > 0) {
                const leader = leaderboard[index - 1];
                const lapA = replayMode === 'ghost' ? 0 : leader.lap;
                const lapB = replayMode === 'ghost' ? 0 : driver.lap;
                const distA = lapA * circuitLength + (leader.ref_dist || 0);
                const distB = lapB * circuitLength + (driver.ref_dist || 0);
                const deltaMeters = Math.max(0, distA - distB);
                const speedMs = Math.max(10, (driver.speed || 0) / 3.6);
                intervalText = `+${(deltaMeters / speedMs).toFixed(1)}s`;
              }
            } else {
              const bestLap = driver.bestLap;
              const p1Best = leaderboard[0]?.bestLap;
              if (index === 0) {
                intervalText = bestLap?.time_str || 'NO TIME';
              } else {
                if (bestLap && p1Best) {
                  const diff = bestLap.seconds - p1Best.seconds;
                  intervalText = `+${diff.toFixed(3)}s`;
                } else {
                  intervalText = 'NO TIME';
                }
              }
            }
          }

          const tyreName = getTyreCompoundName(driver.tyre ?? 0);
          const age = tyreAge?.[driver.code];

          return (
            <div
              key={driver.code}
              onClick={() => {
                if (isOut) return;
                onSelectDriver(driver.code === selectedDriver ? null : driver.code);
                onFollow();
              }}
              className={`flex items-center gap-2 py-0.5 px-2 border-b border-gray-800/50 transition-colors ${isOut ? 'opacity-40 grayscale cursor-default' : 'cursor-pointer hover:bg-white/5'} ${selectedDriver === driver.code ? 'bg-white/10' : ''}`}
            >
              <span className="w-4 text-center text-gray-500 font-mono text-[10px]">
                {driver.pos}
              </span>

              {/* Driver Image */}
              <div className="w-8 h-8 flex items-center justify-center bg-gray-900 rounded-full overflow-hidden border border-gray-700 shrink-0">
                <img
                  src={getDriverImage(driver.code.replace('_GHOST', ''), year)}
                  alt={driver.code}
                  className="w-full h-full object-cover object-top transform scale-110"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder.svg';
                    img.onerror = null;
                  }}
                />
              </div>
              <div className="w-1 h-5 mx-1" style={{ backgroundColor: driver.color }}></div>
              <span className="font-bold text-xs min-w-[3ch]">
                {driver.originalCode || driver.code.replace('_GHOST', '')}
              </span>

              {/* Tyre Icon + Age */}
              <div className="flex items-center gap-0.5 ml-auto">
                <img src={`/tyres/${tyreName}.png`} alt="Tyre" className="h-4 w-4 object-contain" />
                {age !== undefined && age > 0 && (
                  <span className="text-[9px] font-mono text-gray-500">{age}</span>
                )}
              </div>

              {/* Interval */}
              <span
                className={`text-[10px] font-mono w-10 text-right ${
                  intervalText === 'PIT'
                    ? 'text-orange-500 font-bold animate-pulse'
                    : intervalText === 'OUT'
                      ? 'text-gray-500 font-bold'
                      : 'text-gray-400'
                }`}
              >
                {intervalText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
