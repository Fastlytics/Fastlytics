import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTireStrategy,
  DriverStrategy,
  TireStrategyResponse,
  fetchSpecificRaceResults,
  DetailedRaceResult,
} from '@/lib/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StintAnalysisTable from './StintAnalysisTable';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { ChartSaveMenu } from '@/components/saved/ChartSaveMenu';
import { getDriverImage } from '@/utils/imageMapping';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';

interface TireStrategyProps {
  className?: string;
  delay?: number;
  year: number;
  event: string;
  session: string;
  favoriteDriver?: string | null;
}

const tireCompoundColors: { [key: string]: string } = {
  SOFT: 'bg-red-600',
  MEDIUM: 'bg-yellow-400',
  HARD: 'bg-white',
  INTERMEDIATE: 'bg-emerald-500',
  WET: 'bg-blue-500',
  UNKNOWN: 'bg-white/30',
};

const getTireColorClass = (compound: string): string => {
  return tireCompoundColors[compound?.toUpperCase()] || tireCompoundColors.UNKNOWN;
};

const STRATEGY_SKELETONS = Array.from({ length: 8 }, (_, i) => `ss-${i}`);

const TireStrategy: React.FC<TireStrategyProps> = ({
  className,
  delay = 0,
  year,
  event,
  session,
  favoriteDriver,
}) => {
  const [focusedDriver, setFocusedDriver] = React.useReducer(
    (_: string | null, v: string | null) => v,
    null
  );
  const [activeView, setActiveView] = React.useState<'overview' | 'detail'>('overview');
  const { trackInteraction } = useAnalytics();
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  const toggleDriverFocus = (driver: string) => {
    trackInteraction('tire_strategy_driver_focused', { driver });
    setFocusedDriver((prev) => (prev === driver ? null : driver));
  };

  const { data: raceResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, event, session],
    queryFn: () => fetchSpecificRaceResults(year, event, session),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
  });

  const driverNameMap = useMemo(() => {
    if (!raceResults) return new Map<string, string>();
    const nameMap = new Map<string, string>();
    raceResults.forEach((result) => {
      if (result.driverCode && result.fullName) {
        nameMap.set(result.driverCode, result.fullName);
      }
    });
    return nameMap;
  }, [raceResults]);

  const driverPositionMap = useMemo(() => {
    if (!raceResults) return new Map<string, number>();
    const positionMap = new Map<string, number>();
    raceResults.forEach((result) => {
      if (result.position !== undefined && result.position !== null && isFinite(result.position)) {
        positionMap.set(result.driverCode, result.position);
      }
    });
    return positionMap;
  }, [raceResults]);

  const driverTeamMap = useMemo(() => {
    if (!raceResults) return new Map<string, string>();
    const teamMap = new Map<string, string>();
    raceResults.forEach((result) => {
      if (result.driverCode && result.team) {
        teamMap.set(result.driverCode, result.team);
      }
    });
    return teamMap;
  }, [raceResults]);

  const {
    data: strategyData,
    isLoading: isLoadingStrategy,
    error: errorStrategy,
    isError: isErrorStrategy,
  } = useQuery<DriverStrategy[]>({
    queryKey: ['tireStrategy', year, event, session],
    queryFn: () => fetchTireStrategy(year, event, session),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
    select: (rawData) => {
      const data: DriverStrategy[] = Array.isArray(rawData)
        ? rawData
        : ((rawData as unknown as TireStrategyResponse).stints ?? []);
      if (!data) return [];
      return data.toSorted((a, b) => {
        const posA = driverPositionMap.get(a.driver);
        const posB = driverPositionMap.get(b.driver);
        if (posA !== undefined && posB !== undefined) return posA - posB;
        if (posA !== undefined) return -1;
        if (posB !== undefined) return 1;
        return a.driver.localeCompare(b.driver);
      });
    },
  });

  const maxLaps = useMemo(() => {
    if (!strategyData || strategyData.length === 0) return 1;
    return Math.max(...strategyData.flatMap((d) => d.stints.map((s) => s.endLap)), 1);
  }, [strategyData]);

  // Compute summary stats
  const summaryStats = useMemo(() => {
    if (!strategyData || strategyData.length === 0) return null;
    const totalStops = strategyData.reduce((sum, d) => sum + Math.max(0, d.stints.length - 1), 0);
    const avgStops = totalStops / strategyData.length;
    const compoundUsage: Record<string, number> = {};
    strategyData.forEach((d) =>
      d.stints.forEach((s) => {
        const c = s.compound?.toUpperCase() || 'UNKNOWN';
        compoundUsage[c] = (compoundUsage[c] || 0) + 1;
      })
    );
    const mostUsedCompound = Object.entries(compoundUsage).sort((a, b) => b[1] - a[1])[0];
    return { totalStops, avgStops, compoundUsage, mostUsedCompound };
  }, [strategyData]);

  const getDriverFullName = (code: string): string => {
    return driverNameMap.get(code) || code;
  };

  return (
    <div
      ref={exportRef}
      className={cn(CARD_CONTAINER, className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <h3 className="text-[16px] font-semibold text-white">Tire Strategy</h3>
          <p className="mt-0.5 text-[12px] text-white/80">Compound usage and stint breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title: 'Tire Strategy',
                subtitle: 'Compound usage and stint breakdown',
                year,
                event,
                session,
              })
            }
            isExporting={isExporting}
          />
          <ChartSaveMenu
            chartType="tire_strategy"
            title={`Tire Strategy — ${event} ${year}`}
            raceName={`${year} ${event}`}
            chartConfig={{ year, event, session }}
          />
        </div>
      </div>

      {/* Summary stats row */}
      {summaryStats && (
        <div className="grid grid-cols-2 divide-x divide-white/[0.04] border-y border-white/[0.04] lg:grid-cols-4">
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Total pit stops</div>
            <div className="mt-1 text-[18px] font-semibold tabular-nums text-white">
              {summaryStats.totalStops}
            </div>
          </div>
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Avg stops</div>
            <div className="mt-1 text-[18px] font-semibold tabular-nums text-white">
              {summaryStats.avgStops.toFixed(1)}
            </div>
          </div>
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Most used</div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  'size-2.5 rounded-full',
                  getTireColorClass(summaryStats.mostUsedCompound?.[0] || '')
                )}
              />
              <span className="text-[14px] font-semibold text-white">
                {summaryStats.mostUsedCompound?.[0] || '—'}
              </span>
              <span className="text-[12px] text-white/80">
                ({summaryStats.mostUsedCompound?.[1]} stints)
              </span>
            </div>
          </div>
          <div className="px-5 py-3">
            <div className={CARD_LABEL}>Race distance</div>
            <div className="mt-1 text-[18px] font-semibold tabular-nums text-white">
              {maxLaps} <span className="text-[12px] text-white/80">laps</span>
            </div>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-2">
        <button
          onClick={() => setActiveView('overview')}
          className={cn(
            'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
            activeView === 'overview'
              ? 'bg-white/[0.06] text-white'
              : 'text-white/80 hover:text-white'
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveView('detail')}
          className={cn(
            'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
            activeView === 'detail'
              ? 'bg-white/[0.06] text-white'
              : 'text-white/80 hover:text-white'
          )}
        >
          Stint Detail
        </button>
      </div>

      {/* Content */}
      {activeView === 'overview' ? (
        <StrategyOverview
          isLoadingStrategy={isLoadingStrategy}
          isErrorStrategy={isErrorStrategy}
          errorStrategy={errorStrategy}
          strategyData={strategyData}
          maxLaps={maxLaps}
          driverPositionMap={driverPositionMap}
          favoriteDriver={favoriteDriver}
          focusedDriver={focusedDriver}
          toggleDriverFocus={toggleDriverFocus}
          getDriverFullName={getDriverFullName}
          year={year}
        />
      ) : (
        <div className="px-5 pb-5">
          <StintAnalysisTable
            year={year}
            event={event}
            session={session}
            driverNameMap={driverNameMap}
            driverTeamMap={driverTeamMap}
          />
        </div>
      )}
    </div>
  );
};

