import React from 'react';
import { Play, Pause, Gauge, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrackStatusSegment } from './replay-utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  activeTotalDuration: number;
  isFullscreen: boolean;
  hasStarted: boolean;
  showSpeedHeatmap: boolean;
  seekbarStatusSegments: TrackStatusSegment[];
  /** Available laps for lap-based seeking */
  availableLaps: number[];
  /** Current lap number (of leader or selected driver) */
  currentLap: number;
  formatTime: (seconds: number) => string;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: () => void;
  onToggleFullscreen: () => void;
  onToggleHeatmap: () => void;
  onHoverMove: (time: number, pos: number) => void;
  onHoverLeave: () => void;
  /** Jump to a specific lap */
  onSeekToLap: (lap: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  playbackSpeed,
  activeTotalDuration,
  isFullscreen,
  hasStarted,
  showSpeedHeatmap,
  seekbarStatusSegments,
  hoverTime,
  hoverPos,
  availableLaps,
  currentLap,
  formatTime,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onToggleFullscreen,
  onToggleHeatmap,
  onSeekToLap,
}) => {
  const progress = activeTotalDuration > 0 ? currentTime / activeTotalDuration : 0;

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-40 transition-all duration-500',
        hasStarted
          ? isFullscreen
            ? 'opacity-0 hover:opacity-100 pointer-events-none hover:pointer-events-auto'
            : 'opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0'
      )}
    >
      <div className="bg-[#0c0c0e]/95 backdrop-blur border-t border-white/[0.06] p-4 pointer-events-auto">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Seekbar Container */}
          <div className="relative group/slider w-full h-4 flex items-center">
            {/* Track Status Overlay Segments */}
            {seekbarStatusSegments.length > 0 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none z-10">
                {seekbarStatusSegments.map((seg, i) => (
                  <div
                    key={`status-seg-${i}`}
                    className="absolute h-1 rounded-full"
                    style={{
                      left: `${seg.startPct * 100}%`,
                      width: `${(seg.endPct - seg.startPct) * 100}%`,
                      backgroundColor: seg.color,
                      opacity: 0.5,
                    }}
                    title={seg.label}
                  />
                ))}
              </div>
            )}

            {/* Custom Seekbar Track */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center">
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500/80 rounded-full transition-all duration-75"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Range Input */}
            <input
              type="range"
              min={0}
              max={activeTotalDuration}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Current Time Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg pointer-events-none z-10 border-2 border-white/20"
              style={{ left: `calc(${progress * 100}% - 6px)` }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={onPlayPause}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>

              <span className="text-[14px] font-mono font-bold tabular-nums text-white/80 min-w-[5ch]">
                {formatTime(currentTime)}
              </span>

              {/* Lap Navigation */}
              {availableLaps.length > 0 && (
                <div className="flex items-center gap-1 ml-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-0.5">
                  <button
                    onClick={() => {
                      const idx = availableLaps.indexOf(currentLap);
                      if (idx > 0) onSeekToLap(availableLaps[idx - 1]);
                    }}
                    disabled={availableLaps.indexOf(currentLap) <= 0}
                    className="p-1 hover:bg-white/[0.06] rounded-md disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-white/50 hover:text-white"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-mono font-semibold text-white/60 min-w-[4ch] text-center tabular-nums">
                    L{currentLap}
                  </span>
                  <button
                    onClick={() => {
                      const idx = availableLaps.indexOf(currentLap);
                      if (idx < availableLaps.length - 1) onSeekToLap(availableLaps[idx + 1]);
                    }}
                    disabled={availableLaps.indexOf(currentLap) >= availableLaps.length - 1}
                    className="p-1 hover:bg-white/[0.06] rounded-md disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-white/50 hover:text-white"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Heatmap Toggle */}
              <button
                onClick={onToggleHeatmap}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg border transition-all text-[11px]',
                  showSpeedHeatmap
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-white/[0.06] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
                )}
                title={
                  showSpeedHeatmap
                    ? 'Hide speed heatmap'
                    : 'Show speed heatmap (select a driver first)'
                }
              >
                <Gauge size={15} />
              </button>

              {/* Speed Control */}
              <button
                onClick={onSpeedChange}
                className="h-8 px-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[11px] font-mono font-bold text-white/60 hover:bg-white/[0.06] hover:text-white transition-all tabular-nums min-w-[3ch] text-center"
              >
                {playbackSpeed}x
              </button>

              {/* Fullscreen */}
              <button
                onClick={onToggleFullscreen}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white transition-all"
              >
                {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
