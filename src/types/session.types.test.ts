import { describe, it, expect } from 'vitest';
import type {
  ChunkManifest,
  SessionMetadataExtended,
  DriverTelemetryArrays,
} from './session.types';

describe('session.types', () => {
  describe('DriverTelemetryArrays', () => {
    it('should have all telemetry arrays', () => {
      const telemetry: DriverTelemetryArrays = {
        x: [],
        y: [],
        dist: [],
        rel_dist: [],
        speed: [],
        gear: [],
        drs: [],
        rpm: [],
        lap: [],
        tyre: [],
        throttle: [],
        brake: [],
      };

      expect(telemetry.x).toBeDefined();
      expect(telemetry.y).toBeDefined();
      expect(telemetry.speed).toBeDefined();
    });
  });

  describe('ChunkManifest', () => {
    it('should define chunk metadata', () => {
      const manifest: ChunkManifest = [{ url: 'chunk1' }, { url: 'chunk2' }];
      expect(manifest).toHaveLength(2);
    });
  });

  describe('SessionMetadataExtended', () => {
    it('should extend with chunk metadata', () => {
      const metadata: SessionMetadataExtended = {
        chunk_manifest: [{ url: 'chunk1' }],
        total_duration: 9999,
        time: [],
        drivers: {},
        driver_colors: {},
        driver_grid_positions: {},
        track_statuses: [],
        race_control_messages: [],
        circuit_layout: 'test',
        session_info: { name: 'Test', year: 2025, session: 'FP1' },
      };

      expect(metadata.chunk_manifest).toBeDefined();
      expect(metadata.total_duration).toBe(9999);
    });
  });
});
