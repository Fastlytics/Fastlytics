import React, { useState } from 'react';
import { useQueries, UseQueryOptions } from '@tanstack/react-query';
import {
  fetchLapPositions,
  fetchSpecificRaceResults,
  fetchSessionIncidents,
  LapPositionDataPoint,
  DetailedRaceResult,
  SessionIncident,
} from '@/lib/api';
import PositionChart from '@/components/charts/PositionChart';
import { AlertCircleIcon, Menu01Icon, Analytics01Icon, ChartLineData01Icon } from 'hugeicons-react';
import { Skeleton } from '@/components/ui/skeleton';
import PositionsSummaryTable from './PositionsSummaryTable';
import KeyMomentsHighlight from './KeyMomentsHighlight';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface PositionsTabContentProps {
  year: number;
  event: string;
  session: string;
  favoriteDriver?: string | null;
}

type PositionQueryKey = [string, number, string, string];

const PositionsTabContent: React.FC<PositionsTabContentProps> = ({
  year,
  event,
  session,
  favoriteDriver,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { trackInteraction } = useAnalytics();

  const queries: Readonly<
    [
      UseQueryOptions<LapPositionDataPoint[], Error, LapPositionDataPoint[], PositionQueryKey>,
      UseQueryOptions<DetailedRaceResult[], Error, DetailedRaceResult[], PositionQueryKey>,
      UseQueryOptions<SessionIncident[], Error, SessionIncident[], PositionQueryKey>,
    ]
  > = [
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
    },
  ];

  const results = useQueries({ queries });

  const lapPositionsData = results[0]?.data as LapPositionDataPoint[] | undefined;
  const sessionResultsData = results[1]?.data as DetailedRaceResult[] | undefined;
  const incidentsData = results[2]?.data as SessionIncident[] | undefined;

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const combinedError = results.find((r) => r.isError)?.error as Error | undefined;

  if (isLoading) {
    return (
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-neutral-800 border-t-red-600 rounded-full animate-spin"></div>
          <div className="text-neutral-500 font-mono text-xs animate-pulse uppercase">
            Loading Position Data...
          </div>
        </div>
      </div>
    );
  }

  if (isError || !lapPositionsData || !sessionResultsData) {
    return (
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 h-[500px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <AlertCircleIcon className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold text-lg">Error Loading Data</p>
          <p className="text-xs text-neutral-500 mt-2 font-mono">
            {combinedError?.message || 'Could not fetch position data.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black p-0 h-[600px] flex flex-col">
      <Tabs
        defaultValue="overview"
        className="w-full h-full flex flex-col"
        onValueChange={(value) => {
          trackInteraction('positions_subtab_changed', { tab: value });
          setActiveTab(value);
        }}
        value={activeTab}
      >
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-6 shrink-0">
          <TabsList className="bg-neutral-900 p-0.5 h-auto rounded-lg border border-neutral-800 gap-0.5">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 text-xs font-medium py-2 px-4 rounded-md transition-all hover:text-white"
            >
              <ChartLineData01Icon className="w-3 h-3 mr-2" />
              Chart
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 text-xs font-medium py-2 px-4 rounded-md transition-all hover:text-white"
            >
              <Menu01Icon className="w-3 h-3 mr-2" />
              Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 relative">
          <TabsContent
            value="overview"
            className="h-full mt-0 animate-in fade-in zoom-in-95 duration-300"
          >
            <PositionChart
              lapData={lapPositionsData}
              incidents={incidentsData}
              sessionResults={sessionResultsData}
              year={year}
              favoriteDriver={favoriteDriver}
            />
          </TabsContent>

          <TabsContent
            value="analysis"
            className="h-full mt-0 overflow-y-auto pr-2 animate-in fade-in zoom-in-95 duration-300 space-y-6"
          >
            <KeyMomentsHighlight lapData={lapPositionsData} />
            <PositionsSummaryTable sessionResults={sessionResultsData} year={year} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export { PositionsTabContent };
export default PositionsTabContent;
