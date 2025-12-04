import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft01Icon, ChampionIcon, Clock01Icon, Calendar01Icon,
    CheckmarkCircle02Icon,
    Analytics01Icon, Cancel01Icon, StartUp02Icon, ArrowDown01Icon,
    GitCompareIcon, ChartLineData01Icon
} from 'hugeicons-react';
import TireIcon from './tireicon';
import { fetchSpecificRaceResults, fetchAvailableSessions, fetchEventSessionSchedule, DetailedRaceResult, AvailableSession, EventSessionSchedule } from '@/lib/api';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import MobilePageHeader from './MobilePageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAnalytics } from '@/hooks/useAnalytics';
import MobileStrategy from './MobileStrategy';
import MobileLapTimes from './MobileLapTimes';
import MobileHeadToHead from './MobileHeadToHead';
import MobileTelemetry from './MobileTelemetry';

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
                        <div className={`text-3xl font-black font-mono ${item.highlight ? 'text-red-600' : 'text-white'}`}>
                            {pad(item.value)}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{item.label}</div>
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
                className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-md bg-black border-t-2 border-white/20 pb-24"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-gray-800" />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                        <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Select Session</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 transition-colors">
                            <Cancel01Icon className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <div className="p-3 max-h-80 overflow-y-auto space-y-2">
                        {sessions.filter(s => s.type !== 'Q').map(session => (
                            <button
                                key={session.type}
                                onClick={() => {
                                    onSelect(session.type);
                                    onClose();
                                }}
                                className={`w-full p-4 text-left transition-all flex items-center justify-between border-2 ${selectedSession === session.type
                                    ? 'bg-red-600 border-red-600 text-white'
                                    : 'bg-black border-white/10 hover:border-white/30 text-gray-300'
                                    }`}
                            >
                                <span className="text-base font-black uppercase tracking-wide">{session.name}</span>
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
                "overflow-hidden relative",
                isNext ? "bg-black border-2 border-red-600" : "bg-black border border-white/10"
            )}
        >
            {/* Decorative Corners for Next Session */}
            {isNext && (
                <>
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-600" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-red-600" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-red-600" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-600" />
                </>
            )}

            <div className="p-4">
                <div className="flex items-center justify-between">
                    {/* Left: Date & Session Name */}
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 flex flex-col items-center justify-center border",
                            isNext ? "bg-red-600/10 border-red-600 text-red-600" : "bg-zinc-900 border-white/10 text-gray-400"
                        )}>
                            <span className="text-[10px] uppercase font-black tracking-wider">{dayName}</span>
                            <span className="text-lg font-black leading-none">
                                {sessionDate.getDate()}
                            </span>
                        </div>
                        <div>
                            <h3 className={cn(
                                "font-black text-base uppercase italic tracking-tighter",
                                isNext ? "text-white" : "text-gray-300"
                            )}>
                                {session.name}
                            </h3>
                            {isNext && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-red-600 animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold">Next Up</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Time or Status */}
                    <div className="text-right">
                        {isLive ? (
                            <div className="flex items-center gap-2 text-red-600 border border-red-600 px-2 py-1 bg-red-600/10">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </div>
                                <span className="font-black uppercase text-xs tracking-wider">LIVE</span>
                            </div>
                        ) : isAvailable ? (
                            <button
                                onClick={onViewResults}
                                className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors border border-transparent hover:border-white"
                            >
                                Results
                            </button>
                        ) : (
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Local</span>
                                    <span className="text-sm font-mono text-gray-400">{formatLocalTime(session.localTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">You</span>
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
        ...(hasStrategy ? [{ id: 'strategy', label: 'Strategy', icon: TireIcon }] : []),
        { id: 'laptimes', label: 'Laps', icon: ChartLineData01Icon },
        { id: 'h2h', label: 'H2H', icon: GitCompareIcon },
        { id: 'telemetry', label: 'Data', icon: Analytics01Icon },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-2 border-white/10 safe-area-pb">
            <div className="flex items-center justify-around px-2 py-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-3 py-2 transition-colors min-w-[60px] relative",
                                isActive ? "text-red-600" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute -top-[2px] left-0 right-0 h-[2px] bg-red-600"
                                />
                            )}
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
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
        <div className={cn("border-2 p-6 bg-black relative overflow-hidden", data.borderColor)}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

            <div className="relative z-10 flex items-start gap-4">
                <Avatar className={cn("w-16 h-16 border-2 rounded-none", data.borderColor)}>
                    <AvatarImage
                        src={getDriverImage(data.driver.driverCode, data.driver.fullName)}
                        className="object-cover object-top"
                    />
                    <AvatarFallback className={cn("text-lg font-black rounded-none", `bg-f1-${getTeamColorClass(data.driver.team)}`)}>
                        {data.driver.driverCode}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={cn("w-4 h-4", data.textColor)} />
                        <span className={cn("text-xs font-black uppercase tracking-widest", data.textColor)}>{data.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-2xl font-black uppercase italic text-white leading-none">{data.driver.fullName}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={cn("w-2 h-2 flex-shrink-0", `bg-f1-${getTeamColorClass(data.driver.team)}`)} />
                        <span className="text-xs font-mono text-gray-400 uppercase">{data.driver.team}</span>
                    </div>
                    <div className="flex items-center gap-2 border-t border-white/10 pt-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{data.timeLabel}</span>
                        <span className="text-sm font-mono font-bold text-white">{data.timeValue}</span>
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
        <div className="relative h-[220px]">
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
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {highlights.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-1 transition-all",
                                index === currentIndex ? "bg-red-600 w-8" : "bg-gray-800 w-4"
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Swipe hint */}
            {highlights.length > 1 && (
                <div className="absolute -bottom-6 right-0 flex items-center gap-1 text-gray-600">
                    <span className="text-[10px] uppercase tracking-wider font-bold">Swipe</span>
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
    fastestLapHolder?: DetailedRaceResult | null;
}

const ResultRow: React.FC<ResultRowProps> = ({ result, position, sessionType, isFavorite, driverImage, isExpanded, onToggle, fastestLapHolder }) => {
    const isRaceOrSprint = sessionType === 'R' || sessionType === 'Sprint';
    const isPodium = position <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "transition-colors overflow-hidden border-b border-white/10",
                isFavorite ? "bg-red-900/10" : "bg-black"
            )}
        >
            {/* Main Row - Clickable */}
            <div
                className="flex items-center gap-3 p-3 cursor-pointer active:bg-zinc-900"
                onClick={onToggle}
            >
                {/* Position */}
                <div className={cn(
                    "w-8 h-8 flex items-center justify-center font-black text-sm font-mono border",
                    isPodium ? (
                        position === 1 ? "bg-yellow-500 text-black border-yellow-500" :
                            position === 2 ? "bg-gray-300 text-black border-gray-300" :
                                "bg-amber-700 text-white border-amber-700"
                    ) : "bg-black text-gray-500 border-white/20"
                )}>
                    {position}
                </div>

                {/* Driver Avatar */}
                <Avatar className="w-10 h-10 border border-white/10 rounded-none">
                    <AvatarImage src={driverImage} className="object-cover object-top" />
                    <AvatarFallback className={cn("text-xs font-bold rounded-none", `bg-f1-${getTeamColorClass(result.team)}`)}>
                        {result.driverCode}
                    </AvatarFallback>
                </Avatar>

                {/* Driver Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-white truncate uppercase italic tracking-tight">{result.fullName}</span>
                        {((fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) || (!fastestLapHolder && result.isFastestLap)) && <Clock01Icon className="w-3 h-3 text-purple-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 flex-shrink-0", `bg-f1-${getTeamColorClass(result.team)}`)} />
                        <span className="text-xs text-gray-500 truncate font-mono uppercase">{result.team}</span>
                    </div>
                </div>

                {/* Time/Gap + Expand Indicator */}
                <div className="flex items-center gap-3">
                    <div className="text-right flex-shrink-0">
                        {isRaceOrSprint ? (
                            <>
                                <div className="text-xs font-mono text-white font-bold">
                                    {(() => {
                                        const isLapped = result.status.includes('Lap');
                                        const isFinished = result.status === 'Finished' || result.status.startsWith('+') || isLapped;

                                        if (isFinished) {
                                            if (result.time) return formatRaceTime(result.time, position === 1);
                                            if (isLapped) return result.status;
                                            return '-';
                                        }
                                        return <span className="text-red-500 font-bold uppercase text-[10px]">{result.status}</span>;
                                    })()}
                                </div>
                                {result.points !== null && result.points > 0 && (
                                    <div className="text-[10px] font-black text-red-600 bg-red-600/10 px-1 border border-red-600/20 inline-block mt-0.5">+{result.points} PTS</div>
                                )}
                            </>
                        ) : (
                            <div className="text-xs font-mono text-white font-bold">{result.fastestLapTime || '-'}</div>
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
                        className="overflow-hidden bg-zinc-900/30"
                    >
                        <div className="px-3 pb-3 pt-2 border-t border-white/5">
                            <div className="grid grid-cols-2 gap-2">
                                {/* Race Time */}
                                {isRaceOrSprint && result.time && (
                                    <div className="bg-black border border-white/10 p-2">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Race Time</div>
                                        <div className="text-xs font-mono text-white">
                                            {position === 1 ? formatRaceTime(result.time, true) : result.time}
                                        </div>
                                    </div>
                                )}

                                {/* Fastest Lap */}
                                {isRaceOrSprint && (
                                    <div className={cn(
                                        "p-2 border",
                                        ((fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) || (!fastestLapHolder && result.isFastestLap)) ? "bg-purple-900/10 border-purple-600/50" : "bg-black border-white/10"
                                    )}>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <div className={cn("text-[9px] uppercase font-bold tracking-wider", ((fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) || (!fastestLapHolder && result.isFastestLap)) ? "text-purple-400" : "text-gray-500")}>Fastest Lap</div>
                                            {((fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) || (!fastestLapHolder && result.isFastestLap)) && <Clock01Icon className="w-3 h-3 text-purple-500" />}
                                        </div>
                                        <div className="text-xs font-mono text-white">
                                            {result.driverFastestLapTime || '-'}
                                        </div>
                                        {result.driverFastestLapNumber && (
                                            <div className="text-[9px] text-gray-500 font-mono">Lap {result.driverFastestLapNumber}</div>
                                        )}
                                    </div>
                                )}

                                {/* Laps Completed */}
                                {(result.laps || result.lapsCompleted) && (
                                    <div className="bg-black border border-white/10 p-2">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Laps</div>
                                        <div className="text-xs font-mono text-white">
                                            {result.laps || result.lapsCompleted}
                                        </div>
                                    </div>
                                )}

                                {/* Grid Position */}
                                {isRaceOrSprint && result.gridPosition !== null && result.gridPosition !== undefined && (
                                    <div className="bg-black border border-white/10 p-2">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Started</div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-mono text-white">
                                                P{result.gridPosition}
                                            </div>
                                            {result.gridPosition !== position && (
                                                <div className={cn(
                                                    "text-[9px] font-black px-1",
                                                    result.gridPosition > position ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                                                )}>
                                                    {result.gridPosition > position
                                                        ? `↑ ${result.gridPosition - position}`
                                                        : `↓ ${position - result.gridPosition}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                {result.status && result.status !== 'Finished' && (
                                    <div className="bg-black border border-white/10 p-2">
                                        <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Status</div>
                                        <div className="text-xs text-orange-500 font-bold uppercase">
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
    const { trackEvent } = useAnalytics();

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
        trackEvent('mobile_session_changed', { session_type: session, race_name: eventName, year: year });
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

    const { data: raceResults, isLoading: isLoadingResults } = useQuery<DetailedRaceResult[]>({
        queryKey: ['raceResults', year, eventName, selectedSession],
        queryFn: () => fetchSpecificRaceResults(year!, eventName, selectedSession),
        enabled: !!year && !!eventName && !!selectedSession,
    });

    // Effects
    useEffect(() => {
        if (fetchedAvailableSessions) {
            setAvailableSessions(fetchedAvailableSessions);
            if (!selectedSession && fetchedAvailableSessions.length > 0) {
                // Default to Race if available, else first session
                const hasRace = fetchedAvailableSessions.some(s => s.type === 'R');
                setSelectedSession(hasRace ? 'R' : fetchedAvailableSessions[0].type);
            }
        }
    }, [fetchedAvailableSessions]);

    // Derived State
    const currentSessionName = availableSessions.find(s => s.type === selectedSession)?.name || 'Session';
    const isRaceOrSprint = selectedSession === 'R' || selectedSession === 'Sprint';

    const fastestLapHolder = useMemo(() => {
        if (!isRaceOrSprint || !raceResults) return null;

        const validResults = raceResults.filter(r =>
            !['Disqualified', 'DSQ', 'EXC'].includes(r.status) && r.driverFastestLapTime
        );

        if (validResults.length === 0) return null;

        return validResults.sort((a, b) => parseLapTime(a.driverFastestLapTime) - parseLapTime(b.driverFastestLapTime))[0];
    }, [raceResults, isRaceOrSprint]);

    // Highlights Logic
    const highlights = useMemo(() => {
        if (!raceResults || raceResults.length === 0) return [];
        const cards: HighlightCardData[] = [];

        // Winner
        const winner = raceResults.find(r => r.position === 1);
        if (winner) {
            cards.push({
                type: 'winner',
                driver: winner,
                label: 'Race Winner',
                icon: ChampionIcon,
                bgColor: 'bg-black',
                borderColor: 'border-yellow-500',
                textColor: 'text-yellow-500',
                timeLabel: 'Race Time',
                timeValue: formatRaceTime(winner.time, true)
            });
        }

        // Fastest Lap
        if (fastestLapHolder) {
            cards.push({
                type: 'fastestLap',
                driver: fastestLapHolder,
                label: 'Fastest Lap',
                icon: Clock01Icon,
                bgColor: 'bg-black',
                borderColor: 'border-purple-600',
                textColor: 'text-purple-500',
                timeLabel: 'Lap Time',
                timeValue: fastestLapHolder.driverFastestLapTime || '-'
            });
        }

        // Pole Position (if grid data available)
        const pole = raceResults.find(r => r.gridPosition === 1);
        if (pole) {
            cards.push({
                type: 'pole',
                driver: pole,
                label: 'Pole Position',
                icon: StartUp02Icon,
                bgColor: 'bg-black',
                borderColor: 'border-red-600',
                textColor: 'text-red-600',
                timeLabel: 'Finish Position',
                timeValue: `P${pole.position}`
            });
        }

        return cards;
    }, [raceResults]);

    // Loading State
    if (isLoadingSessions) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <div className="text-red-600 font-black uppercase tracking-widest text-sm animate-pulse">Loading Race Data...</div>
                </div>
            </div>
        );
    }

    // Schedule View (No Results Yet)
    if (availableSessions.length === 0 && sessionSchedule) {
        const upcomingSession = sessionSchedule.sessions.find(s => new Date(s.date) > now);
        const nextSession = upcomingSession || sessionSchedule.sessions[sessionSchedule.sessions.length - 1];

        return (
            <div className="min-h-screen bg-black text-white pb-20 font-sans">
                <MobilePageHeader title={eventName} showBack />

                <div className="p-4 space-y-6">
                    {/* Countdown */}
                    {nextSession && new Date(nextSession.date) > now && (
                        <div className="py-8">
                            <div className="text-center mb-6">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Next Session</h2>
                                <h1 className="text-3xl font-black uppercase italic text-white">{nextSession.name}</h1>
                            </div>
                            <MobileCountdown targetDate={new Date(nextSession.date)} />
                        </div>
                    )}

                    {/* Schedule List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar01Icon className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-black uppercase italic tracking-tight">Weekend Schedule</h3>
                        </div>
                        {sessionSchedule.sessions.map((session) => {
                            const sessionDate = new Date(session.date);
                            const isNext = nextSession === session && sessionDate > now;
                            const isLive = sessionDate <= now && new Date(sessionDate.getTime() + 2 * 60 * 60 * 1000) > now; // Approx 2h duration
                            const isAvailable = false; // No results in this view

                            return (
                                <ScheduleSessionCard
                                    key={session.name}
                                    session={session}
                                    isNext={isNext}
                                    isLive={isLive}
                                    isAvailable={isAvailable}
                                    is24Hour={is24Hour}
                                    onViewResults={() => { }}
                                />
                            );
                        })}
                    </div>
                </div>
                <MobilePageHeader title={eventName} showBack />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-[80px] font-sans selection:bg-red-600 selection:text-white">
            <MobilePageHeader title={eventName} showBack />

            {/* Session Selector Header */}
            <div className="sticky top-[58px] z-40 bg-black/95 backdrop-blur-md border-b border-white/10">
                <div className="px-4 py-3 flex items-center justify-between">
                    {/* Left: GP Name */}
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-white truncate max-w-[60%]">
                        {eventName}
                    </h2>

                    {/* Right: Session Selector */}
                    <button
                        onClick={() => setShowSessionSelector(true)}
                        className="flex items-center gap-2 active:opacity-70"
                    >
                        <span className="text-sm font-bold uppercase tracking-wider text-gray-400">
                            {currentSessionName}
                        </span>
                        <ArrowDown01Icon className="w-5 h-5 text-red-600" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {activeTab === 'h2h' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4"
                    >
                        <MobileHeadToHead
                            year={year!}
                            event={eventName}
                            session={selectedSession}
                            openF1Drivers={openF1Drivers}
                            raceResults={raceResults}
                        />
                    </motion.div>
                )}

                {activeTab === 'overview' && (
                    <>
                        {/* Highlights Carousel (Race Only) */}
                        {isRaceOrSprint && highlights.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Highlights</h3>
                                <StackedHighlightCards
                                    highlights={highlights}
                                    getDriverImage={getDriverImage}
                                    getTeamColorClass={getTeamColorClass}
                                />
                            </div>
                        )}

                        {/* Results Table */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Classification</h3>
                                <span className="text-[10px] font-mono text-gray-600">{raceResults?.length || 0} DRIVERS</span>
                            </div>

                            <div className="space-y-px bg-white/10 border-t border-b border-white/10">
                                {isLoadingResults ? (
                                    <div className="p-8 text-center text-gray-500 animate-pulse bg-black">
                                        Loading results...
                                    </div>
                                ) : (
                                    raceResults?.map((result) => (
                                        <ResultRow
                                            key={result.driverCode}
                                            result={result}
                                            position={result.position}
                                            sessionType={selectedSession}
                                            isFavorite={profile?.favorite_driver === result.driverCode}
                                            driverImage={getDriverImage(result.driverCode, result.fullName)}
                                            isExpanded={expandedDriver === result.driverCode}
                                            onToggle={() => setExpandedDriver(expandedDriver === result.driverCode ? null : result.driverCode)}
                                            fastestLapHolder={fastestLapHolder}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'strategy' && year && (
                    <MobileStrategy
                        year={year}
                        event={eventName}
                        session={selectedSession}
                        raceResults={raceResults}
                        getDriverImage={getDriverImage}
                    />
                )}

                {activeTab === 'laptimes' && year && (
                    <MobileLapTimes
                        year={year}
                        event={eventName}
                        session={selectedSession}
                        raceResults={raceResults}
                        openF1Drivers={openF1Drivers}
                    />
                )}

                {activeTab === 'telemetry' && (
                    <MobileTelemetry
                        year={year!}
                        event={eventName}
                        session={selectedSession}
                        openF1Drivers={openF1Drivers}
                        raceResults={raceResults}
                    />
                )}
            </div>

            {/* Bottom Nav */}
            <RaceBottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                hasStrategy={isRaceOrSprint}
            />

            {/* Session Selector Modal */}
            <SessionSelector
                isOpen={showSessionSelector}
                onClose={() => setShowSessionSelector(false)}
                sessions={availableSessions}
                selectedSession={selectedSession}
                onSelect={setSelectedSession}
            />
        </div>
    );
};

export default MobileRace;
