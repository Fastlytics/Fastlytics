import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import {
  fetchPaceDistribution,
  PaceDistributionData,
  PaceDistributionResponse,
  SessionDriver,
  fetchSessionDrivers,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { driverColor } from '@/lib/driverColor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpDownIcon } from 'hugeicons-react';

interface PaceChartDataPoint extends PaceDistributionData {
  iqr: [number, number];
}

interface PaceTooltipProps {
  active?: boolean;
  payload?: { payload: PaceChartDataPoint }[];
  label?: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
};

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const CustomTooltip: React.FC<PaceTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-3 shadow-2xl z-50"
        style={inter}
      >
        <p className="text-white font-bold mb-2 text-[12px]">{label}</p>
        <div className="space-y-1 text-[11px]">
          <p className="text-white/60">
            Fastest: <span className="text-white font-semibold">{formatTime(data.min)}</span>
          </p>
          <p className="text-white/60">
            Q1 (25%): <span className="text-white font-semibold">{formatTime(data.q1)}</span>
          </p>
          <p className="text-red-400 font-semibold">
            Median: <span className="font-semibold">{formatTime(data.median)}</span>
          </p>
          <p className="text-white/60">
            Q3 (75%): <span className="text-white font-semibold">{formatTime(data.q3)}</span>
          </p>
          <p className="text-white/60">
            Slowest: <span className="text-white font-semibold">{formatTime(data.max)}</span>
          </p>
          <p className="text-white/40 text-[10px] mt-2">Laps: {data.count}</p>
        </div>
      </div>
    );
  }
  return null;
};

interface PaceAnalysisChartProps {
  year: number;
  event: string;
  session: string;
  initialDrivers?: string[];
  driverColors?: Record<string, string>;
}

