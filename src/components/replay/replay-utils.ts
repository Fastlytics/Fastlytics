/**
 * Pure utility functions for the Session Replay feature.
 * Extracted for testability and reuse across sub-components.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DriverFrameState {
  code?: string;
  originalCode?: string;
  x: number;
  y: number;
  dist?: number;
  ref_dist: number;
  rel_dist?: number;
  speed: number;
  gear: number;
  drs: number;
  rpm: number;
  lap: number;
  tyre?: number;
  throttle: number;
  brake: number;
  track_index?: number;
  pos?: number;
  bestLap?: CompletedLapInfo;
  isGhost?: boolean;
  color?: string;
}

export interface CompletedLapInfo {
  driver: string;
  lap: number;
  time_str: string;
  seconds: number;
  timestamp: number;
  compound: string;
}

export interface TrackStatusSegment {
  startPct: number;
  endPct: number;
  color: string;
  label: string;
}

export interface SectorMarker {
  index: number;
  x: number;
  y: number;
  angle: number; // Perpendicular to track direction (degrees)
  label: string;
}

export interface TrailPoint {
  x: number;
  y: number;
  opacity: number; // 0..1, newest = 1, oldest = 0
}

export const FPS = 25;

// ─── Time Formatting ─────────────────────────────────────────────────────────

/** Formats seconds into HH:MM:SS */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/** Formats seconds into M:SS.mmm lap time format */
export const formatLapTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3);
  return `${m}:${s.padStart(6, '0')}`;
};

// ─── Sector Markers ──────────────────────────────────────────────────────────

/**
 * Calculates the angle perpendicular to the track at a given point index.
 * Returns degrees for SVG `rotate()`.
 */
export const getTrackAngleAtIndex = (points: number[][], index: number): number => {
  if (!points || points.length < 2) return 0;
  const len = points.length;

  // Get points before and after for direction
  const prevIdx = (index - 1 + len) % len;
  const nextIdx = (index + 1) % len;

  const dx = points[nextIdx][0] - points[prevIdx][0];
  const dy = points[nextIdx][1] - points[prevIdx][1];

  // Perpendicular angle (rotate 90 degrees)
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
};

/**
 * Finds the circuit_points index closest to a target distance.
 * Uses binary search on the sorted circuit_distances array.
 */
export const findIndexForDistance = (
  circuitDistances: number[],
  targetDistance: number
): number => {
  if (!circuitDistances || circuitDistances.length === 0) return 0;

  let lo = 0;
  let hi = circuitDistances.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (circuitDistances[mid] < targetDistance) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
};

/**
 * Generates sector boundary markers (S1/S2/S3 dividers + start/finish).
 * Divides track into 3 equal-distance sectors.
 */
export const getSectorMarkers = (
  circuitPoints: number[][],
  circuitDistances: number[]
): SectorMarker[] => {
  if (
    !circuitPoints ||
    !circuitDistances ||
    circuitPoints.length < 10 ||
    circuitDistances.length < 10
  ) {
    return [];
  }

  const totalDist = circuitDistances[circuitDistances.length - 1];
  if (totalDist <= 0) return [];

  const markers: SectorMarker[] = [];

  // Start/Finish line at index 0
  markers.push({
    index: 0,
    x: circuitPoints[0][0],
    y: circuitPoints[0][1],
    angle: getTrackAngleAtIndex(circuitPoints, 0),
    label: 'S/F',
  });

  // Sector boundaries at 1/3 and 2/3
  for (let s = 1; s <= 2; s++) {
    const targetDist = (totalDist * s) / 3;
    const idx = findIndexForDistance(circuitDistances, targetDist);

    markers.push({
      index: idx,
      x: circuitPoints[idx][0],
      y: circuitPoints[idx][1],
      angle: getTrackAngleAtIndex(circuitPoints, idx),
      label: `S${s}`,
    });
  }

  return markers;
};

// ─── Car Trails ──────────────────────────────────────────────────────────────

