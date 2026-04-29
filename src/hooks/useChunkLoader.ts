import { useEffect, useRef, useState, useCallback } from 'react';
import {
  fetchSessionReplayChunk,
  SessionReplayData,
  ReplayDriverData,
  ReplayDriversMap,
} from '@/lib/api';

interface ChunkManifest {
  id: number;
  start: number;
  end: number;
  count?: number;
}

interface SessionReplayMetadata extends SessionReplayData {
  chunk_manifest?: ChunkManifest[];
  total_duration?: number;
}

interface ChunkLoaderState {
  replayData: SessionReplayData | null;
  loadedChunks: Set<number>;
  totalChunks: number;
  isBuffering: boolean;
  loadedDuration: number;
}

const CONCURRENT_LIMIT = 4;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const EVICTION_DISTANCE_SEC = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchChunkWithRetry(
  year: number,
  event: string,
  session: string,
  chunkId: number,
  signal?: AbortSignal
) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchSessionReplayChunk(year, event, session, chunkId, signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      if (attempt === MAX_RETRIES) throw err;
      await sleep(RETRY_DELAYS[attempt] || 4000);
    }
  }
  throw new Error('Unreachable');
}

export function useChunkLoader(
  metadata: SessionReplayData | null,
  year: number,
  event: string,
  session: string
) {
  const [state, setState] = useState<ChunkLoaderState>({
    replayData: null,
    loadedChunks: new Set(),
    totalChunks: 0,
    isBuffering: false,
    loadedDuration: 0,
  });

  const dataRef = useRef<SessionReplayData | null>(null);
  const chunksMapRef = useRef<Map<number, { time: number[]; drivers: ReplayDriversMap }>>(
    new Map()
  );
  const abortRef = useRef<AbortController | null>(null);
  const fetchingSetRef = useRef<Set<number>>(new Set());
  const priorityQueueRef = useRef<number[]>([]);
  const metadataRef = useRef<SessionReplayData | null>(null);
  const generationRef = useRef(0);
  const loadChunkRef = useRef<(chunkId: number) => Promise<void>>();
  const scheduleNextChunksRef = useRef<() => void>();

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  const mergeAllChunks = useCallback(() => {
    const meta = metadataRef.current;
    if (!meta) return;

    const chunks = chunksMapRef.current;
    if (chunks.size === 0) return;

    const sortedIds = [...chunks.keys()].sort((a, b) => a - b);

    const timeParts: number[][] = [];
    const driverParts: Record<string, { key: string; data: Partial<ReplayDriverData> }[]> = {};

    for (const id of sortedIds) {
      const chunk = chunks.get(id)!;
      timeParts.push(chunk.time);
      for (const [code, dData] of Object.entries(chunk.drivers)) {
        if (!driverParts[code]) driverParts[code] = [];
        driverParts[code].push({ key: String(id), data: dData });
      }
    }

    const mergedTime = ([] as number[]).concat(...timeParts);

    const initDrivers: Record<string, ReplayDriverData> = {};
    const driverColors = meta.driver_colors || {};
    const allDriverCodes = new Set([...Object.keys(driverColors), ...Object.keys(driverParts)]);

    for (const code of allDriverCodes) {
      const parts = driverParts[code] || [];
      initDrivers[code] = {
        x: ([] as number[]).concat(...parts.map((p) => p.data.x || [])),
        y: ([] as number[]).concat(...parts.map((p) => p.data.y || [])),
        dist: ([] as number[]).concat(...parts.map((p) => p.data.dist || [])),
        rel_dist: ([] as number[]).concat(...parts.map((p) => p.data.rel_dist || [])),
        speed: ([] as number[]).concat(...parts.map((p) => p.data.speed || [])),
        gear: ([] as number[]).concat(...parts.map((p) => p.data.gear || [])),
        drs: ([] as number[]).concat(...parts.map((p) => p.data.drs || [])),
        rpm: ([] as number[]).concat(...parts.map((p) => p.data.rpm || [])),
        lap: ([] as number[]).concat(...parts.map((p) => p.data.lap || [])),
        tyre: ([] as number[]).concat(...parts.map((p) => p.data.tyre || [])),
        throttle: ([] as number[]).concat(...parts.map((p) => p.data.throttle || [])),
        brake: ([] as number[]).concat(...parts.map((p) => p.data.brake || [])),
      };
    }

    const merged: SessionReplayData = {
      ...meta,
      time: mergedTime,
      drivers: initDrivers,
    };

    dataRef.current = merged;

    const lastTime = mergedTime.length > 0 ? mergedTime[mergedTime.length - 1] : 0;
    setState((prev) => ({
      ...prev,
      replayData: merged,
      loadedDuration: lastTime,
    }));
  }, []);

  const scheduleNextChunks = useCallback(() => {
    const activeCount = fetchingSetRef.current.size;
    const slotsAvailable = CONCURRENT_LIMIT - activeCount;

    if (slotsAvailable <= 0) return;

    const loaded = chunksMapRef.current;
    const fetching = fetchingSetRef.current;
    const total = state.totalChunks;

    const pending: number[] = [];

    while (priorityQueueRef.current.length > 0) {
      const id = priorityQueueRef.current.shift()!;
      if (!loaded.has(id) && !fetching.has(id)) {
        pending.push(id);
      }
    }

    if (pending.length < slotsAvailable) {
      for (let i = 0; i < total; i++) {
        if (pending.length >= slotsAvailable) break;
        if (!loaded.has(i) && !fetching.has(i) && !pending.includes(i)) {
          pending.push(i);
        }
      }
    }

    for (let i = 0; i < Math.min(pending.length, slotsAvailable); i++) {
      loadChunkRef.current?.(pending[i]);
    }
  }, [state.totalChunks]);

  const loadChunk = useCallback(
    async (chunkId: number) => {
      if (fetchingSetRef.current.has(chunkId)) return;
      if (chunksMapRef.current.has(chunkId)) return;

      const gen = generationRef.current;
      fetchingSetRef.current.add(chunkId);

      try {
        const chunk = await fetchChunkWithRetry(
          year,
          event,
          session,
          chunkId,
          abortRef.current?.signal
        );
        if (gen !== generationRef.current) return;
        chunksMapRef.current.set(chunkId, { time: chunk.time, drivers: chunk.drivers });

        setState((prev) => {
          const next = new Set(prev.loadedChunks);
          next.add(chunkId);
          return {
            ...prev,
            loadedChunks: next,
            totalChunks: Math.max(prev.totalChunks, chunkId + 1),
          };
        });

        mergeAllChunks();
      } catch (err) {
        if (gen !== generationRef.current) return;
        if ((err as Error).name !== 'AbortError') {
          console.error(`Failed to load chunk ${chunkId}:`, err);
        }
      } finally {
        if (gen === generationRef.current) {
          fetchingSetRef.current.delete(chunkId);
          scheduleNextChunksRef.current?.();
        }
      }
    },
    [year, event, session, mergeAllChunks]
  );

  useEffect(() => {
    loadChunkRef.current = loadChunk;
  }, [loadChunk]);

  useEffect(() => {
    scheduleNextChunksRef.current = scheduleNextChunks;
  }, [scheduleNextChunks]);

  const seekTo = useCallback(
    (time: number) => {
      const meta = metadataRef.current as SessionReplayMetadata | null;
      const manifest = meta?.chunk_manifest || [];
      if (manifest.length === 0) return;

      const targetChunk = manifest.find((c) => time >= c.start && time < c.end);
      if (!targetChunk) return;

      if (chunksMapRef.current.has(targetChunk.id)) return;

      priorityQueueRef.current = [targetChunk.id];

      const forward = manifest
        .filter((c) => c.id > targetChunk.id)
        .map((c) => c.id)
        .slice(0, 3);
      priorityQueueRef.current.push(...forward);

      scheduleNextChunks();
    },
    [scheduleNextChunks]
  );

  useEffect(() => {
    if (!metadata) return;

    const meta = metadata as SessionReplayMetadata;
    const manifest = meta.chunk_manifest || [];

    generationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    chunksMapRef.current.clear();
    fetchingSetRef.current.clear();
    priorityQueueRef.current = [];
    dataRef.current = null;

    setState({
      // eslint-disable-line react-hooks/set-state-in-effect -- initialization/reset on metadata change
      loadedChunks: new Set(),
      totalChunks: manifest.length,
      isBuffering: false,
      loadedDuration: 0,
    });

    if (manifest.length > 0) {
      const initial = [0, 1, 2, 3].filter((i) => i < manifest.length);
      priorityQueueRef.current = initial;
      scheduleNextChunks();
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [metadata, scheduleNextChunks]);

  const checkBuffering = useCallback(
    (currentTime: number, isPlaying: boolean) => {
      const meta = metadataRef.current as SessionReplayMetadata | null;
      const totalDur = meta?.total_duration || 9999;
      const loadedDur = state.loadedDuration;
      const fullyLoaded = state.loadedChunks.size >= state.totalChunks && state.totalChunks > 0;

      const shouldBuffer = isPlaying && !fullyLoaded && currentTime + 10 > loadedDur;
      setState((prev) => ({ ...prev, isBuffering: shouldBuffer }));
      return shouldBuffer;
    },
    [state.loadedDuration, state.loadedChunks.size, state.totalChunks]
  );

  return {
    replayData: state.replayData,
    loadedChunks: state.loadedChunks,
    totalChunks: state.totalChunks,
    isBuffering: state.isBuffering,
    loadedDuration: state.loadedDuration,
    seekTo,
    checkBuffering,
    isFullyLoaded: state.loadedChunks.size >= state.totalChunks && state.totalChunks > 0,
  };
}