const PaceAnalysisChart: React.FC<PaceAnalysisChartProps> = ({
  year,
  event,
  session,
  initialDrivers = [],
  driverColors = {},
}) => {
  const chartVisRef = useChartVisibility({
    chartName: 'pace_analysis_chart',
    page: 'race',
    meta: { year, event, session },
  });
  const { trackInteraction } = useAnalytics();
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(
    initialDrivers.length > 0 ? initialDrivers : []
  );
  const [isDriverPopoverOpen, setIsDriverPopoverOpen] = useState(false);

  const { data: sessionDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
  });

  const driverNameMap = useMemo(() => {
    if (!sessionDrivers) return new Map<string, string>();
    const map = new Map<string, string>();
    sessionDrivers.forEach((d) => {
      if (d.code && d.name) map.set(d.code, d.name);
    });
    return map;
  }, [sessionDrivers]);

  // Note: selectedDrivers may briefly contain invalid codes before sessionDrivers loads.
  // The query handles this gracefully; we avoid setState-in-effect by not syncing here.

  const {
    data: paceData,
    isLoading,
    error,
  } = useQuery<PaceDistributionData[]>({
    queryKey: ['paceDistribution', year, event, session, selectedDrivers],
    queryFn: async () => {
      const result = await fetchPaceDistribution(year, event, session, selectedDrivers);
      if (Array.isArray(result)) return result;
      return (result as PaceDistributionResponse).overall ?? [];
    },
    enabled: selectedDrivers.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const finalDriverColors = useMemo(() => {
    const colors = { ...driverColors };
    if (sessionDrivers) {
      sessionDrivers.forEach((d) => {
        if (!colors[d.code]) {
          colors[d.code] = driverColor(d.code, year);
        }
      });
    }
    return colors;
  }, [driverColors, sessionDrivers, year]);

  const chartData = useMemo(() => {
    if (!paceData) return [];
    return paceData
      .map((d) => ({
        ...d,
        iqr: [d.q1, d.q3],
      }))
      .sort((a, b) => a.median - b.median);
  }, [paceData]);

  const toggleDriver = (driverCode: string) => {
    trackInteraction('driver_toggled', { chart: 'pace_analysis', year, event, session });
    setSelectedDrivers((prev) => {
      if (prev.includes(driverCode)) return prev.filter((d) => d !== driverCode);
      return [...prev, driverCode];
    });
  };

  const minPace = chartData.length > 0 ? Math.min(...chartData.map((d) => d.min)) : 0;
  const maxPace = chartData.length > 0 ? Math.max(...chartData.map((d) => d.max)) : 0;
  const domainPadding = (maxPace - minPace) * 0.1;

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className="w-full h-full relative"
      style={inter}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[16px] font-bold uppercase tracking-wider text-white">
            Race Pace Distribution
          </h3>
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title: 'Race Pace Distribution',
                subtitle: 'Lap time distribution comparison across drivers',
                year,
                event,
                session,
                drivers: selectedDrivers,
              })
            }
            isExporting={isExporting}
          />
        </div>

        {/* Driver Selector */}
        <Popover open={isDriverPopoverOpen} onOpenChange={setIsDriverPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white transition-all text-[11px] font-semibold uppercase tracking-wider">
              <span>
                {selectedDrivers.length === (sessionDrivers?.length || 0)
                  ? 'All Drivers'
                  : `${selectedDrivers.length} / ${sessionDrivers?.length || 0} Selected`}
              </span>
              <ArrowUpDownIcon className="h-3.5 w-3.5 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[280px] p-1.5 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
            style={inter}
            align="end"
          >
            <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-white/[0.06] pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {selectedDrivers.length} / {sessionDrivers?.length || 0} visible
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    trackInteraction('select_all_drivers', {
                      chart: 'pace_analysis',
                      year,
                      event,
                      session,
                    });
                    setSelectedDrivers(sessionDrivers?.map((d) => d.code) || []);
                  }}
                  className="text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  All
                </button>
                <button
                  onClick={() => {
                    trackInteraction('deselect_all_drivers', {
                      chart: 'pace_analysis',
                      year,
                      event,
                      session,
                    });
                    setSelectedDrivers([]);
                  }}
                  className="text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  None
                </button>
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="grid gap-0.5">
                {sessionDrivers?.map((driver) => {
                  const isSelected = selectedDrivers.includes(driver.code);
                  const headshot = getDriverImage(driver.code, year);
                  const color = finalDriverColors[driver.code] || '#fff';
                  const fullName = driverNameMap.get(driver.code) || driver.code;

                  return (
                    <button
                      key={driver.code}
                      onClick={() => toggleDriver(driver.code)}
                      className={cn(
                        'flex items-center gap-3 w-full px-2.5 py-2 rounded-lg transition-all text-left',
                        isSelected ? 'bg-white/[0.04]' : 'opacity-50 hover:opacity-70'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all',
                          isSelected
                            ? 'bg-red-500 border-red-500'
                            : 'border-white/[0.15] bg-transparent'
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
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
                      <div
                        className="h-8 w-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: color, opacity: isSelected ? 1 : 0.3 }}
                      />
                      <Avatar className="h-8 w-8 shrink-0 border border-white/[0.08]">
                        <AvatarImage src={headshot} className="object-cover object-top" />
                        <AvatarFallback className="bg-[#1a1a1e] text-[10px] font-bold text-white/60">
                          {driver.code[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={cn(
                            'text-[12px] font-semibold truncate',
                            isSelected ? 'text-white' : 'text-white/60'
                          )}
                        >
                          {fullName}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-medium',
                            isSelected ? 'text-white/40' : 'text-white/25'
                          )}
                        >
                          {driver.code}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {selectedDrivers.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/50 border border-dashed border-white/[0.1] rounded-xl text-[13px] font-medium">
          Select drivers to compare pace distribution
        </div>
      ) : isLoading ? (
        <div className="h-[400px] flex items-center justify-center text-white/50 animate-pulse">
          Loading Pace Analysis...
        </div>
      ) : error ? (
        <div className="h-[400px] flex items-center justify-center text-red-400">
          Failed to load data.
        </div>
      ) : (
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="driverCode"
                stroke="rgba(255,255,255,0.15)"
                tick={{
                  fill: 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                domain={[minPace - domainPadding, maxPace + domainPadding]}
                tickFormatter={formatTime}
                stroke="rgba(255,255,255,0.15)"
                tick={{
                  fill: 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '11px' }} />

              {/* The Box (Q1 to Q3) */}
              <Bar
                dataKey="iqr"
                name="IQR (Q1-Q3)"
                fill="#8884d8"
                barSize={40}
                radius={[4, 4, 4, 4]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={finalDriverColors[entry.driverCode] || '#fff'}
                    opacity={0.5}
                  />
                ))}
              </Bar>

              {/* Median Line */}
              <Scatter
                name="Median"
                dataKey="median"
                fill="#fff"
                shape="square"
                legendType="square"
              />

              {/* Min/Max */}
              <Scatter
                name="Fastest Lap"
                dataKey="min"
                fill="#10b981"
                shape="triangle"
                legendType="triangle"
              />
              <Scatter
                name="Slowest Lap"
                dataKey="max"
                fill="#ef4444"
                shape="triangle"
                legendType="triangle"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 text-[11px] text-center text-white/40">
            Box represents the middle 50% of laps (Interquartile Range).
            <span className="mx-2 text-white font-semibold">■ Median</span>
            <span className="mx-2 text-emerald-400 font-semibold">▲ Fastest</span>
            <span className="mx-2 text-red-400 font-semibold">▲ Slowest</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { PaceAnalysisChart };
export default PaceAnalysisChart;
