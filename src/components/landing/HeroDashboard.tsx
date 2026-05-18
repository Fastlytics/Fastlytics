import { useMemo } from 'react';
import Speedometer from '@/components/replay/Speedometer';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import LandingChart from './LandingChart';
import { ChartType, HeroViewModel } from './hero-types';

const HERO_WINDOW_CONTROLS = [
  {
    label: 'Close',
    bgClass: 'bg-[#ff5f57]',
    icon: (
      <svg viewBox="0 0 10 10" className="size-2.5" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 10 10" className="size-2.5" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 10 10" className="size-2.5" fill="none" aria-hidden="true">
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
              <span className="text-[20px] font-semibold tabular-nums leading-none text-white">
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
                    className={`text-[14px] font-semibold tabular-nums ${hero[sector.tintKey] ? '' : 'text-white/70'}`}
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
                <div className="mt-1 text-[18px] font-semibold tabular-nums text-white">
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
              className={`${stint.color === '#ffffff' ? 'text-black' : 'text-white'} px-3 py-2.5 text-center text-[13px] font-semibold`}
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
            <div className="mt-1 text-[20px] font-semibold tabular-nums text-white">
              {hero[sector.key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
            className={`flex size-3 items-center justify-center rounded-full ${control.bgClass} shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.18)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30`}
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
  setUserSelectedDriverCode,
  variant,
}: {
  hero: HeroViewModel;
  isLoading: boolean;
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
        <svg viewBox="0 0 1000 500" className="absolute inset-0 size-full">
          <path
            d={hero.trackPath || ''}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={hero.trackPath || ''}
            fill="none"
            stroke="rgba(255,255,255,0.24)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
          />
          {hero.carDots.map((car, index) => (
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
          setUserSelectedDriverCode={setUserSelectedDriverCode}
          variant="expanded"
        />
      </div>
      <div className="grid min-h-0 gap-px bg-white/[0.04] lg:grid-rows-[350px_minmax(260px,1fr)]">
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
                  className={`${stint.color === '#ffffff' ? 'text-black' : 'text-white'} px-2 py-2.5 text-center text-[12px] font-semibold`}
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

interface HeroDashboardProps {
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
}

export default function HeroDashboard({
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
}: HeroDashboardProps) {
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
              Booting
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

      <div className={`relative ${variant === 'expanded' ? 'flex min-h-0 flex-1' : ''}`}>
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-[#050506]/95 backdrop-blur-sm">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-24 w-24 rounded-full bg-red-500/15 blur-2xl animate-[glow-pulse_2.5s_ease-in-out_infinite]" />
              <div className="relative animate-[logo-breathe_2.5s_ease-in-out_infinite]">
                <FastlyticsLogo size={48} showText={false} disableAnimation />
              </div>
            </div>
            <div
              className="w-40 overflow-hidden rounded-full bg-white/[0.08]"
              style={{ height: '3px' }}
            >
              <div className="h-full w-full origin-left animate-[boot-progress_2.8s_cubic-bezier(0.65,0,0.35,1)_infinite] rounded-full bg-gradient-to-r from-red-500/80 via-white/60 to-red-500/80" />
            </div>
          </div>
        )}
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
      </div>
    </>
  );
}
