import { useCallback, useMemo } from 'react';
import { SessionReplayData } from '@/lib/api';
import { DriverFrameState, getGapSortKey } from '@/components/replay/replay-utils';

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
  gap?: string | null;
  interval?: string | null;
}

/**
 * Sort exclusively by official timing data:
 * 1. Grid position for the very start of the race (first ~200m)
 * 2. Gap-to-leader from F1 timing feed
 * 3. Drivers with missing timing data are pushed to the bottom
 */
function sortByOfficialTiming(
  drivers: Record<string, DriverFrameState>,
  gridPositions?: Record<string, number>
): string[] {
  return Object.entries(drivers)
    .sort(([codeA, a], [codeB, b]) => {
      // Start of race: use official grid positions
      if ((a.dist ?? 0) < 200 && (b.dist ?? 0) < 200) {
        const gA = gridPositions?.[codeA] ?? 99;
        const gB = gridPositions?.[codeB] ?? 99;
        return gA - gB;
      }

      // Official gap-to-leader sorting (never falls back to track position)
      return getGapSortKey(a.gap) - getGapSortKey(b.gap);
    })
    .map(([code]) => code);
}

export function useLeaderboard(
  data: SessionReplayData | null,
  activeDrivers: Record<string, DriverFrameState>,
  isRace: boolean,
  _isPlaying: boolean,
  currentTime: number
) {
  const outDrivers = useMemo(() => {
    const endTimes = data?.driver_end_times;
    if (!endTimes) return new Set<string>();
    const results = data?.session_results;
    const out = new Set<string>();
    for (const [code, endTime] of Object.entries(endTimes)) {
      if (currentTime <= endTime + 1) continue;
      const status = results?.[code]?.status;
      if (status === 'Finished' || status === 'Lapped') continue;
      out.add(code);
    }
    return out;
  }, [data?.driver_end_times, data?.session_results, currentTime]);

  const getSortedOrder = useCallback(
    (drivers: Record<string, DriverFrameState>): string[] => {
      const sorted = sortByOfficialTiming(drivers, data?.driver_grid_positions);

      const active = sorted.filter((c) => !outDrivers.has(c));
      const out = sorted.filter((c) => outDrivers.has(c));

      out.sort((a, b) => {
        const lapsA = drivers[a]?.lap ?? 0;
        const lapsB = drivers[b]?.lap ?? 0;
        if (lapsA !== lapsB) return lapsB - lapsA;
        const endA = data?.driver_end_times?.[a] ?? 0;
        const endB = data?.driver_end_times?.[b] ?? 0;
        return endB - endA;
      });

      return [...active, ...out];
    },
    [data?.driver_grid_positions, data?.driver_end_times, outDrivers]
  );

  const leaderboardOrder = useMemo(() => {
    if (!data) return [];
    return getSortedOrder(activeDrivers);
  }, [activeDrivers, data, getSortedOrder]);

  // For non-race sessions: sort by best lap time (official timing)
  // Only recompute when a new lap has actually been completed (not every frame)
  const relevantLapCount = useMemo(() => {
    if (isRace || !data?.completed_laps) return 0;
    // Binary search or linear scan for count of laps completed by currentTime
    const laps = data.completed_laps;
    let count = laps.length;
    for (let i = laps.length - 1; i >= 0; i--) {
      if (laps[i].timestamp <= currentTime) {
        count = i + 1;
        break;
      }
      count = i;
    }
    return count;
  }, [data, currentTime, isRace]);

  const timingStandings = useMemo(() => {
    if (isRace || !data?.completed_laps) return null;

    const completedLaps = data.completed_laps;
    const bestLaps: Record<string, (typeof completedLaps)[0]> = {};
    for (let i = 0; i < relevantLapCount; i++) {
      const lap = completedLaps[i];
      if (!bestLaps[lap.driver] || lap.seconds < bestLaps[lap.driver].seconds) {
        bestLaps[lap.driver] = lap;
      }
    }

    const allDrivers = Object.keys(data.drivers || {});
    const sorted = [...allDrivers].sort((a, b) => {
      const lapA = bestLaps[a];
      const lapB = bestLaps[b];
      if (lapA && lapB) return lapA.seconds - lapB.seconds;
      if (lapA) return -1;
      if (lapB) return 1;
      return a.localeCompare(b);
    });

    return { sorted, bestLaps };
  }, [data, relevantLapCount, isRace]);

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
        .filter((d) => d !== null) as LeaderboardItem[];
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
    const visibility: Record<string, string> = {};

    for (const code of leaderboardOrder) {
      const isOut = outDrivers.has(code);
      outStatus[code] = isOut;
      visibility[code] = isOut ? 'out-dimmed' : 'visible';
    }

    return { outStatus, visibility };
  }, [data, leaderboardOrder, outDrivers]);

  return {
    leaderboardOrder,
    leaderboard,
    driverVisuals,
    timingStandings,
  };
}
