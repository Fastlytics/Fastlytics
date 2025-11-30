import React from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useSeason } from '@/contexts/SeasonContext';
import { ChampionIcon, UserGroupIcon, ArrowRight01Icon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { getTeamLogo } from '@/lib/teamUtils';

interface ChampionshipWidgetProps {
    drivers: DriverStanding[];
    teams: TeamStanding[];
    isLoading: boolean;
}

interface ChampionshipWidgetProps {
    drivers: DriverStanding[];
    teams: TeamStanding[];
    schedule: ScheduleEvent[];
    raceResults: RaceResult[];
    isLoading: boolean;
}

const ChampionshipWidget: React.FC<ChampionshipWidgetProps> = ({ drivers, teams, schedule, raceResults, isLoading }) => {
    const topDrivers = drivers.slice(0, 3);
    const topTeams = teams.slice(0, 3);
    const { selectedYear } = useSeason();
    const [openF1Drivers, setOpenF1Drivers] = useState<OpenF1Driver[]>([]);

    useEffect(() => {
        const loadOpenF1Data = async () => {
            const drivers = await fetchAllOpenF1Drivers();
            setOpenF1Drivers(drivers);
        };
        loadOpenF1Data();
    }, []);

    const getDriverImage = (driverCode: string, driverName: string) => {
        const driver = openF1Drivers.find(d => d.name_acronym === driverCode || d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || ''));
        return driver?.headshot_url;
    };

    const getGap = (points: number, leaderPoints: number) => {
        const gap = leaderPoints - points;
        return gap === 0 ? 'LEADER' : `-${gap}`;
    };

    // Calculate Driver Championship Status
    let driverChampionshipStatus: 'leader' | 'champion' = 'leader';
    if (drivers.length >= 2 && schedule.length > 0 && raceResults) {
        const p1Points = drivers[0].points;
        const p2Points = drivers[1].points;
        const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
        driverChampionshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
    }

    // Calculate Team Championship Status
    let teamChampionshipStatus: 'leader' | 'champion' = 'leader';
    if (teams.length >= 2 && schedule.length > 0 && raceResults) {
        const p1Points = teams[0].points;
        const p2Points = teams[1].points;
        const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
        teamChampionshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
    }

    if (isLoading) {
        return <div className="h-96 bg-gray-900/50 animate-pulse border-2 border-gray-800"></div>;
    }

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Drivers Championship */}
            <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ChampionIcon className="w-32 h-32 text-white" />
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
                            className={`flex items-center justify-between p-3 border-l-4 ${index === 0 ? (driverChampionshipStatus === 'champion' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-gray-900 border-yellow-500') : 'bg-gray-900/50 border-gray-700'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`font-mono font-bold text-xl w-6 ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                    {index + 1}
                                </span>
                                <Link to={`/driver/${driver.code}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    <Avatar className="h-10 w-10 border-2 border-gray-700">
                                        <AvatarImage src={getDriverImage(driver.code, driver.name)} className="object-cover bg-gray-800" />
                                        <AvatarFallback>{driver.code}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-lg leading-none">{driver.name.split(' ').pop()?.toUpperCase()}</div>
                                            {index === 0 && driverChampionshipStatus === 'champion' && (
                                                <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">Champion</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">{driver.team}</div>
                                    </div>
                                </Link>
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
                        Full Standings <ArrowRight01Icon className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Constructors Championship */}
            <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <UserGroupIcon className="w-32 h-32 text-white" />
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
                            className={`flex items-center justify-between p-3 border-l-4 ${index === 0 ? (teamChampionshipStatus === 'champion' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-gray-900 border-yellow-500') : 'bg-gray-900/50 border-gray-700'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`font-mono font-bold text-xl w-6 ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                    {index + 1}
                                </span>
                                <div>
                                    <div className="flex items-center gap-3">
                                        {getTeamLogo(team.team) && (
                                            <img src={getTeamLogo(team.team)!} alt={team.team} className={`h-6 w-auto object-contain ${team.team.toLowerCase().includes('aston') ? 'h-3' : ''}`} />
                                        )}
                                        <div className="font-bold text-lg leading-none">{team.team.toUpperCase()}</div>
                                        {index === 0 && teamChampionshipStatus === 'champion' && (
                                            <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">Champion</span>
                                        )}
                                    </div>
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
                        Full Standings <ArrowRight01Icon className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ChampionshipWidget;
