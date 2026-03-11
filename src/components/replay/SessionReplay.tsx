import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchReplayMetadata,
  fetchReplayChunk,
  type ReplayMetadata,
  type ReplayFrame,
  type ReplayChunk,
} from '@/lib/api';
import { TrackCanvas } from './TrackCanvas';
import { Leaderboard } from './Leaderboard';
import { PlaybackControls } from './PlaybackControls';
import { RaceControlMessages } from './RaceControlMessages';
import { WeatherWidget } from './WeatherWidget';
import { ReplayLoader } from './ReplayLoader';

interface SessionReplayProps {
  year: number;
  event: string;
  session: string;
  className?: string;
}

export function SessionReplay({ year, event, session, className = '' }: SessionReplayProps) {
  // --- State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for animation loop
  const lastTickRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const allFramesRef = useRef<ReplayFrame[]>([]);
  const currentFrameIdxRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---

  // Fetch metadata (track layout, session info, chunk manifest)
  const {
    data: metadata,
    isLoading: metaLoading,
    error: metaError,
  } = useQuery<ReplayMetadata>({
    queryKey: ['replay-metadata', year, event, session],
    queryFn: () => fetchReplayMetadata(year, event, session),
    staleTime: Infinity,
    retry: 2,
  });

  // Progressive chunk loading
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set());
  const [loadingChunk, setLoadingChunk] = useState(false);

  // Load chunks progressively
  useEffect(() => {
    if (!metadata?.chunk_manifest) return;

    const loadNextChunk = async () => {
      const manifest = metadata.chunk_manifest;
      const nextChunkId = manifest.find((c) => !loadedChunks.has(c.id))?.id;
      if (nextChunkId === undefined) return; // All loaded

      setLoadingChunk(true);
      try {
        const chunk = await fetchReplayChunk(year, event, session, nextChunkId);

        // Append frames
        allFramesRef.current = [...allFramesRef.current, ...chunk.frames];
        setLoadedChunks((prev) => new Set([...prev, nextChunkId]));
      } catch (err) {
        console.error(`Failed to load chunk ${nextChunkId}:`, err);
      } finally {
        setLoadingChunk(false);
      }
    };

    loadNextChunk();
  }, [metadata, loadedChunks, year, event, session]);

  // Keep loading chunks until all are done
  useEffect(() => {
    if (!metadata?.chunk_manifest || loadingChunk) return;
    const allLoaded = metadata.chunk_manifest.every((c) => loadedChunks.has(c.id));
    if (!allLoaded) {
      // Trigger next chunk load with a small delay
      const timer = setTimeout(() => {
        setLoadedChunks((prev) => new Set(prev)); // Trigger re-run
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [metadata, loadedChunks, loadingChunk]);

  // --- Current Frame ---
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadedChunks.size forces recalc when new frames arrive in allFramesRef
  const frameData = useMemo(() => {
    const frames = allFramesRef.current;
    if (!frames.length) return { current: null, next: null };

    // Binary search for the frame closest to or exactly at currentTime
    let lo = 0,
      hi = frames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (frames[mid].timestamp <= currentTime) lo = mid;
      else hi = mid - 1;
    }
    currentFrameIdxRef.current = lo;

    return {
      current: frames[lo],
      next: frames[lo < frames.length - 1 ? lo + 1 : lo],
    };
  }, [currentTime, loadedChunks.size]);

  const currentFrame = frameData.current;
  const nextFrame = frameData.next;

  // --- Playback Engine ---
  const tick = useCallback(
    (now: number) => {
      if (!isPlaying) return;

      const delta = (now - lastTickRef.current) / 1000; // seconds elapsed
      lastTickRef.current = now;

      if (delta > 0 && delta < 1) {
        // Guard against large jumps
        const frames = allFramesRef.current;
        const maxTime = frames.length ? frames[frames.length - 1].timestamp : 0;

        setCurrentTime((prev) => {
          const next = prev + delta * playbackSpeed;
          if (next >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return next;
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    },
    [isPlaying, playbackSpeed]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, tick]);

  // --- Controls ---
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleTogglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  const handleSeek = useCallback((time: number) => {
    const frames = allFramesRef.current;
    const maxTime = frames.length ? frames[frames.length - 1].timestamp : 0;
    setCurrentTime(Math.max(0, Math.min(time, maxTime)));
  }, []);

  const handleSkip = useCallback(
    (seconds: number) => {
      handleSeek(currentTime + seconds);
    },
    [currentTime, handleSeek]
  );

  const handleLapJump = useCallback((targetLap: number) => {
    const frames = allFramesRef.current;
    const frame = frames.find((f) => f.lap >= targetLap);
    if (frame) setCurrentTime(frame.timestamp);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(e.shiftKey ? 30 : 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(e.shiftKey ? -30 : -5);
          break;
        case 'f':
          handleFullscreen();
          break;
        case 'j':
          handleSkip(-10);
          break;
        case 'l':
          handleSkip(10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleSkip, handleFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // --- Loading States ---
  if (metaLoading) {
    return <ReplayLoader message="Loading session data..." progress={0} />;
  }

  if (metaError || !metadata) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-red-400">
        <div className="text-center">
          <div className="text-lg font-mono mb-2">REPLAY UNAVAILABLE</div>
          <div className="text-sm text-gray-500">
            {metaError instanceof Error ? metaError.message : 'Failed to load replay data'}
          </div>
        </div>
      </div>
    );
  }

  const totalChunks = metadata.chunk_manifest.length;
  const chunksLoaded = loadedChunks.size;
  const hasFrames = allFramesRef.current.length > 0;

  if (!hasFrames) {
    return (
      <ReplayLoader
        message={loadingChunk ? 'Loading replay data...' : 'Processing...'}
        progress={totalChunks > 0 ? (chunksLoaded / totalChunks) * 100 : 0}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-[#0a0a0a] overflow-hidden ${isFullscreen ? 'h-screen' : 'h-full'} ${className}`}
    >
      {/* Main Content: Track + Leaderboard side-by-side */}
      <div className="flex-1 flex min-h-0">
        {/* Track Canvas */}
        <div className="flex-1 relative min-w-0 overflow-hidden">
          <TrackCanvas
            track={metadata.track}
            currentFrame={currentFrame}
            nextFrame={nextFrame}
            currentTime={currentTime}
            driverColors={metadata.driver_colors}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
          />

          {/* Weather Widget - top-right overlay */}
          {currentFrame?.weather && (
            <div className="absolute top-3 right-3 z-10">
              <WeatherWidget weather={currentFrame.weather} />
            </div>
          )}

          {/* Race Control Messages - bottom-right overlay */}
          <div className="absolute bottom-16 right-3 z-10">
            <RaceControlMessages frame={currentFrame} />
          </div>

          {/* Buffering indicator */}
          {loadingChunk && chunksLoaded < totalChunks && (
            <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-md border border-gray-700">
              <span className="text-xs font-mono text-gray-400">
                BUFFERING {chunksLoaded}/{totalChunks}
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <div className="w-[340px] flex-shrink-0 border-l border-gray-800 overflow-y-auto">
          <Leaderboard
            frame={currentFrame}
            driverInfo={metadata.drivers}
            driverColors={metadata.driver_colors}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
            isRace={metadata.session_info.is_race}
            year={year}
            currentLap={currentFrame?.lap}
            totalLaps={currentFrame?.total_laps ?? metadata.session_info.total_laps}
          />
        </div>
      </div>

      {/* Playback Controls - bottom bar */}
      <PlaybackControls
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        currentTime={currentTime}
        totalDuration={metadata.total_duration}
        trackStatus={currentFrame?.track_status ?? 'green'}
        isFullscreen={isFullscreen}
        onPlay={handlePlay}
        onPause={handlePause}
        onTogglePlay={handleTogglePlay}
        onSpeedChange={handleSpeedChange}
        onSeek={handleSeek}
        onSkip={handleSkip}
        onLapJump={handleLapJump}
        onFullscreen={handleFullscreen}
      />
    </div>
  );
}
