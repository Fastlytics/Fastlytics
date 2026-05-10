// knip-ignore
import { LandingReplayAvailable, LandingReplayChunk, LandingReplayMetadata } from '@/lib/api';
import { getGapSortKey } from '@/components/replay/replay-utils';
import { ChartType, HeroStrategyStint, HeroViewModel } from './hero-types';

const DEFAULT_TRACK_PATH =
  'M70 110 C40 80 60 40 110 45 L170 48 C210 50 225 35 210 20 C190 2 220 -5 260 8 C310 24 340 55 330 80 C322 98 290 96 288 112 C286 130 340 126 355 108 C372 88 365 112 350 120 C330 130 260 135 220 118 C190 105 170 115 140 112 C100 108 85 125 70 110Z';

export function mergeLandingReplayChunks(chunks: LandingReplayChunk[]): LandingReplayChunk | null {
  if (chunks.length === 0) return null;
  if (chunks.length === 1) return chunks[0];

  const sorted = chunks.toSorted((a, b) => a.chunk_id - b.chunk_id);
  const driverCodes = sorted[0].selected_drivers;

  const mergedTime: number[] = [];
  const mergedDrivers: LandingReplayChunk['drivers'] = {};

  for (const code of driverCodes) {
    mergedDrivers[code] = {
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
      gap: [],
      interval: [],
    };
  }

  for (const chunk of sorted) {
    mergedTime.push(...chunk.time);
    for (const code of driverCodes) {
      const src = chunk.drivers[code];
      const dst = mergedDrivers[code];
      if (!src || !dst) continue;
      for (const key of Object.keys(dst) as (keyof typeof dst)[]) {
        const srcArr = src[key];
        if (Array.isArray(srcArr)) {
          (dst[key] as unknown[]).push(...srcArr);
        }
      }
    }
  }

  return {
    chunk_id: 0,
    start_time: sorted[0].start_time,
    end_time: sorted[sorted.length - 1].end_time,
    time: mergedTime,
    selected_drivers: driverCodes,
    drivers: mergedDrivers,
  };
}

export const DEFAULT_HERO_VIEW: HeroViewModel = {
  titleBar: 'Race Desk - Australian Grand Prix',
  statusLabel: 'Live',
  chartTitle: 'Live Speed Trace',
  timingRows: [
    {
      pos: 1,
      driver: 'NOR',
      team: 'McLaren',
      gap: 'Leader',
      color: '#ff8700',
      highlight: true,
      selected: true,
    },
    {
      pos: 2,
      driver: 'LEC',
      team: 'Ferrari',
      gap: '+0.732',
      color: '#ff2800',
      highlight: false,
      selected: false,
    },
    {
      pos: 3,
      driver: 'PIA',
      team: 'McLaren',
      gap: '+1.247',
      color: '#ff8700',
      highlight: false,
      selected: false,
    },
    {
      pos: 4,
      driver: 'RUS',
      team: 'Mercedes',
      gap: '+1.892',
      color: '#6c779f',
      highlight: false,
      selected: false,
    },
    {
      pos: 5,
      driver: 'HAM',
      team: 'Mercedes',
      gap: '+2.104',
      color: '#6c779f',
      highlight: false,
      selected: false,
    },
  ],
  lapLabel: 'Lap 57/57',
  chartSeries: [
    {
      key: 'NOR',
      path: 'M0 96 C50 93 100 85 150 79 C200 71 250 61 300 52 C350 41 400 34 450 27 C500 20 550 16 600 10',
      color: '#ff8700',
      strokeWidth: 2,
      points: [],
      valueLabel: 'km/h',
    },
    {
      key: 'LEC',
      path: 'M0 99 C50 96 100 93 150 91 C200 85 250 82 300 75 C350 68 400 66 450 61 C500 57 550 54 600 52',
      color: '#ff2800',
      strokeWidth: 2,
      opacity: 0.7,
      points: [],
      valueLabel: 'km/h',
    },
    {
      key: 'PIA',
      path: 'M0 102 C50 103 100 104 150 107 C200 103 250 99 300 93 C350 89 400 85 450 82 C500 79 550 77 600 75',
      color: '#ff8700',
      strokeWidth: 1.5,
      opacity: 0.5,
      points: [],
      valueLabel: 'km/h',
    },
  ],
  trackPath: DEFAULT_TRACK_PATH,
  carDots: [],
  sectorBadges: [
    { label: 'S1', color: 'bg-red-500/20 text-red-400', active: true },
    { label: 'S2', color: 'bg-amber-500/20 text-amber-400', active: false },
    { label: 'S3', color: 'bg-emerald-500/20 text-emerald-400', active: false },
  ],
  telemetry: [
    { label: 'Throttle', value: 100, color: 'bg-emerald-500' },
    { label: 'Brake', value: 0, color: 'bg-red-500' },
    { label: 'Speed', value: 82, color: 'bg-blue-500', suffix: '298 km/h' },
    { label: 'DRS', value: 100, color: 'bg-emerald-500', suffix: 'Open' },
  ],
  strategy: [
    { compound: 'S', laps: 18, color: '#ef4444', width: '31%' },
    { compound: 'M', laps: 23, color: '#f59e0b', width: '40%' },
    { compound: 'H', laps: 16, color: '#ffffff', width: '28%' },
  ],
  speedKph: 298,
  driverColor: '#ff8700',
  currentLap: 5,
  lastLapStr: '1:32.456',
  s1: '28.123',
  s2: '42.891',
  s3: '21.442',
  s1Tint: '',
  s2Tint: 'bg-emerald-500/10 text-emerald-300',
  s3Tint: '',
  lapElapsed: '0:18.234',
};

