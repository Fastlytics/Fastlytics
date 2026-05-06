import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, stagger, useMotionValue, useTransform, animate } from 'motion/react';
import { SEO } from '@/components/layout/SEO';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAvailableLandingReplays,
  fetchLandingReplayChunk,
  fetchLandingReplayMetadata,
  LandingReplayAvailable,
  LandingReplayChunk,
  LandingReplayMetadata,
} from '@/lib/api';
import { getGapSortKey } from '@/components/replay/replay-utils';
import Speedometer from '@/components/replay/Speedometer';

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Complete redesign
   Font: Inter (variable, optical sizing)
   Style: Clean, dark, premium — inspired by Linear/Vercel/Raycast
   ═══════════════════════════════════════════════════════════════ */

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div
      style={inter}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Fastlytics — Formula 1 Race Intelligence"
        description="Telemetry, tyre strategy, pace analysis, track dominance and session replay in one race desk. The analytics platform F1 fans deserve."
        keywords={[
          'formula 1 analytics',
          'f1 telemetry',
          'f1 race strategy',
          'f1 timing',
          'motorsport analytics',
        ]}
      />
      <LandingNavbar />

      <main>
        <HeroSection />
        <LogoBar />
        <FeaturesSection />
        <ProductSection />
        <StatsSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

/* ─── Animated counter hook ─── */
function useAnimatedCounter(target: number, duration = 2) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, target, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [target, duration, count]);

  return rounded;
}

const LANDING_REPLAY_SELECTION_KEY = 'landing-replay-selection-v1';
const HERO_DRIVER_CODE_KEY = 'hero-driver-code-v1';

type HeroTimingRow = {
  pos: number;
  driver: string;
  team: string;
  gap: string;
  color: string;
  highlight: boolean;
  selected: boolean;
};

type HeroChartPoint = { x: number; y: number; value: number; label: string };

type HeroChartSeries = {
  key: string;
  path: string;
  color: string;
  strokeWidth: number;
  opacity?: number;
  points: HeroChartPoint[];
  valueLabel: string;
};

type HeroTelemetryItem = {
  label: string;
  value: number;
  color: string;
  suffix?: string;
};

type HeroStrategyStint = {
  compound: string;
  laps: number;
  color: string;
  width: string;
};

type HeroCarDot = {
  code: string;
  color: string;
  x: number;
  y: number;
  selected: boolean;
};

type HeroViewModel = {
  badge: string;
  titleBar: string;
  statusLabel: string;
  chartTitle: string;
  timingRows: HeroTimingRow[];
  lapLabel: string;
  chartSeries: HeroChartSeries[];
  trackPath: string | null;
  carDots: HeroCarDot[];
  sectorBadges: { label: string; color: string; active: boolean }[];
  telemetry: HeroTelemetryItem[];
  strategy: HeroStrategyStint[];
  speedKph: number;
  driverColor: string;
  currentLap: number;
  lastLapStr: string;
  s1: string;
  s2: string;
  s3: string;
  s1Tint: string;
  s2Tint: string;
  s3Tint: string;
  lapElapsed: string;
};

const DEFAULT_HERO_VIEW: HeroViewModel = {
  badge: '2025 Season - Live now',
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
      path: 'M0 80 C50 78 100 72 150 68 C200 62 250 55 300 48 C350 40 400 35 450 30 C500 25 550 22 600 18',
      color: '#ff8700',
      strokeWidth: 2,
      points: [],
      valueLabel: 'km/h',
    },
    {
      key: 'LEC',
      path: 'M0 82 C50 80 100 78 150 76 C200 72 250 70 300 65 C350 60 400 58 450 55 C500 52 550 50 600 48',
      color: '#ff2800',
      strokeWidth: 2,
      opacity: 0.7,
      points: [],
      valueLabel: 'km/h',
    },
    {
      key: 'PIA',
      path: 'M0 84 C50 85 100 86 150 88 C200 85 250 82 300 78 C350 75 400 72 450 70 C500 68 550 66 600 65',
      color: '#ff8700',
      strokeWidth: 1.5,
      opacity: 0.5,
      points: [],
      valueLabel: 'km/h',
    },
  ],
  trackPath:
    'M70 110 C40 80 60 40 110 45 L170 48 C210 50 225 35 210 20 C190 2 220 -5 260 8 C310 24 340 55 330 80 C322 98 290 96 288 112 C286 130 340 126 355 108 C372 88 365 112 350 120 C330 130 260 135 220 118 C190 105 170 115 140 112 C100 108 85 125 70 110Z',
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildPolylinePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

function orderDriversAtFrame(driverCodes: string[], chunk: LandingReplayChunk, frameIndex: number) {
  return [...driverCodes].sort((a, b) => {
    const driverA = chunk.drivers[a];
    const driverB = chunk.drivers[b];
    if (!driverA || !driverB) return 0;

    return getGapSortKey(driverA.gap?.[frameIndex]) - getGapSortKey(driverB.gap?.[frameIndex]);
  });
}

