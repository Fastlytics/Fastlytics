import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeamPaceData } from '@/lib/api';
import { cn, formatTime } from '@/lib/utils'; // Assuming formatTime exists

// Helper function to get team color class (Should be centralized)
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
    if (simpleName.includes('sauber') || simpleName.includes('kick')) return 'alfaromeo';
    if (simpleName.includes('racingbulls') || simpleName.includes('rb') || simpleName.includes('visa')) return 'alphatauri';
    return 'gray';
}

interface TeamPaceTableProps {
    teamPaceData?: TeamPaceData[];
}

const TeamPaceTable: React.FC<TeamPaceTableProps> = ({ teamPaceData }) => {
    if (!teamPaceData || teamPaceData.length === 0) {
        return (
            <Card className="bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm mt-4">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Team Race Pace Ranking</CardTitle>
                    <CardDescription className="text-xs text-gray-400">Based on median time of laps within 107% of the fastest lap.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-400">No team pace data available for this session.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm animate-fade-in mt-4">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Team Race Pace Ranking</CardTitle>
                <CardDescription className="text-xs text-gray-400">Based on median time of laps within 107% of the fastest lap.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-800/50">
                            <TableRow className="border-gray-700">
                                <TableHead className="w-[50px] text-center text-white font-semibold">Rank</TableHead>
                                <TableHead className="text-white font-semibold">Team</TableHead>
                                <TableHead className="w-[120px] text-right text-white font-semibold">Median Pace</TableHead>
                                <TableHead className="w-[120px] text-right text-white font-semibold">Average Pace</TableHead>
                                <TableHead className="w-[100px] text-right text-white font-semibold">Std Dev (s)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamPaceData.map((team) => {
                                const teamColor = getTeamColorClass(team.teamName);
                                return (
                                    <TableRow key={team.teamName} className="border-gray-700/50 hover:bg-gray-800/40 transition-colors">
                                        <TableCell className="text-center font-medium">{team.rank}</TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-2">
                                                <span className={cn("w-2 h-2 rounded-full", `bg-f1-${teamColor}`)}></span>
                                                {team.teamName}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatTime(team.medianTime)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatTime(team.averageTime)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{team.stdDev.toFixed(3)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                        <TableCaption className="text-xs text-gray-500 pt-2">Std Dev indicates lap time consistency (lower is more consistent).</TableCaption>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default TeamPaceTable; 