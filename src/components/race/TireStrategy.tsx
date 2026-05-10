// knip-ignore
import React, { useMemo, useReducer } from 'react';

const STRATEGY_SKELETONS = Array.from({ length: 8 }, (_, i) => `ss-${i}`);
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTireStrategy,
  DriverStrategy,
  TireStrategyResponse,
  fetchSpecificRaceResults,
  DetailedRaceResult,
} from '@/lib/api';
import { AlertCircleIcon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StintAnalysisTable from './StintAnalysisTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';

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

  const getDriverFullName = (code: string): string => {
    return driverNameMap.get(code) || code;
  };

  return (
    <div
      ref={exportRef}
      className={cn('rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6', className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/80">
            Tire Strategy
          </p>
          <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">
            Compound & Stint Analysis
          </p>
        </div>
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
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-auto w-full gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 sm:w-auto">
          <TabsTrigger
            value="overview"
            className="flex-1 rounded-md text-[12px] font-semibold uppercase tracking-wider text-white/50 transition-all hover:text-white data-[state=active]:bg-white/[0.08] data-[state=active]:text-white sm:flex-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="flex-1 rounded-md text-[12px] font-semibold uppercase tracking-wider text-white/50 transition-all hover:text-white data-[state=active]:bg-white/[0.08] data-[state=active]:text-white sm:flex-none"
          >
            Stint Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
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
        </TabsContent>
        <TabsContent
          value="analysis"
          className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <StintAnalysisTable
            year={year}
            event={event}
            session={session}
            driverNameMap={driverNameMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { TireStrategy };

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
      <div className="space-y-3 pt-4 animate-pulse">
        {STRATEGY_SKELETONS.map((id) => (
          <div key={id} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="size-11 rounded-full bg-white/[0.03]" />
              <div className="h-3 w-16 rounded bg-white/[0.03]" />
            </div>
            <div className="h-9 flex-1 rounded-lg bg-white/[0.03]" />
          </div>
        ))}
      </div>
    );
  }
  if (isErrorStrategy) {
    return (
      <div className="mt-4 flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6 text-red-400">
        <AlertCircleIcon className="mb-2 size-7" />
        <p className="text-[13px] font-semibold uppercase tracking-wider">Error loading strategy</p>
        <p className="mt-1 text-[12px] text-red-400/60">
          {(errorStrategy as Error)?.message || 'Could not fetch data.'}
        </p>
      </div>
    );
  }
  if (!strategyData || strategyData.length === 0) {
    return (
      <div className="mt-4 flex min-h-[200px] w-full items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 text-[13px] text-white">
        No tire strategy data found
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="pt-6">
        {/* Legend */}
        <div className="mb-6 flex flex-wrap justify-center gap-x-8 gap-y-3 border-b border-white/[0.06] pb-5">
          {Object.entries(tireCompoundColors).map(
            ([compound, colorClass]) =>
              compound !== 'UNKNOWN' && (
                <div key={compound} className="flex items-center gap-2">
                  <span className={cn('size-3 rounded-full', colorClass)} />
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-white">
                    {compound}
                  </span>
                </div>
              )
          )}
        </div>

        {/* Chart */}
        <div className="space-y-3 relative">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex pointer-events-none ml-24">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <div
                key={tick}
                className="absolute h-full border-l border-white/[0.06]"
                style={{ left: `${tick * 100}%` }}
              >
                <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-medium text-white">
                  L{Math.round(tick * maxLaps)}
                </span>
              </div>
            ))}
          </div>

          {strategyData.map((driverData) => {
            const position = driverPositionMap.get(driverData.driver);
            const positionText = position !== undefined && isFinite(position) ? `P${position}` : '';
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
                  'relative z-10 flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2.5 transition-all',
                  focusedDriver && focusedDriver !== driverData.driver
                    ? 'opacity-20'
                    : 'opacity-100',
                  isFav && !focusedDriver
                    ? 'bg-red-500/[0.06] border border-red-500/20'
                    : 'hover:bg-white/[0.02] border border-transparent'
                )}
                onClick={() => toggleDriverFocus(driverData.driver)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleDriverFocus(driverData.driver);
                  }
                }}
              >
                <div className="w-20 flex flex-col items-center gap-1 shrink-0">
                  <Avatar className="size-14 shrink-0 border border-white/[0.08]">
                    <AvatarImage src={headshot} className="object-cover object-top" />
                    <AvatarFallback className="bg-[#1a1a1e] text-[11px] font-bold text-white">
                      {driverData.driver}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'text-[11px] font-bold text-center leading-tight transition-colors',
                      focusedDriver === driverData.driver
                        ? 'text-red-400'
                        : isFav
                          ? 'text-red-400'
                          : 'text-white'
                    )}
                  >
                    {fullName}
                  </span>
                  {positionText && (
                    <span className="text-[9px] font-semibold text-white uppercase tracking-wider">
                      {positionText}
                    </span>
                  )}
                </div>

                <div className="relative flex h-9 flex-grow overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.03]">
                  {driverData.stints.map((stint, index) => {
                    const widthPercentage = ((stint.endLap - stint.startLap + 1) / maxLaps) * 100;
                    const leftOffsetPercentage = ((stint.startLap - 1) / maxLaps) * 100;
                    const bgColorClass = getTireColorClass(stint.compound);

                    return (
                      <Tooltip key={`stint-${stint.startLap}-${stint.endLap}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-full absolute transition-all hover:brightness-125 hover:z-20 border-r border-black/40 cursor-help',
                              bgColorClass
                            )}
                            style={{
                              left: `${leftOffsetPercentage}%`,
                              width: `${widthPercentage}%`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 text-white shadow-2xl"
                        >
                          <div className="space-y-1.5">
                            <div className="mb-2 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                              <span className={cn('size-2.5 rounded-full', bgColorClass)} />
                              <span className="text-[12px] font-bold uppercase tracking-wider text-white">
                                {stint.compound}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-white">
                              <span>Laps:</span>
                              <span className="text-right font-semibold text-white">
                                {stint.startLap} - {stint.endLap}
                              </span>
                              <span>Duration:</span>
                              <span className="text-right font-semibold text-white">
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
