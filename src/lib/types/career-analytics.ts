// === API Response Types ===

export interface TeammateSeasonData {
  season: number;
  teammate: {
    code: string;
    name: string;
  };
  qualifying: { driver: number; teammate: number };
  races: { driver: number; teammate: number };
  pointsDiff: number;
  raceRange?: string; // e.g., "R1-R12" for mid-season changes
}

export interface TeammateComparisonResponse {
  seasons: TeammateSeasonData[];
}

export interface RaceResult {
  season: number;
  round: number;
  circuit: string;
  gridPosition: number;
  finishPosition: number;
  points: number;
  fastestLap: boolean;
  dnf: boolean;
  raceType: 'feature' | 'sprint';
}

export interface RaceResultsResponse {
  results: RaceResult[];
}

export interface Milestone {
  type:
    | 'first_race'
    | 'first_points'
    | 'first_podium'
    | 'first_win'
    | 'first_pole'
    | 'championship'
    | 'team_change'
    | 'race_milestone'
    | 'career_end';
  date: string; // ISO 8601
  season: number;
  round: number;
  circuit: string;
  description: string;
  context?: Record<string, string | number>;
}

export interface MilestoneResponse {
  milestones: Milestone[];
}

export interface EraMetadata {
  season: number;
  gridSize: number;
  racesPerSeason: number;
  pointsSystem: Record<number, number>;
  hasSprints: boolean;
}

export interface EraMetadataResponse {
  seasons: EraMetadata[];
}

export interface FingerprintScores {
  brakingStyle: number; // 0-100, >50 = later braker
  throttleApplication: number; // 0-100, >50 = smoother
  corneringApproach: number; // 0-100, trail-braking tendency
  tireManagement: number; // 0-100, >50 = less degradation
  wetWeatherAbility: number; // 0-100, >50 = better in wet
  overtakingStyle: number; // 0-100, >50 = more positions gained
}

export interface FingerprintMetadata {
  seasonsCovered: number[];
  totalLapCount: number;
  lastComputed: string; // ISO 8601
}

export interface FingerprintResponse {
  scores: FingerprintScores;
  metadata: FingerprintMetadata;
}

// === Frontend Computation Types ===

export interface PointsSystemDefinition {
  id: string;
  name: string;
  era: string;
  positions: Record<number, number>;
  fastestLapBonus?: { points: number; topN: number };
  sprintPositions?: Record<number, number>;
}

export interface TrajectoryDataPoint {
  season: number;
  value: number;
  team?: string;
  position?: number;
}

export type TrajectoryMetric =
  | 'points'
  | 'wins'
  | 'podiums'
  | 'poles'
  | 'position'
  | 'winRate'
  | 'podiumRate';

export interface ConsistencyMetrics {
  winRate: number;
  podiumRate: number;
  pointsPerRace: number;
  dnfRate: number;
  compositeScore: number; // 0-100
}

export interface ConsistencyComparison {
  driver: ConsistencyMetrics;
  comparison: ConsistencyMetrics;
  comparisonLabel: string;
}

export interface TeamStint {
  team: string;
  teamColor: string;
  startYear: number;
  endYear: number;
  races: number;
  wins: number;
  podiums: number;
  pointsPerRace: number;
  positions: number[];
}

export interface MovementIndicator {
  from: string;
  to: string;
  direction: 'improved' | 'declined' | 'lateral';
}

export type StreakType =
  | 'consecutive_podiums'
  | 'consecutive_points'
  | 'consecutive_wins'
  | 'consecutive_dnfs'
  | 'consecutive_no_podium';

export interface Streak {
  type: StreakType;
  length: number;
  startRace: { season: number; round: number; circuit: string };
  endRace: { season: number; round: number; circuit: string };
  seasons: number[];
  races: { circuit: string; position: number; points: number }[];
}

export interface StreakAnalysis {
  streaks: Record<StreakType, Streak[]>; // max 5 per type, sorted by length desc
  longestPositive: Streak | null;
  longestNegative: Streak | null;
}

export interface PeakSeasonAnalysis {
  season: number;
  compositeScore: number;
  raceResults: PeakRaceResult[];
  rival: { name: string; code: string };
  cumulativePoints: number[];
  rivalCumulativePoints: number[];
}

export interface PeakRaceResult {
  round: number;
  circuit: string;
  gridPosition: number;
  finishPosition: number;
  points: number;
  fastestLap: boolean;
  category: 'win' | 'p2' | 'p3' | 'points' | 'no_points' | 'dnf';
}

export interface NormalizedStats {
  raw: { wins: number; podiums: number; points: number };
  normalized: { winPct: number; podiumPct: number; pointsPct: number };
  compositeScore: number;
  allTimeRank?: number;
}

export interface RecalculationResult {
  originalPoints: number;
  recalculatedPoints: number;
  difference: number;
  percentageDiff: number;
  seasonBreakdown: {
    season: number;
    original: number;
    recalculated: number;
  }[];
}

export type AlignmentMode = 'calendar' | 'career';

export interface ComparisonEntity {
  slug: string;
  name: string;
}

// === Component Prop Types ===

export interface TrajectoryChartProps {
  career: unknown; // DriverCareer | TeamCareer from existing types
  entityType: 'driver' | 'team';
}

export interface TeammateComparisonProps {
  slug: string;
}

export interface WhatIfPointsProps {
  slug: string;
}

export interface MilestonesTimelineProps {
  slug: string;
  entityType: 'driver' | 'team';
}

export interface ConsistencyScoreProps {
  career: unknown; // DriverCareer | TeamCareer from existing types
  entityType: 'driver' | 'team';
}

export interface MovementMapProps {
  career: unknown; // DriverCareer | TeamCareer from existing types
  entityType: 'driver' | 'team';
}

export interface EraRankingsProps {
  career: unknown; // DriverCareer | TeamCareer from existing types
  entityType: 'driver' | 'team';
}

export interface FormStreaksProps {
  slug: string;
}

export interface CareerComparisonProps {
  entityType: 'driver' | 'team';
  initialSlug?: string;
}

export interface PeakSeasonProps {
  slug: string;
  entityType: 'driver' | 'team';
}

export interface DrivingFingerprintProps {
  slug: string;
}

export interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export interface AnalyticsSubNavProps {
  sections: { id: string; label: string; available: boolean }[];
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}
