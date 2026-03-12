import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSessionDrivers,
  fetchSectorComparison,
  fetchDriverLapNumbers,
  fetchTelemetrySpeed,
  fetchTelemetryThrottle,
  fetchTelemetryBrake,
  fetchTelemetryRPM,
  fetchTelemetryDRS,
  SessionDriver,
  SectorComparisonData,
  SpeedDataPoint,
  SpeedTraceResponse,
  ThrottleDataPoint,
  BrakeDataPoint,
  RPMDataPoint,
  DRSDataPoint,
  DetailedRaceResult,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { cn } from '@/lib/utils';
import {
  MapsLocation01Icon,
  Analytics01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  Time01Icon,
  DashboardSpeed02Icon,
} from 'hugeicons-react';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { areTeammates } from '@/lib/teamUtils';
import { getTeamColorClass } from '@/lib/teamColors';
import { getDriverImage as getDriverImageFromMapping } from '@/utils/imageMapping';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAnalytics } from '@/hooks/useAnalytics';
import { HeadToHeadEnriched } from '@/components/race/HeadToHeadEnriched';

interface MobileHeadToHeadProps {
  year: number;
  event: string;
  session: string;
  raceResults?: DetailedRaceResult[];
}

type TelemetryDataPoint =
  | SpeedDataPoint
  | ThrottleDataPoint
  | BrakeDataPoint
  | RPMDataPoint
  | DRSDataPoint;

interface TelemetryCardProps {
  title: string;
  unit: string;
  data1: TelemetryDataPoint[] | undefined;
  data2: TelemetryDataPoint[] | undefined;
  valueKey: 'Speed' | 'Throttle' | 'Brake' | 'RPM' | 'DRS';
  driver1Color: string;
  driver2Color: string;
  generatePath: (
    data: TelemetryDataPoint[],
    valueKey: string,
    width: number,
    height: number,
    minVal?: number,
    maxVal?: number
  ) => string;
  minVal?: number;
  maxVal?: number;
  isStep?: boolean;
}

