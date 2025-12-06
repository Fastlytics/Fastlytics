import React, { useState, useMemo, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { cn, formatTime } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import {
    fetchTelemetryThrottle,
    fetchTelemetryBrake,
    fetchTelemetryRPM,
    fetchTelemetryDRS,
    fetchTelemetrySpeed,
    fetchGearShiftMap,
    fetchLapTimes,
    ThrottleDataPoint,
    BrakeDataPoint,
    RPMDataPoint,
    DRSDataPoint,
    SpeedDataPoint,
    GearShiftMapData,
    DetailedRaceResult
} from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { driverColor } from '@/lib/driverColor';
import { OpenF1Driver } from '@/lib/openf1';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSpeed02Icon, Settings01Icon, ArrowRight01Icon, ZapIcon, Cancel01Icon } from 'hugeicons-react';

// --- Types ---
type TelemetryType = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gear';
type TelemetryDataPoint = ThrottleDataPoint | BrakeDataPoint | RPMDataPoint | DRSDataPoint | SpeedDataPoint | { Distance: number, value: number };

interface MobileTelemetryProps {
    year: number;
    event: string;
    session: string;
    openF1Drivers: OpenF1Driver[];
    raceResults?: DetailedRaceResult[];
}

// --- Gear Map Helpers ---
const gearColors = [
    '#33bbee', // 1st
    '#ee7733', // 2nd
    '#009988', // 3rd
    '#cc3311', // 4th
    '#ee3377', // 5th
    '#0077bb', // 6th
    '#aacc00', // 7th
    '#ffdd55'  // 8th
];