type PreparedSectorBoundaries = {
  s1Boundary: number;
  s2Boundary: number;
};

type PreparedCompletedLap = {
  driver: string;
  lap: number;
  timestamp: number;
  time_str?: string;
  s1?: number | null;
  s2?: number | null;
  s3?: number | null;
};

export type PreparedLandingReplayContext = {
  selected: LandingReplayAvailable;
  metadata: LandingReplayMetadata;
  chunk: LandingReplayChunk;
  selectedDrivers: string[];
  trackPath: string;
  totalLaps: number;
  circuitLength: number;
  titleLocation: string;
  weather: { time: number; rainfall?: number }[];
  driverColors: Record<string, string>;
  driverInfo: Record<string, { team?: string; team_color?: string }>;
  strategyByDriver: Record<string, HeroStrategyStint[]>;
  completedLapsByDriver: Record<string, PreparedCompletedLap[]>;
  sectorBoundaries: PreparedSectorBoundaries;
};

const CHART_SAMPLE_COUNT = 30;

function colorForCompound(compound?: string) {
  switch (compound?.toUpperCase()) {
    case 'SOFT':
      return '#ef4444';
    case 'MEDIUM':
      return '#f59e0b';
    case 'HARD':
      return '#ffffff';
    case 'INTERMEDIATE':
      return '#22c55e';
    case 'WET':
      return '#3b82f6';
    default:
      return '#9ca3af';
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function findNearestLandingFrameIndex(time: number, timeline: number[]) {
  if (timeline.length === 0) return 0;
  if (time <= timeline[0]) return 0;

  const lastIndex = timeline.length - 1;
  if (time >= timeline[lastIndex]) return lastIndex;

  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = timeline[mid];

    if (value === time) return mid;
    if (value < time) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return time - timeline[high] <= timeline[low] - time ? high : low;
}

export function buildPolylinePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

export function formatHeroSectorTime(sec: number | null) {
  if (sec == null || sec <= 0) return '--';
  if (sec < 10) return sec.toFixed(3);
  const minutes = Math.floor(sec / 60);
  const seconds = (sec % 60).toFixed(3);
  return minutes > 0 ? `${minutes}:${seconds.padStart(6, '0')}` : sec.toFixed(3);
}

export function formatHeroLapTime(sec: number | null) {
  if (sec == null || sec <= 0) return '--';
  const minutes = Math.floor(sec / 60);
  const seconds = (sec % 60).toFixed(3);
  return `${minutes}:${seconds.padStart(6, '0')}`;
}

export function normalizeRelativeDistance(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(0.999999, value));
}

function getLapProgressFromDistance(
  driver: LandingReplayChunk['drivers'][string] | null | undefined,
  index: number,
  lapStartIndex: number,
  circuitLength: number
) {
  if (!driver?.dist?.length || circuitLength <= 0) {
    return normalizeRelativeDistance(driver?.rel_dist?.[index]);
  }

  const currentDist = driver.dist[index];
  const lapStartDist = driver.dist[Math.max(0, lapStartIndex)];
  if (!Number.isFinite(currentDist) || !Number.isFinite(lapStartDist)) {
    return normalizeRelativeDistance(driver?.rel_dist?.[index]);
  }

  return Math.max(0, Math.min(0.999999, (currentDist - lapStartDist) / circuitLength));
}

export function getExpandedHeroBounds() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = viewportWidth < 640 ? 12 : 24;
  const navbarHeight = 64;
  const topClearance = navbarHeight + margin;
  const width = Math.min(viewportWidth - margin * 2, 1500);
  const height = Math.min(viewportHeight - topClearance - margin, 900);

  return {
    top: Math.max(topClearance, (viewportHeight - height) / 2),
    left: Math.max(margin, (viewportWidth - width) / 2),
    width,
    height,
    borderRadius: 16,
  };
}

