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

type LoadedChunk = {
  time: number[];
  drivers: ReplayDriversMap;
  start: number;
  end: number;
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const BUFFER_BEHIND_CHUNKS = 1;
const BUFFER_AHEAD_CHUNKS = 2;
const BUFFER_HEADROOM_SECONDS = 15;
const MAX_CACHED_CHUNKS = 10;

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

function getChunkIndexForTime(manifest: ChunkManifest[], time: number) {
  if (manifest.length === 0) return -1;

  const targetIndex = manifest.findIndex((chunk) => time >= chunk.start && time < chunk.end);
  if (targetIndex !== -1) return targetIndex;
  if (time < manifest[0].start) return 0;
  return manifest.length - 1;
}

function buildDesiredChunkIds(currentIndex: number, totalChunks: number) {
  const ids: number[] = [];

  for (let offset = 0; offset <= BUFFER_AHEAD_CHUNKS; offset++) {
    const id = currentIndex + offset;
    if (id >= 0 && id < totalChunks) ids.push(id);
  }

  for (let offset = 1; offset <= BUFFER_BEHIND_CHUNKS; offset++) {
    const id = currentIndex - offset;
    if (id >= 0 && id < totalChunks) ids.push(id);
  }

  return ids;
}

function buildBackgroundChunkIds(
  currentIndex: number,
  totalChunks: number,
  desiredChunkIds: number[]
) {
  const desiredSet = new Set(desiredChunkIds);
  const ids: number[] = [];

  for (let distance = 1; distance < totalChunks; distance++) {
    const ahead = currentIndex + BUFFER_AHEAD_CHUNKS + distance;
    if (ahead < totalChunks && !desiredSet.has(ahead)) ids.push(ahead);

    const behind = currentIndex - BUFFER_BEHIND_CHUNKS - distance;
    if (behind >= 0 && !desiredSet.has(behind)) ids.push(behind);
  }

  return ids;
}

function pruneCachedChunks(
  chunksMap: Map<number, LoadedChunk>,
  targetChunkIndex: number,
  desiredChunkIds: number[],
  backgroundChunkIds: number[]
) {
  const keepChunkIds: number[] = [];
  const seen = new Set<number>();

  for (const id of [...desiredChunkIds, ...backgroundChunkIds]) {
    if (!chunksMap.has(id) || seen.has(id)) continue;
    keepChunkIds.push(id);
    seen.add(id);
    if (keepChunkIds.length >= MAX_CACHED_CHUNKS) break;
  }

  if (!seen.has(targetChunkIndex) && chunksMap.has(targetChunkIndex)) {
    keepChunkIds.unshift(targetChunkIndex);
    seen.add(targetChunkIndex);
  }

  while (keepChunkIds.length > MAX_CACHED_CHUNKS) {
    let removableIndex = -1;
    for (let index = keepChunkIds.length - 1; index >= 0; index--) {
      if (!desiredChunkIds.includes(keepChunkIds[index])) {
        removableIndex = index;
        break;
      }
    }
    if (removableIndex === -1) break;
    keepChunkIds.splice(removableIndex, 1);
  }

  const keepSet = new Set(keepChunkIds);
  for (const chunkId of [...chunksMap.keys()]) {
    if (!keepSet.has(chunkId)) {
      chunksMap.delete(chunkId);
    }
  }
}

function mergeBufferedChunks(
  meta: SessionReplayData,
  chunkIds: number[],
  chunksMap: Map<number, LoadedChunk>
): SessionReplayData | null {
  const sortedIds = [...chunkIds].sort((a, b) => a - b).filter((id) => chunksMap.has(id));
  if (sortedIds.length === 0) return null;

  const timeParts: number[][] = [];
  const driverParts: Record<string, Partial<ReplayDriverData>[]> = {};

  for (const id of sortedIds) {
    const chunk = chunksMap.get(id)!;
    timeParts.push(chunk.time);
    for (const [code, driverData] of Object.entries(chunk.drivers)) {
      if (!driverParts[code]) driverParts[code] = [];
      driverParts[code].push(driverData);
    }
  }

  const mergedDrivers: Record<string, ReplayDriverData> = {};
  const driverCodes = new Set([
    ...Object.keys(meta.driver_colors || {}),
    ...Object.keys(driverParts),
  ]);

  for (const code of driverCodes) {
    const parts = driverParts[code] || [];
    mergedDrivers[code] = {
      x: ([] as number[]).concat(...parts.map((part) => part.x || [])),
      y: ([] as number[]).concat(...parts.map((part) => part.y || [])),
      dist: ([] as number[]).concat(...parts.map((part) => part.dist || [])),
      rel_dist: ([] as number[]).concat(...parts.map((part) => part.rel_dist || [])),
      speed: ([] as number[]).concat(...parts.map((part) => part.speed || [])),
      gear: ([] as number[]).concat(...parts.map((part) => part.gear || [])),
      drs: ([] as number[]).concat(...parts.map((part) => part.drs || [])),
      rpm: ([] as number[]).concat(...parts.map((part) => part.rpm || [])),
      lap: ([] as number[]).concat(...parts.map((part) => part.lap || [])),
      tyre: ([] as number[]).concat(...parts.map((part) => part.tyre || [])),
      throttle: ([] as number[]).concat(...parts.map((part) => part.throttle || [])),
      brake: ([] as number[]).concat(...parts.map((part) => part.brake || [])),
      gap: ([] as (string | null)[]).concat(...parts.map((part) => part.gap || [])),
      interval: ([] as (string | null)[]).concat(...parts.map((part) => part.interval || [])),
    };
  }

  return {
    ...meta,
    time: ([] as number[]).concat(...timeParts),
    drivers: mergedDrivers,
  };
}

function getContiguousLoadedDuration(
  manifest: ChunkManifest[],
  chunksMap: Map<number, LoadedChunk>,
  currentIndex: number
) {
  if (currentIndex < 0 || currentIndex >= manifest.length || !chunksMap.has(currentIndex)) {
    return 0;
  }

  let end = chunksMap.get(currentIndex)?.end ?? 0;
  for (let index = currentIndex + 1; index < manifest.length; index++) {
    const chunk = chunksMap.get(index);
    if (!chunk) break;
    end = chunk.end;
  }

  return end;
}

export function useChunkLoader(
  metadata: SessionReplayData | null,
  year: number,
  event: string,
  session: string,
  currentTime: number
) {
  const [state, setState] = useState<ChunkLoaderState>({
    replayData: null,
    loadedChunks: new Set(),
    totalChunks: 0,
    isBuffering: false,
    loadedDuration: 0,
  });

  const metadataRef = useRef<SessionReplayData | null>(null);
  const currentTimeRef = useRef(currentTime);
  const chunksMapRef = useRef<Map<number, LoadedChunk>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const fetchingSetRef = useRef<Set<number>>(new Set());
  const failedSetRef = useRef<Set<number>>(new Set());
  const generationRef = useRef(0);
  const targetChunkIndexRef = useRef(0);
  const desiredChunkIdsRef = useRef<number[]>([]);
  const backgroundChunkIdsRef = useRef<number[]>([]);
  const loadChunkRef = useRef<(chunkId: number) => Promise<void>>();

  const updateStateFromBuffer = useCallback(() => {
    const meta = metadataRef.current as SessionReplayMetadata | null;
    const manifest = meta?.chunk_manifest || [];
    const mergedChunkIds = [...chunksMapRef.current.keys()].sort((a, b) => a - b);
    const currentChunkIndex = targetChunkIndexRef.current;
    const replayData = meta
      ? mergeBufferedChunks(meta, mergedChunkIds, chunksMapRef.current)
      : null;
    const loadedDuration = getContiguousLoadedDuration(
      manifest,
      chunksMapRef.current,
      currentChunkIndex
    );
    const totalDuration = meta?.total_duration ?? manifest[manifest.length - 1]?.end ?? 0;
    const currentChunkLoaded = chunksMapRef.current.has(currentChunkIndex);
    const shouldBuffer =
      manifest.length > 0 &&
      currentTimeRef.current < totalDuration &&
      (!currentChunkLoaded || currentTimeRef.current + BUFFER_HEADROOM_SECONDS > loadedDuration);

    setState({
      replayData,
      loadedChunks: new Set(mergedChunkIds),
      totalChunks: manifest.length,
      isBuffering: shouldBuffer,
      loadedDuration,
    });
  }, []);

  const scheduleNextChunk = useCallback(() => {
    if (fetchingSetRef.current.size > 0) return;

    for (const chunkId of desiredChunkIdsRef.current) {
      if (chunksMapRef.current.has(chunkId)) continue;
      if (fetchingSetRef.current.has(chunkId)) continue;
      if (failedSetRef.current.has(chunkId)) continue;
      loadChunkRef.current?.(chunkId);
      return;
    }

    const meta = metadataRef.current as SessionReplayMetadata | null;
    const manifest = meta?.chunk_manifest || [];
    const currentChunkIndex = targetChunkIndexRef.current;
    const currentChunkLoaded = chunksMapRef.current.has(currentChunkIndex);
    const loadedDuration = getContiguousLoadedDuration(
      manifest,
      chunksMapRef.current,
      currentChunkIndex
    );
    const isPrimaryBufferHealthy =
      manifest.length > 0 &&
      currentChunkLoaded &&
      currentTimeRef.current + BUFFER_HEADROOM_SECONDS <= loadedDuration;

    if (!isPrimaryBufferHealthy) return;

    for (const chunkId of backgroundChunkIdsRef.current) {
      if (chunksMapRef.current.has(chunkId)) continue;
      if (fetchingSetRef.current.has(chunkId)) continue;
      if (failedSetRef.current.has(chunkId)) continue;
      loadChunkRef.current?.(chunkId);
      return;
    }
  }, []);

  const loadChunk = useCallback(
    async (chunkId: number) => {
      if (fetchingSetRef.current.has(chunkId) || chunksMapRef.current.has(chunkId)) return;

      const gen = generationRef.current;
      const signal = abortRef.current?.signal;
      fetchingSetRef.current.add(chunkId);
      updateStateFromBuffer();

      try {
        const chunk = await fetchChunkWithRetry(year, event, session, chunkId, signal);
        if (gen !== generationRef.current) return;

        chunksMapRef.current.set(chunkId, {
          time: chunk.time,
          drivers: chunk.drivers,
          start: chunk.start_time,
          end: chunk.end_time,
        });
        pruneCachedChunks(
          chunksMapRef.current,
          targetChunkIndexRef.current,
          desiredChunkIdsRef.current,
          backgroundChunkIdsRef.current
        );
        failedSetRef.current.delete(chunkId);
        updateStateFromBuffer();
      } catch (err) {
        if (gen !== generationRef.current) return;
        if (!signal?.aborted && !isAbortError(err)) {
          console.error(`Failed to load chunk ${chunkId}:`, err);
          failedSetRef.current.add(chunkId);
          updateStateFromBuffer();
        }
      } finally {
        if (gen === generationRef.current) {
          fetchingSetRef.current.delete(chunkId);
          scheduleNextChunk();
          updateStateFromBuffer();
        }
      }
    },
    [event, scheduleNextChunk, session, updateStateFromBuffer, year]
  );

  useEffect(() => {
    loadChunkRef.current = loadChunk;
  }, [loadChunk]);

  const alignBuffer = useCallback(
    (time: number, hardReset = false) => {
      const meta = metadataRef.current as SessionReplayMetadata | null;
      const manifest = meta?.chunk_manifest || [];
      if (manifest.length === 0) {
        setState({
          replayData: null,
          loadedChunks: new Set(),
          totalChunks: 0,
          isBuffering: false,
          loadedDuration: 0,
        });
        return;
      }

      const nextChunkIndex = getChunkIndexForTime(manifest, time);
      const desiredChunkIds = buildDesiredChunkIds(nextChunkIndex, manifest.length);
      const backgroundChunkIds = buildBackgroundChunkIds(
        nextChunkIndex,
        manifest.length,
        desiredChunkIds
      );
      const desiredSet = new Set(desiredChunkIds);
      const shouldResetFetches =
        hardReset || [...fetchingSetRef.current].some((chunkId) => !desiredSet.has(chunkId));

      if (shouldResetFetches) {
        generationRef.current += 1;
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        fetchingSetRef.current.clear();
        failedSetRef.current.clear();
      }

      targetChunkIndexRef.current = nextChunkIndex;
      desiredChunkIdsRef.current = desiredChunkIds;
      backgroundChunkIdsRef.current = backgroundChunkIds;

      pruneCachedChunks(chunksMapRef.current, nextChunkIndex, desiredChunkIds, backgroundChunkIds);

      updateStateFromBuffer();
      scheduleNextChunk();
    },
    [scheduleNextChunk, updateStateFromBuffer]
  );

  const seekTo = useCallback(
    (time: number) => {
      currentTimeRef.current = time;
      alignBuffer(time, true);
    },
    [alignBuffer]
  );

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
    if (!metadata) return;

    const meta = metadata as SessionReplayMetadata;
    const manifest = meta.chunk_manifest || [];
    if (manifest.length === 0) return;

    const currentChunkIndex = getChunkIndexForTime(manifest, currentTime);
    const currentChunkLoaded = chunksMapRef.current.has(currentChunkIndex);
    const shouldRealign =
      targetChunkIndexRef.current !== currentChunkIndex ||
      !currentChunkLoaded ||
      currentTime + BUFFER_HEADROOM_SECONDS > state.loadedDuration;

    if (shouldRealign) {
      alignBuffer(currentTime);
      return;
    }

    const totalDuration = meta.total_duration ?? manifest[manifest.length - 1]?.end ?? 0;
    const shouldBuffer =
      currentTime < totalDuration && currentTime + BUFFER_HEADROOM_SECONDS > state.loadedDuration;

    setState((prev) =>
      prev.isBuffering === shouldBuffer ? prev : { ...prev, isBuffering: shouldBuffer }
    );
  }, [alignBuffer, currentTime, metadata, state.loadedDuration]);

  useEffect(() => {
    if (!metadata) return;

    generationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    chunksMapRef.current.clear();
    fetchingSetRef.current.clear();
    failedSetRef.current.clear();
    desiredChunkIdsRef.current = [];
    backgroundChunkIdsRef.current = [];
    targetChunkIndexRef.current = 0;

    alignBuffer(currentTimeRef.current, true);

    return () => {
      abortRef.current?.abort();
    };
  }, [alignBuffer, metadata]);

  const checkBuffering = useCallback((time: number, isPlaying: boolean) => {
    const meta = metadataRef.current as SessionReplayMetadata | null;
    const manifest = meta?.chunk_manifest || [];
    if (!isPlaying || manifest.length === 0) return false;

    const totalDuration = meta?.total_duration ?? manifest[manifest.length - 1]?.end ?? 0;
    const currentChunkIndex = getChunkIndexForTime(manifest, time);
    const loadedDuration = getContiguousLoadedDuration(
      manifest,
      chunksMapRef.current,
      currentChunkIndex
    );
    const currentChunkLoaded = chunksMapRef.current.has(currentChunkIndex);
    const shouldBuffer =
      time < totalDuration &&
      (!currentChunkLoaded || time + BUFFER_HEADROOM_SECONDS > loadedDuration);

    setState((prev) =>
      prev.isBuffering === shouldBuffer ? prev : { ...prev, isBuffering: shouldBuffer }
    );
    return shouldBuffer;
  }, []);

  return {
    replayData: state.replayData,
    loadedChunks: state.loadedChunks,
    totalChunks: state.totalChunks,
    isBuffering: state.isBuffering,
    loadedDuration: state.loadedDuration,
    seekTo,
    checkBuffering,
    isFullyLoaded: false,
  };
}
