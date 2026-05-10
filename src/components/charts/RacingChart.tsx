// knip-ignore
import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LapTimeDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { InformationCircleIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { useLapChartData, MIN_DRIVERS } from '@/hooks/useLapChartData';
import { ChartStateDisplay } from '@/components/charts/shared/ChartStateDisplay';
import { DriverMultiSelect } from '@/components/charts/shared/DriverMultiSelect';
import { ChartLoadPrompt } from '@/components/charts/shared/ChartLoadPrompt';
import {
  FastestLapStat,
  RacingDriverLapPanels,
  RacingFastestLapsTable,
  RacingLapTimeChart,
  RacingWeatherBanner,
} from '@/components/charts/RacingChartSections';

const inter = { fontFamily: "'Inter', sans-serif" } as const;
const TOTAL_FUEL_KG = 110;
const FUEL_PER_LAP_KG = 1.8;
const SECONDS_PER_KG_PER_LAP = 0.03;

interface RacingChartProps {
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

const RacingChart: React.FC<RacingChartProps> = ({
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
  const [fuelCorrectionEnabled, setFuelCorrectionEnabled] = useState(false);
  const [isDriverPopoverOpen, setIsDriverPopoverOpen] = useState(false);

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
    lapData: rawLapData,
    isLoadingLapTimes,
    error,
    isError,
    isLoading,
    toggleDriver,
    trackInteraction,
    enrichedResponse,
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
    chartName: 'lap_time_chart',
  });

  const weatherData = enrichedResponse?.weather;
  const driverLapDetails = enrichedResponse?.driverLapDetails;

  const correctedLapData = useMemo(() => {
    if (!rawLapData || !fuelCorrectionEnabled) return rawLapData;
    const maxLapForCorrection = Math.ceil(rawLapData.length * 0.6);
    return rawLapData.map((point) => {
      const lapNumber = point.LapNumber;
      if (lapNumber > maxLapForCorrection) return point;
      const fuelLoad = TOTAL_FUEL_KG - lapNumber * FUEL_PER_LAP_KG;
      const correctionAmount = fuelLoad * SECONDS_PER_KG_PER_LAP;
      const correctedPoint = { ...point };
      Object.keys(point).forEach((key) => {
        if (key !== 'LapNumber' && typeof point[key] === 'number') {
          correctedPoint[key as keyof LapTimeDataPoint] =
            (point[key as keyof LapTimeDataPoint] as number) - correctionAmount;
        }
      });
      return correctedPoint;
    });
  }, [rawLapData, fuelCorrectionEnabled]);

  const chartData = correctedLapData;

  const fastestLaps = useMemo<FastestLapStat[]>(() => {
    if (!chartData || chartData.length === 0) return [];
    const stats = driversToDisplay.map((driver) => {
      let minTime = Infinity;
      let lapNum = -1;
      chartData.forEach((point) => {
        const time = point[driver] as number | null;
        if (time !== null && time < minTime) {
          minTime = time;
          lapNum = point.LapNumber;
        }
      });
      return { driver, fastestTime: minTime === Infinity ? null : minTime, lapNumber: lapNum };
    });
    return stats.sort((a, b) => {
      if (a.fastestTime === null) return 1;
      if (b.fastestTime === null) return -1;
      return a.fastestTime - b.fastestTime;
    });
  }, [chartData, driversToDisplay]);

  const availableDriverCodes = availableDrivers?.map((driver) => driver.code) || [];

  const handleSelectAllDrivers = () => {
    trackInteraction('select_all_drivers', {
      chart: 'lap_time',
      year,
      event,
      session,
    });
    setSelectedDrivers(availableDriverCodes);
  };

  const handleResetDrivers = () => {
    trackInteraction('deselect_all_drivers', {
      chart: 'lap_time',
      year,
      event,
      session,
    });
    setSelectedDrivers(availableDriverCodes.slice(0, MIN_DRIVERS));
  };

  const chartStatus: ChartStatus =
    !shouldLoadChart && !staticData
      ? 'idle'
      : isLoading
        ? 'loading'
        : isError || !chartData
          ? 'error'
          : chartData.length === 0
            ? 'empty'
            : 'ready';

  return (
    <div
      ref={(el) => {
        chartRef.current = el;
        chartVisRef.current = el;
        exportRef.current = el;
      }}
      className={cn('space-y-6 relative', className)}
      style={{ animationDelay: `${delay * 100}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3">
            <ChartExportMenu
              onExport={(format) =>
                exportChart(format, {
                  title: 'Lap Times',
                  subtitle: fuelCorrectionEnabled
                    ? 'Fuel-corrected lap times'
                    : 'Raw lap times comparison',
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
                onSelectAll={handleSelectAllDrivers}
                onSelectNone={handleResetDrivers}
                onDriverFocus={setFocusedDriver}
                isOpen={isDriverPopoverOpen}
                onOpenChange={setIsDriverPopoverOpen}
                selectNoneLabel="Reset"
                triggerLabel={
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06] hover:text-white transition-all text-[11px] font-semibold uppercase tracking-wider w-fit">
                    <span>
                      {selectedDrivers.length === availableDriverCodes.length
                        ? 'All Drivers'
                        : `${selectedDrivers.length} / ${availableDriverCodes.length} Selected`}
                    </span>
                    <span className="size-3.5 opacity-50">↕</span>
                  </button>
                }
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
            Fuel
          </span>
          <Switch
            checked={fuelCorrectionEnabled}
            onCheckedChange={(checked) => {
              trackInteraction('fuel_correction_toggled', {
                enabled: checked,
                chart: 'lap_time',
                year,
                event,
                session,
              });
              setFuelCorrectionEnabled(checked);
            }}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 text-white hover:text-white hover:bg-white/[0.06]"
              >
                <InformationCircleIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl"
              style={inter}
            >
              <div className="space-y-2">
                <div className="font-bold text-white uppercase text-[12px] tracking-wider">
                  Fuel Correction
                </div>
                <div className="text-[12px] space-y-1 text-white">
                  <p>Applies correction for fuel weight (0.03s per kg)</p>
                  <p className="text-white">
                    Total fuel: {TOTAL_FUEL_KG}kg, burns ~{FUEL_PER_LAP_KG}kg/lap
                  </p>
                  <p className="text-white">Applied to first 60% of laps only</p>
                  <p className="text-white mt-2 italic">
                    Formula: corrected = raw - (fuelLoad × 0.03)
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <RacingChartContent
        status={chartStatus}
        error={error}
        staticData={staticData}
        selectedDrivers={selectedDrivers}
        isLoadingDrivers={isLoadingDrivers}
        setShouldLoadChart={setShouldLoadChart}
        trackInteraction={trackInteraction}
        year={year}
        event={event}
        session={session}
        chartData={chartData}
        driversToDisplay={driversToDisplay}
        driverNameMap={driverNameMap}
        driverLapDetails={driverLapDetails}
        focusedDriver={focusedDriver}
        setFocusedDriver={setFocusedDriver}
        weatherData={weatherData}
        fastestLaps={fastestLaps}
      />
    </div>
  );
};

export { RacingChart };
type ChartStatus = 'idle' | 'loading' | 'error' | 'empty' | 'ready';

interface RacingChartContentProps {
  status: ChartStatus;
  error: unknown;
  staticData?: LapTimeDataPoint[];
  selectedDrivers: string[];
  isLoadingDrivers: boolean;
  setShouldLoadChart: (value: boolean) => void;
  trackInteraction: (name: string, meta: Record<string, unknown>) => void;
  year: number;
  event: string;
  session: string;
  chartData?: LapTimeDataPoint[];
  driversToDisplay: string[];
  driverNameMap: Map<string, string>;
  driverLapDetails?: Record<string, import('@/lib/api').EnrichedLapRecord[]>;
  focusedDriver: string | null;
  setFocusedDriver: (driver: string | null) => void;
  weatherData: import('@/lib/api').WeatherSummary | null | undefined;
  fastestLaps: FastestLapStat[];
}

const RacingChartContent: React.FC<RacingChartContentProps> = ({
  status,
  error,
  staticData,
  selectedDrivers,
  isLoadingDrivers,
  setShouldLoadChart,
  trackInteraction,
  year,
  event,
  session,
  chartData,
  driversToDisplay,
  driverNameMap,
  driverLapDetails,
  focusedDriver,
  setFocusedDriver,
  weatherData,
  fastestLaps,
}) => {
  if (status === 'idle' && !staticData) {
    return (
      <ChartLoadPrompt
        message="Select drivers to compare"
        disabled={selectedDrivers.length < MIN_DRIVERS || isLoadingDrivers}
        onLoad={() => {
          trackInteraction('chart_data_loaded', { chart: 'lap_time', year, event, session });
          setShouldLoadChart(true);
        }}
      />
    );
  }

  if (status === 'loading') {
    return (
      <div className="w-full h-[300px] flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <LoadingSpinnerF1 />
      </div>
    );
  }
  if (status === 'error' || !chartData) {
    return (
      <ChartStateDisplay
        isError
        height={300}
        errorMessage={
          typeof (error as Error)?.message === 'string'
            ? (error as Error).message
            : 'Error loading lap times'
        }
        onRetry={!staticData ? () => setShouldLoadChart(false) : undefined}
        retryLabel="Back"
      />
    );
  }
  if (status === 'empty') {
    return (
      <ChartStateDisplay
        isEmpty
        height={300}
        emptyMessage="No common lap data found."
        onBack={!staticData ? () => setShouldLoadChart(false) : undefined}
      />
    );
  }

  return (
    <>
      <RacingLapTimeChart
        chartData={chartData}
        driversToDisplay={driversToDisplay}
        driverNameMap={driverNameMap}
        driverLapDetails={driverLapDetails}
        focusedDriver={focusedDriver}
        setFocusedDriver={setFocusedDriver}
        trackInteraction={trackInteraction}
        year={year}
        event={event}
        session={session}
      />
      <RacingWeatherBanner weatherData={weatherData ?? null} />
      <RacingFastestLapsTable
        fastestLaps={fastestLaps}
        driverLapDetails={driverLapDetails}
        year={year}
      />
      <RacingDriverLapPanels
        driversToDisplay={driversToDisplay}
        driverLapDetails={driverLapDetails}
        year={year}
      />
    </>
  );
};

export default RacingChart;
