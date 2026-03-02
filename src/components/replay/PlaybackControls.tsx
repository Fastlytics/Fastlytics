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
  hoverTime: number | null;
  hoverPos: number | null;
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
  onHoverMove,
  onHoverLeave,
  onSeekToLap,
}) => {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center z-40 transition-all duration-500 ${hasStarted ? (isFullscreen ? 'opacity-0 hover:opacity-100 pointer-events-none hover:pointer-events-auto' : 'opacity-100 pointer-events-auto') : 'translate-y-full opacity-0'}`}
    >
      <div className="w-full bg-gray-900/90 backdrop-blur border-t border-gray-800 p-4 pointer-events-auto">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          {/* Slider Container with Tooltip */}
          <div className="relative group/slider w-full">
            {/* Track Status Overlay Segments */}
            {seekbarStatusSegments.length > 0 && (
              <div className="absolute inset-0 flex items-center pointer-events-none z-10">
                {seekbarStatusSegments.map((seg, i) => (
                  <div
                    key={`status-seg-${i}`}
                    className="absolute h-2 rounded-sm"
                    style={{
                      left: `${seg.startPct * 100}%`,
                      width: `${(seg.endPct - seg.startPct) * 100}%`,
                      backgroundColor: seg.color,
                      opacity: 0.6,
                    }}
                    title={seg.label}
                  />
                ))}
              </div>
            )}
            {hoverTime !== null && hoverPos !== null && (
              <div
                className="absolute bottom-4 -translate-x-1/2 bg-black/90 text-white text-xs font-mono font-bold py-1 px-2 rounded border border-gray-700 pointer-events-none z-50 whitespace-nowrap"
                style={{ left: `${hoverPos}px` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
            <input
              type="range"
              min={0}
              max={activeTotalDuration}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const width = rect.width;
                const pct = Math.max(0, Math.min(1, x / width));
                const time = pct * activeTotalDuration;
                onHoverMove(time, x);
              }}
              onMouseLeave={onHoverLeave}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 block"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={onPlayPause}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <span className="font-mono text-xl font-bold tabular-nums min-w-[5ch]">
                {formatTime(currentTime)}
              </span>

              {/* Lap-Based Seeking */}
              {availableLaps.length > 0 && (
                <div className="flex items-center gap-1 ml-2 bg-white/5 rounded-lg px-2 py-1">
                  <button
                    onClick={() => {
                      const idx = availableLaps.indexOf(currentLap);
                      if (idx > 0) onSeekToLap(availableLaps[idx - 1]);
                    }}
                    disabled={availableLaps.indexOf(currentLap) <= 0}
                    className="p-0.5 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono text-gray-300 min-w-[5ch] text-center">
                    L{currentLap}
                  </span>
                  <button
                    onClick={() => {
                      const idx = availableLaps.indexOf(currentLap);
                      if (idx < availableLaps.length - 1) onSeekToLap(availableLaps[idx + 1]);
                    }}
                    disabled={availableLaps.indexOf(currentLap) >= availableLaps.length - 1}
                    className="p-0.5 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Right - Speed & Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Speed Heatmap Toggle */}
              <button
                onClick={onToggleHeatmap}
                className={cn(
                  'p-2 rounded-full transition-colors text-xs',
                  showSpeedHeatmap
                    ? 'bg-emerald-600/80 text-white hover:bg-emerald-500/80'
                    : 'hover:bg-white/10 text-white/60'
                )}
                title={
                  showSpeedHeatmap
                    ? 'Hide speed heatmap'
                    : 'Show speed heatmap (select a driver first)'
                }
              >
                <Gauge size={18} />
              </button>

              <button
                onClick={onSpeedChange}
                className="font-mono text-xs font-bold bg-white/10 px-2 py-1 rounded hover:bg-white/20 min-w-[3ch] text-center"
              >
                {playbackSpeed}x
              </button>

              <button
                onClick={onToggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
