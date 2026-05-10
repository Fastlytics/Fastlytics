// knip-ignore
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Analytics01Icon, AlertCircleIcon } from 'hugeicons-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionDrivers, fetchLapTimes, SessionDriver } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { driverColor } from '@/lib/driverColor';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

const inter: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

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
      <div
        className="w-full h-[350px] flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] text-white text-[12px] font-semibold uppercase tracking-widest"
        style={inter}
      >
        Select a driver to view telemetry
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
        <div className="size-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-[350px] rounded-xl border border-red-500/20 bg-red-500/[0.05] flex flex-col items-center justify-center">
        <AlertCircleIcon className="size-10 mb-2 text-red-400" />
        <p className="font-bold uppercase tracking-widest text-sm text-red-400" style={inter}>
          Data Unavailable
        </p>
        <p className="text-[10px] text-white mt-1" style={inter}>
          {(error as Error)?.message || 'Could not fetch telemetry.'}
        </p>
      </div>
    );
  }

  if (Array.isArray(data) && data.length === 0) {
    return (
      <div
        className="w-full h-[350px] rounded-xl border border-white/[0.06] bg-[#0c0c0e] flex items-center justify-center text-white text-[12px] font-semibold uppercase tracking-widest"
        style={inter}
      >
        No data for {selectedDriver}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      {renderChart(data, currentColor, selectedDriver)}
      {renderStats && renderStats(data)}
    </div>
  );
};

const TelemetryChartWrapper = <T,>({
  className,
  title,
  icon: Icon = Analytics01Icon,
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

  const chartTitle =
    title ||
    (selectedDriver
      ? `${selectedDriver} - ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}`
      : 'Select Driver');

  const selectedDriverObj = availableDrivers?.find((d) => d.code === selectedDriver);

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn(
        'bg-[#0c0c0e] border border-white/[0.06] rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-200',
        className
      )}
      style={inter}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span
              className="text-[12px] font-semibold uppercase tracking-wider text-white/80"
              style={inter}
            >
              Telemetry
            </span>
            <h3 className="text-[18px] font-semibold uppercase italic text-white" style={inter}>
              {title}
            </h3>
          </div>
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title,
                subtitle: selectedDriver
                  ? `${selectedDriver} — ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}`
                  : undefined,
                year,
                event,
                session,
                drivers: selectedDriver ? [selectedDriver] : undefined,
              })
            }
            isExporting={isExporting}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Select
            value={selectedDriver}
            onValueChange={(value) => {
              setInternalDriver(value);
              setInternalLap('fastest');
              trackSelection('telemetry_driver', value, { chart: title, year, event, session });
            }}
            disabled={isLoadingDrivers || !availableDrivers}
          >
            <SelectTrigger className="w-[200px] rounded-lg border border-white/[0.08] bg-white/[0.03] text-[13px] font-semibold text-white h-10 focus:ring-red-600">
              <div className="flex items-center gap-2 w-full">
                {(() => {
                  const driver = availableDrivers?.find((d) => d.code === selectedDriver);

                  if (!driver && !selectedDriver)
                    return (
                      <span className="text-white" style={inter}>
                        Select Driver
                      </span>
                    );
                  const displayCode = driver?.code || selectedDriver;
                  const headshot = getDriverImage(displayCode, year);
                  const color = driverColor(displayCode, year);

                  return (
                    <>
                      <div className="relative shrink-0">
                        <Avatar className="size-6 border border-white/[0.08]">
                          <AvatarImage src={headshot} className="object-cover object-top" />
                          <AvatarFallback
                            className="bg-[#1a1a1e] text-[8px] font-bold text-white"
                            style={inter}
                          >
                            {displayCode?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#0c0c0e]"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      <span className="font-semibold truncate" style={inter}>
                        {driver?.name || displayCode}
                      </span>
                    </>
                  );
                })()}
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl text-white max-h-[300px]">
              <SelectGroup>
                <SelectLabel
                  className="text-[12px] font-semibold uppercase tracking-wider text-white/80"
                  style={inter}
                >
                  Select Driver
                </SelectLabel>
                {availableDrivers?.map((driver) => {
                  const color = driverColor(driver.code, year);

                  return (
                    <SelectItem
                      key={driver.code}
                      value={driver.code}
                      className="text-[13px] font-semibold focus:bg-white/[0.06] focus:text-white pl-2"
                      style={inter}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="whitespace-nowrap">{driver.name || driver.code}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={selectedLap.toString()}
            onValueChange={(value) => {
              setInternalLap(value === 'fastest' ? 'fastest' : parseInt(value));
              trackSelection('telemetry_lap', value, { chart: title, year, event, session });
            }}
            disabled={lapOptions.length <= 1}
          >
            <SelectTrigger className="w-[100px] ml-auto rounded-lg border border-white/[0.08] bg-white/[0.03] text-[13px] font-semibold text-white h-10 focus:ring-red-600">
              <div className="flex flex-col items-start leading-none gap-1">
                <span className="text-[8px] text-white/80 uppercase font-semibold" style={inter}>
                  Lap
                </span>
                <span className="font-semibold text-red-400" style={inter}>
                  {selectedLap === 'fastest' ? 'FASTEST' : selectedLap}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl text-white max-h-[200px]">
              <SelectGroup>
                {lapOptions.map((lap) => (
                  <SelectItem
                    key={lap.toString()}
                    value={lap.toString()}
                    className="text-[13px] font-semibold focus:bg-white/[0.06] focus:text-white"
                    style={inter}
                  >
                    {lap === 'fastest' ? 'Fastest' : `Lap ${lap}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

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
  );
};

export { TelemetryChartWrapper };

export default TelemetryChartWrapper;
