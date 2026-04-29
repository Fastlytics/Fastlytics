import { useState, useEffect, useCallback, useMemo } from 'react';
import { SessionReplayData } from '@/lib/api';
import { DriverFrameState, getDriverScore } from '@/components/replay/replay-utils';

interface LeaderboardItem {
  pos: number;
  code: string;
  originalCode?: string;
  x: number;
  y: number;
  ref_dist: number;
  dist?: number;
  speed: number;
  lap: number;
  tyre?: number;
  color?: string;
  bestLap?: {
    driver: string;
    lap: number;
    time_str: string;
    seconds: number;
    timestamp: number;
    compound: string;
  } | null;
}

export function useLeaderboard(
  data: SessionReplayData | null,
  activeDrivers: Record<string, DriverFrameState>,
  isRace: boolean,
  isPlaying: boolean,
  currentTime: number
) {
  const [leaderboardOrder, setLeaderboardOrder] = useState<string[]>([]);

  const getSortedOrder = useCallback(
    (drivers: Record<string, DriverFrameState>): string[] => {
      return Object.entries(drivers)
        .sort(([, a], [, b]) => {
          if ((a.dist ?? 0) < 200 && (b.dist ?? 0) < 200) {
            const gA = data?.driver_grid_positions?.[a.code ?? ''] ?? 99;
            const gB = data?.driver_grid_positions?.[b.code ?? ''] ?? 99;
            return gA - gB;
          }
          return getDriverScore(b) - getDriverScore(a);
        })
        .map(([code]) => code);
    },
    [data?.driver_grid_positions]
  );

  useEffect(() => {
    if (!data) return;

    if (!isPlaying || leaderboardOrder.length === 0) {
      const newOrder = getSortedOrder(activeDrivers);
      if (JSON.stringify(newOrder) !== JSON.stringify(leaderboardOrder)) {
        setLeaderboardOrder(newOrder); // eslint-disable-line react-hooks/set-state-in-effect -- initial sort
      }
      return;
    }

    const OVERTAKE_THRESHOLD = 0.5;
    const newOrder = [...leaderboardOrder];
    let swapped = false;

    for (let i = 0; i < newOrder.length - 1; i++) {
      const driverA = newOrder[i];
      const driverB = newOrder[i + 1];
      const dA = activeDrivers[driverA];
      const dB = activeDrivers[driverB];

      if (!dA || !dB) continue;

      if (dA.dist! < 200 && dB.dist! < 200) {
        const gA = data?.driver_grid_positions?.[driverA] ?? 99;
        const gB = data?.driver_grid_positions?.[driverB] ?? 99;
        if (gB < gA) {
          newOrder[i] = driverB;
          newOrder[i + 1] = driverA;
          swapped = true;
        }
        continue;
      }

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
  }, [activeDrivers, isPlaying, data, getSortedOrder, leaderboardOrder]);

  const timingStandings = useMemo(() => {
    if (isRace || !data?.completed_laps) return null;

    const lapsSoFar = data.completed_laps.filter((l) => l.timestamp <= currentTime);
    const bestLaps: Record<string, (typeof data.completed_laps)[0]> = {};
    for (const lap of lapsSoFar) {
      if (!bestLaps[lap.driver] || lap.seconds < bestLaps[lap.driver].seconds) {
        bestLaps[lap.driver] = lap;
      }
    }

    const allDrivers = Object.keys(data.drivers || {});
    const sorted = allDrivers.sort((a, b) => {
      const lapA = bestLaps[a];
      const lapB = bestLaps[b];
      if (lapA && lapB) return lapA.seconds - lapB.seconds;
      if (lapA) return -1;
      if (lapB) return 1;
      return a.localeCompare(b);
    });

    return { sorted, bestLaps };
  }, [data, currentTime, isRace]);

  const leaderboard = useMemo((): LeaderboardItem[] => {
    if (!data) return [];

    if (isRace) {
      if (!leaderboardOrder.length) return [];
      return leaderboardOrder
        .map((code, index) => {
          const d = activeDrivers[code];
          if (!d) return null;
          return {
            pos: index + 1,
            code,
            ...d,
            color: data.driver_colors[code] || '#fff',
            tyre: d.tyre,
            bestLap: null,
          };
        })
        .filter((d): d is LeaderboardItem => d !== null);
    }

    if (timingStandings) {
      const { sorted, bestLaps } = timingStandings;
      const items: LeaderboardItem[] = [];
      sorted.forEach((code) => {
        const d = activeDrivers[code];
        if (d) {
          items.push({
            pos: 0,
            code,
            ...d,
            color: data.driver_colors[code] || '#fff',
            bestLap: bestLaps[code] || null,
          });
        }
      });
      return items.map((d, i) => ({ ...d, pos: i + 1 }));
    }

    return [];
  }, [activeDrivers, data, isRace, timingStandings, leaderboardOrder]);

  const driverVisuals = useMemo(() => {
    if (!data || leaderboardOrder.length === 0)
      return { outStatus: {} as Record<string, boolean>, visibility: {} as Record<string, string> };

    const outStatus: Record<string, boolean> = {};
    let allBelowStopped = true;

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

    const visibility: Record<string, string> = {};
    leaderboardOrder.forEach((code) => {
      visibility[code] = outStatus[code] ? 'out-dimmed' : 'visible';
    });

    return { outStatus, visibility };
  }, [leaderboardOrder, currentTime, data]);

  return {
    leaderboardOrder,
    leaderboard,
    driverVisuals,
    timingStandings,
  };
}
