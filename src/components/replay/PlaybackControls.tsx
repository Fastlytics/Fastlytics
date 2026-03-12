import React, { useCallback, useRef, useEffect } from 'react';
import {
  formatReplayTime,
  getTrackStatusColor,
  getTrackStatusLabel,
  PLAYBACK_SPEEDS,
  SKIP_AMOUNTS,
} from './replay-utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  totalDuration: number;
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
  const progressFillRef = useRef<HTMLDivElement>(null);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Directly update progress bar width for smooth animation during playback
  // This avoids React re-render overhead during the animation frame loop
  useEffect(() => {
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  const handleSpeedCycle = useCallback(() => {
    const currentIdx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIdx = (currentIdx + 1) % PLAYBACK_SPEEDS.length;
    onSpeedChange(PLAYBACK_SPEEDS[nextIdx]);
  }, [playbackSpeed, onSpeedChange]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * totalDuration);
    },
    [totalDuration, onSeek]
  );

  const statusColor = getTrackStatusColor(trackStatus);
  const statusLabel = getTrackStatusLabel(trackStatus);

  return (
    <div className="bg-[#111111] border-t border-gray-800 px-4 py-2 flex-shrink-0">
      <div
        ref={progressBarRef}
        className="w-full h-1.5 bg-gray-800 rounded-full cursor-pointer mb-3 group relative"
        onClick={handleProgressClick}
      >
        <div
          ref={progressFillRef}
          className="h-full bg-red-600 rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-white">
        <div className="hidden md:flex items-center gap-1">
          {SKIP_AMOUNTS.filter((s) => s.seconds < 0).map((skip) => (
            <button
              key={skip.label}
              onClick={() => onSkip(skip.seconds)}
              className="px-1.5 py-0.5 text-[10px] font-sans text-white/60 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title={skip.label}
            >
              {skip.label}
            </button>
          ))}
        </div>

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

        <div className="hidden md:flex items-center gap-1">
          {SKIP_AMOUNTS.filter((s) => s.seconds > 0).map((skip) => (
            <button
              key={skip.label}
              onClick={() => onSkip(skip.seconds)}
              className="px-1.5 py-0.5 text-[10px] font-sans text-white/60 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title={skip.label}
            >
              {skip.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-700 hidden md:block" />

        <div className="font-sans text-xs text-white min-w-[80px]">
          {formatReplayTime(currentTime)}
          <span className="text-white/40"> / {formatReplayTime(totalDuration)}</span>
        </div>

        <div className="flex-1" />

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-[10px] font-sans" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        <button
          onClick={handleSpeedCycle}
          className="px-2 py-0.5 text-xs font-sans bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors min-w-[42px] text-center text-white"
          title="Playback Speed"
        >
          {playbackSpeed}x
        </button>

        <button
          onClick={onFullscreen}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors text-white"
          title="Fullscreen (F)"
        >
          {isFullscreen ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
