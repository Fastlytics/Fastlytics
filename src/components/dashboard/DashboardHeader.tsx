import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Flag } from 'lucide-react';

interface DashboardHeaderProps {
    selectedYear: number;
    nextRace?: {
        name: string;
        date: string;
        location: string;
        daysUntil: number;
    };
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ selectedYear, nextRace }) => {
    return (
        <div className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-4 border-white pb-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 mb-2"
                    >
                        <span className="bg-red-600 text-white px-3 py-1 font-mono font-bold text-sm uppercase tracking-wider">
                            Season {selectedYear}
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white"
                    >
                        Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">Center</span>
                    </motion.h1>
                </div>

                {nextRace && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gray-900 border-2 border-gray-800 p-4 min-w-[300px]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-gray-500 uppercase">Next Grand Prix</span>
                            <Flag className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-xl font-bold uppercase text-white mb-1 truncate">
                            {nextRace.name}
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-sm text-gray-400 font-mono">
                                {nextRace.location}
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-white">{nextRace.daysUntil}</span>
                                <span className="text-xs text-red-600 font-bold uppercase ml-1">Days</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default DashboardHeader;
