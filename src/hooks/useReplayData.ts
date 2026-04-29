import { useMemo } from 'react';
import { SessionReplayData } from '@/lib/api';
import { DriverFrameState, FPS } from '@/components/replay/replay-utils';

function findTrackIndex(x: number, y: number, points: number[][]): number {
  if (!points || points.length === 0) return 0;
  const len = points.length;
  let bestIdx = 0;
  let minDistSq = Infinity;
  for (let i = 0; i < len; i += 3) {
    const px = points[i][0];
    const py = points[i][1];
    const dSq = (px - x) ** 2 + (py - y) ** 2;
    if (dSq < minDistSq) {
      minDistSq = dSq;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function useReplayData(data: SessionReplayData | null, currentTime: number) {
  const safeIndex = useMemo(() => {
    if (!data?.time?.length) return 0;
    const idx = Math.floor(currentTime * FPS);
    return Math.min(Math.max(0, idx), data.time.length - 1);
  }, [data?.time?.length, currentTime]);

  const currentFrameDrivers = useMemo(() => {
    if (!data) return {};
    const drivers: Record<string, DriverFrameState> = {};
    const pathPoints = data.circuit_points || [];
    const pathDists = data.circuit_distances || [];

    for (const [code, d] of Object.entries(data.drivers)) {
      const x = d.x[safeIndex];
      const y = d.y[safeIndex];
      const trackIdx = findTrackIndex(x, y, pathPoints);
      const refDist =
        pathDists.length > 0 && trackIdx < pathDists.length
          ? pathDists[trackIdx]
          : d.dist[safeIndex];

      drivers[code] = {
        x,
        y,
        dist: d.dist[safeIndex],
        ref_dist: refDist,
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
    for (const [code, d] of Object.entries(data.drivers)) {
      if (!d.tyre || !d.lap || safeIndex < 0) {
        result[code] = 0;
        continue;
      }
      const currentTyre = d.tyre[safeIndex];
      const currentLap = d.lap[safeIndex];
      let stintStartLap = currentLap;
      for (let i = safeIndex - 1; i >= 0; i--) {
        if (d.tyre[i] !== currentTyre) break;
        stintStartLap = d.lap[i];
      }
      result[code] = Math.max(1, currentLap - stintStartLap + 1);
    }
    return result;
  }, [data, safeIndex]);

  return {
    safeIndex,
    currentFrameDrivers,
    totalDuration,
    totalLaps,
    driverLapStartTimes,
    driverLapStartIndices,
    tyreAgeMap,
  };
}
