import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionReplayMetadata, SessionReplayData } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChunkLoader } from '@/hooks/useChunkLoader';
import { useReplayState } from '@/hooks/useReplayState';
import { useReplayData } from '@/hooks/useReplayData';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useCamera } from '@/hooks/useCamera';
import { useReplayWidgets, WidgetId } from '@/hooks/useReplayWidgets';
import {
  getSectorMarkers,
  getSpeedHeatmapSegments,
  getTrackStatusSegments,
  getTimeForLap,
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

function interpolateSeriesValue(timeline: number[], values: number[], time: number) {
  if (!timeline.length || !values.length) return 0;
  if (time <= timeline[0]) return values[0] ?? 0;
  const lastIndex = Math.min(timeline.length, values.length) - 1;
  if (time >= timeline[lastIndex]) return values[lastIndex] ?? 0;

  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const sampleTime = timeline[mid];

    if (sampleTime === time) return values[mid] ?? 0;
    if (sampleTime < time) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const prevIndex = Math.max(0, high);
  const nextIndex = Math.min(lastIndex, low);
  const prevTime = timeline[prevIndex];
  const nextTime = timeline[nextIndex];
  const prevValue = values[prevIndex] ?? 0;
  const nextValue = values[nextIndex] ?? prevValue;
  const alpha = nextTime === prevTime ? 0 : (time - prevTime) / (nextTime - prevTime);

  return prevValue + (nextValue - prevValue) * alpha;
}

function sampleRecentSeries(
  timeline: number[] | undefined,
  values: number[] | undefined,
  currentTime: number,
  durationSeconds = 6,
  sampleCount = 150
) {
  if (!timeline?.length || !values?.length) return [];

  const startTime = Math.max(timeline[0], currentTime - durationSeconds);
  const endTime = Math.min(currentTime, timeline[Math.min(timeline.length, values.length) - 1]);
  if (endTime <= startTime) return [interpolateSeriesValue(timeline, values, endTime)];

  return Array.from({ length: sampleCount }, (_, index) => {
    const alpha = sampleCount === 1 ? 1 : index / (sampleCount - 1);
    return interpolateSeriesValue(timeline, values, startTime + (endTime - startTime) * alpha);
  });
}

const normalizeBrakeValue = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 1 ? value * 100 : value;

const normalizeBrakeSeries = (values: number[] | undefined) =>
  values?.map((value) => normalizeBrakeValue(value)) ?? [];

function findSectorBoundaryTime(
  timeline: number[] | undefined,
  laps: number[] | undefined,
  relativeDistances: number[] | undefined,
  lap: number,
  boundary: number,
  fallbackTime: number
) {
  if (!timeline?.length || !laps?.length || !relativeDistances?.length) return fallbackTime;
  if (boundary <= 0) return fallbackTime;

  const limit = Math.min(timeline.length, laps.length, relativeDistances.length);
  for (let i = 1; i < limit; i++) {
    if (laps[i] !== lap) continue;

    const previousRel = laps[i - 1] === lap ? relativeDistances[i - 1] : 0;
    const currentRel = relativeDistances[i];
    if (previousRel <= boundary && currentRel >= boundary) {
      const span = currentRel - previousRel;
      const alpha = span === 0 ? 0 : (boundary - previousRel) / span;
      return timeline[i - 1] + (timeline[i] - timeline[i - 1]) * alpha;
    }
  }

  return fallbackTime;
}

const SessionReplay: React.FC<SessionReplayProps> = ({ year, event, session, className }) => {
  const { trackEvent, trackPageView } = useAnalytics();
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    trackPageView('session_replay', { year, event, session });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, event, session]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    document.addEventListener('fullscreenchange', updateViewportSize);

    return () => {
      window.removeEventListener('resize', updateViewportSize);
      document.removeEventListener('fullscreenchange', updateViewportSize);
    };
  }, []);

  const {
    data: metadata,
    isLoading: isMetaLoading,
    error: metaError,
  } = useQuery<SessionReplayData>({
    queryKey: ['sessionReplayMetadata', year, event, session, 'precision-v3'],
    queryFn: () => fetchSessionReplayMetadata(year, event, session),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

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
    showIntervals,
    setShowIntervals,
    dismissedMessages,
    reset: resetState,
    cycleSpeed,
    dismissMessage,
  } = useReplayState(0, () => {});

  const {
    replayData: data,
    loadedChunks,
    loadedDuration,
    isFullyLoaded,
    seekTo,
  } = useChunkLoader(metadata ?? null, year, event, session, currentTime);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    safeIndex,
    currentFrameDrivers,
    totalDuration,
    totalLaps: derivedTotalLaps,
    driverLapStartTimes,
    tyreAgeMap,
  } = useReplayData(data, currentTime);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const activeTotalDuration = useMemo(() => {
    const meta = metadata as SessionReplayMetadata | undefined;
    const manifest = meta?.chunk_manifest;
    return meta?.total_duration ?? manifest?.[manifest.length - 1]?.end ?? totalDuration;
  }, [metadata, totalDuration]);

  const totalLaps = useMemo(() => {
    const meta = metadata as SessionReplayMetadata | undefined;
    return meta?.total_laps ?? meta?.circuit_metadata?.total_laps ?? derivedTotalLaps;
  }, [metadata, derivedTotalLaps]);

  // Throttle seekTo to chunk-loader: only seek on significant jumps (user drag), not normal playback
  const prevSeekTimeRef = useRef(currentTime);
  useEffect(() => {
    const delta = Math.abs(currentTime - prevSeekTimeRef.current);
    if (delta > 3) {
      seekTo(currentTime);
    }
    prevSeekTimeRef.current = currentTime;
  }, [currentTime, seekTo]);

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

  const trackColorTimeline = useMemo(() => {
    if (!data?.race_control_messages?.length) return [];
    const segments: { start: number; end: number; color: string }[] = [];
    let currentColor = '#1a1a1e';
    let segStart = 0;

    for (const msg of data.race_control_messages) {
      const text = (msg.message + ' ' + (msg.flag || '')).toUpperCase();
      let newColor = currentColor;
      if (text.includes('RED FLAG') || text.includes('SUSPENDED')) {
        newColor = '#dc2626';
      } else if (text.includes('GREEN') || text.includes('CLEAR') || text.includes('RESUMED')) {
        newColor = '#1a1a1e';
      } else if (
        (text.includes('YELLOW') ||
          text.includes('SAFETY CAR') ||
          text.includes('VIRTUAL') ||
          /\bSC\b/.test(text)) &&
        !text.includes('INFRINGEMENT') &&
        !text.includes('PENALTY') &&
        !text.includes('INVESTIGATION') &&
        !text.includes('BLUE')
      ) {
        newColor = '#ca8a04';
      }

      if (newColor !== currentColor) {
        segments.push({ start: segStart, end: msg.time, color: currentColor });
        currentColor = newColor;
        segStart = msg.time;
      }
    }
    segments.push({ start: segStart, end: Infinity, color: currentColor });
    return segments;
  }, [data?.race_control_messages]);

  const trackColor = useMemo(() => {
    if (isQualifying && sessionTimeRemaining?.remaining === 0) return '#1a1a1e';
    for (let i = trackColorTimeline.length - 1; i >= 0; i--) {
      const seg = trackColorTimeline[i];
      if (currentTime >= seg.start && currentTime < seg.end) {
        return seg.color;
      }
    }
    return '#1a1a1e';
  }, [currentTime, trackColorTimeline, isQualifying, sessionTimeRemaining]);

  const sectorMarkers = useMemo(() => {
    if (!data?.circuit_points || !data?.circuit_distances) return [];
    return getSectorMarkers(data.circuit_points, data.circuit_distances);
  }, [data?.circuit_points, data?.circuit_distances]);

  const seekbarStatusSegments = useMemo(() => {
    if (!data?.track_statuses) return [];
    return getTrackStatusSegments(data.track_statuses, activeTotalDuration || 1);
  }, [data?.track_statuses, activeTotalDuration]);

  const availableLaps = useMemo(() => {
    if (totalLaps > 0) {
      return Array.from({ length: totalLaps }, (_, index) => index + 1);
    }

    const lapSet = new Set<number>();
    for (const lap of metadata?.completed_laps || []) {
      if (lap.lap > 0) lapSet.add(lap.lap);
    }
    return [...lapSet].sort((a, b) => a - b);
  }, [metadata?.completed_laps, totalLaps]);

  const getSeekTimeForLap = useCallback(
    (lap: number) => {
      const lapTimestamps = (metadata?.completed_laps || [])
        .filter((entry) => entry.lap === lap)
        .map((entry) => entry.timestamp);

      if (lapTimestamps.length > 0) {
        return Math.min(...lapTimestamps);
      }

      return data ? getTimeForLap(data.drivers, data.time, lap) : null;
    },
    [data, metadata?.completed_laps]
  );

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
        if (isPlayingRef.current) {
          setCurrentTime((prevTime) => {
            const newTime = prevTime + deltaTime * playbackSpeed;
            const playableTime = isFullyLoaded
              ? activeTotalDuration
              : Math.max(0, loadedDuration - 0.25);
            if (newTime >= playableTime && playableTime < activeTotalDuration) {
              setIsPlaying(false);
              return playableTime;
            }
            if (newTime >= activeTotalDuration) {
              setIsPlaying(false);
              return activeTotalDuration;
            }
            return newTime;
          });
        }
      }
      previousTimeRef.current = time;
      if (isPlayingRef.current) {
        requestRef.current = requestAnimationFrame(tick);
      } else {
        requestRef.current = null;
      }
    },
    [
      playbackSpeed,
      activeTotalDuration,
      loadedDuration,
      isFullyLoaded,
      setCurrentTime,
      setIsPlaying,
    ]
  );

  useEffect(() => {
    if (isPlaying) {
      previousTimeRef.current = null;
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

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

  const [speedHeatmapSegments, setSpeedHeatmapSegments] = useState<
    { path: string; color: string }[]
  >([]);
  const heatmapComputeIdRef = useRef(0);

  useEffect(() => {
    if (
      !showSpeedHeatmap ||
      !selectedDriver ||
      !data?.circuit_points ||
      !data?.drivers[selectedDriver]
    ) {
      setSpeedHeatmapSegments([]);
      return;
    }

    const id = ++heatmapComputeIdRef.current;
    const timer = setTimeout(() => {
      if (id !== heatmapComputeIdRef.current) return;
      const driverData = data.drivers[selectedDriver];
      const pathPoints = data.circuit_points;
      const speedArray: number[] = new Array(pathPoints.length).fill(0);
      const len = driverData.x.length;
      const sampleRange = Math.min(len, 25 * 120);
      const start = Math.max(0, safeIndex - sampleRange);
      const end = Math.min(len - 1, safeIndex);
      for (let i = start; i <= end; i++) {
        const px = driverData.x[i];
        const py = driverData.y[i];
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let j = 0; j < pathPoints.length; j += 3) {
          const dx = pathPoints[j][0] - px;
          const dy = pathPoints[j][1] - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDist) {
            bestDist = d2;
            bestIdx = j;
          }
        }
        speedArray[bestIdx] = driverData.speed[i];
      }
      setSpeedHeatmapSegments(getSpeedHeatmapSegments(pathPoints, speedArray, 350));
    }, 200);

    return () => clearTimeout(timer);
  }, [showSpeedHeatmap, selectedDriver, data, safeIndex]);

  const recentSpeedHistory = useMemo(() => {
    if (!selectedDriver) return [];
    return sampleRecentSeries(data?.time, data?.drivers?.[selectedDriver]?.speed, currentTime);
  }, [data, selectedDriver, currentTime]);

  const recentThrottleHistory = useMemo(() => {
    if (!selectedDriver) return [];
    return sampleRecentSeries(data?.time, data?.drivers?.[selectedDriver]?.throttle, currentTime);
  }, [data, selectedDriver, currentTime]);

  const recentBrakeHistory = useMemo(() => {
    if (!selectedDriver) return [];
    return normalizeBrakeSeries(
      sampleRecentSeries(data?.time, data?.drivers?.[selectedDriver]?.brake, currentTime)
    );
  }, [data, selectedDriver, currentTime]);

  const recentRpmHistory = useMemo(() => {
    if (!selectedDriver) return [];
    return sampleRecentSeries(data?.time, data?.drivers?.[selectedDriver]?.rpm, currentTime);
  }, [data, selectedDriver, currentTime]);

  const liveLapTime = useMemo(() => {
    if (!selectedDriver) return null;
    const driver = currentFrameDrivers[selectedDriver];
    if (!driver) return null;
    const lapStart = driverLapStartTimes[selectedDriver]?.[driver.lap];
    if (typeof lapStart !== 'number') return null;
    return Math.max(0, currentTime - lapStart);
  }, [currentFrameDrivers, currentTime, driverLapStartTimes, selectedDriver]);

  const liveSector = useMemo(() => {
    if (!selectedDriver || !data?.time) return null;
    const driver = currentFrameDrivers[selectedDriver];
    const driverData = data.drivers[selectedDriver];
    if (!driver || !driverData) return null;

    const lapStart = driverLapStartTimes[selectedDriver]?.[driver.lap];
    if (typeof lapStart !== 'number') return null;

    const relativeDistance = Number.isFinite(driver.rel_dist ?? NaN)
      ? Math.max(0, Math.min(0.999999, driver.rel_dist ?? 0))
      : 0;
    const label = relativeDistance < 1 / 3 ? 'S1' : relativeDistance < 2 / 3 ? 'S2' : 'S3';
    const boundary = label === 'S1' ? 0 : label === 'S2' ? 1 / 3 : 2 / 3;
    const sectorStart = findSectorBoundaryTime(
      data.time,
      driverData.lap,
      driverData.rel_dist,
      driver.lap,
      boundary,
      lapStart
    );

    return { label, time: Math.max(0, currentTime - sectorStart) };
  }, [currentFrameDrivers, currentTime, data, driverLapStartTimes, selectedDriver]);

  // Container size measurement for widget layout
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootRef]);

  const widgetBounds = useMemo(() => {
    const width = isFullscreen ? viewportSize.width : containerSize.width || 1200;
    const height = isFullscreen ? viewportSize.height : containerSize.height || 800;
    const padding = 8;
    const leaderboardWidth = isFullscreen && width >= 768 ? 256 : 0;
    return {
      minX: padding,
      minY: padding,
      maxX: Math.max(padding + 200, width - leaderboardWidth - padding),
      maxY: Math.max(padding + 120, height - padding),
    };
  }, [
    containerSize.height,
    containerSize.width,
    isFullscreen,
    viewportSize.height,
    viewportSize.width,
  ]);

  const { layouts, updateLayout } = useReplayWidgets(
    containerSize.width || 1200,
    containerSize.height || 800,
    widgetBounds
  );

  const selectedDriverFullData = useMemo(() => {
    if (!selectedDriver || !data?.drivers?.[selectedDriver]) return null;
    const d = data.drivers[selectedDriver];
    return {
      speed: d.speed,
      throttle: d.throttle,
      brake: normalizeBrakeSeries(d.brake),
      rpm: d.rpm,
      time: data.time || [],
    };
  }, [data, selectedDriver]);

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

  const visibleWidgetIds: { id: WidgetId; condition: boolean }[] = [
    { id: 'weather', condition: showWeather },
    { id: 'racecontrol', condition: showRaceControlFeed },
    { id: 'sectors', condition: showSectorTimes },
    { id: 'laphistory', condition: showLapHistory },
    { id: 'telemetry', condition: showTelemetry },
  ];

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'weather':
        return (
          <WeatherOverlay
            key={id}
            weather={data.weather}
            currentTime={currentTime}
            layout={layouts.weather}
            onUpdateLayout={(u) => updateLayout('weather', u)}
            bounds={widgetBounds}
            onClose={() => setShowWeather(false)}
          />
        );
      case 'racecontrol':
        return (
          <RaceControlFeed
            key={id}
            messages={data.race_control_messages}
            currentTime={currentTime}
            onSeek={(time) => setCurrentTime(time)}
            layout={layouts.racecontrol}
            onUpdateLayout={(u) => updateLayout('racecontrol', u)}
            bounds={widgetBounds}
            onClose={() => setShowRaceControlFeed(false)}
          />
        );
      case 'sectors':
        return (
          <SectorTimesPanel
            key={id}
            completedLaps={data.completed_laps}
            currentTime={currentTime}
            selectedDriver={selectedDriver}
            fastestSectors={data.fastest_sectors}
            liveSector={liveSector}
            layout={layouts.sectors}
            onUpdateLayout={(u) => updateLayout('sectors', u)}
            bounds={widgetBounds}
            onClose={() => setShowSectorTimes(false)}
          />
        );
      case 'laphistory':
        return (
          <LapHistoryPanel
            key={id}
            completedLaps={data.completed_laps}
            currentTime={currentTime}
            selectedDriver={selectedDriver}
            driverData={selectedDriverFullData}
            driverColor={selectedDriver ? data.driver_colors[selectedDriver] : undefined}
            onSeekToLap={(lap) => {
              const time = getSeekTimeForLap(lap);
              if (time !== null) setCurrentTime(time);
            }}
            layout={layouts.laphistory}
            onUpdateLayout={(u) => updateLayout('laphistory', u)}
            bounds={widgetBounds}
            onClose={() => setShowLapHistory(false)}
          />
        );
      case 'telemetry':
        return (
          <TelemetryOverlay
            key={id}
            driverCode={selectedDriver}
            telemetry={
              selectedDriver && currentFrameDrivers[selectedDriver]
                ? {
                    speed: currentFrameDrivers[selectedDriver].speed,
                    gear: currentFrameDrivers[selectedDriver].gear,
                    throttle: currentFrameDrivers[selectedDriver].throttle,
                    brake: normalizeBrakeValue(currentFrameDrivers[selectedDriver].brake),
                    drs: currentFrameDrivers[selectedDriver].drs,
                    rpm: currentFrameDrivers[selectedDriver].rpm,
                  }
                : null
            }
            driverColor={selectedDriver ? data.driver_colors[selectedDriver] : undefined}
            speedHistory={recentSpeedHistory}
            throttleHistory={recentThrottleHistory}
            brakeHistory={recentBrakeHistory}
            rpmHistory={recentRpmHistory}
            liveLapTime={liveLapTime}
            layout={layouts.telemetry}
            onUpdateLayout={(u) => updateLayout('telemetry', u)}
            bounds={widgetBounds}
            onClose={() => setShowTelemetry(false)}
          />
        );
    }

    return null;
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative flex flex-col bg-[#09090b] text-white overflow-hidden',
        isFullscreen
          ? 'h-screen w-screen'
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
            heatmapSegments={speedHeatmapSegments}
            sectorMarkers={sectorMarkers}
            driverArrays={driverArrays}
            safeIndex={safeIndex}
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

        {isFullscreen && (
          <>
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

            {isQualifying && sessionTimeRemaining && (
              <QualifyingCountdown
                remaining={sessionTimeRemaining.remaining}
                isRed={sessionTimeRemaining.isRed}
                formatted={sessionTimeRemaining.formatted}
                sessionName={session}
              />
            )}
          </>
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
          showIntervals={showIntervals}
          onToggleIntervals={() => setShowIntervals((v) => !v)}
          onSelectDriver={(code) => setSelectedDriver(code)}
          onFollow={follow}
        />
      </div>

      {isFullscreen && (
        <div className="absolute inset-0 z-[45] pointer-events-none">
          {visibleWidgetIds.map(({ id, condition }) => (condition ? renderWidget(id) : null))}
        </div>
      )}

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
        activeTotalDuration={activeTotalDuration}
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
          const time = getSeekTimeForLap(lap);
          if (time !== null) setCurrentTime(time);
        }}
      />
    </div>
  );
};

export { SessionReplay };
export default SessionReplay;
