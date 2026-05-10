// knip-ignore
import React, { useMemo, useState } from 'react';
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
  Scatter,
} from '@/lib/recharts-lazy';
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
  <div className="h-[500px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
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
        <Bar dataKey="iqr" name="IQR (Q1-Q3)" fill="#8884d8" barSize={40} radius={[4, 4, 4, 4]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.driverCode}
              fill={finalDriverColors[entry.driverCode] || '#fff'}
              opacity={0.5}
            />
          ))}
        </Bar>
        <Scatter name="Median" dataKey="median" fill="#fff" shape="square" legendType="square" />
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
  const availableDriverCodes = sessionDrivers?.map((driver) => driver.code) || [];

  const handleSelectAllDrivers = () => {
    trackInteraction('select_all_drivers', {
      chart: 'pace_analysis',
      year,
      event,
      session,
    });
    setSelectedDrivers(availableDriverCodes);
  };

  const handleClearDrivers = () => {
    trackInteraction('deselect_all_drivers', {
      chart: 'pace_analysis',
      year,
      event,
      session,
    });
    setSelectedDrivers([]);
  };

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className="size-full relative"
      style={inter}
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3">
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
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white transition-all text-[11px] font-semibold uppercase tracking-wider">
                  <span>
                    {selectedDrivers.length === availableDriverCodes.length
                      ? 'All Drivers'
                      : `${selectedDrivers.length} / ${availableDriverCodes.length} Selected`}
                  </span>
                  <span className="size-3.5 opacity-50">↕</span>
                </button>
              }
            />
          </div>
        </div>
      </div>

      {selectedDrivers.length === 0 ? (
        <ChartStateDisplay
          isEmpty
          height={256}
          className="border-dashed border-white/[0.1]"
          emptyMessage="Select drivers to compare pace distribution"
        />
      ) : isLoading ? (
        <ChartStateDisplay isLoading height={400} loadingMessage="Loading Pace Analysis..." />
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
