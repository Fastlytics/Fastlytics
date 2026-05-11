import { ConsistencyMetrics, ConsistencyComparison } from '@/lib/types/career-analytics';

// Default max points for a single race win (current era: 25 points)
const DEFAULT_MAX_POINTS_FOR_WIN = 25;

/**
 * Rounds a number to 1 decimal place.
 */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Computes rate metrics from career summary data.
 *
 * winRate = round(wins / races * 100, 1)
 * podiumRate = round(podiums / races * 100, 1)
 * pointsPerRace = round(points / races, 1)
 * dnfRate = round(dnfs / races * 100, 1)
 */
export function computeRateMetrics(career: {
  races: number;
  wins: number;
  podiums: number;
  points: number;
  dnfs: number;
}): ConsistencyMetrics {
  const { races, wins, podiums, points, dnfs } = career;

  if (races <= 0) {
    return {
      winRate: 0,
      podiumRate: 0,
      pointsPerRace: 0,
      dnfRate: 0,
      compositeScore: 0,
    };
  }

  const winRate = round1((wins / races) * 100);
  const podiumRate = round1((podiums / races) * 100);
  const pointsPerRace = round1(points / races);
  const dnfRate = round1((dnfs / races) * 100);

  // Compute composite score using the full formula
  const normalizedPointsPerRace = (pointsPerRace / DEFAULT_MAX_POINTS_FOR_WIN) * 100;
  const invertedDnfRate = (1 - dnfRate / 100) * 100;
  // Default improvement factor for single computation without season data
  const improvementFactor = 50;

  const compositeScore = computeCompositeScore(
    podiumRate,
    normalizedPointsPerRace,
    invertedDnfRate,
    improvementFactor
  );

  return {
    winRate,
    podiumRate,
    pointsPerRace,
    dnfRate,
    compositeScore,
  };
}

/**
 * Computes the composite consistency score using the weighted formula:
 * compositeScore = podiumRate * 0.30 + normalizedPointsPerRace * 0.30 + invertedDnfRate * 0.20 + improvementFactor * 0.20
 *
 * Result is clamped to [0, 100] and rounded to 1 decimal place.
 */
export function computeCompositeScore(
  podiumRate: number,
  normalizedPointsPerRace: number,
  invertedDnfRate: number,
  improvementFactor: number
): number {
  const raw =
    podiumRate * 0.3 +
    normalizedPointsPerRace * 0.3 +
    invertedDnfRate * 0.2 +
    improvementFactor * 0.2;

  // Clamp to [0, 100]
  const clamped = Math.max(0, Math.min(100, raw));
  return round1(clamped);
}

/**
 * Computes the improvement factor from season-by-season pointsPerRace data.
 *
 * For each consecutive pair of seasons, compute the difference in pointsPerRace.
 * Average all differences, then normalize to 0-100 scale.
 *
 * If only 1 season: returns 50 (neutral).
 */
export function computeImprovementFactor(seasons: { pointsPerRace: number }[]): number {
  if (seasons.length <= 1) {
    return 50;
  }

  let totalDiff = 0;
  for (let i = 1; i < seasons.length; i++) {
    totalDiff += seasons[i].pointsPerRace - seasons[i - 1].pointsPerRace;
  }

  const avgDiff = totalDiff / (seasons.length - 1);

  // Normalize to 0-100 scale:
  // avgDiff can range from roughly -maxPointsForWin to +maxPointsForWin
  // Map this to 0-100 where 0 improvement = 50
  const normalized = 50 + (avgDiff / DEFAULT_MAX_POINTS_FOR_WIN) * 50;

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, round1(normalized)));
}

/**
 * Computes full ConsistencyMetrics including improvement factor from season data.
 */
export function computeFullConsistencyMetrics(
  career: {
    races: number;
    wins: number;
    podiums: number;
    points: number;
    dnfs: number;
  },
  seasons: { pointsPerRace: number }[]
): ConsistencyMetrics {
  const { races, wins, podiums, points, dnfs } = career;

  if (races <= 0) {
    return {
      winRate: 0,
      podiumRate: 0,
      pointsPerRace: 0,
      dnfRate: 0,
      compositeScore: 0,
    };
  }

  const winRate = round1((wins / races) * 100);
  const podiumRate = round1((podiums / races) * 100);
  const pointsPerRace = round1(points / races);
  const dnfRate = round1((dnfs / races) * 100);

  const normalizedPointsPerRace = (pointsPerRace / DEFAULT_MAX_POINTS_FOR_WIN) * 100;
  const invertedDnfRate = (1 - dnfRate / 100) * 100;
  const improvementFactor = computeImprovementFactor(seasons);

  const compositeScore = computeCompositeScore(
    podiumRate,
    normalizedPointsPerRace,
    invertedDnfRate,
    improvementFactor
  );

  return {
    winRate,
    podiumRate,
    pointsPerRace,
    dnfRate,
    compositeScore,
  };
}