/**
 * Generates trail points for a driver, fading from newest (opacity 1) to oldest (opacity 0).
 * @param xArray - driver's x positions
 * @param yArray - driver's y positions
 * @param currentIndex - current frame index
 * @param trailLength - number of past frames to include
 */
export const getTrailPoints = (
  xArray: number[],
  yArray: number[],
  currentIndex: number,
  trailLength: number = 15
): TrailPoint[] => {
  if (!xArray || !yArray || currentIndex < 0) return [];

  const points: TrailPoint[] = [];
  const startIdx = Math.max(0, currentIndex - trailLength);

  for (let i = startIdx; i <= currentIndex && i < xArray.length; i++) {
    const age = currentIndex - i; // 0 = newest, trailLength = oldest
    points.push({
      x: xArray[i],
      y: yArray[i],
      opacity: 1 - age / trailLength,
    });
  }

  return points;
};

// ─── Speed Heatmap ───────────────────────────────────────────────────────────

/**
 * Maps a speed value to a color using a blue→cyan→green→yellow→red gradient.
 * @param speed - current speed in km/h
 * @param maxSpeed - maximum speed for normalization (default 350)
 * @param minSpeed - minimum speed for normalization (default 0)
 */
export const getSpeedColor = (
  speed: number,
  maxSpeed: number = 350,
  minSpeed: number = 0
): string => {
  const t = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)));

  // 5-stop gradient: blue → cyan → green → yellow → red
  const stops = [
    { t: 0.0, r: 0, g: 50, b: 255 }, // Blue (slow)
    { t: 0.25, r: 0, g: 200, b: 255 }, // Cyan
    { t: 0.5, r: 0, g: 255, b: 50 }, // Green (medium)
    { t: 0.75, r: 255, g: 255, b: 0 }, // Yellow
    { t: 1.0, r: 255, g: 30, b: 0 }, // Red (fast)
  ];

  // Find the two surrounding stops
  let lower = stops[0];
  let upper = stops[stops.length - 1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const range = upper.t - lower.t;
  const localT = range === 0 ? 0 : (t - lower.t) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * localT);
  const g = Math.round(lower.g + (upper.g - lower.g) * localT);
  const b = Math.round(lower.b + (upper.b - lower.b) * localT);

  return `rgb(${r},${g},${b})`;
};

/**
 * Generates an array of colored path segments for the speed heatmap.
 * Groups consecutive circuit points by similar speed to reduce SVG element count.
 * @param circuitPoints - track coordinates
 * @param speedByTrackIndex - speed value for each circuit point index
 * @param segmentSize - number of circuit points per segment (default 5)
 */
export const getSpeedHeatmapSegments = (
  circuitPoints: number[][],
  speedByTrackIndex: number[],
  maxSpeed: number = 350,
  segmentSize: number = 5
): { path: string; color: string }[] => {
  if (
    !circuitPoints ||
    !speedByTrackIndex ||
    circuitPoints.length === 0 ||
    speedByTrackIndex.length === 0
  ) {
    return [];
  }

  const segments: { path: string; color: string }[] = [];
  const len = Math.min(circuitPoints.length, speedByTrackIndex.length);

  for (let i = 0; i < len - 1; i += segmentSize) {
    const end = Math.min(i + segmentSize + 1, len); // +1 for overlap to avoid gaps
    let pathD = `M ${circuitPoints[i][0]},${circuitPoints[i][1]}`;
    let avgSpeed = 0;
    let count = 0;

    for (let j = i; j < end; j++) {
      if (j > i) {
        pathD += ` L ${circuitPoints[j][0]},${circuitPoints[j][1]}`;
      }
      avgSpeed += speedByTrackIndex[j] || 0;
      count++;
    }

    avgSpeed = count > 0 ? avgSpeed / count : 0;

    segments.push({
      path: pathD,
      color: getSpeedColor(avgSpeed, maxSpeed),
    });
  }

  return segments;
};

// ─── Track Status Seekbar Overlay ────────────────────────────────────────────

