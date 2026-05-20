// knip-ignore
export type HeroTimingRow = {
  pos: number;
  driver: string;
  team: string;
  gap: string;
  color: string;
  highlight: boolean;
  selected: boolean;
};

export type HeroChartPoint = { x: number; y: number; value: number; label: string };

export type HeroChartSeries = {
  key: string;
  path: string;
  color: string;
  strokeWidth: number;
  opacity?: number;
  points: HeroChartPoint[];
  valueLabel: string;
};

export type HeroTelemetryItem = {
  label: string;
  value: number;
  color: string;
  suffix?: string;
};

export type HeroStrategyStint = {
  compound: string;
  laps: number;
  color: string;
  width: string;
};

export type HeroCarDot = {
  code: string;
  color: string;
  x: number;
  y: number;
  selected: boolean;
};

export type HeroViewModel = {
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
  bestLapStr: string;
  lastLapDelta: string;
  lastLapDeltaTint: string;
  intervalToAhead: string;
  aheadDriverCode: string | null;
  comparisonOpponentCode: string | null;
  comparisonChartSeries: HeroChartSeries[];
  s1: string;
  s2: string;
  s3: string;
  s1Tint: string;
  s2Tint: string;
  s3Tint: string;
  lapElapsed: string;
};

export type HeroWindowBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
};

export type ChartType = 'speed' | 'throttle' | 'brake' | 'rpm';
