import { useQuery } from '@tanstack/react-query';
import { fetchSpecificRaceResults, DetailedRaceResult } from '@/lib/api';

export interface LastRaceDetails {
  podium: {
    position: 1 | 2 | 3;
    driver: string;
    team: string;
    teamColor: string;
    gapToWinner?: string;
    gridPosition?: number;
    finalPosition: number;
  }[];
  pole?: { driver: string; lapTime: string };
  fastestLap?: { driver: string; lapTime: string };
  biggestGainer?: { driver: string; gridPos: number; finalPos: number };
  dnfCount: number;
}

/**
 * Fetches detailed race results for the most recent race and derives richer
 * stats: podium with gaps + grid delta, pole, fastest lap, biggest gainer, DNFs.
 */
export function useLastRaceDetails(selectedYear: number, lastRaceEvent: string | undefined) {
  return useQuery<LastRaceDetails>({
    queryKey: ['lastRaceDetails', selectedYear, lastRaceEvent],
    enabled: !!lastRaceEvent,
    queryFn: async () => {
      const slug = lastRaceEvent!.toLowerCase().replace(/\s+/g, '-');
      const results = await fetchSpecificRaceResults(selectedYear, slug, 'R');
      return computeLastRaceDetails(results);
    },
  });
}

export function computeLastRaceDetails(results: DetailedRaceResult[]): LastRaceDetails {
  // Drivers with a final position (finishers + classified lapped)
  const classified = results.filter((r) => r.position !== null && r.position !== undefined);

  // Sort by final position ascending
  classified.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));

  // Podium: top 3
  const top3 = classified.slice(0, 3);

  const podium = top3.map((r, i) => ({
    position: (i + 1) as 1 | 2 | 3,
    driver: r.fullName,
    team: r.team,
    teamColor: r.teamColor || 'gray',
    gapToWinner: i === 0 ? undefined : (r.time ?? undefined),
    gridPosition: r.gridPosition ?? undefined,
    finalPosition: r.position ?? i + 1,
  }));

  // Pole position — grid position 1
  const poleDriver = results.find((r) => r.gridPosition === 1);
  const pole = poleDriver
    ? {
        driver: poleDriver.fullName,
        lapTime: poleDriver.poleLapTimeValue || '—',
      }
    : undefined;

  // Fastest lap — where isFastestLap is true
  const fastestLapDriver = results.find((r) => r.isFastestLap);
  const fastestLap = fastestLapDriver
    ? {
        driver: fastestLapDriver.fullName,
        lapTime: fastestLapDriver.fastestLapTime || fastestLapDriver.fastestLapTimeValue || '—',
      }
    : undefined;

  // Biggest gainer — max (gridPosition - finalPosition), must be >= 3
  let biggestGainer: LastRaceDetails['biggestGainer'] | undefined;
  let maxGain = 0;
  for (const r of classified) {
    if (r.gridPosition == null || r.position == null) continue;
    const gain = r.gridPosition - r.position;
    if (gain > maxGain && gain >= 3) {
      maxGain = gain;
      biggestGainer = {
        driver: r.fullName,
        gridPos: r.gridPosition,
        finalPos: r.position,
      };
    }
  }

  // DNFs — non-empty status that isn't a classified finish
  const dnfCount = results.filter((r) => {
    const status = (r.status || '').toLowerCase();
    if (!status) return false;
    if (status.includes('finished')) return false;
    if (status.startsWith('+')) return false; // lapped finishers
    if (status.includes('lap')) return false;
    return true;
  }).length;

  return { podium, pole, fastestLap, biggestGainer, dnfCount };
}
