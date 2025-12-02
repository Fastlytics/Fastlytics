import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp01Icon, ArrowDown01Icon, MinusSignCircleIcon, CrownIcon, Cancel01Icon
} from 'hugeicons-react';
import { fetchTeamStandings, TeamStanding, fetchSchedule, fetchRaceResults, ScheduleEvent, RaceResult } from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getTeamLogo } from '@/lib/teamUtils';
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
                                className={`w-full p-4 text-left rounded-xl transition-colors flex items-center justify-between ${selectedYear === year
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

// Team car mapping for 2025
const teamCarMap: Record<string, string> = {
    'mclaren': '/cars/2025mclarencarright.avif',
    'mercedes': '/cars/2025mercedescarright.avif',
    'redbull': '/cars/2025redbullracingcarright.avif',
    'ferrari': '/cars/2025ferraricarright.avif',
    'alpine': '/cars/2025alpinecarright.avif',
    'astonmartin': '/cars/2025astonmartincarright.avif',
    'williams': '/cars/2025williamscarright.avif',
    'haas': '/cars/2025haascarright.avif',
    'alfaromeo': '/cars/2025kicksaubercarright.avif',
    'alphatauri': '/cars/2025racingbullscarright.avif',
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

// Get team car image
const getTeamCarImage = (teamName: string): string | undefined => {
    const teamColor = getTeamColorClass(teamName);
    return teamCarMap[teamColor];
};

// Leader Card Component - P1
const LeaderCard: React.FC<{ team: TeamStanding; championshipStatus: 'leader' | 'champion'; selectedYear: number }> = ({
    team, championshipStatus, selectedYear
}) => {
    const teamColor = getTeamColorClass(team.team);
    const carImage = selectedYear === 2025 ? getTeamCarImage(team.team) : undefined;
    const logo = getTeamLogo(team.team);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-yellow-950 border-2 border-yellow-500"
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
                        {championshipStatus === 'champion' ? "Constructors' Champion" : "Constructors' Leader"}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Team Logo & Car */}
                    <div className="relative w-28 flex-shrink-0">
                        {carImage ? (
                            <img
                                src={carImage}
                                alt={team.team}
                                className="w-full h-auto object-contain"
                            />
                        ) : logo ? (
                            <img
                                src={logo}
                                alt={team.team}
                                className="w-20 h-auto object-contain mx-auto"
                            />
                        ) : (
                            <div className={`w-20 h-12 rounded bg-f1-${teamColor}/30 mx-auto`} />
                        )}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black text-sm">
                            1
                        </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex-1">
                        <h2 className="text-lg font-black uppercase tracking-tight mb-1">{team.team}</h2>
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-3xl font-black text-white">{team.points}</span>
                                <span className="text-xs text-gray-500 ml-1">PTS</span>
                            </div>
                            <div className="flex gap-3 text-center">
                                <div>
                                    <div className="text-lg font-bold text-yellow-500">{team.wins}</div>
                                    <div className="text-[9px] text-gray-500 uppercase">Wins</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-300">{team.podiums}</div>
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

// Regular Team Row Component (Expandable)
const TeamRow: React.FC<{
    team: TeamStanding;
    index: number;
    selectedYear: number;
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ team, index, selectedYear, isExpanded, onToggle }) => {
    const teamColor = getTeamColorClass(team.team);
    const carImage = selectedYear === 2025 ? getTeamCarImage(team.team) : undefined;
    const logo = getTeamLogo(team.team);

    const getChangeIndicator = (change: number | undefined) => {
        if (change === undefined) return null;
        if (change > 0) return { color: 'text-green-500', icon: <ArrowUp01Icon className="h-3 w-3" /> };
        if (change < 0) return { color: 'text-red-500', icon: <ArrowDown01Icon className="h-3 w-3" /> };
        return { color: 'text-gray-500', icon: <MinusSignCircleIcon className="h-3 w-3" /> };
    };

    const indicator = getChangeIndicator(team.points_change);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            layout
            onClick={onToggle}
            className="relative bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 active:scale-[0.98] transition-transform cursor-pointer"
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
                            {/* Team Logo/Car - Larger */}
                            <div className="relative w-24 flex-shrink-0">
                                {carImage ? (
                                    <img
                                        src={carImage}
                                        alt={team.team}
                                        className="w-full h-auto object-contain"
                                    />
                                ) : logo ? (
                                    <img
                                        src={logo}
                                        alt={team.team}
                                        className="w-16 h-auto object-contain mx-auto"
                                    />
                                ) : (
                                    <div className={`w-16 h-10 rounded bg-f1-${teamColor}/30 mx-auto`} />
                                )}
                                <div className={cn(
                                    "absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                                    team.rank === 2 ? "bg-gray-300 text-black" :
                                        team.rank === 3 ? "bg-amber-600 text-black" : "bg-gray-600 text-white"
                                )}>
                                    {team.rank}
                                </div>
                            </div>

                            {/* Team Info */}
                            <div className="flex-1">
                                <h2 className="text-lg font-black uppercase tracking-tight mb-2">{team.team}</h2>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-2xl font-black text-white">{team.points}</span>
                                        <span className="text-xs text-gray-500 ml-1">PTS</span>
                                    </div>
                                    <div className="flex gap-3 text-center">
                                        <div>
                                            <div className="text-base font-bold text-yellow-500">{team.wins}</div>
                                            <div className="text-[9px] text-gray-500 uppercase">Wins</div>
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-gray-300">{team.podiums}</div>
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
                                team.rank === 2 ? "text-gray-300" :
                                    team.rank === 3 ? "text-amber-600" : "text-gray-500"
                            )}>
                                {team.rank}
                            </span>
                        </div>

                        {/* Team Logo/Car */}
                        <div className="w-16 h-10 flex items-center justify-center flex-shrink-0">
                            {carImage ? (
                                <img
                                    src={carImage}
                                    alt={team.team}
                                    className="w-full h-auto object-contain"
                                />
                            ) : logo ? (
                                <img
                                    src={logo}
                                    alt={team.team}
                                    className={cn("h-6 w-auto object-contain", team.team.toLowerCase().includes('aston') ? "h-3" : "")}
                                />
                            ) : (
                                <div className={`w-12 h-8 rounded bg-f1-${teamColor}/30`} />
                            )}
                        </div>

                        {/* Team Name */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm uppercase truncate">{team.team}</h3>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <div className="text-right min-w-[50px]">
                                <div className="text-lg font-black">{team.points}</div>
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

const MobileTeamStandings: React.FC = () => {
    const { selectedYear, setSelectedYear, availableYears } = useSeason();
    const [showSeasonSelector, setShowSeasonSelector] = useState(false);
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

    // Fetch Team Standings
    const { data: teamStandings, isLoading } = useQuery<TeamStanding[]>({
        queryKey: ['teamStandings', selectedYear],
        queryFn: () => fetchTeamStandings(selectedYear),
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
    if (teamStandings && teamStandings.length >= 2 && schedule && raceResults) {
        const p1Points = teamStandings[0].points;
        const p2Points = teamStandings[1].points;
        const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
        championshipStatus = getChampionshipStatus(p1Points, p2Points, remainingPoints);
    }

    const leader = teamStandings?.[0];
    const rest = teamStandings?.slice(1) || [];

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
                    ) : teamStandings && teamStandings.length > 0 ? (
                        <>
                            {/* P1 Leader Card */}
                            {leader && (
                                <LeaderCard
                                    team={leader}
                                    championshipStatus={championshipStatus}
                                    selectedYear={selectedYear}
                                />
                            )}

                            {/* Rest of the grid */}
                            <AnimatePresence>
                                {rest.map((team, index) => (
                                    <TeamRow
                                        key={team.team}
                                        team={team}
                                        index={index}
                                        selectedYear={selectedYear}
                                        isExpanded={expandedTeam === team.team}
                                        onToggle={() => setExpandedTeam(
                                            expandedTeam === team.team ? null : team.team
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

export default MobileTeamStandings;
