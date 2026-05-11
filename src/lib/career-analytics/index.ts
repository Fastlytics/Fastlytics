// Career Analytics Module - Barrel File
// Re-exports all computation modules and constants

export {
  POINTS_SYSTEMS,
  ALL_TIME_GREATS,
  ERA_POINTS_THRESHOLDS,
  getPointsPayingPositions,
  getPointsSystem,
} from './constants';

export type { AllTimeGreatDriver, EraPointsThreshold } from './constants';

export { extractStints, classifyMovement, analyzeMovements } from './movement-analyzer';

export {
  getMaxPointsForSeason,
  normalizeSeasonStats,
  computeNormalizedStats,
  rankDrivers,
} from './era-normalizer';

export {
  computeRateMetrics,
  computeCompositeScore,
  computeImprovementFactor,
  computeFullConsistencyMetrics,
  compareToEraAverage,
  compareToAllTimeGreats,
} from './consistency-scorer';

export {
  computeTrajectory,
  alignCalendarYear,
  alignCareerYear,
  invertPositionValues,
} from './trajectory';

export {
  computePositionScore,
  identifyPeakSeason,
  classifyRaceResult,
  buildPeakSeasonAnalysis,
} from './peak-season';

export { analyzeStreaks, detectStreaksOfType } from './streak-analyzer';

export { calculateRacePoints, recalculateCareer } from './points-recalculator';
