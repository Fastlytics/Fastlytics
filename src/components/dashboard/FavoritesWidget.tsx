import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DriverStanding, TeamStanding, ScheduleEvent, RaceResult } from '@/lib/api';
import { Profile } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { getTeamLogo } from '@/lib/teamUtils';
import { ChampionIcon, UserGroupIcon, ArrowRight01Icon, Settings02Icon, FireIcon, Alert01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';

interface FavoritesWidgetProps {
    profile: Profile | null;
    drivers: DriverStanding[];
    teams: TeamStanding[];
    isLoading: boolean;
}

const FavoritesWidget: React.FC<FavoritesWidgetProps> = ({ profile, drivers, teams, isLoading }) => {
    const [openF1Drivers, setOpenF1Drivers] = useState<OpenF1Driver[]>([]);

    useEffect(() => {
        const loadOpenF1Data = async () => {
            const drivers = await fetchAllOpenF1Drivers();
            setOpenF1Drivers(drivers);
        };
        loadOpenF1Data();
    }, []);

    const getDriverImage = (driverName: string) => {
        const driver = openF1Drivers.find(d => d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || ''));
        return driver?.headshot_url;
    };

    const favoriteDriver = useMemo(() => {
        if (!profile?.favorite_driver || !drivers.length) return null;
        return drivers.find(d =>
            d.code === profile.favorite_driver ||
            d.name.toLowerCase().includes(profile.favorite_driver.toLowerCase())
        );
    }, [profile, drivers]);

    const favoriteTeam = useMemo(() => {
        if (!profile?.favorite_team || !teams.length) return null;
        return teams.find(t =>
            t.team === profile.favorite_team ||
            t.team.toLowerCase().includes(profile.favorite_team.toLowerCase())
        );
    }, [profile, teams]);

    const driverRivals = useMemo(() => {
        if (!favoriteDriver) return null;
        const index = drivers.findIndex(d => d === favoriteDriver);
        return {
            ahead: index > 0 ? drivers[index - 1] : null,
            behind: index < drivers.length - 1 ? drivers[index + 1] : null
        };
    }, [favoriteDriver, drivers]);

    if (isLoading) {
        return <div className="h-64 bg-gray-900/50 animate-pulse border-2 border-gray-800 rounded-lg"></div>;
    }

    // Fallback State: No favorites selected
    if (!profile?.favorite_driver && !profile?.favorite_team) {
        return (
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 p-8 rounded-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Settings02Icon className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-600/20 rounded-lg">
                            <Alert01Icon className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                            Complete Your Setup
                        </h3>
                    </div>
                    <p className="text-gray-400 mb-6 text-lg">
                        Select your favorite driver and team to unlock personalized stats, rivalry tracking, and custom highlights across the dashboard.
                    </p>
                    <Link to="/account">
                        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
                            Personalize Dashboard <ArrowRight01Icon className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* My Garage */}
            <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ChampionIcon className="w-40 h-40 text-white" />
                </div>

                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-red-600 block"></span>
                    My <span className="text-gray-500">Garage</span>
                </h3>

                <div className="grid gap-4 relative z-10">
                    {favoriteDriver && (
                        <Link to={`/driver/${favoriteDriver.code}`} className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 hover:bg-gray-900 transition-colors group/card">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-gray-700">
                                    <AvatarImage src={getDriverImage(favoriteDriver.name)} className="object-cover bg-gray-800" />
                                    <AvatarFallback>{favoriteDriver.code}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Favorite Driver</div>
                                    <div className="font-black text-xl uppercase italic leading-none group-hover/card:text-red-500 transition-colors">
                                        {favoriteDriver.name}
                                    </div>
                                    <div className="text-xs font-mono text-gray-500 mt-1">{favoriteDriver.team}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-white">{favoriteDriver.rank}<span className="text-sm align-top text-gray-500 ml-1">POS</span></div>
                                <div className="text-sm font-mono text-red-500 font-bold">{favoriteDriver.points} PTS</div>
                            </div>
                        </Link>
                    )}

                    {favoriteTeam && (
                        <Link to="/standings/teams" className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 hover:bg-gray-900 transition-colors group/card">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 flex items-center justify-center bg-white/5 rounded p-2 border border-gray-700">
                                    {getTeamLogo(favoriteTeam.team) ? (
                                        <img src={getTeamLogo(favoriteTeam.team)!} alt={favoriteTeam.team} className="w-full h-full object-contain" />
                                    ) : (
                                        <UserGroupIcon className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Favorite Team</div>
                                    <div className="font-black text-xl uppercase italic leading-none group-hover/card:text-red-500 transition-colors">
                                        {favoriteTeam.team}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-white">{favoriteTeam.rank}<span className="text-sm align-top text-gray-500 ml-1">POS</span></div>
                                <div className="text-sm font-mono text-red-500 font-bold">{favoriteTeam.points} PTS</div>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Rivalry Tracker */}
            {favoriteDriver && driverRivals && (
                <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden group hover:border-red-600/50 transition-colors flex flex-col">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FireIcon className="w-40 h-40 text-white" />
                    </div>

                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                        <span className="w-1 h-8 bg-red-600 block"></span>
                        Rivalry <span className="text-gray-500">Tracker</span>
                    </h3>

                    <div className="flex-grow flex flex-col justify-center gap-4 relative z-10">
                        {/* Rival Ahead */}
                        {driverRivals.ahead ? (
                            <div className="flex items-center gap-4 p-3 border-l-2 border-gray-700 bg-gray-900/30">
                                <div className="text-xs font-bold text-gray-500 w-12 text-right">AHEAD</div>
                                <Avatar className="h-8 w-8 border border-gray-700">
                                    <AvatarImage src={getDriverImage(driverRivals.ahead.name)} className="object-cover" />
                                    <AvatarFallback>{driverRivals.ahead.code}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <div className="font-bold text-sm uppercase">{driverRivals.ahead.name}</div>
                                    <div className="text-xs text-gray-500">{driverRivals.ahead.team}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-red-500 font-bold">+{driverRivals.ahead.points - favoriteDriver.points}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Gap</div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 text-center text-gray-500 text-sm italic border-l-2 border-transparent">
                                Leading the Championship!
                            </div>
                        )}

                        {/* YOU */}
                        <div className="flex items-center gap-4 p-4 border-l-4 border-red-600 bg-red-600/10 my-1">
                            <div className="text-xs font-bold text-red-500 w-12 text-right">YOU</div>
                            <Avatar className="h-10 w-10 border-2 border-red-600">
                                <AvatarImage src={getDriverImage(favoriteDriver.name)} className="object-cover" />
                                <AvatarFallback>{favoriteDriver.code}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <div className="font-black text-lg uppercase italic">{favoriteDriver.name}</div>
                                <div className="text-xs text-red-400 font-bold">{favoriteDriver.points} PTS</div>
                            </div>
                        </div>

                        {/* Rival Behind */}
                        {driverRivals.behind ? (
                            <div className="flex items-center gap-4 p-3 border-l-2 border-gray-700 bg-gray-900/30">
                                <div className="text-xs font-bold text-gray-500 w-12 text-right">BEHIND</div>
                                <Avatar className="h-8 w-8 border border-gray-700">
                                    <AvatarImage src={getDriverImage(driverRivals.behind.name)} className="object-cover" />
                                    <AvatarFallback>{driverRivals.behind.code}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <div className="font-bold text-sm uppercase">{driverRivals.behind.name}</div>
                                    <div className="text-xs text-gray-500">{driverRivals.behind.team}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-green-500 font-bold">-{favoriteDriver.points - driverRivals.behind.points}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Gap</div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 text-center text-gray-500 text-sm italic border-l-2 border-transparent">
                                Last in the standings
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FavoritesWidget;
