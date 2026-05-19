// knip-ignore
import React, { useMemo, type Dispatch, type SetStateAction } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from '@/lib/recharts-lazy';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { fetchLapGaps, LapTimeDataPoint, LapGapsResponse } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { getLineStylesForDriver, groupDriversByTeam } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLapChartData, MIN_DRIVERS } from '@/hooks/useLapChartData';
import { DriverMultiSelect } from '@/components/charts/shared/DriverMultiSelect';

const formatGap = (gap: number | null): string => {
  if (gap === null || isNaN(gap)) return 'N/A';
  if (gap === 0) return '+0.000';
  return gap > 0 ? `+${gap.toFixed(3)}` : gap.toFixed(3);
};

interface GapToLeaderChartProps {
  className?: string;
  delay?: number;
  year: number;
  event: string;
  session: string;
  initialDrivers?: string[];
  staticData?: LapTimeDataPoint[];
  title?: string;
  autoLoad?: boolean;
  favoriteDriver?: string | null;
  rivalDriver?: string | null;
}

const GapToLeaderChart: React.FC<GapToLeaderChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDrivers,
  staticData,
  autoLoad = false,
  favoriteDriver,
  rivalDriver,
}) => {
  const [isDriverPopoverOpen, setIsDriverPopoverOpen] = React.useState(false);

  const {
    chartRef,
    chartVisRef,
    exportRef,
    exportChart,
    isExporting,
    shouldLoadChart,
    setShouldLoadChart,
    focusedDriver,
    setFocusedDriver,
    selectedDrivers,
    availableDrivers,
    isLoadingDrivers,
    driverNameMap,
    effectiveDrivers,
    driversToDisplay,
    error,
    isError,
    isLoading,
    toggleDriver,
    trackInteraction,
    setSelectedDrivers,
  } = useLapChartData({
    year,
    event,
    session,
    initialDrivers,
    staticData,
    autoLoad,
    favoriteDriver,
    rivalDriver,
    chartName: 'gap_to_leader_chart',
  });

  const { data: lapGapsResponse, isLoading: isLoadingGaps } = useQuery<LapGapsResponse>({
    queryKey: ['lapGaps', year, event, session, ...effectiveDrivers.sort()],
    queryFn: () => fetchLapGaps(year, event, session, effectiveDrivers),
    enabled:
      !staticData &&
      !!year &&
      !!event &&
      !!session &&
      effectiveDrivers.length >= MIN_DRIVERS &&
      shouldLoadChart,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  });

  const gapData = useMemo(() => {
    if (staticData) return staticData;
    return lapGapsResponse?.lapGaps || [];
  }, [lapGapsResponse, staticData]);

  const isLoadingAll = isLoadingGaps;
  const availableDriverCodes = availableDrivers?.map((d) => d.code) || [];

  return (
    <div
      ref={(el) => {
        chartRef.current = el;
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn('space-y-5', className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
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
                title: 'Gap to Leader',
                subtitle: 'Cumulative gap to race leader over laps',
                year,
                event,
                session,
                drivers: driversToDisplay,
              })
            }
            isExporting={isExporting}
          />
          {!staticData && availableDrivers && (
            <DriverMultiSelect
              availableDrivers={availableDriverCodes}
              selectedDrivers={selectedDrivers}
              driverNameMap={driverNameMap}
              year={year}
              favoriteDriver={favoriteDriver}
              focusedDriver={focusedDriver}
              minDrivers={MIN_DRIVERS}
              onDriverToggle={toggleDriver}
              onSelectAll={() => {
                trackInteraction('select_all_drivers', {
                  chart: 'gap_to_leader',
                  year,
                  event,
                  session,
                });
                setSelectedDrivers(availableDriverCodes);
              }}
              onSelectNone={() => {
                trackInteraction('deselect_all_drivers', {
                  chart: 'gap_to_leader',
                  year,
                  event,
                  session,
                });
                setSelectedDrivers(availableDriverCodes.slice(0, MIN_DRIVERS));
              }}
              onDriverFocus={setFocusedDriver}
              isOpen={isDriverPopoverOpen}
              onOpenChange={setIsDriverPopoverOpen}
              selectNoneLabel="Reset"
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
          )}
        </div>
      </div>

      {/* Chart */}
      <GapToLeaderContent
        shouldLoadChart={shouldLoadChart}
        staticData={staticData}
        trackInteraction={trackInteraction}
        year={year}
        event={event}
        session={session}
        setShouldLoadChart={setShouldLoadChart}
        selectedDrivers={selectedDrivers}
        MIN_DRIVERS={MIN_DRIVERS}
        isLoadingDrivers={isLoadingDrivers}
        isLoadingAll={isLoadingAll}
        isError={isError}
        error={error}
        gapData={gapData}
        driversToDisplay={driversToDisplay}
        driverNameMap={driverNameMap}
        focusedDriver={focusedDriver}
        setFocusedDriver={setFocusedDriver}
      />
    </div>
  );
};

