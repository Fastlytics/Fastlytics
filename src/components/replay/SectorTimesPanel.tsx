import React, { useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import WidgetShell from './WidgetShell';
import { WidgetBounds, WidgetLayout } from '@/hooks/useReplayWidgets';

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
  liveSector?: { label: 'S1' | 'S2' | 'S3'; time: number } | null;
  layout: WidgetLayout;
  onUpdateLayout: (updates: Partial<WidgetLayout>) => void;
  bounds: WidgetBounds;
  onClose?: () => void;
}

const formatSectorTime = (sec: number | null | undefined): string => {
  if (sec === null || sec === undefined || sec <= 0) return '-';
  if (sec < 10) return `${sec.toFixed(3)}`;
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3);
  return m > 0 ? `${m}:${s.padStart(6, '0')}` : `${sec.toFixed(3)}`;
};

const getSectorColor = (
  time: number | null | undefined,
  fastestOverall: number | null | undefined,
  personalBest: number | null | undefined,
  previous: number | null | undefined
): { bg: string; text: string; icon: React.ReactNode } => {
  if (time === null || time === undefined || time <= 0) {
    return {
      bg: 'bg-white/[0.02]',
      text: 'text-white/55',
      icon: <Minus size={10} className="text-white/50" />,
    };
  }
  // Fastest of all drivers = purple
  if (
    fastestOverall !== null &&
    fastestOverall !== undefined &&
    Math.abs(time - fastestOverall) < 0.001
  ) {
    return {
      bg: 'bg-purple-500/15',
      text: 'text-purple-300',
      icon: <Trophy size={10} className="text-purple-300" />,
    };
  }
  // Personal best = green
  if (
    personalBest !== null &&
    personalBest !== undefined &&
    Math.abs(time - personalBest) < 0.001
  ) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      icon: <TrendingUp size={10} className="text-emerald-300" />,
    };
  }
  // Slower than previous = yellow
  if (previous !== null && previous !== undefined && time > previous) {
    return {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-300',
      icon: <TrendingDown size={10} className="text-yellow-300" />,
    };
  }
  return {
    bg: 'bg-white/[0.02]',
    text: 'text-white/80',
    icon: <Minus size={10} className="text-white/55" />,
  };
};

const SectorTimesPanel: React.FC<SectorTimesPanelProps> = ({
  completedLaps,
  currentTime,
  selectedDriver,
  fastestSectors,
  liveSector = null,
  layout,
  onUpdateLayout,
  bounds,
  onClose,
}) => {
  const formatLiveTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
  };

  const driverSectors = useMemo(() => {
    if (!completedLaps || !selectedDriver) return [];
    return completedLaps
      .filter((l) => l.driver === selectedDriver && l.timestamp <= currentTime)
      .sort((a, b) => b.lap - a.lap);
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

  // Personal bests per sector for selected driver
  const personalBests = useMemo(() => {
    if (!driverSectors.length)
      return { s1: null as number | null, s2: null as number | null, s3: null as number | null };
    let s1: number | null = null;
    let s2: number | null = null;
    let s3: number | null = null;
    for (const lap of driverSectors) {
      if (lap.s1 !== null && lap.s1 !== undefined && (s1 === null || lap.s1 < s1)) s1 = lap.s1;
      if (lap.s2 !== null && lap.s2 !== undefined && (s2 === null || lap.s2 < s2)) s2 = lap.s2;
      if (lap.s3 !== null && lap.s3 !== undefined && (s3 === null || lap.s3 < s3)) s3 = lap.s3;
    }
    return { s1, s2, s3 };
  }, [driverSectors]);

  if (!selectedDriver || driverSectors.length === 0) return null;

  return (
    <WidgetShell
      title={`Sectors — ${selectedDriver}`}
      layout={layout}
      bounds={bounds}
      onUpdateLayout={onUpdateLayout}
      onClose={onClose}
    >
      <div className="flex flex-col h-full gap-2 overflow-hidden">
        {liveSector && liveSector.time >= 0 && (
          <div className="flex items-center justify-between px-0 py-0.5 shrink-0">
            <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
              Live {liveSector.label}
            </span>
            <span className="text-[15px] font-bold text-white tabular-nums">
              {formatLiveTime(liveSector.time)}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="grid grid-cols-4 gap-1 px-1 pb-1 border-b border-white/[0.04] shrink-0">
          <span className="text-[9px] font-medium text-white/65 uppercase tracking-wider">Lap</span>
          <span className="text-[9px] font-medium text-white/65 uppercase tracking-wider text-center">
            S1
          </span>
          <span className="text-[9px] font-medium text-white/65 uppercase tracking-wider text-center">
            S2
          </span>
          <span className="text-[9px] font-medium text-white/65 uppercase tracking-wider text-center">
            S3
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-1.5 pr-1">
          {driverSectors.map((lap, lapIndex) => {
            const sectors = ['s1', 's2', 's3'] as const;
            return (
              <div
                key={lap.lap}
                className="grid grid-cols-4 gap-1 items-center p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-white tabular-nums">
                    L{lap.lap}
                  </span>
                  <span className="text-[9px] font-medium text-white/65">{lap.time_str}</span>
                </div>
                {sectors.map((sector) => {
                  const time = lap[sector];
                  const fastestOverall = allTimeBests[sector];
                  const pb = personalBests[sector];
                  const prev =
                    lapIndex < driverSectors.length - 1
                      ? driverSectors[lapIndex + 1][sector]
                      : undefined;
                  const colors = getSectorColor(time, fastestOverall, pb, prev);

                  return (
                    <div
                      key={sector}
                      className={cn(
                        'flex flex-col items-center justify-center py-1 rounded-md',
                        colors.bg,
                        'transition-colors'
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {colors.icon}
                        <span className={cn('text-[11px] font-semibold tabular-nums', colors.text)}>
                          {formatSectorTime(time)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </WidgetShell>
  );
};

export default React.memo(SectorTimesPanel);
