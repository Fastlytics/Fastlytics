import { TrajectoryDataPoint, TrajectoryMetric } from '@/lib/types/career-analytics';

/**
 * Represents a single season of career data.
 * Works with both DriverSeason and TeamSeason shapes.
 */
interface SeasonData {
  season: number;
  points: number;
  wins: number;
  podiums: number;
  poles?: number;
  races: number;
  position?: number | null;
  team?: string;
}

/**
 * Default grid size used for position inversion when no explicit value is provided.
 */
const DEFAULT_MAX_POSITION = 20;

/**
 * Derives the metric value from a season based on the selected TrajectoryMetric.
 */
function deriveMetricValue(season: SeasonData, metric: TrajectoryMetric): number {
  switch (metric) {
    case 'points':
      return season.points;
    case 'wins':
      return season.wins;
    case 'podiums':
      return season.podiums;
    case 'poles':
      return season.poles ?? 0;
    case 'position':
      return season.position ?? 0;
    case 'winRate':
      if (season.races === 0) return 0;
      return (season.wins / season.races) * 100;
    case 'podiumRate':
      if (season.races === 0) return 0;
      return (season.podiums / season.races) * 100;
    default:
      return 0;
  }
}

/**
 * Computes trajectory data points from an array of season data for a given metric.
 *
 * For each season, produces a TrajectoryDataPoint with:
 * - season: the calendar year
 * - value: the derived metric value
 * - team: the team name (if available)
 * - position: the championship position (if available)
 *
 * Validates: Requirements 1.1, 1.6
 */
export function computeTrajectory(
  seasons: SeasonData[],
  metric: TrajectoryMetric
): TrajectoryDataPoint[] {
  return seasons.map((season) => ({
    season: season.season,
    value: deriveMetricValue(season, metric),
    team: season.team,
    position: season.position ?? undefined,
  }));
}

/**
 * Aligns multiple driver trajectories by calendar year.
 * Produces data points only for seasons where each driver was active.
 * Each driver's data points are filtered to include only their active seasons,
 * sharing a common x-axis of calendar years.
 *
 * Validates: Requirements 1.5
 */
export function alignCalendarYear(
  trajectories: Map<string, TrajectoryDataPoint[]>
): Map<string, TrajectoryDataPoint[]> {
  const result = new Map<string, TrajectoryDataPoint[]>();

  // Each driver keeps only their own active seasons — no filtering to intersection.
  // The common x-axis is the union of all years, but each driver only has data points
  // for seasons where they were active (have a season entry).
  for (const [driverId, dataPoints] of trajectories) {
    // Get the set of seasons this driver was active in
    const activeSeasons = new Set(dataPoints.map((dp) => dp.season));

    // Filter to only include data points for active seasons (identity for well-formed data)
    const aligned = dataPoints.filter((dp) => activeSeasons.has(dp.season));

    // Sort by season for consistent ordering
    aligned.sort((a, b) => a.season - b.season);

    result.set(driverId, aligned);
  }

  return result;
}

/**
 * Aligns multiple driver trajectories by career year.
 * Maps each driver's first season to year 1, second to year 2, etc.
 * This allows comparison of drivers who raced in different eras.
 *
 * Validates: Requirements 1.5 (career-year alignment)
 */
export function alignCareerYear(
  trajectories: Map<string, TrajectoryDataPoint[]>
): Map<string, TrajectoryDataPoint[]> {
  const result = new Map<string, TrajectoryDataPoint[]>();

  for (const [driverId, dataPoints] of trajectories) {
    // Sort by actual season year first
    const sorted = [...dataPoints].sort((a, b) => a.season - b.season);

    // Map to career year (1-indexed)
    const aligned = sorted.map((dp, index) => ({
      ...dp,
      season: index + 1,
    }));

    result.set(driverId, aligned);
  }

  return result;
}

/**
 * Inverts position values for the championship position metric.
 * Position 1 maps to the highest chart value, position N maps to the lowest.
 *
 * Formula: invertedValue = maxPosition + 1 - position
 *
 * For example with maxPosition=20:
 * - Position 1 → value 20 (top of chart)
 * - Position 20 → value 1 (bottom of chart)
 *
 * Data points with position value of 0 or undefined are left unchanged (value stays 0).
 *
 * Validates: Requirements 1.3
 */
export function invertPositionValues(
  dataPoints: TrajectoryDataPoint[],
  maxPosition: number = DEFAULT_MAX_POSITION
): TrajectoryDataPoint[] {
  return dataPoints.map((dp) => {
    if (dp.value === 0) {
      return dp;
    }
    return {
      ...dp,
      value: maxPosition + 1 - dp.value,
    };
  });
}
