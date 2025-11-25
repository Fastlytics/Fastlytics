import React from 'react';
import { motion } from 'framer-motion';
import { ScheduleEvent } from '@/lib/api';

interface SeasonTimelineProps {
    schedule: ScheduleEvent[];
    currentRound: number;
}

const SeasonTimeline: React.FC<SeasonTimelineProps> = ({ schedule, currentRound }) => {
    const totalRounds = schedule.length;
    const progress = (currentRound / totalRounds) * 100;

    return (
        <div className="bg-black border-t-2 border-b-2 border-gray-800 py-8 my-12">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">
                        Season <span className="text-red-600">Progress</span>
                    </h3>
                    <div className="font-mono text-xs text-gray-400">
                        ROUND {currentRound} / {totalRounds}
                    </div>
                </div>

                <div className="relative h-4 bg-gray-900 w-full">
                    {/* Progress Bar */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="absolute top-0 left-0 h-full bg-red-600"
                    />

                    {/* Markers */}
                    {schedule.map((event, index) => {
                        const isCompleted = index + 1 <= currentRound;
                        const isNext = index + 1 === currentRound + 1;

                        // Only show some markers to avoid clutter
                        if (index % 3 !== 0 && !isNext && index !== totalRounds - 1) return null;

                        return (
                            <div
                                key={event.RoundNumber}
                                className="absolute top-0 h-full w-[1px] bg-black/50"
                                style={{ left: `${((index + 1) / totalRounds) * 100}%` }}
                            >
                                <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] font-mono whitespace-nowrap ${isNext ? 'text-white font-bold' : 'text-gray-600'}`}>
                                    {event.Country}
                                </div>
                                {isNext && (
                                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SeasonTimeline;