export { TireStrategy };

/* ─── Strategy Overview ─── */

interface StrategyOverviewProps {
  isLoadingStrategy: boolean;
  isErrorStrategy: boolean;
  errorStrategy: Error | null;
  strategyData: DriverStrategy[] | undefined;
  maxLaps: number;
  driverPositionMap: Map<string, number>;
  favoriteDriver?: string | null;
  focusedDriver: string | null;
  toggleDriverFocus: (driver: string) => void;
  getDriverFullName: (code: string) => string;
  year: number;
}

const StrategyOverview: React.FC<StrategyOverviewProps> = ({
  isLoadingStrategy,
  isErrorStrategy,
  errorStrategy,
  strategyData,
  maxLaps,
  driverPositionMap,
  favoriteDriver,
  focusedDriver,
  toggleDriverFocus,
  getDriverFullName,
  year,
}) => {
  if (isLoadingStrategy) {
    return (
      <div className="space-y-2 px-5 pb-5 pt-2">
        {STRATEGY_SKELETONS.map((id) => (
          <div key={id} className="flex items-center gap-4 py-2">
            <div className="h-4 w-24 animate-pulse rounded bg-white/[0.04]" />
            <div className="h-8 flex-1 animate-pulse rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  if (isErrorStrategy) {
    return (
      <div className="px-5 pb-5 pt-2">
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-red-500/20 px-6 py-8 text-center">
          <div>
            <p className="text-[14px] font-medium text-red-400">Error loading strategy</p>
            <p className="mt-1 text-[12px] text-white/80">
              {(errorStrategy as Error)?.message || 'Could not fetch data.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!strategyData || strategyData.length === 0) {
    return (
      <div className="px-5 pb-5 pt-2">
        <div className="flex min-h-[200px] items-center justify-center text-[13px] text-white/80">
          No tire strategy data found
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="px-5 pb-5 pt-2">
        {/* Compound legend */}
        <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-white/[0.04] pb-4">
          {Object.entries(tireCompoundColors).map(
            ([compound, colorClass]) =>
              compound !== 'UNKNOWN' && (
                <div key={compound} className="flex items-center gap-1.5">
                  <span className={cn('size-2.5 rounded-full', colorClass)} />
                  <span className="text-[12px] font-medium text-white">{compound}</span>
                </div>
              )
          )}
        </div>

        {/* Lap markers */}
        <div className="mb-2 flex items-center">
          <div className="w-[140px] shrink-0" />
          <div className="relative flex-1">
            <div className="flex justify-between text-[11px] text-white/80">
              <span>L1</span>
              <span>L{Math.round(maxLaps * 0.25)}</span>
              <span>L{Math.round(maxLaps * 0.5)}</span>
              <span>L{Math.round(maxLaps * 0.75)}</span>
              <span>L{maxLaps}</span>
            </div>
          </div>
        </div>

        {/* Driver rows */}
        <div className="space-y-1">
          {strategyData.map((driverData) => {
            const position = driverPositionMap.get(driverData.driver);
            const isFav =
              favoriteDriver &&
              (driverData.driver === favoriteDriver || driverData.driver.includes(favoriteDriver));
            const fullName = getDriverFullName(driverData.driver);
            const headshot = getDriverImage(driverData.driver, year);

            return (
              <div
                key={driverData.driver}
                role="button"
                tabIndex={0}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-2 transition-all cursor-pointer',
                  focusedDriver && focusedDriver !== driverData.driver
                    ? 'opacity-20'
                    : 'opacity-100',
                  isFav && !focusedDriver ? 'bg-red-500/[0.04]' : 'hover:bg-white/[0.02]'
                )}
                onClick={() => toggleDriverFocus(driverData.driver)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleDriverFocus(driverData.driver);
                  }
                }}
              >
                {/* Driver info */}
                <div className="flex w-[128px] shrink-0 items-center gap-2.5">
                  <img
                    src={headshot}
                    alt=""
                    className="size-8 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-white">{fullName}</div>
                    <div className="text-[11px] text-white/80">
                      {position !== undefined ? `P${position}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Stint bars */}
                <div className="relative flex h-8 flex-1 overflow-hidden rounded-md border border-white/[0.04]">
                  {driverData.stints.map((stint) => {
                    const widthPct = ((stint.endLap - stint.startLap + 1) / maxLaps) * 100;
                    const leftPct = ((stint.startLap - 1) / maxLaps) * 100;
                    const bgColor = getTireColorClass(stint.compound);

                    return (
                      <Tooltip key={`${stint.startLap}-${stint.endLap}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute h-full transition-all hover:brightness-110 border-r border-black/30',
                              bgColor
                            )}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          >
                            {widthPct > 8 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-black/80">
                                {stint.lapCount}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-3 text-white shadow-xl"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={cn('size-2.5 rounded-full', bgColor)} />
                              <span className="text-[12px] font-semibold text-white">
                                {stint.compound}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                              <span className="text-white/80">Laps</span>
                              <span className="text-right font-medium text-white">
                                {stint.startLap}–{stint.endLap}
                              </span>
                              <span className="text-white/80">Duration</span>
                              <span className="text-right font-medium text-white">
                                {stint.lapCount} laps
                              </span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TireStrategy;
