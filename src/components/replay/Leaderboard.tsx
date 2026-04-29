import React from 'react';
import { getDriverImage } from '@/utils/imageMapping';
import { getTyreCompoundName } from './replay-utils';
import { cn } from '@/lib/utils';

interface LeaderboardDriver {
  pos: number;
  code: string;
  originalCode?: string;
  x: number;
  y: number;
  ref_dist: number;
  dist?: number;
  speed: number;
  lap: number;
  tyre?: number;
  color?: string;
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
  driverVisuals: { outStatus: Record<string, boolean>; visibility: Record<string, string> };
  isRace: boolean;
  isQualifying: boolean;
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
    <div className="absolute top-0 right-0 max-h-full h-auto w-64 bg-[#0c0c0e]/90 backdrop-blur border-l border-b border-white/[0.06] overflow-y-auto hidden md:block z-10">
      {/* Header */}
      <div className="p-3 border-b border-white/[0.04] flex justify-between items-center">
        <span className="text-[12px] font-medium uppercase tracking-wider text-white/35">
          {isRace ? 'Leaderboard' : 'Classification'}
        </span>
        {isRace ? (
          <span className="text-[12px] font-medium uppercase tracking-wider text-white/35">
            LAP <span className="text-white/60 font-mono">{leaderboard[0]?.lap || 0}</span>
            <span className="text-white/20"> / {totalLaps}</span>
          </span>
        ) : sessionTimeRemaining ? (
          <span
            className={cn(
              'text-[12px] font-mono font-bold tabular-nums tracking-tight',
              sessionTimeRemaining.isRed ? 'text-red-400 animate-pulse' : 'text-white/60'
            )}
          >
            {sessionTimeRemaining.formatted}
          </span>
        ) : null}
      </div>

      {/* Driver Rows */}
      <div className="flex flex-col">
        {leaderboard.map((driver, index) => {
          const isOut = driverVisuals.outStatus?.[driver.code];
          let intervalText = 'LEADER';
          let isPitting = false;

          if (pitIntervals?.[driver.code]) {
            isPitting = pitIntervals[driver.code].some(
              (interval) => currentTime >= interval.start && currentTime <= interval.end
            );
          }

          if (isOut) {
            intervalText = 'OUT';
          } else if (isPitting) {
            intervalText = 'PIT';
          } else if (isRace) {
            if (index > 0) {
              const leader = leaderboard[index - 1];
              const distA = leader.lap * circuitLength + (leader.ref_dist || 0);
              const distB = driver.lap * circuitLength + (driver.ref_dist || 0);
              const deltaMeters = Math.max(0, distA - distB);
              const speedMs = Math.max(10, (driver.speed || 0) / 3.6);
              intervalText = `+${(deltaMeters / speedMs).toFixed(1)}s`;
            }
          } else {
            const bestLap = driver.bestLap;
            const p1Best = leaderboard[0]?.bestLap;
            if (index === 0) {
              intervalText = bestLap?.time_str || 'NO TIME';
            } else if (bestLap && p1Best) {
              const diff = bestLap.seconds - p1Best.seconds;
              intervalText = `+${diff.toFixed(3)}s`;
            } else {
              intervalText = 'NO TIME';
            }
          }

          const tyreName = getTyreCompoundName(driver.tyre ?? 0);
          const age = tyreAge?.[driver.code];
          const isSelected = selectedDriver === driver.code;

          return (
            <div
              key={driver.code}
              onClick={() => {
                if (isOut) return;
                onSelectDriver(driver.code === selectedDriver ? null : driver.code);
                onFollow();
              }}
              className={cn(
                'flex items-center gap-2.5 py-2 px-3 border-b border-white/[0.04] transition-colors cursor-pointer',
                isOut ? 'opacity-40 grayscale cursor-default' : 'hover:bg-white/[0.03]',
                isSelected && 'bg-white/[0.06]'
              )}
            >
              {/* Position */}
              <span className="w-5 text-center text-[14px] font-bold text-white/30 tabular-nums">
                {driver.pos}
              </span>

              {/* Driver Image */}
              <div className="w-7 h-7 flex items-center justify-center bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06] shrink-0">
                <img
                  src={getDriverImage(driver.code, year)}
                  alt={driver.code}
                  className="w-full h-full object-cover object-top transform scale-110"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder.svg';
                    img.onerror = null;
                  }}
                />
              </div>

              {/* Team Color Dot */}
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: driver.color || '#666' }}
              />

              {/* Driver Code */}
              <span className="text-[13px] font-semibold text-white min-w-[3ch]">
                {driver.code}
              </span>

              {/* Tyre + Age */}
              <div className="flex items-center gap-0.5 ml-auto">
                <img
                  src={`/tyres/${tyreName}.png`}
                  alt="Tyre"
                  className="h-3.5 w-3.5 object-contain opacity-80"
                />
                {age !== undefined && age > 0 && (
                  <span className="text-[9px] font-mono text-white/30 tabular-nums">{age}</span>
                )}
              </div>

              {/* Interval / Status */}
              <span className="text-[11px] font-mono w-12 text-right tabular-nums shrink-0">
                {isPitting ? (
                  <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                    PIT
                  </span>
                ) : intervalText === 'OUT' ? (
                  <span className="text-white/25 font-bold uppercase">OUT</span>
                ) : intervalText === 'LEADER' ? (
                  <span className="text-white/30 font-bold uppercase">LEADER</span>
                ) : (
                  <span className="text-white/50">{intervalText}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