function orderDriversAtFrame(driverCodes: string[], chunk: LandingReplayChunk, frameIndex: number) {
  return driverCodes.toSorted((a, b) => {
    const driverA = chunk.drivers[a];
    const driverB = chunk.drivers[b];
    if (!driverA || !driverB) return 0;

    return getGapSortKey(driverA.gap?.[frameIndex]) - getGapSortKey(driverB.gap?.[frameIndex]);
  });
}

export function pickLandingReplayKey(entry: LandingReplayAvailable) {
  return `${entry.year}:${entry.event}:${entry.session}`;
}

export function pickLandingReplay(
  available: LandingReplayAvailable[],
  storedKey: string | null
): LandingReplayAvailable | null {
  if (available.length === 0) return null;
  if (storedKey) {
    const stored = available.find((entry) => pickLandingReplayKey(entry) === storedKey);
    if (stored) return stored;
  }
  return available[Math.floor(Math.random() * available.length)] ?? null;
}

export function pickDifferentLandingReplay(
  available: LandingReplayAvailable[],
  currentKey: string | null
): LandingReplayAvailable | null {
  if (available.length === 0) return null;
  const alternatives = currentKey
    ? available.filter((entry) => pickLandingReplayKey(entry) !== currentKey)
    : available;
  if (alternatives.length === 0) return null;
  return alternatives[Math.floor(Math.random() * alternatives.length)] ?? null;
}

export function buildHeroChartData(
  selectedDriverCode: string,
  chunk: LandingReplayChunk,
  colors: Record<string, string>,
  frameIndex: number,
  chartType: ChartType
) {
  const driver = chunk.drivers[selectedDriverCode];
  if (!driver || chunk.time.length === 0) return DEFAULT_HERO_VIEW.chartSeries;

  const cappedFrame = clamp(frameIndex, 0, chunk.time.length - 1);
  const availablePoints = cappedFrame + 1;
  const sampleCount = Math.max(2, Math.min(CHART_SAMPLE_COUNT, availablePoints));
  const step = Math.max(1, Math.floor(availablePoints / sampleCount));
  const indices = Array.from({ length: sampleCount }, (_, idx) =>
    Math.min(idx * step, cappedFrame)
  );
  if (indices[indices.length - 1] !== cappedFrame) indices[indices.length - 1] = cappedFrame;

  let values: number[];
  let minBound: number;
  let maxBound: number;
  let unitLabel: string;

  const teamColor = colors[selectedDriverCode] || '#ffffff';

  switch (chartType) {
    case 'throttle':
      values = indices.map((index) => driver.throttle?.[index] || 0);
      minBound = 0;
      maxBound = 100;
      unitLabel = '%';
      break;
    case 'brake':
      values = indices.map((index) => {
        const brake = driver.brake?.[index] || 0;
        return brake <= 1 ? brake * 100 : brake;
      });
      minBound = 0;
      maxBound = 100;
      unitLabel = '%';
      break;
    case 'rpm':
      values = indices.map((index) => driver.rpm?.[index] || 0);
      minBound = Math.min(...values, 7000);
      maxBound = Math.max(...values, 12000);
      unitLabel = 'RPM';
      break;
    case 'speed':
    default:
      values = indices.map((index) => driver.speed?.[index] || 0);
      minBound = Math.min(...values);
      maxBound = Math.max(...values, 1);
      unitLabel = 'km/h';
      break;
  }

  const range = Math.max(maxBound - minBound, 1);
  const points = values.map((value, pointIndex) => ({
    x: sampleCount === 1 ? 0 : (pointIndex / (sampleCount - 1)) * 600,
    y: 210 - ((value - minBound) / range) * 200,
    value: Math.round(value * 10) / 10,
    label:
      chartType === 'rpm'
        ? `${Math.round(value)} RPM`
        : chartType === 'speed'
          ? `${Math.round(value)} km/h`
          : `${Math.round(value)}%`,
  }));

  return [
    {
      key: `${selectedDriverCode}-${chartType}`,
      path: buildPolylinePath(points.map((point) => ({ x: point.x, y: point.y }))),
      color: teamColor,
      strokeWidth: 2.25,
      opacity: 1,
      points,
      valueLabel: unitLabel,
    },
  ];
}

