// knip-ignore
import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchLapTimes,
  fetchSessionDrivers,
  SessionDriver,
  LapTimeDataPoint,
  LapTimesEnrichedResponse,
} from '@/lib/api';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import type { RefObject } from 'react';

export const MIN_DRIVERS = 2;

interface UseLapChartDataOptions {
  year: number;
  event: string;
  session: string;
  initialDrivers?: string[];
  staticData?: LapTimeDataPoint[];
  autoLoad?: boolean;
  favoriteDriver?: string | null;
  rivalDriver?: string | null;
  chartName: string;
}

export interface LapChartData {
  chartRef: RefObject<HTMLDivElement>;
  chartVisRef: ReturnType<typeof useChartVisibility>;
  exportRef: RefObject<HTMLDivElement>;
  exportChart: (options?: {
    title?: string;
    subtitle?: string;
    format?: 'png' | 'svg';
    scale?: number;
    autoSave?: boolean;
    onSuccess?: (result: unknown) => void;
    onError?: (err: Error) => void;
  }) => Promise<void>;
  isExporting: boolean;
  shouldLoadChart: boolean;
  setShouldLoadChart: (v: boolean) => void;
  focusedDriver: string | null;
  setFocusedDriver: (v: string | null) => void;
  selectedDrivers: string[];
  setSelectedDrivers: (v: string[] | ((prev: string[]) => string[])) => void;
  availableDrivers: SessionDriver[] | undefined;
  isLoadingDrivers: boolean;
  driverNameMap: Map<string, string>;
  effectiveDrivers: string[];
  driversToDisplay: string[];
  lapData: LapTimeDataPoint[] | undefined;
  isLoadingLapTimes: boolean;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  toggleDriver: (code: string) => void;
  trackInteraction: (name: string, meta: Record<string, unknown>) => void;
  enrichedResponse: LapTimesEnrichedResponse | undefined;
}

export function useLapChartData(options: UseLapChartDataOptions): LapChartData {
  const {
    year,
    event,
    session,
    initialDrivers,
    staticData,
    autoLoad = false,
    favoriteDriver,
    rivalDriver,
    chartName,
  } = options;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartVisRef = useChartVisibility({
    chartName,
    page: 'race',
    meta: { year, event, session },
  });
  const { trackInteraction } = useAnalytics();
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  const [shouldLoadChart, setShouldLoadChart] = useState(autoLoad || !!staticData);
  const [focusedDriver, setFocusedDriver] = useState<string | null>(null);

  const getInitialDrivers = () => {
    if (initialDrivers && initialDrivers.length >= MIN_DRIVERS) return initialDrivers;
    const defaults: string[] = [];
    if (favoriteDriver) defaults.push(favoriteDriver);
    if (rivalDriver) defaults.push(rivalDriver);
    return defaults;
  };

  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(() => getInitialDrivers());

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !staticData && !!year && !!event && !!session,
  });

  const driverNameMap = useMemo(() => {
    if (!availableDrivers) return new Map<string, string>();
    const map = new Map<string, string>();
    availableDrivers.forEach((d) => {
      if (d.code && d.name) map.set(d.code, d.name);
    });
    return map;
  }, [availableDrivers]);

  const effectiveDrivers = useMemo(() => {
    if (staticData) return selectedDrivers;
    const validCodes = availableDrivers ? new Set(availableDrivers.map((d) => d.code)) : null;
    const validSelected = validCodes
      ? selectedDrivers.filter((d) => validCodes.has(d))
      : selectedDrivers;
    if (validSelected.length >= MIN_DRIVERS) return validSelected;
    if (!availableDrivers) return validSelected;
    const needed = MIN_DRIVERS - validSelected.length;
    const candidates = availableDrivers
      .filter((d) => !validSelected.includes(d.code))
      .slice(0, needed)
      .map((d) => d.code);
    return [...validSelected, ...candidates];
  }, [selectedDrivers, availableDrivers, staticData]);

  const driversToDisplay = useMemo(
    () => (staticData ? initialDrivers || [] : effectiveDrivers),
    [staticData, initialDrivers, effectiveDrivers]
  );

  const {
    data: enrichedResponse,
    isLoading: isLoadingLapTimes,
    error,
    isError,
  } = useQuery<LapTimesEnrichedResponse>({
    queryKey: ['lapTimes', year, event, session, ...effectiveDrivers.sort()],
    queryFn: () => fetchLapTimes(year, event, session, effectiveDrivers),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
    enabled:
      !staticData &&
      !!year &&
      !!event &&
      !!session &&
      effectiveDrivers.length >= MIN_DRIVERS &&
      shouldLoadChart,
  });

  const lapData = staticData || enrichedResponse?.lapComparison;
  const isLoading = !staticData && isLoadingLapTimes;

  const toggleDriver = (driverCode: string) => {
    trackInteraction('driver_toggled', {
      driver: driverCode,
      chart: chartName,
      year,
      event,
      session,
    });
    setSelectedDrivers((prev) => {
      if (prev.includes(driverCode)) {
        if (prev.length > MIN_DRIVERS) return prev.filter((d) => d !== driverCode);
        return prev;
      }
      return [...prev, driverCode];
    });
  };

  return {
    chartRef,
    chartVisRef,
    exportRef,
    exportChart,
    isExporting,
    shouldLoadChart,
    setShouldLoadChart,
    focusedDriver,
    setFocusedDriver,
    selectedDrivers,
    setSelectedDrivers,
    availableDrivers,
    isLoadingDrivers,
    driverNameMap,
    effectiveDrivers,
    driversToDisplay,
    lapData,
    isLoadingLapTimes,
    error,
    isError,
    isLoading,
    toggleDriver,
    trackInteraction,
    enrichedResponse,
  };
}
