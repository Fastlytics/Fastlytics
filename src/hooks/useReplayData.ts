import { useMemo, useRef } from 'react';
import { SessionReplayData } from '@/lib/api';
import { DriverFrameState } from '@/components/replay/replay-utils';

function findNearestTimeIndex(time: number, timeline: number[]): number {
  if (!timeline.length) return 0;
  if (time <= timeline[0]) return 0;
  if (time >= timeline[timeline.length - 1]) return timeline.length - 1;

  let low = 0;
  let high = timeline.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = timeline[mid];

    if (value === time) return mid;
    if (value < time) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return time - timeline[high] <= timeline[low] - time ? high : low;
}

function findFrameWindow(time: number, timeline: number[]) {
  if (!timeline.length) return { prevIndex: 0, nextIndex: 0, alpha: 0 };
  if (time <= timeline[0]) return { prevIndex: 0, nextIndex: 0, alpha: 0 };
  const lastIndex = timeline.length - 1;
  if (time >= timeline[lastIndex]) return { prevIndex: lastIndex, nextIndex: lastIndex, alpha: 0 };

  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = timeline[mid];

    if (value === time) return { prevIndex: mid, nextIndex: mid, alpha: 0 };
    if (value < time) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const prevIndex = Math.max(0, high);
  const nextIndex = Math.min(lastIndex, low);
  const start = timeline[prevIndex];
  const end = timeline[nextIndex];
  const alpha = end === start ? 0 : (time - start) / (end - start);

  return { prevIndex, nextIndex, alpha };
}

const lerp = (start: number, end: number, alpha: number) => start + (end - start) * alpha;

function interpolateArray(
  values: number[] | undefined,
  prevIndex: number,
  nextIndex: number,
  alpha: number,
  fallback = 0
) {
  if (!values?.length) return fallback;
  const start = values[prevIndex];
  const end = values[nextIndex];
  if (typeof start !== 'number') return fallback;
  if (typeof end !== 'number') return start;
  return lerp(start, end, alpha);
}

function stepArray<T>(values: T[] | undefined, index: number, fallback: T): T {
  if (!values?.length) return fallback;
  return values[index] ?? fallback;
}

/**
 * Compute nearest circuit-point index for a single driver at a single frame index.
 * Uses a locality hint (previous result) to keep it fast for sequential playback.
 */
function findNearestCircuitPoint(
  px: number,
  py: number,
  circuitPoints: number[][],
  hint: number
): number {
  const plen = circuitPoints.length;
  if (plen === 0) return 0;

  const SEARCH_WINDOW = 30;
  let bestIdx = hint;
  let bestDist = Infinity;

  // Local search around hint
  const localStart = Math.max(0, hint - SEARCH_WINDOW);
  const localEnd = Math.min(plen - 1, hint + SEARCH_WINDOW);
  for (let j = localStart; j <= localEnd; j++) {
    const dx = circuitPoints[j][0] - px;
    const dy = circuitPoints[j][1] - py;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      bestIdx = j;
    }
  }

  // If local search didn't find close match, do sparse global search
  if (bestDist > 100) {
    for (let j = 0; j < plen; j += 10) {
      const dx = circuitPoints[j][0] - px;
      const dy = circuitPoints[j][1] - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        bestIdx = j;
      }
    }
    // Refine around the sparse best
    const refineStart = Math.max(0, bestIdx - 10);
    const refineEnd = Math.min(plen - 1, bestIdx + 10);
    for (let j = refineStart; j <= refineEnd; j++) {
      const dx = circuitPoints[j][0] - px;
      const dy = circuitPoints[j][1] - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        bestIdx = j;
      }
    }
  }

  return bestIdx;
}

