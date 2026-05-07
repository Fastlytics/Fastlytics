import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Speedometer from '@/components/replay/Speedometer';
import LandingChart from './LandingChart';
import { ChartType, HeroViewModel, HeroWindowBounds } from './hero-types';
import {
  DEFAULT_HERO_VIEW,
  buildLandingHeroView,
  getExpandedHeroBounds,
  pickLandingReplayKey,
  prepareLandingReplayContext,
} from './hero-utils';
import { useLandingHeroSource } from './useLandingHeroSource';

const HERO_DRIVER_CODE_KEY = 'hero-driver-code-v1';

const HERO_WINDOW_CONTROLS = [
  {
    label: 'Close',
    bgClass: 'bg-[#ff5f57]',
    icon: (
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
        <path
          d="M2.2 2.2 7.8 7.8M7.8 2.2 2.2 7.8"
          stroke="rgba(57,34,30,0.95)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'Minimize',
    bgClass: 'bg-[#ffbd2e]',
    icon: (
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
        <path
          d="M2.2 5h5.6"
          stroke="rgba(74,52,16,0.95)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'Expand',
    bgClass: 'bg-[#28c840]',
    icon: (
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
        <path
          d="M2.4 7.6 7.6 2.4M4.9 2.4h2.7v2.7"
          stroke="rgba(20,68,28,0.95)"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;

const HERO_SECTORS = [
  { label: 'Sector 1', key: 's1' as const, tintKey: 's1Tint' as const },
  { label: 'Sector 2', key: 's2' as const, tintKey: 's2Tint' as const },
  { label: 'Sector 3', key: 's3' as const, tintKey: 's3Tint' as const },
];

function HeroWindowControls({
  expanded = false,
  onClose,
  onMinimize,
  onExpand,
}: {
  expanded?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onExpand?: () => void;
}) {
  const getAction = (label: string) => {
    if (label === 'Close') return onClose;
    if (label === 'Minimize') return onMinimize;
    return onExpand;
  };

  return (
    <div className="group flex gap-1.5">
      {HERO_WINDOW_CONTROLS.map((control) => {
        const action = getAction(control.label);
        return (
          <button
            key={control.label}
            type="button"
            aria-label={expanded && control.label === 'Expand' ? 'Restore' : control.label}
            onClick={action}
            className={`flex h-3 w-3 items-center justify-center rounded-full ${control.bgClass} shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.18)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30`}
          >
            <span className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {control.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PositionsPanel({
  hero,
  isLoading,
  selectedDriverCode,
  setUserSelectedDriverCode,
  variant,
}: {
  hero: HeroViewModel;
  isLoading: boolean;
  selectedDriverCode: string | null;
  setUserSelectedDriverCode: (value: string) => void;
  variant: 'compact' | 'expanded';
}) {
  const rows = variant === 'compact' ? hero.timingRows.slice(0, 5) : hero.timingRows;

  return (
    <div className={`bg-[#0c0c0e] p-5 ${variant === 'expanded' ? 'flex min-h-0 flex-col' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium uppercase tracking-wider text-white/25">
          {variant === 'compact' ? 'Race Positions' : 'Full Leaderboard'}
        </span>
        {variant === 'expanded' && (
          <span className="text-[12px] tabular-nums text-white/25">
            {hero.timingRows.length} drivers
          </span>
        )}
      </div>
      <div
        className={
          variant === 'compact' ? 'space-y-0' : 'min-h-0 flex-1 overflow-y-auto space-y-0 pr-1'
        }
      >
        {rows.map((row) => (
          <button
            key={row.driver}
            type="button"
            disabled={isLoading}
            onClick={isLoading ? undefined : () => setUserSelectedDriverCode(row.driver)}
            className={`flex w-full items-center gap-3 border-b border-white/[0.04] py-4 text-left transition-colors last:border-b-0 disabled:cursor-default ${
              variant === 'expanded' ? 'rounded-lg px-2' : ''
            } ${row.selected ? 'rounded-md bg-white/[0.04] px-2' : 'hover:bg-white/[0.02]'}`}
          >
            <span className="w-5 text-[13px] tabular-nums text-white/25">{row.pos}</span>
            <span className="h-4 w-[3px] rounded-full" style={{ backgroundColor: row.color }} />
            <span
              className={`flex-1 text-[15px] font-semibold ${row.selected ? 'text-white' : 'text-white/90'}`}
            >
              {row.driver}
            </span>
            {variant === 'expanded' && (
              <span className="truncate text-[11px] text-white/35">{row.team}</span>
            )}
            <span
              className={`text-[13px] tabular-nums ${row.highlight ? 'font-medium text-emerald-400' : 'text-white/40'} ${row.selected ? 'text-white/80' : ''}`}
            >
              {row.gap}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrackMapPanel({
  hero,
  isLoading,
  setUserSelectedDriverCode,
  variant,
}: {
  hero: HeroViewModel;
  isLoading: boolean;
  setUserSelectedDriverCode: (value: string) => void;
  variant: 'compact' | 'expanded';
}) {
  const dots = hero.carDots;

  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium uppercase tracking-wider text-white/25">
          Track Map
        </span>
        {variant === 'expanded' && (
          <span className="text-[12px] tabular-nums text-white/25">{hero.lapLabel}</span>
        )}
      </div>
      <div
        className={`relative overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b] ${variant === 'compact' ? 'h-[320px]' : 'h-full min-h-[300px]'}`}
      >
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
          {dots.map((car, index) => (
            <circle
              key={car.code}
              cx={car.x}
              cy={car.y}
              r={car.selected ? 12 : index === 0 ? 11 : 9}
              fill={car.color}
              stroke="#000000"
              strokeWidth={car.selected ? '2.5' : '1.5'}
              className={`${isLoading ? '' : 'cursor-pointer'} transition-all duration-150`}
              onClick={isLoading ? undefined : () => setUserSelectedDriverCode(car.code)}
            />
          ))}
        </svg>
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {hero.sectorBadges.map((sector) => (
            <span
              key={sector.label}
              className={`rounded px-2 py-1 text-[11px] font-semibold transition-all ${sector.color} ${sector.active ? 'scale-105 ring-1 ring-white/80 shadow-[0_0_16px_rgba(255,255,255,0.18)]' : 'opacity-60'}`}
            >
              {sector.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TelemetryPanel({
  hero,
  selectedDriverCode,
  variant,
}: {
  hero: HeroViewModel;
  selectedDriverCode: string | null;
  variant: 'compact' | 'expanded';
}) {
  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/25">
        Telemetry {selectedDriverCode ? `- ${selectedDriverCode}` : ''}
      </div>
      {variant === 'compact' ? (
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col items-center justify-center">
            <Speedometer
              speed={hero.speedKph}
              maxSpeed={360}
              size={140}
              driverColor={hero.driverColor}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-white/40">
                Lap Timer
              </span>
              <span className="text-[20px] font-bold tabular-nums leading-none text-white">
                {hero.lapElapsed}
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {HERO_SECTORS.map((sector) => (
                <div
                  key={sector.label}
                  className={`flex items-center justify-between rounded px-1.5 py-0.5 ${hero[sector.tintKey]}`}
                >
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
                    {sector.label}
                  </span>
                  <span
                    className={`text-[14px] font-bold tabular-nums ${hero[sector.tintKey] ? '' : 'text-white/70'}`}
                  >
                    {hero[sector.key]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[12px] text-white/25">
              <span>Last Lap</span>
              <span className="font-medium tabular-nums text-white/50">{hero.lastLapStr}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
          <div className="flex items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
            <Speedometer
              speed={hero.speedKph}
              maxSpeed={360}
              size={140}
              driverColor={hero.driverColor}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
            {[
              { label: 'Lap Timer', value: hero.lapElapsed },
              { label: 'Last Lap', value: hero.lastLapStr },
              { label: 'Speed', value: `${hero.speedKph} km/h` },
              { label: 'Status', value: hero.statusLabel },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/[0.05] bg-white/[0.025] p-3"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  {item.label}
                </div>
                <div className="mt-1 text-[18px] font-bold tabular-nums text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectorBoardPanel({ hero }: { hero: HeroViewModel }) {
  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/30">
        Sector Board
      </div>
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        {HERO_SECTORS.map((sector) => (
          <div
            key={sector.label}
            className={`rounded-lg border border-white/[0.05] bg-white/[0.025] p-3 ${hero[sector.tintKey]}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {sector.label}
            </div>
            <div className="mt-1 text-[20px] font-bold tabular-nums text-white">
              {hero[sector.key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TelemetryBarsPanel({
  hero,
  selectedDriverCode,
}: {
  hero: HeroViewModel;
  selectedDriverCode: string | null;
}) {
  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/30">
        Telemetry {selectedDriverCode ? `- ${selectedDriverCode}` : ''}
      </div>
      <div className="space-y-3">
        {hero.telemetry.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-16 text-[12px] text-white/35">{item.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-[width] duration-150 ${item.color}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
            {item.suffix && (
              <span className="w-20 text-right text-[12px] tabular-nums text-white/45">
                {item.suffix}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyPanel({
  hero,
  selectedDriverCode,
}: {
  hero: HeroViewModel;
  selectedDriverCode: string | null;
}) {
  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/25">
        Tyre Strategy {selectedDriverCode ? `- ${selectedDriverCode}` : ''}
      </div>
      <div className="flex gap-1.5">
        {hero.strategy.map((stint) => (
          <div
            key={`${stint.compound}-${stint.laps}`}
            className="group relative overflow-hidden rounded-md"
            style={{ width: stint.width }}
          >
            <div
              className={`${stint.color === '#ffffff' ? 'text-black' : 'text-white'} px-3 py-2.5 text-center text-[13px] font-bold`}
              style={{ backgroundColor: stint.color }}
            >
              {stint.compound}
              <span className="ml-1 font-normal opacity-70">{stint.laps}L</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroDashboard({
  hero,
  variant,
  isLoading,
  chartType,
  setChartType,
  selectedDriverCode,
  canSelectDifferentCache,
  selectDifferentCache,
  setUserSelectedDriverCode,
  onChromeAction,
}: {
  hero: HeroViewModel;
  variant: 'compact' | 'expanded';
  isLoading: boolean;
  chartType: ChartType;
  setChartType: (value: ChartType) => void;
  selectedDriverCode: string | null;
  canSelectDifferentCache: boolean;
  selectDifferentCache: (() => void) | null;
  setUserSelectedDriverCode: (value: string) => void;
  onChromeAction?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <HeroWindowControls
            expanded={variant === 'expanded'}
            onClose={variant === 'expanded' ? onChromeAction : undefined}
            onMinimize={variant === 'expanded' ? onChromeAction : undefined}
            onExpand={variant === 'compact' ? onChromeAction : undefined}
          />
          <div className="h-5 w-px bg-white/[0.06]" />
          <span className="truncate text-[13px] font-medium text-white/30 sm:text-[14px]">
            {hero.titleBar}
          </span>
          {isLoading && (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Loading replay
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => selectDifferentCache?.()}
          disabled={isLoading || !canSelectDifferentCache}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-40"
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

      {variant === 'compact' ? (
        <CompactLayout
          hero={hero}
          isLoading={isLoading}
          chartType={chartType}
          setChartType={setChartType}
          selectedDriverCode={selectedDriverCode}
          setUserSelectedDriverCode={setUserSelectedDriverCode}
        />
      ) : (
        <ExpandedLayout
          hero={hero}
          isLoading={isLoading}
          chartType={chartType}
          setChartType={setChartType}
          selectedDriverCode={selectedDriverCode}
          setUserSelectedDriverCode={setUserSelectedDriverCode}
        />
      )}
    </>
  );
}

function CompactLayout({
  hero,
  isLoading,
  chartType,
  setChartType,
  selectedDriverCode,
  setUserSelectedDriverCode,
}: {
  hero: HeroViewModel;
  isLoading: boolean;
  chartType: ChartType;
  setChartType: (value: ChartType) => void;
  selectedDriverCode: string | null;
  setUserSelectedDriverCode: (value: string) => void;
}) {
  return (
    <div className="grid gap-px bg-white/[0.04] p-px md:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-px">
        <PositionsPanel
          hero={hero}
          isLoading={isLoading}
          selectedDriverCode={selectedDriverCode}
          setUserSelectedDriverCode={setUserSelectedDriverCode}
          variant="compact"
        />
        <LandingChart
          chartSeries={hero.chartSeries}
          lapLabel={hero.lapLabel}
          chartTitle={hero.chartTitle}
          chartType={chartType}
          setChartType={setChartType}
          isLoading={isLoading}
        />
      </div>
      <div className="flex flex-col gap-px">
        <TrackMapPanel
          hero={hero}
          isLoading={isLoading}
          setUserSelectedDriverCode={setUserSelectedDriverCode}
          variant="compact"
        />
        <TelemetryPanel hero={hero} selectedDriverCode={selectedDriverCode} variant="compact" />
        <StrategyPanel hero={hero} selectedDriverCode={selectedDriverCode} />
      </div>
    </div>
  );
}

function ExpandedLayout({
  hero,
  isLoading,
  chartType,
  setChartType,
  selectedDriverCode,
  setUserSelectedDriverCode,
}: {
  hero: HeroViewModel;
  isLoading: boolean;
  chartType: ChartType;
  setChartType: (value: ChartType) => void;
  selectedDriverCode: string | null;
  setUserSelectedDriverCode: (value: string) => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 gap-px bg-white/[0.04] p-px lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr_420px]">
      <div className="flex min-h-0 flex-col bg-[#0c0c0e]">
        <PositionsPanel
          hero={hero}
          isLoading={isLoading}
          selectedDriverCode={selectedDriverCode}
          setUserSelectedDriverCode={setUserSelectedDriverCode}
          variant="expanded"
        />
      </div>
      <div className="grid min-h-0 gap-px bg-white/[0.04] lg:grid-rows-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <TrackMapPanel
          hero={hero}
          isLoading={isLoading}
          setUserSelectedDriverCode={setUserSelectedDriverCode}
          variant="expanded"
        />
        <LandingChart
          chartSeries={hero.chartSeries}
          lapLabel={hero.lapLabel}
          chartTitle={hero.chartTitle}
          chartType={chartType}
          setChartType={setChartType}
          isLoading={isLoading}
        />
      </div>
      <div className="grid min-h-0 gap-px bg-white/[0.04] lg:col-span-2 xl:col-span-1 xl:grid-rows-[auto_auto_1fr]">
        <TelemetryPanel hero={hero} selectedDriverCode={selectedDriverCode} variant="expanded" />
        <SectorBoardPanel hero={hero} />
        <div className="min-h-0 overflow-y-auto bg-[#0c0c0e] p-5">
          <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/30">
            Telemetry and Strategy
          </div>
          <div className="space-y-3">
            {hero.telemetry.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-16 text-[12px] text-white/35">{item.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-150 ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                {item.suffix && (
                  <span className="w-20 text-right text-[12px] tabular-nums text-white/45">
                    {item.suffix}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-1.5">
            {hero.strategy.map((stint) => (
              <div
                key={`${stint.compound}-${stint.laps}`}
                className="overflow-hidden rounded-md"
                style={{ width: stint.width }}
              >
                <div
                  className={`${stint.color === '#ffffff' ? 'text-black' : 'text-white'} px-2 py-2.5 text-center text-[12px] font-bold`}
                  style={{ backgroundColor: stint.color }}
                >
                  {stint.compound}
                  <span className="ml-1 font-normal opacity-70">{stint.laps}L</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { selectedCache, metadata, chunk, canSelectDifferentCache, selectDifferentCache } =
    useLandingHeroSource();
  const cacheKey = selectedCache ? pickLandingReplayKey(selectedCache) : '';
  const cacheKeyRef = useRef(cacheKey);
  const compactHeroWindowRef = useRef<HTMLDivElement>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('speed');
  const [heroModalPhase, setHeroModalPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const closeTimeoutRef = useRef<number | null>(null);
  const [heroWindowAnimation, setHeroWindowAnimation] = useState<{
    origin: HeroWindowBounds;
    target: HeroWindowBounds;
  } | null>(null);
  const isHeroExpanded = heroModalPhase !== 'closed';
  const isHeroClosing = heroModalPhase === 'closing';
  const leaderCode = metadata?.selected_drivers?.[0] || chunk?.selected_drivers?.[0] || null;

  const derivedDriverCode = useMemo(() => {
    if (!leaderCode) return null;
    const availableDrivers = metadata?.selected_drivers || chunk?.selected_drivers || [];
    const storedDriverCode =
      typeof window === 'undefined' ? null : sessionStorage.getItem(HERO_DRIVER_CODE_KEY);
    if (storedDriverCode && availableDrivers.includes(storedDriverCode)) return storedDriverCode;
    return leaderCode;
  }, [leaderCode, metadata?.selected_drivers, chunk?.selected_drivers]);

  const [userSelectedDriverCode, setUserSelectedDriverCode] = useState<string | null>(null);
  const selectedDriverCode = userSelectedDriverCode || derivedDriverCode;

  const handleSelectDriver = useCallback((value: string) => {
    setUserSelectedDriverCode(value);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(HERO_DRIVER_CODE_KEY, value);
    }
  }, []);

  useEffect(() => {
    if (cacheKeyRef.current !== cacheKey) {
      cacheKeyRef.current = cacheKey;
      setFrameIndex(0);
      setChartType('speed');
      setUserSelectedDriverCode(null);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!chunk || chunk.time.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setFrameIndex((current) => {
        const next = current + 1;
        return next >= chunk.time.length ? 0 : next;
      });
    }, 1000 / 25);

    return () => window.clearInterval(intervalId);
  }, [chunk]);

  const closeExpandedHero = useCallback(() => {
    setHeroModalPhase((current) => (current === 'closed' ? current : 'closing'));
    closeTimeoutRef.current = window.setTimeout(() => {
      setHeroModalPhase('closed');
      closeTimeoutRef.current = null;
    }, 420);
  }, []);

  useEffect(() => {
    if (!isHeroExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeExpandedHero();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeExpandedHero, isHeroExpanded]);

  const preparedReplay = useMemo(() => {
    if (!selectedCache || !metadata || !chunk) return null;
    return prepareLandingReplayContext(selectedCache, metadata, chunk);
  }, [selectedCache, metadata, chunk]);

  const hero = useMemo(() => {
    if (!preparedReplay || !selectedDriverCode) return null;
    try {
      return buildLandingHeroView(preparedReplay, selectedDriverCode, frameIndex, chartType);
    } catch {
      return null;
    }
  }, [preparedReplay, selectedDriverCode, frameIndex, chartType]);

  const displayedHero = hero || DEFAULT_HERO_VIEW;
  const isHeroLoading = !hero;
  const shouldAnimateCompactHero = true;

  const openExpandedHero = () => {
    const target = getExpandedHeroBounds();
    const rect = compactHeroWindowRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: 12,
        }
      : target;

    setHeroWindowAnimation({ origin, target });
    setHeroModalPhase('open');
  };

  return (
    <section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-red-500/[0.07] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-orange-500/[0.05] blur-[100px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Race intelligence <span className="text-red-500">for every</span> Formula 1 session
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/50"
          >
            Telemetry, strategy, pace and championship context wired into one live race desk. See
            what the pit wall sees.
          </motion.p>

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

        <motion.div
          initial={shouldAnimateCompactHero ? { opacity: 0, y: 40 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimateCompactHero ? { duration: 0.8, delay: 0.45 } : { duration: 0 }}
          className="relative mx-auto mt-16 max-w-7xl lg:mt-20"
        >
          <div className="absolute -inset-6 rounded-2xl bg-gradient-to-b from-red-500/10 via-transparent to-transparent blur-2xl" />
          <div
            ref={compactHeroWindowRef}
            className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_120px_rgba(0,0,0,0.6)] ${
              isHeroExpanded ? 'pointer-events-none opacity-0' : ''
            }`}
          >
            {isHeroLoading && (
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
            )}
            <HeroDashboard
              hero={displayedHero}
              variant="compact"
              isLoading={isHeroLoading}
              chartType={chartType}
              setChartType={setChartType}
              selectedDriverCode={selectedDriverCode}
              canSelectDifferentCache={canSelectDifferentCache}
              selectDifferentCache={selectDifferentCache}
              setUserSelectedDriverCode={handleSelectDriver}
              onChromeAction={openExpandedHero}
            />
          </div>
          <div className="absolute -bottom-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-t from-red-500/5 to-transparent blur-3xl" />
        </motion.div>

        {hero && heroWindowAnimation && heroModalPhase !== 'closed' && (
          <>
            <motion.div
              key="hero-expanded-backdrop"
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHeroClosing ? 0 : 1 }}
              transition={{ duration: isHeroClosing ? 0.22 : 0.42 }}
              onMouseDown={closeExpandedHero}
            />
            <motion.div
              key="hero-expanded-window"
              className="fixed z-[80] flex flex-col overflow-hidden border border-white/[0.10] bg-[#0c0c0e] shadow-[0_40px_180px_rgba(0,0,0,0.75)]"
              initial={heroWindowAnimation.origin}
              animate={isHeroClosing ? heroWindowAnimation.origin : heroWindowAnimation.target}
              transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.95 }}
            >
              <HeroDashboard
                hero={displayedHero}
                variant={isHeroClosing ? 'compact' : 'expanded'}
                isLoading={false}
                chartType={chartType}
                setChartType={setChartType}
                selectedDriverCode={selectedDriverCode}
                canSelectDifferentCache={canSelectDifferentCache}
                selectDifferentCache={selectDifferentCache}
                setUserSelectedDriverCode={handleSelectDriver}
                onChromeAction={closeExpandedHero}
              />
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
