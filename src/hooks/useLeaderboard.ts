// knip-ignore
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
  const getSortedOrder = useCallback(
    (drivers: Record<string, DriverFrameState>): string[] => {
      return sortByOfficialTiming(drivers, data?.driver_grid_positions);
    },
    [data?.driver_grid_positions]
  );

  const leaderboardOrder = useMemo(() => {
    if (!data) return [];
    return getSortedOrder(activeDrivers);
  }, [activeDrivers, data, getSortedOrder]);

  // For non-race sessions: sort by best lap time (official timing)
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
      return leaderboardOrder.flatMap((code, index) => {
        const d = activeDrivers[code];
        if (!d) return [];
        return [
          {
            pos: index + 1,
            code,
            ...d,
            color: data.driver_colors[code] || '#fff',
            tyre: d.tyre,
            bestLap: null,
          },
        ];
      }) as LeaderboardItem[];
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
