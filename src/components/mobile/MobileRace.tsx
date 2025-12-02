import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft01Icon, ChampionIcon, Clock01Icon, FlashIcon, Calendar01Icon,
    Flag01Icon, CheckmarkCircle02Icon, Time01Icon,
    Analytics01Icon, Cancel01Icon, MapsLocation01Icon, StartUp02Icon, ArrowDown01Icon
} from 'hugeicons-react';
import { fetchSpecificRaceResults, fetchAvailableSessions, fetchEventSessionSchedule, DetailedRaceResult, AvailableSession, EventSessionSchedule } from '@/lib/api';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import MobilePageHeader from './MobilePageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import posthog from 'posthog-js';

// Driver image map for 2025
const driverImageMap: Record<string, string> = {
    "ALB": "/drivers/2025williamsalealb01right.avif",
    "ALO": "/drivers/2025astonmartinferalo01right.avif",
    "BEA": "/drivers/2025haasf1teamolibea01right.avif",
    "BOR": "/drivers/2025kicksaubergabbor01right.avif",
    "COL": "/drivers/2025alpinefracol01right.avif",
    "GAS": "/drivers/2025alpinepiegas01right.avif",
    "HAD": "/drivers/2025racingbullsisahad01right.avif",
    "HAM": "/drivers/2025ferrarilewham01right.avif",
    "HUL": "/drivers/2025kicksaubernichul01right.avif",
    "LAW": "/drivers/2025racingbullslialaw01right.avif",
    "LEC": "/drivers/2025ferrarichalec01right.avif",
    "NOR": "/drivers/2025mclarenlannor01right.avif",
    "OCO": "/drivers/2025haasf1teamestoco01right.avif",
    "PIA": "/drivers/2025mclarenoscpia01right.avif",
    "RUS": "/drivers/2025mercedesgeorus01right.avif",
    "SAI": "/drivers/2025williamscarsai01right.avif",
    "STR": "/drivers/2025astonmartinlanstr01right.avif",
    "TSU": "/drivers/2025redbullracingyuktsu01right.avif",
    "VER": "/drivers/2025redbullracingmaxver01right.avif",
    "ANT": "/drivers/2025mercedesandant01right.avif",
};

// --- Helper Functions ---
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

const parseLapTime = (timeStr: string | null | undefined): number => {
    if (!timeStr) return Infinity;
    try {
        const parts = timeStr.split(/[:.]/);
        if (parts.length === 3) {
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
        } else if (parts.length === 2) {
            return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 1000;
        }
    } catch (e) { }
    return Infinity;
};

const formatRaceTime = (timeStr: string | null | undefined, isWinner: boolean = false): string => {
    if (!timeStr) return '-';
    if (isWinner) {
        try {
            const parts = timeStr.split(/[:.]/);
            if (parts.length === 3) {
                const totalMinutes = parseInt(parts[0], 10);
                const seconds = parseInt(parts[1], 10);
                const milliseconds = parts[2];
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
            }
        } catch (e) { return timeStr; }
        return timeStr;
    }
    if (timeStr.match(/^[A-Za-z]/)) return timeStr;
    let processedTime = timeStr.startsWith('+') ? timeStr.substring(1) : timeStr;
    try {
        const parts = processedTime.split(/[:.]/);
        if (parts.length === 3) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            const milliseconds = parts[2];
            const totalSeconds = minutes * 60 + seconds;
            if (totalSeconds >= 60) {
                const displayMinutes = Math.floor(totalSeconds / 60);
                const displaySeconds = totalSeconds % 60;
                return `+${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds}`;
            } else {
                return `+${totalSeconds}.${milliseconds}`;
            }
        }
    } catch (e) { }
    return timeStr;
};