/**
 * Converts track_statuses into percentage-based segments for seekbar rendering.
 * Maps F1 track status codes to colors.
 */
export const getTrackStatusSegments = (
  trackStatuses: { status: string; start_time: number; end_time: number | null }[],
  totalDuration: number
): TrackStatusSegment[] => {
  if (!trackStatuses || trackStatuses.length === 0 || totalDuration <= 0) return [];

  const segments: TrackStatusSegment[] = [];

  // Track status mapping: '1'=Green, '2'=Yellow, '3'=SC, '4'=VSC, '5'=Red, '6'=Chk, '7'=Null
  const statusConfig: Record<string, { color: string; label: string }> = {
    '2': { color: '#eab308', label: 'Yellow' },
    '3': { color: '#f97316', label: 'Safety Car' },
    '4': { color: '#a855f7', label: 'VSC' },
    '5': { color: '#ef4444', label: 'Red Flag' },
    '6': { color: '#6b7280', label: 'Chequered' },
  };

  for (const status of trackStatuses) {
    const config = statusConfig[status.status];
    if (!config) continue; // Skip green/null (default track state)

    const startPct = Math.max(0, status.start_time / totalDuration);
    const endTime = status.end_time ?? totalDuration;
    const endPct = Math.min(1, endTime / totalDuration);

    if (endPct <= startPct) continue; // Invalid segment

    segments.push({
      startPct,
      endPct,
      color: config.color,
      label: config.label,
    });
  }

  return segments;
};

// ─── Tyre Age ────────────────────────────────────────────────────────────────

/**
 * Calculates tyre age (number of laps on the current tyre compound) for a driver at a given frame index.
 * Works by looking backwards from the current index to find when the tyre compound last changed.
 */
export const getTyreAge = (
  tyreArray: number[],
  lapArray: number[],
  currentIndex: number
): number => {
  if (!tyreArray || !lapArray || currentIndex < 0 || currentIndex >= tyreArray.length) return 0;

  const currentTyre = tyreArray[currentIndex];
  const currentLap = lapArray[currentIndex];

  // Walk backwards to find when this tyre compound started
  let stintStartLap = currentLap;
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (tyreArray[i] !== currentTyre) {
      break;
    }
    stintStartLap = lapArray[i];
  }

  return Math.max(1, currentLap - stintStartLap + 1);
};

// ─── Lap-Based Seeking ───────────────────────────────────────────────────────

/**
 * Finds the time (in seconds) at which a given lap number starts for any driver.
 * Returns the earliest time across all drivers that match the target lap.
 */
export const getTimeForLap = (
  drivers: Record<string, { lap: number[] }>,
  timeArray: number[],
  targetLap: number
): number | null => {
  if (!drivers || !timeArray || timeArray.length === 0) return null;

  let earliestTime: number | null = null;

  for (const d of Object.values(drivers)) {
    if (!d.lap) continue;

    for (let i = 0; i < d.lap.length && i < timeArray.length; i++) {
      if (d.lap[i] === targetLap) {
        const time = timeArray[i];
        if (earliestTime === null || time < earliestTime) {
          earliestTime = time;
        }
        break; // Found the first frame for this driver on this lap
      }
    }
  }

  return earliestTime;
};

/**
 * Gets all unique lap numbers across all drivers.
 */
export const getAllLapNumbers = (drivers: Record<string, { lap: number[] }>): number[] => {
  if (!drivers) return [];

  const lapSet = new Set<number>();
  for (const d of Object.values(drivers)) {
    if (!d.lap) continue;
    for (const l of d.lap) {
      if (l > 0) lapSet.add(l);
    }
  }

  return [...lapSet].sort((a, b) => a - b);
};

// ─── Driver Score (for leaderboard sorting) ──────────────────────────────────

/** Calculates a composite score for race position sorting: Lap * 1M + trackIndex */
export const getDriverScore = (d: DriverFrameState | null | undefined): number => {
  if (!d) return -1;
  return d.lap * 1000000 + (d.track_index || 0);
};

// ─── Message Config ──────────────────────────────────────────────────────────

