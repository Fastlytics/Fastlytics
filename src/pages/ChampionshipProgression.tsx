// knip-ignore
import React, { useState, useMemo } from 'react';

import { m } from 'motion/react';
import { ArrowLeft01Icon, FilterHorizontalIcon, AlertCircleIcon } from 'hugeicons-react';
import { TrendingUp } from 'lucide-react';
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

import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/layout/SEO';
import type { CustomTooltipProps, CustomLegendProps } from '@/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchChampionshipProgression, ChampionshipProgressionData } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { cn } from '@/lib/utils';
import { getCountryCode } from '@/utils/countryUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { useEffect } from 'react';

interface ChampionshipTooltipProps extends CustomTooltipProps<number> {
  selectedYear: number;
}

const ChampionshipTooltip = ({
  active,
  payload,
  label,
  selectedYear,
}: ChampionshipTooltipProps) => {
  if (active && payload && payload.length) {
    // Sort payload by value (points) descending
    const sortedPayload = payload.toSorted((a, b) => (b.value || 0) - (a.value || 0));

    // Access direct data point from payload
    const dataPoint = payload[0]?.payload;
    const country = dataPoint?.country || label;
    const eventName = dataPoint?.name || label;

    return (
      <div className="bg-black/95 border border-zinc-800 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[280px]">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800">
          <img
            src={`https://flagcdn.com/h24/${getCountryCode(country)}.png`}
            alt="Country Flag"
            className="h-4 rounded-[2px]"
          />
          <p className="font-black text-white uppercase italic tracking-wider text-sm">
            {eventName}
          </p>
        </div>
        <div className="space-y-3">
          {sortedPayload.map((entry, index: number) => {
            // Use dataKey (driver code) for image lookup if available, otherwise name
            const driverId = entry.dataKey || entry.name;
            const headshot = getDriverImage(driverId, selectedYear);

            return (
              <div key={entry.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono text-xs w-4">#{index + 1}</span>
                  <div className="relative">
                    <div className="size-8 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800">
                      {headshot ? (
                        <img
                          src={headshot}
                          alt={entry.name}
                          className="size-full object-cover object-top"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-zinc-800 text-xs font-bold text-zinc-500">
                          {entry.name[0]}
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-black"
                      style={{ backgroundColor: entry.color }}
                    />
                  </div>
                  <span className="font-bold text-sm text-zinc-200">{entry.name}</span>
                </div>
                <span className="font-black font-mono text-white text-sm tabular-nums">
                  {entry.value}{' '}
                  <span className="text-[10px] text-zinc-500 font-normal ml-0.5">PTS</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

interface ChampionshipLegendProps extends CustomLegendProps {
  selectedYear: number;
}

const ChampionshipLegend = ({ payload, selectedYear }: ChampionshipLegendProps) => {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-6 pt-4">
      {payload.map((entry, index: number) => {
        const driverId = entry.dataKey || entry.value; // Prefer dataKey (code)
        const headshot = getDriverImage(driverId, selectedYear);

        return (
          <div
            key={`legend-${driverId}`}
            className="flex items-center gap-2 bg-zinc-900/50 pr-3 pl-1 py-1 rounded-full border border-zinc-800 backdrop-blur-sm"
          >
            <div className="relative size-8 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
              {headshot ? (
                <img
                  src={headshot}
                  alt={entry.value}
                  className="size-full object-cover object-top"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-xs font-bold text-zinc-500">
                  {entry.value[0]}
                </div>
              )}
            </div>
            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-bold text-zinc-200">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

const ChampionshipProgression = () => {
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const { trackEvent, trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('championship_progression', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State for driver filtering keyed by year so switching seasons naturally resets
  const [selectedDriversMap, setSelectedDriversMap] = useState<Record<number, string[]>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch Data
  const { data, isLoading, isError, error } = useQuery<ChampionshipProgressionData>({
    queryKey: ['championshipProgression', selectedYear],
    queryFn: () => fetchChampionshipProgression(selectedYear),
  });

  // Process data for Chart
  const chartData = useMemo(() => {
    if (!data || !data.rounds) return [];

    return data.rounds.map((round, index) => {
      const point: Record<string, string | number> = {
        name: round.event,
        uniqueId: `${round.round}_${round.event}`, // Unique identifier for X-Axis
        shortName: round.country || `R${round.round}`,
        country: round.country || round.event,
        round: round.round,
      };

      // Add points for each driver
      Object.entries(data.drivers).forEach(([code, driverData]) => {
        if (driverData.points_history[index] !== undefined) {
          point[code] = driverData.points_history[index];
        }
      });

      return point;
    });
  }, [data]);

  // Compute default drivers when no explicit selection exists for the current year
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
    setSelectedDrivers((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  const selectAllTop10 = () => {
    if (!data) return;
    const top10 = Object.entries(data.drivers)
      .sort(([, a], [, b]) => {
        const pointsA = a.points_history[a.points_history.length - 1] || 0;
        const pointsB = b.points_history[b.points_history.length - 1] || 0;
        return pointsB - pointsA;
      })
      .slice(0, 10)
      .map(([code]) => code);
    setSelectedDrivers(top10);
    trackEvent('filter_action', {
      page: 'championship_progression',
      action: 'select_top10',
      year: selectedYear,
    });
  };

  const clearSelection = () => {
    setSelectedDrivers([]);
    trackEvent('filter_action', {
      page: 'championship_progression',
      action: 'clear_selection',
      year: selectedYear,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-red-600 selection:text-white flex flex-col">
      <SEO
        title="Championship Race"
        description={`Track the ${selectedYear} championship race with cumulative points, contender filters, and round-by-round momentum swings.`}
        keywords={['championship standings', 'title fight', 'f1 standings', 'points progression']}
      />
      <DashboardNavbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b-2 border-zinc-800 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft01Icon className="size-6" />
              </Button>
              <h1 className="text-3xl md:text-5xl font-semibold uppercase italic tracking-tighter flex items-center gap-3">
                Championship <span className="text-red-600">Progression</span>
                <TrendingUp className="size-8 text-zinc-600 md:h-10 md:w-10" />
              </h1>
            </div>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest ml-14">
              Season Cumulative Points Analysis
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 ml-14 md:ml-0">
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => {
                setSelectedYear(Number(value));
                trackEvent('season_changed', {
                  page: 'championship_progression',
                  year: Number(value),
                });
              }}
            >
              <SelectTrigger className="w-[140px] bg-zinc-950 border-2 border-zinc-800 text-white hover:border-red-600 rounded-none font-bold uppercase tracking-widest">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-2 border-zinc-800 text-white rounded-none">
                <SelectGroup>
                  <SelectLabel className="text-xs text-zinc-500 uppercase p-2">Season</SelectLabel>
                  {availableYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={String(year)}
                      className="cursor-pointer focus:bg-red-600 focus:text-white font-bold"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant={isFilterOpen ? 'destructive' : 'outline'}
              className={cn(
                'border-2 font-bold uppercase tracking-wider gap-2',
                isFilterOpen
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:border-white'
              )}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FilterHorizontalIcon className="size-4" />
              Drivers
            </Button>
          </div>
        </div>

        {/* Driver Filter Panel (Collapsible) */}
        <m.div
          initial={false}
          animate={{ height: isFilterOpen ? 'auto' : 0, opacity: isFilterOpen ? 1 : 0 }}
          className="overflow-hidden mb-6"
        >
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold uppercase text-zinc-400 tracking-wider">
                Select Drivers to Compare
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllTop10} className="text-xs h-7">
                  Top 10
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-xs h-7 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {data?.drivers &&
                Object.entries(data.drivers)
                  .sort(([, a], [, b]) => {
                    // Sort by current points descending
                    const pointsA = a.points_history[a.points_history.length - 1] || 0;
                    const pointsB = b.points_history[b.points_history.length - 1] || 0;
                    return pointsB - pointsA;
                  })
                  .map(([code, driver]) => (
                    <div key={code} className="flex items-center gap-x-2">
                      <Checkbox
                        id={`driver - ${code} `}
                        checked={selectedDrivers.includes(code)}
                        onCheckedChange={() => handleDriverToggle(code)}
                        className="border-zinc-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <label
                        htmlFor={`driver - ${code} `}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                      >
                        <span
                          className="w-1.5 h-6 block rounded-full"
                          style={{ backgroundColor: driverColor(code, selectedYear) }}
                        ></span>
                        <span
                          className={
                            selectedDrivers.includes(code)
                              ? 'text-white font-bold'
                              : 'text-zinc-400'
                          }
                        >
                          {driver.name}
                        </span>
                      </label>
                    </div>
                  ))}
            </div>
          </div>
        </m.div>

        {/* Content Area */}
        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 md:p-8 h-[600px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-400 animate-pulse font-mono text-sm">
                  Loading Progression Data…
                </p>
              </div>
            </div>
          ) : isError ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-8">
              <AlertCircleIcon className="size-16 text-red-600 mb-4 opacity-50" />
              <h3 className="text-xl font-semibold uppercase text-white mb-2">Unavailable</h3>
              <p className="text-zinc-500 max-w-md">
                {(error as Error)?.message ||
                  "Could not load championship progression data. This may be because the season data hasn't been processed yet."}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="uniqueId"
                  tick={({ x, y, payload }) => {
                    const dataPoint = chartData[payload.index];
                    const countryName = dataPoint ? dataPoint.country : payload.value;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <foreignObject x={-12} y={10} width={24} height={18}>
                          <img
                            src={`https://flagcdn.com/h24/${getCountryCode(countryName)}.png`}
                            alt={countryName}
                            className="size-full object-cover rounded-[2px] opacity-80 hover:opacity-100 transition-opacity"
                          />
                        </foreignObject>
                      </g>
                    );
                  }}
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: '#333' }}
                  height={40}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fill: '#666', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[
                    0,
                    (dataMax: number) => {
                      // Adaptive rounding based on the maximum value
                      if (!dataMax || dataMax <= 0 || isNaN(dataMax)) return 100;

                      // Low points (e.g. backmarkers): round to nearest 5 or 10
                      if (dataMax <= 20) return Math.ceil(dataMax / 5) * 5;
                      if (dataMax <= 50) return Math.ceil(dataMax / 10) * 10;
                      if (dataMax <= 100) return Math.ceil(dataMax / 20) * 20;

                      // High points (title contenders): round to nearest 50
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
                      strokeWidth={2}
                      dot={{ r: 3, fill: driverColor(code, selectedYear), strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                      animationDuration={1500}
                      name={driverData.name}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChampionshipProgression;
