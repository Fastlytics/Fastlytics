import { useMemo } from 'react';
import Speedometer from '@/components/replay/Speedometer';
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

function LoadingBar({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-white/[0.05] ${className}`} aria-hidden="true">
      <div className="size-full animate-[shimmer_2.2s_linear_infinite] bg-[linear-gradient(110deg,transparent_15%,rgba(255,255,255,0.14)_45%,transparent_75%)] bg-[length:200%_100%]" />
    </div>
  );
}

function LoadingPositionsPanel({ variant }: { variant: 'compact' | 'expanded' }) {
  const rows = variant === 'compact' ? 5 : 10;
  const rowIds = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows]);

  return (
    <div className={`bg-[#0c0c0e] p-5 ${variant === 'expanded' ? 'flex min-h-0 flex-col' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium uppercase tracking-wider text-white/25">
          {variant === 'compact' ? 'Race Positions' : 'Full Leaderboard'}
        </span>
        {variant === 'expanded' && <LoadingBar className="h-3 w-[4.5rem]" />}
      </div>
      <div
        className={
          variant === 'compact' ? 'space-y-0' : 'min-h-0 flex-1 overflow-y-auto space-y-0 pr-1'
        }
      >
        {rowIds.map((rowId) => (
          <div
            key={rowId}
            className={`flex items-center gap-3 border-b border-white/[0.04] py-4 last:border-b-0 ${rowId === 0 ? 'rounded-md bg-white/[0.03] px-2' : ''} ${variant === 'expanded' ? 'px-2' : ''}`}
          >
            <div className="flex w-5 justify-center text-[13px] tabular-nums text-white/18">
              {rowId + 1}
            </div>
            <div
              className={`h-4 w-[3px] rounded-full ${rowId < 3 ? 'bg-red-500/60' : 'bg-white/12'}`}
            />
            <LoadingBar className="h-4 flex-1 max-w-[4rem]" />
            {variant === 'expanded' && <LoadingBar className="hidden h-3 w-[5rem] sm:block" />}
            <LoadingBar className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingChartPanel({ chartType }: { chartType: ChartType }) {
  return (
    <div className="flex flex-1 flex-col bg-[#0c0c0e] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium uppercase tracking-wider text-white/25">
            Loading Telemetry
          </span>
          <div className="flex items-center gap-0.5 rounded border border-white/[0.06] bg-white/[0.02] p-0.5">
            {['speed', 'throttle', 'brake', 'rpm'].map((type) => (
              <span
                key={type}
                className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${chartType === type ? 'bg-white/[0.10] text-white' : 'text-white/25'}`}
              >
                {type === 'speed'
                  ? 'SPD'
                  : type === 'throttle'
                    ? 'THR'
                    : type === 'brake'
                      ? 'BRK'
                      : 'RPM'}
              </span>
            ))}
          </div>
        </div>
        <LoadingBar className="h-3 w-16" />
      </div>
      <div className="relative flex-1 overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b] race-grid-bg race-scanline">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.04)_45%,transparent_70%)] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
        <svg
          viewBox="0 0 600 220"
          className="absolute inset-0 size-full"
          preserveAspectRatio="none"
        >
          {[55, 110, 165].map((y) => (
            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          <path
            d="M0 170 C70 166 140 150 210 144 C280 137 350 126 420 99 C485 74 540 60 600 42"
            fill="none"
            stroke="rgba(255,59,48,0.7)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            d="M0 178 C95 182 165 165 235 158 C315 149 395 127 470 116 C530 108 572 95 600 84"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 10"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#09090b] to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/[0.06] bg-black/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white/40">
          <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
          Buffering live trace
        </div>
      </div>
    </div>
  );
}

function LoadingTrackMapPanel({ variant }: { variant: 'compact' | 'expanded' }) {
  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium uppercase tracking-wider text-white/25">
          Track Map
        </span>
        {variant === 'expanded' && <LoadingBar className="h-3 w-16" />}
      </div>
      <div
        className={`relative overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b] race-grid-bg ${variant === 'compact' ? 'h-[320px]' : 'h-full min-h-[300px]'}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_58%)]" />
        <div className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]" />
        <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
        <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.65)]" />
        <div className="absolute inset-y-0 left-[-20%] w-[38%] animate-[shimmer_2.6s_linear_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,59,48,0.14),transparent)] blur-md" />
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {['S1', 'S2', 'S3'].map((label, index) => (
            <span
              key={label}
              className={`rounded px-2 py-1 text-[11px] font-semibold ${index === 0 ? 'bg-red-500/15 text-red-300 ring-1 ring-white/15' : index === 1 ? 'bg-amber-500/10 text-amber-200/80' : 'bg-emerald-500/10 text-emerald-200/80'} ${index === 0 ? 'animate-pulse' : 'opacity-70'}`}
            >
              {label}
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

function LoadingTelemetryPanel({ variant }: { variant: 'compact' | 'expanded' }) {
  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/25">
        Telemetry Stream
      </div>
      {variant === 'compact' ? (
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative flex size-[140px] items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
              <div className="absolute inset-5 rounded-full border border-white/[0.05]" />
              <div className="absolute size-[128px] animate-spin rounded-full border-2 border-transparent border-t-red-400/80 border-r-red-500/20" />
              <div className="text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
                  Sync
                </div>
                <div className="mt-1 text-[24px] font-semibold tabular-nums text-white/85">--</div>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-white/40">
                Lap Timer
              </span>
              <LoadingBar className="h-5 w-24" />
            </div>
            <div className="mt-1 flex flex-col gap-1.5">
              {HERO_SECTORS.map((sector) => (
                <div key={sector.label} className="rounded bg-white/[0.025] px-1.5 py-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
                      {sector.label}
                    </span>
                    <LoadingBar className="h-4 w-[4.5rem]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[12px] text-white/25">
              <span>Last Lap</span>
              <LoadingBar className="h-3 w-20" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
          <div className="flex items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
            <div className="relative flex size-[140px] items-center justify-center rounded-full border border-white/[0.06]">
              <div className="absolute inset-5 rounded-full border border-white/[0.05]" />
              <div className="absolute size-[128px] animate-spin rounded-full border-2 border-transparent border-t-red-400/80 border-r-red-500/20" />
              <div className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                Syncing
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
            {['Lap Timer', 'Last Lap', 'Speed', 'Status'].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-white/[0.05] bg-white/[0.025] p-3"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  {label}
                </div>
                <LoadingBar className="mt-2 h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSectorBoardPanel() {
  return (
    <div className="bg-[#0c0c0e] p-5">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/30">
        Sector Board
      </div>
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        {HERO_SECTORS.map((sector, index) => (
          <div
            key={sector.label}
            className="rounded-lg border border-white/[0.05] bg-white/[0.025] p-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {sector.label}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <LoadingBar className="h-6 w-20" />
              {index === 0 && <span className="size-1.5 animate-pulse rounded-full bg-red-400" />}
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

function LoadingTelemetryAndStrategyPanel() {
  return (
    <div className="min-h-0 overflow-y-auto bg-[#0c0c0e] p-5">
      <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/30">
        Telemetry and Strategy
      </div>
      <div className="space-y-3">
        {['Throttle', 'Brake', 'Speed', 'DRS'].map((label, index) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-16 text-[12px] text-white/35">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full animate-[shimmer_2.2s_linear_infinite] bg-[length:200%_100%] ${index === 0 ? 'bg-[linear-gradient(90deg,rgba(34,197,94,0.2),rgba(34,197,94,0.75),rgba(34,197,94,0.2))]' : index === 1 ? 'bg-[linear-gradient(90deg,rgba(239,68,68,0.2),rgba(239,68,68,0.72),rgba(239,68,68,0.2))]' : index === 2 ? 'bg-[linear-gradient(90deg,rgba(59,130,246,0.18),rgba(59,130,246,0.68),rgba(59,130,246,0.18))]' : 'bg-[linear-gradient(90deg,rgba(16,185,129,0.16),rgba(16,185,129,0.6),rgba(16,185,129,0.16))]'}`}
                style={{ width: `${index === 0 ? 72 : index === 1 ? 28 : index === 2 ? 64 : 18}%` }}
              />
            </div>
            <LoadingBar className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-1.5">
        {[
          { width: '26%', color: 'bg-red-500/70' },
          { width: '34%', color: 'bg-amber-400/70' },
          { width: '22%', color: 'bg-white/75' },
        ].map((stint) => (
          <div
            key={stint.width}
            className="overflow-hidden rounded-md"
            style={{ width: stint.width }}
          >
            <div
              className={`px-2 py-2.5 text-center text-[12px] font-semibold text-transparent ${stint.color} animate-pulse`}
            >
              .
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingCompactLayout({ chartType }: { chartType: ChartType }) {
  return (
    <div className="grid gap-px bg-white/[0.04] p-px md:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-px">
        <LoadingPositionsPanel variant="compact" />
        <LoadingChartPanel chartType={chartType} />
      </div>
      <div className="flex flex-col gap-px">
        <LoadingTrackMapPanel variant="compact" />
        <LoadingTelemetryPanel variant="compact" />
        <div className="bg-[#0c0c0e] p-5">
          <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-white/25">
            Tyre Strategy
          </div>
          <div className="flex gap-1.5">
            {[
              { width: '28%', color: 'bg-red-500/75' },
              { width: '37%', color: 'bg-amber-400/75' },
              { width: '24%', color: 'bg-white/80' },
            ].map((stint) => (
              <div
                key={stint.width}
                className="overflow-hidden rounded-md"
                style={{ width: stint.width }}
              >
                <div
                  className={`px-3 py-2.5 text-center text-[13px] font-semibold text-transparent ${stint.color} animate-pulse`}
                >
                  .
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingExpandedLayout({ chartType }: { chartType: ChartType }) {
  return (
    <div className="grid min-h-0 flex-1 gap-px bg-white/[0.04] p-px lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr_420px]">
      <div className="flex min-h-0 flex-col bg-[#0c0c0e]">
        <LoadingPositionsPanel variant="expanded" />
      </div>
      <div className="grid min-h-0 gap-px bg-white/[0.04] lg:grid-rows-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <LoadingTrackMapPanel variant="expanded" />
        <LoadingChartPanel chartType={chartType} />
      </div>
      <div className="grid min-h-0 gap-px bg-white/[0.04] lg:col-span-2 xl:col-span-1 xl:grid-rows-[auto_auto_1fr]">
        <LoadingTelemetryPanel variant="expanded" />
        <LoadingSectorBoardPanel />
        <LoadingTelemetryAndStrategyPanel />
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

      {isLoading ? (
        variant === 'compact' ? (
          <LoadingCompactLayout chartType={chartType} />
        ) : (
          <LoadingExpandedLayout chartType={chartType} />
        )
      ) : variant === 'compact' ? (
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