export interface MessageConfig {
  type: string;
  color: string;
  border: string;
  bg: string;
  fill: boolean;
  iconName: string; // Icon name string instead of component reference (for testability)
}

/**
 * Determines the visual configuration for a race control message.
 * Returns icon name as string for testability (component maps it to actual icon).
 */
export const getMessageType = (msg: { message: string; flag?: string }): MessageConfig => {
  const text = (msg.message + ' ' + (msg.flag || '')).toUpperCase();

  if (text.includes('CHEQUERED')) {
    return {
      type: 'finish',
      iconName: 'Flag',
      color: 'text-white',
      border: 'border-white',
      bg: 'bg-black/90',
      fill: false,
    };
  }
  if (text.includes('RED FLAG') || text.includes('SUSPENDED')) {
    return {
      type: 'red',
      iconName: 'Flag',
      color: 'text-red-500',
      border: 'border-red-600',
      bg: 'bg-red-950/90',
      fill: true,
    };
  }
  if (text.includes('GREEN') || text.includes('RESUMED') || text.includes('CLEAR')) {
    return {
      type: 'green',
      iconName: 'Flag',
      color: 'text-green-500',
      border: 'border-green-500',
      bg: 'bg-green-950/90',
      fill: true,
    };
  }
  if (text.includes('PENALTY')) {
    return {
      type: 'penalty',
      iconName: 'AlertCircle',
      color: 'text-orange-500',
      border: 'border-orange-500',
      bg: 'bg-orange-950/90',
      fill: false,
    };
  }
  if (text.includes('NO INVESTIGATION')) {
    return {
      type: 'info',
      iconName: 'CheckCircle',
      color: 'text-green-400',
      border: 'border-green-500',
      bg: 'bg-gray-900/90',
      fill: false,
    };
  }
  if (
    text.includes('INVESTIGATION') ||
    text.includes('NOTED') ||
    text.includes('INCIDENT') ||
    text.includes('INFRINGEMENT')
  ) {
    return {
      type: 'investigation',
      iconName: 'Search',
      color: 'text-indigo-400',
      border: 'border-indigo-500',
      bg: 'bg-indigo-950/90',
      fill: false,
    };
  }
  if (
    (text.includes('YELLOW') ||
      text.includes('SAFETY CAR') ||
      /\bSC\b/.test(text) ||
      text.includes('VSC')) &&
    !text.includes('BLUE')
  ) {
    return {
      type: 'yellow',
      iconName: 'AlertTriangle',
      color: 'text-yellow-400',
      border: 'border-yellow-500',
      bg: 'bg-yellow-950/90',
      fill: false,
    };
  }
  if (text.includes('BLUE')) {
    return {
      type: 'blue',
      iconName: 'Flag',
      color: 'text-blue-400',
      border: 'border-blue-500',
      bg: 'bg-blue-950/90',
      fill: true,
    };
  }
  if (text.includes('DRS ENABLED')) {
    return {
      type: 'drs',
      iconName: 'Zap',
      color: 'text-green-400',
      border: 'border-green-500',
      bg: 'bg-gray-900/90',
      fill: true,
    };
  }
  if (text.includes('DRS DISABLED')) {
    return {
      type: 'drs',
      iconName: 'ZapOff',
      color: 'text-red-400',
      border: 'border-red-500',
      bg: 'bg-gray-900/90',
      fill: false,
    };
  }

  return {
    type: 'other',
    iconName: 'Info',
    color: 'text-gray-400',
    border: 'border-gray-600',
    bg: 'bg-gray-900/90',
    fill: false,
  };
};

// ─── Tyre Compound Mapping ───────────────────────────────────────────────────

/** Maps tyre compound number to display name */
export const getTyreCompoundName = (tyre: number): string => {
  switch (tyre) {
    case 0:
      return 'soft';
    case 1:
      return 'medium';
    case 2:
      return 'hard';
    case 3:
      return 'intermediate';
    case 4:
      return 'wet';
    default:
      return 'soft';
  }
};
