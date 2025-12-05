import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { fetchSessionDrivers, fetchSectorComparison, fetchDriverLapNumbers, SessionDriver, SectorComparisonData } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { cn } from "@/lib/utils";
import { UserIcon, Clock01Icon, Analytics01Icon, AlertCircleIcon } from 'hugeicons-react';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { areTeammates } from '@/lib/teamUtils';
import { Button } from '@/components/ui/button';
import { OpenF1Driver } from '@/lib/openf1';

interface CircuitComparisonChartProps {
  className?: string;
  delay?: number;
  title?: string;
  year: number;
  event: string;
  session: string;
  initialDriver1?: string;
  initialDriver2?: string;
  onDriversSelected?: (data: { driver1: string, driver2: string, lap1: string | number, lap2: string | number, shouldLoadChart: boolean }) => void;
  openF1Drivers?: OpenF1Driver[];
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
  openF1Drivers = []
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const [selectedDriver1, setSelectedDriver1] = useState<string>(initialDriver1);
  const [selectedDriver2, setSelectedDriver2] = useState<string>(initialDriver2);
  const [selectedLap1, setSelectedLap1] = useState<string | number>('fastest');
  const [selectedLap2, setSelectedLap2] = useState<string | number>('fastest');
  const [shouldLoadChart, setShouldLoadChart] = useState(!!initialDriver1 && !!initialDriver2);

  // State for hover tooltip
  const [hoveredSection, setHoveredSection] = useState<{
    name: string;
    advantage: number;
    driver1AvgSpeed?: number;
    driver2AvgSpeed?: number;
    x: number;
    y: number;
  } | null>(null);

