/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { useQueries } from '@tanstack/react-query';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { fetchSchedule } from '@/lib/api';

interface SeasonContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const currentYear = getCurrentSeasonYear();
const startYear = 2019;
const defaultAvailableYears = Array.from(
  { length: currentYear - startYear + 1 },
  (_, i) => currentYear - i
);

const futureProbeYears = [currentYear + 1];

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export const SeasonProvider = ({ children }: { children: ReactNode }) => {
  const [selectedYear, setSelectedYearState] = useState<number>(defaultAvailableYears[0]);
  const [hasUserSelectedYear, setHasUserSelectedYear] = useState(false);

  const setSelectedYear = useCallback((year: number) => {
    setHasUserSelectedYear(true);
    setSelectedYearState(year);
  }, []);

  const futureScheduleChecks = useQueries({
    queries: futureProbeYears.map((year) => ({
      queryKey: ['season-availability', year],
      queryFn: async () => {
        try {
          const schedule = await fetchSchedule(year);
          return Array.isArray(schedule) && schedule.length > 0;
        } catch {
          return false;
        }
      },
      staleTime: 1000 * 60 * 30,
      retry: false,
      refetchOnWindowFocus: false,
    })),
  });

  const availableYears = useMemo(() => {
    const discoveredFutureYears = futureProbeYears.filter(
      (_, index) => futureScheduleChecks[index]?.data === true
    );

    return [...new Set([...discoveredFutureYears, ...defaultAvailableYears])].sort((a, b) => b - a);
  }, [futureScheduleChecks]);

  useEffect(() => {
    if (availableYears.length === 0) return;

    if (!availableYears.includes(selectedYear)) {
      setTimeout(() => setSelectedYearState(availableYears[0]), 0);
      return;
    }

    if (!hasUserSelectedYear && selectedYear !== availableYears[0]) {
      setTimeout(() => setSelectedYearState(availableYears[0]), 0);
    }
  }, [availableYears, selectedYear, hasUserSelectedYear]);

  const value = useMemo(
    () => ({
      selectedYear,
      setSelectedYear,
      availableYears,
    }),
    [selectedYear, availableYears, setSelectedYear]
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
};

export const useSeason = (): SeasonContextType => {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};
