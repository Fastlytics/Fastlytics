import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar01Icon, Location01Icon, FlashIcon, ChampionIcon, ArrowDown01Icon, Cancel01Icon
} from 'hugeicons-react';
import { getCountryCode } from '@/utils/countryUtils';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchRaceResults, RaceResult, fetchSchedule, ScheduleEvent } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';

// Bigger Countdown for mobile calendar
const MobileCountdown = ({ targetDate, sessionName }: { targetDate: Date; sessionName: string }) => {
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
        <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs uppercase tracking-wider text-gray-400">
                    Next: <span className="text-white font-medium">{sessionName}</span>
                </span>
            </div>
            <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                    <div className="text-2xl font-black text-white font-mono">{pad(timeLeft.d)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">Days</div>
                </div>
                <div className="text-xl font-bold text-gray-600">:</div>
                <div className="text-center">
                    <div className="text-2xl font-black text-white font-mono">{pad(timeLeft.h)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">Hrs</div>
                </div>
                <div className="text-xl font-bold text-gray-600">:</div>
                <div className="text-center">
                    <div className="text-2xl font-black text-white font-mono">{pad(timeLeft.m)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">Min</div>
                </div>
                <div className="text-xl font-bold text-gray-600">:</div>
                <div className="text-center">
                    <div className="text-2xl font-black text-red-500 font-mono">{pad(timeLeft.s)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-500">Sec</div>
                </div>
            </div>
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
                    className="w-full max-w-md bg-gray-900 rounded-t-2xl border-t border-gray-700 pb-24"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h3 className="text-lg font-bold uppercase tracking-tight">Select Season</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
                            <Cancel01Icon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Options */}
                    <div className="p-2 max-h-80 overflow-y-auto">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => {
                                    onSelect(year);
                                    onClose();
                                }}
                                className={`w-full p-4 text-left rounded-xl transition-colors flex items-center justify-between ${
                                    selectedYear === year 
                                        ? 'bg-red-600 text-white' 
                                        : 'hover:bg-gray-800 text-gray-300'
                                }`}
                            >
                                <span className="text-lg font-bold">{year} Season</span>
                                {selectedYear === year && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gray-900/60 rounded-xl overflow-hidden active:scale-[0.98] transition-transform ${
                isNextRace ? 'border-2 border-red-600' : 'border border-gray-800'
            }`}
            onClick={() => navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`)}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Flag */}
                    <div className={`w-12 h-8 rounded overflow-hidden flex-shrink-0 border ${isNextRace ? 'border-red-600/50' : 'border-gray-700'}`}>
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
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">R{event.RoundNumber}</span>
                            {event.isSprint && (
                                <span className="text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <FlashIcon className="w-2.5 h-2.5" /> Sprint
                                </span>
                            )}
                            {isNextRace && (
                                <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Next
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-base uppercase tracking-tight truncate">
                            {event.EventName.replace('Grand Prix', 'GP')}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar01Icon className="w-3 h-3" />
                                {event.displayDate}
                            </span>
                            <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <Location01Icon className="w-3 h-3" />
                                {event.Location}
                            </span>
                        </div>
                    </div>

                    {/* Status/Result */}
                    <div className="flex-shrink-0 text-right">
                        {event.result ? (
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                    <ChampionIcon className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs font-bold text-white">{event.result.driver}</span>
                                </div>
                                <span className="text-[10px] text-gray-500">{event.result.team?.split(' ')[0]}</span>
                            </div>
                        ) : (
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                event.isUpcoming ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'
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

        let nextRaceEvent: any = null;
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
                nextRaceEvent = event.EventName;
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

    const filteredRaces = useMemo(() => {
        if (filter === 'upcoming') return combinedRaceData.filter(r => r.isUpcoming);
        if (filter === 'completed') return combinedRaceData.filter(r => !r.isUpcoming);
        return combinedRaceData;
    }, [combinedRaceData, filter]);

    const isLoading = isLoadingSchedule || isLoadingResults;

    return (
        <MobileLayout>
            <div className="min-h-screen bg-black text-white">
                <MobilePageHeader />

                {/* Season Selector & Filters */}
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Season Selector Button */}
                        <button
                            onClick={() => setShowSeasonSelector(true)}
                            className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-bold active:scale-95 transition-transform"
                        >
                            <span>{selectedYear}</span>
                            <ArrowDown01Icon className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Filter Pills */}
                        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
                            {(['all', 'upcoming', 'completed'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${
                                        filter === f 
                                            ? 'bg-red-600 text-white' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {f === 'all' ? 'All' : f === 'upcoming' ? 'Up' : 'Done'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Next Session Countdown Banner */}
                {nextSession && (
                    <div className="px-4 py-4 bg-gradient-to-b from-red-900/20 to-transparent">
                        <MobileCountdown targetDate={nextSession.date} sessionName={nextSession.name} />
                    </div>
                )}

                {/* Race List */}
                <div className="px-4 py-4 space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-24 bg-gray-900/50 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : filteredRaces.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {filteredRaces.map((race) => (
                                <MobileRaceCard
                                    key={`${selectedYear}-${race.EventName}`}
                                    event={race}
                                    selectedYear={selectedYear}
                                    isNextRace={race.EventName === nextRace}
                                />
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-sm">No races found</p>
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
