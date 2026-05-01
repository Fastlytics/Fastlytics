import React, { useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@/hooks/useDraggable';

interface CompletedLap {
  driver: string;
  lap: number;
  time_str: string;
  seconds: number;
  timestamp: number;
  compound: string;
  s1?: number | null;
  s2?: number | null;
  s3?: number | null;
  is_personal_best?: boolean;
}

interface SectorTimesPanelProps {
  completedLaps: CompletedLap[] | undefined;
  currentTime: number;
  selectedDriver: string | null;
  fastestSectors: { s1: number | null; s2: number | null; s3: number | null } | undefined;
  className?: string;
}

const formatSectorTime = (sec: number | null | undefined): string => {
  if (sec === null || sec === undefined || sec <= 0) return '-';
  if (sec < 10) return `${sec.toFixed(3)}`;
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3);
  return m > 0 ? `${m}:${s.padStart(6, '0')}` : `${sec.toFixed(3)}`;
};

const SectorTimesPanel: React.FC<SectorTimesPanelProps> = ({
  completedLaps,
  currentTime,
  selectedDriver,
  fastestSectors,
  className,
}) => {
  const { position, isDragging, handleMouseDown } = useDraggable({ x: 256, y: 12 });

  const driverSectors = useMemo(() => {
    if (!completedLaps || !selectedDriver) return null;

    const driverLaps = completedLaps
      .filter((l) => l.driver === selectedDriver && l.timestamp <= currentTime)
      .sort((a, b) => b.lap - a.lap)
      .slice(0, 5);

    if (driverLaps.length === 0) return null;

    return driverLaps;
  }, [completedLaps, currentTime, selectedDriver]);

  const allTimeBests = useMemo(() => {
    if (!completedLaps)
      return { s1: null as number | null, s2: null as number | null, s3: null as number | null };

    let s1: number | null = null;
    let s2: number | null = null;
    let s3: number | null = null;

    for (const lap of completedLaps) {
      if (lap.s1 !== null && lap.s1 !== undefined && (s1 === null || lap.s1 < s1)) s1 = lap.s1;
      if (lap.s2 !== null && lap.s2 !== undefined && (s2 === null || lap.s2 < s2)) s2 = lap.s2;
      if (lap.s3 !== null && lap.s3 !== undefined && (s3 === null || lap.s3 < s3)) s3 = lap.s3;
    }

    return { s1, s2, s3 };
  }, [completedLaps]);

  if (!driverSectors || driverSectors.length === 0) return null;

  const isFastest = (sector: 's1' | 's2' | 's3', time: number | null | undefined) => {
    if (time === null || time === undefined || time <= 0) return false;
    const best = allTimeBests[sector];
    return best !== null && Math.abs(time - best) < 0.001;
  };

  return (
    <div
      className={cn(
        'absolute z-20 w-52',
        isDragging ? 'cursor-grabbing' : 'cursor-default',
        'hidden md:block',
        className
      )}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-[#0c0c0e]/90 backdrop-blur border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04]" data-grip>
          <GripVertical size={12} className="text-white cursor-grab" />
          <span className="text-[10px] font-normal uppercase tracking-wider text-white">
            Sectors — {selectedDriver}
          </span>
        </div>
        <div className="flex flex-col">
          {driverSectors.map((lap) => (
            <div key={lap.lap} className="px-3 py-2 border-b border-white/[0.04] last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white font-normal">L{lap.lap}</span>
                <span className="text-[10px] text-white font-medium">{lap.time_str}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['s1', 's2', 's3'] as const).map((sector) => {
                  const time = lap[sector];
                  const fastest = isFastest(sector, time);
                  return (
                    <div
                      key={sector}
                      className={cn('text-center py-1 rounded', fastest && 'bg-purple-500/10')}
                    >
                      <div className="text-[9px] font-normal uppercase tracking-wider text-white">
                        {sector.toUpperCase()}
                      </div>
                      <div
                        className={cn(
                          'text-[11px] font-medium tabular-nums',
                          fastest ? 'text-purple-400' : 'text-white'
                        )}
                      >
                        {formatSectorTime(time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectorTimesPanel;
