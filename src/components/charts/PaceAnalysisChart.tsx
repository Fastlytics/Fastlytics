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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusSignCircleIcon, CancelCircleIcon } from 'hugeicons-react';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

interface PaceChartDataPoint extends PaceDistributionData {
  iqr: [number, number];
}

interface PaceTooltipProps {
  active?: boolean;
  payload?: { payload: PaceChartDataPoint }[];
  label?: string;
}

// Helper function - moved outside component to avoid re-creation
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
};

// CustomTooltip component - moved outside component to avoid creation during render
const CustomTooltip: React.FC<PaceTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/90 border border-white/20 p-3 rounded shadow-lg backdrop-blur-md z-50">
        <p className="text-white font-bold mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-300">
            Fastest: <span className="text-white font-mono">{formatTime(data.min)}</span>
          </p>
          <p className="text-gray-300">
            Q1 (25%): <span className="text-white font-mono">{formatTime(data.q1)}</span>
          </p>
          <p className="text-red-500 font-bold">
            Median: <span className="font-mono">{formatTime(data.median)}</span>
          </p>
          <p className="text-gray-300">
            Q3 (75%): <span className="text-white font-mono">{formatTime(data.q3)}</span>
          </p>
          <p className="text-gray-300">
            Slowest: <span className="text-white font-mono">{formatTime(data.max)}</span>
          </p>
          <p className="text-gray-400 text-xs mt-2">Laps: {data.count}</p>
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

  // Fetch Drivers
  const { data: sessionDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
  });

  // Validate initial drivers against session driver list — remove any that
  // don't exist in this session (e.g. VER set as favourite but absent from testing).
  React.useEffect(() => {
    if (!sessionDrivers || sessionDrivers.length === 0) return;
    const codes = new Set(sessionDrivers.map((d) => d.code));
    setSelectedDrivers((prev) => {
      const valid = prev.filter((d) => codes.has(d));
      return valid.length !== prev.length ? valid : prev;
    });
  }, [sessionDrivers]);

  // Fetch Pace Distribution Data
  const {
    data: paceData,
    isLoading,
    error,
  } = useQuery<PaceDistributionData[]>({
    queryKey: ['paceDistribution', year, event, session, selectedDrivers],
    queryFn: async () => {
      const result = await fetchPaceDistribution(year, event, session, selectedDrivers);
      // Handle both new PaceDistributionResponse format and old PaceDistributionData[] format
      if (Array.isArray(result)) return result;
      return (result as PaceDistributionResponse).overall ?? [];
    },
    enabled: selectedDrivers.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Merge colors
  const finalDriverColors = useMemo(() => {
    const colors = { ...driverColors };
    if (sessionDrivers) {
      sessionDrivers.forEach((d) => {
        if (!colors[d.code]) {
          colors[d.code] =
            d.team === 'Red Bull Racing'
              ? '#3671C6'
              : d.team === 'Ferrari'
                ? '#F91536'
                : d.team === 'Mercedes'
                  ? '#6CD3BF'
                  : d.team === 'McLaren'
                    ? '#F58020'
                    : d.team === 'Aston Martin'
                      ? '#358C75'
                      : d.team === 'Alpine'
                        ? '#2293D1'
                        : d.team === 'Williams'
                          ? '#37BEDD'
                          : d.team === 'RB'
                            ? '#6692FF'
                            : d.team === 'Kick Sauber'
                              ? '#52E252'
                              : d.team === 'Haas F1 Team'
                                ? '#B6BABD'
                                : '#FFFFFF';
        }
      });
    }
    return colors;
  }, [driverColors, sessionDrivers]);

  // Process data for Recharts
  const chartData = useMemo(() => {
    if (!paceData) return [];
    return paceData
      .map((d) => ({
        ...d,
        iqr: [d.q1, d.q3], // For the box
      }))
      .sort((a, b) => a.median - b.median); // Sort by median pace (fastest first)
  }, [paceData]);

  const toggleDriver = (driverCode: string) => {
    trackInteraction('driver_toggled', { chart: 'pace_analysis', year, event, session });
    setSelectedDrivers((prev) => {
      if (prev.includes(driverCode)) {
        return prev.filter((d) => d !== driverCode);
      }
      return [...prev, driverCode];
    });
  };

  // Calculate domain
  const minPace = chartData.length > 0 ? Math.min(...chartData.map((d) => d.min)) : 0;
  const maxPace = chartData.length > 0 ? Math.max(...chartData.map((d) => d.max)) : 0;
  const domainPadding = (maxPace - minPace) * 0.1;

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className="w-full h-full p-4 relative"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold uppercase italic tracking-wider text-white mb-4">
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
        <div className="flex flex-wrap gap-2">
          {sessionDrivers?.map((driver) => (
            <button
              key={driver.code}
              onClick={() => toggleDriver(driver.code)}
              className={cn(
                'px-2 py-1 text-xs font-bold rounded border transition-all',
                selectedDrivers.includes(driver.code)
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'
              )}
              style={{
                borderColor: selectedDrivers.includes(driver.code)
                  ? finalDriverColors[driver.code]
                  : undefined,
                backgroundColor: selectedDrivers.includes(driver.code)
                  ? finalDriverColors[driver.code]
                  : undefined,
                color: selectedDrivers.includes(driver.code) ? '#fff' : undefined,
              }}
            >
              {driver.code}
            </button>
          ))}
        </div>
      </div>

      {selectedDrivers.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-lg">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis
                dataKey="driverCode"
                stroke="#666"
                tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
                axisLine={{ stroke: '#333' }}
              />
              <YAxis
                domain={[minPace - domainPadding, maxPace + domainPadding]}
                tickFormatter={formatTime}
                stroke="#666"
                tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Geist Mono', fontSize: '12px' }} />

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
                fill="#00ff00"
                shape="triangle"
                legendType="triangle"
              />
              <Scatter
                name="Slowest Lap"
                dataKey="max"
                fill="#ff0000"
                shape="triangle"
                legendType="triangle"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-center text-gray-500">
            Box represents the middle 50% of laps (Interquartile Range).
            <span className="mx-2 text-white">■ Median</span>
            <span className="mx-2 text-green-500">▲ Fastest</span>
            <span className="mx-2 text-red-500">▲ Slowest</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { PaceAnalysisChart };
export default PaceAnalysisChart;
