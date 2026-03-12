import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSessionReplayMetadata,
  fetchSessionReplayChunk,
  SessionReplayData,
  ReplayChunk,
  ReplayDriverData,
  ReplayDriversMap,
} from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';

import ReplayLoader from './ReplayLoader';
import PlaybackControls from './PlaybackControls';
import RaceControlMessages from './RaceControlMessages';
import Leaderboard from './Leaderboard';
import {
  getSectorMarkers,
  getTrailPoints,
  getSpeedHeatmapSegments,
  getTrackStatusSegments,
  getTyreAge,
  getTimeForLap,
  getAllLapNumbers,
} from './replay-utils';
import { getDriverImage } from '@/utils/imageMapping';
import {
  Play,
  Pause,
  FastForward,
  Rewind,
  Clock,
  X,
  Maximize,
  Minimize,
  Gauge,
  Flag,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  Zap,
  ZapOff,
  Info,
  Swords,
  Split,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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

interface DriverFrameState {
  code?: string;
  originalCode?: string;
  x: number;
  y: number;
  dist?: number;
  ref_dist: number;
  rel_dist?: number;
  speed: number;
  gear: number;
  drs: number;
  rpm: number;
  lap: number;
  tyre?: number;
  throttle: number;
  brake: number;
  track_index?: number;
  pos?: number;
  bestLap?: CompletedLapInfo;
  isGhost?: boolean;
  color?: string;
}

interface CompletedLapInfo {
  driver: string;
  lap: number;
  time_str: string;
  seconds: number;
  timestamp: number;
  compound: string;
}

const FPS = 25;

const getMessageConfig = (msg: { message: string; flag?: string }) => {
  const text = (msg.message + ' ' + (msg.flag || '')).toUpperCase();

  if (text.includes('RED FLAG') || text.includes('SUSPENDED')) {
    return {
      type: 'red',
      icon: Flag,
      color: 'text-red-500',
      border: 'border-red-600',
      bg: 'bg-red-950/90',
      fill: true,
    };
  }
  if (text.includes('GREEN') || text.includes('RESUMED') || text.includes('CLEAR')) {
    return {
      type: 'green',
      icon: Flag,
      color: 'text-green-500',
      border: 'border-green-500',
      bg: 'bg-green-950/90',
      fill: true,
    };
  }
  // Specific status messages (Prioritize over generic flags)
  if (text.includes('PENALTY')) {
    return {
      type: 'penalty',
      icon: AlertCircle,
      color: 'text-orange-500',
      border: 'border-orange-500',
      bg: 'bg-orange-950/90',
      fill: false,
    };
  }
  if (text.includes('NO INVESTIGATION')) {
    return {
      type: 'info',
      icon: CheckCircle,
      color: 'text-green-400',
      border: 'border-green-500',
      bg: 'bg-gray-900/90',
      fill: false,
    };
  }
  if (
    text.includes('INVESTIGATION') ||
    text.includes('NOTED') ||
    text.includes('INCIDENT') ||
    text.includes('INFRINGEMENT')
  ) {
    return {
      type: 'investigation',
      icon: Search,
      color: 'text-indigo-400',
      border: 'border-indigo-500',
      bg: 'bg-indigo-950/90',
      fill: false,
    };
  }
  // Track Status Flags
  if (
    text.includes('YELLOW') ||
    text.includes('SAFETY CAR') ||
    /\bSC\b/.test(text) ||
    text.includes('VSC')
  ) {
    return {
      type: 'yellow',
      icon: AlertTriangle,
      color: 'text-yellow-400',
      border: 'border-yellow-500',
      bg: 'bg-yellow-950/90',
      fill: false,
    };
  }
  if (text.includes('BLUE')) {
    return {
      type: 'blue',
      icon: Flag,
      color: 'text-blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-950/90',
      fill: true,
    };
  }
  if (text.includes('DRS ENABLED')) {
    return {
      type: 'drs',
      icon: Zap,
      color: 'text-green-400',
      border: 'border-green-500',
      bg: 'bg-gray-900/90',
      fill: true,
    };
  }
  if (text.includes('DRS DISABLED')) {
    return {
      type: 'drs',
      icon: ZapOff,
      color: 'text-red-400',
      border: 'border-red-500',
      bg: 'bg-gray-900/90',
      fill: false,
    };
  }
  if (text.includes('CHEQUERED')) {
    return {
      type: 'finish',
      icon: Flag,
      color: 'text-white',
      border: 'border-white',
      bg: 'bg-black/90',
      fill: false,
    };
  }

  return {
    type: 'other',
    icon: Info,
    color: 'text-gray-400',
    border: 'border-gray-600',
    bg: 'bg-gray-900/90',
    fill: false,
  };
};

const SessionReplay: React.FC<SessionReplayProps> = ({ year, event, session, className }) => {
  const { trackEvent, trackPageView } = useAnalytics();

  // Track page view on mount
  useEffect(() => {
    trackPageView('session_replay', { year, event, session });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, event, session]);

  // --- Progressive Loading State ---
  const {
    data: metadata,
    isLoading: isMetaLoading,
    error: metaError,
  } = useQuery<SessionReplayData>({
    queryKey: ['sessionReplayMetadata', year, event, session],
    queryFn: () => fetchSessionReplayMetadata(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
  });

  const [replayData, setReplayData] = useState<SessionReplayData | null>(null);
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set());
  const [totalChunks, setTotalChunks] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  // Playback State (Moved Up)
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showSpeedHeatmap, setShowSpeedHeatmap] = useState(false);
  const [leaderboardOrder, setLeaderboardOrder] = useState<string[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

  // Seekbar Hover State
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number | null>(null);

  // Reset State on Session Change
  useEffect(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setReplayData(null);
    setLoadedChunks(new Set());
    setTotalChunks(0);
    setSelectedDriver(null);
    setLeaderboardOrder([]);
    setDismissedMessages(new Set());
  }, [year, event, session]);

  // Initial Data Construction from Metadata
  useEffect(() => {
    if (metadata) {
      const initDrivers: Record<string, ReplayDriverData> = {};
      // Initialize empty arrays for all drivers found in colors map
      // We use driver_colors keys as source of truth for driver list
      if (metadata.driver_colors) {
        Object.keys(metadata.driver_colors).forEach((d) => {
          initDrivers[d] = {
            x: [],
            y: [],
            dist: [],
            rel_dist: [],
            speed: [],
            gear: [],
            drs: [],
            rpm: [],
            lap: [],
            tyre: [],
            throttle: [],
            brake: [],
          };
        });
      }

      // Construct initial base (metadata + empty arrays)
      // We must cast because metadata doesn't have 'time' or 'drivers' technically if fetched from new endpoint
      const baseValues: SessionReplayData = {
        ...metadata,
        time: [],
        drivers: initDrivers,
      };

      setReplayData(baseValues);

      // Check manifest
      const metadataExt = metadata as SessionReplayMetadata;
      const manifest = metadataExt.chunk_manifest || [];
      setTotalChunks(manifest.length);
      setLoadedChunks(new Set());
    }
  }, [metadata]);

  // Chunk Fetching Loop
  useEffect(() => {
    if (!metadata || !replayData || totalChunks === 0) return;

    const fetchNextChunk = async () => {
      const nextChunkId = loadedChunks.size;
      if (nextChunkId >= totalChunks) return;

      // Don't fetch if already fetching?
      // Pure useEffect dependency chain works but better to have a ref to prevent double-fetch?
      // Actually, useEffect runs when loadedChunks changes.

      try {
        const chunk = await fetchSessionReplayChunk(year, event, session, nextChunkId);

        setReplayData((prev) => {
          if (!prev) return null;

          // MERGE Logic
          const newTime = prev.time.concat(chunk.time);
          const newDrivers = { ...prev.drivers };

          for (const [dCode, dData] of Object.entries(chunk.drivers)) {
            if (!newDrivers[dCode]) {
              // Should be initialized, but just in case
              newDrivers[dCode] = { ...dData };
            } else {
              // Append arrays
              const curr = newDrivers[dCode];
              newDrivers[dCode] = {
                x: curr.x.concat(dData.x),
                y: curr.y.concat(dData.y),
                dist: curr.dist.concat(dData.dist),
                rel_dist: curr.rel_dist.concat(dData.rel_dist),
                speed: curr.speed.concat(dData.speed),
                gear: curr.gear.concat(dData.gear),
                drs: curr.drs.concat(dData.drs),
                rpm: curr.rpm.concat(dData.rpm),
                lap: curr.lap.concat(dData.lap),
                tyre: curr.tyre.concat(dData.tyre),
                throttle: curr.throttle.concat(dData.throttle),
                brake: curr.brake.concat(dData.brake),
              };
            }
          }

          return {
            ...prev,
            time: newTime,
            drivers: newDrivers,
          };
        });

        setLoadedChunks((prev) => {
          const next = new Set(prev);
          next.add(nextChunkId);
          return next;
        });
      } catch (e) {
        console.error(`Error loading chunk ${nextChunkId}`, e);
        // Retry logic? For now just stop or retry after delay?
        // Simple: just return, creates a stall.
      }
    };

    // Fetch strictly sequential
    fetchNextChunk();
  }, [metadata, totalChunks, loadedChunks.size, event, replayData, session, year]); // Depend on size to trigger next

  // Derived State for UI
  const data = replayData;
  const isLoading = isMetaLoading || !replayData || loadedChunks.size === 0; // Wait for at least chunk 0
  const error = metaError;

  // Buffering Check
  useEffect(() => {
    if (!data || isLoading) return;
    // If current time is close to end of data AND we are not fully loaded...
    const bufferWindow = 10; // 10 seconds ahead
    // We know the total duration from metadata (hopefully)
    // If metadata has total_duration use it, else fallback
    const metadataExt = metadata as SessionReplayMetadata | undefined;
    const totalDur = metadataExt?.total_duration || 9999;
    const loadedDur = data.time[data.time.length - 1] || 0;

    if (isPlaying && currentTime + bufferWindow > loadedDur && loadedChunks.size < totalChunks) {
      setIsBuffering(true);
      setIsPlaying(false); // Auto-pause
    } else {
      setIsBuffering(false);
    }
  }, [currentTime, data, isPlaying, loadedChunks.size, totalChunks, isLoading, metadata]);

  // --- Ghost Mode State ---
  const [replayMode, setReplayMode] = useState<'session' | 'ghost'>('session');
  const [ghostConfig, setGhostConfig] = useState<{
    d1: string | null;
    l1: number | null;
    d2: string | null;
    l2: number | null;
  }>({ d1: null, l1: null, d2: null, l2: null });

  // Draggable Overlay State
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(null);
  const [ghostPos1, setGhostPos1] = useState<{ x: number; y: number } | null>(null);
  const [ghostPos2, setGhostPos2] = useState<{ x: number; y: number } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGhostConfigOpen, setIsGhostConfigOpen] = useState(true);

  // --- Refs ---
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Find absolute bounds for slider
  // Find absolute bounds for slider
  const { totalDuration, totalLaps } = useMemo(() => {
    if (!data?.time?.length) return { totalDuration: 0, totalLaps: 0 };

    const maxTime = data.time[data.time.length - 1];

    // Calculate Total Laps from data
    let maxLap = 0;
    if (data.drivers) {
      for (const d of Object.values(data.drivers)) {
        if (d.lap && d.lap.length > 0) {
          // Arrays can be very large causing stack overflow with Math.max(...)
          // Since lap data is monotonic (increasing), just check the last element
          const lastLap = d.lap[d.lap.length - 1];
          if (lastLap > maxLap) maxLap = lastLap;
        }
      }
    }
    return { totalDuration: maxTime, totalLaps: maxLap };
  }, [data]);

  // --- Ghost Mode Duration ---
  const ghostDuration = useMemo(() => {
    if (!data || !ghostConfig.d1 || !ghostConfig.l1 || !ghostConfig.d2 || !ghostConfig.l2) return 0;

    // Helper to get lap duration
    const getLapDuration = (d: string, l: number) => {
      const lap = data.completed_laps.find((cL) => cL.driver === d && cL.lap === l);
      return lap ? lap.seconds : 0;
    };

    const t1 = getLapDuration(ghostConfig.d1, ghostConfig.l1);
    const t2 = getLapDuration(ghostConfig.d2, ghostConfig.l2);
    return Math.max(t1, t2);
  }, [data, ghostConfig]);

  // Effective Max Duration based on Mode
  const activeTotalDuration = replayMode === 'session' ? totalDuration : ghostDuration;

  // --- Zoom & Pan State ---
  const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true); // Default to following (Leader)
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for accessing state in closures (event listeners / animation loop)
  const isFollowingRef = useRef(true);
  const viewStateRef = useRef({ scale: 1, x: 0, y: 0 }); // To avoid layout thrashing dependency loops
  const selectedDriverRef = useRef<string | null>(null);
  const leaderboardOrderRef = useRef<string[]>([]);

  // Sync refs
  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);
  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);
  useEffect(() => {
    selectedDriverRef.current = selectedDriver;
  }, [selectedDriver]);
  useEffect(() => {
    leaderboardOrderRef.current = leaderboardOrder;
  }, [leaderboardOrder]);

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!rootRef.current) return;
    const entering = !document.fullscreenElement;
    trackEvent('replay_fullscreen_toggled', { entering, year, event, session });

    if (entering) {
      rootRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // --- Drag Logic for Overlay ---
  useEffect(() => {
    if (activeDragId) {
      const handleGlobalMove = (e: MouseEvent) => {
        const newPos = {
          x: e.clientX - dragOffsetRef.current.x,
          y: e.clientY - dragOffsetRef.current.y,
        };
        if (activeDragId === 'main') setOverlayPos(newPos);
        else if (activeDragId === 'ghost1') setGhostPos1(newPos);
        else if (activeDragId === 'ghost2') setGhostPos2(newPos);
      };

      const handleGlobalUp = () => {
        setActiveDragId(null);
      };

      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalUp);
      };
    }
  }, [activeDragId]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if active element is an input (e.g. slider, though slider usually handles arrows natively, we might want custom seek)
      // But for the range slider, let's let it handle arrows if focused?
      // Actually, global hotkeys usually override unless focusing a text input.
      // Our slider is type="range".

      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return; // Ignore text inputs
      if (e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'k': // YouTube style
        case 'K':
          e.preventDefault(); // Prevent scroll
          setIsPlaying((prev) => !prev);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'ArrowLeft':
        case 'j': // YouTube style (10s usually, but uniform 5s here)
        case 'J':
          e.preventDefault();
          setCurrentTime((prev) => Math.max(0, prev - 5));
          break;
        case 'ArrowRight':
        case 'l': // YouTube style
        case 'L':
          e.preventDefault();
          setCurrentTime((prev) => Math.min(totalDuration, prev + 5));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTotalDuration, totalDuration]); // toggleFullscreen is stable/closure safe? toggleFullscreen uses refs so it's safe.

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setIsFollowing(false); // User wants to manually pan
    setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    setViewState((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Playback Loop
  const animate = useCallback(
    function tick(time: number) {
      if (previousTimeRef.current !== null) {
        const deltaTime = (time - previousTimeRef.current) / 1000; // ms to s

        if (isPlaying) {
          setCurrentTime((prevTime) => {
            const newTime = prevTime + deltaTime * playbackSpeed;
            if (newTime >= activeTotalDuration) {
              setIsPlaying(false);
              return activeTotalDuration;
            }
            return newTime;
          });
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(tick);
    },
    [isPlaying, playbackSpeed, activeTotalDuration]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed, activeTotalDuration, animate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const scaleSensitivity = 0.001;
      const delta = -e.deltaY * scaleSensitivity;
      // Use functional update to avoid stale state in closure if we didn't use refs,
      // but here we can just assume access to current state if we depend on it,
      // OR better yet, use functional state update for setViewState
      // However, inside this native listener, 'viewState' from closure will be STALE unless we include it in dependency array.
      // But if we include it in dependency array, we re-bind listener every frame = bad performance.
      // Solution: Use a ref for viewState or functional update entirely.

      setViewState((prev) => {
        const newScale = Math.min(Math.max(1, prev.scale + delta * prev.scale), 20);

        if (isFollowingRef.current) {
          // Zoom to center (Driver)
          // We don't need to weird math here, just update scale.
          // The Follow Logic in the effect will handle centering on next tick.
          // BUT for smoothness, we can try to re-center immediately if we have data.
          // Actually, let's just update scale and X/Y will be corrected by the Follow Effect almost instantly.
          // To prevent jumpiness, we keep the center point stable relative to screen center?
          // Actually if we just return X/Y unchanged, the next 'follow' tick will snap it.
          // Let's try just updating scale.
          return { ...prev, scale: newScale };
        }

        // Free Mode: Zoom to mouse
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const contentX = (mouseX - prev.x) / prev.scale;
        const contentY = (mouseY - prev.y) / prev.scale;

        const newX = mouseX - contentX * newScale;
        const newY = mouseY - contentY * newScale;

        return {
          scale: newScale,
          x: newX,
          y: newY,
        };
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [isLoading]); // Re-attach when loading finishes and ref is available

  const currentFrameIndex = Math.floor(currentTime * FPS);
  // Ensure index is within bounds
  const safeIndex = Math.min(Math.max(0, currentFrameIndex), (data?.time?.length || 1) - 1);

  // Optimization: Cache last known path index for each driver to speed up search
  const lastTrackIndices = useRef<Record<string, number>>({});

  // --- Ghost Mode: Pre-calculate Lap Start Indices ---
  const driverLapStartIndices = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Record<number, number>> = {};

    for (const [code, d] of Object.entries(data.drivers)) {
      map[code] = {};
      if (d.lap) {
        let currentLap = -1000;
        // Find start index of each lap
        for (let i = 0; i < d.lap.length; i++) {
          const l = d.lap[i];
          if (l !== currentLap) {
            if (map[code][l] === undefined) {
              map[code][l] = i;
            }
            currentLap = l;
          }
        }
      }
    }
    return map;
  }, [data]);

  // Helper: Find nearest point index on the circuit path
  const getTrackIndex = (code: string, x: number, y: number, points: number[][]) => {
    if (!points || points.length === 0) return 0;

    // Start search from last known index or 0
    const startIdx = lastTrackIndices.current[code] || 0;
    const searchWindow = 500; // Look ahead/behind window (optimize for 60fps)

    let bestIdx = startIdx;
    let minDistSq = Infinity;

    const len = points.length;

    // Search in window around startIdx (accounting for wrap-around)
    // We actully primarily search FORWARD because cars move forward.
    // But we search a bit backward too just in case of jitter or visual interpolation lag.
    for (let offset = -50; offset < searchWindow; offset++) {
      let idx = startIdx + offset;
      // Handle wrapping
      if (idx < 0) idx += len;
      if (idx >= len) idx %= len;

      const px = points[idx][0];
      const py = points[idx][1];
      const dSq = (px - x) ** 2 + (py - y) ** 2;

      if (dSq < minDistSq) {
        minDistSq = dSq;
        bestIdx = idx;
      }
    }

    // Fallback: If distance is too large (e.g. jumped track or first load), global search?
    // For now, assume local search is good enough after first frame (or effectively standard sort).
    // Actually, for first frame 'startIdx' is 0, so we might need global search if window misses.
    // Let's do a global search if we haven't seen this driver before.
    if (lastTrackIndices.current[code] === undefined) {
      minDistSq = Infinity;
      for (let i = 0; i < len; i += 5) {
        // coarse search first?
        const px = points[i][0];
        const py = points[i][1];
        const dSq = (px - x) ** 2 + (py - y) ** 2;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestIdx = i;
        }
      }
    }

    lastTrackIndices.current[code] = bestIdx;
    return bestIdx;
  };

  // --- Ghost Mode: Frame Reconstruction ---
  // --- Ghost Mode: Frame Reconstruction ---
  // --- Ghost Mode: Frame Reconstruction ---
  const ghostFrameDrivers = useMemo(() => {
    if (replayMode !== 'ghost' || !data) return {};
    const { d1, l1, d2, l2 } = ghostConfig;
    if (!d1 || !l1 || !d2 || !l2) return {};

    const drivers: Record<string, DriverFrameState> = {};
    const pathPoints = data.circuit_points || [];
    const pathDists = data.circuit_distances || [];

    // Helper to extract driver state at time t relative to lap start
    const extractState = (dCode: string, lapNum: number, label: string) => {
      const startIdx = driverLapStartIndices[dCode]?.[lapNum];
      if (startIdx === undefined) return null;

      // Current frame index relative to lap start
      const offset = Math.floor(currentTime * FPS);
      const absIdx = startIdx + offset;

      // Check if we are still within THIS lap (or reasonable bound)
      // Simple check: if valid index
      const dData = data.drivers[dCode];
      if (!dData || absIdx >= dData.x.length) return null;

      // Verify lap number hasn't changed (driver finished lap)
      if (dData.lap[absIdx] !== lapNum) return null; // Finished lap

      const x = dData.x[absIdx];
      const y = dData.y[absIdx];

      // Recalculate track index for smooth visual (mostly for consistency)
      const trackIdx = getTrackIndex(label, x, y, pathPoints); // Use label (e.g. VER_GHOST) for cache key

      let refDist = 0;
      if (pathDists.length > 0 && trackIdx < pathDists.length) {
        refDist = pathDists[trackIdx];
      } else {
        refDist = dData.dist?.[absIdx] ?? 0;
      }

      return {
        code: label, // We rename them to display logic 'VER (L5)'? Or just keep code unique like 'VER_L5'
        originalCode: dCode, // Keep ref
        x,
        y,
        ref_dist: refDist, // NEW: Required for interval calc
        speed: dData.speed?.[absIdx] ?? 0,
        rpm: dData.rpm?.[absIdx] ?? 0,
        gear: dData.gear?.[absIdx] ?? 0,
        throttle: dData.throttle?.[absIdx] ?? 0,
        brake: dData.brake?.[absIdx] ?? 0,
        drs: dData.drs?.[absIdx] ?? 0,
        lap: lapNum,
        // Visuals
        color: data.driver_colors[dCode] || '#ffffff', // Use Team Color
      };
    };

    const c1 = extractState(d1, l1, d1); // Keep code as driver name for image lookup
    const c2 = extractState(d2, l2, d2);

    if (c1 && c2 && c1.color === c2.color) {
      c2.color = '#ffffff'; // Force second driver to white if same team
    }

    if (c1) drivers[d1 + '_GHOST'] = { ...c1, isGhost: true }; // Append suffix to avoid key collision if comparing same driver
    if (c2) drivers[d2 + '_GHOST'] = { ...c2, isGhost: true };

    return drivers;
  }, [replayMode, ghostConfig, currentTime, data, driverLapStartIndices]);

  // Reconstruct "Frame" view from Columnar data for easier rendering
  const currentFrameDrivers = useMemo(() => {
    if (!data) return {};
    const drivers: Record<string, DriverFrameState> = {};

    const pathPoints = data.circuit_points || [];
    const pathDists = data.circuit_distances || [];
    const pathLen = pathPoints.length;

    for (const [code, d] of Object.entries(data.drivers)) {
      // Access arrays at safeIndex
      const x = d.x[safeIndex];
      const y = d.y[safeIndex];

      // Calculate visual track position
      const trackIdx = getTrackIndex(code, x, y, pathPoints);

      // Calculate Standardized Distance (Reference Odometer)
      // If we have circuit_distances, use them. Otherwise fallback to raw.
      let refDist = 0;
      if (pathDists.length > 0 && trackIdx < pathDists.length) {
        refDist = pathDists[trackIdx];
      } else {
        refDist = d.dist[safeIndex]; // fallback
      }

      drivers[code] = {
        x,
        y,
        dist: d.dist[safeIndex], // Keep raw for debugging/telemetry
        ref_dist: refDist, // NEW: Normalized distance for intervals
        rel_dist: d.rel_dist[safeIndex],
        speed: d.speed?.[safeIndex] ?? 0,
        gear: d.gear?.[safeIndex] ?? 0,
        drs: d.drs?.[safeIndex] ?? 0,
        rpm: d.rpm?.[safeIndex] ?? 0,
        lap: d.lap?.[safeIndex] ?? 0,
        tyre: d.tyre?.[safeIndex] ?? 0,
        throttle: d.throttle?.[safeIndex] ?? 0,
        brake: d.brake?.[safeIndex] ?? 0,
        track_index: trackIdx,
      };
    }
    return drivers;
  }, [data, safeIndex]);

  // --- Active Drivers Source ---
  const activeDrivers = replayMode === 'ghost' ? ghostFrameDrivers : currentFrameDrivers;

  // --- Following Logic ---
  useEffect(() => {
    if (!isFollowing || !containerRef.current || !data || Object.keys(activeDrivers).length === 0) {
      return;
    }

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    let targetDriverCode = selectedDriverRef.current;

    // Ghost Mode Logic: Auto-select first ghost driver if nothing selected
    if (replayMode === 'ghost' && !targetDriverCode && ghostConfig.d1) {
      targetDriverCode = ghostConfig.d1 + '_GHOST';
    }

    if (!targetDriverCode && leaderboardOrderRef.current.length > 0) {
      targetDriverCode = leaderboardOrderRef.current[0]; // Follow leader if no driver selected
    }

    if (targetDriverCode) {
      const driver = activeDrivers[targetDriverCode];
      if (driver) {
        // Calculate correct transform considering SVG Aspect Ratio (xMidYMid meet)
        const VIEWBOX_WIDTH = 1000;
        const VIEWBOX_HEIGHT = 500;

        // Calculate how the SVG is scaled within the container
        const scaleX = width / VIEWBOX_WIDTH;
        const scaleY = height / VIEWBOX_HEIGHT;
        const fitScale = Math.min(scaleX, scaleY);

        // Calculate offsets (bars)
        const offsetX = (width - VIEWBOX_WIDTH * fitScale) / 2;
        const offsetY = (height - VIEWBOX_HEIGHT * fitScale) / 2;

        setViewState((prev) => {
          // Driver Position in Screen Pixels (at Zoom 1)
          // Visual position = Offset + (SVG_Coord * FitScale)
          const visualDriverX = offsetX + driver.x * fitScale;
          const visualDriverY = offsetY + driver.y * fitScale;

          // We want visualDriverX to be at Center (width/2)
          // Center = Translate + (VisualPos * ZoomScale)
          // Translate = Center - (VisualPos * ZoomScale)

          // Account for Leaderboard Overlay (w-64 = 256px) on Desktop (md: 768px)
          // We want to center in the *visible* area.
          // If desktop, visible width is (width - 256). Center is (width - 256) / 2.
          const leaderboardOffset = window.innerWidth >= 768 ? 256 : 0;
          const centerX = (width - leaderboardOffset) / 2;
          const centerY = height / 2;

          const newX = centerX - visualDriverX * prev.scale;
          const newY = centerY - visualDriverY * prev.scale;

          return {
            ...prev,
            x: newX,
            y: newY,
          };
        });
      }
    }
  }, [
    isFollowing,
    currentTime,
    selectedDriver,
    activeDrivers,
    data,
    leaderboardOrder,
    replayMode,
    ghostConfig,
  ]); // currentTime to trigger updates, selectedDriver/leaderboardOrder for target change

  // Helper: Calculate a sorting score (Lap takes precedence, then Visual Path Index)
  const getDriverScore = useCallback((d: DriverFrameState | null | undefined) => {
    if (!d) return -1;
    // visual sorting: Lap * totalPoints + trackIndex
    // data.circuit_points might not be available in closure if not passed, but we can assume nice range.
    // Using 1,000,000 as multiplier is safe as points < 1M.
    return d.lap * 1000000 + (d.track_index || 0);
  }, []);

  // Sort function for "Hard Sort" (Absolute distance)
  const getSortedOrder = useCallback(
    (currentDrivers: Record<string, DriverFrameState>) => {
      return Object.entries(currentDrivers)
        .sort(([, a], [, b]) => {
          // START FIX: Grid Position for < 200m
          if ((a.dist ?? 0) < 200 && (b.dist ?? 0) < 200) {
            const gA = data?.driver_grid_positions?.[a.code ?? ''] ?? 99;
            const gB = data?.driver_grid_positions?.[b.code ?? ''] ?? 99;
            return gA - gB;
          }
          return getDriverScore(b) - getDriverScore(a);
        })
        .map(([code]) => code);
    },
    [data?.driver_grid_positions, getDriverScore]
  );

  // --- Leaderboard Logic with Hysteresis ---
  useEffect(() => {
    if (!data) return;

    // Ghost Mode: Simple ordering (Driver 1 then Driver 2)
    if (replayMode === 'ghost') {
      const keys = Object.keys(activeDrivers);
      // Sort by our config order d1, d2
      const sorted = keys.sort((a, b) => {
        if (a.includes(ghostConfig.d1 || '')) return -1;
        return 1;
      });
      setLeaderboardOrder(sorted);
      return;
    }

    // If not playing (Seeking/Paused) or first load, do a Hard Sort
    if (!isPlaying || leaderboardOrder.length === 0) {
      const newOrder = getSortedOrder(activeDrivers);
      if (JSON.stringify(newOrder) !== JSON.stringify(leaderboardOrder)) {
        setLeaderboardOrder(newOrder);
      }
      return;
    }

    // --- HYSTERESIS SORT ---
    // While playing, we only swap if overtake is clearer (> 0.5m equivalent score)
    const OVERTAKE_THRESHOLD = 0.5; // meters

    const newOrder = [...leaderboardOrder];
    let swapped = false;

    // Bubble sort pass
    for (let i = 0; i < newOrder.length - 1; i++) {
      const driverA = newOrder[i]; // Currently Ahead
      const driverB = newOrder[i + 1]; // Currently Behind

      const dA = activeDrivers[driverA];
      const dB = activeDrivers[driverB];

      if (!dA || !dB) continue;

      // 1. Grid Logic (Start only)
      if (dA.dist < 200 && dB.dist < 200) {
        const gA = data?.driver_grid_positions?.[driverA] ?? 99;
        const gB = data?.driver_grid_positions?.[driverB] ?? 99;
        if (gB < gA) {
          // B should be ahead based on grid
          newOrder[i] = driverB;
          newOrder[i + 1] = driverA;
          swapped = true;
        }
        continue;
      }

      // 2. Race Logic
      // Swap if B's Score > A's Score + Threshold
      const scoreA = getDriverScore(dA);
      const scoreB = getDriverScore(dB);

      if (scoreB > scoreA + OVERTAKE_THRESHOLD) {
        newOrder[i] = driverB;
        newOrder[i + 1] = driverA;
        swapped = true;
      }
    }

    if (swapped) {
      setLeaderboardOrder(newOrder);
    }
  }, [
    activeDrivers,
    isPlaying,
    data,
    replayMode,
    ghostConfig,
    getSortedOrder,
    leaderboardOrder,
    getDriverScore,
  ]);

  // --- Session Logic (Race vs Qualy) ---
  const isRace = useMemo(() => {
    return session === 'Race' || session === 'R';
  }, [session]);

  const isQualifying = useMemo(() => {
    const s = session.toUpperCase();
    return s.includes('Q') || s.includes('QUALIFYING');
  }, [session]);

  // --- Qualifying Countdown Timer ---
  const sessionTimeRemaining = useMemo(() => {
    if (!data || isRace) return null;

    // 1. Determine Nominal Duration
    let duration = 0;
    const s = session.toUpperCase();
    if (s === 'Q1') duration = 18 * 60;
    else if (s === 'Q2') duration = 15 * 60;
    else if (s === 'Q3') duration = 12 * 60;
    else if (s === 'SQ1') duration = 12 * 60;
    else if (s === 'SQ2') duration = 10 * 60;
    else if (s === 'SQ3') duration = 8 * 60;
    else return null; // Practice or Unknown

    // 2. Adjust for Red Flags
    // We need to calculate how much time was LOST due to red flags UP TO currentTime.
    let lostTime = 0;
    let isRedFlagActive = false;

    // Ensure intervals are sorted
    /* Track Status Codes via FastF1: 
           '1': Green, '2': Yellow, '3': SC, '4': VSC, '5': Red, '6': Bat, '7': Null 
           In API response, we get objects with { status, start_time, end_time }
        */
    const statuses = data.track_statuses || [];

    for (const status of statuses) {
      if (status.status === '5' || status.status === 'Red') {
        const sStart = status.start_time;
        const sEnd = status.end_time || 999999;

        // Fix: Ignore Red Flags that happened entirely before the replay start (negative time)
        // And clamp partially overlapping ones to 0.
        if (sEnd <= 0) continue;

        const clampedStart = Math.max(0, sStart);
        const clampedEnd = Math.max(0, sEnd);

        // If red flag hasn't started yet relative to replay time, ignore
        if (clampedStart > currentTime) continue;

        if (currentTime >= clampedEnd) {
          // This red flag is fully in the past (within our timeline).
          lostTime += clampedEnd - clampedStart;
        } else {
          // We are currently INSIDE this red flag
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

  // --- Timing Standings (for Qualy/Practice) ---
  const timingStandings = useMemo(() => {
    if (isRace || !data?.completed_laps) return null;

    // 1. Filter laps completed so far
    const lapsSoFar = data.completed_laps.filter((l) => l.timestamp <= currentTime);

    // 2. Find Best Lap per Driver
    const bestLaps: Record<string, (typeof data.completed_laps)[0]> = {};
    for (const lap of lapsSoFar) {
      if (!bestLaps[lap.driver] || lap.seconds < bestLaps[lap.driver].seconds) {
        bestLaps[lap.driver] = lap;
      }
    }

    // 3. Sort Drivers
    // Get all drivers from data.drivers to ensure we show everyone even if no lap
    const allDrivers = Object.keys(data.drivers || {});

    // Sort: Drivers with time < Drivers without time
    // Then by time ASC
    const sorted = allDrivers.sort((a, b) => {
      const lapA = bestLaps[a];
      const lapB = bestLaps[b];

      if (lapA && lapB) return lapA.seconds - lapB.seconds;
      if (lapA) return -1; // A has time, comes first
      if (lapB) return 1; // B has time, comes first
      return a.localeCompare(b); // Alphabetical tie-break
    });

    return { sorted, bestLaps };
  }, [data, currentTime, isRace]);

  // --- Leaderboard Calculation ---
  const leaderboard = useMemo(() => {
    if (!data) return [];
    const drivers = activeDrivers;

    // Ghost Mode - Return simplified interaction
    if (replayMode === 'ghost') {
      return Object.entries(drivers)
        .sort(([, a], [, b]) => (b.ref_dist || 0) - (a.ref_dist || 0)) // Sort by distance descending
        .map(([k, d], i) => ({
          pos: i + 1,
          ...d,
          code: k, // Key is the ghost ID (e.g. VER_GHOST)
          grid: 0,
          color: d.color,
        }));
    }

    const items = Object.entries(drivers).map(([code, d]) => ({
      code,
      ...d,
      pos: 0, // calc below
      grid: data.driver_grid_positions?.[code] || 0,
      color: data.driver_colors[code] || 'white',
    }));

    if (isRace) {
      // --- RACE MODE: Sort by Track Position ---
      // Sort by Lap (desc) then specific RefDist/Dist (desc)
      // Use leaderboardOrder from hysteresis for race mode
      if (!leaderboardOrder.length) return []; // Should not happen if data is present

      const raceItems = leaderboardOrder
        .map((code, index) => {
          const d = activeDrivers[code];
          if (!d) return null;
          return {
            pos: index + 1,
            code,
            ...d,
            grid: data.driver_grid_positions?.[code] || 0,
            color: data.driver_colors[code] || '#fff',
            tyre: d.tyre,
          };
        })
        .filter((d) => d !== null);
      return raceItems;
    } else {
      // --- QUALY/PRACTICE MODE: Sort by Timing ---
      if (timingStandings) {
        const { sorted, bestLaps } = timingStandings;
        // Re-order items array to match 'sorted' list
        // Create lookup for efficiency
        const driverMap = new Map(items.map((i) => [i.code, i]));

        // Clear items and rebuild from sorted list
        const newItems: typeof items = [];
        sorted.forEach((code) => {
          const d = driverMap.get(code);
          if (d) {
            // Attach timing info for render
            d.bestLap = bestLaps[code];
            newItems.push(d);
          }
        });

        return newItems.map((d, i) => ({ ...d, pos: i + 1 }));
      }
    }

    return []; // Fallback if no data or timingStandings not ready
  }, [activeDrivers, data, isRace, timingStandings, leaderboardOrder, replayMode]);

  const driverNameMap: Record<string, string> = {};

  // Pre-calculate Lap Start Times for all drivers
  const driverLapStartTimes = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Record<number, number>> = {};

    for (const [code, d] of Object.entries(data.drivers)) {
      map[code] = {};
      let currentLap = -1;

      // Iterate through the lap array
      // d.lap is array of lap numbers corresponding to data.time
      if (d.lap && data.time) {
        for (let i = 0; i < d.lap.length; i++) {
          const lap = d.lap[i];
          if (lap !== currentLap) {
            // Lap changed (or started)
            // Only record the *first* time we see a new lap number
            if (map[code][lap] === undefined) {
              map[code][lap] = data.time[i];
            }
            currentLap = lap;
          }
        }
      }
    }
    return map;
  }, [data]);

  // Calculate Track Status Color
  const trackColor = useMemo(() => {
    if (!data?.race_control_messages) return '#1f2937';

    // Check for Qualifying End (Timer = 0) to prevent Red Track
    // If it's qualifying and time is up, we don't want red track even if there is a 'red flag' or 'suspended' message
    // that happened EXACTLY at 0:00 (which sometimes happens as session end).
    // BUT actually, user request was "dont make the track red after timer reaches zero".
    // The red track logic below checks for "RED FLAG" message.
    // Often Q sessions end with a Red Flag or just "Session Suspended" which triggers Red.

    // If session is qualifying and time is up, force default color ?
    // Or rather, if time is up, ignore "RED FLAG" status?
    if (isQualifying && sessionTimeRemaining?.remaining === 0) {
      return '#1f2937';
    }

    // Iterate backwards from current time to find last status update
    for (let i = data.race_control_messages.length - 1; i >= 0; i--) {
      const msg = data.race_control_messages[i];
      if (msg.time > currentTime) continue;

      const text = (msg.message + ' ' + (msg.flag || '')).toUpperCase();

      // Status Changes
      if (text.includes('RED FLAG') || text.includes('SUSPENDED')) {
        // Double check if we are in qualifying and time is up (redundant but safe)
        if (isQualifying && sessionTimeRemaining?.remaining === 0) return '#1f2937';
        return '#ef4444'; // Red
      }
      if (text.includes('GREEN') || text.includes('CLEAR') || text.includes('RESUMED'))
        return '#1f2937'; // Back to Normal

      // Yellow / SC / VSC
      // Exclude "INFRINGEMENT", "PENALTY", "INCIDENT" to avoid false positives from race control NOTIFICATIONS
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
        return '#eab308'; // Yellow
      }
    }

    return '#1f2937'; // Default
  }, [currentTime, data, isQualifying, sessionTimeRemaining]);

  // --- Feature 1: Sector Markers + Start/Finish Line ---
  const sectorMarkers = useMemo(() => {
    if (!data?.circuit_points || !data?.circuit_distances) return [];
    return getSectorMarkers(data.circuit_points, data.circuit_distances);
  }, [data?.circuit_points, data?.circuit_distances]);

  // --- Feature 3: Speed Heatmap Segments ---
  const speedHeatmapSegments = useMemo(() => {
    if (
      !showSpeedHeatmap ||
      !selectedDriver ||
      !data?.circuit_points ||
      !data?.drivers[selectedDriver]
    )
      return [];
    const driverData = data.drivers[selectedDriver];
    // Build speed-by-track-index mapping from current driver data at current frame
    const pathPoints = data.circuit_points;
    const speedArray: number[] = new Array(pathPoints.length).fill(0);
    const len = driverData.x.length;
    // Sample recent frames (last ~2 laps worth ≈ FPS*120) around safeIndex
    const sampleRange = Math.min(len, 25 * 120);
    const start = Math.max(0, safeIndex - sampleRange);
    const end = Math.min(len - 1, safeIndex);
    for (let i = start; i <= end; i++) {
      const px = driverData.x[i];
      const py = driverData.y[i];
      // Find closest track index
      let bestIdx = 0;
      let bestDist = Infinity;
      // Sample every 3rd point for performance
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
    return getSpeedHeatmapSegments(data.circuit_points, speedArray, 350);
  }, [showSpeedHeatmap, selectedDriver, data, safeIndex]);

  // --- Feature 4: Track Status Segments for Seekbar ---
  const seekbarStatusSegments = useMemo(() => {
    if (!data?.track_statuses) return [];
    return getTrackStatusSegments(data.track_statuses, activeTotalDuration);
  }, [data?.track_statuses, activeTotalDuration]);

  // --- Feature 6: Tyre Age per Driver ---
  const tyreAgeMap = useMemo(() => {
    if (!data?.drivers) return {};
    const result: Record<string, number> = {};
    for (const [code, d] of Object.entries(data.drivers)) {
      result[code] = getTyreAge(d.tyre, d.lap, safeIndex);
    }
    return result;
  }, [data?.drivers, safeIndex]);

  // --- Feature 7: Lap-Based Seeking ---
  const availableLaps = useMemo(() => {
    if (!data?.drivers) return [];
    return getAllLapNumbers(data.drivers);
  }, [data?.drivers]);

  const currentLap = useMemo(() => {
    // Use selected driver's lap or leader's lap
    const code = selectedDriver || leaderboard[0]?.code;
    if (!code) return 0;
    return activeDrivers[code]?.lap || 0;
  }, [selectedDriver, leaderboard, activeDrivers]);

  // --- Helper for Time Display ---
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- DNF / OUT Visual State Logic ---
  const driverOutTimes = useRef<Record<string, number>>({});

  const driverVisuals = useMemo(() => {
    if (!data || leaderboardOrder.length === 0) return { outStatus: {}, visibility: {} };

    const outStatus: Record<string, boolean> = {};

    // Determine "OUT" status (Stopped + Bottom of Active Pack)
    // Check from bottom (last place) up.
    let allBelowStopped = true;
    // leaderboard is sorted by position 1..N
    // We iterate N..1
    for (let i = leaderboardOrder.length - 1; i >= 0; i--) {
      const code = leaderboardOrder[i];
      const isStopped =
        data.driver_end_times?.[code] && currentTime > data.driver_end_times[code] + 1;

      if (isStopped && allBelowStopped) {
        outStatus[code] = true;
      } else {
        outStatus[code] = false;
        if (!isStopped) allBelowStopped = false;
      }
    }

    const visibility: Record<string, 'visible' | 'out-dimmed' | 'hidden'> = {};
    const now = currentTime;

    // Determine Visibility based on 5s delay
    leaderboardOrder.forEach((code) => {
      const isOut = outStatus[code];

      if (isOut) {
        if (driverOutTimes.current[code] === undefined) {
          driverOutTimes.current[code] = now;
        }
        // Check 5s duration (allow 5s of "ghosting" before hiding)
        if (now > driverOutTimes.current[code] + 5) {
          visibility[code] = 'hidden';
        } else {
          visibility[code] = 'out-dimmed';
        }
      } else {
        if (driverOutTimes.current[code] !== undefined) {
          delete driverOutTimes.current[code]; // Reset if back in race (rewind)
        }
        visibility[code] = 'visible';
      }
    });

    // Ensure all currentFrameDrivers have a status (default visible)
    // (Wait, leaderboardOrder contains all drivers, so we are good)
    return { outStatus, visibility };
  }, [leaderboardOrder, currentTime, data]);

  if (isLoading) {
    return <ReplayLoader year={year} event={event} session={session} />;
  }
  if (error) return <div className="p-12 text-center text-red-500">Error loading replay data.</div>;
  if (!data) return null;

  // Helper: Render Telemetry Overlay
  const renderTelemetryOverlay = (
    driverCode: string,
    style: React.CSSProperties,
    dragId: string,
    currentPos: { x: number; y: number } | null,
    setPos: (pos: { x: number; y: number }) => void
  ) => {
    const driverData = activeDrivers[driverCode];
    if (!driverData) return null;

    const lookupCode = driverCode.replace('_GHOST', '');

    // Calculate Lap Stats (Same logic as before)
    const driverLaps =
      data.completed_laps?.filter((l) => l.driver === lookupCode && l.timestamp <= currentTime) ||
      [];
    const fastestLap =
      driverLaps.length > 0
        ? driverLaps.reduce((min, l) => (l.seconds < min.seconds ? l : min), driverLaps[0])
        : null;
    const previousLap = driverLaps.length > 0 ? driverLaps[driverLaps.length - 1] : null;

    const currentLapNum = driverData.lap;
    const lapStartTime = driverLapStartTimes[lookupCode]?.[currentLapNum] ?? 0;
    const liveLapTime =
      replayMode === 'ghost' ? currentTime : Math.max(0, currentTime - lapStartTime);

    const formatLapTime = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = (sec % 60).toFixed(3);
      return `${m}:${s.padStart(6, '0')}`;
    };

    const isBeingDragged = activeDragId === dragId;

    return (
      <div
        key={driverCode}
        className={`absolute w-52 bg-black/90 border-l-4 p-3 rounded backdrop-blur shadow-2xl select-none ${isFullscreen ? 'cursor-move' : ''} ${isBeingDragged ? 'scale-[1.02] shadow-white/10' : ''} z-[60]`}
        style={{
          borderColor: activeDrivers[driverCode]?.color || data.driver_colors[driverCode] || '#fff',
          ...style,
          left: currentPos ? currentPos.x : style.left,
          top: currentPos ? currentPos.y : style.top,
          right: currentPos ? 'auto' : style.right,
        }}
        onMouseDown={(e) => {
          if (!isFullscreen) return;
          const rect = e.currentTarget.getBoundingClientRect();
          dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          if (!currentPos) setPos({ x: rect.left, y: rect.top });
          setActiveDragId(dragId);
        }}
      >
        <div className="flex items-center gap-3 mb-2 border-b border-gray-800 pb-2">
          <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700 shrink-0">
            <img
              src={getDriverImage(lookupCode, year)}
              alt={lookupCode}
              className="w-full h-full object-cover object-top transform scale-110"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/placeholder.svg';
              }}
            />
          </div>
          <div>
            <div className="text-base font-bold leading-tight">
              {driverNameMap[lookupCode] || lookupCode}
            </div>
          </div>
        </div>

        <div className="space-y-1 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-gray-800 pb-1">
            <span className="text-gray-400 uppercase text-[10px]">Position</span>
            <span className="text-white text-base font-bold">
              {leaderboard.find((d) => d.code === driverCode)?.pos || '-'}
            </span>
          </div>
          {isFullscreen ? (
            <>
              <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                <span className="text-gray-400 uppercase text-[10px]">Current</span>
                <span className="text-yellow-400 text-base font-bold">
                  {formatLapTime(liveLapTime)}
                </span>
              </div>
              {replayMode !== 'ghost' && (
                <>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                    <span className="text-gray-400 uppercase text-[10px]">Last</span>
                    <span className="text-white text-base">
                      {previousLap ? previousLap.time_str : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                    <span className="text-gray-400 uppercase text-[10px]">Best</span>
                    <span className="text-purple-400 text-base font-bold">
                      {fastestLap ? fastestLap.time_str : '-'}
                    </span>
                  </div>
                </>
              )}

              {/* Throttle & Brake Bars */}
              <div className="flex gap-1 h-16 my-2">
                <div className="flex-1 bg-gray-800 rounded relative overflow-hidden flex flex-col justify-end">
                  <div
                    className="w-full bg-green-500 transition-all duration-75 ease-linear"
                    style={{ height: `${driverData.throttle || 0}%` }}
                  />
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold mix-blend-difference text-white">
                    THR
                  </span>
                </div>
                <div className="flex-1 bg-gray-800 rounded relative overflow-hidden flex flex-col justify-end">
                  <div
                    className="w-full bg-red-500 transition-all duration-75 ease-linear"
                    style={{
                      height: `${driverData.brake > 1 ? driverData.brake : driverData.brake * 100}%`,
                    }}
                  />
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold mix-blend-difference text-white">
                    BRK
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 px-2 text-center border-b border-gray-800">
              <span className="text-xs text-gray-500 italic block leading-relaxed">
                Go to fullscreen for more detailed telemetry
              </span>
            </div>
          )}

          <div className="flex justify-between items-center border-b border-gray-800 pb-1">
            <span className="text-gray-400 uppercase text-[10px]">RPM</span>
            <span className="text-white text-base font-bold">
              {Math.round(driverData.rpm || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-1">
            <span className="text-gray-400 uppercase text-[10px]">Speed</span>
            <span className="text-purple-400 text-base font-bold">
              {Math.round(driverData.speed)} <span className="text-[10px] text-gray-500">kph</span>
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-1">
            <span className="text-gray-400 w-1/2 uppercase text-[10px]">Gear</span>
            <span className="text-yellow-400 text-base font-bold">{driverData.gear}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-1">
            <span className="text-gray-400 w-1/2 uppercase text-[10px]">DRS</span>
            <span
              className={`${driverData.drs >= 10 ? 'text-green-500 font-bold' : 'text-gray-600'} text-base`}
            >
              {driverData.drs >= 10 ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-1">
            <span className="text-gray-400 uppercase text-[10px]">Lap</span>
            <span className="text-white text-base">{driverData.lap}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`flex flex-col bg-black text-white overflow-hidden ${isFullscreen ? 'h-full' : 'w-full max-w-5xl mx-auto h-[calc(100vh-200px)] min-h-[400px] rounded-xl shadow-2xl'} ${className}`}
    >
      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 1. Track Map Layer */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden bg-[#0d0d0d] cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Branding Logo - Fullscreen Only */}
          {isFullscreen && (
            <div className="absolute top-6 left-6 flex items-center gap-2 z-50 pointer-events-none select-none">
              <Gauge className="text-red-500" size={28} />
              <span className="text-xl font-bold tracking-tighter">Fastlytics</span>
            </div>
          )}

          {/* --- Top-Left Mode Controller (Shifted Down in Fullscreen) --- */}
          <div
            className={`absolute left-6 z-50 flex flex-col gap-2 transition-all duration-300 ${isFullscreen ? 'top-24' : 'top-6'}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Segmented Control */}
            <div className="flex bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-2xl relative isolate">
              <button
                onClick={() => {
                  setReplayMode('session');
                  trackEvent('replay_mode_changed', { mode: 'session', year, event, session });
                }}
                className={`relative z-10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${replayMode === 'session' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {replayMode === 'session' && (
                  <motion.div
                    layoutId="mode-highlight"
                    className="absolute inset-0 bg-white/10 border border-white/5 rounded-lg -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                Session
              </button>
              <button
                onClick={() => {
                  setReplayMode('ghost');
                  trackEvent('replay_mode_changed', { mode: 'ghost', year, event, session });
                }}
                className={`relative z-10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-2 ${replayMode === 'ghost' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {replayMode === 'ghost' && (
                  <motion.div
                    layoutId="mode-highlight"
                    className="absolute inset-0 bg-white/10 border border-white/5 rounded-lg -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Swords size={14} />
                Head 2 Head
              </button>
            </div>

            {/* Ghost Configuration Panel (Attached below) */}
            {/* Ghost Configuration Panel (Attached below) */}
            {replayMode === 'ghost' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-80 mt-2 overflow-hidden"
              >
                {/* Header / Toggle */}
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setIsGhostConfigOpen(!isGhostConfigOpen)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Matchup Settings
                    </span>
                    {!isGhostConfigOpen && (
                      <span className="text-xs text-white font-bold ml-2">
                        {ghostConfig.d1 || '?'} vs {ghostConfig.d2 || '?'}
                      </span>
                    )}
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    {isGhostConfigOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                  {isGhostConfigOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-4 pb-4 space-y-4 pt-1">
                        {/* Helper Component for Custom Driver Select */}
                        <CustomDriverSelect
                          label="Red Corner"
                          subLab="Driver 1"
                          color="text-red-500"
                          driverCode={ghostConfig.d1}
                          lapNum={ghostConfig.l1}
                          drivers={data.drivers}
                          driverColors={data.driver_colors}
                          year={year}
                          onSelectDriver={(d) =>
                            setGhostConfig((prev) => ({ ...prev, d1: d, l1: null }))
                          }
                          onSelectLap={(l) => setGhostConfig((prev) => ({ ...prev, l1: l }))}
                          container={rootRef.current}
                        />

                        <div className="flex items-center gap-3 opacity-50">
                          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                          <div className="bg-black/40 rounded-full p-1.5 border border-white/10">
                            <Swords size={12} className="text-white/60" />
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                        </div>

                        {/* Helper Component for Driver 2 */}
                        <CustomDriverSelect
                          label="Blue Corner"
                          subLab="Driver 2"
                          color="text-blue-500"
                          driverCode={ghostConfig.d2}
                          lapNum={ghostConfig.l2}
                          drivers={data.drivers}
                          driverColors={data.driver_colors}
                          year={year}
                          onSelectDriver={(d) =>
                            setGhostConfig((prev) => ({ ...prev, d2: d, l2: null }))
                          }
                          onSelectLap={(l) => setGhostConfig((prev) => ({ ...prev, l2: l }))}
                          container={rootRef.current}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div
            className="w-full h-full origin-top-left will-change-transform"
            style={{
              transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
            }}
          >
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full pointer-events-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background Path (Circuit) */}
              <path
                d={data.circuit_layout}
                fill="none"
                stroke={trackColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors duration-500 ease-in-out"
              />
              <path
                d={data.circuit_layout}
                fill="none"
                stroke="#374151" // Lighter inner
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
                className="opacity-30"
              />

              {/* Speed Heatmap Layer */}
              {speedHeatmapSegments.map((seg, i) => (
                <path
                  key={`heatmap-${i}`}
                  d={seg.path}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
              ))}

              {/* Sector Markers + Start/Finish Line */}
              {sectorMarkers.map((marker) => {
                const lineLen = 18;
                const dx = Math.cos(marker.angle) * lineLen;
                const dy = Math.sin(marker.angle) * lineLen;
                const isStartFinish = marker.label === 'S/F';
                return (
                  <g key={marker.label} className="opacity-70">
                    <line
                      x1={marker.x - dx}
                      y1={marker.y - dy}
                      x2={marker.x + dx}
                      y2={marker.y + dy}
                      stroke={isStartFinish ? '#ffffff' : '#9ca3af'}
                      strokeWidth={isStartFinish ? 3 : 2}
                      strokeLinecap="round"
                    />
                    {isStartFinish && (
                      <line
                        x1={marker.x - dx * 0.6}
                        y1={marker.y - dy * 0.6}
                        x2={marker.x + dx * 0.6}
                        y2={marker.y + dy * 0.6}
                        stroke="#000000"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        strokeLinecap="round"
                      />
                    )}
                    <text
                      x={marker.x + dx * 1.4}
                      y={marker.y + dy * 1.4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isStartFinish ? '#ffffff' : '#9ca3af'}
                      fontSize="10"
                      fontWeight={isStartFinish ? 'bold' : 'normal'}
                      className="select-none"
                    >
                      {marker.label}
                    </text>
                  </g>
                );
              })}

              {/* Car Trails Layer */}
              {Object.entries(activeDrivers).map(([code, car]) => {
                if (driverVisuals.visibility[code] === 'hidden' && replayMode !== 'ghost')
                  return null;
                const driverData = data.drivers[code.replace('_GHOST', '')];
                if (!driverData) return null;
                const color = car.color || data.driver_colors[code] || 'white';
                const trailLength = selectedDriver === code ? 20 : 8;
                const trail = getTrailPoints(driverData.x, driverData.y, safeIndex, trailLength);
                return trail.map((pt, i) => (
                  <circle
                    key={`trail-${code}-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={2}
                    fill={color}
                    opacity={pt.opacity * 0.5}
                  />
                ));
              })}

              {/* Cars Layer */}
              {Object.entries(activeDrivers).map(([code, car]) => {
                // Check Visibility
                if (driverVisuals.visibility[code] === 'hidden' && replayMode !== 'ghost')
                  return null;

                // car.x/y are already normalized to the SVG viewbox by backend
                // Prioritize car.color (Ghost Mode) over static map
                const color = car.color || data.driver_colors[code] || 'white';
                const isSelected = selectedDriver === code;

                // Dim if OUT but not hidden yet
                const isDimmed = driverVisuals.visibility[code] === 'out-dimmed';
                const opacityClass = isDimmed ? 'opacity-50 grayscale' : '';

                return (
                  <g
                    key={code}
                    transform={`translate(${car.x}, ${car.y})`}
                    className={`transition-transform duration-75 ease-linear cursor-pointer pointer-events-auto ${opacityClass}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      if (!isDragging) {
                        e.stopPropagation();
                        const newSelection = code === selectedDriver ? null : code;
                        setSelectedDriver(newSelection);
                        setIsFollowing(true); // Re-enable follow on selection
                      }
                    }}
                  >
                    {/* Selection Highlight */}
                    {isSelected && (
                      <circle
                        r={12 / viewState.scale}
                        fill="none"
                        stroke={color}
                        strokeWidth={2 / viewState.scale}
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Car Marker */}
                    <circle
                      r={isSelected ? 8 : 5}
                      fill={color}
                      stroke="black"
                      strokeWidth={1 / viewState.scale}
                    />

                    {/* Label */}
                    {isSelected && (
                      <text
                        y={-15}
                        textAnchor="middle"
                        fill={color}
                        fontSize={12}
                        fontWeight="bold"
                        className="drop-shadow-md select-none"
                        style={{ fontSize: `${12 / Math.sqrt(viewState.scale)}px` }}
                      >
                        {car.originalCode || code.replace('_GHOST', '')}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Title Header (Top Center) */}
        {isFullscreen && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-40 pointer-events-none select-none text-center">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">
              {event} "{session}"
            </h1>
          </div>
        )}

        {/* 2. Messages Overlay (Top Center) */}
        <RaceControlMessages
          messages={data.race_control_messages}
          currentTime={currentTime}
          dismissedMessages={dismissedMessages}
          replayMode={replayMode}
          getMessageConfig={getMessageConfig}
          formatTime={formatTime}
          onDismiss={(id) => setDismissedMessages((prev) => new Set(prev).add(id))}
        />

        {/* 3. Leaderboard Sidebar (Right) */}
        <Leaderboard
          leaderboard={leaderboard}
          selectedDriver={selectedDriver}
          driverVisuals={driverVisuals}
          isRace={isRace}
          isQualifying={isQualifying}
          replayMode={replayMode}
          currentTime={currentTime}
          totalLaps={totalLaps}
          year={year}
          sessionTimeRemaining={sessionTimeRemaining}
          pitIntervals={data.pit_intervals}
          circuitLength={data?.circuit_distances?.[data.circuit_distances.length - 1] || 5000}
          tyreAge={tyreAgeMap}
          onSelectDriver={(code) => setSelectedDriver(code)}
          onFollow={() => setIsFollowing(true)}
        />

        {replayMode === 'ghost' ? (
          <>
            {/* Ghost Mode: Show both overlays fixed */}
            {ghostConfig.d1 &&
              renderTelemetryOverlay(
                ghostConfig.d1 + '_GHOST',
                { top: isFullscreen ? 400 : 180, left: 24 }, // Left (Below config)
                'ghost1',
                ghostPos1,
                setGhostPos1
              )}
            {ghostConfig.d2 &&
              renderTelemetryOverlay(
                ghostConfig.d2 + '_GHOST',
                { top: isFullscreen ? 400 : 180, right: isFullscreen ? 280 : 24 }, // Right (offset from leaderboard)
                'ghost2',
                ghostPos2,
                setGhostPos2
              )}
          </>
        ) : (
          // Standard Mode: Show selected driver draggable
          selectedDriver &&
          renderTelemetryOverlay(
            selectedDriver,
            { left: 24, top: isFullscreen ? 320 : 80 },
            'main',
            overlayPos,
            setOverlayPos
          )
        )}
      </div>

      {/* Central Play Button Overlay (Initial State) */}
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
            <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 animate-pulse"></div>
          </button>

          <div className="absolute bottom-20 text-center">
            <p className="text-white font-bold text-lg tracking-widest uppercase drop-shadow-md">
              Start Replay
            </p>
          </div>
        </div>
      )}

      {/* 5. Playback Controls (Auto-Hide Bottom Overlay) */}
      <PlaybackControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        playbackSpeed={playbackSpeed}
        activeTotalDuration={activeTotalDuration}
        isFullscreen={isFullscreen}
        hasStarted={hasStarted}
        showSpeedHeatmap={showSpeedHeatmap}
        seekbarStatusSegments={seekbarStatusSegments}
        hoverTime={hoverTime}
        hoverPos={hoverPos}
        formatTime={formatTime}
        onPlayPause={() => {
          setIsPlaying(!isPlaying);
          trackEvent('replay_play_pause', {
            action: isPlaying ? 'pause' : 'play',
            current_time: currentTime,
            year,
            event,
            session,
          });
        }}
        onSeek={(time) => setCurrentTime(time)}
        onSpeedChange={() => {
          const speeds = [1, 2, 5, 10, 20];
          const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
          setPlaybackSpeed(speeds[nextIdx]);
          trackEvent('replay_speed_changed', { speed: speeds[nextIdx], year, event, session });
        }}
        onToggleFullscreen={toggleFullscreen}
        onToggleHeatmap={() => setShowSpeedHeatmap((v) => !v)}
        availableLaps={availableLaps}
        currentLap={currentLap}
        onSeekToLap={(lap) => {
          const time = getTimeForLap(data.drivers, data.time, lap);
          if (time !== null) setCurrentTime(time);
        }}
        onHoverMove={(time, pos) => {
          setHoverTime(time);
          setHoverPos(pos);
        }}
        onHoverLeave={() => {
          setHoverTime(null);
          setHoverPos(null);
        }}
      />
    </div>
  );
};

// Helper Component Definitions must be outside the main component
const CustomDriverSelect = ({
  label,
  subLab,
  color,
  driverCode,
  lapNum,
  drivers,
  driverColors,
  year,
  onSelectDriver,
  onSelectLap,
  container,
}: {
  label: string;
  subLab: string;
  color: string;
  driverCode: string | null;
  lapNum: number | null;
  drivers: ReplayDriversMap;
  driverColors: Record<string, string>;
  year: number;
  onSelectDriver: (d: string) => void;
  onSelectLap: (l: number) => void;
  container?: HTMLElement | null;
}) => {
  const sortedDrivers = Object.keys(drivers).sort();
  const laps =
    driverCode && drivers[driverCode]?.lap
      ? [...new Set(drivers[driverCode].lap)].sort((a, b) => a - b)
      : [];

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
        <span className="text-[10px] text-gray-500 font-medium">{subLab}</span>
      </div>

      <div className="flex gap-2">
        {/* Driver Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`flex-1 flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded p-1 px-2 text-left transition-colors min-w-0 ${!driverCode ? 'text-gray-400' : 'text-white'}`}
            >
              {driverCode ? (
                <>
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 shrink-0 border border-gray-600">
                    <img
                      src={getDriverImage(driverCode, year)}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <span className="font-bold text-xs truncate">{driverCode}</span>
                </>
              ) : (
                <span className="text-xs">Select Driver</span>
              )}
              <ChevronDown size={12} className="ml-auto opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-0 bg-gray-900 border-gray-700 text-white"
            align="start"
            container={container}
          >
            <ScrollArea className="h-64">
              <div className="p-1">
                {sortedDrivers.map((d) => (
                  <button
                    key={d}
                    onClick={() => onSelectDriver(d)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border"
                      style={{ borderColor: driverColors[d] }}
                    >
                      <img
                        src={getDriverImage(d, year)}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-wide">{d}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Lap Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              disabled={!driverCode}
              className={`w-16 flex items-center justify-center gap-1 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded p-1 transition-colors ${!lapNum ? 'text-gray-400' : 'text-white font-mono font-bold'}`}
            >
              <span className="text-xs">{lapNum ? `L${lapNum}` : 'Lap'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2 bg-gray-900 border-gray-700 text-white"
            align="end"
            container={container}
          >
            <div className="mb-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider px-1">
              Select Lap
            </div>
            <ScrollArea className="h-48">
              <div className="grid grid-cols-4 gap-1">
                {laps.map((l) => (
                  <button
                    key={l}
                    onClick={() => onSelectLap(l)}
                    className={`p-1.5 rounded text-xs font-mono text-center transition-colors ${lapNum === l ? 'bg-white text-black font-bold' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
export { SessionReplay };
export default SessionReplay;