// Countdown Component
const MobileCountdown = ({ targetDate }: { targetDate: Date }) => {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +targetDate - +new Date();
            if (difference > 0) {
                return {
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                    s: Math.floor((difference / 1000) % 60),
                };
            }
            return { d: 0, h: 0, m: 0, s: 0 };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
        <div className="flex items-center justify-center gap-3">
            {[
                { value: timeLeft.d, label: 'Days' },
                { value: timeLeft.h, label: 'Hrs' },
                { value: timeLeft.m, label: 'Min' },
                { value: timeLeft.s, label: 'Sec', highlight: true },
            ].map((item, idx) => (
                <React.Fragment key={item.label}>
                    <div className="flex flex-col items-center">
                        <div className={`text-3xl font-black font-mono ${item.highlight ? 'text-red-500' : 'text-white'}`}>
                            {pad(item.value)}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500">{item.label}</div>
                    </div>
                    {idx < 3 && <span className="text-2xl font-bold text-gray-700 -mt-4">:</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

// Session Selector Modal
interface SessionSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: AvailableSession[];
    selectedSession: string;
    onSelect: (session: string) => void;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({ isOpen, onClose, sessions, selectedSession, onSelect }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-md bg-gray-900 rounded-t-3xl border-t border-gray-700 pb-24"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-gray-600 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                        <h3 className="text-lg font-bold uppercase tracking-tight">Select Session</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <Cancel01Icon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-3 max-h-80 overflow-y-auto">
                        {sessions.filter(s => s.type !== 'Q').map(session => (
                            <button
                                key={session.type}
                                onClick={() => {
                                    onSelect(session.type);
                                    onClose();
                                }}
                                className={`w-full p-4 text-left rounded-xl transition-all flex items-center justify-between mb-1 ${selectedSession === session.type
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    }`}
                            >
                                <span className="text-base font-bold uppercase">{session.name}</span>
                                {selectedSession === session.type && (
                                    <CheckmarkCircle02Icon className="w-5 h-5" />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Schedule Session Card
interface ScheduleSessionCardProps {
    session: { name: string; date: string; localTime: string | null };
    isNext: boolean;
    isLive: boolean;
    isAvailable: boolean;
    is24Hour: boolean;
    onViewResults: () => void;
}

const ScheduleSessionCard: React.FC<ScheduleSessionCardProps> = ({
    session, isNext, isLive, isAvailable, is24Hour, onViewResults
}) => {
    const sessionDate = new Date(session.date);
    const dayName = sessionDate.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = sessionDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

    const formatLocalTime = (timeStr: string | null) => {
        if (!timeStr) return '-';
        if (is24Hour) return timeStr;
        try {
            const [h, m] = timeStr.split(':');
            const hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${m} ${ampm}`;
        } catch (e) { return timeStr; }
    };

    const formatUserTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: !is24Hour
            });
        } catch (e) { return '-'; }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "rounded-xl overflow-hidden",
                isNext ? "bg-red-950 border-2 border-red-600" : "bg-gray-900 border border-gray-800"
            )}
        >
            <div className="p-4">
                <div className="flex items-center justify-between">
                    {/* Left: Date & Session Name */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-lg flex flex-col items-center justify-center",
                            isNext ? "bg-red-900/50" : "bg-gray-800"
                        )}>
                            <span className="text-[10px] uppercase text-gray-500 font-bold">{dayName}</span>
                            <span className={cn("text-sm font-black", isNext ? "text-red-400" : "text-white")}>
                                {sessionDate.getDate()}
                            </span>
                        </div>
                        <div>
                            <h3 className={cn(
                                "font-bold text-base uppercase tracking-tight",
                                isNext ? "text-red-400" : "text-white"
                            )}>
                                {session.name}
                            </h3>
                            {isNext && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Next Up</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Time or Status */}
                    <div className="text-right">
                        {isLive ? (
                            <div className="flex items-center gap-2 text-red-500">
                                <div className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </div>
                                <span className="font-bold uppercase text-xs">LIVE</span>
                            </div>
                        ) : isAvailable ? (
                            <button
                                onClick={onViewResults}
                                className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                            >
                                Results
                            </button>
                        ) : (
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-xs text-gray-500 uppercase">Local</span>
                                    <span className="text-sm font-mono text-gray-400">{formatLocalTime(session.localTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-xs text-gray-500 uppercase">You</span>
                                    <span className={cn("text-sm font-mono font-bold", isNext ? "text-white" : "text-gray-300")}>
                                        {formatUserTime(session.date)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Race Analysis Bottom Nav
interface RaceBottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    hasStrategy: boolean;
}

const RaceBottomNav: React.FC<RaceBottomNavProps> = ({ activeTab, onTabChange, hasStrategy }) => {
    const tabs = [
        { id: 'overview', label: 'Overview', icon: ChampionIcon },
        ...(hasStrategy ? [{ id: 'strategy', label: 'Strategy', icon: Flag01Icon }] : []),
        { id: 'laptimes', label: 'Laps', icon: Time01Icon },
        { id: 'h2h', label: 'H2H', icon: MapsLocation01Icon },
        { id: 'telemetry', label: 'Data', icon: Analytics01Icon },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 safe-area-pb">
            <div className="flex items-center justify-around px-2 py-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                                isActive ? "text-red-500" : "text-gray-500"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Highlight Card Types
type HighlightType = 'winner' | 'fastestLap' | 'pole';

interface HighlightCardData {
    type: HighlightType;
    driver: DetailedRaceResult;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    borderColor: string;
    textColor: string;
    timeLabel: string;
    timeValue: string;
}

// Individual Highlight Card
interface HighlightCardProps {
    data: HighlightCardData;
    getDriverImage: (code: string, name: string) => string | undefined;
    getTeamColorClass: (team: string | undefined) => string;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ data, getDriverImage, getTeamColorClass }) => {
    const Icon = data.icon;

    return (
        <div className={cn("rounded-2xl border p-6", data.bgColor, data.borderColor)}>
            <div className="flex items-start gap-4">
                <Avatar className={cn("w-16 h-16 border-2", data.borderColor)}>
                    <AvatarImage
                        src={getDriverImage(data.driver.driverCode, data.driver.fullName)}
                        className="object-cover object-top"
                    />
                    <AvatarFallback className={cn("text-lg font-bold", `bg-f1-${getTeamColorClass(data.driver.team)}`)}>
                        {data.driver.driverCode}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={cn("w-4 h-4", data.textColor)} />
                        <span className={cn("text-xs font-bold uppercase tracking-wider", data.textColor)}>{data.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-xl font-black uppercase italic text-white">{data.driver.fullName}</h3>
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", `bg-f1-${getTeamColorClass(data.driver.team)}`)} />
                        <span className="text-sm text-gray-400">{data.driver.team}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase">{data.timeLabel}</span>
                        <span className="text-sm font-mono text-gray-300">{data.timeValue}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stacked Swipeable Cards Component
interface StackedHighlightCardsProps {
    highlights: HighlightCardData[];
    getDriverImage: (code: string, name: string) => string | undefined;
    getTeamColorClass: (team: string | undefined) => string;
}

const StackedHighlightCards: React.FC<StackedHighlightCardsProps> = ({
    highlights,
    getDriverImage,
    getTeamColorClass
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const x = useMotionValue(0);

    const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50;
        if (Math.abs(info.offset.x) > threshold) {
            // Swipe detected
            if (info.offset.x < 0) {
                // Swipe left - go to next
                setCurrentIndex(prev => (prev + 1) % highlights.length);
            } else {
                // Swipe right - go to previous
                setCurrentIndex(prev => (prev - 1 + highlights.length) % highlights.length);
            }
        }
        x.set(0);
    }, [highlights.length, x]);

    if (highlights.length === 0) return null;

    return (
        <div className="relative h-[200px]">
            {/* Card Stack */}
            {highlights.map((highlight, index) => {
                // Calculate position relative to current
                const relativeIndex = (index - currentIndex + highlights.length) % highlights.length;
                const isTop = relativeIndex === 0;
                const isSecond = relativeIndex === 1;
                const isThird = relativeIndex === 2;

                // Stack effect: cards behind are slightly scaled down and offset
                const scale = isTop ? 1 : isSecond ? 0.95 : 0.9;
                const yOffset = isTop ? 0 : isSecond ? 8 : 16;
                const zIndex = isTop ? 30 : isSecond ? 20 : 10;
                const opacity = isTop ? 1 : isSecond ? 0.7 : 0.4;

                return (
                    <motion.div
                        key={highlight.type}
                        className="absolute inset-0"
                        style={{
                            zIndex,
                            x: isTop ? x : 0,
                        }}
                        animate={{
                            scale,
                            y: yOffset,
                            opacity,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        drag={isTop ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={isTop ? handleDragEnd : undefined}
                    >
                        <HighlightCard
                            data={highlight}
                            getDriverImage={getDriverImage}
                            getTeamColorClass={getTeamColorClass}
                        />
                    </motion.div>
                );
            })}

            {/* Indicator Dots */}
            {highlights.length > 1 && (
                <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {highlights.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                index === currentIndex ? "bg-white w-4" : "bg-gray-600"
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Swipe hint */}
            {highlights.length > 1 && (
                <div className="absolute -bottom-0 right-0 flex items-center gap-1 text-gray-600">
                    <span className="text-[10px] uppercase tracking-wider">Swipe</span>
                    <ArrowLeft01Icon className="w-3 h-3 rotate-180" />
                </div>
            )}
        </div>
    );
};

// Result Row Component with Driver Image
interface ResultRowProps {
    result: DetailedRaceResult;
    position: number;
    sessionType: string;
    isFavorite: boolean;
    driverImage?: string;
    isExpanded: boolean;
    onToggle: () => void;
}

const ResultRow: React.FC<ResultRowProps> = ({ result, position, sessionType, isFavorite, driverImage, isExpanded, onToggle }) => {
    const isRaceOrSprint = sessionType === 'R' || sessionType === 'Sprint';
    const isPodium = position <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "rounded-xl transition-colors overflow-hidden border",
                isFavorite ? "bg-red-900/20 border-red-600" : "bg-gray-900 border-transparent"
            )}
        >
            {/* Main Row - Clickable */}
            <div
                className="flex items-center gap-3 p-3 cursor-pointer active:bg-gray-800/50"
                onClick={onToggle}
            >
                {/* Position */}
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                    isPodium ? (
                        position === 1 ? "bg-yellow-900/50 text-yellow-500" :
                            position === 2 ? "bg-gray-700 text-gray-300" :
                                "bg-amber-900/50 text-amber-500"
                    ) : "bg-gray-800 text-gray-400"
                )}>
                    {position}
                </div>

                {/* Driver Avatar */}
                <Avatar className="w-10 h-10 border border-gray-700">
                    <AvatarImage src={driverImage} className="object-cover object-top" />
                    <AvatarFallback className={cn("text-xs font-bold", `bg-f1-${getTeamColorClass(result.team)}`)}>
                        {result.driverCode}
                    </AvatarFallback>
                </Avatar>

                {/* Driver Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate">{result.fullName}</span>
                        {result.isFastestLap && <Clock01Icon className="w-3 h-3 text-purple-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", `bg-f1-${getTeamColorClass(result.team)}`)} />
                        <span className="text-xs text-gray-500 truncate">{result.team}</span>
                    </div>
                </div>

                {/* Time/Gap + Expand Indicator */}
                <div className="flex items-center gap-2">
                    <div className="text-right flex-shrink-0">
                        {isRaceOrSprint ? (
                            <>
                                <div className="text-xs font-mono text-gray-300">
                                    {formatRaceTime(result.time, position === 1)}
                                </div>
                                {result.points !== null && result.points > 0 && (
                                    <div className="text-[10px] font-bold text-red-500">+{result.points} PTS</div>
                                )}
                            </>
                        ) : (
                            <div className="text-xs font-mono text-gray-300">{result.fastestLapTime || '-'}</div>
                        )}
                    </div>
                    <ArrowDown01Icon className={cn(
                        "w-4 h-4 text-gray-500 transition-transform",
                        isExpanded && "rotate-180"
                    )} />
                </div>
            </div>

            {/* Expanded Stats */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 pt-1 border-t border-gray-800">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Race Time */}
                                {isRaceOrSprint && result.time && (
                                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Race Time</div>
                                        <div className="text-sm font-mono text-white">
                                            {position === 1 ? formatRaceTime(result.time, true) : result.time}
                                        </div>
                                    </div>
                                )}

                                {/* Fastest Lap */}
                                {isRaceOrSprint && (
                                    <div className={cn(
                                        "rounded-lg p-2.5",
                                        result.isFastestLap ? "bg-purple-900/30 border border-purple-600/30" : "bg-gray-800/50"
                                    )}>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Fastest Lap</div>
                                            {result.isFastestLap && <Clock01Icon className="w-3 h-3 text-purple-500" />}
                                        </div>
                                        <div className="text-sm font-mono text-white">
                                            {result.driverFastestLapTime || '-'}
                                        </div>
                                        {result.driverFastestLapNumber && (
                                            <div className="text-[10px] text-gray-500">Lap {result.driverFastestLapNumber}</div>
                                        )}
                                    </div>
                                )}

                                {/* Laps Completed */}
                                {(result.laps || result.lapsCompleted) && (
                                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Laps</div>
                                        <div className="text-sm font-mono text-white">
                                            {result.laps || result.lapsCompleted}
                                        </div>
                                    </div>
                                )}

                                {/* Grid Position */}
                                {isRaceOrSprint && result.gridPosition !== null && result.gridPosition !== undefined && (
                                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Started</div>
                                        <div className="text-sm font-mono text-white">
                                            P{result.gridPosition}
                                        </div>
                                        {result.gridPosition !== position && (
                                            <div className={cn(
                                                "text-[10px] font-bold",
                                                result.gridPosition > position ? "text-green-500" : "text-red-500"
                                            )}>
                                                {result.gridPosition > position
                                                    ? `↑ +${result.gridPosition - position}`
                                                    : `↓ ${position - result.gridPosition}`}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status */}
                                {result.status && result.status !== 'Finished' && (
                                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Status</div>
                                        <div className="text-sm text-orange-400">
                                            {result.status}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Main Component
const MobileRace: React.FC = () => {
    const { raceId } = useParams<{ raceId: string }>();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedSession = searchParams.get('session') || '';
    const showAnalysis = searchParams.get('view') === 'analysis';

    const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
    const [now, setNow] = useState(new Date());
    const [is24Hour, setIs24Hour] = useState(true);
    const [showSessionSelector, setShowSessionSelector] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [openF1Drivers, setOpenF1Drivers] = useState<OpenF1Driver[]>([]);
    const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const loadOpenF1Data = async () => {
            const drivers = await fetchAllOpenF1Drivers();
            setOpenF1Drivers(drivers);
        };
        loadOpenF1Data();
    }, []);

    const setSelectedSession = (session: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('session', session);
            return newParams;
        }, { replace: true });
    };

    const setShowAnalysisView = (show: boolean) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (show) {
                newParams.set('view', 'analysis');
            } else {
                newParams.delete('view');
            }
            return newParams;
        });
    };

    // Parse ID
    const { year, eventSlug, eventName } = useMemo(() => {
        if (!raceId) return { year: null, eventSlug: null, eventName: 'Race' };
        const parts = raceId.split('-');
        const parsedYear = parseInt(parts[0], 10);
        if (isNaN(parsedYear)) return { year: null, eventSlug: raceId, eventName: 'Invalid Race ID' };
        const slug = parts.slice(1).join('-');
        const name = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        if (parsedYear && name) {
            posthog.capture('race_analysis_viewed', { year: parsedYear, race: name, platform: 'mobile' });
        }

        return { year: parsedYear, eventSlug: slug, eventName: name };
    }, [raceId]);

    // Get driver image
    const getDriverImage = (driverCode: string, driverName: string) => {
        // Check 2025 local images first
        if (year === 2025 && driverImageMap[driverCode]) {
            return driverImageMap[driverCode];
        }
        // Fallback to OpenF1
        const driver = openF1Drivers.find(d =>
            d.name_acronym === driverCode ||
            d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || '')
        );
        return driver?.headshot_url;
    };

    // Queries
    const { data: fetchedAvailableSessions, isLoading: isLoadingSessions } = useQuery<AvailableSession[]>({
        queryKey: ['availableSessions', year, eventName],
        queryFn: () => fetchAvailableSessions(year!, eventName),
        enabled: !!year && !!eventName,
    });

    const { data: sessionSchedule } = useQuery<EventSessionSchedule>({
        queryKey: ['sessionSchedule', year, eventSlug],
        queryFn: () => fetchEventSessionSchedule(year!, eventSlug!),
        enabled: !!year && !!eventSlug && !isLoadingSessions && (!fetchedAvailableSessions || !fetchedAvailableSessions.some(s => s.type === 'R')),
    });

    const { data: sessionResults, isLoading: isLoadingResults } = useQuery<DetailedRaceResult[]>({
        queryKey: ['sessionResult', year, eventSlug, selectedSession],
        queryFn: () => fetchSpecificRaceResults(year!, eventSlug!, selectedSession),
        enabled: !!year && !!eventSlug && !!selectedSession && (fetchedAvailableSessions && fetchedAvailableSessions.length > 0),
    });

    useEffect(() => {
        if (fetchedAvailableSessions && fetchedAvailableSessions.length > 0) {
            setAvailableSessions(fetchedAvailableSessions);
            if (!searchParams.get('session')) {
                let defaultSession = '';
                if (fetchedAvailableSessions.some(s => s.type === 'R')) {
                    defaultSession = 'R';
                } else {
                    defaultSession = fetchedAvailableSessions[fetchedAvailableSessions.length - 1].type;
                }
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set('session', defaultSession);
                    return newParams;
                }, { replace: true });
            }
        } else if (fetchedAvailableSessions) {
            setAvailableSessions([]);
        }
    }, [fetchedAvailableSessions]);

    // Derived Data
    const nextSession = useMemo(() => {
        if (!sessionSchedule) return null;
        return sessionSchedule.sessions.find(s => new Date(s.date) > now);
    }, [sessionSchedule, now]);

    const sortedResults = useMemo(() => {
        if (!sessionResults) return [];
        const isPracticeOrQual = selectedSession.startsWith('FP') || selectedSession.startsWith('Q') || selectedSession.startsWith('SQ');
        if (isPracticeOrQual) {
            return [...sessionResults].sort((a, b) => parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime));
        }
        return sessionResults;
    }, [sessionResults, selectedSession]);

    const raceWinner = useMemo(() => (selectedSession === 'R' || selectedSession === 'Sprint') ? sessionResults?.find(r => r.position === 1) : null, [sessionResults, selectedSession]);

    // Get fastest lap driver
    const fastestLapDriver = useMemo(() => {
        if (selectedSession !== 'R' && selectedSession !== 'Sprint') return null;
        return sessionResults?.find(r => r.isFastestLap);
    }, [sessionResults, selectedSession]);

    // Get pole position driver (grid position 1)
    const poleDriver = useMemo(() => {
        if (selectedSession !== 'R' && selectedSession !== 'Sprint') return null;
        return sessionResults?.find(r => r.gridPosition === 1);
    }, [sessionResults, selectedSession]);

    // Build highlight cards data
    const highlightCards = useMemo((): HighlightCardData[] => {
        const cards: HighlightCardData[] = [];

        if (raceWinner) {
            cards.push({
                type: 'winner',
                driver: raceWinner,
                label: 'Winner',
                icon: ChampionIcon,
                bgColor: 'bg-[#1a1400]',
                borderColor: 'border-yellow-600',
                textColor: 'text-yellow-500',
                timeLabel: 'Time',
                timeValue: formatRaceTime(raceWinner.time, true),
            });
        }

        if (fastestLapDriver) {
            cards.push({
                type: 'fastestLap',
                driver: fastestLapDriver,
                label: 'Fastest Lap',
                icon: Clock01Icon,
                bgColor: 'bg-[#1a0a1a]',
                borderColor: 'border-purple-600',
                textColor: 'text-purple-500',
                timeLabel: 'Lap Time',
                timeValue: fastestLapDriver.driverFastestLapTime || fastestLapDriver.fastestLapTime || '-',
            });
        }

        if (poleDriver) {
            cards.push({
                type: 'pole',
                driver: poleDriver,
                label: 'Pole Position',
                icon: StartUp02Icon,
                bgColor: 'bg-[#0a1a1a]',
                borderColor: 'border-cyan-600',
                textColor: 'text-cyan-500',
                timeLabel: 'Started',
                timeValue: 'P1',
            });
        }

        return cards;
    }, [raceWinner, fastestLapDriver, poleDriver]);

    if (!year || !eventSlug) return null;

    if (isLoadingSessions) {
        return (
            <div className="min-h-screen bg-black text-white">
                <MobilePageHeader />
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin" />
                        <div className="text-gray-500 font-mono text-xs animate-pulse uppercase">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    const isRaceFuture = !availableSessions.some(s => s.type === 'R');
    const shouldShowSchedule = isRaceFuture && !showAnalysis;
    const isRaceOrSprint = selectedSession === 'R' || selectedSession === 'Sprint';

    const getSessionType = (sessionName: string) => {
        const lowerName = sessionName.toLowerCase();
        if (lowerName.includes('practice 1')) return 'FP1';
        if (lowerName.includes('practice 2')) return 'FP2';
        if (lowerName.includes('practice 3')) return 'FP3';
        if (lowerName.includes('sprint qualifying') || lowerName.includes('sprint shootout')) return 'SQ';
        if (lowerName.includes('sprint') && !lowerName.includes('qualifying')) return 'Sprint';
        if (lowerName.includes('qualifying') && !lowerName.includes('sprint')) return 'Q';
        if (lowerName === 'race') return 'R';
        return '';
    };

    const isSessionAvailable = (sessionType: string) => {
        return availableSessions.some(s => {
            if (sessionType === 'Q') return s.type === 'Q' || s.type === 'Q1' || s.type === 'Q2' || s.type === 'Q3';
            if (sessionType === 'SQ') return s.type === 'SQ' || s.type === 'SQ1' || s.type === 'SQ2' || s.type === 'SQ3';
            return s.type === sessionType;
        });
    };

    const isSessionLive = (sessionDate: string, sessionType: string) => {
        const date = new Date(sessionDate);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = diffMs / (1000 * 60);
        let duration = 60;
        if (sessionType === 'R') duration = 180;
        else if (sessionType === 'Sprint') duration = 60;
        return diffMins >= 0 && diffMins < duration;
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Page Header with Logo */}
            <MobilePageHeader />

            {/* Race Header */}
            <div className="px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (showAnalysis && isRaceFuture) {
                                setShowAnalysisView(false);
                            } else {
                                navigate(-1);
                            }
                        }}
                        className="p-2 -ml-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft01Icon className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black uppercase italic tracking-tight truncate">
                            {eventName}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono">{year}</span>
                            {selectedSession && availableSessions.find(s => s.type === selectedSession) && (
                                <>
                                    <span>•</span>
                                    <span className="text-red-500 font-bold uppercase">
                                        {availableSessions.find(s => s.type === selectedSession)?.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    {!shouldShowSchedule && availableSessions.length > 0 && (
                        <button
                            onClick={() => setShowSessionSelector(true)}
                            className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-bold uppercase active:scale-95 transition-transform"
                        >
                            Session
                            <ArrowDown01Icon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {shouldShowSchedule ? (
                sessionSchedule ? (
                    // UPCOMING RACE - SCHEDULE VIEW
                    <div className="px-4 py-6 space-y-6">
                        {/* Countdown Hero */}
                        {nextSession && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-950/30 rounded-2xl border border-red-600/30 p-6"
                            >
                                <div className="text-center mb-4">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                                            Countdown to {nextSession.name}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-400 font-mono">
                                        {new Date(nextSession.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <MobileCountdown targetDate={new Date(nextSession.date)} />
                            </motion.div>
                        )}

                        {/* Time Format Toggle */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold uppercase tracking-tight text-gray-400">
                                Weekend Schedule
                            </h2>
                            <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-800">
                                <button
                                    onClick={() => setIs24Hour(true)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                                        is24Hour ? "bg-gray-700 text-white" : "text-gray-500"
                                    )}
                                >
                                    24H
                                </button>
                                <button
                                    onClick={() => setIs24Hour(false)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                                        !is24Hour ? "bg-gray-700 text-white" : "text-gray-500"
                                    )}
                                >
                                    12H
                                </button>
                            </div>
                        </div>

                        {/* Session List */}
                        <div className="space-y-2.5">
                            {sessionSchedule.sessions.map((session, idx) => {
                                const sessionType = getSessionType(session.name);
                                const isNext = nextSession && session.name === nextSession.name;
                                const isAvailable = isSessionAvailable(sessionType);
                                const isLive = isSessionLive(session.date, sessionType);

                                return (
                                    <ScheduleSessionCard
                                        key={idx}
                                        session={session}
                                        isNext={isNext}
                                        isLive={isLive}
                                        isAvailable={isAvailable}
                                        is24Hour={is24Hour}
                                        onViewResults={() => {
                                            let targetSession = sessionType;
                                            if (sessionType === 'Q' && !availableSessions.some(s => s.type === 'Q')) {
                                                if (availableSessions.some(s => s.type === 'Q3')) targetSession = 'Q3';
                                            }
                                            if (sessionType === 'SQ' && !availableSessions.some(s => s.type === 'SQ')) {
                                                if (availableSessions.some(s => s.type === 'SQ3')) targetSession = 'SQ3';
                                            }
                                            setSelectedSession(targetSession);
                                            setShowAnalysisView(true);
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* View Past Sessions if available */}
                        {availableSessions.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setShowAnalysisView(true)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <Analytics01Icon className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-bold uppercase tracking-wider">View Session Results</span>
                            </motion.button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin" />
                    </div>
                )
            ) : (
                // RESULTS VIEW
                <div className="px-4 py-4 space-y-4">
                    {/* Stacked Highlight Cards (Winner, Fastest Lap, Pole) */}
                    {highlightCards.length > 0 && activeTab === 'overview' && (
                        <div className="mb-0">
                            <StackedHighlightCards
                                highlights={highlightCards}
                                getDriverImage={getDriverImage}
                                getTeamColorClass={getTeamColorClass}
                            />
                        </div>
                    )}

                    {/* Results Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold uppercase tracking-tight text-gray-400">
                            {availableSessions.find(s => s.type === selectedSession)?.name || 'Results'}
                        </h2>
                        <span className="text-xs text-gray-600 font-mono">
                            {sortedResults.length} drivers
                        </span>
                    </div>

                    {/* Results List */}
                    {isLoadingResults ? (
                        <div className="space-y-2">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-900 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedResults.map((result, idx) => {
                                const position = selectedSession.startsWith('FP') || selectedSession.startsWith('Q') || selectedSession.startsWith('SQ')
                                    ? idx + 1
                                    : result.position ?? idx + 1;
                                const isFavorite = profile?.favorite_driver && (
                                    result.driverCode === profile.favorite_driver ||
                                    result.fullName.toLowerCase().includes(profile.favorite_driver.toLowerCase())
                                );

                                return (
                                    <ResultRow
                                        key={result.driverCode}
                                        result={result}
                                        position={position}
                                        sessionType={selectedSession}
                                        isFavorite={!!isFavorite}
                                        driverImage={getDriverImage(result.driverCode, result.fullName)}
                                        isExpanded={expandedDriver === result.driverCode}
                                        onToggle={() => setExpandedDriver(
                                            expandedDriver === result.driverCode ? null : result.driverCode
                                        )}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Session Selector Modal */}
            <SessionSelector
                isOpen={showSessionSelector}
                onClose={() => setShowSessionSelector(false)}
                sessions={availableSessions}
                selectedSession={selectedSession}
                onSelect={setSelectedSession}
            />

            {/* Custom Bottom Nav for Analysis View */}
            {!shouldShowSchedule && (
                <RaceBottomNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    hasStrategy={isRaceOrSprint}
                />
            )}
        </div>
    );
};

export default MobileRace;
