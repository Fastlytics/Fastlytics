import {
  RaceResult,
  EraMetadata,
  PeakSeasonAnalysis,
  PeakRaceResult,
} from '@/lib/types/career-analytics';
import { getPointsPayingPositions } from './constants';

// Default grid size when era metadata is not available
const DEFAULT_GRID_SIZE = 20;

/**
 * Computes the position score for a championship finishing position.
 *
 * positionScore = max(0, 100 - ((position - 1) * (100 / gridSize)))
 *
 * Position 1 scores 100, and each subsequent position reduces the score
 * by (100 / gridSize). Scores below 0 are clamped to 0.
 */
export function computePositionScore(
  position: number,
  gridSize: number = DEFAULT_GRID_SIZE
): number {
  if (position < 1 || gridSize <= 0) {
    return 0;
  }
  const score = 100 - (position - 1) * (100 / gridSize);
  return Math.max(0, score);
}

/**
 * Identifies the peak season from an array of season summaries.
 *
 * Composite score = positionScore * 0.40 + winRate * 0.30 + pointsPct * 0.30
 *
 * Where:
 * - positionScore = max(0, 100 - ((position - 1) * (100 / gridSize)))
 * - winRate = (wins / races) * 100
 * - pointsPct = (points / maxPossiblePoints) * 100
 *   - maxPossiblePoints = maxPointsForWin * racesInSeason
 *
 * Tie-breaking: if two seasons have identical composite scores, the most recent one wins.
 *
 * @param seasons - Array of season summary objects
 * @param eraMetadata - Optional era metadata for grid size and points system lookups
 * @returns The peak season year and its composite score
 */
export function identifyPeakSeason(
  seasons: {
    season: number;
    position: number;
    wins: number;
    races: number;
    points: number;
  }[],
  eraMetadata?: EraMetadata[]
): { season: number; compositeScore: number } | null {
  if (!seasons || seasons.length === 0) {
    return null;
  }

  // Single-season edge case: return that season directly
  if (seasons.length === 1) {
    const s = seasons[0];
    const gridSize = getGridSizeForSeason(s.season, eraMetadata);
    const maxPointsForWin = getMaxPointsForWin(s.season, eraMetadata);
    const compositeScore = computeSeasonScore(
      s.position,
      s.wins,
      s.races,
      s.points,
      gridSize,
      maxPointsForWin
    );
    return { season: s.season, compositeScore };
  }

  let bestSeason: number | null = null;
  let bestScore = -1;

  for (const s of seasons) {
    const gridSize = getGridSizeForSeason(s.season, eraMetadata);
    const maxPointsForWin = getMaxPointsForWin(s.season, eraMetadata);
    const score = computeSeasonScore(
      s.position,
      s.wins,
      s.races,
      s.points,
      gridSize,
      maxPointsForWin
    );

    // Tie-breaking: most recent season wins (>=)
    if (
      score > bestScore ||
      (score === bestScore && (bestSeason === null || s.season > bestSeason))
    ) {
      bestScore = score;
      bestSeason = s.season;
    }
  }

  if (bestSeason === null) {
    return null;
  }

  return { season: bestSeason, compositeScore: bestScore };
}

/**
 * Classifies a race result into a category.
 *
 * Categories:
 * - 'win': finishPosition == 1
 * - 'p2': finishPosition == 2
 * - 'p3': finishPosition == 3
 * - 'dnf': dnf flag is true
 * - 'points': finishPosition <= pointsPayingPositions AND !dnf
 * - 'no_points': everything else
 */
export function classifyRaceResult(result: RaceResult, season: number): PeakRaceResult['category'] {
  if (result.dnf) {
    return 'dnf';
  }

  if (result.finishPosition === 1) {
    return 'win';
  }

  if (result.finishPosition === 2) {
    return 'p2';
  }

  if (result.finishPosition === 3) {
    return 'p3';
  }

  const pointsPayingPositions = getPointsPayingPositions(season);
  if (result.finishPosition <= pointsPayingPositions) {
    return 'points';
  }

  return 'no_points';
}

/**
 * Builds a partial PeakSeasonAnalysis from race results for the identified peak season.
 *
 * Returns the season, composite score, and classified race results.
 * Does NOT populate rival or cumulative points (those require additional data).
 */
export function buildPeakSeasonAnalysis(
  peakSeason: number,
  results: RaceResult[],
  eraMetadata?: EraMetadata[]
): Partial<PeakSeasonAnalysis> {
  // Filter results for the peak season (feature races only for main analysis)
  const seasonResults = results
    .filter((r) => r.season === peakSeason && r.raceType === 'feature')
    .sort((a, b) => a.round - b.round);

  const raceResults: PeakRaceResult[] = seasonResults.map((r) => ({
    round: r.round,
    circuit: r.circuit,
    gridPosition: r.gridPosition,
    finishPosition: r.finishPosition,
    points: r.points,
    fastestLap: r.fastestLap,
    category: classifyRaceResult(r, peakSeason),
  }));

  // Compute composite score for the peak season
  const wins = seasonResults.filter((r) => r.finishPosition === 1).length;
  const races = seasonResults.length;
  const points = seasonResults.reduce((sum, r) => sum + r.points, 0);
  const gridSize = getGridSizeForSeason(peakSeason, eraMetadata);
  const maxPointsForWin = getMaxPointsForWin(peakSeason, eraMetadata);

  // We need position data to compute the full score, but we may not have it
  // from race results alone. Return what we can.
  const cumulativePoints: number[] = [];
  let cumulative = 0;
  for (const r of seasonResults) {
    cumulative += r.points;
    cumulativePoints.push(cumulative);
  }

  return {
    season: peakSeason,
    raceResults,
    cumulativePoints,
  };
}

// === Internal Helpers ===

/**
 * Computes the composite season score.
 *
 * peakScore = positionScore * 0.40 + winRate * 0.30 + pointsPct * 0.30
 */
function computeSeasonScore(
  position: number,
  wins: number,
  races: number,
  points: number,
  gridSize: number,
  maxPointsForWin: number
): number {
  const positionScore = computePositionScore(position, gridSize);

  const winRate = races > 0 ? (wins / races) * 100 : 0;

  const maxPossiblePoints = maxPointsForWin * races;
  const pointsPct = maxPossiblePoints > 0 ? (points / maxPossiblePoints) * 100 : 0;

  return positionScore * 0.4 + winRate * 0.3 + pointsPct * 0.3;
}

/**
 * Gets the grid size for a given season from era metadata.
 * Falls back to DEFAULT_GRID_SIZE (20) if not found.
 */
function getGridSizeForSeason(season: number, eraMetadata?: EraMetadata[]): number {
  if (!eraMetadata || eraMetadata.length === 0) {
    return DEFAULT_GRID_SIZE;
  }
  const meta = eraMetadata.find((m) => m.season === season);
  return meta ? meta.gridSize : DEFAULT_GRID_SIZE;
}

/**
 * Gets the maximum points for a single race win from era metadata.
 * Falls back to 25 (current era) if not found.
 */
function getMaxPointsForWin(season: number, eraMetadata?: EraMetadata[]): number {
  if (!eraMetadata || eraMetadata.length === 0) {
    return 25;
  }
  const meta = eraMetadata.find((m) => m.season === season);
  if (!meta || !meta.pointsSystem) {
    return 25;
  }
  // The max points for a win is the value for position 1
  const winPoints = meta.pointsSystem[1];
  return winPoints || 25;
}
