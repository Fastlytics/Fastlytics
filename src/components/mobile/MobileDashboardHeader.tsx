import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCountryCode } from '@/utils/countryUtils';
import { Activity01Icon, Location01Icon } from 'hugeicons-react';
import { useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { useSeason } from '@/contexts/SeasonContext';

interface MobileDashboardHeaderProps {
    nextSession?: {
        eventName: string;
        sessionName: string;
        date: string;
        location: string;
        country: string;
    };
    favoriteDriverName?: string;
}

const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({ nextSession, favoriteDriverName }) => {
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
    const navigate = useNavigate();
    const { selectedYear } = useSeason();

    useEffect(() => {
        if (!nextSession?.date) return;

        const calculateTimeLeft = () => {
            const difference = new Date(nextSession.date).getTime() - new Date().getTime();

            if (difference > 0) {
                return {
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                    s: Math.floor((difference / 1000) % 60),
                };
            }
            return null;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [nextSession]);

    return (
        <div className="space-y-5">
            {/* Centered Logo Header */}
            <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2.5">
                    <Gauge className="h-8 w-8 text-red-600" />
                    <span className="text-2xl font-black tracking-tighter uppercase italic text-white">
                        Fast<span className="text-red-600">lytics</span>
                    </span>
                </div>
            </div>

            {/* Next Session Card - Ultra Compact */}
            {nextSession && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 active:scale-[0.98] transition-transform"
                    onClick={() => navigate(`/race/${selectedYear}-${nextSession.eventName.toLowerCase().replace(/\s+/g, '-')}`)}
                >
                    <div className="flex items-center gap-3">
                        {/* Flag */}
                        <div className="w-10 h-7 rounded overflow-hidden border border-gray-700 flex-shrink-0">
                            <img
                                src={`https://flagcdn.com/h80/${getCountryCode(nextSession.country || nextSession.location)}.png`}
                                alt={nextSession.country}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-xs font-black uppercase text-white truncate">
                                    {nextSession.eventName.replace('Grand Prix', 'GP')}
                                </span>
                            </div>
                            <div className="text-[10px] text-gray-500">
                                <span className="text-red-500 font-bold">{nextSession.sessionName}</span>
                                <span className="mx-1">•</span>
                                <span>{nextSession.location}</span>
                            </div>
                        </div>

                        {/* Countdown - Right aligned */}
                        {timeLeft ? (
                            <div className="flex items-center gap-0.5 font-mono text-right flex-shrink-0">
                                <span className="text-sm font-bold text-white">{timeLeft.d}d</span>
                                <span className="text-gray-600">:</span>
                                <span className="text-sm font-bold text-white">{String(timeLeft.h).padStart(2, '0')}h</span>
                                <span className="text-gray-600">:</span>
                                <span className="text-sm font-bold text-red-500">{String(timeLeft.m).padStart(2, '0')}m</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-red-500 uppercase">Live</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* No session fallback */}
            {!nextSession && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
                    <Activity01Icon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No upcoming sessions</p>
                </div>
            )}
        </div>
    );
};

export default MobileDashboardHeader;
