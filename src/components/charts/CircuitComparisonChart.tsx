import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { UserIcon, Clock01Icon, Analytics01Icon, AlertCircleIcon } from 'hugeicons-react';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { areTeammates } from '@/lib/teamUtils';
import { Button } from '@/components/ui/button';
import { getDriverImage } from '@/utils/imageMapping';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

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

interface LapTimeInfo {
  lapNumber: number;
  lapTime: string;
  lapTimeRaw: number;
}

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
  const { trackSelection } = useAnalytics();
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

  const setSelectedDriver1 = (value: string) => setUserSelectedDriver1(value);
  const setSelectedDriver2 = (value: string) => setUserSelectedDriver2(value);

  const shouldLoadChart = useMemo(
    () => !!(selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2),
    [selectedDriver1, selectedDriver2]
  );

  // State for hover tooltip
  const [hoveredSection, setHoveredSection] = useState<{
    name: string;
    advantage: number;
    driver1AvgSpeed?: number;
    driver2AvgSpeed?: number;
    x: number;
    y: number;
  } | null>(null);

  const handleSectionHover = (e: React.MouseEvent, section: TrackSection, advantage: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
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

  useEffect(() => {
    if (onDriversSelected) {
      onDriversSelected({
        driver1: selectedDriver1,
        driver2: selectedDriver2,
        lap1: selectedLap1,
        lap2: selectedLap2,
        shouldLoadChart,
      });
    }
  }, [
    selectedDriver1,
    selectedDriver2,
    selectedLap1,
    selectedLap2,
    shouldLoadChart,
    onDriversSelected,
  ]);

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

  const renderContent = () => {
    if (!shouldLoadChart) {
      return (
        <div className="w-full h-[450px] flex flex-col items-center justify-center bg-black border border-neutral-800 gap-4">
          <p className="text-neutral-400 font-mono text-sm uppercase">Select drivers to compare</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[500px] flex items-center justify-center bg-black border border-neutral-800">
          <LoadingSpinnerF1 />
        </div>
      );
    }

    if (isError || !comparisonData) {
      return (
        <div className="w-full h-[500px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500">
          <AlertCircleIcon className="w-10 h-10 mb-2" />
          <p className="font-semibold">Error loading comparison data</p>
          <p className="text-xs text-neutral-500 mt-1">
            {(error as Error)?.message || 'Could not fetch data.'}
          </p>
          {selectedDriver1 === selectedDriver2 && (
            <p className="text-sm text-amber-400 mt-4 font-mono">Select two different drivers.</p>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full h-[400px] bg-neutral-950 border border-neutral-800 rounded-lg p-3 overflow-hidden group/chart">
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver1Color }}></div>
            <span className="text-xs font-black text-neutral-300 font-mono">{selectedDriver1}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver2Color }}></div>
            <span className="text-xs font-black text-neutral-300 font-mono">{selectedDriver2}</span>
          </div>
        </div>

        <svg viewBox="0 0 1000 500" className="w-full h-full">
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
              let strokeColor = '#333';
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
                  className="transition-all duration-200 hover:stroke-[18] hover:opacity-100 cursor-crosshair opacity-90"
                  onMouseEnter={(e) => handleSectionHover(e, section, advantage)}
                  onMouseLeave={handleSectionLeave}
                  onMouseMove={(e) => handleSectionHover(e, section, advantage)}
                />
              );
            })}
          </g>
        </svg>

        {/* Lap Info Overlay */}
        {comparisonData && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-mono text-neutral-500 uppercase">
                Lap {comparisonData.driver1LapNumber}
              </span>
              <span className="text-xs font-mono text-white font-black">
                {comparisonData.driver1LapTime}
              </span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver1Color }} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-mono text-neutral-500 uppercase">
                Lap {comparisonData.driver2LapNumber}
              </span>
              <span className="text-xs font-mono text-white font-black">
                {comparisonData.driver2LapTime}
              </span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver2Color }} />
            </div>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredSection && (
          <div
            className="fixed z-50 bg-neutral-950 border border-neutral-800 rounded-lg p-3 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] min-w-[200px]"
            style={{ left: hoveredSection.x, top: hoveredSection.y }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-wider">
                  Sector
                </span>
                <span className="text-sm font-black text-white font-mono">
                  {hoveredSection.name}
                </span>
              </div>

              <div className="h-px w-full bg-neutral-700" />

              {/* Driver 1 Stats */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-black overflow-hidden border border-neutral-800 shrink-0">
                    {(() => {
                      const headshot = getDriverImage(selectedDriver1, year);
                      return headshot ? (
                        <img
                          src={headshot}
                          alt={selectedDriver1}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-500 font-mono">
                          {selectedDriver1[0]}
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-xs font-mono text-neutral-300 font-black">
                    {selectedDriver1}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {hoveredSection.driver1AvgSpeed && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-neutral-500 uppercase font-mono">
                        Avg Speed
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {Math.round(hoveredSection.driver1AvgSpeed)} km/h
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver 2 Stats */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-black overflow-hidden border border-neutral-800 shrink-0">
                    {(() => {
                      const headshot = getDriverImage(selectedDriver2, year);
                      return headshot ? (
                        <img
                          src={headshot}
                          alt={selectedDriver2}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-500 font-mono">
                          {selectedDriver2[0]}
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-xs font-mono text-neutral-300 font-black">
                    {selectedDriver2}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {hoveredSection.driver2AvgSpeed && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-neutral-500 uppercase font-mono">
                        Avg Speed
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {Math.round(hoveredSection.driver2AvgSpeed)} km/h
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-neutral-700" />

              <div className="flex items-center gap-2">
                {hoveredSection.advantage !== 0 ? (
                  <>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: hoveredSection.advantage > 0 ? driver1Color : driver2Color,
                      }}
                    />
                    <span className="text-xs font-mono text-white">
                      {hoveredSection.advantage > 0 ? selectedDriver1 : selectedDriver2}
                    </span>
                    <span className="text-xs font-mono text-red-500 font-black">
                      -{Math.abs(hoveredSection.advantage).toFixed(3)}s
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-mono text-neutral-400">Equal Pace</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={(el) => {
        chartRef.current = el;
        exportRef.current = el;
      }}
      className={cn('bg-neutral-950 border border-neutral-800 rounded-lg p-5', className)}
    >
      <div className="flex flex-col gap-6 mb-6 border-b border-neutral-800 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            {title || 'Track Dominance'}
          </h3>
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

        {/* Driver Selection Area */}
        <div className="flex flex-col gap-4">
          {/* Driver 1 Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-neutral-400 uppercase w-16">Driver 1</span>
            <Select
              value={selectedDriver1}
              onValueChange={(value) => {
                setSelectedDriver1(value);
                setSelectedLap1('fastest');
                trackSelection('circuit_driver1', value, { year, event, session });
              }}
              disabled={isLoadingDrivers || !availableDrivers}
            >
              <SelectTrigger className="w-[200px] bg-black border-neutral-800 text-white text-xs h-10 rounded-md focus:ring-red-600">
                <div className="flex items-center gap-2 w-full">
                  {(() => {
                    const driver = availableDrivers?.find((d) => d.code === selectedDriver1);
                    const headshot = getDriverImage(selectedDriver1, year);
                    const color = driverColor(selectedDriver1, year);

                    if (!driver) return <span className="text-neutral-500">Select Driver</span>;

                    return (
                      <>
                        <div className="w-6 h-6 rounded-full bg-black overflow-hidden border border-neutral-800 shrink-0">
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
                        <span className="font-mono font-black truncate">
                          {driver.name || driver.code}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full ml-auto"
                          style={{ backgroundColor: color }}
                        ></div>
                      </>
                    );
                  })()}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-neutral-800 text-white rounded-md max-h-[300px]">
                <SelectGroup>
                  <SelectLabel className="text-xs text-neutral-500 uppercase">
                    Select Driver
                  </SelectLabel>
                  {availableDrivers?.map((driver) => {
                    const isDisabled = selectedDriver2 === driver.code;
                    const headshot = getDriverImage(driver.code, year);
                    const color = driverColor(driver.code, year);

                    return (
                      <SelectItem
                        key={`d1-${driver.code}`}
                        value={driver.code}
                        disabled={isDisabled}
                        className="text-xs font-mono focus:bg-neutral-900 focus:text-white pl-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-6 h-6 rounded-full bg-black overflow-hidden border border-neutral-800 shrink-0">
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
                          <div
                            className="w-2 h-2 rounded-full ml-auto"
                            style={{ backgroundColor: color }}
                          ></div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={String(selectedLap1)}
              onValueChange={(value) => {
                setSelectedLap1(value === 'fastest' ? 'fastest' : parseInt(value));
                trackSelection('circuit_lap1', value, { year, event, session });
              }}
              disabled={isLoadingLaps1 || !selectedDriver1 || lapOptions1.length <= 1}
            >
              <SelectTrigger className="w-[100px] bg-transparent border-b border-neutral-800 text-white text-xs h-10 rounded-md focus:ring-0 focus:border-red-600 hover:bg-neutral-900/50 transition-colors ml-auto px-2">
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[8px] text-neutral-500 uppercase font-black">Lap</span>
                  <span className="font-mono font-black text-red-500">
                    {selectedLap1 === 'fastest' ? 'FASTEST' : selectedLap1}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-neutral-800 text-white rounded-md max-h-[200px]">
                <SelectGroup>
                  {lapOptions1.map((lapOpt) => (
                    <SelectItem
                      key={`d1-lap-${lapOpt}`}
                      value={String(lapOpt)}
                      className="text-xs font-mono focus:bg-neutral-900 focus:text-red-500"
                    >
                      {lapOpt === 'fastest' ? 'Fastest' : `Lap ${lapOpt}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Driver 2 Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-neutral-400 uppercase w-16">Driver 2</span>
            <Select
              value={selectedDriver2}
              onValueChange={(value) => {
                setSelectedDriver2(value);
                setSelectedLap2('fastest');
                trackSelection('circuit_driver2', value, { year, event, session });
              }}
              disabled={isLoadingDrivers || !availableDrivers}
            >
              <SelectTrigger className="w-[200px] bg-black border-neutral-800 text-white text-xs h-10 rounded-md focus:ring-red-600">
                <div className="flex items-center gap-2 w-full">
                  {(() => {
                    const driver = availableDrivers?.find((d) => d.code === selectedDriver2);
                    const headshot = getDriverImage(selectedDriver2, year);
                    const color = driverColor(selectedDriver2, year);

                    if (!driver) return <span className="text-neutral-500">Select Driver</span>;

                    return (
                      <>
                        <div className="w-6 h-6 rounded-full bg-black overflow-hidden border border-neutral-800 shrink-0">
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
                        <span className="font-mono font-black truncate">
                          {driver.name || driver.code}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full ml-auto"
                          style={{ backgroundColor: color }}
                        ></div>
                      </>
                    );
                  })()}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-neutral-800 text-white rounded-md max-h-[300px]">
                <SelectGroup>
                  <SelectLabel className="text-xs text-neutral-500 uppercase">
                    Select Driver
                  </SelectLabel>
                  {availableDrivers?.map((driver) => {
                    const isDisabled = selectedDriver1 === driver.code;
                    const headshot = getDriverImage(driver.code, year);
                    const color = driverColor(driver.code, year);

                    return (
                      <SelectItem
                        key={`d2-${driver.code}`}
                        value={driver.code}
                        disabled={isDisabled}
                        className="text-xs font-mono focus:bg-neutral-900 focus:text-white pl-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-6 h-6 rounded-full bg-black overflow-hidden border border-neutral-800 shrink-0">
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
                          <div
                            className="w-2 h-2 rounded-full ml-auto"
                            style={{ backgroundColor: color }}
                          ></div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={String(selectedLap2)}
              onValueChange={(value) => {
                setSelectedLap2(value === 'fastest' ? 'fastest' : parseInt(value));
                trackSelection('circuit_lap2', value, { year, event, session });
              }}
              disabled={isLoadingLaps2 || !selectedDriver2 || lapOptions2.length <= 1}
            >
              <SelectTrigger className="w-[100px] bg-transparent border-b border-neutral-800 text-white text-xs h-10 rounded-md focus:ring-0 focus:border-red-600 hover:bg-neutral-900/50 transition-colors ml-auto px-2">
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[8px] text-neutral-500 uppercase font-black">Lap</span>
                  <span className="font-mono font-black text-red-500">
                    {selectedLap2 === 'fastest' ? 'FASTEST' : selectedLap2}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-neutral-800 text-white rounded-md max-h-[200px]">
                <SelectGroup>
                  {lapOptions2.map((lapOpt) => (
                    <SelectItem
                      key={`d2-lap-${lapOpt}`}
                      value={String(lapOpt)}
                      className="text-xs font-mono focus:bg-neutral-900 focus:text-red-500"
                    >
                      {lapOpt === 'fastest' ? 'Fastest' : `Lap ${lapOpt}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export { CircuitComparisonChart };
export default CircuitComparisonChart;
