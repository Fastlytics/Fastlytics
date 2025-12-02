import React from 'react';
import { motion } from 'framer-motion';
import { ScheduleEvent } from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import { useNavigate } from 'react-router-dom';
import { getCountryCode } from '@/utils/countryUtils';
import { Flag01Icon, ArrowRight01Icon, Calendar03Icon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';

interface MobileRecentRacesProps {
    recentRaces: ScheduleEvent[];
}

const MobileRecentRaces: React.FC<MobileRecentRacesProps> = ({ recentRaces }) => {
    const { selectedYear } = useSeason();
    const navigate = useNavigate();

    if (recentRaces.length === 0) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
                <Calendar03Icon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No races completed yet this season</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <span className="w-1 h-6 bg-red-600 block rounded"></span>
                    Recent <span className="text-gray-500">Races</span>
                </h3>
                <Link 
                    to="/calendar"
                    className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1"
                >
                    Calendar <ArrowRight01Icon className="w-3 h-3" />
                </Link>
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollPaddingLeft: '16px' }}>
                {/* Left spacer for edge padding */}
                <div className="flex-shrink-0 w-4" />
                {recentRaces.map((race, index) => (
                    <motion.div
                        key={race.EventName}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                            posthog.capture('widget_clicked', { 
                                widget: 'recent_races', 
                                action: 'click_race', 
                                race: race.EventName 
                            });
                            navigate(`/race/${selectedYear}-${race.EventName.toLowerCase().replace(/\s+/g, '-')}`);
                        }}
                        className="flex-shrink-0 w-[160px] snap-start bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl overflow-hidden active:scale-95 transition-transform cursor-pointer"
                    >
                        {/* Flag & Round */}
                        <div className="relative h-20 overflow-hidden">
                            <img
                                src={`https://flagcdn.com/h120/${getCountryCode(race.Country || race.Location)}.png`}
                                alt={race.Country || race.Location}
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                                    Round {race.RoundNumber}
                                </div>
                            </div>
                        </div>

                        {/* Race Info */}
                        <div className="p-3">
                            <div className="font-bold text-sm uppercase leading-tight line-clamp-2 mb-1">
                                {race.EventName.replace('Grand Prix', 'GP')}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Flag01Icon className="w-3 h-3" />
                                {race.Location}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* View All Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: recentRaces.length * 0.1 }}
                    onClick={() => navigate('/calendar')}
                    className="flex-shrink-0 w-[100px] snap-start bg-gray-900/50 border border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-gray-800"
                >
                    <Calendar03Icon className="w-6 h-6 text-gray-500" />
                    <span className="text-xs font-bold uppercase text-gray-500">View All</span>
                </motion.div>
                {/* Right spacer for edge padding */}
                <div className="flex-shrink-0 w-4" />
            </div>
        </div>
    );
};

export default MobileRecentRaces;