/**
 * Compares a driver's consistency metrics to the era average.
 *
 * eraDrivers: array of career summaries for drivers who participated in at least
 * one of the same seasons as the selected driver.
 * Each entry should have: { races, wins, podiums, points, dnfs }
 *
 * Returns a ConsistencyComparison with the driver's metrics and the era average.
 * If fewer than 5 era drivers are available, returns null.
 */
export function compareToEraAverage(
  driverMetrics: ConsistencyMetrics,
  eraDrivers: { races: number; wins: number; podiums: number; points: number; dnfs: number }[]
): ConsistencyComparison | null {
  if (eraDrivers.length < 5) {
    return null;
  }

  // Compute average metrics across all era drivers
  let totalWinRate = 0;
  let totalPodiumRate = 0;
  let totalPointsPerRace = 0;
  let totalDnfRate = 0;

  for (const driver of eraDrivers) {
    if (driver.races <= 0) continue;
    totalWinRate += (driver.wins / driver.races) * 100;
    totalPodiumRate += (driver.podiums / driver.races) * 100;
    totalPointsPerRace += driver.points / driver.races;
    totalDnfRate += (driver.dnfs / driver.races) * 100;
  }

  const count = eraDrivers.filter((d) => d.races > 0).length;
  if (count < 5) return null;

  const avgWinRate = round1(totalWinRate / count);
  const avgPodiumRate = round1(totalPodiumRate / count);
  const avgPointsPerRace = round1(totalPointsPerRace / count);
  const avgDnfRate = round1(totalDnfRate / count);

  const normalizedPointsPerRace = (avgPointsPerRace / DEFAULT_MAX_POINTS_FOR_WIN) * 100;
  const invertedDnfRate = (1 - avgDnfRate / 100) * 100;
  const improvementFactor = 50; // neutral for averages

  const compositeScore = computeCompositeScore(
    avgPodiumRate,
    normalizedPointsPerRace,
    invertedDnfRate,
    improvementFactor
  );

  return {
    driver: driverMetrics,
    comparison: {
      winRate: avgWinRate,
      podiumRate: avgPodiumRate,
      pointsPerRace: avgPointsPerRace,
      dnfRate: avgDnfRate,
      compositeScore,
    },
    comparisonLabel: 'Era Average',
  };
}

/**
 * Compares a driver's consistency metrics to the all-time greats average.
 *
 * greatsMetrics: pre-computed ConsistencyMetrics for each all-time great driver.
 *
 * Returns a ConsistencyComparison with the driver's metrics and the greats average.
 */
export function compareToAllTimeGreats(
  driverMetrics: ConsistencyMetrics,
  greatsMetrics: ConsistencyMetrics[]
): ConsistencyComparison {
  if (greatsMetrics.length === 0) {
    return {
      driver: driverMetrics,
      comparison: {
        winRate: 0,
        podiumRate: 0,
        pointsPerRace: 0,
        dnfRate: 0,
        compositeScore: 0,
      },
      comparisonLabel: 'All-Time Greats',
    };
  }

  let totalWinRate = 0;
  let totalPodiumRate = 0;
  let totalPointsPerRace = 0;
  let totalDnfRate = 0;
  let totalCompositeScore = 0;

  for (const metrics of greatsMetrics) {
    totalWinRate += metrics.winRate;
    totalPodiumRate += metrics.podiumRate;
    totalPointsPerRace += metrics.pointsPerRace;
    totalDnfRate += metrics.dnfRate;
    totalCompositeScore += metrics.compositeScore;
  }

  const count = greatsMetrics.length;

  return {
    driver: driverMetrics,
    comparison: {
      winRate: round1(totalWinRate / count),
      podiumRate: round1(totalPodiumRate / count),
      pointsPerRace: round1(totalPointsPerRace / count),
      dnfRate: round1(totalDnfRate / count),
      compositeScore: round1(totalCompositeScore / count),
    },
    comparisonLabel: 'All-Time Greats',
  };
}