export function prepareLandingReplayContext(
  selected: LandingReplayAvailable,
  metadata: LandingReplayMetadata,
  chunk: LandingReplayChunk
): PreparedLandingReplayContext {
  const selectedDrivers = metadata.selected_drivers?.length
    ? metadata.selected_drivers
    : chunk.selected_drivers || selected.selected_drivers;
  const circuitMetadata = metadata.circuit_metadata || {};
  const totalLaps = metadata.total_laps || circuitMetadata.total_laps || 0;
  const titleLocation = circuitMetadata.location || selected.event;
  const trackPath = metadata.circuit_layout || DEFAULT_TRACK_PATH;
  const driverColors = metadata.driver_colors || {};
  const driverInfo = metadata.driver_info || {};
  const weather = (metadata.weather || []) as { time: number; rainfall?: number }[];

  const strategyByDriver = selectedDrivers.reduce<Record<string, HeroStrategyStint[]>>(
    (acc, code) => {
      const source = metadata.driver_stints?.[code] || [];
      const total = source.reduce((sum, stint) => sum + Math.max(stint.laps || 0, 0), 0) || 1;
      acc[code] = source.slice(0, 4).map((stint) => ({
        compound: (stint.compound || 'U').charAt(0).toUpperCase(),
        laps: stint.laps,
        color: colorForCompound(stint.compound),
        width: `${Math.max(((stint.laps || 0) / total) * 100, 12)}%`,
      }));
      return acc;
    },
    {}
  );

  const completedLapsByDriver = (metadata.completed_laps || []).reduce<
    Record<string, PreparedCompletedLap[]>
  >((acc, lap) => {
    const driver = lap.driver;
    if (!driver) return acc;
    if (!acc[driver]) acc[driver] = [];
    acc[driver].push(lap as PreparedCompletedLap);
    return acc;
  }, {});

  Object.values(completedLapsByDriver).forEach((laps) =>
    laps.sort((a, b) => a.timestamp - b.timestamp)
  );

  const circuitLength = circuitMetadata.circuit_length_m || 0;
  const sectorDistances = (metadata.sector_boundaries || [])
    .filter((sector) => typeof sector.distance === 'number' && /^S\d/.test(sector.label || ''))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  let s1Boundary = 1 / 3;
  let s2Boundary = 2 / 3;
  if (sectorDistances.length >= 2 && circuitLength > 0) {
    s1Boundary = Math.max(
      0,
      Math.min(0.999999, (sectorDistances[0].distance || 0) / circuitLength)
    );
    s2Boundary = Math.max(
      s1Boundary,
      Math.min(0.999999, (sectorDistances[1].distance || 0) / circuitLength)
    );
  }

  return {
    selected,
    metadata,
    chunk,
    selectedDrivers,
    trackPath,
    totalLaps,
    circuitLength,
    titleLocation,
    weather,
    driverColors,
    driverInfo,
    strategyByDriver,
    completedLapsByDriver,
    sectorBoundaries: { s1Boundary, s2Boundary },
  };
}

function sectorTint(time: number | null, prevTime: number | null, fastest: number | null) {
  if (time == null || time <= 0) return '';
  if (fastest != null && Math.abs(time - fastest) < 0.001)
    return 'bg-purple-500/15 text-purple-300';
  if (prevTime != null && Math.abs(time - prevTime) < 0.001)
    return 'bg-emerald-500/10 text-emerald-300';
  if (prevTime != null && time > prevTime) return 'bg-yellow-500/10 text-yellow-300';
  return '';
}

