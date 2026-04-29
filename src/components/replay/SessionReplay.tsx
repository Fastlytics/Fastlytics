import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionReplayMetadata, SessionReplayData } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChunkLoader } from '@/hooks/useChunkLoader';
import { useReplayState } from '@/hooks/useReplayState';
import { useReplayData } from '@/hooks/useReplayData';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useCamera } from '@/hooks/useCamera';
import {
  getSectorMarkers,
  getTrackStatusSegments,
  getTimeForLap,
  getAllLapNumbers,
} from './replay-utils';

import ReplayLoader from './ReplayLoader';
import PlaybackControls from './PlaybackControls';
import RaceControlToasts from './RaceControlToasts';
import RaceControlFeed from './RaceControlFeed';
import Leaderboard from './Leaderboard';
import TrackCanvas from './TrackCanvas';
import WeatherOverlay from './WeatherOverlay';
import SectorTimesPanel from './SectorTimesPanel';
import QualifyingCountdown from './QualifyingCountdown';
import TelemetryOverlay from './TelemetryOverlay';
import LapHistoryPanel from './LapHistoryPanel';
import ReplayToolbar from './ReplayToolbar';
import { Play, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionReplayProps {
  year: number;
  event: string;
  session: string;
  className?: string;
}

interface SessionReplayMetadata extends SessionReplayData {
  chunk_manifest?: { id: number; start: number; end: number }[];
  total_duration?: number;
}

const SessionReplay: React.FC<SessionReplayProps> = ({ year, event, session, className }) => {
  const { trackEvent, trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('session_replay', { year, event, session });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, event, session]);

  const {
    data: metadata,
    isLoading: isMetaLoading,
    error: metaError,
  } = useQuery<SessionReplayData>({
    queryKey: ['sessionReplayMetadata', year, event, session],
    queryFn: () => fetchSessionReplayMetadata(year, event, session),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  const { replayData: data, loadedChunks } = useChunkLoader(metadata ?? null, year, event, session);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    setIsPlaying,
    hasStarted,
    setHasStarted,
    playbackSpeed,
    currentTime,
    setCurrentTime,
    selectedDriver,
    setSelectedDriver,
    showSpeedHeatmap,
    setShowSpeedHeatmap,
    showWeather,
    setShowWeather,
    showRaceControlFeed,
    setShowRaceControlFeed,
    showSectorTimes,
    setShowSectorTimes,
    showTelemetry,
    setShowTelemetry,
    showLapHistory,
    setShowLapHistory,
    dismissedMessages,
    reset: resetState,
    cycleSpeed,
    dismissMessage,
  } = useReplayState(0, () => {});

  const { safeIndex, currentFrameDrivers, totalDuration, totalLaps, tyreAgeMap } = useReplayData(
    data,
    currentTime
  );

  const { leaderboardOrder, leaderboard, driverVisuals } = useLeaderboard(
    data,
    currentFrameDrivers,
    session === 'Race' || session === 'R',
    isPlaying,
    currentTime
  );

  const {
    viewState,
    isFullscreen,
    rootRef,
    toggleFullscreen,
    follow,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCamera(
    containerRef,
    currentFrameDrivers,
    selectedDriver,
    leaderboardOrder,
    true,
    () => {},
    isMetaLoading || !data
  );

  useEffect(() => {
    resetState();
  }, [year, event, session, resetState]);

  const isRace = session === 'Race' || session === 'R';
  const isQualifying = useMemo(() => {
    const s = session.toUpperCase();
    return s.includes('Q') || s.includes('QUALIFYING');
  }, [session]);

  const sessionTimeRemaining = useMemo(() => {
    if (!data || isRace) return null;
    const s = session.toUpperCase();
    const durationMap: Record<string, number> = {
      Q1: 18 * 60,
      Q2: 15 * 60,
      Q3: 12 * 60,
      SQ1: 12 * 60,
      SQ2: 10 * 60,
      SQ3: 8 * 60,
    };
    const duration = durationMap[s];
    if (!duration) return null;

    let lostTime = 0;
    let isRedFlagActive = false;
    const statuses = data.track_statuses || [];

    for (const status of statuses) {
      if (status.status === '5' || status.status === 'Red') {
        const sStart = status.start_time;
        const sEnd = status.end_time || 999999;
        if (sEnd <= 0) continue;
        const clampedStart = Math.max(0, sStart);
        const clampedEnd = Math.max(0, sEnd);
        if (clampedStart > currentTime) continue;
        if (currentTime >= clampedEnd) {
          lostTime += clampedEnd - clampedStart;
        } else {
          lostTime += currentTime - clampedStart;
          isRedFlagActive = true;
        }
      }
    }

    const effectiveElapsed = currentTime - lostTime;
    const remaining = Math.max(0, duration - effectiveElapsed);
    return {
      remaining,
      isRed: isRedFlagActive,
      formatted:
        remaining === 0
          ? '00:00'
          : `${Math.floor(remaining / 60)
              .toString()
              .padStart(2, '0')}:${(Math.floor(remaining) % 60).toString().padStart(2, '0')}`,
    };
  }, [isRace, session, data, currentTime]);

  const trackColor = useMemo(() => {
    if (!data?.race_control_messages) return '#1a1a1e';
    if (isQualifying && sessionTimeRemaining?.remaining === 0) return '#1a1a1e';

    for (let i = data.race_control_messages.length - 1; i >= 0; i--) {
      const msg = data.race_control_messages[i];
      if (msg.time > currentTime) continue;
      const text = (msg.message + ' ' + (msg.flag || '')).toUpperCase();
      if (text.includes('RED FLAG') || text.includes('SUSPENDED')) {
        if (isQualifying && sessionTimeRemaining?.remaining === 0) return '#1a1a1e';
        return '#dc2626';
      }
      if (text.includes('GREEN') || text.includes('CLEAR') || text.includes('RESUMED'))
        return '#1a1a1e';
      if (
        (text.includes('YELLOW') ||
          text.includes('SAFETY CAR') ||
          text.includes('VIRTUAL') ||
          /\bSC\b/.test(text)) &&
        !text.includes('INFRINGEMENT') &&
        !text.includes('PENALTY') &&
        !text.includes('INVESTIGATION') &&
        !text.includes('BLUE')
      ) {
        return '#ca8a04';
      }
    }
    return '#1a1a1e';
  }, [currentTime, data, isQualifying, sessionTimeRemaining]);

  const sectorMarkers = useMemo(() => {
    if (!data?.circuit_points || !data?.circuit_distances) return [];
    return getSectorMarkers(data.circuit_points, data.circuit_distances);
  }, [data?.circuit_points, data?.circuit_distances]);

  const seekbarStatusSegments = useMemo(() => {
    if (!data?.track_statuses) return [];
    return getTrackStatusSegments(data.track_statuses, totalDuration || 1);
  }, [data?.track_statuses, totalDuration]);

  const availableLaps = useMemo(() => {
    if (!data?.drivers) return [];
    return getAllLapNumbers(data.drivers);
  }, [data?.drivers]);

  const currentLap = useMemo(() => {
    const code = selectedDriver || leaderboard[0]?.code;
    if (!code) return 0;
    return currentFrameDrivers[code]?.lap || 0;
  }, [selectedDriver, leaderboard, currentFrameDrivers]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const animate = useCallback(
    function tick(time: number) {
      if (previousTimeRef.current !== null) {
        const deltaTime = (time - previousTimeRef.current) / 1000;
        if (isPlaying) {
          setCurrentTime((prevTime) => {
            const newTime = prevTime + deltaTime * playbackSpeed;
            if (newTime >= totalDuration) {
              setIsPlaying(false);
              return totalDuration;
            }
            return newTime;
          });
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(tick);
    },
    [isPlaying, playbackSpeed, totalDuration, setCurrentTime, setIsPlaying]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const handleDriverClick = useCallback(
    (code: string) => {
      setSelectedDriver(code === selectedDriver ? null : code);
    },
    [selectedDriver, setSelectedDriver]
  );

  const driverArrays = useMemo(() => {
    if (!data?.drivers) return {};
    const result: Record<string, { x: number[]; y: number[] }> = {};
    for (const [code, d] of Object.entries(data.drivers)) {
      result[code] = { x: d.x, y: d.y };
    }
    return result;
  }, [data?.drivers]);

  const recentSpeedHistory = useMemo(() => {
    if (!selectedDriver || !data?.drivers?.[selectedDriver]?.speed) return [];
    const speedArray = data.drivers[selectedDriver].speed;
    const windowSize = 150; // 6 seconds at 25fps
    const start = Math.max(0, safeIndex - windowSize);
    return speedArray.slice(start, safeIndex + 1);
  }, [data, selectedDriver, safeIndex]);

  const isLoading = isMetaLoading || !data || loadedChunks.size === 0;

  if (isLoading) {
    return <ReplayLoader year={year} event={event} session={session} />;
  }
  if (metaError)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-400 text-[14px] font-medium">
        Error loading replay data.
      </div>
    );
  if (!data) return null;

  return (
    <div
      ref={rootRef}
      className={cn(
        'flex flex-col bg-[#09090b] text-white overflow-hidden',
        isFullscreen
          ? 'h-full'
          : 'w-full max-w-5xl mx-auto h-[calc(100vh-200px)] min-h-[400px] rounded-xl border border-white/[0.06] shadow-2xl'
      )}
    >
      <div className="flex flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden bg-[#0c0c0e] cursor-grab active:cursor-grabbing"
        >
          {isFullscreen && (
            <div className="absolute top-6 left-6 flex items-center gap-2 z-50 pointer-events-none select-none">
              <Gauge className="text-red-500" size={28} />
              <span className="text-xl font-bold tracking-tighter">Fastlytics</span>
            </div>
          )}

          <TrackCanvas
            circuitPoints={data.circuit_points || []}
            circuitLayout={data.circuit_layout}
            trackColor={trackColor}
            drivers={currentFrameDrivers}
            driverColors={data.driver_colors}
            driverNumbers={
              data.driver_info
                ? Object.fromEntries(
                    Object.entries(data.driver_info).map(([code, info]) => [code, info.number])
                  )
                : undefined
            }
            selectedDriver={selectedDriver}
            visibility={driverVisuals.visibility}
            viewState={viewState}
            showHeatmap={showSpeedHeatmap}
            sectorMarkers={sectorMarkers}
            safeIndex={safeIndex}
            driverArrays={driverArrays}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClickDriver={handleDriverClick}
          />
        </div>

        {isFullscreen && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-40 pointer-events-none select-none text-center">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">
              {event} &ldquo;{session}&rdquo;
            </h1>
          </div>
        )}

        <RaceControlToasts
          messages={data.race_control_messages}
          currentTime={currentTime}
          dismissedMessages={dismissedMessages}
          formatTime={formatTime}
          onDismiss={dismissMessage}
        />

        <ReplayToolbar
          toggles={{
            weather: showWeather,
            raceControl: showRaceControlFeed,
            sectors: showSectorTimes,
            telemetry: showTelemetry,
            lapHistory: showLapHistory,
            heatmap: showSpeedHeatmap,
          }}
          onToggle={{
            weather: () => setShowWeather((v) => !v),
            raceControl: () => setShowRaceControlFeed((v) => !v),
            sectors: () => setShowSectorTimes((v) => !v),
            telemetry: () => setShowTelemetry((v) => !v),
            lapHistory: () => setShowLapHistory((v) => !v),
            heatmap: () => setShowSpeedHeatmap((v) => !v),
          }}
        />

        {showWeather && <WeatherOverlay weather={data.weather} currentTime={currentTime} />}

        {showRaceControlFeed && (
          <RaceControlFeed
            messages={data.race_control_messages}
            currentTime={currentTime}
            formatTime={formatTime}
          />
        )}

        {isQualifying && sessionTimeRemaining && (
          <QualifyingCountdown
            remaining={sessionTimeRemaining.remaining}
            isRed={sessionTimeRemaining.isRed}
            formatted={sessionTimeRemaining.formatted}
            sessionName={session}
          />
        )}

        {showSectorTimes && (
          <SectorTimesPanel
            completedLaps={data.completed_laps}
            currentTime={currentTime}
            selectedDriver={selectedDriver}
            fastestSectors={data.fastest_sectors}
          />
        )}

        {showLapHistory && (
          <LapHistoryPanel
            completedLaps={data.completed_laps}
            currentTime={currentTime}
            selectedDriver={selectedDriver}
          />
        )}

        {showTelemetry && (
          <TelemetryOverlay
            driverCode={selectedDriver}
            telemetry={
              selectedDriver && currentFrameDrivers[selectedDriver]
                ? {
                    speed: currentFrameDrivers[selectedDriver].speed,
                    gear: currentFrameDrivers[selectedDriver].gear,
                    throttle: currentFrameDrivers[selectedDriver].throttle,
                    brake: currentFrameDrivers[selectedDriver].brake,
                    drs: currentFrameDrivers[selectedDriver].drs,
                    rpm: currentFrameDrivers[selectedDriver].rpm,
                  }
                : null
            }
            driverColor={selectedDriver ? data.driver_colors[selectedDriver] : undefined}
            speedHistory={recentSpeedHistory}
          />
        )}

        <Leaderboard
          leaderboard={leaderboard}
          selectedDriver={selectedDriver}
          driverVisuals={driverVisuals}
          isRace={isRace}
          isQualifying={isQualifying}
          currentTime={currentTime}
          totalLaps={totalLaps}
          year={year}
          sessionTimeRemaining={sessionTimeRemaining}
          pitIntervals={data.pit_intervals}
          circuitLength={data?.circuit_distances?.[data.circuit_distances.length - 1] || 5000}
          tyreAge={tyreAgeMap}
          onSelectDriver={(code) => setSelectedDriver(code)}
          onFollow={follow}
        />
      </div>

      {!hasStarted && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm transition-all duration-500">
          <button
            onClick={() => {
              setHasStarted(true);
              setIsPlaying(true);
              trackEvent('replay_started', { year, event, session });
            }}
            className="group relative flex items-center justify-center w-24 h-24 bg-red-600 hover:bg-red-500 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
          >
            <Play size={48} className="text-white fill-white ml-2" />
            <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 animate-pulse" />
          </button>
          <div className="absolute bottom-20 text-center">
            <p className="text-white font-bold text-lg tracking-widest uppercase drop-shadow-md">
              Start Replay
            </p>
          </div>
        </div>
      )}

      <PlaybackControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        playbackSpeed={playbackSpeed}
        activeTotalDuration={totalDuration}
        isFullscreen={isFullscreen}
        hasStarted={hasStarted}
        showSpeedHeatmap={showSpeedHeatmap}
        seekbarStatusSegments={seekbarStatusSegments}
        formatTime={formatTime}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onSeek={(time) => setCurrentTime(time)}
        onSpeedChange={cycleSpeed}
        onToggleFullscreen={toggleFullscreen}
        onToggleHeatmap={() => setShowSpeedHeatmap((v) => !v)}
        availableLaps={availableLaps}
        currentLap={currentLap}
        onSeekToLap={(lap) => {
          const time = getTimeForLap(data.drivers, data.time, lap);
          if (time !== null) setCurrentTime(time);
        }}
      />
    </div>
  );
};

export { SessionReplay };
export default SessionReplay;
