import React, { useMemo, useReducer } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionDrivers, fetchLapTimes, SessionDriver } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { driverColor } from '@/lib/driverColor';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { ChartSaveMenu } from '@/components/saved/ChartSaveMenu';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';

interface TelemetryChartWrapperProps<T> {
  className?: string;
  title: string;
  icon?: React.ElementType;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
  queryKey: (driver: string, lap: string | number) => readonly unknown[];
  queryFn: (driver: string, lap: string | number) => Promise<T>;
  queryEnabled?: (driver: string, lap: string | number) => boolean;
  renderChart: (data: T, color: string, selectedDriver: string) => React.ReactNode;
  renderStats?: (data: T) => React.ReactNode;
}

interface TelemetryChartContentProps<T> {
  selectedDriver: string;
  isLoading: boolean;
  error: unknown;
  data: T | undefined;
  currentColor: string;
  renderChart: (data: T, color: string, selectedDriver: string) => React.ReactNode;
  renderStats?: (data: T) => React.ReactNode;
}

const TelemetryChartContent = <T,>({
  selectedDriver,
  isLoading,
  error,
  data,
  currentColor,
  renderChart,
  renderStats,
}: TelemetryChartContentProps<T>) => {
  if (!selectedDriver) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-[13px] text-white/80">
        Select a driver to view telemetry
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/60" />
          <span className="text-[12px] text-white/80">Loading telemetry</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[350px] w-full flex-col items-center justify-center">
        <p className="text-[14px] font-medium text-red-400">Data unavailable</p>
        <p className="mt-1 text-[12px] text-white/80">
          {(error as Error)?.message || 'Could not fetch telemetry.'}
        </p>
      </div>
    );
  }

  if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-[13px] text-white/80">
        No data for {selectedDriver}
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {renderChart(data, currentColor, selectedDriver)}
      {renderStats && renderStats(data)}
    </div>
  );
};

