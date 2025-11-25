import React, { useState } from 'react';
import { useQueries, UseQueryOptions } from '@tanstack/react-query';
import {
    fetchLapPositions,
    fetchSpecificRaceResults,
    fetchSessionIncidents,
    LapPositionDataPoint,
    DetailedRaceResult,
    SessionIncident
} from '@/lib/api';
import PositionChart from './PositionChart';
import LoadingSpinnerF1 from './ui/LoadingSpinnerF1';
import { AlertCircle, List, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import PositionsSummaryTable from './PositionsSummaryTable';
import KeyMomentsHighlight from './KeyMomentsHighlight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PositionsTabContentProps {
    year: number;
    event: string;
    session: string;
}

// Define Query Keys type for clarity
type PositionQueryKey = [string, number, string, string];

const PositionsTabContent: React.FC<PositionsTabContentProps> = ({ year, event, session }) => {
    // Add state for the active tab
    const [activeTab, setActiveTab] = useState<string>("overview");

    // Define queries - removed stint analysis
    const queries: Readonly<[
        UseQueryOptions<LapPositionDataPoint[], Error, LapPositionDataPoint[], PositionQueryKey>,
        UseQueryOptions<DetailedRaceResult[], Error, DetailedRaceResult[], PositionQueryKey>,
        UseQueryOptions<SessionIncident[], Error, SessionIncident[], PositionQueryKey>
    ]> = [
        {
            queryKey: ['lapPositions', year, event, session],
            queryFn: () => fetchLapPositions(year, event, session),
            staleTime: 1000 * 60 * 10,
            gcTime: 1000 * 60 * 30,
            retry: 1,
            enabled: !!year && !!event && !!session && (session === 'R' || session === 'Sprint'),
        },
        {
            queryKey: ['sessionResults', year, event, session],
            queryFn: () => fetchSpecificRaceResults(year, event, session),
            staleTime: 1000 * 60 * 10,
            gcTime: 1000 * 60 * 30,
            retry: 1,
            enabled: !!year && !!event && !!session && (session === 'R' || session === 'Sprint'),
        },
        {
            queryKey: ['sessionIncidents', year, event, session],
            queryFn: () => fetchSessionIncidents(year, event, session),
            staleTime: 1000 * 60 * 10,
            gcTime: 1000 * 60 * 30,
            retry: 1,
            enabled: !!year && !!event && !!session && (session === 'R' || session === 'Sprint'),
        }
    ];

    // Fetch data using useQueries
    const results = useQueries({ queries });

    // Extract data, loading, and error states
    const lapPositionsData = results[0]?.data as LapPositionDataPoint[] | undefined;
    const sessionResultsData = results[1]?.data as DetailedRaceResult[] | undefined;
    const incidentsData = results[2]?.data as SessionIncident[] | undefined;

    const isLoading = results.some(r => r.isLoading);
    const isError = results.some(r => r.isError);
    const combinedError = results.find(r => r.isError)?.error as Error | undefined;

    // --- Render States ---
    if (isLoading) {
        return (
            <Card className="bg-gray-900/70 border border-gray-700/80 animate-fade-in">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-semibold text-white">Position Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-[500px] w-full bg-gray-700/50" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isError || !lapPositionsData || !sessionResultsData) {
        return (
            <Card className="bg-gray-900/70 border border-gray-700/80 animate-fade-in">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-semibold text-white">Position Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full min-h-[200px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400 p-4 mt-4">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p className="font-semibold">Error Loading Position Data</p>
                        <p className="text-xs text-gray-500 mt-1">{combinedError?.message || 'Could not fetch all necessary data for the positions tab.'}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Render the position chart
    const renderPositionChart = () => {
        return (
            <PositionChart
                lapData={lapPositionsData}
                incidents={incidentsData}
                sessionResults={sessionResultsData}
                year={year}
            />
        );
    };

    // Render the analysis components
    const renderAnalysis = () => {
        return (
            <div className="space-y-4">
                <KeyMomentsHighlight lapData={lapPositionsData} />
                <PositionsSummaryTable sessionResults={sessionResultsData} year={year} />
            </div>
        );
    };

    // --- Render Actual Content with Tabs ---
    return (
        <Card className="bg-gray-900/70 border border-gray-700/80 animate-fade-in">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-white">Position Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-gray-800/80 border border-gray-700/60 p-1 h-auto mb-1">
                        <TabsTrigger 
                            value="overview" 
                            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 text-xs py-1.5 rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5"
                        >
                            <LineChart className="w-3.5 h-3.5"/>
                            Position Chart
                        </TabsTrigger>
                        <TabsTrigger 
                            value="analysis" 
                            className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 text-xs py-1.5 rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5"
                        >
                            <List className="w-3.5 h-3.5"/>
                            Analysis
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-4">
                        {renderPositionChart()}
                    </TabsContent>
                    
                    <TabsContent value="analysis" className="mt-4">
                        {renderAnalysis()}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default PositionsTabContent; 