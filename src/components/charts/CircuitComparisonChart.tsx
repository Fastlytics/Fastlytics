// knip-ignore
import React, { useState, useEffect, useMemo, useReducer, useRef } from 'react';
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
import {
  fetchSessionDrivers,
  fetchSectorComparison,
  fetchDriverLapNumbers,
  SessionDriver,
  SectorComparisonData,
  TrackSection,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { cn } from '@/lib/utils';
import { AlertCircleIcon } from 'hugeicons-react';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { areTeammates } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDriverImage } from '@/utils/imageMapping';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

interface DriverSelectorProps {
  label: string;
  driverCode: string;
  selectedLap: string | number;
  onSelectDriver: (v: string) => void;
  onSelectLap: (v: string | number) => void;
  lapOptions: (number | 'fastest')[];
  isLoadingDrivers: boolean;
  isLoadingLaps: boolean;
  otherDriver: string;
  drivers?: SessionDriver[];
  color: string;
  year: number;
  event: string;
  session: string;
}

const DriverSelector: React.FC<DriverSelectorProps> = ({
  label,
  driverCode,
  selectedLap,
  onSelectDriver,
  onSelectLap,
  lapOptions,
  isLoadingDrivers,
  isLoadingLaps,
  otherDriver,
  drivers,
  color,
  year,
  event,
  session,
}) => {
  const { trackSelection } = useAnalytics();
  const headshot = getDriverImage(driverCode, year);
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Avatar className="size-8 shrink-0 border-2" style={{ borderColor: color }}>
            <AvatarImage src={headshot} className="object-cover object-top" />
            <AvatarFallback
              className="bg-[#1a1a1e] text-[10px] font-bold text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {driverCode ? driverCode[0] : '?'}
            </AvatarFallback>
          </Avatar>
          <div
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#0c0c0e]"
            style={{ backgroundColor: color }}
          />
        </div>
        <span
          className="text-[11px] font-semibold uppercase tracking-wider text-white"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {label}
        </span>
      </div>
      <Select
        value={driverCode}
        onValueChange={(value) => {
          onSelectDriver(value);
          onSelectLap('fastest');
          trackSelection(`circuit_driver${label === 'Driver 1' ? '1' : '2'}`, value, {
            year,
            event,
            session,
          });
        }}
        disabled={isLoadingDrivers || !drivers}
      >
        <SelectTrigger
          className="h-10 w-[200px] rounded-lg border border-white/[0.08] bg-white/[0.03] text-[13px] font-semibold text-white transition-colors hover:border-white/[0.12] focus:ring-0 focus:border-white/[0.15]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <SelectValue placeholder="Select driver" />
        </SelectTrigger>
        <SelectContent className="min-w-[220px] rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl">
          <SelectGroup>
            <SelectLabel
              className="text-[11px] font-semibold uppercase tracking-wider text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Drivers
            </SelectLabel>
            {drivers?.map((driver) => {
              const isDisabled = otherDriver === driver.code;
              const dColor = driverColor(driver.code, year);
              return (
                <SelectItem
                  key={`${label}-${driver.code}`}
                  value={driver.code}
                  disabled={isDisabled}
                  className="text-[13px] text-white focus:bg-white/[0.06] focus:text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: dColor }}
                    />
                    <span className="whitespace-nowrap font-medium">
                      {driver.name || driver.code}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="ml-auto">
        <Select
          value={String(selectedLap)}
          onValueChange={(value) => {
            onSelectLap(value === 'fastest' ? 'fastest' : parseInt(value));
            trackSelection(`circuit_lap${label === 'Driver 1' ? '1' : '2'}`, value, {
              year,
              event,
              session,
            });
          }}
          disabled={isLoadingLaps || !driverCode || lapOptions.length <= 1}
        >
          <SelectTrigger
            className="h-10 w-[100px] rounded-lg border border-white/[0.06] bg-white/[0.02] text-[12px] text-white/70 transition-colors hover:border-white/[0.1] focus:ring-0 focus:border-white/[0.12]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-medium uppercase tracking-wider text-white">
                Lap
              </span>
              <span className="font-bold text-white">
                {selectedLap === 'fastest' ? 'Fastest' : selectedLap}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-2xl">
            <SelectGroup>
              {lapOptions.map((lapOpt) => (
                <SelectItem
                  key={`${label}-lap-${lapOpt}`}
                  value={String(lapOpt)}
                  className="text-[12px] text-white focus:bg-white/[0.06] focus:text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {lapOpt === 'fastest' ? 'Fastest' : `Lap ${lapOpt}`}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

interface CircuitComparisonChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver1?: string;
  initialDriver2?: string;
  onDriversSelected?: (data: {
    driver1: string;
    driver2: string;
    lap1: string | number;
    lap2: string | number;
    shouldLoadChart: boolean;
  }) => void;
}

type HoveredSection = {
  name: string;
  advantage: number;
  driver1AvgSpeed?: number;
  driver2AvgSpeed?: number;
  x: number;
  y: number;
};

const CircuitComparisonChart: React.FC<CircuitComparisonChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDriver1 = '',
  initialDriver2 = '',
  onDriversSelected,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  const [userSelectedDriver1, setUserSelectedDriver1] = useState<string | null>(null);
  const [userSelectedDriver2, setUserSelectedDriver2] = useState<string | null>(null);

  const [selectedLap1, setSelectedLap1] = useState<string | number>('fastest');
  const [selectedLap2, setSelectedLap2] = useState<string | number>('fastest');

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  const selectedDriver1 = useMemo(() => {
    if (userSelectedDriver1 !== null) return userSelectedDriver1;
    const codes = availableDrivers?.map((d) => d.code) ?? [];
    if (initialDriver1 && codes.length > 0 && codes.includes(initialDriver1)) return initialDriver1;
    if (initialDriver1 && codes.length === 0) return initialDriver1;
    return availableDrivers?.[0]?.code || '';
  }, [initialDriver1, userSelectedDriver1, availableDrivers]);

  const selectedDriver2 = useMemo(() => {
    if (userSelectedDriver2 !== null) return userSelectedDriver2;
    const codes = availableDrivers?.map((d) => d.code) ?? [];
    if (initialDriver2 && codes.length > 0 && codes.includes(initialDriver2)) return initialDriver2;
    if (initialDriver2 && codes.length === 0) return initialDriver2;
    return availableDrivers?.[1]?.code || '';
  }, [initialDriver2, userSelectedDriver2, availableDrivers]);

  const notify = (d1: string, d2: string, l1: string | number, l2: string | number) => {
    onDriversSelected?.({
      driver1: d1,
      driver2: d2,
      lap1: l1,
      lap2: l2,
      shouldLoadChart: !!(d1 && d2 && d1 !== d2),
    });
  };
  const setSelectedDriver1 = (v: string) => {
    setUserSelectedDriver1(v);
    notify(v, selectedDriver2, selectedLap1, selectedLap2);
  };
  const setSelectedDriver2 = (v: string) => {
    setUserSelectedDriver2(v);
    notify(selectedDriver1, v, selectedLap1, selectedLap2);
  };
  const setLap1 = (v: string | number) => {
    setSelectedLap1(v);
    notify(selectedDriver1, selectedDriver2, v, selectedLap2);
  };
  const setLap2 = (v: string | number) => {
    setSelectedLap2(v);
    notify(selectedDriver1, selectedDriver2, selectedLap1, v);
  };
  useEffect(() => {
    if (!isLoadingDrivers && selectedDriver1 && selectedDriver2) {
      notify(selectedDriver1, selectedDriver2, selectedLap1, selectedLap2);
    }
  }, [isLoadingDrivers]);

  const shouldLoadChart = useMemo(
    () => !!(selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2),
    [selectedDriver1, selectedDriver2]
  );

  const [hoveredSection, setHoveredSection] = useReducer(
    (_: HoveredSection | null, v: HoveredSection | null) => v,
    null as HoveredSection | null
  );

  const handleSectionHover = (e: React.MouseEvent, section: TrackSection, advantage: number) => {
    setHoveredSection({
      name: section.name,
      advantage: advantage,
      driver1AvgSpeed: section.driver1AvgSpeed,
      driver2AvgSpeed: section.driver2AvgSpeed,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleSectionLeave = () => {
    setHoveredSection(null);
  };

  const { data: lapTimes1, isLoading: isLoadingLaps1 } = useQuery<number[]>({
    queryKey: ['driverLapNumbers', year, event, session, selectedDriver1],
    queryFn: () => fetchDriverLapNumbers(year, event, session, selectedDriver1),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver1,
  });

  const { data: lapTimes2, isLoading: isLoadingLaps2 } = useQuery<number[]>({
    queryKey: ['driverLapNumbers', year, event, session, selectedDriver2],
    queryFn: () => fetchDriverLapNumbers(year, event, session, selectedDriver2),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver2,
  });

  const lapOptions1 = useMemo<(number | 'fastest')[]>(
    () => (lapTimes1 && lapTimes1.length > 0 ? ['fastest', ...lapTimes1] : ['fastest']),
    [lapTimes1]
  );

  const lapOptions2 = useMemo<(number | 'fastest')[]>(
    () => (lapTimes2 && lapTimes2.length > 0 ? ['fastest', ...lapTimes2] : ['fastest']),
    [lapTimes2]
  );

  const {
    data: comparisonData,
    isLoading: isLoadingComparison,
    error,
    isError,
  } = useQuery<SectorComparisonData>({
    queryKey: [
      'sectorComparison',
      year,
      event,
      session,
      selectedDriver1,
      selectedDriver2,
      selectedLap1,
      selectedLap2,
    ],
    queryFn: () =>
      fetchSectorComparison(
        year,
        event,
        session,
        selectedDriver1,
        selectedDriver2,
        selectedLap1,
        selectedLap2
      ),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled:
      !!year &&
      !!event &&
      !!session &&
      !!selectedDriver1 &&
      !!selectedDriver2 &&
      selectedDriver1 !== selectedDriver2 &&
      shouldLoadChart,
  });

  const isLoading = isLoadingDrivers || isLoadingComparison || isLoadingLaps1 || isLoadingLaps2;

  const driver1Color = driverColor(selectedDriver1, year);
  let driver2Color = driverColor(selectedDriver2, year);
  const sameTeam =
    selectedDriver1 && selectedDriver2
      ? areTeammates(selectedDriver1, selectedDriver2, year)
      : false;
  if (sameTeam) {
    driver2Color = '#FFFFFF';
  }

  return (
    <div
      ref={(el) => {
        chartRef.current = el;
        exportRef.current = el;
      }}
      className={cn('animate-in fade-in slide-in-from-bottom-2 duration-500', className)}
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p
            className="text-[12px] font-semibold uppercase tracking-wider text-white/80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Head to Head
          </p>
          <p
            className="mt-0.5 text-[18px] font-bold uppercase italic text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {title || 'Track Dominance'}
          </p>
        </div>
        <ChartExportMenu
          onExport={(format) =>
            exportChart(format, {
              title: title || 'Track Dominance',
              subtitle: 'Sector-by-sector comparison between drivers',
              year,
              event,
              session,
              drivers: [selectedDriver1, selectedDriver2].filter(Boolean),
            })
          }
          isExporting={isExporting}
        />
      </div>

      <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="flex flex-col gap-4">
          <DriverSelector
            label="Driver 1"
            driverCode={selectedDriver1}
            selectedLap={selectedLap1}
            onSelectDriver={setSelectedDriver1}
            onSelectLap={setLap1}
            lapOptions={lapOptions1}
            isLoadingDrivers={isLoadingDrivers}
            isLoadingLaps={isLoadingLaps1}
            otherDriver={selectedDriver2}
            drivers={availableDrivers}
            color={driver1Color}
            year={year}
            event={event}
            session={session}
          />
          <DriverSelector
            label="Driver 2"
            driverCode={selectedDriver2}
            selectedLap={selectedLap2}
            onSelectDriver={setSelectedDriver2}
            onSelectLap={setLap2}
            lapOptions={lapOptions2}
            isLoadingDrivers={isLoadingDrivers}
            isLoadingLaps={isLoadingLaps2}
            otherDriver={selectedDriver1}
            drivers={availableDrivers}
            color={driver2Color}
            year={year}
            event={event}
            session={session}
          />
        </div>
      </div>

      <CircuitContent
        shouldLoadChart={shouldLoadChart}
        isLoading={isLoading}
        isError={isError}
        error={error}
        comparisonData={comparisonData}
        selectedDriver1={selectedDriver1}
        selectedDriver2={selectedDriver2}
        driver1Color={driver1Color}
        driver2Color={driver2Color}
        handleSectionHover={handleSectionHover}
        handleSectionLeave={handleSectionLeave}
        hoveredSection={hoveredSection}
        year={year}
      />
    </div>
  );
};

export { CircuitComparisonChart };

interface CircuitContentProps {
  shouldLoadChart: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  comparisonData?: SectorComparisonData;
  selectedDriver1: string;
  selectedDriver2: string;
  driver1Color: string;
  driver2Color: string;
  handleSectionHover: (e: React.MouseEvent, section: TrackSection, advantage: number) => void;
  handleSectionLeave: () => void;
  hoveredSection: HoveredSection | null;
  year: number;
}

const CircuitContent: React.FC<CircuitContentProps> = ({
  shouldLoadChart,
  isLoading,
  isError,
  error,
  comparisonData,
  selectedDriver1,
  selectedDriver2,
  driver1Color,
  driver2Color,
  handleSectionHover,
  handleSectionLeave,
  hoveredSection,
  year,
}) => {
  if (!shouldLoadChart) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
        <p className="text-[13px] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
          Select two different drivers to compare
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
          <p
            className="text-[12px] text-white animate-pulse"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Loading track data…
          </p>
        </div>
      </div>
    );
  }

  if (isError || !comparisonData) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.05]">
        <AlertCircleIcon className="mb-3 size-9 text-red-400" />
        <p
          className="text-[14px] font-semibold text-red-400"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Error loading comparison data
        </p>
        <p className="mt-1 text-[12px] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
          {(error as Error)?.message || 'Could not fetch data.'}
        </p>
      </div>
    );
  }

  return (
    <div className="group/chart relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 pointer-events-none">
        {[
          { code: selectedDriver1, color: driver1Color },
          { code: selectedDriver2, color: driver2Color },
        ].map(({ code, color }) => (
          <div key={code} className="flex items-center gap-2">
            <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span
              className="text-[12px] font-bold text-white/70"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {code}
            </span>
          </div>
        ))}
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Lap {comparisonData.driver1LapNumber}
          </span>
          <span
            className="text-[13px] font-bold text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {comparisonData.driver1LapTime}
          </span>
          <div className="size-2 rounded-full" style={{ backgroundColor: driver1Color }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            Lap {comparisonData.driver2LapNumber}
          </span>
          <span
            className="text-[13px] font-bold text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {comparisonData.driver2LapTime}
          </span>
          <div className="size-2 rounded-full" style={{ backgroundColor: driver2Color }} />
        </div>
      </div>

      <div className="h-[400px] w-full p-4">
        <svg viewBox="0 0 1000 500" className="size-full">
          <g transform="scale(1,-1) translate(0,-500)">
            <path
              d={comparisonData.circuitLayout}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {comparisonData.sections.map((section) => {
              let strokeColor = '#222';
              let advantage = 0;

              if (section.driver1Advantage && section.driver1Advantage > 0) {
                strokeColor = driver1Color;
                advantage = section.driver1Advantage;
              } else if (section.driver1Advantage && section.driver1Advantage < 0) {
                strokeColor = driver2Color;
                advantage = section.driver1Advantage;
              }

              return (
                <path
                  key={section.id}
                  d={section.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cursor-crosshair opacity-85 transition-all duration-300 hover:stroke-[18] hover:opacity-100"
                  onMouseEnter={(e) => handleSectionHover(e, section, advantage)}
                  onMouseLeave={handleSectionLeave}
                  onMouseMove={(e) => handleSectionHover(e, section, advantage)}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {hoveredSection && (
        <div
          className="pointer-events-none fixed z-50 min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-4 shadow-2xl"
          style={{
            left: hoveredSection.x,
            top: hoveredSection.y,
            transform: 'translate(-50%, calc(-100% - 16px))',
          }}
        >
          <div className="flex flex-col gap-3">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Sector
              </p>
              <p
                className="text-[14px] font-bold text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {hoveredSection.name}
              </p>
            </div>

            <div className="h-px w-full bg-white/[0.06]" />

            {[
              {
                code: selectedDriver1,
                color: driver1Color,
                speed: hoveredSection.driver1AvgSpeed,
              },
              {
                code: selectedDriver2,
                color: driver2Color,
                speed: hoveredSection.driver2AvgSpeed,
              },
            ].map(({ code, color, speed }) => (
              <div key={code} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6 shrink-0 border border-white/[0.08]">
                    <AvatarImage
                      src={getDriverImage(code, year)}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="bg-[#1a1a1e] text-[8px] font-bold text-white">
                      {code[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="text-[12px] font-bold text-white/70"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {code}
                  </span>
                </div>
                {speed && (
                  <div className="flex flex-col items-end">
                    <span
                      className="text-[9px] font-medium uppercase tracking-wider text-white"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Avg Speed
                    </span>
                    <span
                      className="text-[12px] font-semibold text-white"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {Math.round(speed)} km/h
                    </span>
                  </div>
                )}
              </div>
            ))}

            <div className="h-px w-full bg-white/[0.06]" />

            <div className="flex items-center gap-2">
              {hoveredSection.advantage !== 0 ? (
                <>
                  <div
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: hoveredSection.advantage > 0 ? driver1Color : driver2Color,
                    }}
                  />
                  <span
                    className="text-[12px] font-bold text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {hoveredSection.advantage > 0 ? selectedDriver1 : selectedDriver2}
                  </span>
                  <span
                    className="text-[12px] font-bold text-red-400"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    -{Math.abs(hoveredSection.advantage).toFixed(3)}s
                  </span>
                </>
              ) : (
                <span
                  className="text-[12px] text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Equal pace
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircuitComparisonChart;
