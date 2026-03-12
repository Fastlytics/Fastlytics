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
      <div className="bg-neutral-950/80 border border-neutral-800/60 rounded-xl overflow-hidden h-[600px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-800 border-t-red-500 rounded-full animate-spin" />
          <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider animate-pulse">Loading position data...</span>
        </div>
      </div>
    );
  }

  if (isError || !lapPositionsData || !sessionResultsData) {
    return (
      <div className="bg-neutral-950/80 border border-neutral-800/60 rounded-xl overflow-hidden h-[500px] flex items-center justify-center">
        <div className="text-center text-red-400">
          <AlertCircleIcon className="w-8 h-8 mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold">Error Loading Data</p>
          <p className="text-xs text-neutral-500 mt-2 font-mono">
            {combinedError?.message || 'Could not fetch position data.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950/80 border border-neutral-800/60 rounded-xl overflow-hidden h-[650px] flex flex-col">
      <Tabs
        defaultValue="overview"
        className="w-full h-full flex flex-col"
        onValueChange={(value) => {
          trackInteraction('positions_subtab_changed', { tab: value });
          setActiveTab(value);
        }}
        value={activeTab}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-red-500 rounded-full" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-300">Position Tracking</h3>
          </div>
          <TabsList className="bg-neutral-900/60 p-0.5 h-auto rounded-lg border border-neutral-800/50 gap-0.5">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-neutral-700/80 data-[state=active]:text-white text-neutral-500 text-[11px] font-medium py-1.5 px-3.5 rounded-md transition-all hover:text-neutral-200"
            >
              <ChartLineData01Icon className="w-3 h-3 mr-1.5" />
              Chart
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-neutral-700/80 data-[state=active]:text-white text-neutral-500 text-[11px] font-medium py-1.5 px-3.5 rounded-md transition-all hover:text-neutral-200"
            >
              <Menu01Icon className="w-3 h-3 mr-1.5" />
              Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 relative p-5">
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
