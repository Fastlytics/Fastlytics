import React from 'react';
import { useQueries, UseQueryOptions } from '@tanstack/react-query';
import { m } from 'motion/react';
import {
  fetchLapPositions,
  fetchSpecificRaceResults,
  fetchSessionIncidents,
  LapPositionDataPoint,
  DetailedRaceResult,
  SessionIncident,
} from '@/lib/api';
import PositionChart from '@/components/charts/PositionChart';
import { CARD_CONTAINER } from '@/lib/card-styles';

interface PositionsTabContentProps {
  year: number;
  event: string;
  session: string;
  favoriteDriver?: string | null;
  /** When true, skips the card wrapper (used when embedded inside another card) */
  embedded?: boolean;
}

type PositionQueryKey = [string, number, string, string];

const PositionsTabContent: React.FC<PositionsTabContentProps> = ({
  year,
  event,
  session,
  favoriteDriver,
  embedded = false,
}) => {
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
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={embedded ? undefined : CARD_CONTAINER}
      >
        {!embedded && (
          <div className="border-b border-white/[0.04] px-5 py-3.5">
            <h2 className="text-[15px] font-semibold text-white">Position Changes</h2>
          </div>
        )}
        <div className="flex h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-4 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/50" />
            <span className="text-[14px] text-white">Loading position data</span>
          </div>
        </div>
      </m.div>
    );
  }

  if (isError || !lapPositionsData || !sessionResultsData) {
    return (
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={embedded ? undefined : CARD_CONTAINER}
      >
        {!embedded && (
          <div className="border-b border-white/[0.04] px-5 py-3.5">
            <h2 className="text-[15px] font-semibold text-white">Position Changes</h2>
          </div>
        )}
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-[15px] text-red-400">Error loading data</p>
            <p className="mt-1 text-[14px] text-white">
              {combinedError?.message || 'Could not fetch position data.'}
            </p>
          </div>
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={embedded ? undefined : CARD_CONTAINER}
    >
      {!embedded && (
        <div className="border-b border-white/[0.04] px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-white">Position Changes</h2>
        </div>
      )}
      <div className={embedded ? undefined : 'p-5'}>
        <PositionChart
          lapData={lapPositionsData}
          incidents={incidentsData}
          sessionResults={sessionResultsData}
          year={year}
          favoriteDriver={favoriteDriver}
        />
      </div>
    </m.div>
  );
};

export default PositionsTabContent;