const TelemetryChartWrapper = <T,>({
  className,
  title,
  icon: Icon,
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
  queryKey,
  queryFn,
  queryEnabled,
  renderChart,
  renderStats,
}: TelemetryChartWrapperProps<T>) => {
  const chartVisRef = useChartVisibility({
    chartName: `telemetry_${title.toLowerCase().replace(/\s+/g, '_')}`,
    page: 'race',
    meta: { year, event, session },
  });
  const { trackSelection } = useAnalytics();
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  const [internalDriver, setInternalDriver] = useReducer(
    (_: string, v: string) => v,
    initialDriver
  );
  const [internalLap, setInternalLap] = useReducer(
    (_: string | number, v: string | number) => v,
    lap
  );

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  const selectedDriver = useMemo(() => {
    const codes = availableDrivers?.map((d) => d.code) || [];
    if (internalDriver && codes.includes(internalDriver)) return internalDriver;
    if (codes.length > 0) return codes[0];
    return internalDriver;
  }, [availableDrivers, internalDriver]);

  const selectedLap = internalLap;

  const { data: lapTimesResponse } = useQuery({
    queryKey: ['lapTimes', year, event, session, selectedDriver],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver]),
    enabled: !!year && !!event && !!session && !!selectedDriver,
  });

  const lapOptions = useMemo(() => {
    const lapTimes = lapTimesResponse?.lapComparison;
    if (lapTimes && lapTimes.length > 0) {
      const validLaps = lapTimes.flatMap((lapData) =>
        lapData[selectedDriver] !== null ? [lapData.LapNumber.toString()] : []
      );
      return ['fastest', ...validLaps];
    }
    return ['fastest'];
  }, [lapTimesResponse, selectedDriver]);

  const { data, isLoading, error } = useQuery<T>({
    queryKey: queryKey(selectedDriver, selectedLap),
    queryFn: () => queryFn(selectedDriver, selectedLap),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: queryEnabled
      ? queryEnabled(selectedDriver, selectedLap)
      : !!selectedDriver && !!selectedLap,
  });

  const currentColor = selectedDriver ? driverColor(selectedDriver, year) : '#ef4444';
  const selectedDriverObj = availableDrivers?.find((d) => d.code === selectedDriver);

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn(CARD_CONTAINER, className)}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold text-white">{title}</h3>
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title,
                subtitle: selectedDriver
                  ? `${selectedDriverObj?.name || selectedDriver} — ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}`
                  : undefined,
                year,
                event,
                session,
                drivers: selectedDriver ? [selectedDriver] : undefined,
              })
            }
            isExporting={isExporting}
          />
          <ChartSaveMenu
            chartType={title.toLowerCase().replace(/\s+/g, '_')}
            title={`${title} — ${selectedDriverObj?.name || selectedDriver || 'Driver'} — ${event} ${year}`}
            raceName={`${year} ${event}`}
            chartConfig={{ year, event, session, driver: selectedDriver, lap: selectedLap }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Driver selector */}
          <Select
            value={selectedDriver}
            onValueChange={(value) => {
              setInternalDriver(value);
              setInternalLap('fastest');
              trackSelection('telemetry_driver', value, { chart: title, year, event, session });
            }}
            disabled={isLoadingDrivers || !availableDrivers}
          >
            <SelectTrigger className="h-9 w-[200px] rounded-md border border-white/[0.06] bg-transparent text-[13px] font-medium text-white focus:ring-0 focus:border-white/[0.12]">
              <div className="flex items-center gap-2">
                {selectedDriver && (
                  <>
                    <img
                      src={getDriverImage(selectedDriver, year)}
                      alt=""
                      className="size-5 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                    />
                    <span className="truncate">{selectedDriverObj?.name || selectedDriver}</span>
                  </>
                )}
                {!selectedDriver && <span className="text-white/60">Select driver</span>}
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-[240px] rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl">
              <SelectGroup>
                <SelectLabel className="text-[11px] font-medium text-white/60">Driver</SelectLabel>
                {availableDrivers?.map((driver) => {
                  const driverHeadshot = getDriverImage(driver.code, year);
                  return (
                    <SelectItem
                      key={driver.code}
                      value={driver.code}
                      className="text-[13px] font-medium focus:bg-white/[0.04] focus:text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={driverHeadshot}
                          alt=""
                          className="size-5 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                        />
                        <span>{driver.name || driver.code}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Lap selector */}
          <Select
            value={selectedLap.toString()}
            onValueChange={(value) => {
              setInternalLap(value === 'fastest' ? 'fastest' : parseInt(value));
              trackSelection('telemetry_lap', value, { chart: title, year, event, session });
            }}
            disabled={lapOptions.length <= 1}
          >
            <SelectTrigger
              className={cn(
                'h-9 w-[140px] rounded-md border border-white/[0.06] bg-transparent text-[13px] font-medium focus:ring-0 focus:border-white/[0.12]',
                selectedLap === 'fastest' ? 'text-purple-400' : 'text-white'
              )}
            >
              <span>{selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl max-h-[300px]">
              <SelectGroup>
                {lapOptions.map((lapOpt) => (
                  <SelectItem
                    key={lapOpt.toString()}
                    value={lapOpt.toString()}
                    className={cn(
                      'text-[13px] font-medium focus:bg-white/[0.04] focus:text-white',
                      lapOpt === 'fastest' ? 'text-purple-400' : ''
                    )}
                  >
                    {lapOpt === 'fastest' ? 'Fastest Lap' : `Lap ${lapOpt}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart content */}
      <div className="border-t border-white/[0.04] p-5">
        <TelemetryChartContent
          selectedDriver={selectedDriver}
          isLoading={isLoading}
          error={error}
          data={data}
          currentColor={currentColor}
          renderChart={renderChart}
          renderStats={renderStats}
        />
      </div>
    </div>
  );
};

export { TelemetryChartWrapper };

export default TelemetryChartWrapper;