export function useReplayData(data: SessionReplayData | null, currentTime: number) {
  const timeline = data?.time;

  const safeIndex = useMemo(() => {
    if (!timeline?.length) return 0;
    return findNearestTimeIndex(currentTime, timeline);
  }, [timeline, currentTime]);

  const frameWindow = useMemo(() => {
    if (!timeline?.length) return { prevIndex: 0, nextIndex: 0, alpha: 0 };
    return findFrameWindow(currentTime, timeline);
  }, [timeline, currentTime]);

  // Compute track status for current frame on demand (O(statuses) which is tiny — typically <50 entries)
  const trackStatusAtFrame = useMemo(() => {
    if (!data?.time?.length || !data.track_statuses?.length) return '1';
    const t = data.time[safeIndex] ?? 0;
    const statuses = data.track_statuses;
    for (let i = statuses.length - 1; i >= 0; i--) {
      if (t >= statuses[i].start_time) {
        if (statuses[i].end_time === null || t <= statuses[i].end_time!) {
          return statuses[i].status;
        }
      }
    }
    return '1';
  }, [data, safeIndex]);

  // Provide a minimal array-like interface for backward compat with consumers
  // that index into trackStatusByFrame[safeIndex]
  const trackStatusByFrame = useMemo(() => {
    // Return a sparse array with just the current index populated
    const arr: string[] = [];
    arr[safeIndex] = trackStatusAtFrame;
    return arr;
  }, [safeIndex, trackStatusAtFrame]);

  // Track index hints for locality-based nearest-point search.
  const trackIndexHintsRef = useRef<Record<string, number>>({});

  const currentFrameDrivers = useMemo(() => {
    if (!data) return {};
    const drivers: Record<string, DriverFrameState> = {};
    const pathDists = data.circuit_distances || [];
    const circuitPoints = data.circuit_points || [];
    const { prevIndex, nextIndex, alpha } = frameWindow;

    for (const [code, d] of Object.entries(data.drivers)) {
      const x = interpolateArray(d.x, prevIndex, nextIndex, alpha, NaN);
      const y = interpolateArray(d.y, prevIndex, nextIndex, alpha, NaN);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

      // Lazy per-frame circuit point lookup using locality hint
      let trackIdx = 0;
      if (circuitPoints.length > 0) {
        /* eslint-disable react-hooks/refs */
        const hint = trackIndexHintsRef.current[code] ?? 0;
        trackIdx = findNearestCircuitPoint(x, y, circuitPoints, hint);
        trackIndexHintsRef.current[code] = trackIdx;
        /* eslint-enable react-hooks/refs */
      }

      const refDist =
        pathDists.length > 0 && trackIdx < pathDists.length
          ? pathDists[trackIdx]
          : interpolateArray(d.dist, prevIndex, nextIndex, alpha, 0);

      drivers[code] = {
        x,
        y,
        dist: interpolateArray(d.dist, prevIndex, nextIndex, alpha, 0),
        ref_dist: refDist,
        rel_dist: interpolateArray(d.rel_dist, prevIndex, nextIndex, alpha, 0),
        speed: interpolateArray(d.speed, prevIndex, nextIndex, alpha, 0),
        gear: stepArray(d.gear, prevIndex, 0),
        drs: stepArray(d.drs, prevIndex, 0),
        rpm: interpolateArray(d.rpm, prevIndex, nextIndex, alpha, 0),
        lap: stepArray(d.lap, prevIndex, 0),
        tyre: stepArray(d.tyre, prevIndex, 0),
        throttle: interpolateArray(d.throttle, prevIndex, nextIndex, alpha, 0),
        brake: interpolateArray(d.brake, prevIndex, nextIndex, alpha, 0),
        track_index: trackIdx,
        gap: stepArray(d.gap, prevIndex, null),
        interval: stepArray(d.interval, prevIndex, null),
      };
    }
    return drivers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, safeIndex, frameWindow]);

  const totalDuration = useMemo(() => {
    if (!data?.time?.length) return 0;
    return data.time[data.time.length - 1];
  }, [data]);

  const totalLaps = useMemo(() => {
    if (!data?.drivers) return 0;
    let maxLap = 0;
    for (const d of Object.values(data.drivers)) {
      if (d.lap && d.lap.length > 0) {
        const lastLap = d.lap[d.lap.length - 1];
        if (lastLap > maxLap) maxLap = lastLap;
      }
    }
    return maxLap;
  }, [data]);

  const driverLapStartTimes = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Record<number, number>> = {};
    for (const [code, d] of Object.entries(data.drivers)) {
      map[code] = {};
      let currentLap = -1;
      if (d.lap && data.time) {
        for (let i = 0; i < d.lap.length; i++) {
          const lap = d.lap[i];
          if (lap !== currentLap) {
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

  const driverLapStartIndices = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Record<number, number>> = {};
    for (const [code, d] of Object.entries(data.drivers)) {
      map[code] = {};
      if (d.lap) {
        let currentLap = -1000;
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

  const tyreAgeMap = useMemo(() => {
    if (!data?.drivers) return {};
    const result: Record<string, number> = {};
    const idx = frameWindow.prevIndex;
    for (const [code, d] of Object.entries(data.drivers)) {
      if (!d.tyre || !d.lap || idx >= d.tyre.length) {
        result[code] = 0;
        continue;
      }
      // Compute tyre age at current index by scanning back to find stint start
      const currentTyre = d.tyre[idx];
      const currentLap = d.lap[idx];
      let stintStartLap = currentLap;
      // Scan backwards (limited window) to find where tyre changed
      const scanStart = Math.max(0, idx - 5000); // ~3.3 minutes at 25fps
      for (let i = idx - 1; i >= scanStart; i--) {
        if (d.tyre[i] !== currentTyre) break;
        stintStartLap = d.lap[i];
      }
      result[code] = Math.max(1, currentLap - stintStartLap + 1);
    }
    return result;
  }, [data, frameWindow.prevIndex]);

  return {
    safeIndex,
    currentFrameDrivers,
    totalDuration,
    totalLaps,
    driverLapStartTimes,
    driverLapStartIndices,
    tyreAgeMap,
    trackStatusByFrame,
  };
}