const getGearColor = (gear: number): string => {
    if (gear >= 1 && gear <= gearColors.length) {
        return gearColors[gear - 1];
    }
    return '#6B7280';
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

// --- Main Component ---

const MobileTelemetry: React.FC<MobileTelemetryProps> = ({
    year, event, session, openF1Drivers, raceResults
}) => {
    // State
    const [telemetryType, setTelemetryType] = useState<TelemetryType>('speed');
    const [driver, setDriver] = useState<string>('');
    const [selectedLap, setSelectedLap] = useState<string>('fastest');
    const [hoveredGear, setHoveredGear] = useState<number | null>(null);
    const [isRotated, setIsRotated] = useState(true);
    const [activeDataPoint, setActiveDataPoint] = useState<any | null>(null);
    const [selectedDataPoint, setSelectedDataPoint] = useState<any | null>(null);

    // Initialize driver
    useEffect(() => {
        if (raceResults && raceResults.length > 0 && !driver) {
            // Default to P1
            const p1 = raceResults.find(r => r.position === 1);
            if (p1) setDriver(p1.driverCode);
            else setDriver(raceResults[0].driverCode);
        }
    }, [raceResults]);

    // Fetch available laps for driver
    const { data: availableLaps } = useQuery({
        queryKey: ['driverLaps', year, event, session, driver],
        queryFn: () => fetchLapTimes(year, event, session, [driver]),
        enabled: !!driver,
    });

    // Reset selected lap when driver changes
    useEffect(() => {
        setSelectedLap('fastest');
    }, [driver]);

    const getDriverImage = (driverCode: string, driverName: string) => {
        const d = openF1Drivers.find(d =>
            d.name_acronym === driverCode ||
            d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || '')
        );
        return d?.headshot_url;
    };

    const getDriverDetails = (code: string) => raceResults?.find(r => r.driverCode === code);

    // Data Fetching
    const fetchTelemetry = async (tType: TelemetryType, drv: string, lap: string) => {
        switch (tType) {
            case 'throttle': return fetchTelemetryThrottle(year, event, session, drv, lap);
            case 'brake': return fetchTelemetryBrake(year, event, session, drv, lap);
            case 'rpm': return fetchTelemetryRPM(year, event, session, drv, lap);
            case 'drs': return fetchTelemetryDRS(year, event, session, drv, lap);
            case 'speed': return fetchTelemetrySpeed(year, event, session, drv, lap);
            case 'gear': return fetchGearShiftMap(year, event, session, drv, lap);
            default: return fetchTelemetrySpeed(year, event, session, drv, lap);
        }
    };

    const { data: telemetryData, isLoading } = useQuery({
        queryKey: ['mobileTelemetry', telemetryType, year, event, session, driver, selectedLap],
        queryFn: () => fetchTelemetry(telemetryType, driver, selectedLap),
        enabled: !!driver,
    });

    // Data Processing
    const chartData = useMemo(() => {
        if (!telemetryData || telemetryType === 'gear') return [];
        const data = telemetryData as any[];

        const getValueKey = (type: TelemetryType) => {
            switch (type) {
                case 'throttle': return 'Throttle';
                case 'brake': return 'Brake';
                case 'rpm': return 'RPM';
                case 'drs': return 'DRS';
                case 'speed': return 'Speed';
                default: return 'Speed';
            }
        };
        const valueKey = getValueKey(telemetryType);

        // Downsample if too many points
        const finalData = data.length > 3000
            ? data.filter((_, i) => i % 2 === 0)
            : data;

        const result = finalData.map(point => ({
            Distance: point.Distance,
            [driver]: point[valueKey]
        }));

        return result;

    }, [telemetryData, driver, telemetryType]);

    // Stats Calculation
    const stats = useMemo(() => {
        if (telemetryType === 'gear') {
            if (!telemetryData) return null;
            const gearData = telemetryData as GearShiftMapData;
            return {
                max: gearData.stats.mostUsedGear,
                avg: gearData.stats.avgGear,
                label: 'Gear Stats',
                unit: ''
            };
        }

        if (!chartData.length) return null;
        const values = chartData.map(d => d[driver] as number).filter(v => v !== null && v !== undefined);
        if (!values.length) return { max: 0, avg: 0 };

        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { max, avg };
    }, [chartData, driver, telemetryData, telemetryType]);

    // Chart Config
    const getChartConfig = () => {
        switch (telemetryType) {
            case 'throttle': return { color: '#10b981', domain: [0, 100], unit: '%', label: 'Throttle' };
            case 'brake': return { color: '#ef4444', domain: [0, 100], unit: '%', label: 'Brake' };
            case 'rpm': return { color: '#fb923c', domain: [0, 13000], unit: 'RPM', label: 'RPM' };
            case 'drs': return { color: '#3b82f6', domain: [-0.1, 1.1], unit: '', label: 'DRS' };
            case 'speed': return { color: '#3b82f6', domain: ['auto', 'auto'], unit: 'km/h', label: 'Speed' };
            case 'gear': return { color: '#ffffff', domain: [0, 8], unit: '', label: 'Gear Map' };
        }
    };
    const config = getChartConfig();
    const dColor = driverColor(driver, year);

    // Calculate fastest lap time
    const fastestLapTime = useMemo(() => {
        if (!availableLaps || !driver) return null;
        const times = availableLaps
            .map(l => l[driver] as number | null)
            .filter((t): t is number => t !== null && t > 0);
        return times.length > 0 ? Math.min(...times) : null;
    }, [availableLaps, driver]);

    return (
        <div className="animate-in fade-in duration-500 pb-24 pt-2 space-y-6">

            {/* 1. Driver and Lap Selection Grid */}
            <div className="grid grid-cols-2 gap-3 px-1">
                {/* Driver Selector */}
                <Select
                    value={driver}
                    onValueChange={setDriver}
                    disabled={!raceResults}
                >
                    <SelectTrigger className="w-full bg-black border border-white/20 text-white h-14 px-3 rounded-xl shadow-lg">
                        {driver ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                                    <AvatarImage src={getDriverImage(driver, getDriverDetails(driver)?.fullName || '')} />
                                    <AvatarFallback className={cn("text-[10px] font-bold", `bg-f1-${getTeamColorClass(getDriverDetails(driver)?.team)}`)}>
                                        {driver}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="font-black font-mono text-xl uppercase leading-none tracking-wide truncate">{driver}</span>
                                    <span className="text-[9px] text-gray-500 uppercase font-mono leading-none mt-1">{getDriverDetails(driver)?.team}</span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500">Select Driver</span>
                        )}
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20 text-white max-h-[300px]">
                        <SelectGroup>
                            <SelectLabel className="text-xs text-gray-500 uppercase">Drivers</SelectLabel>
                            {raceResults?.map((d) => (
                                <SelectItem
                                    key={d.driverCode}
                                    value={d.driverCode}
                                    className="text-xs font-mono focus:bg-gray-800 focus:text-white pl-2 py-2"
                                >
                                    <div className="flex items-center gap-3 w-full">
                                        <Avatar className="w-6 h-6 border border-white/10">
                                            <AvatarImage src={getDriverImage(d.driverCode, d.fullName)} />
                                            <AvatarFallback className={cn("text-[10px] font-bold", `bg-f1-${getTeamColorClass(d.team)}`)}>
                                                {d.driverCode}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-bold uppercase font-mono text-lg">{d.driverCode}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Lap Selector */}
                <Select
                    value={selectedLap.toString()}
                    onValueChange={(val) => setSelectedLap(val)}
                    disabled={!availableLaps}
                >
                    <SelectTrigger className="w-full bg-black border border-white/20 text-white h-14 px-3 rounded-xl shadow-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-full shrink-0">
                                <DashboardSpeed02Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <span className="font-black font-mono text-sm uppercase leading-none tracking-wide truncate">
                                    {selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}
                                </span>
                                <span className="text-[9px] text-gray-500 uppercase font-mono leading-none mt-1">Select Lap</span>
                            </div>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20 text-white max-h-[300px]">
                        <SelectGroup>
                            <SelectLabel className="text-xs text-gray-500 uppercase">Laps</SelectLabel>
                            <SelectItem value="fastest" className="text-xs font-mono focus:bg-gray-800 focus:text-white">
                                <div className="flex justify-between w-full gap-4">
                                    <span className="font-bold uppercase text-purple-400">Fastest Lap</span>
                                    <span className="text-purple-400">{fastestLapTime ? formatTime(fastestLapTime) : '-'}</span>
                                </div>
                            </SelectItem>
                            {availableLaps?.map((lap) => {
                                const lapTime = lap[driver] as number | null;
                                return (
                                    <SelectItem
                                        key={lap.LapNumber}
                                        value={lap.LapNumber.toString()}
                                        className="text-xs font-mono focus:bg-gray-800 focus:text-white"
                                    >
                                        <div className="flex justify-between w-full gap-4">
                                            <span>Lap {lap.LapNumber}</span>
                                            <span className="text-gray-400">{lapTime ? formatTime(lapTime) : '-'}</span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* 2. Telemetry Navigation */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide px-1 snap-x">
                {['speed', 'throttle', 'brake', 'rpm', 'drs', 'gear'].map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setTelemetryType(t as TelemetryType);
                            setActiveDataPoint(null);
                        }}
                        className={cn(
                            "flex-shrink-0 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-full border transition-all snap-start",
                            telemetryType === t
                                ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                : "bg-zinc-900 text-gray-500 border-white/10 hover:border-white/30"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* 3. Main Visualization Area */}
            <div className="relative min-h-[400px]">

                {/* HUD Overlay (Stats) */}
                <div className="flex justify-between items-end px-2 mb-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Current View</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black italic text-white uppercase">{config.label}</span>
                            {isLoading && <LoadingSpinnerF1 className="w-4 h-4" />}
                        </div>
                    </div>

                    {/* Active Value or Max Stats */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">
                            {activeDataPoint ? 'At Cursor' : (telemetryType === 'gear' ? 'Most Used' : 'Max Value')}
                        </span>
                        <span className={cn("text-2xl font-mono font-bold leading-none", activeDataPoint ? "text-white" : "text-gray-400")} style={{ color: activeDataPoint ? undefined : dColor }}>
                            {activeDataPoint
                                ? Math.round(activeDataPoint.value)
                                : (stats ? Math.round(stats.max) : '-')}
                            <span className="text-xs ml-1 text-gray-600">{config.unit}</span>
                        </span>
                    </div>
                </div>

                {/* Chart / Map Container */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden relative shadow-inner">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
                            <LoadingSpinnerF1 />
                        </div>
                    )}

                    {!isLoading && (
                        telemetryType === 'gear' ? (
                            // --- GEAR MAP ---
                            <div className="relative w-full h-[450px] flex items-center justify-center bg-black/40">
                                {/* Rotate Control */}
                                <button
                                    onClick={() => setIsRotated(!isRotated)}
                                    className="absolute top-3 left-3 z-20 bg-black/60 border border-white/20 text-white p-2 rounded-lg backdrop-blur-md hover:bg-white/10 transition-colors"
                                >
                                    <Settings01Icon className={cn("w-4 h-4 transition-transform duration-500", isRotated ? "rotate-90" : "")} />
                                </button>

                                {/* Map */}
                                <svg
                                    viewBox="0 0 1000 500"
                                    className={cn(
                                        "w-full h-full transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                                        isRotated ? "rotate-90 scale-[2.2]" : "scale-100"
                                    )}
                                    preserveAspectRatio="xMidYMid meet"
                                >
                                    <g transform={isRotated ? "scale(1,-1) translate(0,-500)" : ""}>
                                        <path
                                            d={(telemetryData as GearShiftMapData)?.circuitLayout}
                                            fill="none"
                                            stroke="#1f2937"
                                            strokeWidth="24"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {(telemetryData as GearShiftMapData)?.segments.map((segment, index) => (
                                            <path
                                                key={index}
                                                d={segment.path}
                                                fill="none"
                                                stroke={getGearColor(segment.gear)}
                                                strokeWidth={hoveredGear === segment.gear ? "28" : "16"}
                                                strokeLinecap="butt"
                                                strokeLinejoin="round"
                                                className="transition-all duration-200 cursor-pointer"
                                                style={{ opacity: hoveredGear !== null && hoveredGear !== segment.gear ? 0.2 : 1 }}
                                                onClick={() => setHoveredGear(segment.gear === hoveredGear ? null : segment.gear)}
                                            />
                                        ))}
                                    </g>
                                </svg>

                                {/* Gear Legend Overlay */}
                                <div className="absolute bottom-3 left-3 right-3 z-20">
                                    <div className="bg-black/80 border border-white/10 rounded-lg p-2 backdrop-blur-md flex justify-between items-center">
                                        {gearColors.map((c, i) => {
                                            const gear = i + 1;
                                            const isHovered = hoveredGear === gear;
                                            return (
                                                <button
                                                    key={gear}
                                                    onClick={() => setHoveredGear(isHovered ? null : gear)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1 transition-all",
                                                        hoveredGear !== null && !isHovered ? "opacity-30 scale-90" : "opacity-100 scale-100"
                                                    )}
                                                >
                                                    <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: c, color: c }} />
                                                    <span className="text-[9px] font-mono text-gray-400 font-bold">{gear}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // --- LINE CHART ---
                            chartData.length > 0 ? (
                                <div className="h-[400px] w-full min-w-0 relative">
                                    {/* Grid Background */}
                                    <div className="absolute inset-0 pointer-events-none opacity-10"
                                        style={{
                                            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                                            backgroundSize: '40px 40px'
                                        }}
                                    />

                                    <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                                        <LineChart
                                            data={chartData}
                                            margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                                            onMouseMove={(state: any) => {
                                                if (state.isTooltipActive && state.activePayload && state.activePayload.length) {
                                                    setActiveDataPoint({
                                                        distance: state.activeLabel,
                                                        value: state.activePayload[0].value
                                                    });
                                                } else {
                                                    setActiveDataPoint(null);
                                                }
                                            }}
                                            onMouseLeave={() => setActiveDataPoint(null)}
                                            onClick={(state: any) => {
                                                console.log('Chart clicked:', state);
                                                if (state && state.activePayload && state.activePayload.length) {
                                                    console.log('Setting selected data point:', state.activePayload[0]);
                                                    setSelectedDataPoint({
                                                        distance: state.activeLabel,
                                                        value: state.activePayload[0].value
                                                    });
                                                } else if (state && state.activeTooltipIndex !== undefined && chartData[state.activeTooltipIndex]) {
                                                    // Fallback using index
                                                    const point = chartData[state.activeTooltipIndex];
                                                    console.log('Fallback click using index:', point);
                                                    setSelectedDataPoint({
                                                        distance: point.Distance,
                                                        value: point[driver]
                                                    });
                                                } else {
                                                    console.log('No active payload found in click event');
                                                }
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                            <XAxis
                                                dataKey="Distance"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                hide
                                            />
                                            <YAxis
                                                domain={config.domain as any}
                                                hide
                                            />
                                            <Tooltip
                                                content={() => null}
                                                cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                isAnimationActive={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={driver}
                                                stroke={dColor}
                                                strokeWidth={2.5}
                                                dot={false}
                                                activeDot={{
                                                    r: 6,
                                                    fill: dColor,
                                                    stroke: '#fff',
                                                    strokeWidth: 2,
                                                    onClick: (e: any, payload: any) => {
                                                        // Fallback click handler on the active dot itself
                                                        if (payload && payload.payload) {
                                                            setSelectedDataPoint({
                                                                distance: payload.payload.Distance,
                                                                value: payload.value
                                                            });
                                                        }
                                                    }
                                                }}
                                                connectNulls
                                                animationDuration={500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>

                                    {/* Active Point Indicator (Bottom) */}
                                    {activeDataPoint && !selectedDataPoint && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 px-3 py-1 rounded-full backdrop-blur text-xs font-mono text-white pointer-events-none">
                                            {(activeDataPoint.distance / 1000).toFixed(2)} km
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-gray-500 gap-2">
                                    <DashboardSpeed02Icon className="w-8 h-8 opacity-50" />
                                    <span className="font-mono uppercase text-xs">No Data Available</span>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>

            {/* 4. Stats Cards (Below Chart) */}
            {stats && telemetryType !== 'gear' && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 border border-white/10 p-3 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Session Max</span>
                        <span className="text-xl font-mono font-bold text-white">
                            {Math.round(stats.max)}<span className="text-xs text-gray-500 ml-1">{config.unit}</span>
                        </span>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/10 p-3 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Session Avg</span>
                        <span className="text-xl font-mono font-bold text-white">
                            {Math.round(stats.avg)}<span className="text-xs text-gray-500 ml-1">{config.unit}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Detailed Overlay */}
            <AnimatePresence>
                {selectedDataPoint && (
                    <TelemetryOverlay
                        data={selectedDataPoint}
                        config={config}
                        stats={stats}
                        onClose={() => setSelectedDataPoint(null)}
                        driverColor={dColor}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileTelemetry;

interface TelemetryOverlayProps {
    data: { distance: number; value: number };
    config: { label: string; unit: string; domain: any[] };
    stats: { max: number; avg: number } | null;
    onClose: () => void;
    driverColor: string;
}

const TelemetryOverlay: React.FC<TelemetryOverlayProps> = ({ data, config, stats, onClose, driverColor }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 left-4 right-4 bg-zinc-900/95 border border-white/10 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-xl"
        >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: driverColor }} />
                    <h4 className="text-lg font-black italic uppercase text-white">{config.label} Detail</h4>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors border border-white/10"
                >
                    <Cancel01Icon className="w-4 h-4 text-white" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Value</span>
                    <span className="font-mono font-black text-3xl text-white leading-none">
                        {Math.round(data.value)}<span className="text-sm text-gray-500 ml-1">{config.unit}</span>
                    </span>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Distance</span>
                    <span className="font-mono font-bold text-xl text-white leading-none">
                        {(data.distance / 1000).toFixed(3)}<span className="text-xs text-gray-500 ml-1">km</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
};
