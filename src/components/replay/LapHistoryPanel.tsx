import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface CompletedLap {
  driver: string;
  lap: number;
  time_str: string;
  seconds: number;
  timestamp: number;
  compound: string;
  is_personal_best?: boolean;
}

interface LapHistoryPanelProps {
  completedLaps: CompletedLap[] | undefined;
  currentTime: number;
  selectedDriver: string | null;
  className?: string;
}

const LapHistoryPanel: React.FC<LapHistoryPanelProps> = ({
  completedLaps,
  currentTime,
  selectedDriver,
  className,
}) => {
  const driverLaps = useMemo(() => {
    if (!completedLaps || !selectedDriver) return [];
    return completedLaps
      .filter((l) => l.driver === selectedDriver && l.timestamp <= currentTime)
      .sort((a, b) => a.lap - b.lap);
  }, [completedLaps, currentTime, selectedDriver]);

  const personalBest = useMemo(() => {
    if (driverLaps.length === 0) return null;
    return driverLaps.reduce((best, lap) => (lap.seconds < best.seconds ? lap : best));
  }, [driverLaps]);

  if (!selectedDriver || driverLaps.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute top-0 left-[520px] z-20 w-52',
        'bg-[#0c0c0e]/90 backdrop-blur border border-white/[0.06] rounded-lg overflow-hidden',
        'hidden md:block',
        className
      )}
    >
      <div className="px-3 py-2 border-b border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
          Lap History
        </span>
        {personalBest && (
          <span className="text-[9px] font-mono text-purple-400 tabular-nums">
            PB {personalBest.time_str}
          </span>
        )}
      </div>
      <div className="max-h-56 overflow-y-auto">
        <div className="flex flex-col">
          {driverLaps.map((lap) => {
            const isPb = lap.is_personal_best || lap.seconds === personalBest?.seconds;
            return (
              <div
                key={lap.lap}
                className={cn(
                  'flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] last:border-b-0',
                  isPb && 'bg-purple-500/[0.04]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30 tabular-nums w-5">
                    L{lap.lap}
                  </span>
                  {isPb && <Trophy size={10} className="text-purple-400" />}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-mono font-semibold tabular-nums',
                    isPb ? 'text-purple-400' : 'text-white/60'
                  )}
                >
                  {lap.time_str}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LapHistoryPanel;
