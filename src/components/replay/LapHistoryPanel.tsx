import React, { useMemo, useState } from 'react';
import { Trophy, X, Gauge, Footprints, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import WidgetShell from './WidgetShell';
import { WidgetBounds, WidgetLayout } from '@/hooks/useReplayWidgets';
import TelemetrySparkline from './TelemetrySparkline';

interface CompletedLap {
  driver: string;
  lap: number;
  time_str: string;
  seconds: number;
  timestamp: number;
  compound: string;
  is_personal_best?: boolean;
}

interface DriverData {
  speed: number[];
  throttle: number[];
  brake: number[];
  rpm: number[];
  time: number[];
}

interface LapHistoryPanelProps {
  completedLaps: CompletedLap[] | undefined;
  currentTime: number;
  selectedDriver: string | null;
  driverData?: DriverData | null;
  driverColor?: string;
  onSeekToLap?: (lap: number) => void;
  layout: WidgetLayout;
  onUpdateLayout: (updates: Partial<WidgetLayout>) => void;
  bounds: WidgetBounds;
  onClose?: () => void;
}

type DetailView = 'speed' | 'throttle' | 'brake' | 'rpm' | null;

const LapHistoryPanel: React.FC<LapHistoryPanelProps> = ({
  completedLaps,
  currentTime,
  selectedDriver,
  driverData,
  driverColor = '#ef4444',
  onSeekToLap,
  layout,
  onUpdateLayout,
  bounds,
  onClose,
}) => {
  const [selectedLap, setSelectedLap] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<DetailView>(null);

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

  const sessionBestLap = useMemo(() => {
    if (!completedLaps || completedLaps.length === 0) return null;
    return completedLaps.reduce((best, lap) => (lap.seconds < best.seconds ? lap : best));
  }, [completedLaps]);

  // Find the time range for the selected lap in driver data
  const lapTelemetryRange = useMemo(() => {
    if (!selectedLap || !driverData || !driverData.time || !driverData.speed) return null;
    const lapEndTime = driverLaps.find((l) => l.lap === selectedLap)?.timestamp;
    if (!lapEndTime) return null;
    const prevLap = driverLaps.find((l) => l.lap === selectedLap - 1);
    const lapStartTime = prevLap ? prevLap.timestamp : driverData.time[0];

    const startIdx = driverData.time.findIndex((t) => t >= lapStartTime);
    const endIdx = driverData.time.findIndex((t) => t >= lapEndTime);
    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return null;

    return { startIdx, endIdx };
  }, [selectedLap, driverData, driverLaps]);

  const getTelemetrySlice = (array: number[] | undefined) => {
    if (!array || !lapTelemetryRange) return [];
    return array.slice(lapTelemetryRange.startIdx, lapTelemetryRange.endIdx + 1);
  };

  if (!selectedDriver || driverLaps.length === 0) return null;

  const detailConfig = {
    speed: { label: 'Speed Trace', color: driverColor, fill: driverColor, max: 400, min: 0 },
    throttle: { label: 'Throttle Input', color: '#10b981', fill: '#10b981', max: 100, min: 0 },
    brake: { label: 'Braking Input', color: '#ef4444', fill: '#ef4444', max: 100, min: 0 },
    rpm: { label: 'RPM', color: '#f59e0b', fill: '#f59e0b', max: undefined, min: 0 },
  };

  return (
    <WidgetShell
      title={`Lap History — ${selectedDriver}`}
      layout={layout}
      bounds={bounds}
      onUpdateLayout={onUpdateLayout}
      onClose={onClose}
    >
      <div className="flex flex-col h-full gap-2 overflow-hidden">
        {/* PB badge */}
        {personalBest && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <Trophy size={12} className="text-emerald-300" />
            <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
              PB
            </span>
            <span className="text-[12px] text-white font-bold tabular-nums ml-auto">
              {personalBest.time_str}
            </span>
          </div>
        )}

        {/* Detail view */}
        {detailView && selectedLap && (
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                L{selectedLap} — {detailConfig[detailView].label}
              </span>
              <button
                onClick={() => setDetailView(null)}
                className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </div>
            <TelemetrySparkline
              data={getTelemetrySlice(
                detailView === 'speed'
                  ? driverData?.speed
                  : detailView === 'throttle'
                    ? driverData?.throttle
                    : detailView === 'brake'
                      ? driverData?.brake
                      : driverData?.rpm
              )}
              width={layout.width - 32}
              height={50}
              color={detailConfig[detailView].color}
              fillColor={detailConfig[detailView].fill}
              maxValue={detailConfig[detailView].max}
              minValue={detailConfig[detailView].min}
            />
          </div>
        )}

        {/* Lap list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
          {driverLaps.map((lap, index) => {
            const isPb = lap.is_personal_best || lap.seconds === personalBest?.seconds;
            const isOverallBest =
              sessionBestLap !== null &&
              lap.driver === sessionBestLap.driver &&
              lap.lap === sessionBestLap.lap &&
              Math.abs(lap.seconds - sessionBestLap.seconds) < 0.001;
            const previousLap = index > 0 ? driverLaps[index - 1] : null;
            const isSlowerLap =
              !isOverallBest && !isPb && previousLap !== null && lap.seconds > previousLap.seconds;
            const isSelected = selectedLap === lap.lap;

            return (
              <button
                key={lap.lap}
                onClick={() => {
                  setSelectedLap(lap.lap);
                  if (!detailView) setDetailView('speed');
                  onSeekToLap?.(lap.lap);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all',
                  isOverallBest
                    ? 'bg-purple-500/[0.08] border-purple-500/20 hover:bg-purple-500/[0.12]'
                    : isPb
                      ? 'bg-emerald-500/[0.08] border-emerald-500/20 hover:bg-emerald-500/[0.12]'
                      : isSlowerLap
                        ? 'bg-yellow-500/[0.08] border-yellow-500/20 hover:bg-yellow-500/[0.12]'
                        : 'bg-white/[0.02] border-white/[0.03] hover:bg-white/[0.04]',
                  isSelected && 'ring-1 ring-white/10'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-white/80 tabular-nums w-7">
                    L{lap.lap}
                  </span>
                  {isOverallBest ? (
                    <Trophy size={10} className="text-purple-300" />
                  ) : isPb ? (
                    <Trophy size={10} className="text-emerald-300" />
                  ) : isSlowerLap ? (
                    <Trophy size={10} className="text-yellow-300" />
                  ) : null}
                  <span className="text-[9px] text-white/30 uppercase">{lap.compound}</span>
                </div>
                <span
                  className={cn(
                    'text-[12px] font-bold tabular-nums',
                    isOverallBest
                      ? 'text-purple-300'
                      : isPb
                        ? 'text-emerald-300'
                        : isSlowerLap
                          ? 'text-yellow-300'
                          : 'text-white/80'
                  )}
                >
                  {lap.time_str}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail selector */}
        {selectedLap && !detailView && (
          <div className="grid grid-cols-4 gap-1">
            {(['speed', 'throttle', 'brake', 'rpm'] as DetailView[]).map((view) => (
              <button
                key={view}
                onClick={() => setDetailView(view)}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-colors"
              >
                {view === 'speed' && <Gauge size={12} className="text-white/50" />}
                {view === 'throttle' && <Activity size={12} className="text-emerald-400/60" />}
                {view === 'brake' && <Footprints size={12} className="text-red-400/60" />}
                {view === 'rpm' && <Activity size={12} className="text-amber-400/60" />}
                <span className="text-[8px] text-white/40 uppercase tracking-wider">{view}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

export default LapHistoryPanel;