  const handleSectionHover = (e: React.MouseEvent, section: any, advantage: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredSection({
      name: section.name,
      advantage: advantage,
      driver1AvgSpeed: section.driver1AvgSpeed,
      driver2AvgSpeed: section.driver2AvgSpeed,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleSectionLeave = () => {
    setHoveredSection(null);
  };

  // Update shouldLoadChart when drivers are selected
  useEffect(() => {
    if (selectedDriver1 && selectedDriver2 && selectedDriver1 !== selectedDriver2) {
      setShouldLoadChart(true);
    }
  }, [selectedDriver1, selectedDriver2]);

  useEffect(() => {
    if (onDriversSelected) {
      onDriversSelected({
        driver1: selectedDriver1,
        driver2: selectedDriver2,
        lap1: selectedLap1,
        lap2: selectedLap2,
        shouldLoadChart
      });
    }
  }, [selectedDriver1, selectedDriver2, selectedLap1, selectedLap2, shouldLoadChart, onDriversSelected]);

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity, gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  // Set initial drivers if not provided and available
  useEffect(() => {
    if (!initialDriver1 && !initialDriver2 && availableDrivers && availableDrivers.length >= 2) {
      setSelectedDriver1(availableDrivers[0]?.code || "");
      setSelectedDriver2(availableDrivers[1]?.code || "");
      setSelectedLap1('fastest');
      setSelectedLap2('fastest');
    }
  }, [availableDrivers, initialDriver1, initialDriver2]);

  // Update local state if props change
  useEffect(() => {
    if (initialDriver1) setSelectedDriver1(initialDriver1);
    if (initialDriver2) setSelectedDriver2(initialDriver2);
  }, [initialDriver1, initialDriver2]);


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

  const [lapOptions1, setLapOptions1] = useState<(number | 'fastest')[]>(['fastest']);
  const [lapOptions2, setLapOptions2] = useState<(number | 'fastest')[]>(['fastest']);

  useEffect(() => {
    if (lapTimes1 && lapTimes1.length > 0) {
      setLapOptions1(['fastest', ...lapTimes1]);
    } else {
      setLapOptions1(['fastest']);
    }
    if (selectedDriver1 && lapTimes1 !== undefined && selectedLap1 !== 'fastest') {
      setSelectedLap1('fastest');
    }
  }, [lapTimes1, selectedDriver1]);

  useEffect(() => {
    if (lapTimes2 && lapTimes2.length > 0) {
      setLapOptions2(['fastest', ...lapTimes2]);
    } else {
      setLapOptions2(['fastest']);
    }
    if (selectedDriver2 && lapTimes2 !== undefined && selectedLap2 !== 'fastest') {
      setSelectedLap2('fastest');
    }
  }, [lapTimes2, selectedDriver2]);

  const { data: comparisonData, isLoading: isLoadingComparison, error, isError } = useQuery<SectorComparisonData>({
    queryKey: ['sectorComparison', year, event, session, selectedDriver1, selectedDriver2, selectedLap1, selectedLap2],
    queryFn: () => fetchSectorComparison(year, event, session, selectedDriver1, selectedDriver2, selectedLap1, selectedLap2),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver1 && !!selectedDriver2 && selectedDriver1 !== selectedDriver2 && shouldLoadChart,
  });

  const isLoading = isLoadingDrivers || isLoadingComparison || isLoadingLaps1 || isLoadingLaps2;

  let driver1Color = driverColor(selectedDriver1, year);
  let driver2Color = driverColor(selectedDriver2, year);
  const sameTeam = selectedDriver1 && selectedDriver2 ? areTeammates(selectedDriver1, selectedDriver2, year) : false;
  if (sameTeam) {
    driver2Color = '#FFFFFF';
  }

  const renderContent = () => {
    if (!shouldLoadChart) {
      return (
        <div className="w-full h-[450px] flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 gap-4">
          <p className="text-gray-400 font-mono text-sm uppercase">Select drivers to compare</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="w-full h-[500px] flex items-center justify-center bg-gray-900/50 border border-gray-800">
          <LoadingSpinnerF1 />
        </div>
      );
    }

    if (isError || !comparisonData) {
      return (
        <div className="w-full h-[500px] bg-black border border-red-600 flex flex-col items-center justify-center text-red-500">
          <AlertCircleIcon className="w-10 h-10 mb-2" />
          <p className="font-bold uppercase">Error loading comparison data</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
          {selectedDriver1 === selectedDriver2 && (
            <p className="text-sm text-amber-400 mt-4 font-mono">Select two different drivers.</p>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full h-[400px] bg-black border border-gray-800 p-4 overflow-hidden group/chart">
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver1Color }}></div>
            <span className="text-xs font-bold text-gray-300 font-mono">{selectedDriver1}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver2Color }}></div>
            <span className="text-xs font-bold text-gray-300 font-mono">{selectedDriver2}</span>
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
              let strokeColor = "#333";
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
              <span className="text-xs font-mono text-gray-500 uppercase">Lap {comparisonData.driver1LapNumber}</span>
              <span className="text-xs font-mono text-white font-bold">{comparisonData.driver1LapTime}</span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver1Color }} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-mono text-gray-500 uppercase">Lap {comparisonData.driver2LapNumber}</span>
              <span className="text-xs font-mono text-white font-bold">{comparisonData.driver2LapTime}</span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver2Color }} />
            </div>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredSection && (
          <div
            className="fixed z-50 bg-black/95 border border-gray-700 p-4 rounded-none shadow-2xl backdrop-blur-md pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] min-w-[200px]"
            style={{ left: hoveredSection.x, top: hoveredSection.y }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Sector</span>
                <span className="text-sm font-bold text-white font-mono">{hoveredSection.name}</span>
              </div>

              <div className="h-px w-full bg-gray-800" />

              {/* Driver 1 Stats */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                    {(() => {
                      const openF1Driver = openF1Drivers.find(d => d.name_acronym === selectedDriver1 || d.last_name.toUpperCase().slice(0, 3) === selectedDriver1);
                      return openF1Driver?.headshot_url ? (
                        <img src={openF1Driver.headshot_url} alt={selectedDriver1} className="w-full h-full object-cover scale-125 translate-y-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{selectedDriver1[0]}</div>
                      );
                    })()}
                  </div>
                  <span className="text-xs font-mono text-gray-300 font-bold">{selectedDriver1}</span>
                </div>
                <div className="flex flex-col items-end">
                  {hoveredSection.driver1AvgSpeed && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-gray-500 uppercase font-mono">Avg Speed</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {Math.round(hoveredSection.driver1AvgSpeed)} km/h
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver 2 Stats */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                    {(() => {
                      const openF1Driver = openF1Drivers.find(d => d.name_acronym === selectedDriver2 || d.last_name.toUpperCase().slice(0, 3) === selectedDriver2);
                      return openF1Driver?.headshot_url ? (
                        <img src={openF1Driver.headshot_url} alt={selectedDriver2} className="w-full h-full object-cover scale-125 translate-y-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{selectedDriver2[0]}</div>
                      );
                    })()}
                  </div>
                  <span className="text-xs font-mono text-gray-300 font-bold">{selectedDriver2}</span>
                </div>
                <div className="flex flex-col items-end">
                  {hoveredSection.driver2AvgSpeed && (
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-gray-500 uppercase font-mono">Avg Speed</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {Math.round(hoveredSection.driver2AvgSpeed)} km/h
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-gray-800" />

              <div className="flex items-center gap-2">
                {hoveredSection.advantage !== 0 ? (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredSection.advantage > 0 ? driver1Color : driver2Color }} />
                    <span className="text-xs font-mono text-white">
                      {hoveredSection.advantage > 0 ? selectedDriver1 : selectedDriver2}
                    </span>
                    <span className="text-xs font-mono text-red-500 font-bold">
                      -{Math.abs(hoveredSection.advantage).toFixed(3)}s
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-mono text-gray-400">Equal Pace</span>
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
      ref={chartRef}
      className={cn("bg-black border-2 border-gray-800 p-6", className)}
    >
      <div className="flex flex-col gap-6 mb-6 border-b border-gray-800 pb-4">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
          {title || "Track Dominance"}
        </h3>

        {/* Driver Selection Area */}
        <div className="flex flex-col gap-4">
          {/* Driver 1 Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-500 uppercase w-16">Driver 1</span>
            <Select
              value={selectedDriver1}
              onValueChange={(value) => {
                setSelectedDriver1(value);
                setSelectedLap1('fastest');
                if (shouldLoadChart) setShouldLoadChart(false);
              }}
              disabled={isLoadingDrivers || !availableDrivers}
            >
              <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white text-xs h-10 rounded-none focus:ring-red-600">
                <div className="flex items-center gap-2 w-full">
                  {(() => {
                    const driver = availableDrivers?.find(d => d.code === selectedDriver1);
                    const openF1Driver = openF1Drivers.find(d => d.name_acronym === selectedDriver1 || d.last_name.toUpperCase().slice(0, 3) === selectedDriver1);
                    const color = driverColor(selectedDriver1, year);

                    if (!driver) return <span className="text-gray-500">Select Driver</span>;

                    return (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                          {openF1Driver?.headshot_url ? (
                            <img src={openF1Driver.headshot_url} alt={driver.code} className="w-full h-full object-cover scale-125 translate-y-1" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{driver.code[0]}</div>
                          )}
                        </div>
                        <span className="font-mono font-bold truncate">
                          {openF1Driver ? `${openF1Driver.first_name[0]}. ${openF1Driver.last_name}` : driver.code}
                        </span>
                        <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: color }}></div>
                      </>
                    );
                  })()}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[300px]">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase">Select Driver</SelectLabel>
                  {availableDrivers?.map((driver) => {
                    const isDisabled = selectedDriver2 === driver.code;
                    const openF1Driver = openF1Drivers.find(d => d.name_acronym === driver.code || d.last_name.toUpperCase().slice(0, 3) === driver.code);
                    const color = driverColor(driver.code, year);

                    return (
                      <SelectItem
                        key={`d1-${driver.code}`}
                        value={driver.code}
                        disabled={isDisabled}
                        className="text-xs font-mono focus:bg-gray-900 focus:text-white pl-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                            {openF1Driver?.headshot_url ? (
                              <img src={openF1Driver.headshot_url} alt={driver.code} className="w-full h-full object-cover scale-125 translate-y-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{driver.code[0]}</div>
                            )}
                          </div>
                          <span>
                            {openF1Driver ? `${openF1Driver.first_name[0]}. ${openF1Driver.last_name}` : driver.code}
                          </span>
                          <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: color }}></div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={String(selectedLap1)}
              onValueChange={(value) => setSelectedLap1(value === 'fastest' ? 'fastest' : parseInt(value))}
              disabled={isLoadingLaps1 || !selectedDriver1 || lapOptions1.length <= 1}
            >
              <SelectTrigger className="w-[100px] bg-transparent border-b border-gray-700 text-white text-xs h-10 rounded-none focus:ring-0 focus:border-red-600 hover:bg-gray-900/50 transition-colors ml-auto px-2">
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[8px] text-gray-500 uppercase font-bold">Lap</span>
                  <span className="font-mono font-bold text-red-500">{selectedLap1 === 'fastest' ? 'FASTEST' : selectedLap1}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[200px]">
                <SelectGroup>
                  {lapOptions1.map((lapOpt) => (
                    <SelectItem key={`d1-lap-${lapOpt}`} value={String(lapOpt)} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
                      {lapOpt === 'fastest' ? 'Fastest' : `Lap ${lapOpt}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Driver 2 Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-500 uppercase w-16">Driver 2</span>
            <Select
              value={selectedDriver2}
              onValueChange={(value) => {
                setSelectedDriver2(value);
                setSelectedLap2('fastest');
                if (shouldLoadChart) setShouldLoadChart(false);
              }}
              disabled={isLoadingDrivers || !availableDrivers}
            >
              <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white text-xs h-10 rounded-none focus:ring-red-600">
                <div className="flex items-center gap-2 w-full">
                  {(() => {
                    const driver = availableDrivers?.find(d => d.code === selectedDriver2);
                    const openF1Driver = openF1Drivers.find(d => d.name_acronym === selectedDriver2 || d.last_name.toUpperCase().slice(0, 3) === selectedDriver2);
                    const color = driverColor(selectedDriver2, year);

                    if (!driver) return <span className="text-gray-500">Select Driver</span>;

                    return (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                          {openF1Driver?.headshot_url ? (
                            <img src={openF1Driver.headshot_url} alt={driver.code} className="w-full h-full object-cover scale-125 translate-y-1" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{driver.code[0]}</div>
                          )}
                        </div>
                        <span className="font-mono font-bold truncate">
                          {openF1Driver ? `${openF1Driver.first_name[0]}. ${openF1Driver.last_name}` : driver.code}
                        </span>
                        <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: color }}></div>
                      </>
                    );
                  })()}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[300px]">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase">Select Driver</SelectLabel>
                  {availableDrivers?.map((driver) => {
                    const isDisabled = selectedDriver1 === driver.code;
                    const openF1Driver = openF1Drivers.find(d => d.name_acronym === driver.code || d.last_name.toUpperCase().slice(0, 3) === driver.code);
                    const color = driverColor(driver.code, year);

                    return (
                      <SelectItem
                        key={`d2-${driver.code}`}
                        value={driver.code}
                        disabled={isDisabled}
                        className="text-xs font-mono focus:bg-gray-900 focus:text-white pl-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden border border-gray-700 shrink-0">
                            {openF1Driver?.headshot_url ? (
                              <img src={openF1Driver.headshot_url} alt={driver.code} className="w-full h-full object-cover scale-125 translate-y-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-mono">{driver.code[0]}</div>
                            )}
                          </div>
                          <span>
                            {openF1Driver ? `${openF1Driver.first_name[0]}. ${openF1Driver.last_name}` : driver.code}
                          </span>
                          <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: color }}></div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={String(selectedLap2)}
              onValueChange={(value) => setSelectedLap2(value === 'fastest' ? 'fastest' : parseInt(value))}
              disabled={isLoadingLaps2 || !selectedDriver2 || lapOptions2.length <= 1}
            >
              <SelectTrigger className="w-[100px] bg-transparent border-b border-gray-700 text-white text-xs h-10 rounded-none focus:ring-0 focus:border-red-600 hover:bg-gray-900/50 transition-colors ml-auto px-2">
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[8px] text-gray-500 uppercase font-bold">Lap</span>
                  <span className="font-mono font-bold text-red-500">{selectedLap2 === 'fastest' ? 'FASTEST' : selectedLap2}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[200px]">
                <SelectGroup>
                  {lapOptions2.map((lapOpt) => (
                    <SelectItem key={`d2-lap-${lapOpt}`} value={String(lapOpt)} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
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

export default CircuitComparisonChart;