export function buildLandingHeroView(
  prepared: PreparedLandingReplayContext,
  selectedDriverCode: string,
  frameIndex: number,
  chartType: ChartType
): HeroViewModel {
  const {
    chunk,
    metadata,
    selectedDrivers,
    totalLaps,
    circuitLength,
    trackPath,
    titleLocation,
    driverColors,
    driverInfo,
  } = prepared;
  const sampleIndex = clamp(frameIndex, 0, Math.max(chunk.time.length - 1, 0));
  const orderedDrivers = orderDriversAtFrame(selectedDrivers, chunk, sampleIndex);
  const leaderCode = orderedDrivers[0];
  const leaderDriver = leaderCode ? chunk.drivers[leaderCode] : null;
  const activeDriverCode = orderedDrivers.includes(selectedDriverCode)
    ? selectedDriverCode
    : leaderCode;
  const activeDriver = activeDriverCode ? chunk.drivers[activeDriverCode] : null;
  const leaderLap = leaderDriver?.lap?.[sampleIndex] || 0;

  const timingRows = orderedDrivers.map((code, index) => {
    const currentDriverInfo = driverInfo?.[code];
    const driverChunk = chunk.drivers[code];
    const gapLabel =
      index === 0
        ? 'Leader'
        : driverChunk?.gap?.[sampleIndex] || driverChunk?.interval?.[sampleIndex] || '--';
    return {
      pos: index + 1,
      driver: code,
      team: currentDriverInfo?.team || 'Unknown',
      gap: gapLabel,
      color: driverColors?.[code] || `#${currentDriverInfo?.team_color || 'ffffff'}`,
      highlight: index === 0,
      selected: code === activeDriverCode,
    };
  });

  const speedKph = Math.round(activeDriver?.speed?.[sampleIndex] || 0);
  const drsOpen = (activeDriver?.drs?.[sampleIndex] || 0) > 0;
  const telemetry = [
    {
      label: 'Throttle',
      value: clamp(Math.round(activeDriver?.throttle?.[sampleIndex] || 0), 0, 100),
      color: 'bg-emerald-500',
    },
    {
      label: 'Brake',
      value: clamp(Math.round(activeDriver?.brake?.[sampleIndex] || 0), 0, 100),
      color: 'bg-red-500',
    },
    {
      label: 'Speed',
      value: clamp(Math.round((speedKph / 360) * 100), 0, 100),
      color: 'bg-blue-500',
      suffix: `${speedKph} km/h`,
    },
    {
      label: 'DRS',
      value: drsOpen ? 100 : 12,
      color: 'bg-emerald-500',
      suffix: drsOpen ? 'Open' : 'Closed',
    },
  ];

  const strategy = prepared.strategyByDriver[activeDriverCode] || [];
  const carDots = orderedDrivers.flatMap((code) => {
    const driver = chunk.drivers[code];
    if (!driver || driver.x.length <= sampleIndex || driver.y.length <= sampleIndex) return [];
    return [
      {
        code,
        color: driverColors?.[code] || '#ffffff',
        x: driver.x[sampleIndex],
        y: driver.y[sampleIndex],
        selected: code === activeDriverCode,
      },
    ];
  });

  const weather =
    prepared.weather.find((entry) => entry.time >= (chunk.time[sampleIndex] || 0)) ||
    prepared.weather[0];
  const statusLabel = weather?.rainfall ? 'Damp' : 'Live';

  const currentTime = chunk.time[sampleIndex] || 0;
  const activeLap = activeDriver?.lap?.[sampleIndex] || 0;
  const driverCompletedLaps = (prepared.completedLapsByDriver[activeDriverCode] || []).filter(
    (lap) => lap.timestamp <= currentTime
  );
  const lastCompleted = driverCompletedLaps[driverCompletedLaps.length - 1];
  const lastLapStr = lastCompleted?.time_str || '--';
  const fastestSectors = metadata.fastest_sectors || {};

  const prevCompleted =
    driverCompletedLaps.length > 1
      ? driverCompletedLaps[driverCompletedLaps.length - 2]
      : undefined;
  const prevS1 = prevCompleted?.s1 ?? null;
  const prevS2 = prevCompleted?.s2 ?? null;
  const prevS3 = prevCompleted?.s3 ?? null;

  let lapStartIdx = sampleIndex;
  if (activeDriver?.lap) {
    while (lapStartIdx > 0 && activeDriver.lap[lapStartIdx] === activeLap) lapStartIdx--;
  }
  const prevLap = driverCompletedLaps.find((lap) => lap.lap === activeLap - 1) || null;
  const lapStartIndex = prevLap
    ? Math.max(
        0,
        chunk.time.findIndex((time) => time >= prevLap.timestamp)
      )
    : activeDriver?.lap && lapStartIdx > 0 && activeDriver.lap[lapStartIdx] !== activeLap
      ? lapStartIdx + 1
      : lapStartIdx;
  const lapStartTime = prevLap?.timestamp ?? chunk.time[Math.max(0, lapStartIndex)] ?? currentTime;
  const { s1Boundary, s2Boundary } = prepared.sectorBoundaries;
  const currentLapProgress = getLapProgressFromDistance(
    activeDriver,
    sampleIndex,
    lapStartIndex,
    circuitLength
  );
  const activeSectorLabel =
    currentLapProgress == null
      ? 'S1'
      : currentLapProgress < s1Boundary
        ? 'S1'
        : currentLapProgress < s2Boundary
          ? 'S2'
          : 'S3';

  const sectorBadges = ['S1', 'S2', 'S3'].map((label, index) => ({
    label,
    color:
      index === 0
        ? 'bg-red-500/20 text-red-400'
        : index === 1
          ? 'bg-amber-500/20 text-amber-400'
          : 'bg-emerald-500/20 text-emerald-400',
    active: label === activeSectorLabel,
  }));

  let s1CrossIdx = -1;
  let s2CrossIdx = -1;
  if (activeDriver?.lap?.length) {
    for (let i = Math.max(0, lapStartIndex); i <= sampleIndex; i++) {
      const rel = getLapProgressFromDistance(activeDriver, i, lapStartIndex, circuitLength);
      if (rel == null) continue;
      if (s1CrossIdx < 0 && rel >= s1Boundary) s1CrossIdx = i;
      if (s2CrossIdx < 0 && rel >= s2Boundary) s2CrossIdx = i;
      if (s1CrossIdx >= 0 && s2CrossIdx >= 0) break;
    }
  }

  const s1Time =
    s1CrossIdx >= 0
      ? chunk.time[s1CrossIdx] - lapStartTime
      : activeSectorLabel === 'S1'
        ? currentTime - lapStartTime
        : null;
  const s2Time =
    s2CrossIdx >= 0
      ? chunk.time[s2CrossIdx] - chunk.time[s1CrossIdx]
      : activeSectorLabel === 'S2' && s1CrossIdx >= 0
        ? currentTime - chunk.time[s1CrossIdx]
        : null;
  const s3Time =
    activeSectorLabel === 'S3' && s2CrossIdx >= 0 ? currentTime - chunk.time[s2CrossIdx] : null;

  const s1Live = formatHeroSectorTime(s1Time);
  const s2Live = s1CrossIdx >= 0 ? formatHeroSectorTime(s2Time) : '--';
  const s3Live = s2CrossIdx >= 0 ? formatHeroSectorTime(s3Time) : '--';
  const s1Tint = sectorTint(s1Time, prevS1, fastestSectors.s1);
  const s2Tint = sectorTint(s2Time, prevS2, fastestSectors.s2);
  const s3Tint = sectorTint(s3Time, prevS3, fastestSectors.s3);
  const lapElapsed = formatHeroLapTime(currentTime - lapStartTime);

  return {
    titleBar: `Race Desk - ${titleLocation}`,
    statusLabel,
    chartTitle: `${activeDriverCode} Live ${chartType === 'speed' ? 'Speed Trace' : chartType === 'throttle' ? 'Throttle' : chartType === 'brake' ? 'Braking' : 'RPM'}`,
    timingRows,
    lapLabel: totalLaps ? `Lap ${leaderLap}/${totalLaps}` : `Lap ${leaderLap}`,
    chartSeries: buildHeroChartData(activeDriverCode, chunk, driverColors, sampleIndex, chartType),
    trackPath,
    carDots,
    sectorBadges,
    telemetry,
    strategy: strategy.length > 0 ? strategy : DEFAULT_HERO_VIEW.strategy,
    speedKph,
    driverColor: driverColors?.[activeDriverCode] || '#ffffff',
    currentLap: activeLap,
    lastLapStr,
    s1: s1Live,
    s2: s2Live,
    s3: s3Live,
    s1Tint,
    s2Tint,
    s3Tint,
    lapElapsed,
  };
}
