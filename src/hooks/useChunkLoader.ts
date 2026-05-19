import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import { fetchSessionReplayChunk, ReplayDriverData, ReplayDriversMap } from '@/lib/api';

interface ChunkManifest {
  id: number;
  start: number;
  end: number;
  count?: number;
}

interface ChunkLoaderMetadata {
  chunk_manifest?: ChunkManifest[];
  total_duration?: number;
  driver_colors?: Record<string, string>;
}

type ChunkFetcher = (
  year: number,
  event: string,
  session: string,
  chunkId: number,
  signal?: AbortSignal
) => Promise<{
  time: number[];
  drivers: ReplayDriversMap;
  start_time: number;
  end_time: number;
}>;

interface ChunkLoaderOptions {
  fetchChunk?: ChunkFetcher;
  keepAllChunks?: boolean;
  maxCachedChunks?: number;
  bufferAheadChunks?: number;
  bufferBehindChunks?: number;
  bufferHeadroomSeconds?: number;
}

type ChunkReplayData<TMeta extends ChunkLoaderMetadata> = TMeta & {
  time: number[];
  drivers: ReplayDriversMap;
};

interface ChunkLoaderState<TMeta extends ChunkLoaderMetadata> {
  replayData: ChunkReplayData<TMeta> | null;
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
const DEFAULT_BUFFER_BEHIND_CHUNKS = 1;
const DEFAULT_BUFFER_AHEAD_CHUNKS = 2;
const DEFAULT_BUFFER_HEADROOM_SECONDS = 15;
const DEFAULT_MAX_CACHED_CHUNKS = 10;

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
  fetchChunk: ChunkFetcher,
  year: number,
  event: string,
  session: string,
  chunkId: number,
  signal?: AbortSignal
) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchChunk(year, event, session, chunkId, signal);
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

  // Handle inter-chunk gaps: find the first chunk whose start is > time,
  // meaning we're in the gap just before it. Return that chunk index.
  const nextIndex = manifest.findIndex((chunk) => chunk.start > time);
  if (nextIndex > 0) return nextIndex;

  return manifest.length - 1;
}

function buildDesiredChunkIds(
  currentIndex: number,
  totalChunks: number,
  bufferAheadChunks: number,
  bufferBehindChunks: number
) {
  const ids: number[] = [];

  for (let offset = 0; offset <= bufferAheadChunks; offset++) {
    const id = currentIndex + offset;
    if (id >= 0 && id < totalChunks) ids.push(id);
  }

  for (let offset = 1; offset <= bufferBehindChunks; offset++) {
    const id = currentIndex - offset;
    if (id >= 0 && id < totalChunks) ids.push(id);
  }

  return ids;
}

function buildBackgroundChunkIds(
  currentIndex: number,
  totalChunks: number,
  desiredChunkIds: number[],
  bufferAheadChunks: number,
  bufferBehindChunks: number
) {
  const desiredSet = new Set(desiredChunkIds);
  const ids: number[] = [];

  for (let distance = 1; distance < totalChunks; distance++) {
    const ahead = currentIndex + bufferAheadChunks + distance;
    if (ahead < totalChunks && !desiredSet.has(ahead)) ids.push(ahead);

    const behind = currentIndex - bufferBehindChunks - distance;
    if (behind >= 0 && !desiredSet.has(behind)) ids.push(behind);
  }

  return ids;
}

function getChunkIdAtIndex(manifest: ChunkManifest[], index: number) {
  return manifest[index]?.id;
}

