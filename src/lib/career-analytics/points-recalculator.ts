import {
  PointsSystemDefinition,
  RaceResult,
  RecalculationResult,
} from '@/lib/types/career-analytics';
import { POINTS_SYSTEMS } from './constants';

/**
 * Calculate points for a single race result under a given points system.
 *
 * Rules:
 * - DNF/DSQ → 0 points regardless of position
 * - Position outside scoring range → 0 points
 * - Sprint races use sprintPositions mapping (if available), otherwise 0
 * - Feature races use positions mapping
 * - Fastest lap bonus: awarded only if system has fastestLapBonus,
 *   result.fastestLap === true, AND finishPosition <= system.fastestLapBonus.topN
 */
export function calculateRacePoints(result: RaceResult, system: PointsSystemDefinition): number {
  // DNF gets 0 points regardless
  if (result.dnf) {
    return 0;
  }

  let points;

  if (result.raceType === 'sprint') {
    // Sprint races use the sprint mapping if available
    if (system.sprintPositions) {
      points = system.sprintPositions[result.finishPosition] ?? 0;
    } else {
      // No sprint mapping available for this system → 0 points for sprints
      return 0;
    }
  } else {
    // Feature race: use standard positions mapping
    points = system.positions[result.finishPosition] ?? 0;
  }

  // Fastest lap bonus: only for feature races with the bonus defined
  if (
    result.raceType === 'feature' &&
    system.fastestLapBonus &&
    result.fastestLap &&
    result.finishPosition <= system.fastestLapBonus.topN
  ) {
    points += system.fastestLapBonus.points;
  }

  return points;
}

/**
 * Recalculate an entire career's points under a different points system.
 *
 * Returns the original total, recalculated total, difference,
 * percentage difference, and a per-season breakdown.
 *
 * - percentageDiff = ((recalculated - original) / original) * 100
 * - If original = 0, percentageDiff = recalculated > 0 ? 100 : 0
 */
export function recalculateCareer(results: RaceResult[], systemId: string): RecalculationResult {
  const system = POINTS_SYSTEMS.find((s) => s.id === systemId);

  if (!system) {
    return {
      originalPoints: 0,
      recalculatedPoints: 0,
      difference: 0,
      percentageDiff: 0,
      seasonBreakdown: [],
    };
  }

  // Group results by season
  const seasonMap = new Map<number, { original: number; recalculated: number }>();

  let totalOriginal = 0;
  let totalRecalculated = 0;

  for (const result of results) {
    const recalcPoints = calculateRacePoints(result, system);

    if (!seasonMap.has(result.season)) {
      seasonMap.set(result.season, { original: 0, recalculated: 0 });
    }

    const seasonData = seasonMap.get(result.season)!;
    seasonData.original += result.points;
    seasonData.recalculated += recalcPoints;

    totalOriginal += result.points;
    totalRecalculated += recalcPoints;
  }

  const difference = totalRecalculated - totalOriginal;

  let percentageDiff: number;
  if (totalOriginal === 0) {
    percentageDiff = totalRecalculated > 0 ? 100 : 0;
  } else {
    percentageDiff = ((totalRecalculated - totalOriginal) / totalOriginal) * 100;
  }

  // Build season breakdown sorted by season ascending
  const seasonBreakdown = Array.from(seasonMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([season, data]) => ({
      season,
      original: data.original,
      recalculated: data.recalculated,
    }));

  return {
    originalPoints: totalOriginal,
    recalculatedPoints: totalRecalculated,
    difference,
    percentageDiff,
    seasonBreakdown,
  };
}
