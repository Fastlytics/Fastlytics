import type { ReplayDriverData, ReplayDriversMap, SessionReplayData } from '@/lib/api';

export type ChunkManifestItem = {
  url: string;
};

export type ChunkManifest = ChunkManifestItem[];

export type SessionMetadataExtended = SessionReplayData & {
  chunk_manifest?: ChunkManifest;
  total_duration?: number;
};

export type DriverTelemetryArrays = {
  x: number[];
  y: number[];
  dist: number[];
  rel_dist: number[];
  speed: number[];
  gear: number[];
  drs: number[];
  rpm: number[];
  lap: number[];
  tyre: number[];
  throttle: number[];
  brake: number[];
};
