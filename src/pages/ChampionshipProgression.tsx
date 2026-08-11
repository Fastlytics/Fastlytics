// knip-ignore
import React, { useState, useMemo, useEffect, useRef } from 'react';

import { m, AnimatePresence } from 'motion/react';
import { AlertCircleIcon } from 'hugeicons-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/lib/recharts-lazy';

import { SEO } from '@/components/layout/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { fetchChampionshipProgression, ChampionshipProgressionData } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getCountryCode } from '@/utils/countryUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { cn } from '@/lib/utils';
import { ArrowUpDownIcon } from 'hugeicons-react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { ChartSaveMenu } from '@/components/saved/ChartSaveMenu';

import ChampionshipTooltip from '@/pages/ChampionshipProgression/ChampionshipTooltip';
import ChampionshipLegend from '@/pages/ChampionshipProgression/ChampionshipLegend';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileChampionshipProgression from '@/components/mobile/pages/MobileChampionshipProgression';

const ChampionshipProgression = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileChampionshipProgression />;

  return <ChampionshipProgressionDesktop />;
};

const ChampionshipProgressionDesktop = () => {
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const { trackEvent, trackPageView } = useAnalytics();

  const years = availableYears.length > 0 ? availableYears : [2026, 2025, 2024, 2023, 2022];

  // Season picker state
  const [seasonOpen, setSeasonOpen] = useState(false);
  const seasonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (seasonRef.current && !seasonRef.current.contains(e.target as Node)) {
        setSeasonOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    trackPageView('championship_progression', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Driver picker state
  const [selectedDriversMap, setSelectedDriversMap] = useState<Record<number, string[]>>({});
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [focusedDriver, setFocusedDriver] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<ChampionshipProgressionData>({
    queryKey: ['championshipProgression', selectedYear],
    queryFn: () => fetchChampionshipProgression(selectedYear),
  });

  const chartData = useMemo(() => {
    if (!data || !data.rounds) return [];

    return data.rounds.map((round, index) => {
      const point: Record<string, string | number> = {
        name: round.event,
        uniqueId: `${round.round}_${round.event}`,
        shortName: round.country || `R${round.round}`,
        country: round.country || round.event,
        round: round.round,
      };

      Object.entries(data.drivers).forEach(([code, driverData]) => {
        if (driverData.points_history[index] !== undefined) {
          point[code] = driverData.points_history[index];
        }
      });

      return point;
    });
  }, [data]);

  const driverCodes = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.drivers)
      .sort(([, a], [, b]) => {
        const pointsA = a.points_history[a.points_history.length - 1] || 0;
        const pointsB = b.points_history[b.points_history.length - 1] || 0;
        return pointsB - pointsA;
      })
      .map(([code]) => code);
  }, [data]);

  const defaultDrivers = useMemo(() => {
    if (!data) return [];
    const roundsReceived = data.rounds.length;
    const checkIndex = roundsReceived > 1 ? roundsReceived - 2 : 0;

    const driversAtCheck = Object.entries(data.drivers)
      .map(([code, d]) => ({
        code,
        points: d.points_history[checkIndex] || 0,
        currentPoints: d.points_history[d.points_history.length - 1] || 0,
      }))
      .sort((a, b) => b.points - a.points);

    if (driversAtCheck.length > 0) {
      const leaderPoints = driversAtCheck[0].points;
      const contenders = driversAtCheck.flatMap((d) =>
        leaderPoints - d.points <= 26 ? [d.code] : []
      );

      if (contenders.length > 1) return contenders;
      return driversAtCheck
        .sort((a, b) => b.currentPoints - a.currentPoints)
        .slice(0, 5)
        .map((d) => d.code);
    }
    return [];
  }, [data]);

  const selectedDrivers = selectedDriversMap[selectedYear]?.length
    ? selectedDriversMap[selectedYear]
    : defaultDrivers;

  const setSelectedDrivers = (value: React.SetStateAction<string[]>) => {
    setSelectedDriversMap((prev) => {
      const current = prev[selectedYear] || [];
      const next =
        typeof value === 'function' ? (value as (prev: string[]) => string[])(current) : value;
      return { ...prev, [selectedYear]: next };
    });
  };

  const handleDriverToggle = (code: string) => {
    trackEvent('driver_toggled', { driver: code, chart: 'championship', year: selectedYear });
    setSelectedDrivers((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    trackEvent('filter_action', {
      page: 'championship_progression',
      action: 'select_all',
      year: selectedYear,
    });
    setSelectedDrivers(driverCodes);
  };

  const handleSelectNone = () => {
    trackEvent('filter_action', {
      page: 'championship_progression',
      action: 'clear_selection',
      year: selectedYear,
    });
    setSelectedDrivers([]);
  };

  return (
    <>
      <SEO
        title="Championship Race"
        description={`Track the ${selectedYear} championship race with cumulative points, contender filters, and round-by-round momentum swings.`}
        keywords={['championship standings', 'title fight', 'f1 standings', 'points progression']}
      />

      <GatedRoute
        featureName="Championship Progression"
        description="Track how driver standings evolved throughout the season with interactive charts and race-by-race point progression."
      >
        <div className="space-y-5 text-white">
          {/* Header */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-white">
                Championship Progression
              </h1>
              <p className="mt-0.5 text-[12px] text-white/80">
                Cumulative points · {selectedYear} season
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <ChartSaveMenu
                chartType="championship_progression"
                title={`Championship Progression — ${selectedYear}`}
                raceName={`${selectedYear} Season`}
                chartConfig={{ year: selectedYear, drivers: selectedDrivers }}
              />
              {/* Driver picker — PositionChart style */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPopoverOpen}
                    className="w-auto min-w-[160px] justify-between text-[11px] font-semibold h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06] hover:text-white uppercase tracking-wider"
                    disabled={driverCodes.length === 0}
                  >
                    {selectedDrivers.length === driverCodes.length
                      ? 'All Drivers'
                      : selectedDrivers.length === 0
                        ? 'Select Drivers...'
                        : `${selectedDrivers.length} Selected`}
                    <ArrowUpDownIcon className="ml-2 size-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-1.5 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl">
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                      {selectedDrivers.length} / {driverCodes.length} visible
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={handleSelectAll}
                        className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                      >
                        All
                      </button>
                      <button
                        onClick={handleSelectNone}
                        className="text-[10px] font-semibold uppercase tracking-wider text-white hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="grid gap-0.5">
                      {driverCodes.map((code) => {
                        const headshot = getDriverImage(code, selectedYear);
                        const fullName = data?.drivers[code]?.name || code;
                        const isSelected = selectedDrivers.includes(code);
                        const dColor = driverColor(code, selectedYear);

                        return (
                          <button
                            key={code}
                            onClick={() => handleDriverToggle(code)}
                            className={cn(
                              'flex items-center gap-3 w-full px-2.5 py-2 rounded-lg transition-all text-left',
                              isSelected ? 'bg-white/[0.04]' : 'opacity-50 hover:opacity-70',
                              focusedDriver && focusedDriver !== code && '!opacity-20'
                            )}
                            onMouseEnter={() => setFocusedDriver(code)}
                            onMouseLeave={() => setFocusedDriver(null)}
                          >
                            {/* Check indicator */}
                            <div
                              className={cn(
                                'size-4 rounded shrink-0 flex items-center justify-center border transition-all',
                                isSelected
                                  ? 'bg-red-500 border-red-500'
                                  : 'border-white/[0.15] bg-transparent'
                              )}
                            >
                              {isSelected && (
                                <svg
                                  className="size-2.5 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>

                            {/* Team color bar */}
                            <div
                              className={cn(
                                'h-8 w-0.5 rounded-full shrink-0 transition-opacity',
                                isSelected ? 'opacity-100' : 'opacity-30'
                              )}
                              style={{ backgroundColor: dColor }}
                            />

                            {/* Headshot */}
                            <Avatar className="size-8 shrink-0 border border-white/[0.08]">
                              <AvatarImage src={headshot} className="object-cover object-top" />
                              <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white">
                                {code[0]}
                              </AvatarFallback>
                            </Avatar>

                            {/* Name */}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span
                                className={cn(
                                  'text-[12px] font-semibold truncate transition-colors',
                                  isSelected ? 'text-white' : 'text-white'
                                )}
                              >
                                {fullName}
                              </span>
                              <span className="text-[10px] font-medium text-white/80">{code}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {/* Season picker — BreadcrumbBar style */}
              <div ref={seasonRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSeasonOpen(!seasonOpen)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium transition-all ${
                    seasonOpen
                      ? 'border-white/[0.08] bg-white/[0.04] text-white'
                      : 'border-white/[0.04] text-white hover:border-white/[0.08] hover:text-white'
                  }`}
                >
                  <span className="font-mono tabular-nums">{selectedYear}</span>
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 10 10"
                    fill="none"
                    className={`text-white/60 transition-transform ${seasonOpen ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M2 4l3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <AnimatePresence>
                  {seasonOpen && (
                    <m.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-lg border border-white/[0.04] bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                    >
                      <div className="p-1">
                        {years.map((year) => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => {
                              setSelectedYear(year);
                              setSeasonOpen(false);
                              trackEvent('season_changed', {
                                page: 'championship_progression',
                                year,
                              });
                            }}
                            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                              year === selectedYear
                                ? 'bg-white/[0.04] text-white'
                                : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                            }`}
                          >
                            <span className="font-mono tabular-nums">{year}</span>
                            {year === selectedYear && (
                              <span className="size-1 rounded-full bg-white/60" />
                            )}
                          </button>
                        ))}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </m.div>

          {/* Chart */}
          <div className={`${CARD_CONTAINER} relative h-[calc(100vh-160px)]`}>
            {isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                  <span className="text-[12px] text-white/50">Loading progression data…</span>
                </div>
              </div>
            ) : isError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircleIcon className="mb-3 size-10 text-white/20" />
                <h3 className="text-[15px] font-medium text-white">Unavailable</h3>
                <p className="mt-1 max-w-md text-[13px] text-white/60">
                  {(error as Error)?.message ||
                    "Could not load championship progression data. This may be because the season data hasn't been processed yet."}
                </p>
              </div>
            ) : (
              <div className="h-full p-4 md:p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="uniqueId"
                      tick={({ x, y, payload }) => {
                        const dataPoint = chartData[payload.index];
                        const countryName = dataPoint ? String(dataPoint.country) : payload.value;
                        const roundNum = dataPoint ? dataPoint.round : payload.index + 1;
                        const countryCode = getCountryCode(countryName);
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <foreignObject x={-14} y={8} width={28} height={40}>
                              <div className="flex flex-col items-center gap-[3px]">
                                <img
                                  src={`https://flagcdn.com/${countryCode}.svg`}
                                  alt={countryName}
                                  className="h-[14px] w-[20px] rounded-[2px] object-cover opacity-80"
                                />
                                <span className="text-[9px] font-medium tabular-nums text-white/40">
                                  {roundNum}
                                </span>
                              </div>
                            </foreignObject>
                          </g>
                        );
                      }}
                      interval={0}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                      height={56}
                    />
                    <YAxis
                      stroke="transparent"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[
                        0,
                        (dataMax: number) => {
                          if (!dataMax || dataMax <= 0 || isNaN(dataMax)) return 100;
                          if (dataMax <= 20) return Math.ceil(dataMax / 5) * 5;
                          if (dataMax <= 50) return Math.ceil(dataMax / 10) * 10;
                          if (dataMax <= 100) return Math.ceil(dataMax / 20) * 20;
                          return Math.ceil(dataMax / 50) * 50;
                        },
                      ]}
                    />
                    <Tooltip content={<ChampionshipTooltip selectedYear={selectedYear} />} />
                    <Legend
                      content={<ChampionshipLegend selectedYear={selectedYear} />}
                      verticalAlign="bottom"
                    />
                    {selectedDrivers.map((code) => {
                      const driverData = data?.drivers[code];
                      if (!driverData) return null;
                      return (
                        <Line
                          key={code}
                          type="monotone"
                          dataKey={code}
                          stroke={driverColor(code, selectedYear)}
                          strokeWidth={focusedDriver === code ? 4 : 2}
                          strokeOpacity={focusedDriver ? (focusedDriver === code ? 1 : 0.1) : 1}
                          dot={{ r: 2.5, fill: driverColor(code, selectedYear), strokeWidth: 0 }}
                          activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                          animationDuration={1200}
                          name={driverData.name}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </GatedRoute>
    </>
  );
};

export default ChampionshipProgression;
