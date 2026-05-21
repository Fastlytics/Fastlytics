// knip-ignore
import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
} from '@/lib/recharts-lazy';
import { Cell } from '@/lib/recharts-cell';
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
import { ChartSaveMenu } from '@/components/saved/ChartSaveMenu';
import { driverColor } from '@/lib/driverColor';
import { DriverMultiSelect } from '@/components/charts/shared/DriverMultiSelect';
import { ChartStateDisplay } from '@/components/charts/shared/ChartStateDisplay';

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

const CustomTooltip: React.FC<PaceTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-3 shadow-2xl">
        <p className="mb-2 border-b border-white/[0.04] pb-2 text-[13px] font-medium text-white">
          {label}
        </p>
        <div className="space-y-1 text-[13px]">
          <div className="flex justify-between gap-4">
            <span className="text-white">Fastest</span>
            <span className="font-mono tabular-nums text-white">{formatTime(data.min)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white">Q1 (25%)</span>
            <span className="font-mono tabular-nums text-white">{formatTime(data.q1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-red-400 font-medium">Median</span>
            <span className="font-mono tabular-nums text-red-400 font-medium">
              {formatTime(data.median)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white">Q3 (75%)</span>
            <span className="font-mono tabular-nums text-white">{formatTime(data.q3)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white">Slowest</span>
            <span className="font-mono tabular-nums text-white">{formatTime(data.max)}</span>
          </div>
          <div className="mt-2 border-t border-white/[0.04] pt-1.5 text-[14px] text-white">
            {data.count} laps
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface PaceDistributionChartCardProps {
  chartData: PaceChartDataPoint[];
  finalDriverColors: Record<string, string>;
  minPace: number;
  domainPadding: number;
  maxPace: number;
}

const PaceDistributionChartCard: React.FC<PaceDistributionChartCardProps> = ({
  chartData,
  finalDriverColors,
  minPace,
  domainPadding,
  maxPace,
}) => (
  <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
    <div className="min-h-[460px] h-[60vh] max-h-[700px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 16, right: 20, left: 16, bottom: 16 }}>
          <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="driverCode"
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <YAxis
            domain={[minPace - domainPadding, maxPace + domainPadding]}
            tickFormatter={formatTime}
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey="iqr" name="IQR (Q1-Q3)" fill="#8884d8" barSize={36} radius={[4, 4, 4, 4]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.driverCode}
                fill={finalDriverColors[entry.driverCode] || '#fff'}
                opacity={0.45}
              />
            ))}
          </Bar>
          <Scatter name="Median" dataKey="median" fill="#fff" shape="square" legendType="square" />
          <Scatter
            name="Fastest"
            dataKey="min"
            fill="#10b981"
            shape="triangle"
            legendType="triangle"
          />
          <Scatter
            name="Slowest"
            dataKey="max"
            fill="#ef4444"
            shape="triangle"
            legendType="triangle"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    {/* Legend */}
    <div className="mt-3 flex items-center justify-center gap-5 border-t border-white/[0.04] pt-3 text-[14px] text-white">
      <span>Box = IQR (middle 50%)</span>
      <span className="flex items-center gap-1">
        <span className="inline-block size-2 bg-white" /> Median
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block size-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-emerald-400" />
        Fastest
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block size-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-400" />
        Slowest
      </span>
    </div>
  </div>
);

interface PaceAnalysisChartProps {
  year: number;
  event: string;
  session: string;
  initialDrivers?: string[];
  driverColors?: Record<string, string>;
}

const EMPTY_DRIVERS: string[] = [];
const EMPTY_DRIVER_COLORS: Record<string, string> = {};

const PaceAnalysisChart: React.FC<PaceAnalysisChartProps> = ({
  year,
  event,
  session,
  initialDrivers = EMPTY_DRIVERS,
  driverColors = EMPTY_DRIVER_COLORS,
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
  const availableDriverCodes = sessionDrivers?.map((driver) => driver.code) || [];

  const handleSelectAllDrivers = () => {
    trackInteraction('select_all_drivers', { chart: 'pace_analysis', year, event, session });
    setSelectedDrivers(availableDriverCodes);
  };

  const handleClearDrivers = () => {
    trackInteraction('deselect_all_drivers', { chart: 'pace_analysis', year, event, session });
    setSelectedDrivers([]);
  };

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className="space-y-5"
    >
      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white/80">
          {selectedDrivers.length} of {availableDriverCodes.length} drivers
        </span>
        <div className="flex items-center gap-2">
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
          <ChartSaveMenu
            chartType="pace_analysis"
            title={`Race Pace Distribution — ${event} ${year}`}
            raceName={`${year} ${event}`}
            chartConfig={{ year, event, session, drivers: selectedDrivers }}
          />
          <DriverMultiSelect
            availableDrivers={availableDriverCodes}
            selectedDrivers={selectedDrivers}
            driverNameMap={driverNameMap}
            year={year}
            onDriverToggle={toggleDriver}
            onSelectAll={handleSelectAllDrivers}
            onSelectNone={handleClearDrivers}
            isOpen={isDriverPopoverOpen}
            onOpenChange={setIsDriverPopoverOpen}
            triggerLabel={
              <button className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-transparent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:border-white/[0.12] hover:text-white min-w-[160px] justify-between">
                <span>
                  {selectedDrivers.length === availableDriverCodes.length
                    ? 'All Drivers'
                    : `${selectedDrivers.length} / ${availableDriverCodes.length} Drivers`}
                </span>
                <svg
                  className="size-3 opacity-40"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
            }
          />
        </div>
      </div>

      {/* Chart content */}
      {selectedDrivers.length === 0 ? (
        <ChartStateDisplay
          isEmpty
          height={256}
          emptyMessage="Select drivers to compare pace distribution"
        />
      ) : isLoading ? (
        <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-white/[0.04]">
          <div className="flex flex-col items-center gap-3">
            <div className="size-4 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/50" />
            <span className="text-[14px] text-white">Loading pace data</span>
          </div>
        </div>
      ) : error ? (
        <ChartStateDisplay isError height={400} errorMessage="Failed to load data." />
      ) : (
        <PaceDistributionChartCard
          chartData={chartData}
          finalDriverColors={finalDriverColors}
          minPace={minPace}
          domainPadding={domainPadding}
          maxPace={maxPace}
        />
      )}
    </div>
  );
};

export { PaceAnalysisChart };
export default PaceAnalysisChart;
