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
import PositionsSummaryTable from './PositionsSummaryTable';
import KeyMomentsHighlight from './KeyMomentsHighlight';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';

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
  const [activeTab, setActiveTab] = useState<string>('chart');
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
      <div className={CARD_CONTAINER}>
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-[16px] font-semibold text-white">Position Changes</h3>
          <p className="mt-0.5 text-[12px] text-white/80">Lap-by-lap position tracking</p>
        </div>
        <div className="flex h-[500px] items-center justify-center border-t border-white/[0.04]">
          <div className="flex flex-col items-center gap-3">
            <div className="size-5 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/60" />
            <span className="text-[12px] text-white/80">Loading position data</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !lapPositionsData || !sessionResultsData) {
    return (
      <div className={CARD_CONTAINER}>
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-[16px] font-semibold text-white">Position Changes</h3>
          <p className="mt-0.5 text-[12px] text-white/80">Lap-by-lap position tracking</p>
        </div>
        <div className="flex h-[400px] items-center justify-center border-t border-white/[0.04]">
          <div className="text-center">
            <p className="text-[14px] font-medium text-red-400">Error loading data</p>
            <p className="mt-1 text-[12px] text-white/80">
              {combinedError?.message || 'Could not fetch position data.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={CARD_CONTAINER}>
      {/* Header + view toggle */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <h3 className="text-[16px] font-semibold text-white">Position Changes</h3>
          <p className="mt-0.5 text-[12px] text-white/80">Lap-by-lap position tracking</p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white/[0.04] p-0.5">
          <button
            onClick={() => {
              setActiveTab('chart');
              trackInteraction('positions_subtab_changed', { tab: 'chart' });
            }}
            className={cn(
              'rounded-[5px] px-3 py-1.5 text-[12px] font-medium transition-colors',
              activeTab === 'chart'
                ? 'bg-white/[0.06] text-white'
                : 'text-white/80 hover:text-white'
            )}
          >
            Chart
          </button>
          <button
            onClick={() => {
              setActiveTab('analysis');
              trackInteraction('positions_subtab_changed', { tab: 'analysis' });
            }}
            className={cn(
              'rounded-[5px] px-3 py-1.5 text-[12px] font-medium transition-colors',
              activeTab === 'analysis'
                ? 'bg-white/[0.06] text-white'
                : 'text-white/80 hover:text-white'
            )}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="border-t border-white/[0.04]">
        {activeTab === 'chart' ? (
          <div className="h-[600px] p-5">
            <PositionChart
              lapData={lapPositionsData}
              incidents={incidentsData}
              sessionResults={sessionResultsData}
              year={year}
              favoriteDriver={favoriteDriver}
            />
          </div>
        ) : (
          <div className="space-y-5 p-5">
            <KeyMomentsHighlight lapData={lapPositionsData} />
            <PositionsSummaryTable sessionResults={sessionResultsData} year={year} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionsTabContent;
