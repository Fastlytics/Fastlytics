import { useMemo } from 'react';
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
 * Pre-compute nearest circuit-point index for every driver at every frame.
 * Uses locality heuristic: starts search from previous best index since cars
 * move continuously along the track, reducing O(frames × points) to ~O(frames × localWindow).
 */
function buildTrackIndices(
  drivers: SessionReplayData['drivers'],
  circuitPoints: number[][]
): Record<string, number[]> {
  if (!circuitPoints || circuitPoints.length === 0) return {};
  const result: Record<string, number[]> = {};
  const plen = circuitPoints.length;
  // Search window around previous best — cars move ~1-3 circuit points per frame
  const SEARCH_WINDOW = 30;

  for (const [code, d] of Object.entries(drivers)) {
    if (!d.x || !d.y) continue;
    const len = d.x.length;
    const arr = new Array<number>(len);
    let prevBest = 0;

    for (let i = 0; i < len; i++) {
      const px = d.x[i];
      const py = d.y[i];
      let bestIdx = prevBest;
      let bestDist = Infinity;

      // First: search local window around previous best (handles normal movement)
      const localStart = Math.max(0, prevBest - SEARCH_WINDOW);
      const localEnd = Math.min(plen - 1, prevBest + SEARCH_WINDOW);
      for (let j = localStart; j <= localEnd; j++) {
        const dx = circuitPoints[j][0] - px;
        const dy = circuitPoints[j][1] - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          bestIdx = j;
        }
      }

      // If local search found something close enough (< 100 units²), use it
      // Otherwise fall back to sparse global search (every 10th point)
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

      arr[i] = bestIdx;
      prevBest = bestIdx;
    }
    result[code] = arr;
  }
  return result;
}

/** Pre-compute tyre age for every driver at every frame in a single forward pass. */
function buildTyreAges(drivers: SessionReplayData['drivers']): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const [code, d] of Object.entries(drivers)) {
    if (!d.tyre || !d.lap) continue;
    const len = d.tyre.length;
    const arr = new Array<number>(len);
    let stintStartLap = d.lap[0];
    let currentTyre = d.tyre[0];
    for (let i = 0; i < len; i++) {
      if (d.tyre[i] !== currentTyre) {
        currentTyre = d.tyre[i];
        stintStartLap = d.lap[i];
      }
      arr[i] = Math.max(1, d.lap[i] - stintStartLap + 1);
    }
    result[code] = arr;
  }
  return result;
}

/** Pre-compute active track-status code for every frame. */
function buildTrackStatusByFrame(
  time: number[],
  trackStatuses: SessionReplayData['track_statuses']
): string[] {
  if (!time.length) return [];
  const result = new Array<string>(time.length);
  let statusIdx = 0;
  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    while (
      statusIdx < trackStatuses.length &&
      trackStatuses[statusIdx].end_time !== null &&
      trackStatuses[statusIdx].end_time! < t
    ) {
      statusIdx++;
    }
    const active =
      statusIdx < trackStatuses.length &&
      t >= trackStatuses[statusIdx].start_time &&
      (trackStatuses[statusIdx].end_time === null || t <= trackStatuses[statusIdx].end_time)
        ? trackStatuses[statusIdx].status
        : '1'; // default green
    result[i] = active;
  }
  return result;
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

  // Pre-compute expensive lookups once when data changes (enrich-on-merge)
  const precomputed = useMemo(() => {
    if (!data) {
      return {
        trackIndices: {} as Record<string, number[]>,
        tyreAges: {} as Record<string, number[]>,
        trackStatusByFrame: [] as string[],
      };
    }
    return {
      trackIndices: buildTrackIndices(data.drivers, data.circuit_points || []),
      tyreAges: buildTyreAges(data.drivers),
      trackStatusByFrame: buildTrackStatusByFrame(data.time || [], data.track_statuses || []),
    };
  }, [data]);

  const currentFrameDrivers = useMemo(() => {
    if (!data) return {};
    const drivers: Record<string, DriverFrameState> = {};
    const pathDists = data.circuit_distances || [];
    const { trackIndices } = precomputed;
    const { prevIndex, nextIndex, alpha } = frameWindow;

    for (const [code, d] of Object.entries(data.drivers)) {
      const x = interpolateArray(d.x, prevIndex, nextIndex, alpha, NaN);
      const y = interpolateArray(d.y, prevIndex, nextIndex, alpha, NaN);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

      const trackIdx = trackIndices[code]?.[safeIndex] ?? 0;
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
  }, [data, safeIndex, precomputed, frameWindow]);

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
    for (const [code] of Object.entries(data.drivers)) {
      result[code] = precomputed.tyreAges[code]?.[frameWindow.prevIndex] ?? 0;
    }
    return result;
  }, [data, frameWindow.prevIndex, precomputed.tyreAges]);

  return {
    safeIndex,
    currentFrameDrivers,
    totalDuration,
    totalLaps,
    driverLapStartTimes,
    driverLapStartIndices,
    tyreAgeMap,
    trackStatusByFrame: precomputed.trackStatusByFrame,
  };
}
