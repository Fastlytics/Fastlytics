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
import { AlertCircleIcon, Menu01Icon, Analytics01Icon } from 'hugeicons-react';
import { Skeleton } from './ui/skeleton';
import PositionsSummaryTable from './PositionsSummaryTable';
import KeyMomentsHighlight from './KeyMomentsHighlight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PositionsTabContentProps {
    year: number;
    event: string;
    session: string;
}

type PositionQueryKey = [string, number, string, string];

const PositionsTabContent: React.FC<PositionsTabContentProps> = ({ year, event, session }) => {
    const [activeTab, setActiveTab] = useState<string>("overview");

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

    const results = useQueries({ queries });

    const lapPositionsData = results[0]?.data as LapPositionDataPoint[] | undefined;
    const sessionResultsData = results[1]?.data as DetailedRaceResult[] | undefined;
    const incidentsData = results[2]?.data as SessionIncident[] | undefined;

    const isLoading = results.some(r => r.isLoading);
    const isError = results.some(r => r.isError);
    const combinedError = results.find(r => r.isError)?.error as Error | undefined;

    if (isLoading) {
        return (
            <div className="bg-black border-2 border-gray-800 p-6 h-full">
                <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full bg-gray-900" />
                </div>
            </div>
        );
    }

    if (isError || !lapPositionsData || !sessionResultsData) {
        return (
            <div className="bg-black border-2 border-gray-800 p-6 h-full flex items-center justify-center">
                <div className="text-center text-red-500">
                    <AlertCircleIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-bold uppercase">Error Loading Position Data</p>
                    <p className="text-xs text-gray-500 mt-1">{combinedError?.message || 'Could not fetch data.'}</p>
                </div>
            </div>
        );
    }

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

    const renderAnalysis = () => {
        return (
            <div className="space-y-6">
                <KeyMomentsHighlight lapData={lapPositionsData} />
                <PositionsSummaryTable sessionResults={sessionResultsData} year={year} />
            </div>
        );
    };

    return (
        <div className="h-full">
            <Tabs defaultValue="overview" className="w-full h-full flex flex-col" onValueChange={setActiveTab} value={activeTab}>
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Position Analysis</h3>
                    <TabsList className="bg-gray-900 border border-gray-800 p-1 h-auto rounded-none">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-none transition-colors"
                        >
                            Chart
                        </TabsTrigger>
                        <TabsTrigger
                            value="analysis"
                            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-none transition-colors"
                        >
                            Analysis
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0">
                    <TabsContent value="overview" className="h-full mt-0">
                        {renderPositionChart()}
                    </TabsContent>

                    <TabsContent value="analysis" className="h-full mt-0 overflow-y-auto pr-2">
                        {renderAnalysis()}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default PositionsTabContent;