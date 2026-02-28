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

  const selectedDriver = internalDriver;
  const selectedLap = internalLap;

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  const { data: lapTimes } = useQuery({
    queryKey: ['lapTimes', year, event, session, selectedDriver],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver]),
    enabled: !!year && !!event && !!session && !!selectedDriver,
  });

  const lapOptions = useMemo(() => {
    if (lapTimes && lapTimes.length > 0) {
      const validLaps = lapTimes
        .filter((lapData) => lapData[selectedDriver] !== null)
        .map((lapData) => lapData.LapNumber.toString());
      return ['fastest', ...validLaps];
    }
    return ['fastest'];
  }, [lapTimes, selectedDriver]);

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
        <div className="w-full h-[350px] flex items-center justify-center bg-gray-900/20 border border-gray-800 text-gray-500 font-mono text-xs uppercase tracking-widest">
          Select a driver to view telemetry
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[350px] flex items-center justify-center bg-gray-900/20 border border-gray-800">
          <LoadingSpinnerF1 />
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="w-full h-[350px] bg-black border border-red-900/50 flex flex-col items-center justify-center text-red-500">
          <AlertCircleIcon className="w-10 h-10 mb-2 opacity-50" />
          <p className="font-bold uppercase tracking-widest text-sm">Data Unavailable</p>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">
            {(error as Error)?.message || 'Could not fetch telemetry.'}
          </p>
        </div>
      );
    }

    if (Array.isArray(data) && data.length === 0) {
      return (
        <div className="w-full h-[350px] bg-black border border-gray-800 flex items-center justify-center text-gray-600 font-mono uppercase text-xs tracking-widest">
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
    <div ref={chartVisRef} className={cn('bg-black border-2 border-gray-800 p-6', className)}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">{title}</h3>

        <div className="flex flex-wrap gap-4">
          <Select
            value={selectedDriver}
            onValueChange={(value) => {
              setInternalDriver(value);
              setInternalLap('fastest');
              trackSelection('telemetry_driver', value, { chart: title, year, event, session });
            }}
            disabled={isLoadingDrivers || !availableDrivers}
          >
            <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white text-xs h-10 rounded-none focus:ring-red-600">
              <div className="flex items-center gap-2 w-full">
                {(() => {
                  const driver = availableDrivers?.find((d) => d.code === selectedDriver);

                  if (!driver && !selectedDriver)
                    return <span className="text-gray-500">Select Driver</span>;
                  const displayCode = driver?.code || selectedDriver;
                  const headshot = getDriverImage(displayCode, year);

                  return (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                        {headshot ? (
                          <img
                            src={headshot}
                            alt={displayCode}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">
                            {displayCode?.[0]}
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold truncate">
                        {driver?.name || displayCode}
                      </span>
                    </>
                  );
                })()}
              </div>
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[300px]">
              <SelectGroup>
                <SelectLabel className="text-xs text-gray-500 uppercase">Select Driver</SelectLabel>
                {availableDrivers?.map((driver) => {
                  const headshot = getDriverImage(driver.code, year);

                  return (
                    <SelectItem
                      key={driver.code}
                      value={driver.code}
                      className="text-xs font-mono focus:bg-gray-900 focus:text-white pl-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                          {headshot ? (
                            <img
                              src={headshot}
                              alt={driver.code}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">
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
            <SelectTrigger className="w-[100px] bg-transparent border-b border-gray-700 text-white text-xs h-10 rounded-none focus:ring-0 focus:border-red-600 hover:bg-gray-900/50 transition-colors px-2">
              <div className="flex flex-col items-start leading-none gap-1">
                <span className="text-[8px] text-gray-500 uppercase font-bold">Lap</span>
                <span className="font-mono font-bold text-red-500">
                  {selectedLap === 'fastest' ? 'FASTEST' : selectedLap}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[200px]">
              <SelectGroup>
                {lapOptions.map((lap) => (
                  <SelectItem
                    key={lap.toString()}
                    value={lap.toString()}
                    className="text-xs font-mono focus:bg-gray-900 focus:text-red-500"
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
