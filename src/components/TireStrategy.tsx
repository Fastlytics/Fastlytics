import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTireStrategy,
  DriverStrategy,
  TireStrategyResponse,
  PitStop,
  RaceControlMessage,
  WeatherSummary,
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

const formatLapTime = (seconds: number | null | undefined): string => {
  if (seconds == null || isNaN(seconds)) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
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
    data: fullStrategy,
    isLoading: isLoadingStrategy,
    error: errorStrategy,
    isError: isErrorStrategy,
  } = useQuery<TireStrategyResponse>({
    queryKey: ['tireStrategy', year, event, session],
    queryFn: async () => {
      const rawData = await fetchTireStrategy(year, event, session);
      // Handle both new TireStrategyResponse format and old DriverStrategy[] format
      if (Array.isArray(rawData)) {
        return {
          stints: rawData as unknown as DriverStrategy[],
          pitStops: [],
          raceControl: [],
          weather: null,
        };
      }
      return rawData;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
  });

  const strategyData = useMemo(() => {
    if (!fullStrategy?.stints) return [];
    return [...fullStrategy.stints].sort((a, b) => {
      const posA = driverPositionMap.get(a.driver);
      const posB = driverPositionMap.get(b.driver);
      if (posA !== undefined && posB !== undefined) return posA - posB;
      if (posA !== undefined) return -1;
      if (posB !== undefined) return 1;
      return a.driver.localeCompare(b.driver);
    });
  }, [fullStrategy, driverPositionMap]);

  const pitStops = useMemo(() => fullStrategy?.pitStops ?? [], [fullStrategy]);
  const raceControlEvents = useMemo(() => fullStrategy?.raceControl ?? [], [fullStrategy]);
  const weather = fullStrategy?.weather ?? null;

  // Group pit stops by driver for display on the chart
  const pitStopsByDriver = useMemo(() => {
    const map = new Map<string, PitStop[]>();
    pitStops.forEach((ps) => {
      const list = map.get(ps.driver) || [];
      list.push(ps);
      map.set(ps.driver, list);
    });
    return map;
  }, [pitStops]);

  // Identify SC/VSC/Red Flag laps for overlay markers
  const flagEvents = useMemo(() => {
    return raceControlEvents.filter(
      (e) =>
        e.flag === 'YELLOW' ||
        e.flag === 'RED' ||
        e.category === 'SafetyCar' ||
        e.category === 'VirtualSafetyCar' ||
        (e.message &&
          (/safety car/i.test(e.message) || /red flag/i.test(e.message) || /vsc/i.test(e.message)))
    );
  }, [raceControlEvents]);

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
          <p className="font-black uppercase tracking-wider">Error loading strategy</p>
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
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8 border-b border-gray-700 pb-6">
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
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                      {compound}
                    </span>
                  </div>
                )
            )}
          </div>

          {/* Chart */}
          <div className="space-y-4 relative">
            {/* SC / VSC / Red Flag lap markers */}
            {flagEvents.length > 0 && maxLaps > 1 && (
              <div className="absolute inset-0 pointer-events-none ml-20 z-[5]">
                {flagEvents.map((evt, i) => {
                  if (!evt.lap || evt.lap < 1) return null;
                  const leftPct = ((evt.lap - 1) / maxLaps) * 100;
                  const isSC =
                    evt.category === 'SafetyCar' ||
                    (evt.message && /safety car/i.test(evt.message));
                  const isVSC =
                    evt.category === 'VirtualSafetyCar' ||
                    (evt.message && /vsc|virtual/i.test(evt.message));
                  const isRed =
                    evt.flag === 'RED' || (evt.message && /red flag/i.test(evt.message));
                  const color = isRed
                    ? 'bg-red-500/30 border-red-500'
                    : isSC
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : isVSC
                        ? 'bg-yellow-500/10 border-yellow-600'
                        : 'bg-yellow-500/10 border-yellow-700';
                  const label = isRed ? 'RED' : isSC ? 'SC' : isVSC ? 'VSC' : 'FLAG';
                  return (
                    <div
                      key={i}
                      className={cn('absolute h-full w-px border-l-2 border-dashed', color)}
                      style={{ left: `${leftPct}%` }}
                    >
                      <span
                        className={cn(
                          'absolute -top-6 -translate-x-1/2 text-[8px] font-black tracking-wider px-1 rounded-sm',
                          isRed ? 'text-red-400 bg-red-900/60' : 'text-yellow-400 bg-yellow-900/60'
                        )}
                      >
                        {label} L{evt.lap}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

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
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        {positionText}
                      </span>
                    )}
                  </div>

                  <div className="flex-grow h-8 bg-black relative flex rounded-sm overflow-hidden ring-1 ring-gray-700 group-hover:ring-gray-600 transition-all">
                    {driverData.stints.map((stint, index) => {
                      const widthPercentage = ((stint.endLap - stint.startLap + 1) / maxLaps) * 100;
                      const leftOffsetPercentage = ((stint.startLap - 1) / maxLaps) * 100;
                      const bgColorClass = getTireColorClass(stint.compound);
                      const isFresh = stint.freshTyre === true;
                      const isUsed = stint.freshTyre === false;
                      const positionDelta =
                        stint.positionStart != null && stint.positionEnd != null
                          ? stint.positionStart - stint.positionEnd
                          : null;

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
                            >
                              {/* Fresh / Used tyre indicator */}
                              {stint.freshTyre != null && (
                                <span
                                  className={cn(
                                    'absolute top-0 left-0 text-[7px] font-black leading-none px-[2px] rounded-br-sm',
                                    isFresh
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-700 text-gray-300'
                                  )}
                                >
                                  {isFresh ? 'N' : 'U'}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-black/90 backdrop-blur-xl border border-gray-700 text-white p-3 rounded-none shadow-2xl"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-2">
                                <span className={cn('w-2 h-2 rounded-full', bgColorClass)}></span>
                                <span className="font-black uppercase tracking-wider text-sm">
                                  {stint.compound}
                                </span>
                                {stint.freshTyre != null && (
                                  <span
                                    className={cn(
                                      'text-[9px] font-black px-1.5 py-0.5 rounded-sm',
                                      isFresh
                                        ? 'bg-green-900/60 text-green-400'
                                        : 'bg-gray-800 text-gray-400'
                                    )}
                                  >
                                    {isFresh ? 'NEW' : 'USED'}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-gray-300">
                                <span>Laps:</span>
                                <span className="text-white text-right">
                                  {stint.startLap} - {stint.endLap}
                                </span>
                                <span>Duration:</span>
                                <span className="text-white text-right">{stint.lapCount} laps</span>
                                {stint.tyreLifeStart != null && stint.tyreLifeEnd != null && (
                                  <>
                                    <span>Tyre Life:</span>
                                    <span className="text-white text-right">
                                      {stint.tyreLifeStart} → {stint.tyreLifeEnd} laps
                                    </span>
                                  </>
                                )}
                                {stint.avgLapTime != null && (
                                  <>
                                    <span>Avg Lap:</span>
                                    <span className="text-white text-right">
                                      {formatLapTime(stint.avgLapTime)}
                                    </span>
                                  </>
                                )}
                                {stint.bestLapTime != null && (
                                  <>
                                    <span>Best Lap:</span>
                                    <span className="text-green-400 text-right">
                                      {formatLapTime(stint.bestLapTime)}
                                    </span>
                                  </>
                                )}
                                {stint.positionStart != null && stint.positionEnd != null && (
                                  <>
                                    <span>Position:</span>
                                    <span
                                      className={cn(
                                        'text-right font-black',
                                        positionDelta && positionDelta > 0
                                          ? 'text-green-400'
                                          : positionDelta && positionDelta < 0
                                            ? 'text-red-400'
                                            : 'text-white'
                                      )}
                                    >
                                      P{stint.positionStart} → P{stint.positionEnd}
                                      {positionDelta
                                        ? ` (${positionDelta > 0 ? '+' : ''}${positionDelta})`
                                        : ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}

                    {/* Pit stop markers on the bar */}
                    {pitStopsByDriver.get(driverData.driver)?.map((ps, pi) => {
                      const leftPct = ((ps.lap - 1) / maxLaps) * 100;
                      return (
                        <Tooltip key={`pit-${pi}`}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-white border border-black z-30 cursor-help shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                              style={{ left: `calc(${leftPct}% - 6px)` }}
                            />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-black/90 backdrop-blur-xl border border-gray-700 text-white p-3 rounded-none shadow-2xl"
                          >
                            <div className="text-xs font-mono space-y-1">
                              <div className="font-black text-sm border-b border-gray-700 pb-1 mb-1">
                                PIT STOP {ps.stopNumber}
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-300">
                                <span>Lap:</span>
                                <span className="text-white text-right">L{ps.lap}</span>
                                <span>Duration:</span>
                                <span
                                  className={cn(
                                    'text-right font-black',
                                    ps.duration != null && ps.duration < 25
                                      ? 'text-green-400'
                                      : ps.duration != null && ps.duration > 30
                                        ? 'text-red-400'
                                        : 'text-white'
                                  )}
                                >
                                  {ps.duration != null ? `${ps.duration.toFixed(1)}s` : '—'}
                                </span>
                                <span>Tyres:</span>
                                <span className="text-white text-right">
                                  {ps.tyreFrom} → {ps.tyreTo}
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

  return (
    <div
      ref={exportRef}
      className={cn('bg-black p-0', className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      {/* Weather Banner */}
      {weather && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 px-4 py-3 bg-black border border-gray-700 text-xs font-mono text-gray-400">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            Weather
          </span>
          <span>
            Air <span className="text-white font-black">{weather.airTemp}°C</span>
          </span>
          <span>
            Track <span className="text-white font-black">{weather.trackTemp}°C</span>
          </span>
          <span>
            Humidity <span className="text-white font-black">{weather.humidity}%</span>
          </span>
          <span>
            Wind <span className="text-white font-black">{weather.windSpeed} km/h</span>
          </span>
          {weather.rainfall && <span className="text-blue-400 font-black">🌧 Rain</span>}
        </div>
      )}

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
          <TabsList className="bg-transparent p-0 h-auto rounded-none gap-2 w-full sm:w-auto flex-wrap">
            <TabsTrigger
              value="overview"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 border border-gray-700 data-[state=active]:border-white text-xs font-black uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 border border-gray-700 data-[state=active]:border-white text-xs font-black uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-600"
            >
              Stint Detail
            </TabsTrigger>
            {pitStops.length > 0 && (
              <TabsTrigger
                value="pitstops"
                className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 border border-gray-700 data-[state=active]:border-white text-xs font-black uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-600"
              >
                Pit Stops ({pitStops.length})
              </TabsTrigger>
            )}
            {raceControlEvents.length > 0 && (
              <TabsTrigger
                value="racecontrol"
                className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 border border-gray-700 data-[state=active]:border-white text-xs font-black uppercase tracking-wider py-2 px-6 rounded-none transition-all hover:text-white hover:border-gray-600"
              >
                Race Control ({raceControlEvents.length})
              </TabsTrigger>
            )}
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

        {/* Pit Stops Tab */}
        {pitStops.length > 0 && (
          <TabsContent
            value="pitstops"
            className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-500 uppercase tracking-wider">
                    <th className="text-left py-2 px-3">Driver</th>
                    <th className="text-center py-2 px-3">Stop #</th>
                    <th className="text-center py-2 px-3">Lap</th>
                    <th className="text-center py-2 px-3">Duration</th>
                    <th className="text-center py-2 px-3">Tyre Change</th>
                  </tr>
                </thead>
                <tbody>
                  {pitStops
                    .sort((a, b) => a.lap - b.lap)
                    .map((ps, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-2 px-3 font-black text-white">{ps.driver}</td>
                        <td className="py-2 px-3 text-center text-gray-400">{ps.stopNumber}</td>
                        <td className="py-2 px-3 text-center text-white">L{ps.lap}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={cn(
                              'font-black',
                              ps.duration != null && ps.duration < 25
                                ? 'text-green-400'
                                : ps.duration != null && ps.duration > 30
                                  ? 'text-red-400'
                                  : 'text-white'
                            )}
                          >
                            {ps.duration != null ? `${ps.duration.toFixed(1)}s` : '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={cn('w-2 h-2 rounded-full', getTireColorClass(ps.tyreFrom))}
                            ></span>
                            <span className="text-gray-500">{ps.tyreFrom}</span>
                            <span className="text-gray-600 mx-1">→</span>
                            <span
                              className={cn('w-2 h-2 rounded-full', getTireColorClass(ps.tyreTo))}
                            ></span>
                            <span className="text-white">{ps.tyreTo}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        {/* Race Control Events Tab */}
        {raceControlEvents.length > 0 && (
          <TabsContent
            value="racecontrol"
            className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {raceControlEvents.map((evt, i) => {
                const isRed = evt.flag === 'RED';
                const isYellow =
                  evt.flag === 'YELLOW' ||
                  evt.category === 'SafetyCar' ||
                  evt.category === 'VirtualSafetyCar';
                const isGreen = evt.flag === 'GREEN';
                const flagColor = isRed
                  ? 'border-red-600 bg-red-900/20'
                  : isYellow
                    ? 'border-yellow-600 bg-yellow-900/20'
                    : isGreen
                      ? 'border-green-600 bg-green-900/20'
                      : 'border-gray-700 bg-black';
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-3 p-3 border-l-2 text-xs font-mono',
                      flagColor
                    )}
                  >
                    {evt.lap != null && (
                      <span className="text-gray-500 shrink-0 w-8 text-right">L{evt.lap}</span>
                    )}
                    <span
                      className={cn(
                        'shrink-0 font-black uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded-sm',
                        isRed
                          ? 'text-red-400 bg-red-900/40'
                          : isYellow
                            ? 'text-yellow-400 bg-yellow-900/40'
                            : isGreen
                              ? 'text-green-400 bg-green-900/40'
                              : 'text-gray-400 bg-gray-800'
                      )}
                    >
                      {evt.flag || evt.category || 'INFO'}
                    </span>
                    <span className="text-gray-300 flex-1">{evt.message}</span>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export { TireStrategy };
export default TireStrategy;
