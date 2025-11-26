import React from 'react';
import { motion } from 'framer-motion';
import { ScheduleEvent } from '@/lib/api';
import { Flag, CheckCircle2, Clock, MapPin } from 'lucide-react';

interface SeasonTimelineProps {
    schedule: ScheduleEvent[];
    currentRound: number;
}

const SeasonTimeline: React.FC<SeasonTimelineProps> = ({ schedule, currentRound }) => {
    const totalRounds = schedule.length;
    const progress = (currentRound / totalRounds) * 100;

    const getCountryName = (country: string) => {
        if (country === 'United Arab Emirates') return 'UAE';
        if (country === 'United States') return 'USA';
        if (country === 'United Kingdom') return 'UK';
        if (country === 'Saudi Arabia') return 'KSA';
        return country;
    };

    return (
        <div className="w-full mb-16 relative group">
            {/* Cybernetic Header */}
            <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-red-600 animate-pulse" />
                        <span className="text-xs font-mono text-red-600 tracking-widest uppercase">System Status: Active</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                        Season <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Progress</span>
                    </h3>
                </div>
                <div className="text-right">
                    <div className="font-mono text-4xl md:text-5xl font-black text-white leading-none">
                        {Math.round(progress)}<span className="text-red-600">%</span>
                    </div>
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
                        Completion Rate
                    </div>
                </div>
            </div>

            {/* Main Progress Track */}
            <div className="relative h-16 bg-black border-y-2 border-gray-800 w-full overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_100%]" />
                
                {/* Progress Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="absolute top-0 left-0 h-full bg-red-600/20 border-r-2 border-red-600"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(220,38,38,0.2)_50%,transparent_75%,transparent_100%)] bg-[size:20px_20px] animate-[shimmer_1s_infinite_linear]" />
                </motion.div>

                {/* Race Markers */}
                <div className="absolute inset-0 flex items-center">
                    {schedule.map((event, index) => {
                        const isCompleted = index + 1 <= currentRound;
                        const isNext = index + 1 === currentRound + 1;
                        
                        return (
                            <div
                                key={event.RoundNumber}
                                className="absolute h-full flex flex-col justify-center items-center group/marker"
                                style={{ left: `${((index + 1) / totalRounds) * 100}%`, transform: 'translateX(-50%)' }}
                            >
                                {/* Connection Line */}
                                <div className={`h-full w-[1px] transition-colors duration-300 ${
                                    isNext ? 'bg-red-600 w-[2px] shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 
                                    isCompleted ? 'bg-gray-700' : 'bg-gray-900'
                                }`} />

                                {/* Marker Node */}
                                <div className={`absolute transition-all duration-300 ${
                                    isNext ? 'w-4 h-4 bg-red-600 rotate-45 border-2 border-white shadow-[0_0_15px_rgba(220,38,38,0.8)] z-20' :
                                    isCompleted ? 'w-2 h-2 bg-gray-500 rotate-45' :
                                    'w-1.5 h-1.5 bg-gray-800 rotate-45'
                                }`} />

                                {/* Tooltip / Label */}
                                <div className={`absolute bottom-full mb-3 opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200 pointer-events-none z-30 ${
                                    isNext ? 'opacity-100 mb-4' : ''
                                }`}>
                                    <div className={`px-2 py-1 text-[10px] font-mono font-bold uppercase whitespace-nowrap border ${
                                        isNext ? 'bg-red-600 text-white border-red-600' : 
                                        'bg-black text-gray-400 border-gray-800'
                                    }`}>
                                        {getCountryName(event.Country)}
                                    </div>
                                    {/* Connector for tooltip */}
                                    <div className={`w-[1px] h-3 mx-auto ${
                                        isNext ? 'bg-red-600' : 'bg-gray-800'
                                    }`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-2 left-0 w-full flex justify-between text-[10px] font-mono text-gray-600 uppercase">
                <span>Start: BHR</span>
                <span>End: ABD</span>
            </div>
            
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-600" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-600" />
        </div>
    );
};

export default SeasonTimeline;
