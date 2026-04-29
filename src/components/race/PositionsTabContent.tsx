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
import { AlertCircleIcon, ChartLineData01Icon, Menu01Icon } from 'hugeicons-react';
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
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
        <div className="mb-6">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/80">
            Positions
          </p>
          <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">
            Lap-by-Lap Positions
          </p>
        </div>
        <div className="flex h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-red-400" />
            <div className="text-[12px] text-white animate-pulse">Loading position data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !lapPositionsData || !sessionResultsData) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
        <div className="mb-6">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/80">
            Positions
          </p>
          <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">
            Lap-by-Lap Positions
          </p>
        </div>
        <div className="flex h-[500px] items-center justify-center">
          <div className="text-center text-red-400">
            <AlertCircleIcon className="mx-auto mb-3 h-9 w-9" />
            <p className="text-[14px] font-semibold">Error Loading Data</p>
            <p className="mt-1 text-[12px] text-white">
              {combinedError?.message || 'Could not fetch position data.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-white/80">
            Positions
          </p>
          <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">
            Lap-by-Lap Positions
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="w-full"
        onValueChange={(value) => {
          trackInteraction('positions_subtab_changed', { tab: value });
          setActiveTab(value);
        }}
        value={activeTab}
      >
        <TabsList className="h-auto w-full gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 sm:w-auto">
          <TabsTrigger
            value="overview"
            className="flex-1 rounded-md text-[12px] font-semibold uppercase tracking-wider text-white transition-all hover:text-white data-[state=active]:bg-white/[0.08] data-[state=active]:text-white sm:flex-none"
          >
            <ChartLineData01Icon className="mr-1.5 h-3.5 w-3.5" />
            Chart
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="flex-1 rounded-md text-[12px] font-semibold uppercase tracking-wider text-white transition-all hover:text-white data-[state=active]:bg-white/[0.08] data-[state=active]:text-white sm:flex-none"
          >
            <Menu01Icon className="mr-1.5 h-3.5 w-3.5" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="h-[600px]">
            <PositionChart
              lapData={lapPositionsData}
              incidents={incidentsData}
              sessionResults={sessionResultsData}
              year={year}
              favoriteDriver={favoriteDriver}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="analysis"
          className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6"
        >
          <KeyMomentsHighlight lapData={lapPositionsData} />
          <PositionsSummaryTable sessionResults={sessionResultsData} year={year} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { PositionsTabContent };
export default PositionsTabContent;
