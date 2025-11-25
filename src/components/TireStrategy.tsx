import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchTireStrategy, DriverStrategy, fetchSpecificRaceResults, DetailedRaceResult } from '@/lib/api';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, List, LineChart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import StintAnalysisTable from './StintAnalysisTable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define props for the dynamic component
interface TireStrategyProps {
  className?: string;
  delay?: number;
  year: number;
  event: string;
  session: string;
}

// Define tire compound colors (using Tailwind classes)
const tireCompoundColors: { [key: string]: string } = {
  SOFT: 'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  HARD: 'bg-gray-200',
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

  // Fetch race results to get finishing order (used by both tabs for context)
  const { data: raceResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, event, session],
    queryFn: () => fetchSpecificRaceResults(year, event, session),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
  });

  // Create a map of driver codes to their finishing positions
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

  // Fetch basic strategy data (for Overview tab)
  const { data: strategyData, isLoading: isLoadingStrategy, error: errorStrategy, isError: isErrorStrategy } = useQuery<DriverStrategy[]>({
    queryKey: ['tireStrategy', year, event, session],
    queryFn: () => fetchTireStrategy(year, event, session),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
    // Sort data by race finishing order
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

  // Find max laps for scaling the bars (only if strategyData exists)
  const maxLaps = useMemo(() => {
      if (!strategyData || strategyData.length === 0) return 1; // Default to 1 if no data
      return Math.max(...strategyData.flatMap(d => d.stints.map(s => s.endLap)), 1);
  }, [strategyData]);

  // Helper function to render the content of the Strategy Overview tab
  const renderStrategyOverview = () => {
    if (isLoadingStrategy) {
        return (
            <div className="space-y-2 pt-4">
              {[...Array(8)].map((_, i) => ( // Show more skeletons
                <Skeleton key={i} className="w-full h-[28px] bg-gray-800/50" />
              ))}
            </div>
        );
    }
    if (isErrorStrategy) {
         return (
            <div className="w-full min-h-[200px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400 p-4 mt-4">
               <AlertCircle className="w-8 h-8 mb-2" />
               <p className="font-semibold">Error loading strategy overview</p>
               <p className="text-xs text-gray-500 mt-1">{(errorStrategy as Error)?.message || 'Could not fetch data.'}</p>
            </div>
         );
    }
     if (!strategyData || strategyData.length === 0) {
         return (
            <div className="w-full min-h-[200px] bg-gray-900/80 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-500 p-4 mt-4">
               No tire strategy data found for this session.
            </div>
         );
    }

    // --- Render Visualization ---
    return (
      <TooltipProvider delayDuration={100}>
        <div className="pt-4">
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-4 text-xs text-gray-400">
            {Object.entries(tireCompoundColors).map(([compound, colorClass]) => (
                compound !== 'UNKNOWN' && (
                    <div key={compound} className="flex items-center gap-1.5">
                        <span className={cn("w-2.5 h-2.5 rounded-full", colorClass)}></span>
                        <span>{compound.charAt(0) + compound.slice(1).toLowerCase()}</span>
                    </div>
                )
            ))}
          </div>
          {/* Driver Stint List */}
          <div className="space-y-2.5">
            {strategyData.map((driverData) => {
              const isRaceSession = session === 'R' || session === 'Sprint';
              const position = isRaceSession ? driverPositionMap.get(driverData.driver) : undefined;
              const positionText = position !== undefined && isFinite(position) ? `P${position}` : '';
              
              return (
                <div key={driverData.driver} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-mono text-gray-400 text-right flex-shrink-0">
                    {positionText ? (
                      <span className="flex items-center justify-end">
                        <span className="text-xs text-gray-500 mr-1">{positionText}</span>
                        {driverData.driver}
                      </span>
                    ) : (
                      driverData.driver
                    )}
                  </span>
                  <div className="flex-grow h-6 bg-gray-800/50 rounded overflow-hidden flex relative">
                    {driverData.stints.map((stint, index) => {
                      const widthPercentage = ((stint.endLap - stint.startLap + 1) / maxLaps) * 100;
                      const leftOffsetPercentage = ((stint.startLap - 1) / maxLaps) * 100;
                      const bgColorClass = getTireColorClass(stint.compound);
                      const tooltipContent = `${stint.compound} (L${stint.startLap}-L${stint.endLap}, ${stint.lapCount} laps)`;

                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn("h-full absolute transition-opacity hover:opacity-80", bgColorClass)}
                              style={{
                                  left: `${leftOffsetPercentage}%`,
                                  width: `${widthPercentage}%`,
                               }}
                              aria-label={tooltipContent}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="bg-black/80 text-white border-gray-700">
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

  // --- Main Component Render ---
  return (
     <Card 
        className={cn("bg-gray-900/70 border border-gray-700/80 animate-fade-in", className)} 
        style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
     >
        <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-white">Strategy Analysis</CardTitle>
            {/* Description can be added here if needed */}
        </CardHeader>
        <CardContent className="pt-0">
             <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800/80 border border-gray-700/60 p-1 h-auto mb-1">
                    <TabsTrigger 
                      value="overview" 
                      className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 text-xs py-1.5 rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5"
                    >
                        <List className="w-3.5 h-3.5"/>
                        Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analysis" 
                      className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 text-xs py-1.5 rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5"
                    >
                         <LineChart className="w-3.5 h-3.5"/>
                         Stint Detail
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                     {renderStrategyOverview()}
                </TabsContent>
                <TabsContent value="analysis" className="mt-4">
                    {/* StintAnalysisTable handles its own loading/error states */}
                    <StintAnalysisTable year={year} event={event} session={session} />
                </TabsContent>
            </Tabs>
        </CardContent>
     </Card>
  );
};

export default TireStrategy;
