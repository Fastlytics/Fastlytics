import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { fetchSessionDrivers, fetchSectorComparison, fetchDriverLapNumbers, fetchTelemetrySpeed, fetchLapTimes, SessionDriver, SectorComparisonData, SpeedDataPoint, LapTimeDataPoint } from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { cn } from "@/lib/utils";
import { UserIcon, Clock01Icon, Analytics01Icon, AlertCircleIcon } from 'hugeicons-react';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { areTeammates } from '@/lib/teamUtils';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  onDriversSelected
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const [selectedDriver1, setSelectedDriver1] = useState<string>(initialDriver1);
  const [selectedDriver2, setSelectedDriver2] = useState<string>(initialDriver2);
  const [selectedLap1, setSelectedLap1] = useState<string | number>('fastest');
  const [selectedLap2, setSelectedLap2] = useState<string | number>('fastest');
  const [fastestLapInfo1, setFastestLapInfo1] = useState<LapTimeInfo | null>(null);
  const [fastestLapInfo2, setFastestLapInfo2] = useState<LapTimeInfo | null>(null);
  const [shouldLoadChart, setShouldLoadChart] = useState(false);

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

  useEffect(() => {
    if (availableDrivers && availableDrivers.length >= 2) {
      setSelectedDriver1(availableDrivers[0]?.code || "");
      setSelectedDriver2(availableDrivers[1]?.code || "");
      setSelectedLap1('fastest');
      setSelectedLap2('fastest');
    }
  }, [availableDrivers]);

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

  const { data: speedData1, isLoading: isLoadingSpeed1 } = useQuery<SpeedDataPoint[]>({
    queryKey: ['speedTrace', year, event, session, selectedDriver1, selectedLap1],
    queryFn: () => fetchTelemetrySpeed(year, event, session, selectedDriver1, selectedLap1),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver1 && !!selectedLap1 && shouldLoadChart,
  });

  const { data: speedData2, isLoading: isLoadingSpeed2 } = useQuery<SpeedDataPoint[]>({
    queryKey: ['speedTrace', year, event, session, selectedDriver2, selectedLap2],
    queryFn: () => fetchTelemetrySpeed(year, event, session, selectedDriver2, selectedLap2),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!selectedDriver2 && !!selectedLap2 && shouldLoadChart,
  });

  const { data: lapTimesData1 } = useQuery<LapTimeDataPoint[]>({
    queryKey: ['lapTimes', year, event, session, [selectedDriver1]],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver1]),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver1 && shouldLoadChart,
  });

  const { data: lapTimesData2 } = useQuery<LapTimeDataPoint[]>({
    queryKey: ['lapTimes', year, event, session, [selectedDriver2]],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver2]),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    enabled: !!year && !!event && !!session && !!selectedDriver2 && shouldLoadChart,
  });

  const formatLapTime = (timeInSeconds: number | null): string => {
    if (timeInSeconds === null || isNaN(timeInSeconds)) return "--:--.---";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    if (lapTimesData1 && selectedLap1 === 'fastest' && selectedDriver1) {
      let fastestLapNumber = 0;
      let fastestTime = Infinity;
      lapTimesData1.forEach(lap => {
        const lapTime = lap[selectedDriver1] as number;
        if (lapTime && lapTime > 0 && lapTime < fastestTime) {
          fastestTime = lapTime;
          fastestLapNumber = lap.LapNumber;
        }
      });
      if (fastestLapNumber > 0) {
        setFastestLapInfo1({
          lapNumber: fastestLapNumber,
          lapTime: formatLapTime(fastestTime),
          lapTimeRaw: fastestTime
        });
      } else {
        setFastestLapInfo1(null);
      }
    } else if (selectedLap1 !== 'fastest' && lapTimesData1 && typeof selectedLap1 === 'number') {
      const lapData = lapTimesData1.find(lap => lap.LapNumber === selectedLap1);
      const lapTime = lapData ? lapData[selectedDriver1] as number : null;
      if (lapTime && lapTime > 0) {
        setFastestLapInfo1({
          lapNumber: selectedLap1,
          lapTime: formatLapTime(lapTime),
          lapTimeRaw: lapTime
        });
      } else {
        setFastestLapInfo1(null);
      }
    }
  }, [lapTimesData1, selectedDriver1, selectedLap1]);

  useEffect(() => {
    if (lapTimesData2 && selectedLap2 === 'fastest' && selectedDriver2) {
      let fastestLapNumber = 0;
      let fastestTime = Infinity;
      lapTimesData2.forEach(lap => {
        const lapTime = lap[selectedDriver2] as number;
        if (lapTime && lapTime > 0 && lapTime < fastestTime) {
          fastestTime = lapTime;
          fastestLapNumber = lap.LapNumber;
        }
      });
      if (fastestLapNumber > 0) {
        setFastestLapInfo2({
          lapNumber: fastestLapNumber,
          lapTime: formatLapTime(fastestTime),
          lapTimeRaw: fastestTime
        });
      } else {
        setFastestLapInfo2(null);
      }
    } else if (selectedLap2 !== 'fastest' && lapTimesData2 && typeof selectedLap2 === 'number') {
      const lapData = lapTimesData2.find(lap => lap.LapNumber === selectedLap2);
      const lapTime = lapData ? lapData[selectedDriver2] as number : null;
      if (lapTime && lapTime > 0) {
        setFastestLapInfo2({
          lapNumber: selectedLap2,
          lapTime: formatLapTime(lapTime),
          lapTimeRaw: lapTime
        });
      } else {
        setFastestLapInfo2(null);
      }
    }
  }, [lapTimesData2, selectedDriver2, selectedLap2]);

  const combinedSpeedData = useMemo(() => {
    if (!speedData1 || !speedData2) return [];

    const findInterpolationPoints = (distance: number, data: SpeedDataPoint[]) => {
      let beforePoint: SpeedDataPoint | null = null;
      let afterPoint: SpeedDataPoint | null = null;
      for (let i = 0; i < data.length; i++) {
        if (data[i].Distance <= distance) {
          beforePoint = data[i];
        } else {
          afterPoint = data[i];
          break;
        }
      }
      return { beforePoint, afterPoint };
    };

    const interpolateSpeed = (distance: number, data: SpeedDataPoint[]) => {
      if (!data.length) return null;
      const exactMatch = data.find(point => point.Distance === distance);
      if (exactMatch) return exactMatch.Speed;
      const { beforePoint, afterPoint } = findInterpolationPoints(distance, data);
      if (!beforePoint) return afterPoint?.Speed || null;
      if (!afterPoint) return beforePoint?.Speed || null;
      const distRatio = (distance - beforePoint.Distance) / (afterPoint.Distance - beforePoint.Distance);
      return beforePoint.Speed + distRatio * (afterPoint.Speed - beforePoint.Speed);
    };

    const allDistances = new Set<number>();
    speedData1.forEach(point => allDistances.add(point.Distance));
    speedData2.forEach(point => allDistances.add(point.Distance));
    const distances = Array.from(allDistances).sort((a, b) => a - b);
    const sortedSpeedData1 = [...speedData1].sort((a, b) => a.Distance - b.Distance);
    const sortedSpeedData2 = [...speedData2].sort((a, b) => a.Distance - b.Distance);

    return distances.map(distance => ({
      Distance: distance,
      [`Speed_${selectedDriver1}`]: interpolateSpeed(distance, sortedSpeedData1),
      [`Speed_${selectedDriver2}`]: interpolateSpeed(distance, sortedSpeedData2)
    }));
  }, [speedData1, speedData2, selectedDriver1, selectedDriver2]);

  const isLoading = isLoadingDrivers || isLoadingComparison || isLoadingLaps1 || isLoadingLaps2 || isLoadingSpeed1 || isLoadingSpeed2;

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
          <Button
            onClick={() => setShouldLoadChart(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-none"
            disabled={!selectedDriver1 || !selectedDriver2}
          >
            <Analytics01Icon className="w-4 h-4 mr-2" />
            Load Comparison
          </Button>
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
      <div className="w-full">
        <div className="flex justify-between items-center mb-6 text-sm font-mono uppercase">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver1Color }}></div>
            <span className="font-bold text-white">{selectedDriver1}</span>
            {selectedLap1 === 'fastest' && fastestLapInfo1 ? (
              <span className="text-xs text-gray-500">
                (L{fastestLapInfo1.lapNumber} - {fastestLapInfo1.lapTime})
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                (L{selectedLap1 === 'fastest' ? 'Fastest' : selectedLap1}
                {selectedLap1 !== 'fastest' && fastestLapInfo1 ? ` - ${fastestLapInfo1.lapTime}` : ''})
              </span>
            )}
          </div>
          <div className="text-gray-600 font-bold">vs</div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{selectedDriver2}</span>
            {selectedLap2 === 'fastest' && fastestLapInfo2 ? (
              <span className="text-xs text-gray-500">
                (L{fastestLapInfo2.lapNumber} - {fastestLapInfo2.lapTime})
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                (L{selectedLap2 === 'fastest' ? 'Fastest' : selectedLap2}
                {selectedLap2 !== 'fastest' && fastestLapInfo2 ? ` - ${fastestLapInfo2.lapTime}` : ''})
              </span>
            )}
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver2Color }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="circuit-map-container relative w-full h-[400px] bg-black border border-gray-800 overflow-hidden" data-export="true">
            <svg viewBox="0 0 1000 500" className="w-full h-full">
              <g transform="scale(1,-1) translate(0,-500)">
                <path
                  d={comparisonData.circuitLayout}
                  fill="none"
                  stroke="#333"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {comparisonData.sections.map((section) => {
                  let strokeColor = "#333";
                  let advantageText = "Neutral";

                  if (section.driver1Advantage && section.driver1Advantage > 0) {
                    strokeColor = driver1Color;
                    advantageText = `${selectedDriver1} faster by ${Math.abs(Number(section.driver1Advantage)).toFixed(3)}s`;
                  } else if (section.driver1Advantage && section.driver1Advantage < 0) {
                    strokeColor = driver2Color;
                    advantageText = `${selectedDriver2} faster by ${Math.abs(Number(section.driver1Advantage)).toFixed(3)}s`;
                  } else if (section.driver1Advantage === 0) {
                    advantageText = "Identical time";
                  }

                  return (
                    <path
                      key={section.id}
                      d={section.path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      data-section-name={section.name}
                    >
                      <title>{section.name}: {advantageText}</title>
                    </path>
                  );
                })}
              </g>
            </svg>
          </div>

          <div className="speed-trace-container relative w-full h-[400px] bg-black border border-gray-800 overflow-hidden">
            {combinedSpeedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedSpeedData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis
                    type="number"
                    dataKey="Distance"
                    stroke="#666"
                    tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
                    tickFormatter={(value: number) => `${value.toFixed(0)}m`}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000',
                      borderColor: '#333',
                      color: '#fff',
                      borderRadius: '0px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                      fontFamily: 'monospace'
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid #333' }}
                    labelFormatter={(label: number) => `DIST: ${label.toFixed(0)}m`}
                    isAnimationActive={false}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        const dataPoint = payload[0].payload;
                        const speed1 = dataPoint[`Speed_${selectedDriver1}`];
                        const speed2 = dataPoint[`Speed_${selectedDriver2}`];

                        return (
                          <div className="p-2 bg-black border border-gray-800 shadow-xl">
                            <p className="font-bold text-white border-b border-gray-800 pb-1 mb-2 text-xs uppercase">
                              Dist: {Number(label).toFixed(0)}m
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 text-xs font-mono">
                              <span className="text-gray-500">DRIVER</span>
                              <span className="text-gray-500 text-right">SPEED</span>

                              <span style={{ color: driver1Color }}>{selectedDriver1}</span>
                              <span className="text-right" style={{ color: driver1Color }}>
                                {speed1 !== null && speed1 !== undefined ? `${(speed1 as number).toFixed(0)}` : '-'}
                              </span>

                              <span style={{ color: driver2Color }}>{selectedDriver2}</span>
                              <span className="text-right" style={{ color: driver2Color }}>
                                {speed2 !== null && speed2 !== undefined ? `${(speed2 as number).toFixed(0)}` : '-'}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`Speed_${selectedDriver1}`}
                    stroke={driver1Color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: driver1Color }}
                    name={`Speed_${selectedDriver1}`}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey={`Speed_${selectedDriver2}`}
                    stroke={driver2Color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: driver2Color }}
                    name={`Speed_${selectedDriver2}`}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono uppercase text-sm">
                Select drivers to view speed trace
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2 mt-6 text-xs font-mono uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1" style={{ backgroundColor: driver1Color }}></div>
            <span>{selectedDriver1} Advantage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1" style={{ backgroundColor: driver2Color }}></div>
            <span>{selectedDriver2} Advantage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gray-800"></div>
            <span>Neutral</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={chartRef}
      className={cn("bg-black border-2 border-gray-800 p-6", className)}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-gray-800 pb-4">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">{title || "Track Dominance"}</h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <Select
              value={selectedDriver1}
              onValueChange={(value) => {
                setSelectedDriver1(value);
                setSelectedLap1('fastest');
                if (shouldLoadChart) setShouldLoadChart(false);
              }}
              disabled={isLoadingDrivers || !availableDrivers}
            >
              <SelectTrigger className="w-[120px] bg-gray-900 border-gray-700 text-white text-xs h-8 rounded-none focus:ring-red-600">
                <UserIcon className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Driver 1" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase">Driver 1</SelectLabel>
                  {availableDrivers?.map((drv) => (
                    <SelectItem key={`d1-${drv.code}`} value={drv.code} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
                      {drv.code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={String(selectedLap1)}
              onValueChange={(value) => setSelectedLap1(value === 'fastest' ? 'fastest' : parseInt(value))}
              disabled={isLoadingLaps1 || !selectedDriver1 || lapOptions1.length <= 1}
            >
              <SelectTrigger className="w-[90px] bg-gray-900 border-gray-700 text-white text-xs h-8 rounded-none focus:ring-red-600">
                <Clock01Icon className="w-3 h-3 mr-1 opacity-50" />
                <SelectValue placeholder="Lap" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[200px]">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase">Lap</SelectLabel>
                  {lapOptions1.map((lapOpt) => (
                    <SelectItem key={`d1-lap-${lapOpt}`} value={String(lapOpt)} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
                      {lapOpt === 'fastest' ? 'Fastest' : lapOpt}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <span className="text-gray-600 font-bold text-xs">VS</span>

          <div className="flex items-center gap-2">
            <Select
              value={selectedDriver2}
              onValueChange={(value) => {
                setSelectedDriver2(value);
                setSelectedLap2('fastest');
                if (shouldLoadChart) setShouldLoadChart(false);
              }}
              disabled={isLoadingDrivers || !availableDrivers}
            >
              <SelectTrigger className="w-[120px] bg-gray-900 border-gray-700 text-white text-xs h-8 rounded-none focus:ring-red-600">
                <UserIcon className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Driver 2" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase">Driver 2</SelectLabel>
                  {availableDrivers?.map((drv) => (
                    <SelectItem key={`d2-${drv.code}`} value={drv.code} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
                      {drv.code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={String(selectedLap2)}
              onValueChange={(value) => setSelectedLap2(value === 'fastest' ? 'fastest' : parseInt(value))}
              disabled={isLoadingLaps2 || !selectedDriver2 || lapOptions2.length <= 1}
            >
              <SelectTrigger className="w-[90px] bg-gray-900 border-gray-700 text-white text-xs h-8 rounded-none focus:ring-red-600">
                <Clock01Icon className="w-3 h-3 mr-1 opacity-50" />
                <SelectValue placeholder="Lap" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700 text-white rounded-none max-h-[200px]">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase">Lap</SelectLabel>
                  {lapOptions2.map((lapOpt) => (
                    <SelectItem key={`d2-lap-${lapOpt}`} value={String(lapOpt)} className="text-xs font-mono focus:bg-gray-900 focus:text-red-500">
                      {lapOpt === 'fastest' ? 'Fastest' : lapOpt}
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