const MobileHeadToHead: React.FC<MobileHeadToHeadProps> = ({
  year,
  event,
  session,
  raceResults,
}) => {
  const { profile } = useAuth();
  const { trackSelection, trackInteraction } = useAnalytics();

  // --- Driver Selection Logic (Auto-Select Rival) ---
  const { favDriverCode, rivalDriverCode } = useMemo(() => {
    const favCode = profile?.favorite_driver;
    let rivalCode = null;

    if (favCode && raceResults) {
      const favResult = raceResults.find(
        (r) => r.driverCode === favCode || r.fullName.toLowerCase().includes(favCode.toLowerCase())
      );

      if (favResult && favResult.position) {
        const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
        const rivalResult = raceResults.find((r) => r.position === rivalPos);
        if (rivalResult) rivalCode = rivalResult.driverCode;
      }
    }

    if (!favCode || !raceResults?.find((r) => r.driverCode === favCode)) {
      const p1 = raceResults?.find((r) => r.position === 1)?.driverCode;
      const p2 = raceResults?.find((r) => r.position === 2)?.driverCode;
      return { favDriverCode: p1 || '', rivalDriverCode: p2 || '' };
    }

    return { favDriverCode: favCode, rivalDriverCode: rivalCode || '' };
  }, [profile?.favorite_driver, raceResults]);

  const [internalDriver1, setInternalDriver1] = useState<string>('');
  const [internalDriver2, setInternalDriver2] = useState<string>('');
  const [selectedLap1, setSelectedLap1] = useState<string | number>('fastest');
  const [selectedLap2, setSelectedLap2] = useState<string | number>('fastest');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  const [prevDeps, setPrevDeps] = useState<{
    fav: string | undefined;
    rival: string | undefined;
    drivers: SessionDriver[] | undefined;
  }>({ fav: undefined, rival: undefined, drivers: undefined });

  if (
    favDriverCode !== prevDeps.fav ||
    rivalDriverCode !== prevDeps.rival ||
    availableDrivers !== prevDeps.drivers
  ) {
    setPrevDeps({ fav: favDriverCode, rival: rivalDriverCode, drivers: availableDrivers });
    if (availableDrivers && availableDrivers.length > 0) {
      const codes = availableDrivers.map((d) => d.code);
      const resolvedDriver1 = codes.includes(favDriverCode) ? favDriverCode : codes[0] || '';
      setInternalDriver1(resolvedDriver1);

      const resolvedDriver2 =
        codes.includes(rivalDriverCode) && rivalDriverCode !== resolvedDriver1
          ? rivalDriverCode
          : codes.find((c) => c !== resolvedDriver1) || '';
      setInternalDriver2(resolvedDriver2);
    }
  }

  const selectedDriver1 = internalDriver1;
  const selectedDriver2 = internalDriver2;
  const shouldLoadData = !!(
    selectedDriver1 &&
    selectedDriver2 &&
    selectedDriver1 !== selectedDriver2
  );

  const { data: lapTimes1 } = useQuery<number[]>({
    queryKey: ['driverLapNumbers', year, event, session, selectedDriver1],
    queryFn: () => fetchDriverLapNumbers(year, event, session, selectedDriver1),
    enabled: !!year && !!event && !!session && !!selectedDriver1,
  });

  const { data: lapTimes2 } = useQuery<number[]>({
    queryKey: ['driverLapNumbers', year, event, session, selectedDriver2],
    queryFn: () => fetchDriverLapNumbers(year, event, session, selectedDriver2),
    enabled: !!year && !!event && !!session && !!selectedDriver2,
  });

  const { data: comparisonData, isLoading: isLoadingComparison } = useQuery<SectorComparisonData>({
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
    retry: 1,
    enabled:
      !!year &&
      !!event &&
      !!session &&
      !!selectedDriver1 &&
      !!selectedDriver2 &&
      selectedDriver1 !== selectedDriver2 &&
      shouldLoadData,
  });

  // --- Telemetry Queries ---
  const { data: speedData1 } = useQuery<SpeedDataPoint[]>({
    queryKey: ['speedTrace', year, event, session, selectedDriver1, selectedLap1],
    queryFn: async () => {
      const result = await fetchTelemetrySpeed(year, event, session, selectedDriver1, selectedLap1);
      if (Array.isArray(result)) return result;
      return (result as SpeedTraceResponse).trace ?? [];
    },
    enabled: shouldLoadData,
  });
  const { data: speedData2 } = useQuery<SpeedDataPoint[]>({
    queryKey: ['speedTrace', year, event, session, selectedDriver2, selectedLap2],
    queryFn: async () => {
      const result = await fetchTelemetrySpeed(year, event, session, selectedDriver2, selectedLap2);
      if (Array.isArray(result)) return result;
      return (result as SpeedTraceResponse).trace ?? [];
    },
    enabled: shouldLoadData,
  });

  const { data: throttleData1 } = useQuery<ThrottleDataPoint[]>({
    queryKey: ['throttleTrace', year, event, session, selectedDriver1, selectedLap1],
    queryFn: () => fetchTelemetryThrottle(year, event, session, selectedDriver1, selectedLap1),
    enabled: shouldLoadData,
  });
  const { data: throttleData2 } = useQuery<ThrottleDataPoint[]>({
    queryKey: ['throttleTrace', year, event, session, selectedDriver2, selectedLap2],
    queryFn: () => fetchTelemetryThrottle(year, event, session, selectedDriver2, selectedLap2),
    enabled: shouldLoadData,
  });

  const { data: brakeData1 } = useQuery<BrakeDataPoint[]>({
    queryKey: ['brakeTrace', year, event, session, selectedDriver1, selectedLap1],
    queryFn: () => fetchTelemetryBrake(year, event, session, selectedDriver1, selectedLap1),
    enabled: shouldLoadData,
  });
  const { data: brakeData2 } = useQuery<BrakeDataPoint[]>({
    queryKey: ['brakeTrace', year, event, session, selectedDriver2, selectedLap2],
    queryFn: () => fetchTelemetryBrake(year, event, session, selectedDriver2, selectedLap2),
    enabled: shouldLoadData,
  });

  const { data: rpmData1 } = useQuery<RPMDataPoint[]>({
    queryKey: ['rpmTrace', year, event, session, selectedDriver1, selectedLap1],
    queryFn: () => fetchTelemetryRPM(year, event, session, selectedDriver1, selectedLap1),
    enabled: shouldLoadData,
  });
  const { data: rpmData2 } = useQuery<RPMDataPoint[]>({
    queryKey: ['rpmTrace', year, event, session, selectedDriver2, selectedLap2],
    queryFn: () => fetchTelemetryRPM(year, event, session, selectedDriver2, selectedLap2),
    enabled: shouldLoadData,
  });

  const { data: drsData1 } = useQuery<DRSDataPoint[]>({
    queryKey: ['drsTrace', year, event, session, selectedDriver1, selectedLap1],
    queryFn: () => fetchTelemetryDRS(year, event, session, selectedDriver1, selectedLap1),
    enabled: shouldLoadData,
  });
  const { data: drsData2 } = useQuery<DRSDataPoint[]>({
    queryKey: ['drsTrace', year, event, session, selectedDriver2, selectedLap2],
    queryFn: () => fetchTelemetryDRS(year, event, session, selectedDriver2, selectedLap2),
    enabled: shouldLoadData,
  });

  const driver1Color = driverColor(selectedDriver1, year);
  let driver2Color = driverColor(selectedDriver2, year);
  const sameTeam =
    selectedDriver1 && selectedDriver2
      ? areTeammates(selectedDriver1, selectedDriver2, year)
      : false;
  if (sameTeam) {
    driver2Color = '#FFFFFF';
  }

  // --- Helpers ---
  const generateSparklinePath = (
    data: TelemetryDataPoint[],
    valueKey: string,
    width: number,
    height: number,
    minVal?: number,
    maxVal?: number
  ) => {
    if (!data || data.length === 0) return '';

    const getValue = (point: TelemetryDataPoint): number => {
      if (valueKey === 'Speed' && 'Speed' in point) return (point as SpeedDataPoint).Speed;
      if (valueKey === 'Throttle' && 'Throttle' in point)
        return (point as ThrottleDataPoint).Throttle;
      if (valueKey === 'Brake' && 'Brake' in point) return (point as BrakeDataPoint).Brake;
      if (valueKey === 'RPM' && 'RPM' in point) return (point as RPMDataPoint).RPM;
      if (valueKey === 'DRS' && 'DRS' in point) return (point as DRSDataPoint).DRS;
      return 0;
    };

    const maxDist = Math.max(...data.map((d) => d.Distance));
    const values = data.map(getValue);
    const maxV = maxVal ?? Math.max(...values);
    const minV = minVal ?? Math.min(...values);
    const range = maxV - minV || 1;

    const points = data.map((d) => {
      const x = (d.Distance / maxDist) * width;
      const y = height - ((getValue(d) - minV) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const getDriverImage = (code: string) => {
    return getDriverImageFromMapping(code, year);
  };

  const getDriverTeam = (code: string) => {
    const result = raceResults?.find((r) => r.driverCode === code);
    if (result) return result.team;
    const driver = availableDrivers?.find((d) => d.code === code);
    return driver?.team;
  };

  const renderDriverSelector = (
    label: string,
    selectedDriver: string,
    setSelectedDriver: (d: string) => void,
    otherDriver: string,
    lapTimes: number[] | undefined,
    selectedLap: string | number,
    setSelectedLap: (l: string | number) => void
  ) => {
    return (
      <div className="space-y-1 w-full">
        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
          {label}
        </label>
        <div className="flex gap-2">
          <Select
            value={selectedDriver}
            onValueChange={(value) => {
              setSelectedDriver(value);
              setSelectedLap('fastest');
              trackSelection('h2h_driver', value);
            }}
            disabled={isLoadingDrivers || !availableDrivers}
          >
            <SelectTrigger className="flex-1 bg-black border border-white/20 text-white h-10 px-2 rounded-md">
              {selectedDriver ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <Avatar className="w-5 h-5 border border-white/10">
                    <AvatarImage
                      src={getDriverImage(selectedDriver)}
                      className="object-cover object-top"
                    />
                    <AvatarFallback
                      className={cn(
                        'text-[8px] font-bold',
                        `bg-f1-${getTeamColorClass(getDriverTeam(selectedDriver))}`
                      )}
                    >
                      {selectedDriver}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-mono font-bold text-sm truncate">{selectedDriver}</span>
                </div>
              ) : (
                <span className="text-gray-500">Select</span>
              )}
            </SelectTrigger>
            <SelectContent className="bg-black border border-white/20 text-white max-h-[300px]">
              <SelectGroup>
                <SelectLabel className="text-xs text-gray-500 uppercase">Select Driver</SelectLabel>
                {availableDrivers?.map((d) => {
                  const isDisabled = otherDriver === d.code;
                  const team = getDriverTeam(d.code);
                  return (
                    <SelectItem
                      key={d.code}
                      value={d.code}
                      disabled={isDisabled}
                      className="text-xs font-mono focus:bg-gray-800 focus:text-white pl-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Avatar className="w-5 h-5 border border-white/10">
                          <AvatarImage
                            src={getDriverImage(d.code)}
                            className="object-cover object-top"
                          />
                          <AvatarFallback
                            className={cn(
                              'text-[8px] font-bold',
                              `bg-f1-${getTeamColorClass(team)}`
                            )}
                          >
                            {d.code}
                          </AvatarFallback>
                        </Avatar>
                        <span>{d.code}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={String(selectedLap)}
            onValueChange={(value) => {
              setSelectedLap(value === 'fastest' ? 'fastest' : parseInt(value));
              trackSelection('h2h_lap', value);
            }}
            disabled={!selectedDriver || !lapTimes}
          >
            <SelectTrigger className="w-[70px] bg-black border border-white/20 text-white h-10 px-2 rounded-md">
              <div className="flex items-center justify-center w-full">
                <span className="font-mono font-bold text-xs text-white truncate">
                  {selectedLap === 'fastest' ? 'FAST' : selectedLap}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-black border border-white/20 text-white max-h-[200px]">
              <SelectGroup>
                <SelectItem
                  value="fastest"
                  className="text-xs font-mono focus:bg-gray-800 focus:text-red-500"
                >
                  Fastest
                </SelectItem>
                {lapTimes?.map((lap) => (
                  <SelectItem
                    key={lap}
                    value={String(lap)}
                    className="text-xs font-mono focus:bg-gray-800 focus:text-red-500"
                  >
                    Lap {lap}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const lapGap = useMemo(() => {
    if (!comparisonData) return null;
    const t1 = parseLapTime(comparisonData.driver1LapTime);
    const t2 = parseLapTime(comparisonData.driver2LapTime);
    if (t1 === Infinity || t2 === Infinity) return null;
    return t1 - t2;
  }, [comparisonData]);

  // Selected Section Data
  const selectedSectionData = useMemo(() => {
    if (!comparisonData || !selectedSectionId) return null;
    return comparisonData.sections.find((s) => s.id === selectedSectionId);
  }, [comparisonData, selectedSectionId]);

  const [isRotated, setIsRotated] = useState(true);

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-2 gap-4">
        {renderDriverSelector(
          'Driver 1',
          selectedDriver1,
          setInternalDriver1,
          selectedDriver2,
          lapTimes1,
          selectedLap1,
          setSelectedLap1
        )}
        {renderDriverSelector(
          'Driver 2',
          selectedDriver2,
          setInternalDriver2,
          selectedDriver1,
          lapTimes2,
          selectedLap2,
          setSelectedLap2
        )}
      </div>

      {shouldLoadData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Lap Time Summary */}
          <div className="bg-black border-2 border-white/10 p-6 flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2">
              Lap Time Delta
            </div>
            {isLoadingComparison ? (
              <div className="h-12 w-32 bg-zinc-900 animate-pulse rounded" />
            ) : lapGap !== null ? (
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    'text-4xl font-black font-mono tracking-tighter',
                    lapGap < 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {lapGap > 0 ? '+' : ''}
                  {lapGap.toFixed(3)}s
                </span>
                <span className="text-xs font-bold uppercase text-gray-400">
                  {lapGap < 0 ? selectedDriver1 : selectedDriver2} Faster
                </span>
              </div>
            ) : (
              <span className="text-gray-500 font-mono">--</span>
            )}
          </div>

          {/* Track Dominance Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Track Dominance
              </h3>
              <button
                onClick={() => {
                  setIsRotated(!isRotated);
                  trackInteraction('track_map_rotated');
                }}
                className="text-[10px] text-red-500 uppercase font-bold border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                Rotate Map
              </button>
            </div>

            <div className="bg-black border border-white/10 p-0 relative h-[400px] flex items-center justify-center rounded-lg overflow-hidden">
              {isLoadingComparison ? (
                <LoadingSpinnerF1 />
              ) : comparisonData ? (
                <svg
                  viewBox="0 0 1000 500"
                  className={cn(
                    'w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-transform duration-500',
                    isRotated ? 'rotate-90 scale-[2]' : 'scale-100'
                  )}
                >
                  <g transform="scale(1,-1) translate(0,-500)">
                    <path
                      d={comparisonData.circuitLayout}
                      fill="none"
                      stroke="#1a1a1a"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {comparisonData.sections.map((section) => {
                      let strokeColor = '#333';
                      if (section.driver1Advantage && section.driver1Advantage > 0) {
                        strokeColor = driver1Color;
                      } else if (section.driver1Advantage && section.driver1Advantage < 0) {
                        strokeColor = driver2Color;
                      }
                      const isSelected = selectedSectionId === section.id;
                      return (
                        <path
                          key={section.id}
                          d={section.path}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isSelected ? '24' : '18'}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-200 cursor-pointer"
                          onClick={() => setSelectedSectionId(section.id)}
                          style={{ opacity: isSelected ? 1 : 0.8 }}
                        />
                      );
                    })}
                  </g>
                </svg>
              ) : (
                <div className="text-gray-500 text-xs font-mono">No Map Data</div>
              )}

              {/* Tap Hint Overlay (fades out) */}
              <div className="absolute bottom-2 right-2 pointer-events-none">
                <span className="text-[9px] text-gray-600 uppercase font-bold bg-black/50 px-1 rounded">
                  Tap segments for details
                </span>
              </div>
            </div>

            {/* Selected Section Details */}
            <AnimatePresence mode="wait">
              {selectedSectionData ? (
                <motion.div
                  key={selectedSectionData.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-zinc-900/50 border border-white/10 p-3 rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border border-white/10">
                        <AvatarImage
                          src={getDriverImage(
                            selectedSectionData.driver1Advantage &&
                              selectedSectionData.driver1Advantage > 0
                              ? selectedDriver1
                              : selectedDriver2
                          )}
                          className="object-cover object-top"
                        />
                        <AvatarFallback
                          className={cn(
                            'text-[10px] font-bold',
                            `bg-f1-${getTeamColorClass(getDriverTeam(selectedSectionData.driver1Advantage && selectedSectionData.driver1Advantage > 0 ? selectedDriver1 : selectedDriver2))}`
                          )}
                        >
                          {selectedSectionData.driver1Advantage &&
                          selectedSectionData.driver1Advantage > 0
                            ? selectedDriver1
                            : selectedDriver2}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          Advantage
                        </span>
                        <span
                          className="text-sm font-mono font-bold"
                          style={{
                            color:
                              selectedSectionData.driver1Advantage &&
                              selectedSectionData.driver1Advantage > 0
                                ? driver1Color
                                : driver2Color,
                          }}
                        >
                          {Math.abs(selectedSectionData.driver1Advantage || 0).toFixed(3)}s
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Segment</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {selectedSectionData.id.replace('segment_', '')}
                      </span>
                    </div>
                  </div>

                  {/* Segment Telemetry Stats */}
                  {(() => {
                    const totalDist = speedData1
                      ? Math.max(...speedData1.map((d) => d.Distance))
                      : 0;
                    const numSegments = comparisonData?.sections.length || 1;
                    const segmentLength = totalDist / numSegments;
                    const segmentIndex =
                      parseInt(selectedSectionData.id.replace('segment_', '')) || 0;
                    const startDist = segmentIndex * segmentLength;
                    const endDist = (segmentIndex + 1) * segmentLength;

                    const calcSpeedAvg = (data: SpeedDataPoint[]) => {
                      if (!data || data.length === 0) return 0;
                      const segmentData = data.filter(
                        (d) => d.Distance >= startDist && d.Distance <= endDist
                      );
                      if (segmentData.length === 0) return 0;
                      const sum = segmentData.reduce((acc, curr) => acc + curr.Speed, 0);
                      return sum / segmentData.length;
                    };

                    const calcThrottleAvg = (data: ThrottleDataPoint[]) => {
                      if (!data || data.length === 0) return 0;
                      const segmentData = data.filter(
                        (d) => d.Distance >= startDist && d.Distance <= endDist
                      );
                      if (segmentData.length === 0) return 0;
                      const sum = segmentData.reduce((acc, curr) => acc + curr.Throttle, 0);
                      return sum / segmentData.length;
                    };

                    const calcBrakeAvg = (data: BrakeDataPoint[]) => {
                      if (!data || data.length === 0) return 0;
                      const segmentData = data.filter(
                        (d) => d.Distance >= startDist && d.Distance <= endDist
                      );
                      if (segmentData.length === 0) return 0;
                      const sum = segmentData.reduce((acc, curr) => acc + curr.Brake, 0);
                      return sum / segmentData.length;
                    };

                    const d1Speed = calcSpeedAvg(speedData1 || []);
                    const d2Speed = calcSpeedAvg(speedData2 || []);
                    const d1Throttle = calcThrottleAvg(throttleData1 || []);
                    const d2Throttle = calcThrottleAvg(throttleData2 || []);
                    const d1Brake = calcBrakeAvg(brakeData1 || []);
                    const d2Brake = calcBrakeAvg(brakeData2 || []);

                    return (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        <div className="flex flex-col items-center p-2 bg-black/40 rounded">
                          <span className="text-[9px] uppercase font-bold text-gray-500 mb-1">
                            Avg Speed
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: driver1Color }}
                            >
                              {Math.round(d1Speed)}
                            </span>
                            <span className="text-[9px] text-gray-600">vs</span>
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: driver2Color }}
                            >
                              {Math.round(d2Speed)}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">km/h</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-black/40 rounded">
                          <span className="text-[9px] uppercase font-bold text-gray-500 mb-1">
                            Avg Throttle
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: driver1Color }}
                            >
                              {Math.round(d1Throttle)}
                            </span>
                            <span className="text-[9px] text-gray-600">vs</span>
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: driver2Color }}
                            >
                              {Math.round(d2Throttle)}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">%</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-black/40 rounded">
                          <span className="text-[9px] uppercase font-bold text-gray-500 mb-1">
                            Avg Brake
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: driver1Color }}
                            >
                              {Math.round(d1Brake)}
                            </span>
                            <span className="text-[9px] text-gray-600">vs</span>
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: driver2Color }}
                            >
                              {Math.round(d2Brake)}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5">%</span>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              ) : (
                <div className="h-12 flex items-center justify-center text-[10px] text-gray-600 uppercase font-bold border border-transparent">
                  Select a track segment
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Telemetry Charts */}
          <div className="space-y-6">
            <TelemetryCard
              title="Speed"
              unit="km/h"
              data1={speedData1}
              data2={speedData2}
              valueKey="Speed"
              driver1Color={driver1Color}
              driver2Color={driver2Color}
              generatePath={generateSparklinePath}
            />
            <TelemetryCard
              title="Throttle"
              unit="%"
              data1={throttleData1}
              data2={throttleData2}
              valueKey="Throttle"
              driver1Color={driver1Color}
              driver2Color={driver2Color}
              generatePath={generateSparklinePath}
              minVal={0}
              maxVal={100}
            />
            <TelemetryCard
              title="Brake"
              unit="%"
              data1={brakeData1}
              data2={brakeData2}
              valueKey="Brake"
              driver1Color={driver1Color}
              driver2Color={driver2Color}
              generatePath={generateSparklinePath}
              minVal={0}
              maxVal={100}
            />
            <TelemetryCard
              title="RPM"
              unit="rpm"
              data1={rpmData1}
              data2={rpmData2}
              valueKey="RPM"
              driver1Color={driver1Color}
              driver2Color={driver2Color}
              generatePath={generateSparklinePath}
            />
            <TelemetryCard
              title="DRS"
              unit=""
              data1={drsData1}
              data2={drsData2}
              valueKey="DRS"
              driver1Color={driver1Color}
              driver2Color={driver2Color}
              generatePath={generateSparklinePath}
              minVal={0}
              maxVal={1}
              isStep
            />
          </div>
        </div>
      )}

      {/* Enriched Race Data Panels */}
      {shouldLoadData && selectedDriver1 && selectedDriver2 && (
        <div className="mt-6">
          <HeadToHeadEnriched
            year={year}
            event={event}
            session={session}
            driver1={selectedDriver1}
            driver2={selectedDriver2}
          />
        </div>
      )}
    </div>
  );
};

// Reusable Telemetry Card
const TelemetryCard: React.FC<TelemetryCardProps> = ({
  title,
  unit,
  data1,
  data2,
  valueKey,
  driver1Color,
  driver2Color,
  generatePath,
  minVal,
  maxVal,
  isStep,
}) => {
  return (
    <div className="bg-black p-4 space-y-4 border border-white/10 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] uppercase font-bold text-gray-500">{title}</span>
        <span className="text-[9px] font-mono text-gray-600">{unit}</span>
      </div>

      <div className="h-24 w-full relative border-b border-l border-white/10 bg-white/[0.02]">
        <div className="absolute inset-0">
          <svg viewBox="0 0 1000 100" className="w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="1000" y2="50" stroke="#ffffff10" strokeDasharray="4 4" />
            {data1 && (
              <path
                d={generatePath(data1, valueKey, 1000, 100, minVal, maxVal)}
                fill="none"
                stroke={driver1Color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                shapeRendering={isStep ? 'crispEdges' : 'auto'}
              />
            )}
            {data2 && (
              <path
                d={generatePath(data2, valueKey, 1000, 100, minVal, maxVal)}
                fill="none"
                stroke={driver2Color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                shapeRendering={isStep ? 'crispEdges' : 'auto'}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

const parseLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Infinity;
  try {
    const parts = timeStr.split(/[:.]/);
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
    } else if (parts.length === 2) {
      return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 1000;
    }
  } catch (e) {
    console.error('Error parsing time:', timeStr, e);
  }
  return Infinity;
};

export { MobileHeadToHead };
export default MobileHeadToHead;
