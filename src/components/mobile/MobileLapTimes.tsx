import React, { useState, useMemo, useEffect } from 'react';
import {
  DetailedRaceResult,
  fetchLapTimes,
  fetchPaceDistribution,
  LapTimeDataPoint,
  LapTimesEnrichedResponse,
  PaceDistributionData,
  PaceDistributionResponse,
  SessionDriver,
  fetchSessionDrivers,
} from '@/lib/api';
import { getDriverImage as getDriverImageFromMapping } from '@/utils/imageMapping';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Time01Icon,
  Analytics01Icon,
  ChartLineData01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { driverColor } from '@/lib/driverColor';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ChartMouseEvent {
  activeLabel?: string | number;
}

interface LapOrGapDataPoint {
  LapNumber: number;
  [driverCode: string]: number | null;
}

interface MobileLapTimesProps {
  year: number;
  event: string;
  session: string;
  raceResults: DetailedRaceResult[] | undefined;
}

const formatLapTime = (totalSeconds: number | null): string => {
  // ... existing helper functions ...
  if (totalSeconds === null || isNaN(totalSeconds)) return '-';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds}`;
};

const getTeamColorClass = (teamName: string | undefined): string => {
  if (!teamName) return 'gray';
  const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (simpleName.includes('mclaren')) return 'mclaren';
  if (simpleName.includes('mercedes')) return 'mercedes';
  if (simpleName.includes('redbull')) return 'redbull';
  if (simpleName.includes('ferrari')) return 'ferrari';
  if (simpleName.includes('alpine')) return 'alpine';
  if (simpleName.includes('astonmartin')) return 'astonmartin';
  if (simpleName.includes('williams')) return 'williams';
  if (simpleName.includes('haas')) return 'haas';
  if (simpleName.includes('sauber')) return 'alfaromeo';
  if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
  return 'gray';
};

const MobileLapTimes: React.FC<MobileLapTimesProps> = ({ year, event, session, raceResults }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackSelection, trackInteraction } = useAnalytics();
  const [lapAnalysisMode, setLapAnalysisMode] = useState<'history' | 'pace' | 'gap'>('history');

  // --- Driver Selection Logic ---
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
    // Fallback if no favorite or not in results
    if (!favCode || !raceResults?.find((r) => r.driverCode === favCode)) {
      const p1 = raceResults?.find((r) => r.position === 1)?.driverCode;
      const p2 = raceResults?.find((r) => r.position === 2)?.driverCode;
      return { favDriverCode: p1 || '', rivalDriverCode: p2 || '' };
    }

    return { favDriverCode: favCode, rivalDriverCode: rivalCode || '' };
  }, [profile?.favorite_driver, raceResults]);

  const [internalDriver1, setInternalDriver1] = useState<string>('');
  const [internalDriver2, setInternalDriver2] = useState<string>('');

  // --- Data Fetching ---

  const leaderCode = useMemo(() => {
    return raceResults?.find((r) => r.position === 1)?.driverCode;
  }, [raceResults]);

  // 2. Pace Distribution Data (Fetch for ALL drivers to show the list)
  const { data: sessionDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
  });

  const [prevDeps, setPrevDeps] = useState<{
    fav: string | undefined;
    rival: string | undefined;
    drivers: SessionDriver[] | undefined;
  }>({ fav: undefined, rival: undefined, drivers: undefined });

  if (
    favDriverCode !== prevDeps.fav ||
    rivalDriverCode !== prevDeps.rival ||
    sessionDrivers !== prevDeps.drivers
  ) {
    setPrevDeps({ fav: favDriverCode, rival: rivalDriverCode, drivers: sessionDrivers });
    if (sessionDrivers && sessionDrivers.length > 0) {
      const codes = sessionDrivers.map((d) => d.code);
      const resolvedDriver1 = codes.includes(favDriverCode) ? favDriverCode : codes[0] || '';
      setInternalDriver1(resolvedDriver1);

      const resolvedDriver2 =
        codes.includes(rivalDriverCode) && rivalDriverCode !== resolvedDriver1
          ? rivalDriverCode
          : codes.find((c) => c !== resolvedDriver1) || '';
      setInternalDriver2(resolvedDriver2);
    }
  }

  const driver1 = internalDriver1;
  const driver2 = internalDriver2;

  const driversToFetch = useMemo(() => {
    const drivers = [driver1, driver2].filter(Boolean);
    // If in gap mode, ensure we fetch the leader's times too
    if (lapAnalysisMode === 'gap' && leaderCode && !drivers.includes(leaderCode)) {
      drivers.push(leaderCode);
    }
    return drivers;
  }, [driver1, driver2, lapAnalysisMode, leaderCode]);

  // 1. Lap History / Gap Data
  const { data: lapTimesResponse, isLoading: isLoadingLaps } = useQuery<LapTimesEnrichedResponse>({
    queryKey: ['lapTimes', year, event, session, driversToFetch],
    queryFn: () => fetchLapTimes(year, event, session, driversToFetch),
    enabled:
      (lapAnalysisMode === 'history' || lapAnalysisMode === 'gap') &&
      !!driver1 &&
      driversToFetch.length > 0,
    staleTime: 1000 * 60 * 5,
  });
  const lapData = lapTimesResponse?.lapComparison;

  const allDriverCodes = useMemo(() => sessionDrivers?.map((d) => d.code) || [], [sessionDrivers]);

  const { data: paceData, isLoading: isLoadingPace } = useQuery<PaceDistributionData[]>({
    queryKey: ['paceDistribution', year, event, session, 'all'], // 'all' as key
    queryFn: async () => {
      const result = await fetchPaceDistribution(year, event, session, allDriverCodes);
      // Handle both new PaceDistributionResponse format and old PaceDistributionData[] format
      if (Array.isArray(result)) return result;
      return (result as PaceDistributionResponse).overall ?? [];
    },
    enabled: lapAnalysisMode === 'pace' && allDriverCodes.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // --- Gap Calculation ---
  const gapData = useMemo(() => {
    if (!lapData || lapAnalysisMode !== 'gap' || !leaderCode) return [];

    let cumulativeLeader = 0;
    let cumulativeD1 = 0;
    let cumulativeD2 = 0;

    // Sort by LapNumber just in case
    const sortedLaps = [...lapData].sort((a, b) => a.LapNumber - b.LapNumber);

    return sortedLaps
      .map((lap) => {
        const lTime = lap[leaderCode];
        const d1Time = lap[driver1];
        const d2Time = driver2 ? lap[driver2] : null;

        // If leader has no time for this lap (e.g. DNF), we can't calculate gap
        if (lTime === undefined || lTime === null) return null;

        cumulativeLeader += lTime;

        let d1Gap = null;
        if (d1Time !== undefined && d1Time !== null) {
          cumulativeD1 += d1Time;
          d1Gap = cumulativeD1 - cumulativeLeader;
        }

        let d2Gap = null;
        if (d2Time !== undefined && d2Time !== null && driver2) {
          cumulativeD2 += d2Time;
          d2Gap = cumulativeD2 - cumulativeLeader;
        }

        return {
          LapNumber: lap.LapNumber,
          [driver1]: d1Gap,
          ...(driver2 ? { [driver2]: d2Gap } : {}),
        };
      })
      .filter(Boolean);
  }, [lapData, lapAnalysisMode, leaderCode, driver1, driver2]);

  // --- Helper for Driver Images ---
  const getDriverImage = (code: string) => {
    return getDriverImageFromMapping(code, year);
  };

  const getDriverTeam = (code: string) => {
    return raceResults?.find((r) => r.driverCode === code)?.team;
  };

  // --- Render Helpers ---
  const [selectedLap, setSelectedLap] = useState<number | null>(null);
  const [selectedPaceDriver, setSelectedPaceDriver] = useState<PaceDistributionData | null>(null);

  // Calculate global min/max for pace bars
  const { globalMinPace, globalMaxPace } = useMemo(() => {
    if (!paceData || paceData.length === 0) return { globalMinPace: 0, globalMaxPace: 0 };
    let min = Infinity;
    let max = -Infinity;
    paceData.forEach((d) => {
      if (d.q1 < min) min = d.q1;
      if (d.min < min) min = d.min;
      if (d.max > max) max = d.max;
    });
    return { globalMinPace: min, globalMaxPace: max };
  }, [paceData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        {/* Analysis Mode Toggle */}
        <div className="flex p-1 bg-zinc-900 border border-white/10 rounded-lg">
          <button
            onClick={() => {
              setLapAnalysisMode('history');
              trackInteraction('lap_analysis_mode_changed', { mode: 'history' });
            }}
            className={cn(
              'flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-md flex items-center justify-center gap-1.5',
              lapAnalysisMode === 'history'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-white'
            )}
          >
            <Time01Icon className="w-3 h-3" />
            History
          </button>
          <button
            onClick={() => {
              setLapAnalysisMode('gap');
              trackInteraction('lap_analysis_mode_changed', { mode: 'gap' });
            }}
            className={cn(
              'flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-md flex items-center justify-center gap-1.5',
              lapAnalysisMode === 'gap'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-white'
            )}
          >
            <ChartLineData01Icon className="w-3 h-3" />
            Gap
          </button>
          <button
            onClick={() => {
              setLapAnalysisMode('pace');
              trackInteraction('lap_analysis_mode_changed', { mode: 'pace' });
            }}
            className={cn(
              'flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-md flex items-center justify-center gap-1.5',
              lapAnalysisMode === 'pace'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-white'
            )}
          >
            <Analytics01Icon className="w-3 h-3" />
            Pace
          </button>
        </div>
      </div>

      {/* --- LAP HISTORY / GAP VIEW --- */}
      {(lapAnalysisMode === 'history' || lapAnalysisMode === 'gap') && (
        <div className="space-y-4">
          {/* Driver Selectors */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: driver1, setter: setInternalDriver1, label: 'Driver 1' },
              { value: driver2, setter: setInternalDriver2, label: 'Driver 2' },
            ].map((control, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  {control.label}
                </label>
                <Select
                  value={control.value}
                  onValueChange={(value) => {
                    control.setter(value);
                    trackSelection('lap_driver', value, { label: control.label });
                  }}
                >
                  <SelectTrigger className="w-full bg-black border border-white/20 text-white h-12 px-2 rounded-md">
                    {control.value ? (
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="w-6 h-6 border border-white/10">
                          <AvatarImage
                            src={getDriverImage(control.value)}
                            className="object-cover object-top"
                          />
                          <AvatarFallback
                            className={cn(
                              'text-[8px] font-bold',
                              `bg-f1-${getTeamColorClass(getDriverTeam(control.value))}`
                            )}
                          >
                            {control.value}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-black font-mono text-sm uppercase leading-none">
                            {control.value}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase font-mono leading-none mt-0.5">
                            {getDriverTeam(control.value)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20 text-white max-h-[300px]">
                    {raceResults?.map((r) => (
                      <SelectItem
                        key={r.driverCode}
                        value={r.driverCode}
                        className="focus:bg-zinc-800 focus:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-6 h-6 border border-white/10">
                            <AvatarImage
                              src={getDriverImage(r.driverCode)}
                              className="object-cover object-top"
                            />
                            <AvatarFallback
                              className={cn(
                                'text-[8px] font-bold',
                                `bg-f1-${getTeamColorClass(r.team)}`
                              )}
                            >
                              {r.driverCode}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-mono font-bold">{r.driverCode}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Scrollable Chart Container */}
          <div className="relative bg-zinc-900/30 border border-white/10 rounded-lg p-2">
            <div className="absolute top-2 right-2 z-10">
              <span className="text-[9px] text-gray-600 uppercase font-bold bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                Scroll / Tap
              </span>
            </div>
            <div className="w-full overflow-x-auto pb-2 touch-pan-x scrollbar-hide">
              <div
                style={{
                  width: Math.max(window.innerWidth - 48, (lapData?.length || 0) * 30),
                  height: 350,
                  minWidth: '100%',
                }}
              >
                {isLoadingLaps ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 animate-pulse">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-mono uppercase">Loading Data...</span>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={lapAnalysisMode === 'gap' ? gapData : lapData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                      onMouseMove={(e: ChartMouseEvent) => {
                        if (e && e.activeLabel !== undefined && typeof e.activeLabel === 'number') {
                          setSelectedLap(e.activeLabel);
                        }
                      }}
                      onClick={(e: ChartMouseEvent) => {
                        if (e && e.activeLabel !== undefined && typeof e.activeLabel === 'number') {
                          setSelectedLap(e.activeLabel);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                      <XAxis
                        dataKey="LapNumber"
                        stroke="#666"
                        tick={{ fill: '#888', fontSize: 10, fontFamily: 'Geist' }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        hide
                        domain={['auto', 'auto']}
                        reversed={lapAnalysisMode === 'history'} // Reverse for lap times (lower is better), but not for gap (usually)
                        // Actually, for Gap: 0 is leader (top). +10s is below. So we should REVERSE Y-Axis for Gap too if we want Leader at TOP.
                        // Let's try reversed for both.
                        // Lap Times: Lower is better (Top).
                        // Gap: 0 is best (Top). +Gap is worse (Bottom).
                        // So yes, reversed for both.
                      />
                      <Tooltip
                        content={() => null}
                        cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Line
                        type="monotone"
                        dataKey={driver1}
                        stroke={driverColor(driver1, year)}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                        connectNulls
                      />
                      {driver2 && (
                        <Line
                          type="monotone"
                          dataKey={driver2}
                          stroke={driverColor(driver2, year)}
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                          connectNulls
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Detail Overlay */}
          <AnimatePresence>
            {selectedLap !== null && (
              <OverlayContent
                lapNumber={selectedLap}
                lapData={lapAnalysisMode === 'gap' ? gapData : lapData}
                driver1={driver1}
                driver2={driver2}
                onClose={() => setSelectedLap(null)}
                getDriverImage={getDriverImage}
                getDriverTeam={getDriverTeam}
                year={year}
                mode={lapAnalysisMode}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- PACE DISTRIBUTION VIEW --- */}
      {lapAnalysisMode === 'pace' && (
        <div className="space-y-4">
          {isLoadingPace ? (
            <div className="text-center py-20 text-gray-500 animate-pulse flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono uppercase">Calculating Pace Distribution...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {paceData
                ?.sort((a, b) => a.median - b.median)
                .map((driverPace, idx) => {
                  const driverCode = driverPace.driverCode;
                  const team = getDriverTeam(driverCode);
                  const color = driverColor(driverCode, year);

                  // Calculate bar position and width
                  const range = globalMaxPace - globalMinPace;
                  const leftPct = ((driverPace.min - globalMinPace) / range) * 100;
                  const widthPct = ((driverPace.max - driverPace.min) / range) * 100;
                  const medianPct = ((driverPace.median - globalMinPace) / range) * 100;
                  const q1Pct = ((driverPace.q1 - globalMinPace) / range) * 100;
                  const q3Pct = ((driverPace.q3 - globalMinPace) / range) * 100;

                  return (
                    <button
                      key={driverCode}
                      onClick={() => {
                        setSelectedPaceDriver(driverPace);
                        trackSelection('pace_driver', driverCode);
                      }}
                      className="w-full bg-black border border-white/10 p-3 rounded-lg relative overflow-hidden hover:bg-zinc-900/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 mb-4 relative z-10">
                        <span className="text-xs font-mono font-bold text-gray-600 w-4 text-center">
                          {idx + 1}
                        </span>
                        <Avatar className="w-8 h-8 border border-white/10 rounded-none">
                          <AvatarImage
                            src={getDriverImage(driverCode)}
                            className="object-cover object-top"
                          />
                          <AvatarFallback
                            className={cn(
                              'text-[10px] font-bold rounded-none',
                              `bg-f1-${getTeamColorClass(team)}`
                            )}
                          >
                            {driverCode}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-white group-hover:text-red-500 transition-colors">
                              {driverCode}
                            </span>
                            <span className="font-mono font-bold text-sm text-white">
                              {formatLapTime(driverPace.median)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight01Icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors -rotate-45" />
                      </div>

                      {/* Technical Box Plot Visualization */}
                      <div className="relative h-8 w-full mt-2">
                        {/* Background Grid */}
                        <div className="absolute inset-0 flex justify-between px-0 opacity-20">
                          {[0, 25, 50, 75, 100].map((p) => (
                            <div
                              key={p}
                              className="h-full w-px bg-white/20"
                              style={{ left: `${p}%` }}
                            />
                          ))}
                        </div>

                        {/* Range Line (Min to Max) */}
                        <div
                          className="absolute top-1/2 h-px bg-white/30 -translate-y-1/2"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                        >
                          {/* End Caps */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-px bg-white/50" />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-px bg-white/50" />
                        </div>

                        {/* IQR Box (Q1 to Q3) */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-4 border border-white/20 backdrop-blur-sm"
                          style={{
                            left: `${q1Pct}%`,
                            width: `${q3Pct - q1Pct}%`,
                            backgroundColor: `${color}40`, // 25% opacity
                            borderColor: color,
                          }}
                        />

                        {/* Median Line */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-6 w-0.5 bg-white z-20 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                          style={{ left: `${medianPct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Pace Detail Overlay */}
          <AnimatePresence>
            {selectedPaceDriver && (
              <PaceOverlayContent
                data={selectedPaceDriver}
                onClose={() => setSelectedPaceDriver(null)}
                getDriverImage={getDriverImage}
                getDriverTeam={getDriverTeam}
                year={year}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export { MobileLapTimes };
export default MobileLapTimes;

interface OverlayContentProps {
  lapNumber: number;
  lapData: LapOrGapDataPoint[] | undefined;
  driver1: string;
  driver2: string;
  onClose: () => void;
  getDriverImage: (code: string) => string | undefined;
  getDriverTeam: (code: string) => string | undefined;
  year: number;
  mode: 'history' | 'gap' | 'pace';
}

const OverlayContent: React.FC<OverlayContentProps> = ({
  lapNumber,
  lapData,
  driver1,
  driver2,
  onClose,
  getDriverImage,
  getDriverTeam,
  year,
  mode,
}) => {
  const dataPoint = lapData?.find((d) => d.LapNumber === lapNumber);
  if (!dataPoint) return null;

  const d1Value = dataPoint[driver1];
  const d2Value = driver2 ? dataPoint[driver2] : null;

  const formatValue = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    if (mode === 'gap') return `${val > 0 ? '+' : ''}${val.toFixed(3)}s`;
    return formatLapTime(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-24 left-4 right-4 bg-zinc-900/95 border border-white/10 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-xl"
    >
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-red-600 rounded-full" />
          <h4 className="text-lg font-black italic uppercase text-white">Lap {lapNumber}</h4>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors border border-white/10"
        >
          <Cancel01Icon className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Driver 1 */}
        <div className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-white/5">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-white/10">
              <AvatarImage src={getDriverImage(driver1)} className="object-cover object-top" />
              <AvatarFallback
                className={cn(
                  'text-[10px] font-bold',
                  `bg-f1-${getTeamColorClass(getDriverTeam(driver1))}`
                )}
              >
                {driver1}
              </AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm text-white">{driver1}</span>
          </div>
          <span className="font-mono font-bold text-lg text-white">{formatValue(d1Value)}</span>
        </div>

        {/* Driver 2 */}
        {driver2 && (
          <div className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={getDriverImage(driver2)} className="object-cover object-top" />
                <AvatarFallback
                  className={cn(
                    'text-[10px] font-bold',
                    `bg-f1-${getTeamColorClass(getDriverTeam(driver2))}`
                  )}
                >
                  {driver2}
                </AvatarFallback>
              </Avatar>
              <span className="font-bold text-sm text-white">{driver2}</span>
            </div>
            <span className="font-mono font-bold text-lg text-white">{formatValue(d2Value)}</span>
          </div>
        )}

        {/* Gap Delta (Only for History mode, as Gap mode IS the gap) */}
        {mode === 'history' && driver2 && d1Value !== null && d2Value !== null && (
          <div className="mt-2 pt-2 flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
              Gap Delta
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-mono font-black text-xl',
                  d1Value < d2Value ? 'text-green-500' : 'text-red-500'
                )}
              >
                {d1Value < d2Value ? '-' : '+'}
                {Math.abs(d1Value - d2Value).toFixed(3)}s
              </span>
              <ArrowRight01Icon
                className={cn(
                  'w-4 h-4',
                  d1Value < d2Value ? 'text-green-500 -rotate-45' : 'text-red-500 rotate-45'
                )}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface PaceOverlayProps {
  data: PaceDistributionData;
  onClose: () => void;
  getDriverImage: (code: string) => string | undefined;
  getDriverTeam: (code: string) => string | undefined;
  year: number;
}

const PaceOverlayContent: React.FC<PaceOverlayProps> = ({
  data,
  onClose,
  getDriverImage,
  getDriverTeam,
  year,
}) => {
  const team = getDriverTeam(data.driverCode);
  const color = driverColor(data.driverCode, year);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-24 left-4 right-4 bg-zinc-900/95 border border-white/10 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-xl"
    >
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-white/10">
            <AvatarImage
              src={getDriverImage(data.driverCode)}
              className="object-cover object-top"
            />
            <AvatarFallback
              className={cn('text-[10px] font-bold', `bg-f1-${getTeamColorClass(team)}`)}
            >
              {data.driverCode}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-lg font-black italic uppercase text-white leading-none">
              {data.driverCode}
            </h4>
            <span className="text-[10px] text-gray-500 uppercase font-bold">{team}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors border border-white/10"
        >
          <Cancel01Icon className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
            Median Pace
          </span>
          <span className="font-mono font-black text-xl text-white">
            {formatLapTime(data.median)}
          </span>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
            Fastest Lap
          </span>
          <span className="font-mono font-bold text-lg text-green-500">
            {formatLapTime(data.min)}
          </span>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
            Slowest Lap
          </span>
          <span className="font-mono font-bold text-lg text-red-500">
            {formatLapTime(data.max)}
          </span>
        </div>
        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
            Consistency (IQR)
          </span>
          <span className="font-mono font-bold text-lg text-blue-400">
            {(data.q3 - data.q1).toFixed(3)}s
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] uppercase font-bold text-gray-500">Pace Spread</span>
        </div>
        {/* Mini Box Plot Legend/Vis */}
        <div className="relative h-6 w-full bg-black/40 rounded border border-white/5">
          <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-px bg-white/20"></div>
          <div className="absolute top-1/2 -translate-y-1/2 left-[25%] right-[25%] h-3 bg-white/10 border border-white/30 backdrop-blur-sm"></div>
          <div className="absolute top-1/2 -translate-y-1/2 left-[50%] h-4 w-0.5 bg-white"></div>
        </div>
        <div className="flex justify-between text-[9px] text-gray-600 font-mono mt-1 px-1">
          <span>Min</span>
          <span>Q1</span>
          <span>Med</span>
          <span>Q3</span>
          <span>Max</span>
        </div>
      </div>
    </motion.div>
  );
};
