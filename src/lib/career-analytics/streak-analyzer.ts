import { RaceResult, Streak, StreakAnalysis, StreakType } from '@/lib/types/career-analytics';
import { getPointsPayingPositions } from './constants';

/**
 * Sorts race results chronologically by season ASC, then round ASC.
 */
function sortChronologically(results: RaceResult[]): RaceResult[] {
  return [...results].sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.round - b.round;
  });
}

/**
 * Determines if a race result satisfies the condition for a given streak type.
 */
function satisfiesCondition(result: RaceResult, type: StreakType): boolean {
  switch (type) {
    case 'consecutive_wins':
      return !result.dnf && result.finishPosition === 1;
    case 'consecutive_podiums':
      return !result.dnf && result.finishPosition >= 1 && result.finishPosition <= 3;
    case 'consecutive_points':
      return (
        !result.dnf &&
        result.finishPosition >= 1 &&
        result.finishPosition <= getPointsPayingPositions(result.season)
      );
    case 'consecutive_dnfs':
      return result.dnf;
    case 'consecutive_no_podium':
      return result.dnf || result.finishPosition > 3;
    default:
      return false;
  }
}

/**
 * Detects if there's a gap (DNS/absence) between two consecutive race results.
 * A gap is detected when:
 * - Within the same season, rounds are not consecutive (round difference > 1)
 */
function hasGapBetween(prev: RaceResult, curr: RaceResult): boolean {
  if (prev.season === curr.season) {
    return curr.round - prev.round > 1;
  }
  // Cross-season: no gap detection (seasons naturally transition)
  return false;
}

/**
 * Builds a Streak object from a sequence of race results.
 */
function buildStreak(races: RaceResult[], type: StreakType): Streak {
  const first = races[0];
  const last = races[races.length - 1];
  const seasonsSet = new Set(races.map((r) => r.season));

  return {
    type,
    length: races.length,
    startRace: {
      season: first.season,
      round: first.round,
      circuit: first.circuit,
    },
    endRace: {
      season: last.season,
      round: last.round,
      circuit: last.circuit,
    },
    seasons: Array.from(seasonsSet).sort((a, b) => a - b),
    races: races.map((r) => ({
      circuit: r.circuit,
      position: r.finishPosition,
      points: r.points,
    })),
  };
}

/**
 * Detects all streaks of a given type from race results.
 *
 * Rules:
 * - Results are sorted chronologically before processing
 * - A streak requires minimum 2 consecutive races
 * - DNS/absence (gaps in round numbers within a season) breaks active streaks
 * - Only feature races are considered (sprint races excluded)
 * - Returns max 5 streaks sorted by length descending
 */
export function detectStreaksOfType(results: RaceResult[], type: StreakType): Streak[] {
  // Filter to feature races only and sort chronologically
  const sorted = sortChronologically(results.filter((r) => r.raceType === 'feature'));

  if (sorted.length === 0) return [];

  const streaks: Streak[] = [];
  let currentRun: RaceResult[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const race = sorted[i];

    // Check for gap (DNS/absence) breaking the streak
    if (i > 0 && hasGapBetween(sorted[i - 1], race)) {
      // Gap detected — finalize current run
      if (currentRun.length >= 2) {
        streaks.push(buildStreak(currentRun, type));
      }
      currentRun = [];
    }

    if (satisfiesCondition(race, type)) {
      currentRun.push(race);
    } else {
      // Condition not met — finalize current run
      if (currentRun.length >= 2) {
        streaks.push(buildStreak(currentRun, type));
      }
      currentRun = [];
    }
  }

  // Finalize any remaining run
  if (currentRun.length >= 2) {
    streaks.push(buildStreak(currentRun, type));
  }

  // Sort by length descending, take max 5
  streaks.sort((a, b) => b.length - a.length);
  return streaks.slice(0, 5);
}

/**
 * Analyzes all streak types for a set of race results.
 *
 * Returns:
 * - streaks: Record of all streak types with max 5 per type, sorted by length desc
 * - longestPositive: longest of (consecutive_wins, consecutive_podiums, consecutive_points)
 * - longestNegative: longest of (consecutive_dnfs, consecutive_no_podium)
 */
export function analyzeStreaks(results: RaceResult[]): StreakAnalysis {
  const allTypes: StreakType[] = [
    'consecutive_podiums',
    'consecutive_points',
    'consecutive_wins',
    'consecutive_dnfs',
    'consecutive_no_podium',
  ];

  const streaks: Record<StreakType, Streak[]> = {
    consecutive_podiums: [],
    consecutive_points: [],
    consecutive_wins: [],
    consecutive_dnfs: [],
    consecutive_no_podium: [],
  };

  for (const type of allTypes) {
    streaks[type] = detectStreaksOfType(results, type);
  }

  // Find longest positive streak (wins, podiums, points)
  const positiveTypes: StreakType[] = [
    'consecutive_wins',
    'consecutive_podiums',
    'consecutive_points',
  ];
  let longestPositive: Streak | null = null;
  for (const type of positiveTypes) {
    const topStreak = streaks[type][0];
    if (topStreak && (!longestPositive || topStreak.length > longestPositive.length)) {
      longestPositive = topStreak;
    }
  }

  // Find longest negative streak (dnfs, no_podium)
  const negativeTypes: StreakType[] = ['consecutive_dnfs', 'consecutive_no_podium'];
  let longestNegative: Streak | null = null;
  for (const type of negativeTypes) {
    const topStreak = streaks[type][0];
    if (topStreak && (!longestNegative || topStreak.length > longestNegative.length)) {
      longestNegative = topStreak;
    }
  }

  return {
    streaks,
    longestPositive,
    longestNegative,
  };
}
