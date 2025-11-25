import React from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding } from '@/lib/api';
import { Trophy, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChampionshipWidgetProps {
    drivers: DriverStanding[];
    teams: TeamStanding[];
    isLoading: boolean;
}

const ChampionshipWidget: React.FC<ChampionshipWidgetProps> = ({ drivers, teams, isLoading }) => {
    const topDrivers = drivers.slice(0, 3);
    const topTeams = teams.slice(0, 3);

    const getGap = (points: number, leaderPoints: number) => {
        const gap = leaderPoints - points;
        return gap === 0 ? 'LEADER' : `-${gap}`;
    };

    if (isLoading) {
        return <div className="h-96 bg-gray-900/50 animate-pulse border-2 border-gray-800"></div>;
    }

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Drivers Championship */}
            <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="w-32 h-32 text-white" />
                </div>

                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-red-600 block"></span>
                    Drivers <span className="text-gray-500">Title</span>
                </h3>

                <div className="space-y-4 relative z-10 flex-grow">
                    {topDrivers.map((driver, index) => (
                        <motion.div
                            key={driver.code}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center justify-between p-3 border-l-4 ${index === 0 ? 'bg-gray-900 border-yellow-500' : 'bg-gray-900/50 border-gray-700'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`font-mono font-bold text-xl w-6 ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                    {index + 1}
                                </span>
                                <div>
                                    <div className="font-bold text-lg leading-none">{driver.name.split(' ').pop()?.toUpperCase()}</div>
                                    <div className="text-xs text-gray-500 font-mono">{driver.team}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-xl">{driver.points}</div>
                                <div className="text-xs font-mono text-gray-500">
                                    {getGap(driver.points, topDrivers[0].points)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800 relative z-10">
                    <Link to="/standings/drivers" className="flex items-center justify-end gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors">
                        Full Standings <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Constructors Championship */}
            <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-32 h-32 text-white" />
                </div>

                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-red-600 block"></span>
                    Constructors <span className="text-gray-500">Title</span>
                </h3>

                <div className="space-y-4 relative z-10 flex-grow">
                    {topTeams.map((team, index) => (
                        <motion.div
                            key={team.team}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            className={`flex items-center justify-between p-3 border-l-4 ${index === 0 ? 'bg-gray-900 border-yellow-500' : 'bg-gray-900/50 border-gray-700'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`font-mono font-bold text-xl w-6 ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                    {index + 1}
                                </span>
                                <div>
                                    <div className="font-bold text-lg leading-none">{team.team.toUpperCase()}</div>
                                    <div className="text-xs text-gray-500 font-mono">{team.wins} Wins</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-xl">{team.points}</div>
                                <div className="text-xs font-mono text-gray-500">
                                    {getGap(team.points, topTeams[0].points)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800 relative z-10">
                    <Link to="/standings/teams" className="flex items-center justify-end gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors">
                        Full Standings <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ChampionshipWidget;
