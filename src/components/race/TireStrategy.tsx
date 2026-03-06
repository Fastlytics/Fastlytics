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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircleIcon, Menu01Icon, Analytics01Icon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StintAnalysisTable from './StintAnalysisTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

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
  INTERMEDIATE: 'bg-green-500',
  WET: 'bg-blue-500',
  UNKNOWN: 'bg-gray-500',
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
  const [focusedDriver, setFocusedDriver] = React.useState<string | null>(null);
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
      // Handle both new TireStrategyResponse format and old DriverStrategy[] format
      const data: DriverStrategy[] = Array.isArray(rawData)
        ? rawData
        : ((rawData as unknown as TireStrategyResponse).stints ?? []);
      if (!data) return [];
      return [...data].sort((a, b) => {
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

  const renderStrategyOverview = () => {
    if (isLoadingStrategy) {
      return (
        <div className="space-y-4 pt-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-16 h-8 bg-gray-800 rounded-sm" />
              <div className="flex-1 h-8 bg-gray-800 rounded-sm" />
            </div>
          ))}
        </div>
      );
    }
    if (isErrorStrategy) {
      return (
        <div className="w-full min-h-[200px] bg-red-900/10 border border-red-600/50 flex flex-col items-center justify-center text-red-500 p-4 mt-4">
          <AlertCircleIcon className="w-8 h-8 mb-2" />
          <p className="font-bold uppercase tracking-wider">Error loading strategy</p>
          <p className="text-xs text-red-400 mt-1 font-mono">
            {(errorStrategy as Error)?.message || 'Could not fetch data.'}
          </p>
        </div>
      );
    }
    if (!strategyData || strategyData.length === 0) {
      return (
        <div className="w-full min-h-[200px] bg-black border border-gray-700 flex items-center justify-center text-gray-500 p-4 mt-4 font-mono uppercase tracking-widest">
          No tire strategy data found
        </div>
      );
    }

    return (
      <TooltipProvider delayDuration={0}>
        <div className="pt-6">
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8 border-b border-gray-800 pb-6">
            {Object.entries(tireCompoundColors).map(
              ([compound, colorClass]) =>
                compound !== 'UNKNOWN' && (
                  <div key={compound} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]',
                        colorClass
                      )}
                    ></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {compound}
                    </span>
                  </div>
                )
            )}
          </div>

          {/* Chart */}
          <div className="space-y-4 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none ml-20">
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                <div
                  key={tick}
                  className="h-full border-l border-gray-800/30 absolute"
                  style={{ left: `${tick * 100}%` }}
                >
                  <span className="absolute -top-6 -translate-x-1/2 text-[10px] font-mono text-gray-600">
                    L{Math.round(tick * maxLaps)}
                  </span>
                </div>
              ))}
            </div>

            {strategyData.map((driverData) => {
              const isRaceSession = session === 'R' || session === 'Sprint';
              const position = isRaceSession ? driverPositionMap.get(driverData.driver) : undefined;
              const positionText =
                position !== undefined && isFinite(position) ? `P${position}` : '';

              return (
                <div
                  key={driverData.driver}
                  className={cn(
                    'flex items-center gap-4 group relative z-10 transition-all duration-300 cursor-pointer p-2 rounded-lg',
                    focusedDriver && focusedDriver !== driverData.driver
                      ? 'opacity-20'
                      : 'opacity-100',
                    favoriteDriver &&
                      (driverData.driver === favoriteDriver ||
                        driverData.driver.includes(favoriteDriver)) &&
                      !focusedDriver
                      ? 'bg-red-900/20 border border-red-600/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                      : 'hover:bg-gray-900/50'
                  )}
                  onClick={() => toggleDriverFocus(driverData.driver)}
                >
                  <div className="w-16 flex flex-col items-end shrink-0">
                    <span
                      className={cn(
                        'text-sm font-black font-mono transition-colors',
                        focusedDriver === driverData.driver
                          ? 'text-red-500'
                          : 'text-white group-hover:text-red-500'
                      )}
                    >
                      {driverData.driver}
                    </span>
                    {positionText && (
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {positionText}
                      </span>
                    )}
                  </div>

                  <div className="flex-grow h-8 bg-gray-900/50 relative flex rounded-sm overflow-hidden ring-1 ring-gray-800 group-hover:ring-gray-600 transition-all">
                    {driverData.stints.map((stint, index) => {
                      const widthPercentage = ((stint.endLap - stint.startLap + 1) / maxLaps) * 100;
                      const leftOffsetPercentage = ((stint.startLap - 1) / maxLaps) * 100;
                      const bgColorClass = getTireColorClass(stint.compound);
                      const isNew =
                        stint.compound === 'SOFT' ||
                        stint.compound === 'MEDIUM' ||
                        stint.compound === 'HARD'; // Simplified logic, ideally backend provides 'isNew'

                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'h-full absolute transition-all hover:brightness-110 hover:z-20 border-r border-black/40 cursor-help',
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
                            className="bg-black/90 backdrop-blur-xl border border-gray-700 text-white p-3 rounded-none shadow-2xl"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-2">
                                <span className={cn('w-2 h-2 rounded-full', bgColorClass)}></span>
                                <span className="font-bold uppercase tracking-wider text-sm">
                                  {stint.compound}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-gray-300">
                                <span>Laps:</span>
                                <span className="text-white text-right">
                                  {stint.startLap} - {stint.endLap}
                                </span>
                                <span>Duration:</span>
                                <span className="text-white text-right">{stint.lapCount} laps</span>
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

  return (
    <div
      ref={exportRef}
      className={cn('bg-black p-0', className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
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
          <TabsList className="bg-transparent p-0 h-auto rounded-none gap-2 w-full sm:w-auto">
            <TabsTrigger
              value="overview"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 border border-gray-800 data-[state=active]:border-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 border border-gray-800 data-[state=active]:border-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-600"
            >
              Stint Detail
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          {renderStrategyOverview()}
        </TabsContent>
        <TabsContent
          value="analysis"
          className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <StintAnalysisTable year={year} event={event} session={session} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { TireStrategy };
export default TireStrategy;
