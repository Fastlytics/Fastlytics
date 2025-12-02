import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp01Icon, ArrowDown01Icon, MinusSignCircleIcon, CrownIcon, Cancel01Icon
} from 'hugeicons-react';
import { fetchDriverStandings, DriverStanding, fetchSchedule, fetchRaceResults, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import { getTeamLogo } from '@/lib/teamUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';

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
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h3 className="text-lg font-bold uppercase tracking-tight">Select Season</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
                            <Cancel01Icon className="w-5 h-5" />
                        </button>
                    </div>
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

// Define rookies by season year
const rookiesByYear: { [year: string]: string[] } = {
    '2025': ['ANT', 'BOR', 'DOO', 'BEA', 'HAD', 'LAW', 'COL'],
    '2024': ['BEA', 'COL'],
    '2023': ['PIA', 'SAR', 'DEV'],
    '2022': ['ZHO'],
    '2021': ['MSC', 'MAZ', 'TSU'],
    '2020': ['LAT'],
    '2019': ['NOR', 'RUS', 'ALB']
};

const isRookie = (driverCode: string, year: number): boolean => {
    const yearStr = year.toString();
    return rookiesByYear[yearStr]?.includes(driverCode) || false;
};

const driverImageMap: Record<string, string> = {
    "ALB": "/drivers/2025williamsalealb01right.avif",
    "ALO": "/drivers/2025astonmartinferalo01right.avif",
    "BEA": "/drivers/2025haasf1teamolibea01right.avif",
    "BOR": "/drivers/2025kicksaubergabbor01right.avif",
    "COL": "/drivers/2025alpinefracol01right.avif",
    "GAS": "/drivers/2025alpinepiegas01right.avif",
    "HAD": "/drivers/2025racingbullsisahad01right.avif",
    "HAM": "/drivers/2025ferrarilewham01right.avif",
    "HUL": "/drivers/2025kicksaubernichul01right.avif",
    "LAW": "/drivers/2025racingbullslialaw01right.avif",
    "LEC": "/drivers/2025ferrarichalec01right.avif",
    "NOR": "/drivers/2025mclarenlannor01right.avif",
    "OCO": "/drivers/2025haasf1teamestoco01right.avif",
    "PIA": "/drivers/2025mclarenoscpia01right.avif",
    "RUS": "/drivers/2025mercedesgeorus01right.avif",
    "SAI": "/drivers/2025williamscarsai01right.avif",
    "STR": "/drivers/2025astonmartinlanstr01right.avif",
    "TSU": "/drivers/2025redbullracingyuktsu01right.avif",
    "VER": "/drivers/2025redbullracingmaxver01right.avif",
    "ANT": "/drivers/2025mercedesandant01right.avif",
};

// Helper to get team color class
const getTeamColorClass = (teamName: string | undefined): string => {
    if (!teamName) return 'gray';
    const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (simpleName.includes('mclaren')) return 'mclaren';
    if (simpleName.includes('mercedes')) return 'mercedes';
    if (simpleName.includes('redbull')) return 'redbull';
    if (simpleName.includes('ferrari')) return 'ferrari';
    if (simpleName.includes('alpine')) return 'alpine';
    if (simpleName.includes('astonmartin')) return 'astonmartin';
    if (simpleName.includes('williams')) return 'williams';
    if (simpleName.includes('haas')) return 'haas';
    if (simpleName.includes('sauber')) return 'alfaromeo';
    if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
    return 'gray';
};

// Leader Card Component - P1
const LeaderCard: React.FC<{ driver: DriverStanding; championshipStatus: 'leader' | 'champion'; selectedYear: number }> = ({ 
    driver, championshipStatus, selectedYear 
}) => {
    const teamColor = getTeamColorClass(driver.team);
    const driverIsRookie = isRookie(driver.code, selectedYear);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-900/30 via-gray-900 to-black border-2 border-yellow-500/50"
        >
            {/* Crown Icon */}
            <div className="absolute -top-2 -right-2 text-yellow-500/20">
                <CrownIcon className="w-24 h-24" />
            </div>

            {/* Team Color Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-f1-${teamColor}`} />

            <div className="relative z-10 p-4">
                {/* Champion Badge */}
                <div className="text-center mb-3">
                    <span className="inline-block px-3 py-1 bg-yellow-500 text-black font-bold text-[10px] uppercase tracking-widest rounded">
                        {championshipStatus === 'champion' ? "World Champion" : "Championship Leader"}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Driver Image */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                        {selectedYear === 2025 && driverImageMap[driver.code] ? (
                            <img
                                src={driverImageMap[driver.code]}
                                alt={driver.name}
                                className="w-full h-full object-cover object-top rounded-xl"
                                style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                            />
                        ) : (
                            <Avatar className="w-full h-full border-2 border-yellow-500/30">
                                <AvatarFallback className="text-2xl">{driver.code}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black text-sm">
                            1
                        </div>
                    </div>

                    {/* Driver Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-black uppercase tracking-tight">{driver.name}</h2>
                            {driverIsRookie && (
                                <span className="text-[9px] font-bold uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded">R</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 uppercase font-mono mb-3">{driver.team}</div>
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-3xl font-black text-white">{driver.points}</span>
                                <span className="text-xs text-gray-500 ml-1">PTS</span>
                            </div>
                            <div className="flex gap-3 text-center">
                                <div>
                                    <div className="text-lg font-bold text-yellow-500">{driver.wins}</div>
                                    <div className="text-[9px] text-gray-500 uppercase">Wins</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-300">{driver.podiums}</div>
                                    <div className="text-[9px] text-gray-500 uppercase">Pods</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Regular Driver Row Component (Expandable)
const DriverRow: React.FC<{ 
    driver: DriverStanding; 
    index: number; 
    selectedYear: number;
    openF1Drivers: OpenF1Driver[];
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ driver, index, selectedYear, openF1Drivers, isExpanded, onToggle }) => {
    const teamColor = getTeamColorClass(driver.team);
    const driverIsRookie = isRookie(driver.code, selectedYear);

    const getChangeIndicator = (change: number | undefined) => {
        if (change === undefined) return null;
        if (change > 0) return { color: 'text-green-500', icon: <ArrowUp01Icon className="h-3 w-3" /> };
        if (change < 0) return { color: 'text-red-500', icon: <ArrowDown01Icon className="h-3 w-3" /> };
        return { color: 'text-gray-500', icon: <MinusSignCircleIcon className="h-3 w-3" /> };
    };

    const indicator = getChangeIndicator(driver.points_change);

    const getDriverImage = (driverCode: string, driverName: string) => {
        if (selectedYear === 2025 && driverImageMap[driverCode]) {
            return driverImageMap[driverCode];
        }
        const openF1Driver = openF1Drivers.find(
            d => d.name_acronym === driverCode || 
            d.last_name.toUpperCase().includes(driverName.split(' ').pop()?.toUpperCase() || '')
        );
        return openF1Driver?.headshot_url;
    };

    const driverImage = getDriverImage(driver.code, driver.name);
    const has2025Image = selectedYear === 2025 && driverImageMap[driver.code];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            layout
            onClick={onToggle}
            className="relative bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 active:scale-[0.98] transition-transform cursor-pointer"
        >
            {/* Team Color Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-f1-${teamColor}`} />

            <AnimatePresence mode="wait">
                {isExpanded ? (
                    // Expanded View - Similar to Leader Card
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4"
                    >
                        <div className="flex items-center gap-4">
                            {/* Driver Image - Larger */}
                            <div className="relative w-20 h-20 flex-shrink-0">
                                {has2025Image ? (
                                    <img
                                        src={driverImageMap[driver.code]}
                                        alt={driver.name}
                                        className="w-full h-full object-cover object-top rounded-xl"
                                        style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                                    />
                                ) : (
                                    <Avatar className="w-full h-full border-2 border-gray-700">
                                        <AvatarImage 
                                            src={driverImage} 
                                            className="object-cover object-top bg-gray-800" 
                                        />
                                        <AvatarFallback className="text-xl">{driver.code}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                                    driver.rank === 2 ? "bg-gray-300 text-black" : 
                                    driver.rank === 3 ? "bg-amber-600 text-black" : "bg-gray-600 text-white"
                                )}>
                                    {driver.rank}
                                </div>
                            </div>

                            {/* Driver Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-lg font-black uppercase tracking-tight">{driver.name}</h2>
                                    {driverIsRookie && (
                                        <span className="text-[9px] font-bold uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded">R</span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 uppercase font-mono mb-2">{driver.team}</div>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-2xl font-black text-white">{driver.points}</span>
                                        <span className="text-xs text-gray-500 ml-1">PTS</span>
                                    </div>
                                    <div className="flex gap-3 text-center">
                                        <div>
                                            <div className="text-base font-bold text-yellow-500">{driver.wins}</div>
                                            <div className="text-[9px] text-gray-500 uppercase">Wins</div>
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-gray-300">{driver.podiums}</div>
                                            <div className="text-[9px] text-gray-500 uppercase">Pods</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // Collapsed View - Compact Row
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-3 pl-4"
                    >
                        {/* Position */}
                        <div className="w-8 text-center">
                            <span className={cn(
                                "text-lg font-black",
                                driver.rank === 2 ? "text-gray-300" : 
                                driver.rank === 3 ? "text-amber-600" : "text-gray-500"
                            )}>
                                {driver.rank}
                            </span>
                        </div>

                        {/* Avatar - with object-top for headshot focus */}
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-700 bg-gray-800 flex-shrink-0">
                            {has2025Image ? (
                                <img
                                    src={driverImageMap[driver.code]}
                                    alt={driver.name}
                                    className="w-full h-full object-cover object-top"
                                />
                            ) : (
                                <Avatar className="h-full w-full">
                                    <AvatarImage 
                                        src={driverImage} 
                                        className="object-cover object-top bg-gray-800" 
                                    />
                                    <AvatarFallback>{driver.code}</AvatarFallback>
                                </Avatar>
                            )}
                        </div>

                        {/* Driver Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm uppercase truncate">{driver.name}</h3>
                                {driverIsRookie && (
                                    <span className="text-[8px] font-bold uppercase bg-blue-600 text-white px-1 py-0.5 rounded">R</span>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-500 uppercase font-mono truncate">{driver.team}</div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <div className="text-right min-w-[50px]">
                                <div className="text-lg font-black">{driver.points}</div>
                                <div className="flex items-center justify-end gap-0.5 text-[9px] text-gray-500">
                                    <span>PTS</span>
                                    {indicator && (
                                        <span className={cn("flex items-center", indicator.color)}>
                                            {indicator.icon}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const MobileDriverStandings: React.FC = () => {
    const { selectedYear, setSelectedYear, availableYears } = useSeason();
    const [openF1Drivers, setOpenF1Drivers] = useState<OpenF1Driver[]>([]);
    const [showSeasonSelector, setShowSeasonSelector] = useState(false);
    const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

    useEffect(() => {
        const loadOpenF1Data = async () => {
            const drivers = await fetchAllOpenF1Drivers();
            setOpenF1Drivers(drivers);
        };
        loadOpenF1Data();
    }, []);

    // Fetch Driver Standings
    const { data: driverStandings, isLoading } = useQuery<DriverStanding[]>({
        queryKey: ['driverStandings', selectedYear],
        queryFn: () => fetchDriverStandings(selectedYear),
    });

    // Fetch Schedule for championship calculation
    const { data: schedule } = useQuery<ScheduleEvent[]>({
        queryKey: ['schedule', selectedYear],
        queryFn: () => fetchSchedule(selectedYear),
    });

    // Fetch Race Results for championship calculation
    const { data: raceResults } = useQuery<RaceResult[]>({
        queryKey: ['raceResults', selectedYear],
        queryFn: () => fetchRaceResults(selectedYear),
    });

    // Calculate Championship Status
    let championshipStatus: 'leader' | 'champion' = 'leader';
    if (driverStandings && driverStandings.length >= 2 && schedule && raceResults) {
        const p1Points = driverStandings[0].points;
        const p2Points = driverStandings[1].points;
        const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', selectedYear);
        championshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
    }

    const leader = driverStandings?.[0];
    const rest = driverStandings?.slice(1) || [];

    return (
        <MobileLayout>
            <div className="min-h-screen bg-black text-white">
                <MobilePageHeader />

                {/* Season Selector */}
                <div className="px-4 py-3">
                    <button
                        onClick={() => setShowSeasonSelector(true)}
                        className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-bold active:scale-95 transition-transform"
                    >
                        <span>{selectedYear} Season</span>
                        <ArrowDown01Icon className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-4 space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-36 bg-gray-900/50 animate-pulse rounded-2xl" />
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-900/50 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : driverStandings && driverStandings.length > 0 ? (
                        <>
                            {/* P1 Leader Card */}
                            {leader && (
                                <LeaderCard 
                                    driver={leader} 
                                    championshipStatus={championshipStatus}
                                    selectedYear={selectedYear}
                                />
                            )}

                            {/* Rest of the grid */}
                            <AnimatePresence>
                                {rest.map((driver, index) => (
                                    <DriverRow
                                        key={driver.code}
                                        driver={driver}
                                        index={index}
                                        selectedYear={selectedYear}
                                        openF1Drivers={openF1Drivers}
                                        isExpanded={expandedDriver === driver.code}
                                        onToggle={() => setExpandedDriver(
                                            expandedDriver === driver.code ? null : driver.code
                                        )}
                                    />
                                ))}
                            </AnimatePresence>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-sm">No standings available for {selectedYear}</p>
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

export default MobileDriverStandings;
