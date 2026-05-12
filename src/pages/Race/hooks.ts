import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  fetchAvailableSessions,
  fetchEventSessionSchedule,
  fetchSpecificRaceResults,
  AvailableSession,
  EventSessionSchedule,
  DetailedRaceResult,
} from '@/lib/api';
import { APIError } from '@/lib/api-client';

const parseLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Infinity;
  try {
    const parts = timeStr.split(/[:.]/);
    if (parts.length === 3) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 1000;
    }
    if (parts.length === 2) {
      return parseInt(parts[0]) + parseInt(parts[1]) / 1000;
    }
    return parseFloat(timeStr);
  } catch {
    return Infinity;
  }
};

interface UseRaceDataParams {
  year: number | null;
  eventName: string;
  eventSlug: string | null;
  selectedSession: string;
  isTestingEvent: boolean;
}

export const useRaceData = ({
  year,
  eventName,
  eventSlug,
  selectedSession,
  isTestingEvent,
}: UseRaceDataParams) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Queries
  const {
    data: availableSessions = [],
    isLoading: isLoadingSessions,
    error: availableSessionsError,
  } = useQuery<AvailableSession[]>({
    queryKey: ['availableSessions', year, eventName],
    queryFn: () => fetchAvailableSessions(year!, eventName),
    enabled: !!year && !!eventName,
  });

  const { data: sessionSchedule } = useQuery<EventSessionSchedule>({
    queryKey: ['sessionSchedule', year, eventSlug],
    queryFn: () => fetchEventSessionSchedule(year!, eventSlug!),
    enabled:
      !!year &&
      !!eventSlug &&
      !isLoadingSessions &&
      (!availableSessions || !availableSessions.some((s) => s.type === 'R')),
  });

  const { data: sessionResults, isLoading: isLoadingResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['sessionResult', year, eventSlug, selectedSession],
    queryFn: () => fetchSpecificRaceResults(year!, eventSlug!, selectedSession),
    enabled: !!year && !!eventSlug && !!selectedSession && availableSessions.length > 0,
  });

  // Only set default session if not already in params
  const sessionParam = searchParams.get('session');
  useEffect(() => {
    if (availableSessions.length > 0 && !sessionParam) {
      let defaultSession = '';
      if (isTestingEvent) {
        defaultSession = 'Summary';
      } else if (availableSessions.some((s) => s.type === 'R')) {
        defaultSession = 'R';
      } else {
        defaultSession = availableSessions[availableSessions.length - 1].type;
      }

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('session', defaultSession);
          return newParams;
        },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSessions]);

  // Derived Data
  const { data: summaryResults, isLoading: isLoadingSummary } = useQuery<DetailedRaceResult[]>({
    queryKey: ['summaryResult', year, eventSlug],
    queryFn: async () => {
      if (!year || !eventSlug || availableSessions.length === 0) return [];

      const fetchingSessions = availableSessions.filter((s) => s.type !== 'Summary');
      const allResultsPromises = fetchingSessions.map((s) =>
        fetchSpecificRaceResults(year, eventSlug, s.type)
      );

      const allResultsArray = await Promise.all(allResultsPromises);
      const aggregatedMap: { [driverCode: string]: DetailedRaceResult } = {};

      allResultsArray.forEach((sessionResults) => {
        sessionResults.forEach((result) => {
          if (!aggregatedMap[result.driverCode]) {
            aggregatedMap[result.driverCode] = {
              ...result,
              lapsCompleted: 0,
              fastestLapTime: null,
            };
          }

          const aggr = aggregatedMap[result.driverCode];

          if (result.lapsCompleted) {
            aggr.lapsCompleted = (aggr.lapsCompleted || 0) + result.lapsCompleted;
          }

          if (result.fastestLapTime) {
            const currentFastest = parseLapTime(aggr.fastestLapTime);
            const newTime = parseLapTime(result.fastestLapTime);
            if (!aggr.fastestLapTime || newTime < currentFastest) {
              aggr.fastestLapTime = result.fastestLapTime;
            }
          }
        });
      });

      return Object.values(aggregatedMap);
    },
    enabled: isTestingEvent && selectedSession === 'Summary' && availableSessions.length > 0,
  });

  const effectiveSessionResults = selectedSession === 'Summary' ? summaryResults : sessionResults;
  const isLoadingEffectiveResults =
    selectedSession === 'Summary' ? isLoadingSummary : isLoadingResults;
  const isHistoricalAccessLocked =
    availableSessionsError instanceof APIError && availableSessionsError.status === 402;

  const raceWinner = useMemo(
    () =>
      selectedSession === 'R' || selectedSession === 'Sprint'
        ? effectiveSessionResults?.find((r) => r.position === 1)
        : null,
    [effectiveSessionResults, selectedSession]
  );

  const poleSitter = useMemo(
    () =>
      selectedSession === 'R' || selectedSession === 'Sprint'
        ? effectiveSessionResults?.find((r) => r.gridPosition === 1)
        : null,
    [effectiveSessionResults, selectedSession]
  );

  const fastestLapHolder = useMemo(() => {
    if ((selectedSession !== 'R' && selectedSession !== 'Sprint') || !effectiveSessionResults)
      return null;

    const validResults = effectiveSessionResults.filter(
      (r) => !['Disqualified', 'DSQ', 'EXC'].includes(r.status) && r.driverFastestLapTime
    );

    if (validResults.length === 0) return null;

    return validResults.reduce<DetailedRaceResult | null>((best, result) => {
      if (!best) return result;
      return parseLapTime(result.driverFastestLapTime) < parseLapTime(best.driverFastestLapTime)
        ? result
        : best;
    }, null);
  }, [effectiveSessionResults, selectedSession]);

  const topPerformers = useMemo(() => {
    if (
      !effectiveSessionResults ||
      !selectedSession ||
      selectedSession === 'R' ||
      selectedSession === 'Sprint'
    )
      return [];
    return [...effectiveSessionResults]
      .filter((r) => r.fastestLapTime)
      .sort((a, b) => parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime))
      .slice(0, 3);
  }, [effectiveSessionResults, selectedSession]);

  return {
    availableSessions,
    isLoadingSessions,
    availableSessionsError,
    sessionSchedule,
    effectiveSessionResults,
    isLoadingEffectiveResults,
    isHistoricalAccessLocked,
    raceWinner,
    poleSitter,
    fastestLapHolder,
    topPerformers,
  };
};
