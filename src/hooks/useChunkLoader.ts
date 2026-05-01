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

function isAbortError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort() {
      window.clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
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
      await sleep(RETRY_DELAYS[attempt] || 4000, signal);
    }
  }
  throw new Error('Unreachable');
}

type LoadedChunk = {
  time: number[];
  drivers: ReplayDriversMap;
  start: number;
  end: number;
};

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
  const chunksMapRef = useRef<Map<number, LoadedChunk>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const fetchingSetRef = useRef<Set<number>>(new Set());
  const failedSetRef = useRef<Set<number>>(new Set());
  const totalChunksRef = useRef(0);
  const priorityQueueRef = useRef<number[]>([]);
  const metadataRef = useRef<SessionReplayData | null>(null);
  const generationRef = useRef(0);
  const loadChunkRef = useRef<(chunkId: number) => Promise<void>>();
  const scheduleNextChunksRef = useRef<() => void>();
  const mergeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  const mergeAllChunks = useCallback(() => {
    const meta = metadataRef.current;
    if (!meta) return;

    const chunks = chunksMapRef.current;
    if (chunks.size === 0) {
      dataRef.current = null;
      setState((prev) => ({
        ...prev,
        replayData: null,
        loadedChunks: new Set(),
        loadedDuration: 0,
      }));
      return;
    }

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
        gap: ([] as (string | null)[]).concat(
          ...parts.map((p) => (p.data as ReplayDriverData).gap || [])
        ),
        interval: ([] as (string | null)[]).concat(
          ...parts.map((p) => (p.data as ReplayDriverData).interval || [])
        ),
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
      loadedChunks: new Set(sortedIds),
      loadedDuration: lastTime,
    }));
  }, []);

  const MERGE_DEBOUNCE_MS = 1000;

  const scheduleMerge = useCallback(() => {
    if (mergeTimeoutRef.current) return; // already pending
    mergeTimeoutRef.current = window.setTimeout(() => {
      mergeTimeoutRef.current = null;
      mergeAllChunks();
    }, MERGE_DEBOUNCE_MS);
  }, [mergeAllChunks]);

  const enqueueChunks = useCallback((chunkIds: number[]) => {
    const queued = new Set(priorityQueueRef.current);
    const loaded = chunksMapRef.current;
    const fetching = fetchingSetRef.current;
    const failed = failedSetRef.current;

    for (const id of chunkIds) {
      if (loaded.has(id) || fetching.has(id) || failed.has(id) || queued.has(id)) continue;
      priorityQueueRef.current.push(id);
      queued.add(id);
    }
  }, []);

  const scheduleNextChunks = useCallback(() => {
    const activeCount = fetchingSetRef.current.size;
    const slotsAvailable = CONCURRENT_LIMIT - activeCount;

    if (slotsAvailable <= 0) return;

    const loaded = chunksMapRef.current;
    const fetching = fetchingSetRef.current;
    const failed = failedSetRef.current;

    const pending: number[] = [];

    while (priorityQueueRef.current.length > 0 && pending.length < slotsAvailable) {
      const id = priorityQueueRef.current.shift()!;
      if (!loaded.has(id) && !fetching.has(id) && !failed.has(id)) {
        pending.push(id);
      }
    }

    for (let i = 0; i < Math.min(pending.length, slotsAvailable); i++) {
      loadChunkRef.current?.(pending[i]);
    }
  }, []);

  const loadChunk = useCallback(
    async (chunkId: number) => {
      if (fetchingSetRef.current.has(chunkId)) return;
      if (chunksMapRef.current.has(chunkId)) return;

      const gen = generationRef.current;
      const signal = abortRef.current?.signal;
      fetchingSetRef.current.add(chunkId);

      try {
        const chunk = await fetchChunkWithRetry(year, event, session, chunkId, signal);
        if (gen !== generationRef.current) return;
        chunksMapRef.current.set(chunkId, {
          time: chunk.time,
          drivers: chunk.drivers,
          start: chunk.start_time,
          end: chunk.end_time,
        });

        scheduleMerge();
      } catch (err) {
        if (gen !== generationRef.current) return;
        if (!signal?.aborted && !isAbortError(err)) {
          console.error(`Failed to load chunk ${chunkId}:`, err);
          failedSetRef.current.add(chunkId);
        }
      } finally {
        if (gen === generationRef.current) {
          fetchingSetRef.current.delete(chunkId);
          scheduleNextChunksRef.current?.();
        }
      }
    },
    [year, event, session, scheduleMerge]
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

      const targetIndex = manifest.findIndex((c) => time >= c.start && time < c.end);
      const resolvedIndex =
        targetIndex === -1 ? (time < manifest[0].start ? 0 : manifest.length - 1) : targetIndex;
      const targetChunk = manifest[resolvedIndex];
      if (!targetChunk) return;

      // Ensure the target chunk is queued (no eviction — we keep everything)
      enqueueChunks([targetChunk.id]);
      scheduleNextChunks();

      // If target chunk is already downloaded but not yet merged, force a merge
      // so the seeked region is immediately playable.
      if (chunksMapRef.current.has(targetChunk.id) && !state.loadedChunks.has(targetChunk.id)) {
        if (mergeTimeoutRef.current) {
          window.clearTimeout(mergeTimeoutRef.current);
          mergeTimeoutRef.current = null;
        }
        mergeAllChunks();
      }
    },
    [enqueueChunks, scheduleNextChunks, mergeAllChunks, state.loadedChunks]
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
    failedSetRef.current.clear();
    totalChunksRef.current = manifest.length;
    priorityQueueRef.current = [];
    dataRef.current = null;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialization/reset on metadata change
    setState({
      replayData: null,
      loadedChunks: new Set<number>(),
      totalChunks: manifest.length,
      isBuffering: false,
      loadedDuration: 0,
    });

    if (manifest.length > 0) {
      // Load chunk 0 immediately so playback can start ASAP
      enqueueChunks([0]);
      scheduleNextChunksRef.current?.();
    }

    return () => {
      abortRef.current?.abort();
      if (mergeTimeoutRef.current) {
        window.clearTimeout(mergeTimeoutRef.current);
        mergeTimeoutRef.current = null;
      }
    };
  }, [enqueueChunks, metadata]);

  // Background preloader: enqueue ALL remaining chunks as soon as chunk 0 is loaded
  useEffect(() => {
    if (!metadata) return;
    const meta = metadata as SessionReplayMetadata;
    const manifest = meta.chunk_manifest || [];
    if (manifest.length <= 1) return;

    const loaded = state.loadedChunks;
    if (!loaded.has(0)) return; // Wait for chunk 0 first

    const allIds = manifest.map((c) => c.id);
    const remaining = allIds.filter((id) => !loaded.has(id));
    enqueueChunks(remaining);
    scheduleNextChunksRef.current?.();
  }, [metadata, state.loadedChunks, enqueueChunks]);

  const checkBuffering = useCallback(
    (currentTime: number, isPlaying: boolean) => {
      const meta = metadataRef.current as SessionReplayMetadata | null;
      const totalDur = meta?.total_duration || 9999;
      const loadedDur = state.loadedDuration;
      const fullyLoaded = state.loadedChunks.size >= state.totalChunks && state.totalChunks > 0;

      const shouldBuffer =
        isPlaying && currentTime < totalDur && !fullyLoaded && currentTime + 10 > loadedDur;
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