function pickLandingReplayKey(entry: LandingReplayAvailable) {
  return `${entry.year}:${entry.event}:${entry.session}`;
}

function pickLandingReplay(
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

function pickDifferentLandingReplay(
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

type ChartType = 'speed' | 'throttle' | 'brake' | 'rpm';

function buildHeroChartData(
  selectedDriverCode: string,
  chunk: LandingReplayChunk,
  colors: Record<string, string>,
  frameIndex: number,
  chartType: ChartType
) {
  const driver = chunk.drivers[selectedDriverCode];
  if (!driver || chunk.time.length === 0) return DEFAULT_HERO_VIEW.chartSeries;

  const cappedFrame = clamp(frameIndex, 0, chunk.time.length - 1);
  const desiredSamples = 42;
  const availablePoints = cappedFrame + 1;
  const sampleCount = Math.max(2, Math.min(desiredSamples, availablePoints));
  const step = Math.max(1, Math.floor(availablePoints / sampleCount));
  const indices = Array.from({ length: sampleCount }, (_, idx) =>
    Math.min(idx * step, cappedFrame)
  );
  if (indices[indices.length - 1] !== cappedFrame) indices[indices.length - 1] = cappedFrame;

  let values: number[];
  let minBound: number;
  let maxBound: number;
  let lineColor: string;
  let unitLabel: string;

  const teamColor = colors[selectedDriverCode] || '#ffffff';

  switch (chartType) {
    case 'throttle':
      values = indices.map((index) => driver.throttle?.[index] || 0);
      minBound = 0;
      maxBound = 100;
      lineColor = teamColor;
      unitLabel = '%';
      break;
    case 'brake':
      values = indices.map((index) =>
        (driver.brake?.[index] || 0) <= 1
          ? (driver.brake?.[index] || 0) * 100
          : driver.brake?.[index] || 0
      );
      minBound = 0;
      maxBound = 100;
      lineColor = teamColor;
      unitLabel = '%';
      break;
    case 'rpm':
      values = indices.map((index) => driver.rpm?.[index] || 0);
      minBound = Math.min(...values, 7000);
      maxBound = Math.max(...values, 12000);
      lineColor = teamColor;
      unitLabel = 'RPM';
      break;
    case 'speed':
    default:
      values = indices.map((index) => driver.speed?.[index] || 0);
      minBound = Math.min(...values);
      maxBound = Math.max(...values, 1);
      lineColor = teamColor;
      unitLabel = 'km/h';
      break;
  }

  const range = Math.max(maxBound - minBound, 1);
  const points = values.map((value, pointIndex) => ({
    x: sampleCount === 1 ? 0 : (pointIndex / (sampleCount - 1)) * 600,
    y: 162 - ((value - minBound) / range) * 144,
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
      path: buildPolylinePath(points.map((p) => ({ x: p.x, y: p.y }))),
      color: lineColor,
      strokeWidth: 2.25,
      opacity: 1,
      points,
      valueLabel: unitLabel,
    },
  ];
}

function buildLandingHeroView(
  selected: LandingReplayAvailable,
  metadata: LandingReplayMetadata,
  chunk: LandingReplayChunk,
  selectedDriverCode: string,
  frameIndex: number,
  chartType: ChartType
): HeroViewModel {
  const selectedDrivers = metadata.selected_drivers?.length
    ? metadata.selected_drivers
    : chunk.selected_drivers || selected.selected_drivers;
  const sampleIndex = clamp(frameIndex, 0, Math.max(chunk.time.length - 1, 0));
  const orderedDrivers = orderDriversAtFrame(selectedDrivers, chunk, sampleIndex);
  const leaderCode = orderedDrivers[0];
  const leaderDriver = leaderCode ? chunk.drivers[leaderCode] : null;
  const activeDriverCode = orderedDrivers.includes(selectedDriverCode)
    ? selectedDriverCode
    : leaderCode;
  const activeDriver = activeDriverCode ? chunk.drivers[activeDriverCode] : null;
  const leaderLap = leaderDriver?.lap?.[sampleIndex] || 0;
  const totalLaps = metadata.total_laps || metadata.circuit_metadata?.total_laps || 0;

  const timingRows = orderedDrivers.slice(0, 5).map((code, index) => {
    const driverInfo = metadata.driver_info?.[code];
    const driverChunk = chunk.drivers[code];
    const gapLabel =
      index === 0
        ? 'Leader'
        : driverChunk?.gap?.[sampleIndex] || driverChunk?.interval?.[sampleIndex] || '--';
    return {
      pos: index + 1,
      driver: code,
      team: driverInfo?.team || 'Unknown',
      gap: gapLabel,
      color: metadata.driver_colors?.[code] || `#${driverInfo?.team_color || 'ffffff'}`,
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

  const strategySource = (activeDriverCode && metadata.driver_stints?.[activeDriverCode]) || [];
  const strategyTotal =
    strategySource.reduce((sum, stint) => sum + Math.max(stint.laps || 0, 0), 0) || 1;
  const strategy = strategySource.slice(0, 4).map((stint) => ({
    compound: (stint.compound || 'U').charAt(0).toUpperCase(),
    laps: stint.laps,
    color:
      stint.compound?.toUpperCase() === 'SOFT'
        ? '#ef4444'
        : stint.compound?.toUpperCase() === 'MEDIUM'
          ? '#f59e0b'
          : stint.compound?.toUpperCase() === 'HARD'
            ? '#ffffff'
            : stint.compound?.toUpperCase() === 'INTERMEDIATE'
              ? '#22c55e'
              : stint.compound?.toUpperCase() === 'WET'
                ? '#3b82f6'
                : '#9ca3af',
    width: `${Math.max((stint.laps / strategyTotal) * 100, 12)}%`,
  }));

  const carDots = orderedDrivers.slice(0, 5).flatMap((code) => {
    const driver = chunk.drivers[code];
    if (!driver || driver.x.length <= sampleIndex || driver.y.length <= sampleIndex) return [];
    return [
      {
        code,
        color: metadata.driver_colors?.[code] || '#ffffff',
        x: driver.x[sampleIndex],
        y: driver.y[sampleIndex],
        selected: code === activeDriverCode,
      },
    ];
  });

  const circuitLength = metadata.circuit_metadata?.circuit_length_m || 0;
  const sectorDistances = (metadata.sector_boundaries || [])
    .filter((sector) => typeof sector.distance === 'number' && /^S\d/.test(sector.label || ''))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  const lapDistance =
    circuitLength > 0 && typeof activeDriver?.dist?.[sampleIndex] === 'number'
      ? ((activeDriver.dist[sampleIndex] % circuitLength) + circuitLength) % circuitLength
      : null;
  let activeSectorLabel = 'S1';
  let s1Dist = 0;
  let s2Dist = 0;
  if (lapDistance != null && sectorDistances.length >= 2) {
    s1Dist = sectorDistances[0].distance || 0;
    s2Dist = sectorDistances[1].distance || 0;
    if (lapDistance < s1Dist) {
      activeSectorLabel = 'S1';
    } else if (lapDistance < s2Dist) {
      activeSectorLabel = 'S2';
    } else {
      activeSectorLabel = 'S3';
    }
  }

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

  const weather =
    metadata.weather?.find((entry) => entry.time >= (chunk.time[sampleIndex] || 0)) ||
    metadata.weather?.[0];
  const statusLabel = weather?.rainfall ? 'Damp' : 'Live';
  const titleLocation = metadata.circuit_metadata?.location || selected.event;

  const activeLap = activeDriver?.lap?.[sampleIndex] || 0;
  const driverCompletedLaps = (metadata.completed_laps || [])
    .filter((l) => l.driver === activeDriverCode)
    .sort((a, b) => b.lap - a.lap);
  const lastCompleted = driverCompletedLaps[0];
  const lastLapStr = lastCompleted?.time_str || '--';
  const fastestSectors = metadata.fastest_sectors || {};

  const prevCompleted = driverCompletedLaps[1];
  const prevS1 = prevCompleted?.s1 ?? null;
  const prevS2 = prevCompleted?.s2 ?? null;
  const prevS3 = prevCompleted?.s3 ?? null;

  const formatSectorTime = (sec: number | null) => {
    if (sec == null || sec <= 0) return '--';
    return sec < 10
      ? sec.toFixed(3)
      : `${Math.floor(sec / 60)}:${(sec % 60).toFixed(3).padStart(6, '0')}`;
  };

  let lapStartIdx = sampleIndex;
  if (activeDriver?.lap) {
    while (lapStartIdx > 0 && activeDriver.lap[lapStartIdx] === activeLap) lapStartIdx--;
  }
  const lapStartTime = chunk.time[Math.max(0, lapStartIdx)];

  let s1CrossIdx = -1;
  let s2CrossIdx = -1;
  if (circuitLength > 0 && activeDriver?.dist && s1Dist > 0) {
    for (let i = Math.max(0, lapStartIdx); i <= sampleIndex; i++) {
      const d = ((activeDriver.dist[i] % circuitLength) + circuitLength) % circuitLength;
      if (s1CrossIdx < 0 && d >= s1Dist) s1CrossIdx = i;
      if (s2CrossIdx < 0 && s2Dist > 0 && d >= s2Dist) s2CrossIdx = i;
      if (s1CrossIdx >= 0 && s2CrossIdx >= 0) break;
    }
  }

  const s1Time =
    s1CrossIdx >= 0
      ? chunk.time[s1CrossIdx] - lapStartTime
      : activeSectorLabel === 'S1'
        ? chunk.time[sampleIndex] - lapStartTime
        : null;
  const s1Live = formatSectorTime(s1Time);
  const s2Time =
    s2CrossIdx >= 0
      ? chunk.time[s2CrossIdx] - chunk.time[s1CrossIdx]
      : activeSectorLabel === 'S2' && s1CrossIdx >= 0
        ? chunk.time[sampleIndex] - chunk.time[s1CrossIdx]
        : null;
  const s2Live = s1CrossIdx >= 0 ? formatSectorTime(s2Time) : '--';
  const s3Time =
    activeSectorLabel === 'S3' && s2CrossIdx >= 0
      ? chunk.time[sampleIndex] - chunk.time[s2CrossIdx]
      : null;
  const s3Live = s2CrossIdx >= 0 ? formatSectorTime(s3Time) : '--';

  function sectorTint(time: number | null, prevTime: number | null, fastest: number | null) {
    if (time == null || time <= 0) return '';
    if (fastest != null && Math.abs(time - fastest) < 0.001)
      return 'bg-purple-500/15 text-purple-300';
    if (prevTime != null && Math.abs(time - prevTime) < 0.001)
      return 'bg-emerald-500/10 text-emerald-300';
    if (prevTime != null && time > prevTime) return 'bg-yellow-500/10 text-yellow-300';
    return '';
  }

  const s1Tint = sectorTint(s1Time, prevS1, fastestSectors.s1);
  const s2Tint = sectorTint(s2Time, prevS2, fastestSectors.s2);
  const s3Tint = sectorTint(s3Time, prevS3, fastestSectors.s3);

  const lapElapsed = formatSectorTime(chunk.time[sampleIndex] - lapStartTime);

  return {
    badge: `${selected.year} cache - ${selected.event}`,
    titleBar: `Race Desk - ${titleLocation}`,
    statusLabel,
    chartTitle: `${activeDriverCode} Live ${chartType === 'speed' ? 'Speed Trace' : chartType === 'throttle' ? 'Throttle' : chartType === 'brake' ? 'Braking' : 'RPM'}`,
    timingRows,
    lapLabel: totalLaps ? `Lap ${leaderLap}/${totalLaps}` : `Lap ${leaderLap}`,
    chartSeries: buildHeroChartData(
      activeDriverCode,
      chunk,
      metadata.driver_colors,
      sampleIndex,
      chartType
    ),
    trackPath: metadata.circuit_layout || DEFAULT_HERO_VIEW.trackPath,
    carDots,
    sectorBadges,
    telemetry,
    strategy: strategy.length > 0 ? strategy : DEFAULT_HERO_VIEW.strategy,
    speedKph,
    driverColor: metadata.driver_colors?.[activeDriverCode] || '#ffffff',
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

function useLandingHeroSource() {
  const { data: availableCaches = [] } = useQuery({
    queryKey: ['landingReplayAvailable'],
    queryFn: () => fetchAvailableLandingReplays(),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const storedKey = sessionStorage.getItem(LANDING_REPLAY_SELECTION_KEY);
  const initialKey = useMemo(() => {
    if (availableCaches.length === 0) return null;
    const selected = pickLandingReplay(availableCaches, storedKey);
    if (!selected) return null;
    return pickLandingReplayKey(selected);
  }, [availableCaches, storedKey]);

  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey);

  useEffect(() => {
    if (initialKey) {
      sessionStorage.setItem(LANDING_REPLAY_SELECTION_KEY, initialKey);
    }
  }, [initialKey]);

  const selectedCache = useMemo(
    () => availableCaches.find((entry) => pickLandingReplayKey(entry) === selectedKey) || null,
    [availableCaches, selectedKey]
  );

  const { data: metadata } = useQuery({
    queryKey: [
      'landingReplayMetadata',
      selectedCache?.year,
      selectedCache?.event,
      selectedCache?.session,
    ],
    queryFn: () =>
      fetchLandingReplayMetadata(selectedCache!.year, selectedCache!.event, selectedCache!.session),
    enabled: Boolean(selectedCache),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const { data: chunk } = useQuery({
    queryKey: [
      'landingReplayChunk',
      selectedCache?.year,
      selectedCache?.event,
      selectedCache?.session,
    ],
    queryFn: () =>
      fetchLandingReplayChunk(selectedCache!.year, selectedCache!.event, selectedCache!.session),
    enabled: Boolean(selectedCache),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const selectDifferentCache = useMemo(() => {
    if (availableCaches.length <= 1) return null;
    return () => {
      const next = pickDifferentLandingReplay(availableCaches, selectedKey);
      if (!next) return;
      const nextKey = pickLandingReplayKey(next);
      sessionStorage.setItem(LANDING_REPLAY_SELECTION_KEY, nextKey);
      setSelectedKey(nextKey);
    };
  }, [availableCaches, selectedKey]);

  return {
    selectedCache,
    metadata,
    chunk,
    canSelectDifferentCache: availableCaches.length > 1,
    selectDifferentCache,
  };
}

/* ─── Landing Chart (Interactive) ─── */
function nearestPointIndex(points: HeroChartPoint[], mouseX: number) {
  if (points.length === 0) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = Math.abs(points[i].x - mouseX);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

const LandingChart = ({
  chartSeries,
  lapLabel,
  chartTitle,
  chartType,
  setChartType,
}: {
  chartSeries: HeroChartSeries[];
  lapLabel: string;
  chartTitle: string;
  chartType: ChartType;
  setChartType: (t: ChartType) => void;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{
    series: HeroChartSeries;
    point: HeroChartPoint;
    index: number;
  } | null>(null);

  const activeSeries = chartSeries[0];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || !activeSeries || activeSeries.points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 600;
    const idx = nearestPointIndex(activeSeries.points, svgX);
    setHover({ series: activeSeries, point: activeSeries.points[idx], index: idx });
  };

  return (
    <div className="bg-[#0c0c0e] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/25">
            {chartTitle}
          </span>
          <div className="flex items-center gap-0.5 rounded border border-white/[0.06] bg-white/[0.02] p-0.5">
            {(['speed', 'throttle', 'brake', 'rpm'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setChartType(type)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  chartType === type
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {type === 'speed'
                  ? 'SPD'
                  : type === 'throttle'
                    ? 'THR'
                    : type === 'brake'
                      ? 'BRK'
                      : 'RPM'}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[11px] tabular-nums text-white/20">{lapLabel}</span>
      </div>
      <div className="relative h-[180px] overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b]">
        <svg
          ref={svgRef}
          viewBox="0 0 600 180"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Grid lines */}
          {[45, 90, 135].map((y) => (
            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          {chartSeries.map((series, index) => (
            <motion.path
              key={series.key}
              d={series.path}
              fill="none"
              stroke={series.color}
              strokeWidth={series.strokeWidth}
              opacity={series.opacity ?? 1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.8 + index * 0.1, ease: 'easeOut' }}
            />
          ))}
          {/* Hover indicator */}
          {hover && (
            <>
              <line
                x1={hover.point.x}
                y1={0}
                x2={hover.point.x}
                y2={180}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <circle
                cx={hover.point.x}
                cy={hover.point.y}
                r="3.5"
                fill={hover.series.color}
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="1"
              />
              <rect
                x={hover.point.x > 500 ? hover.point.x - 70 : hover.point.x + 8}
                y={hover.point.y > 90 ? hover.point.y - 24 : hover.point.y + 8}
                width="62"
                height="18"
                rx="4"
                fill="rgba(0,0,0,0.8)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
              <text
                x={hover.point.x > 500 ? hover.point.x - 39 : hover.point.x + 39}
                y={hover.point.y > 90 ? hover.point.y - 10 : hover.point.y + 21}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="600"
                className="select-none"
              >
                {hover.point.label}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

/* ─── Hero ─── */
const HeroSection = () => {
  const { selectedCache, metadata, chunk, canSelectDifferentCache, selectDifferentCache } =
    useLandingHeroSource();
  const cacheKey = selectedCache
    ? `${selectedCache.year}-${selectedCache.event}-${selectedCache.session}`
    : '';
  const cacheKeyRef = useRef(cacheKey);
  const [frameIndex, setFrameIndex] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('speed');
  const leaderCode = metadata?.selected_drivers?.[0] || chunk?.selected_drivers?.[0] || null;

  const selectedDriverCode = useMemo(() => {
    if (!leaderCode) return null;
    const availableDrivers = metadata?.selected_drivers || chunk?.selected_drivers || [];
    const stored = sessionStorage.getItem(HERO_DRIVER_CODE_KEY);
    if (stored && availableDrivers.includes(stored)) return stored;
    return leaderCode;
  }, [leaderCode, metadata?.selected_drivers, chunk?.selected_drivers]);

  useEffect(() => {
    if (cacheKeyRef.current !== cacheKey) {
      cacheKeyRef.current = cacheKey;
      setFrameIndex(0);
      setChartType('speed');
      sessionStorage.removeItem(HERO_DRIVER_CODE_KEY);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (selectedDriverCode) {
      sessionStorage.setItem(HERO_DRIVER_CODE_KEY, selectedDriverCode);
    }
  }, [selectedDriverCode]);

  useEffect(() => {
    if (!chunk || chunk.time.length <= 1) return;

    const step = 1;
    const intervalMs = 1000 / 25;

    const intervalId = window.setInterval(() => {
      setFrameIndex((current) => {
        const next = current + step;
        return next >= chunk.time.length ? 0 : next;
      });
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [chunk]);

  const hero = useMemo(() => {
    if (!selectedCache || !metadata || !chunk || !leaderCode) return DEFAULT_HERO_VIEW;
    try {
      return buildLandingHeroView(
        selectedCache,
        metadata,
        chunk,
        selectedDriverCode || leaderCode,
        frameIndex,
        chartType
      );
    } catch {
      return DEFAULT_HERO_VIEW;
    }
  }, [selectedCache, metadata, chunk, selectedDriverCode, leaderCode, frameIndex, chartType]);

  return (
    <section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-40">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-red-500/[0.07] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-orange-500/[0.05] blur-[100px]" />
      </div>

      {/* Grid bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[13px] font-medium text-white/60">{hero.badge}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Race intelligence <span className="text-red-500">for every</span> Formula 1 session
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/50"
          >
            Telemetry, strategy, pace and championship context wired into one live race desk. See
            what the pit wall sees.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              to="/dashboard"
              className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              Open race desk
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M1 7h12M8 2l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              See features
            </a>
          </motion.div>
        </div>

        {/* ─── Animated Dashboard Illustration ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="relative mx-auto mt-16 max-w-6xl lg:mt-20"
        >
          {/* Glow behind */}
          <div className="absolute -inset-6 rounded-2xl bg-gradient-to-b from-red-500/10 via-transparent to-transparent blur-2xl" />

          {/* Dashboard frame */}
          <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                </div>
                <div className="h-5 w-px bg-white/[0.06]" />
                <span className="text-[11px] font-medium text-white/30">{hero.titleBar}</span>
              </div>
              <button
                type="button"
                onClick={() => selectDifferentCache?.()}
                disabled={!canSelectDifferentCache}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-40"
              >
                Next Race
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-70">
                  <path
                    d="M2 5h6M5.5 2L8 4.5 5.5 7"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Dashboard grid */}
            <div className="grid gap-px bg-white/[0.04] p-px md:grid-cols-[1.1fr_0.9fr]">
              {/* Left — Timing tower + chart */}
              <div className="space-y-px">
                {/* Timing tower */}
                <div className="bg-[#0c0c0e] p-4">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                    Race Positions
                  </div>
                  <div className="space-y-0">
                    {hero.timingRows.map((row, i) => (
                      <motion.div
                        key={row.driver}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                        onClick={() => setSelectedDriverCode(row.driver)}
                        className={`flex cursor-pointer items-center gap-3 border-b border-white/[0.04] py-2.5 transition-colors last:border-b-0 ${row.selected ? 'rounded-md bg-white/[0.04] px-2' : 'hover:bg-white/[0.02]'}`}
                      >
                        <span className="w-5 text-[11px] tabular-nums text-white/25">
                          {row.pos}
                        </span>
                        <span
                          className="h-4 w-[3px] rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span
                          className={`flex-1 text-[13px] font-semibold ${row.selected ? 'text-white' : 'text-white/90'}`}
                        >
                          {row.driver}
                        </span>
                        <span
                          className={`text-[12px] tabular-nums ${row.highlight ? 'font-medium text-emerald-400' : 'text-white/40'} ${row.selected ? 'text-white/80' : ''}`}
                        >
                          {row.gap}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Lap chart */}
                <LandingChart
                  chartSeries={hero.chartSeries}
                  lapLabel={hero.lapLabel}
                  chartTitle={hero.chartTitle}
                  chartType={chartType}
                  setChartType={setChartType}
                />
              </div>

              {/* Right — Track map + telemetry + strategy */}
              <div className="space-y-px">
                {/* Track map */}
                <div className="bg-[#0c0c0e] p-4">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                    Track Map
                  </div>
                  <div className="relative h-[240px] overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b]">
                    <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full">
                      <path
                        d={hero.trackPath || DEFAULT_HERO_VIEW.trackPath || ''}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={hero.trackPath || DEFAULT_HERO_VIEW.trackPath || ''}
                        fill="none"
                        stroke="rgba(255,255,255,0.24)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4 4"
                      />
                      {hero.carDots.map((car, index) => (
                        <motion.circle
                          key={car.code}
                          cx={car.x}
                          cy={car.y}
                          r={car.selected ? 10 : index === 0 ? 9 : 7}
                          fill={car.color}
                          stroke="#000000"
                          strokeWidth={car.selected ? '2.5' : '1.5'}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: car.selected ? 1.08 : 1 }}
                          transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                          className="cursor-pointer"
                          onClick={() => setSelectedDriverCode(car.code)}
                        />
                      ))}
                    </svg>

                    {/* Sector badges */}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      {hero.sectorBadges.map((s) => (
                        <span
                          key={s.label}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all ${s.color} ${s.active ? 'ring-1 ring-white/80 shadow-[0_0_16px_rgba(255,255,255,0.18)] scale-105' : 'opacity-60'}`}
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Speedometer + Lap Timer */}
                <div className="bg-[#0c0c0e] p-4">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                    Telemetry {selectedDriverCode ? `- ${selectedDriverCode}` : ''}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-1 flex-col items-center justify-center">
                      <Speedometer
                        speed={hero.speedKph}
                        maxSpeed={360}
                        size={110}
                        driverColor={hero.driverColor}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                          Lap Timer
                        </span>
                        <span className="text-[16px] font-bold tabular-nums leading-none text-white">
                          {hero.lapElapsed}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col gap-1">
                        {[
                          { label: 'Sector 1', time: hero.s1, tint: hero.s1Tint },
                          { label: 'Sector 2', time: hero.s2, tint: hero.s2Tint },
                          { label: 'Sector 3', time: hero.s3, tint: hero.s3Tint },
                        ].map((sector) => (
                          <div
                            key={sector.label}
                            className={`flex items-center justify-between rounded px-1.5 py-0.5 ${sector.tint}`}
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                              {sector.label}
                            </span>
                            <span
                              className={`text-[12px] font-bold tabular-nums ${sector.tint ? '' : 'text-white/70'}`}
                            >
                              {sector.time}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-white/25">
                        <span>Last Lap</span>
                        <span className="font-medium tabular-nums text-white/50">
                          {hero.lastLapStr}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tyre strategy */}
                <div className="bg-[#0c0c0e] p-4">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/25">
                    Tyre Strategy {selectedDriverCode ? `- ${selectedDriverCode}` : ''}
                  </div>
                  <div className="flex gap-1.5">
                    {hero.strategy.map((stint) => (
                      <motion.div
                        key={stint.compound}
                        className="group relative overflow-hidden rounded-md"
                        style={{ width: stint.width }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, delay: 1.8 }}
                      >
                        <div
                          className={`${stint.color === '#ffffff' ? 'text-black' : 'text-white'} px-2 py-2 text-center text-[11px] font-bold`}
                          style={{ backgroundColor: stint.color }}
                        >
                          {stint.compound}
                          <span className="ml-1 font-normal opacity-70">{stint.laps}L</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reflection/glow */}
          <div className="absolute -bottom-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-t from-red-500/5 to-transparent blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Logo / Social Proof Bar ─── */
const LogoBar = () => (
  <section className="border-y border-white/[0.04] bg-[#09090b] py-8">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {[
          { value: '320+', label: 'KM/H telemetry traces' },
          { value: '0.001s', label: 'Delta precision' },
          { value: '20', label: 'Drivers tracked live' },
          { value: '24', label: 'Races per season' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-2xl font-bold tracking-[-0.02em] text-white">{item.value}</div>
            <div className="mt-1 text-[12px] text-white/30">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Features ─── */
const features = [
  {
    title: 'Track Dominance',
    description:
      'See which driver owns which sector. Sector-by-sector color overlays reveal where speed is gained and lost.',
    accent: 'text-red-400',
    accentBg: 'bg-red-500',
  },
  {
    title: 'Telemetry Overlay',
    description:
      'Speed, brake, throttle and gear traces for any driver and lap. Overlay up to four drivers at once.',
    accent: 'text-orange-400',
    accentBg: 'bg-orange-500',
  },
  {
    title: 'Tyre Strategy',
    description:
      'Stint timelines, degradation curves, compound life and pit window predictions as the race unfolds.',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500',
  },
  {
    title: 'Session Replay',
    description:
      'Scrub through any session with positions, race control events and commentary synced to the timeline.',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500',
  },
  {
    title: 'Driver Comparison',
    description:
      'Head-to-head lap deltas, sector splits and pace trends. Find the corner-by-corner advantage.',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500',
  },
  {
    title: 'Championship Context',
    description:
      'Standings progression, points scenarios and championship momentum across the full season arc.',
    accent: 'text-violet-400',
    accentBg: 'bg-violet-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: stagger(0.12),
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

const FeaturesSection = () => (
  <section id="features" className="relative py-24 lg:py-32">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      {/* Header */}
      <div className="grid items-end gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[13px] font-semibold uppercase tracking-widest text-red-400"
          >
            Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
          >
            Everything the broadcast doesn't show you
          </motion.h2>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[16px] leading-relaxed text-white/40 lg:text-right"
        >
          Every module answers a racing question: who is gaining, where, why, and what happens next.
        </motion.p>
      </div>

      {/* Divider */}
      <div className="mt-12 h-px w-full bg-white/[0.06]" />

      {/* Feature rows — staggered reveal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            variants={itemVariants}
            className="group grid items-center gap-4 border-b border-white/[0.04] py-6 sm:grid-cols-[auto_1fr_1.2fr] sm:gap-8 lg:py-8"
          >
            {/* Number + accent bar */}
            <div className="flex items-center gap-4">
              <span className="text-[13px] tabular-nums text-white/15">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className={`hidden h-px w-8 sm:block ${feat.accentBg} opacity-40`} />
            </div>

            {/* Title */}
            <h3
              className={`text-[18px] font-semibold tracking-[-0.01em] text-white transition-colors group-hover:${feat.accent} sm:text-[20px]`}
            >
              {feat.title}
            </h3>

            {/* Description — slides in */}
            <p className="text-[14px] leading-relaxed text-white/35 transition-colors group-hover:text-white/50">
              {feat.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Product Showcase ─── */
const ProductSection = () => (
  <section id="product" className="relative border-y border-white/[0.04] py-24 lg:py-32">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[13px] font-semibold uppercase tracking-widest text-red-400"
          >
            Race Desk
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
          >
            Built like a pit wall, not a startup dashboard
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-[16px] leading-relaxed text-white/40"
          >
            Timing, telemetry, tyre life and race context connected into one operational surface.
            Switch modules without losing the lap, driver or session you're analyzing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 space-y-4"
          >
            {[
              {
                label: 'Synced context',
                desc: 'Every view shares the same lap, session and driver state',
              },
              {
                label: 'Delta precision',
                desc: '0.001s timing from sector splits to gap evolution',
              },
              {
                label: 'Pit window alerts',
                desc: 'Undercut and overcut probability as the race develops',
              },
              { label: 'Free to start', desc: 'Core race desk features available to every fan' },
            ].map((item) => (
              <div key={item.label} className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="#22c55e"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white">{item.label}</div>
                  <div className="text-[13px] text-white/35">{item.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-white transition-colors hover:text-red-400"
            >
              Try it now
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 7h12M8 2l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Decision table illustration */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/25">
                Signal Board
              </span>
            </div>
            <div className="divide-y divide-white/[0.04] p-4">
              {[
                {
                  label: 'Lap delta',
                  value: '-0.358s',
                  note: 'Gaining through S1 braking',
                  color: 'text-emerald-400',
                },
                {
                  label: 'Tyre drop',
                  value: '+0.086s/lap',
                  note: 'Medium crossing target cliff',
                  color: 'text-amber-400',
                },
                {
                  label: 'Pit window',
                  value: 'Lap 23-25',
                  note: 'Undercut probability rising',
                  color: 'text-red-400',
                },
                {
                  label: 'Track bias',
                  value: 'S1/S3',
                  note: 'Strong under braking and exit',
                  color: 'text-blue-400',
                },
              ].map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span className="w-20 shrink-0 text-[12px] text-white/30">{row.label}</span>
                  <span className={`w-24 shrink-0 text-[16px] font-bold tabular-nums ${row.color}`}>
                    {row.value}
                  </span>
                  <span className="text-[12px] text-white/25">{row.note}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ─── Stats ─── */
const StatsSection = () => (
  <section className="py-24 lg:py-32">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl"
        >
          The broadcast shows the result. <span className="text-white/40">We show the cause.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-[16px] leading-relaxed text-white/40"
        >
          Follow the chain from raw timing to race decisions — pace drift, sector splits,
          degradation curves and pit-loss context in one interface.
        </motion.p>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { number: '57', label: 'Laps mapped in real-time', suffix: '' },
          { number: '3', label: 'Sector-level precision', suffix: 'sectors' },
          { number: '4', label: 'Tyre compounds tracked', suffix: 'compounds' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 text-center"
          >
            <div className="text-4xl font-bold tracking-[-0.02em] text-white">
              {stat.number}
              {stat.suffix && (
                <span className="ml-1 text-lg font-normal text-white/30">{stat.suffix}</span>
              )}
            </div>
            <div className="mt-2 text-[13px] text-white/35">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── CTA ─── */
const CTASection = () => (
  <section
    id="pricing"
    className="relative overflow-hidden border-t border-white/[0.04] py-24 lg:py-32"
  >
    {/* Gradient bg */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-red-500/[0.06] blur-[120px]" />
    </div>

    <div className="relative z-10 mx-auto max-w-6xl px-5 text-center lg:px-8">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
      >
        Open the race desk before the next session
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/40"
      >
        Start free. The core race dashboard — timing, telemetry, strategy — is available to every
        fan. Sign in for saved favorites, advanced views and deeper analysis.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      >
        <Link
          to="/dashboard"
          className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.12)]"
        >
          Get started — it's free
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path
              d="M1 7h12M8 2l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <Link
          to="/auth"
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 text-[14px] font-medium text-white/80 transition-all hover:border-white/20"
        >
          Sign in
        </Link>
      </motion.div>
    </div>
  </section>
);

/* ─── Footer ─── */
const footerGroups = [
  {
    title: 'Platform',
    links: [
      { label: 'Race Desk', href: '/dashboard' },
      { label: 'Calendar', href: '/calendar' },
      { label: 'Driver Standings', href: '/standings/drivers' },
      { label: 'Team Standings', href: '/standings/teams' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy-policy' },
      { label: 'Terms', href: '/terms-of-service' },
      { label: 'Refunds', href: '/refund-policy' },
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-white/[0.04] bg-[#09090b] py-12">
    <div className="mx-auto max-w-6xl px-5 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <FastlyticsLogo size={28} />
            <span className="text-[15px] font-bold italic tracking-[-0.02em] text-white">
              FASTLYTICS
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/35">
            Formula 1 analytics — telemetry, race strategy, session replay and championship context.
          </p>
          <p className="mt-4 text-[11px] text-white/20">
            Not affiliated with Formula One World Championship Limited.
          </p>
        </div>

        {/* Link columns */}
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white/30">
              {group.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-[13px] text-white/40 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-6 sm:flex-row">
        <p className="text-[12px] text-white/20">
          &copy; {new Date().getFullYear()} Fastlytics. All rights reserved.
        </p>
        <p className="text-[12px] text-white/20">Built for race weekends.</p>
      </div>
    </div>
  </footer>
);

export { Landing };
export default Landing;
