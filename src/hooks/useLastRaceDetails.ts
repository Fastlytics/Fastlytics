import { useQuery } from '@tanstack/react-query';
import { fetchSpecificRaceResults, DetailedRaceResult } from '@/lib/api';

export interface LastRaceDetails {
  podium: {
    position: 1 | 2 | 3;
    driver: string;
    driverCode: string;
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

function formatGapToWinner(time: string | null | undefined): string | undefined {
  if (!time) return undefined;
  // Already formatted (e.g. "+3.264" or "+1 Lap")
  if (time.startsWith('+') && !time.includes(':')) return time;
  if (time.includes('Lap')) return `+${time}`;

  const parts = time.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      const decimalPlaces = parts[1].includes('.') ? parts[1].split('.')[1].length : 0;
      const total = mins * 60 + secs;
      return `+${total.toFixed(decimalPlaces)}`;
    }
  }
  // h:mm:ss.sss format
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseFloat(parts[2]);
    if (!isNaN(hours) && !isNaN(mins) && !isNaN(secs)) {
      const decimalPlaces = parts[2].includes('.') ? parts[2].split('.')[1].length : 0;
      const total = hours * 3600 + mins * 60 + secs;
      return `+${total.toFixed(decimalPlaces)}`;
    }
  }
  return `+${time}`;
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
    driverCode: r.driverCode,
    team: r.team,
    teamColor: r.teamColor || 'gray',
    gapToWinner: i === 0 ? undefined : formatGapToWinner(r.time),
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
