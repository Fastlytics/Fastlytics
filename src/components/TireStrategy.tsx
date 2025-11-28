import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchTireStrategy, DriverStrategy, fetchSpecificRaceResults, DetailedRaceResult } from '@/lib/api';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircleIcon, Menu01Icon, Analytics01Icon } from 'hugeicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import StintAnalysisTable from './StintAnalysisTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TireStrategyProps {
  className?: string;
  delay?: number;
  year: number;
  event: string;
  session: string;
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
  session
}) => {
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
    raceResults.forEach(result => {
      if (result.position !== undefined && result.position !== null && isFinite(result.position)) {
        positionMap.set(result.driverCode, result.position);
      }
    });
    return positionMap;
  }, [raceResults]);

  const { data: strategyData, isLoading: isLoadingStrategy, error: errorStrategy, isError: isErrorStrategy } = useQuery<DriverStrategy[]>({
    queryKey: ['tireStrategy', year, event, session],
    queryFn: () => fetchTireStrategy(year, event, session),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
    select: (data) => {
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
    return Math.max(...strategyData.flatMap(d => d.stints.map(s => s.endLap)), 1);
  }, [strategyData]);

  const renderStrategyOverview = () => {
    if (isLoadingStrategy) {
      return (
        <div className="space-y-2 pt-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="w-full h-[28px] bg-gray-800" />
          ))}
        </div>
      );
    }
    if (isErrorStrategy) {
      return (
        <div className="w-full min-h-[200px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500 p-4 mt-4">
          <AlertCircleIcon className="w-8 h-8 mb-2" />
          <p className="font-bold uppercase">Error loading strategy</p>
          <p className="text-xs text-gray-500 mt-1">{(errorStrategy as Error)?.message || 'Could not fetch data.'}</p>
        </div>
      );
    }
    if (!strategyData || strategyData.length === 0) {
      return (
        <div className="w-full min-h-[200px] bg-black border border-gray-800 flex items-center justify-center text-gray-500 p-4 mt-4 font-mono uppercase">
          No tire strategy data found.
        </div>
      );
    }

    return (
      <TooltipProvider delayDuration={100}>
        <div className="pt-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 text-xs font-bold uppercase tracking-wider text-gray-500">
            {Object.entries(tireCompoundColors).map(([compound, colorClass]) => (
              compound !== 'UNKNOWN' && (
                <div key={compound} className="flex items-center gap-2">
                  <span className={cn("w-3 h-3", colorClass)}></span>
                  <span>{compound}</span>
                </div>
              )
            ))}
          </div>
          <div className="space-y-3">
            {strategyData.map((driverData) => {
              const isRaceSession = session === 'R' || session === 'Sprint';
              const position = isRaceSession ? driverPositionMap.get(driverData.driver) : undefined;
              const positionText = position !== undefined && isFinite(position) ? `P${position}` : '';

              return (
                <div key={driverData.driver} className="flex items-center gap-4 group">
                  <span className="w-16 text-sm font-bold font-mono text-gray-400 text-right flex-shrink-0 group-hover:text-white transition-colors">
                    {positionText ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-600">{positionText}</span>
                        {driverData.driver}
                      </span>
                    ) : (
                      driverData.driver
                    )}
                  </span>
                  <div className="flex-grow h-8 bg-gray-900 border border-gray-800 relative flex">
                    {driverData.stints.map((stint, index) => {
                      const widthPercentage = ((stint.endLap - stint.startLap + 1) / maxLaps) * 100;
                      const leftOffsetPercentage = ((stint.startLap - 1) / maxLaps) * 100;
                      const bgColorClass = getTireColorClass(stint.compound);
                      const tooltipContent = `${stint.compound} (L${stint.startLap}-L${stint.endLap}, ${stint.lapCount} laps)`;

                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn("h-full absolute transition-all hover:brightness-110 border-r border-black/20", bgColorClass)}
                              style={{
                                left: `${leftOffsetPercentage}%`,
                                width: `${widthPercentage}%`,
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="bg-black border border-gray-700 text-white font-mono text-xs uppercase">
                            <p>{tooltipContent}</p>
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
      className={cn("bg-black border-2 border-gray-800 p-6", className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Strategy Analysis</h3>
          <TabsList className="bg-gray-900 border border-gray-800 p-1 h-auto rounded-none">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-none transition-colors"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-none transition-colors"
            >
              Stint Detail
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          {renderStrategyOverview()}
        </TabsContent>
        <TabsContent value="analysis" className="mt-0">
          <StintAnalysisTable year={year} event={event} session={session} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TireStrategy;
