import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatLapTime,
  getTrackAngleAtIndex,
  findIndexForDistance,
  getSectorMarkers,
  getTrailPoints,
  getSpeedColor,
  getSpeedHeatmapSegments,
  getTrackStatusSegments,
  getTyreAge,
  getTimeForLap,
  getAllLapNumbers,
  getDriverScore,
  getMessageType,
  getTyreCompoundName,
  FPS,
} from './replay-utils';

// ─── Test Data Helpers ───────────────────────────────────────────────────────

/** Creates a simple circular track with N points for testing */
const makeCircularTrack = (n: number = 100): { points: number[][]; distances: number[] } => {
  const points: number[][] = [];
  const distances: number[] = [];
  const cx = 500,
    cy = 250,
    r = 200; // Center at SVG midpoint
  let cumDist = 0;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push([x, y]);

    if (i > 0) {
      const dx = points[i][0] - points[i - 1][0];
      const dy = points[i][1] - points[i - 1][1];
      cumDist += Math.sqrt(dx * dx + dy * dy);
    }
    distances.push(cumDist);
  }
  return { points, distances };
};

/** Creates mock driver data with known values */
const makeMockDriverData = (numFrames: number = 100) => ({
  x: Array.from({ length: numFrames }, (_, i) => 100 + i),
  y: Array.from({ length: numFrames }, (_, i) => 200 + i * 0.5),
  dist: Array.from({ length: numFrames }, (_, i) => i * 50),
  rel_dist: Array.from({ length: numFrames }, (_, i) => (i % 25) / 25),
  speed: Array.from({ length: numFrames }, (_, i) => 150 + Math.sin(i * 0.1) * 100),
  gear: Array.from({ length: numFrames }, () => 5),
  drs: Array.from({ length: numFrames }, (_, i) => (i > 50 ? 12 : 0)),
  rpm: Array.from({ length: numFrames }, () => 11000),
  lap: Array.from({ length: numFrames }, (_, i) => Math.floor(i / 25) + 1),
  tyre: Array.from({ length: numFrames }, (_, i) => (i < 50 ? 0 : 1)), // Soft then medium
  throttle: Array.from({ length: numFrames }, () => 80),
  brake: Array.from({ length: numFrames }, () => 0),
});