export { GapToLeaderChart };

interface GapToLeaderContentProps {
  shouldLoadChart: boolean;
  staticData?: LapTimeDataPoint[];
  trackInteraction: (action: string, meta?: Record<string, unknown>) => void;
  year: number;
  event: string;
  session: string;
  setShouldLoadChart: (val: boolean) => void;
  selectedDrivers: string[];
  MIN_DRIVERS: number;
  isLoadingDrivers: boolean;
  isLoadingAll: boolean;
  isError: boolean;
  error: Error | null;
  gapData: LapTimeDataPoint[];
  driversToDisplay: string[];
  driverNameMap: Map<string, string>;
  focusedDriver: string | null;
  setFocusedDriver: Dispatch<SetStateAction<string | null>>;
}

const GapToLeaderContent: React.FC<GapToLeaderContentProps> = ({
  shouldLoadChart,
  staticData,
  trackInteraction,
  year,
  event,
  session,
  setShouldLoadChart,
  selectedDrivers,
  MIN_DRIVERS,
  isLoadingDrivers,
  isLoadingAll,
  isError,
  error,
  gapData,
  driversToDisplay,
  driverNameMap,
  focusedDriver,
  setFocusedDriver,
}) => {
  if (!shouldLoadChart && !staticData) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-white/[0.04] gap-4">
        <p className="text-[14px] text-white">Select drivers to compare</p>
        <Button
          onClick={() => {
            trackInteraction('chart_data_loaded', {
              chart: 'gap_to_leader',
              year,
              event,
              session,
            });
            setShouldLoadChart(true);
          }}
          className="rounded-md bg-white hover:bg-white/90 text-black font-medium text-[13px] px-4 py-2"
          disabled={selectedDrivers.length < MIN_DRIVERS || isLoadingDrivers}
        >
          Load Data
        </Button>
      </div>
    );
  }

  if (isLoadingAll) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-white/[0.04]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/50" />
          <span className="text-[14px] text-white">Loading gap data</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-white/[0.04]">
        <p className="text-[14px] text-red-400">Error loading lap gaps</p>
        <p className="mt-1 text-[13px] text-white/80">
          {(error as Error)?.message || 'Could not fetch data.'}
        </p>
        {!staticData && (
          <Button
            onClick={() => setShouldLoadChart(false)}
            variant="outline"
            size="sm"
            className="mt-4 rounded-md border-white/[0.06] text-white text-[13px]"
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  if (gapData.length === 0) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-white/[0.04]">
        <p className="text-[14px] text-white">No common lap data found.</p>
        {!staticData && (
          <Button
            onClick={() => setShouldLoadChart(false)}
            variant="outline"
            size="sm"
            className="mt-4 rounded-md border-white/[0.06] text-white text-[13px]"
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  const teamGroups = groupDriversByTeam(driversToDisplay, year);

  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
      <div className="min-h-[460px] h-[60vh] max-h-[700px]">
        <ResponsiveContainer width="100%" height="100%" className="export-chart-container">
          <LineChart data={gapData} margin={{ top: 12, right: 10, left: -12, bottom: 8 }}>
            <CartesianGrid
              strokeDasharray="none"
              vertical={false}
              stroke="rgba(255,255,255,0.03)"
            />
            <XAxis
              dataKey="LapNumber"
              stroke="rgba(255,255,255,0.06)"
              tick={{
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
              }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              padding={{ left: 8, right: 8 }}
              label={{
                value: 'Lap',
                position: 'insideBottomRight',
                offset: -4,
                fill: 'rgba(255,255,255,0.4)',
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.06)"
              tick={{
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
              }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={formatGap}
              allowDecimals={true}
              width={58}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const sortedPayload = payload.toSorted(
                  (a, b) => ((a.value as number) || Infinity) - ((b.value as number) || Infinity)
                );

                return (
                  <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-3 shadow-2xl">
                    <div className="mb-2 border-b border-white/[0.04] pb-2 font-mono text-[13px] font-medium tabular-nums text-white">
                      Lap {label}
                    </div>
                    <div className="space-y-1.5">
                      {sortedPayload.map((entry) => {
                        const driverCode = String(entry.name);
                        const gap = entry.value;
                        if (gap === null) return null;
                        const headshot = getDriverImage(driverCode, year);
                        const color = entry.color;
                        const fullName = driverNameMap.get(driverCode) || driverCode;

                        return (
                          <div key={driverCode} className="flex items-center gap-2">
                            <Avatar className="size-5 shrink-0 border border-white/[0.06]">
                              <AvatarImage src={headshot} className="object-cover object-top" />
                              <AvatarFallback className="bg-white/[0.03] text-[7px] font-medium text-white">
                                {driverCode[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className="font-mono text-[13px] font-semibold tabular-nums w-[60px]"
                              style={{ color }}
                            >
                              {formatGap(gap as number)}
                            </span>
                            <span className="text-[13px] text-white">{fullName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
              cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
            />
            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            {driversToDisplay.map((driverCode, index) => {
              const color = driverColor(driverCode, year);
              let teammates: string[] = [];
              Object.values(teamGroups).forEach((drivers) => {
                if (drivers.includes(driverCode)) teammates = drivers;
              });
              const lineStyle = getLineStylesForDriver(driverCode, teammates, index);
              const isFocused = focusedDriver === driverCode;
              const isDimmed = focusedDriver && !isFocused;

              return (
                <Line
                  key={driverCode}
                  type="monotone"
                  dataKey={driverCode}
                  stroke={color}
                  strokeWidth={isFocused ? 3 : lineStyle.strokeWidth}
                  strokeOpacity={isDimmed ? 0.08 : 1}
                  strokeDasharray={lineStyle.strokeDasharray}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 0,
                    fill: color,
                    onMouseEnter: () => setFocusedDriver(driverCode),
                    onMouseLeave: () => setFocusedDriver(null),
                  }}
                  name={driverCode}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Centered legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 border-t border-white/[0.04] pt-3">
        {driversToDisplay.map((driverCode) => {
          const color = driverColor(driverCode, year);
          const isDimmed = focusedDriver && focusedDriver !== driverCode;
          const isFocused = focusedDriver === driverCode;

          return (
            <button
              key={driverCode}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-all"
              style={{ opacity: isDimmed ? 0.2 : 1 }}
              onMouseEnter={() => setFocusedDriver(driverCode)}
              onMouseLeave={() => setFocusedDriver(null)}
              onClick={() => setFocusedDriver(focusedDriver === driverCode ? null : driverCode)}
            >
              <span
                className="inline-block h-[2px] w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                className="text-[11px] font-medium tabular-nums transition-colors"
                style={{ color: isFocused ? color : 'rgba(255,255,255,0.8)' }}
              >
                {driverNameMap.get(driverCode) || driverCode}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GapToLeaderChart;
