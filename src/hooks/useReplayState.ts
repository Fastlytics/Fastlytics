import { useState, useEffect, useCallback, useRef } from 'react';

interface ReplayState {
  isPlaying: boolean;
  hasStarted: boolean;
  playbackSpeed: number;
  currentTime: number;
  selectedDriver: string | null;
  showSpeedHeatmap: boolean;
  dismissedMessages: Set<string>;
}

const SPEEDS = [1, 2, 5, 10, 20];

export function useReplayState(totalDuration: number, toggleFullscreen: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showSpeedHeatmap, setShowSpeedHeatmap] = useState(false);
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

  const totalDurationRef = useRef(totalDuration);
  const toggleFullscreenRef = useRef(toggleFullscreen);

  useEffect(() => {
    totalDurationRef.current = totalDuration;
  }, [totalDuration]);

  useEffect(() => {
    toggleFullscreenRef.current = toggleFullscreen;
  }, [toggleFullscreen]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setPlaybackSpeed(1);
    setSelectedDriver(null);
    setDismissedMessages(new Set());
  }, []);

  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  }, []);

  const seek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(totalDurationRef.current, time)));
  }, []);

  const seekRelative = useCallback((delta: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(totalDurationRef.current, prev + delta)));
  }, []);

  const dismissMessage = useCallback((id: string) => {
    setDismissedMessages((prev) => new Set(prev).add(id));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;
      if (e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'f':
        case 'F':
          toggleFullscreenRef.current();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          setCurrentTime((prev) => Math.max(0, prev - 5));
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          setCurrentTime((prev) => Math.min(totalDurationRef.current, prev + 5));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    hasStarted,
    setHasStarted,
    playbackSpeed,
    setPlaybackSpeed,
    currentTime,
    setCurrentTime,
    selectedDriver,
    setSelectedDriver,
    showSpeedHeatmap,
    setShowSpeedHeatmap,
    dismissedMessages,
    reset,
    cycleSpeed,
    seek,
    seekRelative,
    dismissMessage,
  };
}
