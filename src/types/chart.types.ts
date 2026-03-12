import type { TeamPaceSession } from '@/lib/api';

export type EvolutionDataPoint = {
  name: string;
} & Record<string, number>;

export type PaceGapDataPoint = TeamPaceSession & {
  gapToLeader: number;
};

export type SparklineDataPoint = {
  Distance: number;
  speed?: number;
  throttle?: number;
  brake?: number;
  rpm?: number;
  drs?: number;
  gap?: number;
};

export type SparklineData = SparklineDataPoint[];
