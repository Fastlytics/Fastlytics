import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar01Icon, Location01Icon, FlashIcon, ChampionIcon, ArrowDown01Icon, Cancel01Icon,
    ArrowRight01Icon, Clock01Icon, CheckmarkCircle02Icon
} from 'hugeicons-react';
import { getCountryCode } from '@/utils/countryUtils';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchRaceResults, RaceResult, fetchSchedule, ScheduleEvent } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';

// Hero Countdown Component for next race
const HeroCountdown = ({ targetDate, sessionName }: { targetDate: Date; sessionName: string }) => {
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
        <div className="flex items-center justify-center gap-2">
            {[
                { value: timeLeft.d, label: 'D' },
                { value: timeLeft.h, label: 'H' },
                { value: timeLeft.m, label: 'M' },
                { value: timeLeft.s, label: 'S', highlight: true },
            ].map((item, idx) => (
                <React.Fragment key={item.label}>
                    <div className="flex flex-col items-center">
                        <div className={`text-2xl font-black font-mono ${item.highlight ? 'text-red-500' : 'text-white'}`}>
                            {pad(item.value)}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">{item.label}</div>
                    </div>
                    {idx < 3 && <span className="text-xl font-bold text-gray-700 -mt-3">:</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

// Native Season Selector Modal
interface SeasonSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedYear: number;
    availableYears: number[];
    onSelect: (year: number) => void;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ isOpen, onClose, selectedYear, availableYears, onSelect }) => {
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
                    className="w-full max-w-md bg-black border-t-2 border-white/10 pb-24"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle bar */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-gray-600" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b-2 border-white/10">
                        <h3 className="text-lg font-black uppercase italic tracking-tight">Select Season</h3>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-900 transition-colors">
                            <Cancel01Icon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Options */}
                    <div className="p-3 max-h-80 overflow-y-auto">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => {
                                    onSelect(year);
                                    onClose();
                                }}
                                className={`w-full p-4 text-left border-2 transition-all flex items-center justify-between mb-2 ${selectedYear === year
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-black hover:bg-zinc-900 text-gray-300 border-white/10'
                                    }`}
                            >
                                <span className="text-lg font-black uppercase italic">{year} Season</span>
                                {selectedYear === year && (
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

// Next Race Hero Card
interface NextRaceHeroProps {
    event: ScheduleEvent & {
        countryCode?: string;
        displayDate: string;
        isSprint: boolean;
    };
    nextSession: { name: string; date: Date } | null;
    selectedYear: number;
}

const NextRaceHero: React.FC<NextRaceHeroProps> = ({ event, nextSession, selectedYear }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-black border-2 border-red-600"
            onClick={() => {
                navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`);
            }}
        >

            <div className="relative p-5">
                {/* Header with badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-red-500">Next Grand Prix</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Round {event.RoundNumber}</span>
                </div>

                {/* Flag and Event Name */}
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-16 h-11 overflow-hidden border-2 border-white/10 flex-shrink-0">
                        {event.countryCode && (
                            <img
                                src={`https://flagcdn.com/h80/${event.countryCode}.png`}
                                alt={event.Country || event.Location}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                            {event.EventName.replace('Grand Prix', 'GP')}
                        </h2>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-sm text-gray-400 flex items-center gap-1 font-mono uppercase">
                                <Calendar01Icon className="w-3.5 h-3.5" />
                                {event.displayDate}
                            </span>
                            {event.isSprint && (
                                <span className="text-[10px] font-black uppercase bg-yellow-500 text-black px-2 py-0.5 flex items-center gap-1">
                                    <FlashIcon className="w-3 h-3" /> Sprint
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Countdown */}
                {nextSession && (
                    <div className="bg-zinc-900/50 p-4 border-2 border-white/10">
                        <div className="flex items-center justify-center gap-1.5 mb-3">
                            <Clock01Icon className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs uppercase tracking-wider text-gray-400 font-mono">
                                Until <span className="text-white font-bold">{nextSession.name}</span>
                            </span>
                        </div>
                        <HeroCountdown targetDate={nextSession.date} sessionName={nextSession.name} />
                    </div>
                )}

                {/* CTA */}
                <div className="mt-4 flex items-center justify-center gap-2 text-red-500 hover:text-red-400 transition-colors">
                    <span className="text-xs font-black uppercase tracking-wider">View Race Hub</span>
                    <ArrowRight01Icon className="w-4 h-4" />
                </div>
            </div>
        </motion.div>
    );
};

// Compact Race Card for mobile
interface MobileRaceCardProps {
    event: ScheduleEvent & {
        result?: RaceResult;
        isUpcoming: boolean;
        isSprint: boolean;
        countryCode?: string;
        displayDate: string;
    };
    selectedYear: number;
    isNextRace?: boolean;
}

const MobileRaceCard: React.FC<MobileRaceCardProps> = ({ event, selectedYear, isNextRace }) => {
    const navigate = useNavigate();
    const isCompleted = !!event.result;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden transition-all group cursor-pointer ${isCompleted
                ? 'bg-black border-2 border-white/5 opacity-80 hover:opacity-100'
                : 'bg-black border-2 border-white/10 hover:border-white/20'
                }`}
            onClick={() => {
                navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`);
            }}
        >
            <div className="p-3.5">
                <div className="flex items-center gap-3">
                    {/* Round Number */}
                    <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 ${isCompleted ? 'bg-zinc-900 border-white/5' : 'bg-white text-black border-white'
                        }`}>
                        <span className={`text-xs font-black ${isCompleted ? 'text-gray-500' : 'text-black'}`}>
                            {event.RoundNumber}
                        </span>
                    </div>

                    {/* Flag */}
                    <div className={`w-10 h-7 overflow-hidden flex-shrink-0 border-2 ${isCompleted ? 'border-white/5' : 'border-white/10'
                        }`}>
                        {event.countryCode && (
                            <img
                                src={`https://flagcdn.com/h80/${event.countryCode}.png`}
                                alt={event.Country || event.Location}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className={`font-black text-sm uppercase italic tracking-tight truncate ${isCompleted ? 'text-gray-500' : 'text-white'
                                }`}>
                                {event.EventName.replace('Grand Prix', 'GP')}
                            </h3>
                            {event.isSprint && (
                                <FlashIcon className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono uppercase ${isCompleted ? 'text-gray-600' : 'text-gray-500'}`}>
                                {event.displayDate}
                            </span>
                            <span className="text-gray-700">•</span>
                            <span className={`text-xs truncate font-mono uppercase ${isCompleted ? 'text-gray-600' : 'text-gray-500'}`}>
                                {event.Location}
                            </span>
                        </div>
                    </div>

                    {/* Status/Result */}
                    <div className="flex-shrink-0 text-right">
                        {event.result ? (
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                    <ChampionIcon className="w-3 h-3 text-yellow-600" />
                                    <span className="text-xs font-black uppercase text-white">{event.result.driver.split(' ').pop()}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono uppercase">{event.result.team?.split(' ')[0]}</span>
                            </div>
                        ) : (
                            <span className={`text-[10px] font-black uppercase px-2 py-1 border-2 ${event.isUpcoming ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' : 'bg-zinc-900 text-gray-500 border-zinc-800'
                                }`}>
                                {event.isUpcoming ? 'TBD' : '-'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const MobileCalendar: React.FC = () => {
    const { selectedYear, setSelectedYear, availableYears } = useSeason();
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
    const [showSeasonSelector, setShowSeasonSelector] = useState(false);

    // Fetch Full Schedule
    const { data: scheduleData, isLoading: isLoadingSchedule } = useQuery<ScheduleEvent[]>({
        queryKey: ['schedule', selectedYear],
        queryFn: () => fetchSchedule(selectedYear),
    });

    // Fetch Race Results Summary
    const { data: resultsData, isLoading: isLoadingResults } = useQuery<RaceResult[]>({
        queryKey: ['raceResults', selectedYear],
        queryFn: () => fetchRaceResults(selectedYear),
    });

    // Combine schedule and results data
    const { combinedRaceData, nextRace, nextSession } = useMemo(() => {
        if (!scheduleData) return { combinedRaceData: [], nextRace: null, nextSession: null };
        const resultsMap = new Map(resultsData?.map(res => [res.event, res]));
        const now = new Date();

        let nextRaceEvent: (ScheduleEvent & { countryCode?: string; displayDate: string; isSprint: boolean }) | null = null;
        let nextSessionData: { name: string; date: Date } | null = null;

        const sortedSchedule = [...scheduleData].sort((a, b) =>
            new Date(a.EventDate).getTime() - new Date(b.EventDate).getTime()
        );

        for (const event of sortedSchedule) {
            const sessions = [
                { name: event.Session1, date: event.Session1Date },
                { name: event.Session2, date: event.Session2Date },
                { name: event.Session3, date: event.Session3Date },
                { name: event.Session4, date: event.Session4Date },
                { name: event.Session5, date: event.Session5Date },
            ].filter(s => s.name && s.date);

            sessions.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
            const upcomingSession = sessions.find(s => new Date(s.date!) > now);

            if (upcomingSession) {
                const eventDate = new Date(event.EventDate);
                nextRaceEvent = {
                    ...event,
                    countryCode: getCountryCode(event.Country || event.Location),
                    displayDate: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    isSprint: event.EventFormat?.toLowerCase().includes('sprint') || false
                };
                nextSessionData = {
                    name: upcomingSession.name!,
                    date: new Date(upcomingSession.date!)
                };
                break;
            }
        }

        const processedData = scheduleData.map(event => {
            const result = resultsMap.get(event.EventName);
            const eventDate = new Date(event.EventDate);
            const sessions = [
                event.Session1Date, event.Session2Date, event.Session3Date,
                event.Session4Date, event.Session5Date
            ].filter(d => d).map(d => new Date(d!));
            const isUpcoming = sessions.some(d => d > now);

            return {
                ...event,
                result,
                isUpcoming,
                isSprint: event.EventFormat?.toLowerCase().includes('sprint') || false,
                displayDate: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                countryCode: getCountryCode(event.Country || event.Location)
            };
        });

        return { combinedRaceData: processedData, nextRace: nextRaceEvent, nextSession: nextSessionData };
    }, [scheduleData, resultsData]);

    // Filter races excluding the next race (it's shown in hero)
    const filteredRaces = useMemo(() => {
        let races = combinedRaceData;

        // Exclude next race from list as it's shown in hero
        if (nextRace) {
            races = races.filter(r => r.EventName !== nextRace.EventName);
        }

        if (filter === 'upcoming') return races.filter(r => r.isUpcoming);
        if (filter === 'completed') return races.filter(r => !r.isUpcoming);
        return races;
    }, [combinedRaceData, filter, nextRace]);

    // Stats for quick info
    const stats = useMemo(() => {
        const completed = combinedRaceData.filter(r => !r.isUpcoming).length;
        const upcoming = combinedRaceData.filter(r => r.isUpcoming).length;
        return { completed, upcoming, total: combinedRaceData.length };
    }, [combinedRaceData]);

    const isLoading = isLoadingSchedule || isLoadingResults;

    return (
        <MobileLayout>
            <div className="min-h-screen bg-black text-white">
                <MobilePageHeader />

                {/* Season Selector & Stats */}
                <div className="px-4 pt-2 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        {/* Season Selector Button */}
                        <button
                            onClick={() => setShowSeasonSelector(true)}
                            className="flex items-center gap-2 bg-black border-2 border-white/10 px-4 py-2.5 text-base font-black uppercase italic active:scale-95 transition-transform hover:bg-zinc-900"
                        >
                            <span className="text-white">{selectedYear} Season</span>
                            <ArrowDown01Icon className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Stats Badge */}
                        <div className="text-xs text-gray-500 font-mono uppercase tracking-wider bg-zinc-900 px-3 py-2 border-2 border-white/10">
                            {stats.completed}/{stats.total} Complete
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-1.5 bg-black p-1.5 border-2 border-white/10">
                        {([
                            { key: 'all', label: 'All Races' },
                            { key: 'upcoming', label: `Upcoming (${stats.upcoming})` },
                            { key: 'completed', label: `Done (${stats.completed})` }
                        ] as const).map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`flex-1 px-3 py-2 text-xs font-black uppercase italic transition-all ${filter === f.key
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-500 hover:text-white bg-zinc-900'
                                    }`}
                            >
                                {f.key === 'all' ? 'All' : f.key === 'upcoming' ? 'Up' : 'Done'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Next Race Hero Card */}
                {nextRace && filter !== 'completed' && (
                    <div className="px-4 pb-4">
                        <NextRaceHero
                            event={nextRace}
                            nextSession={nextSession}
                            selectedYear={selectedYear}
                        />
                    </div>
                )}

                {/* Section Header */}
                {filteredRaces.length > 0 && (
                    <div className="px-4 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="h-0.5 flex-1 bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                {filter === 'completed' ? 'Race Results' : filter === 'upcoming' ? 'Upcoming Races' : 'All Races'}
                            </span>
                            <div className="h-0.5 flex-1 bg-white/10" />
                        </div>
                    </div>
                )}

                {/* Race List */}
                <div className="px-4 pb-6 space-y-2.5">
                    {isLoading ? (
                        <div className="space-y-2.5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-16 bg-zinc-900 animate-pulse border-2 border-white/5" />
                            ))}
                        </div>
                    ) : filteredRaces.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {filteredRaces.map((race, index) => (
                                <motion.div
                                    key={`${selectedYear}-${race.EventName}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <MobileRaceCard
                                        event={race}
                                        selectedYear={selectedYear}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-16 border-2 border-white/10 bg-zinc-900/30">
                            <div className="w-16 h-16 mx-auto mb-4 bg-black border-2 border-white/10 flex items-center justify-center">
                                <Calendar01Icon className="w-8 h-8 text-gray-700" />
                            </div>
                            <p className="text-sm text-gray-500 font-mono uppercase">No races found</p>
                            <p className="text-xs text-gray-600 mt-1 font-mono uppercase">Try a different filter</p>
                        </div>
                    )}
                </div>

                {/* Season Selector Modal */}
                <SeasonSelector
                    isOpen={showSeasonSelector}
                    onClose={() => setShowSeasonSelector(false)}
                    selectedYear={selectedYear}
                    availableYears={availableYears}
                    onSelect={setSelectedYear}
                />
            </div>
        </MobileLayout>
    );
};

export default MobileCalendar;