// ─── formatTime ──────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats zero correctly', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });

  it('formats seconds only', () => {
    expect(formatTime(45)).toBe('00:00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('00:02:05');
  });

  it('formats over an hour', () => {
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('handles large values', () => {
    expect(formatTime(7200)).toBe('02:00:00');
  });
});

// ─── formatLapTime ───────────────────────────────────────────────────────────

describe('formatLapTime', () => {
  it('formats typical F1 lap time', () => {
    expect(formatLapTime(83.456)).toBe('1:23.456');
  });

  it('formats sub-minute time', () => {
    expect(formatLapTime(45.123)).toBe('0:45.123');
  });

  it('formats zero', () => {
    expect(formatLapTime(0)).toBe('0:00.000');
  });
});

// ─── getTrackAngleAtIndex ────────────────────────────────────────────────────

describe('getTrackAngleAtIndex', () => {
  it('returns 0 for empty points', () => {
    expect(getTrackAngleAtIndex([], 0)).toBe(0);
  });

  it('returns 0 for single point', () => {
    expect(getTrackAngleAtIndex([[100, 100]], 0)).toBe(0);
  });

  it('calculates angle on a horizontal segment', () => {
    const points = [
      [0, 0],
      [10, 0],
      [20, 0],
    ];
    const angle = getTrackAngleAtIndex(points, 1);
    // Direction is (20-0, 0-0) = horizontal right, perpendicular = 90°
    expect(angle).toBe(90);
  });

  it('calculates angle on a vertical segment', () => {
    const points = [
      [0, 0],
      [0, 10],
      [0, 20],
    ];
    const angle = getTrackAngleAtIndex(points, 1);
    // Direction is (0, 20) = downward, perpendicular = 180°
    expect(angle).toBe(180);
  });

  it('wraps around for first index using last point', () => {
    const { points } = makeCircularTrack(100);
    const angle = getTrackAngleAtIndex(points, 0);
    expect(typeof angle).toBe('number');
    expect(isFinite(angle)).toBe(true);
  });
});

// ─── findIndexForDistance ────────────────────────────────────────────────────

describe('findIndexForDistance', () => {
  it('returns 0 for empty array', () => {
    expect(findIndexForDistance([], 100)).toBe(0);
  });

  it('finds exact match', () => {
    const distances = [0, 100, 200, 300, 400, 500];
    expect(findIndexForDistance(distances, 200)).toBe(2);
  });

  it('finds closest index for values between', () => {
    const distances = [0, 100, 200, 300, 400, 500];
    const idx = findIndexForDistance(distances, 150);
    expect(idx).toBe(2); // Upper bound (binary search returns first >= target)
  });

  it('returns last index for distance beyond range', () => {
    const distances = [0, 100, 200, 300];
    expect(findIndexForDistance(distances, 9999)).toBe(3);
  });

  it('returns 0 for distance 0', () => {
    const distances = [0, 100, 200];
    expect(findIndexForDistance(distances, 0)).toBe(0);
  });
});

// ─── getSectorMarkers ────────────────────────────────────────────────────────

describe('getSectorMarkers', () => {
  it('returns empty for insufficient points', () => {
    expect(getSectorMarkers([], [])).toEqual([]);
    expect(getSectorMarkers([[0, 0]], [0])).toEqual([]);
  });

  it('returns 3 markers (S/F + 2 sector boundaries) for valid track', () => {
    const { points, distances } = makeCircularTrack(100);
    const markers = getSectorMarkers(points, distances);

    expect(markers).toHaveLength(3);
    expect(markers[0].label).toBe('S/F');
    expect(markers[1].label).toBe('S1');
    expect(markers[2].label).toBe('S2');
  });

  it('S/F marker is at first point', () => {
    const { points, distances } = makeCircularTrack(100);
    const markers = getSectorMarkers(points, distances);

    expect(markers[0].x).toBe(points[0][0]);
    expect(markers[0].y).toBe(points[0][1]);
    expect(markers[0].index).toBe(0);
  });

  it('sector markers have valid angles', () => {
    const { points, distances } = makeCircularTrack(100);
    const markers = getSectorMarkers(points, distances);

    for (const marker of markers) {
      expect(typeof marker.angle).toBe('number');
      expect(isFinite(marker.angle)).toBe(true);
    }
  });

  it('sector boundaries are roughly at 1/3 and 2/3 of track', () => {
    const { points, distances } = makeCircularTrack(300);
    const markers = getSectorMarkers(points, distances);
    const totalDist = distances[distances.length - 1];

    // S1 boundary should be near totalDist/3
    const s1Dist = distances[markers[1].index];
    expect(s1Dist).toBeGreaterThan(totalDist * 0.3);
    expect(s1Dist).toBeLessThan(totalDist * 0.37);

    // S2 boundary should be near totalDist*2/3
    const s2Dist = distances[markers[2].index];
    expect(s2Dist).toBeGreaterThan(totalDist * 0.63);
    expect(s2Dist).toBeLessThan(totalDist * 0.7);
  });
});

// ─── getTrailPoints ──────────────────────────────────────────────────────────

describe('getTrailPoints', () => {
  it('returns empty for invalid input', () => {
    expect(getTrailPoints([], [], 0)).toEqual([]);
    expect(getTrailPoints([1], [2], -1)).toEqual([]);
  });

  it('returns correct number of trail points', () => {
    const x = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const y = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const trail = getTrailPoints(x, y, 9, 5);

    expect(trail).toHaveLength(6); // 5 past + current
  });

  it('newest point has opacity 1', () => {
    const x = [10, 20, 30, 40, 50];
    const y = [1, 2, 3, 4, 5];
    const trail = getTrailPoints(x, y, 4, 3);

    const newest = trail[trail.length - 1];
    expect(newest.opacity).toBe(1);
    expect(newest.x).toBe(50);
    expect(newest.y).toBe(5);
  });

  it('oldest point has opacity near 0', () => {
    const x = [10, 20, 30, 40, 50];
    const y = [1, 2, 3, 4, 5];
    const trail = getTrailPoints(x, y, 4, 4);

    const oldest = trail[0];
    expect(oldest.opacity).toBe(0);
  });

  it('handles first few frames gracefully (fewer than trailLength)', () => {
    const x = [10, 20, 30];
    const y = [1, 2, 3];
    const trail = getTrailPoints(x, y, 2, 10);

    expect(trail.length).toBe(3); // All 3 available points
    expect(trail[trail.length - 1].opacity).toBe(1);
  });
});

// ─── getSpeedColor ───────────────────────────────────────────────────────────

describe('getSpeedColor', () => {
  it('returns blue for zero speed', () => {
    const color = getSpeedColor(0, 350);
    expect(color).toBe('rgb(0,50,255)');
  });

  it('returns red for max speed', () => {
    const color = getSpeedColor(350, 350);
    expect(color).toBe('rgb(255,30,0)');
  });

  it('returns a valid rgb string for mid speed', () => {
    const color = getSpeedColor(175, 350);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('clamps to blue for negative speed', () => {
    const color = getSpeedColor(-50, 350);
    expect(color).toBe('rgb(0,50,255)');
  });

  it('clamps to red for speed above max', () => {
    const color = getSpeedColor(500, 350);
    expect(color).toBe('rgb(255,30,0)');
  });
});

// ─── getSpeedHeatmapSegments ─────────────────────────────────────────────────

describe('getSpeedHeatmapSegments', () => {
  it('returns empty for empty input', () => {
    expect(getSpeedHeatmapSegments([], [])).toEqual([]);
  });

  it('generates segments from valid data', () => {
    const { points } = makeCircularTrack(50);
    const speeds = Array.from({ length: 50 }, (_, i) => 100 + i * 5);
    const segments = getSpeedHeatmapSegments(points, speeds, 350, 5);

    expect(segments.length).toBeGreaterThan(0);
    // Each segment should have path and color
    for (const seg of segments) {
      expect(seg.path).toContain('M ');
      expect(seg.color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
    }
  });

  it('segment path starts with M and contains L', () => {
    const points = [
      [0, 0],
      [10, 0],
      [20, 0],
      [30, 0],
      [40, 0],
      [50, 0],
    ];
    const speeds = [100, 150, 200, 250, 300, 350];
    const segments = getSpeedHeatmapSegments(points, speeds, 350, 3);

    expect(segments[0].path).toContain('M ');
    expect(segments[0].path).toContain('L ');
  });
});

// ─── getTrackStatusSegments ──────────────────────────────────────────────────

describe('getTrackStatusSegments', () => {
  it('returns empty for empty input', () => {
    expect(getTrackStatusSegments([], 100)).toEqual([]);
  });

  it('returns empty for zero duration', () => {
    expect(getTrackStatusSegments([{ status: '5', start_time: 0, end_time: 10 }], 0)).toEqual([]);
  });

  it('skips green status (status 1)', () => {
    const statuses = [{ status: '1', start_time: 0, end_time: 100 }];
    expect(getTrackStatusSegments(statuses, 100)).toEqual([]);
  });

  it('maps red flag correctly', () => {
    const statuses = [{ status: '5', start_time: 100, end_time: 200 }];
    const segments = getTrackStatusSegments(statuses, 1000);

    expect(segments).toHaveLength(1);
    expect(segments[0].startPct).toBeCloseTo(0.1);
    expect(segments[0].endPct).toBeCloseTo(0.2);
    expect(segments[0].color).toBe('#ef4444');
    expect(segments[0].label).toBe('Red Flag');
  });

  it('maps safety car correctly', () => {
    const statuses = [{ status: '3', start_time: 300, end_time: 500 }];
    const segments = getTrackStatusSegments(statuses, 1000);

    expect(segments).toHaveLength(1);
    expect(segments[0].color).toBe('#f97316');
    expect(segments[0].label).toBe('Safety Car');
  });

  it('maps VSC correctly', () => {
    const statuses = [{ status: '4', start_time: 0, end_time: 100 }];
    const segments = getTrackStatusSegments(statuses, 1000);

    expect(segments).toHaveLength(1);
    expect(segments[0].color).toBe('#a855f7');
    expect(segments[0].label).toBe('VSC');
  });

  it('handles null end_time (extends to total duration)', () => {
    const statuses = [{ status: '5', start_time: 500, end_time: null }];
    const segments = getTrackStatusSegments(statuses, 1000);

    expect(segments).toHaveLength(1);
    expect(segments[0].endPct).toBeCloseTo(1);
  });

  it('handles multiple statuses', () => {
    const statuses = [
      { status: '2', start_time: 100, end_time: 200 },
      { status: '5', start_time: 400, end_time: 500 },
      { status: '3', start_time: 600, end_time: 700 },
    ];
    const segments = getTrackStatusSegments(statuses, 1000);

    expect(segments).toHaveLength(3);
  });
});

// ─── getTyreAge ──────────────────────────────────────────────────────────────

describe('getTyreAge', () => {
  it('returns 0 for invalid input', () => {
    expect(getTyreAge([], [], -1)).toBe(0);
    expect(getTyreAge([], [], 0)).toBe(0);
  });

  it('returns 1 on the first lap of a stint', () => {
    // All same tyre, lap 1
    const tyres = [0, 0, 0, 0, 0];
    const laps = [1, 1, 1, 1, 1];
    expect(getTyreAge(tyres, laps, 3)).toBe(1);
  });

  it('counts laps on current tyre correctly', () => {
    // Soft for laps 1-3, then medium for laps 4-5
    const tyres = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    const laps = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

    // At index 4 (lap 3, soft): age = 3 - 1 + 1 = 3
    expect(getTyreAge(tyres, laps, 4)).toBe(3);

    // At index 8 (lap 5, medium): age = 5 - 4 + 1 = 2
    expect(getTyreAge(tyres, laps, 8)).toBe(2);
  });

  it('resets age after pit stop (tyre change)', () => {
    const tyres = [0, 0, 0, 1, 1, 1];
    const laps = [1, 2, 3, 4, 5, 6];

    // On medium (index 5, lap 6): age = 6 - 4 + 1 = 3
    expect(getTyreAge(tyres, laps, 5)).toBe(3);
  });
});

// ─── getTimeForLap ───────────────────────────────────────────────────────────

describe('getTimeForLap', () => {
  it('returns null for empty data', () => {
    expect(getTimeForLap({}, [], 1)).toBeNull();
  });

  it('finds the time for a specific lap', () => {
    const drivers = {
      VER: { lap: [1, 1, 1, 2, 2, 2, 3, 3] },
      HAM: { lap: [1, 1, 2, 2, 2, 3, 3, 3] },
    };
    const time = [0, 1, 2, 3, 4, 5, 6, 7];

    // Lap 2 starts at time 3 for VER and time 2 for HAM
    expect(getTimeForLap(drivers, time, 2)).toBe(2); // Earliest
  });

  it('returns null for nonexistent lap', () => {
    const drivers = { VER: { lap: [1, 1, 2, 2] } };
    const time = [0, 1, 2, 3];

    expect(getTimeForLap(drivers, time, 99)).toBeNull();
  });

  it('finds the first frame of lap 1', () => {
    const drivers = { VER: { lap: [1, 1, 1] } };
    const time = [10, 11, 12];

    expect(getTimeForLap(drivers, time, 1)).toBe(10);
  });
});

// ─── getAllLapNumbers ─────────────────────────────────────────────────────────

describe('getAllLapNumbers', () => {
  it('returns empty for no data', () => {
    expect(getAllLapNumbers({})).toEqual([]);
  });

  it('returns sorted unique laps', () => {
    const drivers = {
      VER: { lap: [1, 1, 2, 2, 3, 3] },
      HAM: { lap: [1, 1, 2, 2, 3, 3, 4, 4] },
    };

    expect(getAllLapNumbers(drivers)).toEqual([1, 2, 3, 4]);
  });

  it('excludes lap 0', () => {
    const drivers = { VER: { lap: [0, 0, 1, 1, 2, 2] } };
    expect(getAllLapNumbers(drivers)).toEqual([1, 2]);
  });
});

// ─── getDriverScore ──────────────────────────────────────────────────────────

describe('getDriverScore', () => {
  it('returns -1 for null/undefined', () => {
    expect(getDriverScore(null)).toBe(-1);
    expect(getDriverScore(undefined)).toBe(-1);
  });

  it('higher lap = higher score', () => {
    const d1 = { lap: 5, track_index: 100 } as unknown as Parameters<typeof getDriverScore>[0];
    const d2 = { lap: 3, track_index: 900 } as unknown as Parameters<typeof getDriverScore>[0];

    expect(getDriverScore(d1)).toBeGreaterThan(getDriverScore(d2));
  });

  it('same lap, higher track_index = higher score', () => {
    const d1 = { lap: 5, track_index: 500 } as unknown as Parameters<typeof getDriverScore>[0];
    const d2 = { lap: 5, track_index: 100 } as unknown as Parameters<typeof getDriverScore>[0];

    expect(getDriverScore(d1)).toBeGreaterThan(getDriverScore(d2));
  });
});

// ─── getMessageType ──────────────────────────────────────────────────────────

describe('getMessageType', () => {
  it('detects red flag', () => {
    const config = getMessageType({ message: 'RED FLAG', flag: '' });
    expect(config.type).toBe('red');
    expect(config.fill).toBe(true);
  });

  it('detects green flag', () => {
    const config = getMessageType({ message: 'TRACK CLEAR', flag: 'GREEN' });
    expect(config.type).toBe('green');
  });

  it('detects session suspended as red', () => {
    const config = getMessageType({ message: 'Session suspended' });
    expect(config.type).toBe('red');
  });

  it('detects penalty', () => {
    const config = getMessageType({ message: '5 SECOND TIME PENALTY FOR CAR 44' });
    expect(config.type).toBe('penalty');
  });

  it('detects no investigation needed', () => {
    const config = getMessageType({ message: 'No investigation necessary' });
    expect(config.type).toBe('info');
  });

  it('detects investigation', () => {
    const config = getMessageType({ message: 'CAR 44 UNDER INVESTIGATION' });
    expect(config.type).toBe('investigation');
  });

  it('detects yellow flag / safety car', () => {
    const config = getMessageType({ message: 'SAFETY CAR DEPLOYED' });
    expect(config.type).toBe('yellow');
  });

  it('detects VSC', () => {
    const config = getMessageType({ message: 'VSC deployed' });
    expect(config.type).toBe('yellow');
  });

  it('detects DRS enabled', () => {
    const config = getMessageType({ message: 'DRS ENABLED' });
    expect(config.type).toBe('drs');
    expect(config.fill).toBe(true);
  });

  it('detects DRS disabled', () => {
    const config = getMessageType({ message: 'DRS DISABLED' });
    expect(config.type).toBe('drs');
    expect(config.fill).toBe(false);
  });

  it('detects chequered flag', () => {
    const config = getMessageType({ message: 'CHEQUERED FLAG' });
    expect(config.type).toBe('finish');
  });

  it('returns other for generic message', () => {
    const config = getMessageType({ message: 'Car 1 pit stop' });
    expect(config.type).toBe('other');
  });

  it('blue flag is not confused with yellow', () => {
    const config = getMessageType({ message: '', flag: 'BLUE' });
    expect(config.type).toBe('blue');
  });
});

// ─── getTyreCompoundName ─────────────────────────────────────────────────────

describe('getTyreCompoundName', () => {
  it('maps all known compounds', () => {
    expect(getTyreCompoundName(0)).toBe('soft');
    expect(getTyreCompoundName(1)).toBe('medium');
    expect(getTyreCompoundName(2)).toBe('hard');
    expect(getTyreCompoundName(3)).toBe('intermediate');
    expect(getTyreCompoundName(4)).toBe('wet');
  });

  it('defaults to soft for unknown', () => {
    expect(getTyreCompoundName(99)).toBe('soft');
  });
});

// ─── FPS Constant ────────────────────────────────────────────────────────────

describe('FPS constant', () => {
  it('is 25', () => {
    expect(FPS).toBe(25);
  });
});
