import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { useSeason } from '@/contexts/SeasonContext';
import { Profile } from '@/contexts/AuthContext';
import { ChampionIcon, UserGroupIcon, ArrowRight01Icon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { getTeamLogo } from '@/lib/teamUtils';
import { cn } from '@/lib/utils';

interface MobileChampionshipWidgetProps {
    drivers: DriverStanding[];
    teams: TeamStanding[];
    schedule: ScheduleEvent[];
    raceResults: RaceResult[];
    isLoading: boolean;
    profile?: Profile | null;
}

const MobileChampionshipWidget: React.FC<MobileChampionshipWidgetProps> = ({
    drivers,
    teams,
    schedule,
    raceResults,
    isLoading,
    profile
}) => {
    const [activeTab, setActiveTab] = useState<'drivers' | 'constructors'>('drivers');
    const topDrivers = drivers.slice(0, 5);
    const topTeams = teams.slice(0, 5);
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
        const driver = openF1Drivers.find(d =>
            d.name_acronym === driverCode ||
            d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || '')
        );
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
        return (
            <div className="space-y-3">
                <div className="h-12 bg-gray-900/50 animate-pulse rounded-lg" />
                <div className="h-64 bg-gray-900/50 animate-pulse rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tab Selector */}
            <div className="flex bg-gray-900/50 border border-gray-800 rounded-xl p-1">
                <button
                    onClick={() => setActiveTab('drivers')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                        activeTab === 'drivers'
                            ? "bg-red-600 text-white"
                            : "text-gray-500 active:bg-gray-800"
                    )}
                >
                    <ChampionIcon className="w-4 h-4" />
                    Drivers
                </button>
                <button
                    onClick={() => setActiveTab('constructors')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                        activeTab === 'constructors'
                            ? "bg-red-600 text-white"
                            : "text-gray-500 active:bg-gray-800"
                    )}
                >
                    <UserGroupIcon className="w-4 h-4" />
                    Teams
                </button>
            </div>

            {/* Championship Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 'drivers' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-black border border-gray-800 rounded-xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                        <span className="w-1 h-6 bg-red-600 block rounded"></span>
                        {activeTab === 'drivers' ? 'Drivers' : 'Constructors'}
                        <span className="text-gray-500 ml-1">Championship</span>
                    </h3>
                    <Link
                        to={activeTab === 'drivers' ? '/standings/drivers' : '/standings/teams'}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1"
                    >
                        All <ArrowRight01Icon className="w-3 h-3" />
                    </Link>
                </div>

                {/* Standings List */}
                <div className="divide-y divide-gray-800/50">
                    {activeTab === 'drivers' ? (
                        topDrivers.map((driver, index) => {
                            const isFavorite = profile?.favorite_driver && (
                                driver.code === profile.favorite_driver ||
                                driver.name.toLowerCase().includes(profile.favorite_driver.toLowerCase())
                            );
                            const isLeader = index === 0;
                            const isChampion = isLeader && driverChampionshipStatus === 'champion';

                            return (
                                <Link
                                    key={driver.code}
                                    to={`/driver/${driver.code}`}
                                    className={cn(
                                        "flex items-center gap-3 p-3 active:bg-gray-900/50 transition-colors border-l-4",
                                        isFavorite ? "bg-red-600/10 border-red-600" : "bg-gray-900/50 border-transparent"
                                    )}
                                >
                                    {/* Position */}
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-sm font-black",
                                        isLeader ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-400"
                                    )}>
                                        {index + 1}
                                    </div>

                                    {/* Avatar */}
                                    <Avatar className={cn(
                                        "h-10 w-10 border-2",
                                        isFavorite ? "border-red-600" : "border-gray-700"
                                    )}>
                                        <AvatarImage
                                            src={getDriverImage(driver.code, driver.name)}
                                            className="object-cover bg-gray-800"
                                        />
                                        <AvatarFallback className="bg-gray-800 text-xs">
                                            {driver.code}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Name & Team */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base uppercase truncate">
                                                {driver.name.split(' ').pop()}
                                            </span>
                                            {isChampion && (
                                                <span className="bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                    Champion
                                                </span>
                                            )}
                                            {isFavorite && !isChampion && (
                                                <span className="text-red-500 text-[10px]">★</span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-gray-500 truncate">
                                            {driver.team}
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right">
                                        <div className="text-lg font-black tabular-nums">{driver.points}</div>
                                        <div className={cn(
                                            "text-[10px] font-mono",
                                            isLeader ? "text-yellow-500" : "text-gray-500"
                                        )}>
                                            {getGap(driver.points, topDrivers[0].points)}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        topTeams.map((team, index) => {
                            const isFavorite = profile?.favorite_team && (
                                team.team === profile.favorite_team ||
                                team.team.toLowerCase().includes(profile.favorite_team.toLowerCase())
                            );
                            const isLeader = index === 0;
                            const isChampion = isLeader && teamChampionshipStatus === 'champion';

                            return (
                                <Link
                                    key={team.team}
                                    to="/standings/teams"
                                    className={cn(
                                        "flex items-center gap-3 p-3 active:bg-gray-900/50 transition-colors border-l-4",
                                        isFavorite ? "bg-red-600/10 border-red-600" : "bg-gray-900/50 border-transparent"
                                    )}
                                >
                                    {/* Position */}
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-sm font-black",
                                        isLeader ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-400"
                                    )}>
                                        {index + 1}
                                    </div>

                                    {/* Logo */}
                                    <div className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-lg border border-gray-700 p-1.5">
                                        {getTeamLogo(team.team) ? (
                                            <img
                                                src={getTeamLogo(team.team)!}
                                                alt={team.team}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <UserGroupIcon className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base uppercase truncate">
                                                {team.team}
                                            </span>
                                            {isChampion && (
                                                <span className="bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                    Champion
                                                </span>
                                            )}
                                            {isFavorite && !isChampion && (
                                                <span className="text-red-500 text-[10px]">★</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right">
                                        <div className="text-lg font-black tabular-nums">{team.points}</div>
                                        <div className={cn(
                                            "text-[10px] font-mono",
                                            isLeader ? "text-yellow-500" : "text-gray-500"
                                        )}>
                                            {getGap(team.points, topTeams[0].points)}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* View All Link */}
                <Link
                    to={activeTab === 'drivers' ? '/standings/drivers' : '/standings/teams'}
                    className="flex items-center justify-center gap-2 p-3 border-t border-gray-800 text-sm font-bold uppercase tracking-widest text-gray-500 active:bg-gray-900/50"
                >
                    View Full Standings <ArrowRight01Icon className="w-4 h-4" />
                </Link>
            </motion.div>
        </div>
    );
};

export default MobileChampionshipWidget;
