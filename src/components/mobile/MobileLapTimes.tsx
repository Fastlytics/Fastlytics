import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DetailedRaceResult, fetchLapTimes, fetchPaceDistribution, LapTimeDataPoint, PaceDistributionData, SessionDriver, fetchSessionDrivers } from '@/lib/api';
import { OpenF1Driver } from '@/lib/openf1';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Time01Icon, ArrowDown01Icon, Analytics01Icon, Cancel01Icon } from 'hugeicons-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { driverColor } from '@/lib/driverColor';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileLapTimesProps {
    year: number;
    event: string;
    session: string;
    raceResults: DetailedRaceResult[] | undefined;
    openF1Drivers: OpenF1Driver[];
}

const formatLapTime = (totalSeconds: number | null): string => {
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

const MobileLapTimes: React.FC<MobileLapTimesProps> = ({
    year,
    event,
    session,
    raceResults,
    openF1Drivers
}) => {
    const { profile } = useAuth();
    const [lapAnalysisMode, setLapAnalysisMode] = useState<'history' | 'pace'>('history');

    // --- Driver Selection Logic ---
    const { favDriverCode, rivalDriverCode } = useMemo(() => {
        const favCode = profile?.favorite_driver;
        let rivalCode = null;

        if (favCode && raceResults) {
            const favResult = raceResults.find(r =>
                r.driverCode === favCode ||
                r.fullName.toLowerCase().includes(favCode.toLowerCase())
            );

            if (favResult && favResult.position) {
                const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
                const rivalResult = raceResults.find(r => r.position === rivalPos);
                if (rivalResult) rivalCode = rivalResult.driverCode;
            }
        }
        // Fallback if no favorite or not in results
        if (!favCode || !raceResults?.find(r => r.driverCode === favCode)) {
            const p1 = raceResults?.find(r => r.position === 1)?.driverCode;
            const p2 = raceResults?.find(r => r.position === 2)?.driverCode;
            return { favDriverCode: p1 || '', rivalDriverCode: p2 || '' };
        }

        return { favDriverCode: favCode, rivalDriverCode: rivalCode || '' };
    }, [profile?.favorite_driver, raceResults]);

    const [driver1, setDriver1] = useState<string>(favDriverCode);
    const [driver2, setDriver2] = useState<string>(rivalDriverCode);

    // Update state when props/memo changes (initial load)
    useEffect(() => {
        if (favDriverCode) setDriver1(favDriverCode);
        if (rivalDriverCode) setDriver2(rivalDriverCode);
    }, [favDriverCode, rivalDriverCode]);

    // --- Data Fetching ---

    // 1. Lap History Data
    const { data: lapData, isLoading: isLoadingLaps } = useQuery<LapTimeDataPoint[]>({
        queryKey: ['lapTimes', year, event, session, driver1, driver2],
        queryFn: () => fetchLapTimes(year, event, session, [driver1, driver2].filter(Boolean)),
        enabled: lapAnalysisMode === 'history' && !!driver1,
        staleTime: 1000 * 60 * 5,
    });

    // 2. Pace Distribution Data (Fetch for ALL drivers to show the list)
    const { data: sessionDrivers } = useQuery<SessionDriver[]>({
        queryKey: ['sessionDrivers', year, event, session],
        queryFn: () => fetchSessionDrivers(year, event, session),
        staleTime: Infinity,
    });

    const allDriverCodes = useMemo(() => sessionDrivers?.map(d => d.code) || [], [sessionDrivers]);

    const { data: paceData, isLoading: isLoadingPace } = useQuery<PaceDistributionData[]>({
        queryKey: ['paceDistribution', year, event, session, 'all'], // 'all' as key
        queryFn: () => fetchPaceDistribution(year, event, session, allDriverCodes),
        enabled: lapAnalysisMode === 'pace' && allDriverCodes.length > 0,
        staleTime: 1000 * 60 * 5,
    });

    // --- Helper for Driver Images ---
    const getDriverImage = (code: string) => {
        const driver = openF1Drivers.find(d => d.name_acronym === code);
        return driver?.headshot_url;
    };

    const getDriverTeam = (code: string) => {
        return raceResults?.find(r => r.driverCode === code)?.team;
    };

    // --- Render Helpers ---
    const [selectedLap, setSelectedLap] = useState<number | null>(null);

    // Calculate global min/max for pace bars
    const { globalMinPace, globalMaxPace } = useMemo(() => {
        if (!paceData || paceData.length === 0) return { globalMinPace: 0, globalMaxPace: 0 };
        let min = Infinity;
        let max = -Infinity;
        paceData.forEach(d => {
            if (d.q1 < min) min = d.q1; // Use Q1/Q3 or Min/Max? Let's use Min/Max for full range
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

                {/* Analysis Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-black border border-white/10 p-1">
                    <button
                        onClick={() => setLapAnalysisMode('history')}
                        className={cn(
                            "py-2 text-xs font-black uppercase tracking-wider transition-all",
                            lapAnalysisMode === 'history'
                                ? "bg-red-600 text-white"
                                : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Lap History
                    </button>
                    <button
                        onClick={() => setLapAnalysisMode('pace')}
                        className={cn(
                            "py-2 text-xs font-black uppercase tracking-wider transition-all",
                            lapAnalysisMode === 'pace'
                                ? "bg-red-600 text-white"
                                : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Pace Dist.
                    </button>
                </div>
            </div>

            {/* --- LAP HISTORY VIEW --- */}
            {lapAnalysisMode === 'history' && (
                <div className="space-y-4">
                    {/* Driver Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { value: driver1, setter: setDriver1, label: 'Driver 1' },
                            { value: driver2, setter: setDriver2, label: 'Driver 2' }
                        ].map((control, idx) => (
                            <div key={idx} className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{control.label}</label>
                                <Select value={control.value} onValueChange={control.setter}>
                                    <SelectTrigger className="w-full bg-black border border-white/20 text-white h-10 px-2">
                                        {control.value ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5 border border-white/10">
                                                    <AvatarImage src={getDriverImage(control.value)} />
                                                    <AvatarFallback className={cn("text-[8px] font-bold", `bg-f1-${getTeamColorClass(getDriverTeam(control.value))}`)}>
                                                        {control.value}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-mono font-bold text-sm">{control.value}</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Select" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border border-white/20 text-white max-h-[300px]">
                                        {raceResults?.map(r => (
                                            <SelectItem key={r.driverCode} value={r.driverCode}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-5 h-5 border border-white/10">
                                                        <AvatarImage src={getDriverImage(r.driverCode)} />
                                                        <AvatarFallback className={cn("text-[8px] font-bold", `bg-f1-${getTeamColorClass(r.team)}`)}>
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
                    <div className="w-full overflow-x-auto pb-4 touch-pan-x">
                        <div style={{ width: Math.max(window.innerWidth - 32, (lapData?.length || 0) * 25), height: 300 }}>
                            {isLoadingLaps ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 animate-pulse">Loading Lap Data...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={lapData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        onMouseMove={(e: any) => {
                                            if (e && e.activeLabel) {
                                                // Optional: enable hover support if desired, but for mobile touch/click is better
                                                // setSelectedLap(e.activeLabel);
                                            }
                                        }}
                                        onTouchMove={(e: any) => {
                                            if (e && e.activeLabel) {
                                                setSelectedLap(e.activeLabel);
                                            }
                                        }}
                                        onClick={(e: any) => {
                                            if (e && e.activeLabel) {
                                                setSelectedLap(e.activeLabel);
                                            }
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                        <XAxis
                                            dataKey="LapNumber"
                                            stroke="#666"
                                            tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                        <Tooltip
                                            content={() => null} // Hide default tooltip, using overlay
                                            cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey={driver1}
                                            stroke={driverColor(driver1, year)}
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                            connectNulls
                                        />
                                        {driver2 && (
                                            <Line
                                                type="monotone"
                                                dataKey={driver2}
                                                stroke={driverColor(driver2, year)}
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                                connectNulls
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Detail Overlay */}
                    <AnimatePresence>
                        {selectedLap !== null && (
                            <OverlayContent
                                lapNumber={selectedLap}
                                lapData={lapData}
                                driver1={driver1}
                                driver2={driver2}
                                onClose={() => setSelectedLap(null)}
                                getDriverImage={getDriverImage}
                                getDriverTeam={getDriverTeam}
                                year={year}
                            />
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* --- PACE DISTRIBUTION VIEW --- */}
            {lapAnalysisMode === 'pace' && (
                <div className="space-y-4">
                    {isLoadingPace ? (
                        <div className="text-center py-10 text-gray-500 animate-pulse">Loading Pace Data...</div>
                    ) : (
                        <div className="space-y-3">
                            {paceData?.sort((a, b) => a.median - b.median).map((driverPace) => {
                                const driverCode = driverPace.driverCode;
                                const team = getDriverTeam(driverCode);
                                const color = driverColor(driverCode, year);

                                // Calculate bar position and width
                                const range = globalMaxPace - globalMinPace;
                                const leftPct = ((driverPace.min - globalMinPace) / range) * 100;
                                const widthPct = ((driverPace.max - driverPace.min) / range) * 100;
                                const medianPct = ((driverPace.median - globalMinPace) / range) * 100;

                                return (
                                    <div key={driverCode} className="bg-black border border-white/10 p-3 rounded-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar className="w-8 h-8 border border-white/10 rounded-none">
                                                <AvatarImage src={getDriverImage(driverCode)} className="object-cover object-top" />
                                                <AvatarFallback className={cn("text-[10px] font-bold rounded-none", `bg-f1-${getTeamColorClass(team)}`)}>
                                                    {driverCode}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-sm text-white">{driverCode}</span>
                                                    <span className="font-mono font-bold text-xs text-white">{formatLapTime(driverPace.median)}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Median Pace</div>
                                            </div>
                                        </div>

                                        {/* Pace Bar */}
                                        <div className="relative h-6 bg-zinc-900 rounded-sm w-full overflow-hidden">
                                            {/* Grid lines for context */}
                                            <div className="absolute inset-0 flex justify-between px-1">
                                                <div className="w-px h-full bg-white/5" />
                                                <div className="w-px h-full bg-white/5" />
                                                <div className="w-px h-full bg-white/5" />
                                            </div>

                                            {/* The Range Bar */}
                                            <div
                                                className="absolute top-1 bottom-1 rounded-sm opacity-60"
                                                style={{
                                                    left: `${leftPct}%`,
                                                    width: `${widthPct}%`,
                                                    backgroundColor: color
                                                }}
                                            />

                                            {/* Median Marker */}
                                            <div
                                                className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-[0_0_4px_rgba(0,0,0,0.5)]"
                                                style={{ left: `${medianPct}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] text-gray-600 font-mono mt-1 px-1">
                                            <span>{formatLapTime(driverPace.min)}</span>
                                            <span>{formatLapTime(driverPace.max)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileLapTimes;

interface OverlayContentProps {
    lapNumber: number;
    lapData: LapTimeDataPoint[] | undefined;
    driver1: string;
    driver2: string;
    onClose: () => void;
    getDriverImage: (code: string) => string | undefined;
    getDriverTeam: (code: string) => string | undefined;
    year: number;
}

const OverlayContent: React.FC<OverlayContentProps> = ({
    lapNumber,
    lapData,
    driver1,
    driver2,
    onClose,
    getDriverImage,
    getDriverTeam,
    year
}) => {
    const dataPoint = lapData?.find(d => d.LapNumber === lapNumber);
    if (!dataPoint) return null;

    const d1Time = dataPoint[driver1];
    const d2Time = driver2 ? dataPoint[driver2] : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-4 right-4 bg-zinc-900/95 border border-white/10 p-3 rounded-xl shadow-2xl z-50 backdrop-blur-md"
        >
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                <h4 className="text-base font-black italic uppercase text-white">Lap {lapNumber}</h4>
                <button
                    onClick={onClose}
                    className="p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    <Cancel01Icon className="w-3 h-3 text-white" />
                </button>
            </div>

            <div className="space-y-2">
                {/* Driver 1 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 border border-white/10">
                            <AvatarImage src={getDriverImage(driver1)} />
                            <AvatarFallback className={cn("text-[8px] font-bold", `bg-f1-${getTeamColorClass(getDriverTeam(driver1))}`)}>
                                {driver1}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm text-white">{driver1}</span>
                    </div>
                    <span className="font-mono font-bold text-base text-white">
                        {formatLapTime(d1Time)}
                    </span>
                </div>

                {/* Driver 2 */}
                {driver2 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border border-white/10">
                                <AvatarImage src={getDriverImage(driver2)} />
                                <AvatarFallback className={cn("text-[8px] font-bold", `bg-f1-${getTeamColorClass(getDriverTeam(driver2))}`)}>
                                    {driver2}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-sm text-white">{driver2}</span>
                        </div>
                        <span className="font-mono font-bold text-base text-white">
                            {formatLapTime(d2Time)}
                        </span>
                    </div>
                )}

                {/* Gap */}
                {driver2 && d1Time !== null && d2Time !== null && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs uppercase font-bold text-gray-500">Gap</span>
                        <span className="font-mono font-bold text-yellow-500">
                            +{Math.abs(d1Time - d2Time).toFixed(3)}s
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
