import React, { useCallback, useMemo, useRef } from 'react';
import { formatReplayTime, getTrackStatusColor, getTrackStatusLabel, PLAYBACK_SPEEDS, SKIP_AMOUNTS } from './replay-utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  totalDuration: number;
  currentLap: number;
  totalLaps: number;
  trackStatus: string;
  isFullscreen: boolean;
  onPlay: () => void;
  onPause: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (time: number) => void;
  onSkip: (seconds: number) => void;
  onLapJump: (lap: number) => void;
  onFullscreen: () => void;
}

export function PlaybackControls({
  isPlaying,
  playbackSpeed,
  currentTime,
  totalDuration,
  currentLap,
  totalLaps,
  trackStatus,
  isFullscreen,
  onTogglePlay,
  onSpeedChange,
  onSeek,
  onSkip,
  onLapJump,
  onFullscreen,
}: PlaybackControlsProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Progress percentage
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Cycle to next speed
  const handleSpeedCycle = useCallback(() => {
    const currentIdx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIdx = (currentIdx + 1) % PLAYBACK_SPEEDS.length;
    onSpeedChange(PLAYBACK_SPEEDS[nextIdx]);
  }, [playbackSpeed, onSpeedChange]);

  // Click on progress bar to seek
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * totalDuration);
  }, [totalDuration, onSeek]);

  // Lap options for the dropdown
  const lapOptions = useMemo(() => {
    const laps: number[] = [];
    for (let i = 1; i <= totalLaps; i++) laps.push(i);
    return laps;
  }, [totalLaps]);

  const statusColor = getTrackStatusColor(trackStatus);
  const statusLabel = getTrackStatusLabel(trackStatus);

  return (
    <div className="bg-[#111111] border-t border-gray-800 px-4 py-2 flex-shrink-0">
      {/* Progress Bar */}
      <div
        ref={progressBarRef}
        className="w-full h-1.5 bg-gray-800 rounded-full cursor-pointer mb-3 group relative"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-red-600 rounded-full transition-all duration-75 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Knob */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-3 text-gray-300">
        {/* Skip Backward Buttons */}
        <div className="hidden md:flex items-center gap-1">
          {SKIP_AMOUNTS.filter(s => s.seconds < 0).map((skip) => (
            <button
              key={skip.label}
              onClick={() => onSkip(skip.seconds)}
              className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
              title={skip.label}
            >
              {skip.label}
            </button>
          ))}
        </div>

        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Skip Forward Buttons */}
        <div className="hidden md:flex items-center gap-1">
          {SKIP_AMOUNTS.filter(s => s.seconds > 0).map((skip) => (
            <button
              key={skip.label}
              onClick={() => onSkip(skip.seconds)}
              className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
              title={skip.label}
            >
              {skip.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-700 hidden md:block" />

        {/* Time Display */}
        <div className="font-mono text-xs text-gray-400 min-w-[80px]">
          {formatReplayTime(currentTime)}
          <span className="text-gray-600"> / {formatReplayTime(totalDuration)}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-700 hidden md:block" />

        {/* Lap Display + Selector */}
        {totalLaps > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-gray-500">LAP</span>
            <select
              value={currentLap}
              onChange={(e) => onLapJump(Number(e.target.value))}
              className="bg-gray-800 text-gray-300 text-xs font-mono rounded px-1 py-0.5 border border-gray-700 focus:outline-none focus:border-gray-500 cursor-pointer"
            >
              {lapOptions.map((lap) => (
                <option key={lap} value={lap}>
                  {lap}/{totalLaps}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Track Status */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-[10px] font-mono" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {/* Speed */}
        <button
          onClick={handleSpeedCycle}
          className="px-2 py-0.5 text-xs font-mono bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors min-w-[42px] text-center"
          title="Playback Speed"
        >
          {playbackSpeed}x
        </button>

        {/* Fullscreen */}
        <button
          onClick={onFullscreen}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
          title="Fullscreen (F)"
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
