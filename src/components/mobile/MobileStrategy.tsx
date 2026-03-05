import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTireStrategy,
  DriverStrategy,
  TireStrategyResponse,
  DetailedRaceResult,
  fetchStintAnalysis,
  StintAnalysisData,
  LapDetail,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getCompoundColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown01Icon,
  AlertCircleIcon,
  ChartDecreaseIcon,
  ChartIncreaseIcon,
} from 'hugeicons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Helper functions for analysis
const formatLapTime = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return 'N/A';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const calculateStdDev = (arr: number[]): number | null => {
  if (!arr || arr.length < 2) return null;
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

const calculateDegradation = (lapDetails: LapDetail[]): number | null => {
  const validLaps = lapDetails.length > 2 ? lapDetails.slice(1, -1) : [];
  if (validLaps.length < 2) return null;

  const n = validLaps.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  validLaps.forEach((lap) => {
    const x = lap.lapNumber;
    const y = lap.lapTime;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
};

interface MobileStrategyProps {
  year: number;
  event: string;
  session: string;
  raceResults?: DetailedRaceResult[];
  getDriverImage: (driverCode: string, driverName: string) => string | undefined;
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

const getTireImage = (compound: string): string | null => {
  if (!compound) return null;
  const c = compound.toLowerCase();
  if (c.includes('soft')) return '/tyres/soft.png';
  if (c.includes('medium')) return '/tyres/medium.png';
  if (c.includes('hard')) return '/tyres/hard.png';
  if (c.includes('intermediate') || c.includes('inter')) return '/tyres/intermediate.png';
  if (c.includes('wet')) return '/tyres/wet.png';
  return null;
};

const MobileStrategy: React.FC<MobileStrategyProps> = ({
  year,
  event,
  session,
  raceResults,
  getDriverImage,
}) => {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const {
    data: strategyData,
    isLoading,
    isError,
    error,
  } = useQuery<DriverStrategy[]>({
    queryKey: ['tireStrategy', year, event, session],
    queryFn: async () => {
      const result = await fetchTireStrategy(year, event, session);
      // Handle both new TireStrategyResponse format and old DriverStrategy[] format
      if (Array.isArray(result)) return result;
      return (result as unknown as TireStrategyResponse).stints ?? [];
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!year && !!event && !!session,
  });

  const { data: stintAnalysisData } = useQuery<StintAnalysisData[]>({
    queryKey: ['stintAnalysis', year, event, session],
    queryFn: () => fetchStintAnalysis(year, event, session),
    staleTime: 1000 * 60 * 10,
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

  const sortedStrategyData = useMemo(() => {
    if (!strategyData) return [];
    return [...strategyData].sort((a, b) => {
      const posA = driverPositionMap.get(a.driver);
      const posB = driverPositionMap.get(b.driver);
      if (posA !== undefined && posB !== undefined) return posA - posB;
      if (posA !== undefined) return -1;
      if (posB !== undefined) return 1;
      return a.driver.localeCompare(b.driver);
    });
  }, [strategyData, driverPositionMap]);

  const maxLaps = useMemo(() => {
    if (!strategyData || strategyData.length === 0) return 1;
    return Math.max(...strategyData.flatMap((d) => d.stints.map((s) => s.endLap)), 1);
  }, [strategyData]);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-12 h-8 bg-gray-800 rounded-sm" />
            <div className="flex-1 h-8 bg-gray-800 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-h-[200px] bg-red-900/10 border border-red-600/50 flex flex-col items-center justify-center text-red-500 p-4 mt-4">
        <AlertCircleIcon className="w-8 h-8 mb-2" />
        <p className="font-bold uppercase tracking-wider">Error loading strategy</p>
        <p className="text-xs text-red-400 mt-1 font-mono">
          {(error as Error)?.message || 'Could not fetch data.'}
        </p>
      </div>
    );
  }

  if (!strategyData || strategyData.length === 0) {
    return (
      <div className="w-full min-h-[200px] bg-gray-900/20 border border-gray-800 flex items-center justify-center text-gray-500 p-4 mt-4 font-mono uppercase tracking-widest">
        No tire strategy data found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drivers List */}
      <div className="space-y-3">
        {sortedStrategyData.map((driverData) => {
          const isExpanded = expandedDriver === driverData.driver;
          const position = driverPositionMap.get(driverData.driver);
          const positionText = position !== undefined ? `P${position}` : '';

          return (
            <div
              key={driverData.driver}
              className={cn(
                'bg-black border transition-all duration-300 overflow-hidden',
                isExpanded ? 'border-white/30 bg-zinc-900/10' : 'border-white/10'
              )}
            >
              {/* Main Row */}
              <div
                className="p-3 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedDriver(isExpanded ? null : driverData.driver)}
              >
                {/* Driver Info */}
                <div className="w-12 flex flex-col items-center shrink-0 gap-1">
                  <Avatar className="w-8 h-8 border border-white/10 rounded-none">
                    <AvatarImage
                      src={getDriverImage(
                        driverData.driver,
                        raceResults?.find((r) => r.driverCode === driverData.driver)?.fullName || ''
                      )}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="text-[10px] font-bold rounded-none bg-zinc-800">
                      {driverData.driver}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-xs font-black font-mono text-white">
                      {driverData.driver}
                    </span>
                    {positionText && (
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                        {positionText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Strategy Bar */}
                <div className="flex-1 h-6 bg-gray-900 relative flex rounded-sm overflow-hidden ring-1 ring-white/10">
                  {driverData.stints.map((stint, index) => {
                    const widthPercentage = ((stint.endLap - stint.startLap + 1) / maxLaps) * 100;
                    const leftOffsetPercentage = ((stint.startLap - 1) / maxLaps) * 100;
                    const bgColorClass = getTireColorClass(stint.compound);

                    return (
                      <div
                        key={index}
                        className={cn('h-full absolute border-r border-black/40', bgColorClass)}
                        style={{
                          left: `${leftOffsetPercentage}%`,
                          width: `${widthPercentage}%`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Expand Icon */}
                <ArrowDown01Icon
                  className={cn(
                    'w-4 h-4 text-gray-500 transition-transform duration-300',
                    isExpanded && 'rotate-180'
                  )}
                />
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-3 space-y-2 bg-zinc-900/30">
                      {driverData.stints.map((stint, idx) => {
                        // Find matching analysis data
                        const analysis = stintAnalysisData?.find(
                          (d) => d.driverCode === driverData.driver && d.stintNumber === idx + 1
                        );

                        // Calculate metrics if analysis data exists
                        let metrics = null;
                        if (analysis) {
                          const allValidLapDetails = analysis.lapDetails;
                          const fastLapDetails =
                            allValidLapDetails.length > 2 ? allValidLapDetails.slice(1, -1) : [];
                          const fastLapTimes = fastLapDetails.map((d) => d.lapTime);

                          metrics = {
                            avg:
                              fastLapTimes.length > 0
                                ? fastLapTimes.reduce((a, b) => a + b, 0) / fastLapTimes.length
                                : null,
                            consistency: calculateStdDev(fastLapTimes),
                            degradation: calculateDegradation(allValidLapDetails),
                          };
                        }

                        return (
                          <div
                            key={idx}
                            className="bg-black/40 border border-white/5 p-2 rounded-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getTireImage(stint.compound) ? (
                                  <img
                                    src={getTireImage(stint.compound)!}
                                    alt={stint.compound}
                                    className="w-5 h-5 object-contain"
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      'w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]',
                                      getTireColorClass(stint.compound).replace('bg-', 'text-')
                                    )}
                                  />
                                )}
                                <span className="font-black uppercase text-white text-sm tracking-wider">
                                  {stint.compound}
                                </span>
                              </div>
                              <div className="text-xs font-mono text-gray-400">
                                L{stint.startLap} - L{stint.endLap}{' '}
                                <span className="text-gray-600 mx-1">|</span> {stint.lapCount} Laps
                              </div>
                            </div>

                            {metrics ? (
                              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                                <div>
                                  <div className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                                    Avg Pace
                                  </div>
                                  <div className="text-xs font-mono text-white font-bold">
                                    {formatLapTime(metrics.avg)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                                    Consistency
                                  </div>
                                  <div className="text-xs font-mono text-gray-300">
                                    {metrics.consistency?.toFixed(3) ?? '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                                    Degradation
                                  </div>
                                  <div
                                    className={cn(
                                      'text-xs font-mono font-bold flex items-center gap-1',
                                      (metrics.degradation || 0) > 0
                                        ? 'text-red-500'
                                        : 'text-green-500'
                                    )}
                                  >
                                    {(metrics.degradation || 0) > 0 ? (
                                      <ChartIncreaseIcon className="w-3 h-3" />
                                    ) : (
                                      <ChartDecreaseIcon className="w-3 h-3" />
                                    )}
                                    {metrics.degradation?.toFixed(3) ?? '-'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-600 font-mono italic mt-1">
                                Analysis unavailable
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { MobileStrategy };
export default MobileStrategy;