function pruneCachedChunks(
  chunksMap: Map<number, LoadedChunk>,
  manifest: ChunkManifest[],
  targetChunkIndex: number,
  desiredChunkIds: number[],
  backgroundChunkIds: number[],
  keepAllChunks: boolean,
  maxCachedChunks: number
) {
  if (keepAllChunks) return;

  const keepChunkIds: number[] = [];
  const seen = new Set<number>();

  for (const index of [...desiredChunkIds, ...backgroundChunkIds]) {
    const id = getChunkIdAtIndex(manifest, index);
    if (typeof id !== 'number') continue;
    if (!chunksMap.has(id) || seen.has(id)) continue;
    keepChunkIds.push(id);
    seen.add(id);
    if (keepChunkIds.length >= maxCachedChunks) break;
  }

  const targetChunkId = getChunkIdAtIndex(manifest, targetChunkIndex);
  if (
    typeof targetChunkId === 'number' &&
    !seen.has(targetChunkId) &&
    chunksMap.has(targetChunkId)
  ) {
    keepChunkIds.unshift(targetChunkId);
    seen.add(targetChunkId);
  }

  while (keepChunkIds.length > maxCachedChunks) {
    let removableIndex = -1;
    for (let index = keepChunkIds.length - 1; index >= 0; index--) {
      const keepIndex = manifest.findIndex((chunk) => chunk.id === keepChunkIds[index]);
      if (keepIndex !== -1 && !desiredChunkIds.includes(keepIndex)) {
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

function mergeBufferedChunks<TMeta extends ChunkLoaderMetadata>(
  meta: TMeta,
  manifest: ChunkManifest[],
  chunkIds: number[],
  chunksMap: Map<number, LoadedChunk>
): ChunkReplayData<TMeta> | null {
  const sortedIds = manifest
    .map((chunk) => chunk.id)
    .filter((id) => chunkIds.includes(id) && chunksMap.has(id));
  if (sortedIds.length === 0) return null;

  // Compute total length upfront to use TypedArray-like pre-allocation for number arrays
  let totalLength = 0;
  for (const id of sortedIds) {
    totalLength += chunksMap.get(id)!.time.length;
  }

  const mergedTime = new Array<number>(totalLength);
  const driverParts: Record<string, Partial<ReplayDriverData>[]> = {};
  let offset = 0;

  for (const id of sortedIds) {
    const chunk = chunksMap.get(id)!;
    const timeArr = chunk.time;
    for (let i = 0; i < timeArr.length; i++) {
      mergedTime[offset + i] = timeArr[i];
    }
    offset += timeArr.length;
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
      x: concatNumberArrays(
        parts.map((p) => p.x),
        totalLength
      ),
      y: concatNumberArrays(
        parts.map((p) => p.y),
        totalLength
      ),
      dist: concatNumberArrays(
        parts.map((p) => p.dist),
        totalLength
      ),
      rel_dist: concatNumberArrays(
        parts.map((p) => p.rel_dist),
        totalLength
      ),
      speed: concatNumberArrays(
        parts.map((p) => p.speed),
        totalLength
      ),
      gear: concatNumberArrays(
        parts.map((p) => p.gear),
        totalLength
      ),
      drs: concatNumberArrays(
        parts.map((p) => p.drs),
        totalLength
      ),
      rpm: concatNumberArrays(
        parts.map((p) => p.rpm),
        totalLength
      ),
      lap: concatNumberArrays(
        parts.map((p) => p.lap),
        totalLength
      ),
      tyre: concatNumberArrays(
        parts.map((p) => p.tyre),
        totalLength
      ),
      throttle: concatNumberArrays(
        parts.map((p) => p.throttle),
        totalLength
      ),
      brake: concatNumberArrays(
        parts.map((p) => p.brake),
        totalLength
      ),
      gap: ([] as (string | null)[]).concat(...parts.map((part) => part.gap || [])),
      interval: ([] as (string | null)[]).concat(...parts.map((part) => part.interval || [])),
    };
  }

  return {
    ...meta,
    time: mergedTime,
    drivers: mergedDrivers,
  };
}

/** Pre-allocate and fill a single array from multiple source arrays (avoids repeated .concat() allocations) */
function concatNumberArrays(sources: (number[] | undefined)[], _hintLength?: number): number[] {
  let total = 0;
  for (const src of sources) {
    if (src) total += src.length;
  }
  const result = new Array<number>(total);
  let offset = 0;
  for (const src of sources) {
    if (!src) continue;
    for (let i = 0; i < src.length; i++) {
      result[offset + i] = src[i];
    }
    offset += src.length;
  }
  return result;
}

/**
 * Incrementally appends new chunks to already-merged data.
 * Much faster than full re-merge: only copies the new chunk's arrays (one chunk = ~15K frames)
 * instead of re-copying all existing data (potentially 150K+ frames).
 */
function appendChunksToMerged<TMeta extends ChunkLoaderMetadata>(
  existing: ChunkReplayData<TMeta>,
  meta: TMeta,
  manifest: ChunkManifest[],
  newChunkIds: number[],
  chunksMap: Map<number, LoadedChunk>
): ChunkReplayData<TMeta> {
  // Sort new chunks by manifest order
  const orderedNewIds = manifest
    .map((m) => m.id)
    .filter((id) => newChunkIds.includes(id) && chunksMap.has(id));

  if (orderedNewIds.length === 0) return existing;

  // Collect new chunk data
  let newTimeLength = 0;
  const newDriverParts: Record<string, Partial<ReplayDriverData>[]> = {};

  for (const id of orderedNewIds) {
    const chunk = chunksMap.get(id)!;
    newTimeLength += chunk.time.length;
    for (const [code, driverData] of Object.entries(chunk.drivers)) {
      if (!newDriverParts[code]) newDriverParts[code] = [];
      newDriverParts[code].push(driverData);
    }
  }

  // Append time array
  const existingTime = existing.time;
  const mergedTime = new Array<number>(existingTime.length + newTimeLength);
  for (let i = 0; i < existingTime.length; i++) {
    mergedTime[i] = existingTime[i];
  }
  let offset = existingTime.length;
  for (const id of orderedNewIds) {
    const chunk = chunksMap.get(id)!;
    for (let i = 0; i < chunk.time.length; i++) {
      mergedTime[offset + i] = chunk.time[i];
    }
    offset += chunk.time.length;
  }

  // Append driver arrays
  const mergedDrivers: Record<string, ReplayDriverData> = {};
  const allCodes = new Set([
    ...Object.keys(existing.drivers),
    ...Object.keys(meta.driver_colors || {}),
    ...Object.keys(newDriverParts),
  ]);

  for (const code of allCodes) {
    const existingDriver = existing.drivers[code];
    const newParts = newDriverParts[code] || [];

    if (!existingDriver && newParts.length === 0) continue;

    if (newParts.length === 0 && existingDriver) {
      // No new data for this driver, reuse existing
      mergedDrivers[code] = existingDriver;
      continue;
    }

    const appendNum = (existing: number[], newSources: (number[] | undefined)[]): number[] => {
      let newLen = 0;
      for (const s of newSources) {
        if (s) newLen += s.length;
      }
      const result = new Array<number>(existing.length + newLen);
      for (let i = 0; i < existing.length; i++) result[i] = existing[i];
      let off = existing.length;
      for (const s of newSources) {
        if (!s) continue;
        for (let i = 0; i < s.length; i++) result[off + i] = s[i];
        off += s.length;
      }
      return result;
    };

    const appendStr = (
      existing: (string | null)[],
      newSources: ((string | null)[] | undefined)[]
    ): (string | null)[] => {
      const parts: (string | null)[][] = [existing];
      for (const s of newSources) {
        if (s) parts.push(s);
      }
      return ([] as (string | null)[]).concat(...parts);
    };

    const base = existingDriver || {
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
      gap: [],
      interval: [],
    };

    mergedDrivers[code] = {
      x: appendNum(
        base.x,
        newParts.map((p) => p.x)
      ),
      y: appendNum(
        base.y,
        newParts.map((p) => p.y)
      ),
      dist: appendNum(
        base.dist,
        newParts.map((p) => p.dist)
      ),
      rel_dist: appendNum(
        base.rel_dist,
        newParts.map((p) => p.rel_dist)
      ),
      speed: appendNum(
        base.speed,
        newParts.map((p) => p.speed)
      ),
      gear: appendNum(
        base.gear,
        newParts.map((p) => p.gear)
      ),
      drs: appendNum(
        base.drs,
        newParts.map((p) => p.drs)
      ),
      rpm: appendNum(
        base.rpm,
        newParts.map((p) => p.rpm)
      ),
      lap: appendNum(
        base.lap,
        newParts.map((p) => p.lap)
      ),
      tyre: appendNum(
        base.tyre,
        newParts.map((p) => p.tyre)
      ),
      throttle: appendNum(
        base.throttle,
        newParts.map((p) => p.throttle)
      ),
      brake: appendNum(
        base.brake,
        newParts.map((p) => p.brake)
      ),
      gap: appendStr(
        base.gap,
        newParts.map((p) => p.gap)
      ),
      interval: appendStr(
        base.interval,
        newParts.map((p) => p.interval)
      ),
    };
  }

  return {
    ...meta,
    time: mergedTime,
    drivers: mergedDrivers,
  };
}

function getContiguousLoadedDuration(
  manifest: ChunkManifest[],
  chunksMap: Map<number, LoadedChunk>,
  currentIndex: number
) {
  const currentChunkId = getChunkIdAtIndex(manifest, currentIndex);
  if (
    currentIndex < 0 ||
    currentIndex >= manifest.length ||
    typeof currentChunkId !== 'number' ||
    !chunksMap.has(currentChunkId)
  ) {
    return 0;
  }

  let end = chunksMap.get(currentChunkId)?.end ?? 0;
  for (let index = currentIndex + 1; index < manifest.length; index++) {
    const chunkId = getChunkIdAtIndex(manifest, index);
    if (typeof chunkId !== 'number') break;
    const chunk = chunksMap.get(chunkId);
    if (!chunk) break;
    end = chunk.end;
  }

  return end;
}

export function useChunkLoader<TMeta extends ChunkLoaderMetadata>(
  metadata: TMeta | null,
  year: number,
  event: string,
  session: string,
  currentTime: number,
  options?: ChunkLoaderOptions
) {
  const [state, setState] = useState<ChunkLoaderState<TMeta>>({
    replayData: null,
    loadedChunks: new Set(),
    totalChunks: 0,
    isBuffering: false,
    loadedDuration: 0,
  });

  const metadataRef = useRef<TMeta | null>(null);
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
  const lastMergedKeyRef = useRef('');
  const lastMergedDataRef = useRef<ChunkReplayData<TMeta> | null>(null);
  const fetchChunk = options?.fetchChunk ?? fetchSessionReplayChunk;
  const keepAllChunks = options?.keepAllChunks ?? false;
  const maxCachedChunks = options?.maxCachedChunks ?? DEFAULT_MAX_CACHED_CHUNKS;
  const bufferAheadChunks = options?.bufferAheadChunks ?? DEFAULT_BUFFER_AHEAD_CHUNKS;
  const bufferBehindChunks = options?.bufferBehindChunks ?? DEFAULT_BUFFER_BEHIND_CHUNKS;
  const bufferHeadroomSeconds = options?.bufferHeadroomSeconds ?? DEFAULT_BUFFER_HEADROOM_SECONDS;

  const mergeScheduledRef = useRef(false);
  const doMergeRef = useRef<() => void>();

  const doMergeAndSetState = useCallback(() => {
    const meta = metadataRef.current;
    const manifest = meta?.chunk_manifest || [];
    const mergedChunkIds = [...chunksMapRef.current.keys()].sort((a, b) => a - b);
    const currentChunkIndex = targetChunkIndexRef.current;

    // Only re-merge if the set of loaded chunks actually changed
    const mergeKey = mergedChunkIds.join(',');
    let replayData: ChunkReplayData<TMeta> | null;
    if (mergeKey === lastMergedKeyRef.current && lastMergedDataRef.current) {
      replayData = lastMergedDataRef.current;
    } else {
      // Check if the new key is just the old key + appended chunks (common during playback)
      const oldKey = lastMergedKeyRef.current;
      const isAppendOnly = oldKey.length > 0 && mergeKey.startsWith(oldKey + ',');

      if (isAppendOnly && lastMergedDataRef.current) {
        // Incremental merge: only append the new chunk(s) to existing merged data
        const oldIds = oldKey.split(',').map(Number);
        const newIds = mergedChunkIds.filter((id) => !oldIds.includes(id));
        replayData = appendChunksToMerged(
          lastMergedDataRef.current,
          meta!,
          manifest,
          newIds,
          chunksMapRef.current
        );
      } else {
        // Full rebuild (seek, eviction, or first load)
        replayData = meta
          ? mergeBufferedChunks(meta, manifest, mergedChunkIds, chunksMapRef.current)
          : null;
      }
      lastMergedKeyRef.current = mergeKey;
      lastMergedDataRef.current = replayData;
    }

    const loadedDuration = getContiguousLoadedDuration(
      manifest,
      chunksMapRef.current,
      currentChunkIndex
    );
    const totalDuration = meta?.total_duration ?? manifest[manifest.length - 1]?.end ?? 0;
    const currentChunkId = getChunkIdAtIndex(manifest, currentChunkIndex);
    const currentChunkLoaded =
      typeof currentChunkId === 'number' && chunksMapRef.current.has(currentChunkId);
    const shouldBuffer =
      manifest.length > 0 &&
      currentTimeRef.current < totalDuration &&
      (!currentChunkLoaded || currentTimeRef.current + bufferHeadroomSeconds > loadedDuration);

    setState({
      replayData,
      loadedChunks: new Set(mergedChunkIds),
      totalChunks: manifest.length,
      isBuffering: shouldBuffer,
      loadedDuration,
    });
  }, [bufferHeadroomSeconds]);

  useEffect(() => {
    doMergeRef.current = doMergeAndSetState;
  }, [doMergeAndSetState]);

  const updateStateFromBuffer = useCallback(() => {
    // Debounce: coalesce multiple rapid calls into a single merge on the next microtask
    if (mergeScheduledRef.current) return;
    mergeScheduledRef.current = true;
    queueMicrotask(() => {
      mergeScheduledRef.current = false;
      doMergeRef.current?.();
    });
  }, []);

  const scheduleNextChunk = useCallback(() => {
    if (fetchingSetRef.current.size > 0) return;

    const meta = metadataRef.current;
    const manifest = meta?.chunk_manifest || [];

    for (const chunkId of desiredChunkIdsRef.current) {
      const manifestChunkId = getChunkIdAtIndex(manifest, chunkId);
      if (typeof manifestChunkId !== 'number') continue;
      if (chunksMapRef.current.has(manifestChunkId)) continue;
      if (fetchingSetRef.current.has(chunkId)) continue;
      if (failedSetRef.current.has(chunkId)) continue;
      loadChunkRef.current?.(chunkId);
      return;
    }

    const currentChunkIndex = targetChunkIndexRef.current;
    const currentChunkId = getChunkIdAtIndex(manifest, currentChunkIndex);
    const currentChunkLoaded =
      typeof currentChunkId === 'number' && chunksMapRef.current.has(currentChunkId);
    const loadedDuration = getContiguousLoadedDuration(
      manifest,
      chunksMapRef.current,
      currentChunkIndex
    );
    const isPrimaryBufferHealthy =
      manifest.length > 0 &&
      currentChunkLoaded &&
      currentTimeRef.current + bufferHeadroomSeconds <= loadedDuration;

    if (!isPrimaryBufferHealthy) return;

    for (const chunkId of backgroundChunkIdsRef.current) {
      const manifestChunkId = getChunkIdAtIndex(manifest, chunkId);
      if (typeof manifestChunkId !== 'number') continue;
      if (chunksMapRef.current.has(manifestChunkId)) continue;
      if (fetchingSetRef.current.has(chunkId)) continue;
      if (failedSetRef.current.has(chunkId)) continue;
      loadChunkRef.current?.(chunkId);
      return;
    }
  }, [bufferHeadroomSeconds]);

  const loadChunk = useCallback(
    async (chunkIndex: number) => {
      const meta = metadataRef.current;
      const manifest = meta?.chunk_manifest || [];
      const chunkId = getChunkIdAtIndex(manifest, chunkIndex);
      if (typeof chunkId !== 'number') return;
      if (fetchingSetRef.current.has(chunkIndex) || chunksMapRef.current.has(chunkId)) return;

      const gen = generationRef.current;
      const signal = abortRef.current?.signal;
      fetchingSetRef.current.add(chunkIndex);
      updateStateFromBuffer();

      try {
        const chunk = await fetchChunkWithRetry(fetchChunk, year, event, session, chunkId, signal);
        if (gen !== generationRef.current) return;

        chunksMapRef.current.set(chunkId, {
          time: chunk.time,
          drivers: chunk.drivers,
          start: chunk.start_time,
          end: chunk.end_time,
        });
        pruneCachedChunks(
          chunksMapRef.current,
          manifest,
          targetChunkIndexRef.current,
          desiredChunkIdsRef.current,
          backgroundChunkIdsRef.current,
          keepAllChunks,
          maxCachedChunks
        );
        failedSetRef.current.delete(chunkIndex);
        updateStateFromBuffer();
      } catch (err) {
        if (gen !== generationRef.current) return;
        if (!signal?.aborted && !isAbortError(err)) {
          console.error(`Failed to load chunk ${chunkId}:`, err);
          Sentry.addBreadcrumb({
            category: 'replay.chunk',
            message: `Chunk ${chunkId} failed to load`,
            level: 'warning',
            data: { chunkId, chunkIndex, error: String(err) },
          });
          failedSetRef.current.add(chunkIndex);
          updateStateFromBuffer();
        }
      } finally {
        if (gen === generationRef.current) {
          fetchingSetRef.current.delete(chunkIndex);
          scheduleNextChunk();
          updateStateFromBuffer();
        }
      }
    },
    [
      event,
      fetchChunk,
      keepAllChunks,
      maxCachedChunks,
      scheduleNextChunk,
      session,
      updateStateFromBuffer,
      year,
    ]
  );

  useEffect(() => {
    loadChunkRef.current = loadChunk;
  }, [loadChunk]);

  const alignBuffer = useCallback(
    (time: number, hardReset = false) => {
      const meta = metadataRef.current;
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
      const desiredChunkIds = buildDesiredChunkIds(
        nextChunkIndex,
        manifest.length,
        bufferAheadChunks,
        bufferBehindChunks
      );
      const backgroundChunkIds = buildBackgroundChunkIds(
        nextChunkIndex,
        manifest.length,
        desiredChunkIds,
        bufferAheadChunks,
        bufferBehindChunks
      );
      const desiredSet = new Set(desiredChunkIds);
      const shouldResetFetches =
        hardReset ||
        (!keepAllChunks && [...fetchingSetRef.current].some((chunkId) => !desiredSet.has(chunkId)));

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

      pruneCachedChunks(
        chunksMapRef.current,
        manifest,
        nextChunkIndex,
        desiredChunkIds,
        backgroundChunkIds,
        keepAllChunks,
        maxCachedChunks
      );

      updateStateFromBuffer();
      scheduleNextChunk();
    },
    [
      bufferAheadChunks,
      bufferBehindChunks,
      keepAllChunks,
      maxCachedChunks,
      scheduleNextChunk,
      updateStateFromBuffer,
    ]
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

    const meta = metadata;
    const manifest = meta.chunk_manifest || [];
    if (manifest.length === 0) return;

    const currentChunkIndex = getChunkIndexForTime(manifest, currentTime);
    const currentChunkId = getChunkIdAtIndex(manifest, currentChunkIndex);
    const currentChunkLoaded =
      typeof currentChunkId === 'number' && chunksMapRef.current.has(currentChunkId);
    const shouldRealign =
      targetChunkIndexRef.current !== currentChunkIndex ||
      !currentChunkLoaded ||
      currentTime + bufferHeadroomSeconds > state.loadedDuration;

    if (shouldRealign) {
      alignBuffer(currentTime);
      return;
    }

    const totalDuration = meta.total_duration ?? manifest[manifest.length - 1]?.end ?? 0;
    const shouldBuffer =
      currentTime < totalDuration && currentTime + bufferHeadroomSeconds > state.loadedDuration;

    setState((prev) =>
      prev.isBuffering === shouldBuffer ? prev : { ...prev, isBuffering: shouldBuffer }
    );
  }, [alignBuffer, bufferHeadroomSeconds, currentTime, metadata, state.loadedDuration]);

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

  const checkBuffering = useCallback(
    (time: number, isPlaying: boolean) => {
      const meta = metadataRef.current;
      const manifest = meta?.chunk_manifest || [];
      if (!isPlaying || manifest.length === 0) return false;

      const totalDuration = meta?.total_duration ?? manifest[manifest.length - 1]?.end ?? 0;
      const currentChunkIndex = getChunkIndexForTime(manifest, time);
      const loadedDuration = getContiguousLoadedDuration(
        manifest,
        chunksMapRef.current,
        currentChunkIndex
      );
      const currentChunkId = getChunkIdAtIndex(manifest, currentChunkIndex);
      const currentChunkLoaded =
        typeof currentChunkId === 'number' && chunksMapRef.current.has(currentChunkId);
      const shouldBuffer =
        time < totalDuration &&
        (!currentChunkLoaded || time + bufferHeadroomSeconds > loadedDuration);

      setState((prev) =>
        prev.isBuffering === shouldBuffer ? prev : { ...prev, isBuffering: shouldBuffer }
      );
      return shouldBuffer;
    },
    [bufferHeadroomSeconds]
  );

  const isFullyLoaded = useMemo(() => {
    if (!metadata?.chunk_manifest || metadata.chunk_manifest.length === 0) return false;
    if (state.loadedChunks.size < metadata.chunk_manifest.length) return false;
    for (const chunk of metadata.chunk_manifest) {
      if (!state.loadedChunks.has(chunk.id)) return false;
    }
    return true;
  }, [metadata, state.loadedChunks]);

  return {
    replayData: state.replayData,
    loadedChunks: state.loadedChunks,
    totalChunks: state.totalChunks,
    isBuffering: state.isBuffering,
    loadedDuration: state.loadedDuration,
    seekTo,
    checkBuffering,
    isFullyLoaded,
  };
}
