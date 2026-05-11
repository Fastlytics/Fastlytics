import { EraMetadata, NormalizedStats } from '@/lib/types/career-analytics';

/**
 * Represents a single season of data for normalization.
 */
interface SeasonData {
  season: number;
  wins: number;
  podiums: number;
  points: number;
  races: number;
  position?: number | null;
}

/**
 * Returns the maximum points available for a single race win in the given season's points system.
 * This is the highest value in the pointsSystem mapping.
 *
 * Validates: Requirements 7.1
 */
export function getMaxPointsForSeason(eraMetadata: EraMetadata): number {
  const pointValues = Object.values(eraMetadata.pointsSystem);
  if (pointValues.length === 0) return 0;
  return Math.max(...pointValues);
}

/**
 * Normalizes a single season's stats using era metadata.
 *
 * Formulas:
 * - normalizedWinPct = (wins / races) * (gridSize / 20) * 100
 * - normalizedPodiumPct = (podiums / races) * (gridSize / 20) * 100
 * - normalizedPointsPct = (points / maxPossiblePoints) * 100
 *   where maxPossiblePoints = maxPointsForWin * racesPerSeason
 *
 * Validates: Requirements 7.1, 7.2, 7.3
 */
export function normalizeSeasonStats(
  seasonData: SeasonData,
  eraMetadata: EraMetadata
): { winPct: number; podiumPct: number; pointsPct: number } {
  const { wins, podiums, points, races } = seasonData;
  const { gridSize, racesPerSeason } = eraMetadata;

  // Avoid division by zero
  if (races === 0) {
    return { winPct: 0, podiumPct: 0, pointsPct: 0 };
  }

  const maxPointsForWin = getMaxPointsForSeason(eraMetadata);
  const maxPossiblePoints = maxPointsForWin * racesPerSeason;

  const normalizedWinPct = (wins / races) * (gridSize / 20) * 100;
  const normalizedPodiumPct = (podiums / races) * (gridSize / 20) * 100;
  const normalizedPointsPct = maxPossiblePoints > 0 ? (points / maxPossiblePoints) * 100 : 0;

  return {
    winPct: normalizedWinPct,
    podiumPct: normalizedPodiumPct,
    pointsPct: normalizedPointsPct,
  };
}

/**
 * Computes normalized stats across all seasons for a driver, using weighted averages.
 * Each season's normalized stats are weighted by the number of races in that season.
 *
 * The composite score is:
 *   compositeScore = (normalizedWinPct * 0.40) + (normalizedPodiumPct * 0.30) + (normalizedPointsPct * 0.30)
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.6, 7.7
 */
export function computeNormalizedStats(
  seasons: SeasonData[],
  eraMetadataList: EraMetadata[]
): NormalizedStats {
  // Build a lookup map for era metadata by season
  const eraMap = new Map<number, EraMetadata>();
  for (const era of eraMetadataList) {
    eraMap.set(era.season, era);
  }

  // Compute raw totals
  let totalWins = 0;
  let totalPodiums = 0;
  let totalPoints = 0;

  for (const season of seasons) {
    totalWins += season.wins;
    totalPodiums += season.podiums;
    totalPoints += season.points;
  }

  // Compute weighted average of normalized stats
  let totalRaces = 0;
  let weightedWinPct = 0;
  let weightedPodiumPct = 0;
  let weightedPointsPct = 0;

  for (const season of seasons) {
    const era = eraMap.get(season.season);
    if (!era) continue;

    const normalized = normalizeSeasonStats(season, era);
    const weight = season.races;

    weightedWinPct += normalized.winPct * weight;
    weightedPodiumPct += normalized.podiumPct * weight;
    weightedPointsPct += normalized.pointsPct * weight;
    totalRaces += weight;
  }

  // Compute final weighted averages
  const avgWinPct = totalRaces > 0 ? weightedWinPct / totalRaces : 0;
  const avgPodiumPct = totalRaces > 0 ? weightedPodiumPct / totalRaces : 0;
  const avgPointsPct = totalRaces > 0 ? weightedPointsPct / totalRaces : 0;

  // Composite score formula
  const compositeScore = avgWinPct * 0.4 + avgPodiumPct * 0.3 + avgPointsPct * 0.3;

  return {
    raw: { wins: totalWins, podiums: totalPodiums, points: totalPoints },
    normalized: {
      winPct: Math.round(avgWinPct * 100) / 100,
      podiumPct: Math.round(avgPodiumPct * 100) / 100,
      pointsPct: Math.round(avgPointsPct * 100) / 100,
    },
    compositeScore: Math.round(compositeScore * 100) / 100,
  };
}

/**
 * Ranks a list of drivers by their composite score in descending order.
 * Assigns allTimeRank to each driver's NormalizedStats (1 = highest score).
 *
 * Validates: Requirements 7.6, 7.7
 */
export function rankDrivers(
  driversStats: { slug: string; stats: NormalizedStats }[]
): { slug: string; stats: NormalizedStats }[] {
  // Sort by composite score descending
  const sorted = [...driversStats].sort((a, b) => b.stats.compositeScore - a.stats.compositeScore);

  // Assign ranks
  return sorted.map((driver, index) => ({
    slug: driver.slug,
    stats: {
      ...driver.stats,
      allTimeRank: index + 1,
    },
  }));
}
