import React, { useState, useMemo } from 'react';
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
import { UserIcon, Clock01Icon, Analytics01Icon, AlertCircleIcon } from 'hugeicons-react';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionDrivers, fetchLapTimes, SessionDriver } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

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
  // Internal state for driver/lap initialized from props
  const [internalDriver, setInternalDriver] = useState<string>(initialDriver);
  const [internalLap, setInternalLap] = useState<string | number>(lap);

  // Sync internal state if initial prop values change
  React.useEffect(() => {
    if (initialDriver) setInternalDriver(initialDriver);
  }, [initialDriver]);

  React.useEffect(() => {
    if (lap) setInternalLap(lap);
  }, [lap]);

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  // Validate selected driver against the session driver list —
  // fall back to the first available driver when the favourite / initial
  // driver does not exist in this session (e.g. VER not in testing).
  React.useEffect(() => {
    if (!availableDrivers || availableDrivers.length === 0) return;
    const codes = availableDrivers.map((d) => d.code);
    if (internalDriver && !codes.includes(internalDriver)) {
      setInternalDriver(codes[0]);
    } else if (!internalDriver) {
      setInternalDriver(codes[0]);
    }
  }, [availableDrivers, internalDriver]);

  const selectedDriver = internalDriver;
  const selectedLap = internalLap;

  const { data: lapTimesResponse } = useQuery({
    queryKey: ['lapTimes', year, event, session, selectedDriver],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver]),
    enabled: !!year && !!event && !!session && !!selectedDriver,
  });

  const lapOptions = useMemo(() => {
    const lapTimes = lapTimesResponse?.lapComparison;
    if (lapTimes && lapTimes.length > 0) {
      const validLaps = lapTimes
        .filter((lapData) => lapData[selectedDriver] !== null)
        .map((lapData) => lapData.LapNumber.toString());
      return ['fastest', ...validLaps];
    }
    return ['fastest'];
  }, [lapTimesResponse, selectedDriver]);

  // Load Data Hook - useQuery is now called at top level in the wrapper
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

  // Determine Driver Color
  const driverColor = (driverCode: string) => {
    return '#ef4444'; // Default red
  };

  const chartTitle =
    title ||
    (selectedDriver
      ? `${selectedDriver} - ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}`
      : 'Select Driver');

  const renderContent = () => {
    if (!selectedDriver) {
      return (
        <div className="w-full h-[350px] flex items-center justify-center bg-neutral-900/10 border border-neutral-800/30 rounded-xl text-neutral-500 font-mono text-xs tracking-widest uppercase">
          Select a driver to view telemetry
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[350px] flex items-center justify-center bg-neutral-900/10 border border-neutral-800/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin" />
            <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider animate-pulse">Loading telemetry...</span>
          </div>
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="w-full h-[350px] bg-red-500/5 border border-red-500/20 rounded-xl flex flex-col items-center justify-center text-red-400">
          <AlertCircleIcon className="w-8 h-8 mb-2 opacity-60" />
          <p className="font-semibold text-sm">Data Unavailable</p>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            {(error as Error)?.message || 'Could not fetch telemetry.'}
          </p>
        </div>
      );
    }

    if (Array.isArray(data) && data.length === 0) {
      return (
        <div className="w-full h-[350px] bg-neutral-900/10 border border-neutral-800/30 rounded-xl flex items-center justify-center text-neutral-500 font-mono text-xs tracking-widest uppercase">
          No data for {selectedDriver}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full min-w-0">
        {renderChart(data, '#ef4444', selectedDriver)}
        {renderStats && renderStats(data)}
      </div>
    );
  };

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn('bg-neutral-950/80 border border-neutral-800/60 rounded-xl p-5 overflow-hidden', className)}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-neutral-800/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 bg-red-500 rounded-full" />
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-[0.12em]">{title}</h3>
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

        <div className="flex flex-wrap gap-3">
          <Select
            value={selectedDriver}
            onValueChange={(value) => {
              setInternalDriver(value);
              setInternalLap('fastest');
              trackSelection('telemetry_driver', value, { chart: title, year, event, session });
            }}
            disabled={isLoadingDrivers || !availableDrivers}
          >
            <SelectTrigger className="w-[200px] bg-neutral-900 border-neutral-700 text-white text-xs h-9 rounded-md focus:ring-red-500">
              <div className="flex items-center gap-2 w-full">
                {(() => {
                  const driver = availableDrivers?.find((d) => d.code === selectedDriver);

                  if (!driver && !selectedDriver)
                    return <span className="text-neutral-400">Select Driver</span>;
                  const displayCode = driver?.code || selectedDriver;
                  const headshot = getDriverImage(displayCode, year);

                  return (
                    <>
                      <div className="w-5 h-5 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700 shrink-0">
                        {headshot ? (
                          <img
                            src={headshot}
                            alt={displayCode}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-500 font-mono">
                            {displayCode?.[0]}
                          </div>
                        )}
                      </div>
                      <span className="font-medium truncate">
                        {driver?.name || displayCode}
                      </span>
                    </>
                  );
                })()}
              </div>
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-700 text-white rounded-md max-h-[300px]">
              <SelectGroup>
                <SelectLabel className="text-xs text-neutral-400">Select Driver</SelectLabel>
                {availableDrivers?.map((driver) => {
                  const headshot = getDriverImage(driver.code, year);

                  return (
                    <SelectItem
                      key={driver.code}
                      value={driver.code}
                      className="text-xs font-mono focus:bg-neutral-800 focus:text-white pl-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-5 h-5 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700 shrink-0">
                          {headshot ? (
                            <img
                              src={headshot}
                              alt={driver.code}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-500 font-mono">
                              {driver.code[0]}
                            </div>
                          )}
                        </div>
                        <span>{driver.name || driver.code}</span>
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
            <SelectTrigger className="w-[100px] bg-neutral-900 border-neutral-700 text-white text-xs h-9 rounded-md focus:ring-red-500">
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[9px] text-neutral-400 font-medium">Lap</span>
                <span className="font-mono font-semibold text-white text-[11px]">
                  {selectedLap === 'fastest' ? 'Fastest' : selectedLap}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-700 text-white rounded-md max-h-[200px]">
              <SelectGroup>
                {lapOptions.map((lap) => (
                  <SelectItem
                    key={lap.toString()}
                    value={lap.toString()}
                    className="text-xs font-mono focus:bg-neutral-800 focus:text-white"
                  >
                    {lap === 'fastest' ? 'Fastest' : `Lap ${lap}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export { TelemetryChartWrapper };
export default TelemetryChartWrapper;
