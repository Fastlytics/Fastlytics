import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import {
  fetchSessionDrivers,
  fetchLapTimes,
  SessionDriver,
  type LapTimesEnrichedResponse,
} from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { driverColor } from '@/lib/driverColor';
import { useChartVisibility } from '@/hooks/useChartVisibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import { ChartSaveMenu } from '@/components/saved/ChartSaveMenu';
import { AiAnalysisCard } from '@/components/charts/AiAnalysisCard';
import {
  useAiTelemetrySummary,
  type ChartMetrics,
  type LapInfo,
} from '@/hooks/useAiTelemetrySummary';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { m, AnimatePresence } from 'motion/react';

interface TelemetryChartWrapperProps<T> {
  className?: string;
  title: string;
  icon?: React.ElementType;
  year: number;
  event: string;
  session: string;
  initialDriver?: string;
  lap?: string | number;
  queryKey: (driver: string, lap: string | number) => readonly unknown[];
  queryFn: (driver: string, lap: string | number) => Promise<T>;
  queryEnabled?: (driver: string, lap: string | number) => boolean;
  renderChart: (data: T, color: string, selectedDriver: string) => React.ReactNode;
  renderStats?: (data: T, explainBtn?: React.ReactNode) => React.ReactNode;
  computeMetrics?: (data: T) => ChartMetrics;
  computeLapMeta?: (data: T) => { time?: string; compound?: string } | undefined;
  customExplainSlot?: boolean;
}

interface TelemetryChartContentProps<T> {
  selectedDriver: string;
  isLoading: boolean;
  error: unknown;
  data: T | undefined;
  currentColor: string;
  renderChart: (data: T, color: string, selectedDriver: string) => React.ReactNode;
  renderStats?: (data: T, explainBtn?: React.ReactNode) => React.ReactNode;
  explainBtn?: React.ReactNode;
}

const TelemetryChartContent = <T,>({
  selectedDriver,
  isLoading,
  error,
  data,
  currentColor,
  renderChart,
  renderStats,
  explainBtn,
}: TelemetryChartContentProps<T>) => {
  if (!selectedDriver) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-[13px] text-white/80">
        Select a driver to view telemetry
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/60" />
          <span className="text-[12px] text-white/80">Loading telemetry</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[350px] w-full flex-col items-center justify-center">
        <p className="text-[14px] font-medium text-red-400">Data unavailable</p>
        <p className="mt-1 text-[12px] text-white/80">
          {(error as Error)?.message || 'Could not fetch telemetry.'}
        </p>
      </div>
    );
  }

  if (Array.isArray(data) && data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-[13px] text-white/80">
        No data for {selectedDriver}
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {renderChart(data, currentColor, selectedDriver)}
      {renderStats && renderStats(data, explainBtn)}
    </div>
  );
};

function formatLapTime(seconds: number | null | undefined): string | undefined {
  if (seconds == null) return undefined;
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3);
  return `${m}:${s.padStart(6, '0')}`;
}

function getLapMetaFromResponse(
  lapTimesResponse: LapTimesEnrichedResponse | undefined,
  driver: string,
  lap: string | number
): { time?: string; compound?: string } | undefined {
  const driverDetails = lapTimesResponse?.driverLapDetails?.[driver];
  if (!driverDetails) return undefined;

  if (lap === 'fastest') {
    const best = driverDetails.find((record) => record.isPersonalBest);
    return best
      ? { time: formatLapTime(best.lapTime), compound: best.compound ?? undefined }
      : undefined;
  }

  const lapNum = typeof lap === 'string' ? parseInt(lap) : lap;
  const lapRecord = driverDetails.find((record) => record.lapNumber === lapNum);
  return lapRecord
    ? { time: formatLapTime(lapRecord.lapTime), compound: lapRecord.compound ?? undefined }
    : undefined;
}

function serializeMetrics(metrics: ChartMetrics) {
  return {
    max: metrics.max,
    min: metrics.min,
    avg: metrics.avg,
    extras: metrics.extras ?? {},
  };
}

const TelemetryChartWrapper = <T,>({
  className,
  title,
  icon: Icon,
  year,
  event,
  session,
  initialDriver = '',
  lap = 'fastest',
  queryKey,
  queryFn,
  queryEnabled,
  renderChart,
  renderStats,
  computeMetrics,
  computeLapMeta,
  customExplainSlot,
}: TelemetryChartWrapperProps<T>) => {
  const chartVisRef = useChartVisibility({
    chartName: `telemetry_${title.toLowerCase().replace(/\s+/g, '_')}`,
    page: 'race',
    meta: { year, event, session },
  });
  const { trackSelection } = useAnalytics();
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  const [internalDriver, setInternalDriver] = useReducer(
    (_: string, v: string) => v,
    initialDriver
  );
  const [internalLap, setInternalLap] = useReducer(
    (_: string | number, v: string | number) => v,
    lap
  );
  const [compareDriver, setCompareDriver] = useState('');
  const [compareLap, setCompareLap] = useState<string | number>('fastest');

  const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!year && !!event && !!session,
  });

  const selectedDriver = useMemo(() => {
    const codes = availableDrivers?.map((d) => d.code) || [];
    if (internalDriver && codes.includes(internalDriver)) return internalDriver;
    if (codes.length > 0) return codes[0];
    return internalDriver;
  }, [availableDrivers, internalDriver]);

  const selectedLap = internalLap;

  const { data: lapTimesResponse } = useQuery({
    queryKey: ['lapTimes', year, event, session, selectedDriver],
    queryFn: () => fetchLapTimes(year, event, session, [selectedDriver]),
    enabled: !!year && !!event && !!session && !!selectedDriver,
  });

  const lapOptions = useMemo(() => {
    const lapTimes = lapTimesResponse?.lapComparison;
    if (lapTimes && lapTimes.length > 0) {
      const validLaps = lapTimes.flatMap((lapData) =>
        lapData[selectedDriver] !== null ? [lapData.LapNumber.toString()] : []
      );
      return ['fastest', ...validLaps];
    }
    return ['fastest'];
  }, [lapTimesResponse, selectedDriver]);

  const filteredCompareDrivers = useMemo(
    () => (availableDrivers || []).filter((driver) => driver.code !== selectedDriver),
    [availableDrivers, selectedDriver]
  );

  const { data, isLoading, error } = useQuery<T>({
    queryKey: queryKey(selectedDriver, selectedLap),
    queryFn: () => queryFn(selectedDriver, selectedLap),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: queryEnabled
      ? queryEnabled(selectedDriver, selectedLap)
      : !!selectedDriver && !!selectedLap,
  });

  const currentColor = selectedDriver ? driverColor(selectedDriver, year) : '#ef4444';
  const selectedDriverObj = availableDrivers?.find((d) => d.code === selectedDriver);
  const activeCompareDriver = filteredCompareDrivers.some((driver) => driver.code === compareDriver)
    ? compareDriver
    : '';
  const compareDriverObj = availableDrivers?.find((d) => d.code === activeCompareDriver);

  // ── Analysis state ───────────────
  const explainBtnRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastAnalysisSignatureRef = useRef('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [originPos, setOriginPos] = useState({ x: 0, y: 0 });

  const analysisMutation = useAiTelemetrySummary();
  const mutateAnalysis = analysisMutation.mutate;

  const metrics = useMemo(() => {
    if (data && computeMetrics) return computeMetrics(data);
    return undefined;
  }, [data, computeMetrics]);

  const dataLapMeta = useMemo(
    () => (data && computeLapMeta ? computeLapMeta(data) : undefined),
    [data, computeLapMeta]
  );

  const lapMeta = useMemo(() => {
    return getLapMetaFromResponse(lapTimesResponse, selectedDriver, selectedLap);
  }, [lapTimesResponse, selectedDriver, selectedLap]);

  const { data: compareLapTimesResponse, isLoading: isLoadingCompareLapTimes } = useQuery({
    queryKey: ['lapTimes', year, event, session, activeCompareDriver],
    queryFn: () => fetchLapTimes(year, event, session, [activeCompareDriver]),
    enabled: isExpanded && !!year && !!event && !!session && !!activeCompareDriver,
  });

  const compareLapOptions = useMemo(() => {
    if (!activeCompareDriver) return ['fastest'];
    const lapTimes = compareLapTimesResponse?.lapComparison;
    if (lapTimes && lapTimes.length > 0) {
      const validLaps = lapTimes.flatMap((lapData) =>
        lapData[activeCompareDriver] !== null ? [lapData.LapNumber.toString()] : []
      );
      return ['fastest', ...validLaps];
    }
    return ['fastest'];
  }, [activeCompareDriver, compareLapTimesResponse]);

  const activeCompareLap =
    activeCompareDriver && compareLapOptions.includes(compareLap.toString())
      ? compareLap
      : 'fastest';

  const compareLapMeta = useMemo(
    () => getLapMetaFromResponse(compareLapTimesResponse, activeCompareDriver, activeCompareLap),
    [compareLapTimesResponse, activeCompareDriver, activeCompareLap]
  );

  const { data: compareData } = useQuery<T>({
    queryKey: queryKey(activeCompareDriver, activeCompareLap),
    queryFn: () => queryFn(activeCompareDriver, activeCompareLap),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled:
      isExpanded &&
      !!activeCompareDriver &&
      (queryEnabled ? queryEnabled(activeCompareDriver, activeCompareLap) : !!activeCompareLap),
  });

  const compareMetrics = useMemo(() => {
    if (compareData && computeMetrics) return computeMetrics(compareData);
    return undefined;
  }, [compareData, computeMetrics]);

  const compareDataLapMeta = useMemo(
    () => (compareData && computeLapMeta ? computeLapMeta(compareData) : undefined),
    [compareData, computeLapMeta]
  );

  const selectedDriverInfo = useMemo(
    () =>
      selectedDriverObj
        ? { code: selectedDriver, name: selectedDriverObj.name, team: selectedDriverObj.team }
        : { code: selectedDriver, name: selectedDriver, team: '' },
    [selectedDriver, selectedDriverObj]
  );

  const primaryLapInfo = useMemo<LapInfo>(
    () => ({
      number: String(selectedLap),
      ...(dataLapMeta ?? lapMeta),
    }),
    [dataLapMeta, lapMeta, selectedLap]
  );

  const comparisonLapInfo = useMemo<LapInfo | undefined>(
    () =>
      activeCompareDriver
        ? {
            number: String(activeCompareLap),
            ...(compareDataLapMeta ?? compareLapMeta),
          }
        : undefined,
    [activeCompareDriver, activeCompareLap, compareDataLapMeta, compareLapMeta]
  );

  const singleAnalysisSignature = useMemo(
    () => JSON.stringify(['single', title, selectedDriverInfo.code, primaryLapInfo.number]),
    [primaryLapInfo.number, selectedDriverInfo.code, title]
  );

  const comparisonAnalysisSignature = useMemo(
    () =>
      activeCompareDriver && comparisonLapInfo
        ? JSON.stringify([
            'comparison',
            title,
            selectedDriverInfo.code,
            primaryLapInfo.number,
            activeCompareDriver,
            comparisonLapInfo.number,
          ])
        : '',
    [activeCompareDriver, comparisonLapInfo, primaryLapInfo.number, selectedDriverInfo.code, title]
  );

  const handleExplain = () => {
    if (!metrics || !computeMetrics) return;
    const btn = explainBtnRef.current;
    const card = cardRef.current;
    if (btn && card) {
      const btnRect = btn.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const x = btnRect.left + btnRect.width / 2 - cardRect.left;
      const y = btnRect.top + btnRect.height / 2 - cardRect.top;
      setOriginPos({ x, y });
    }
    setIsExpanded(true);
    lastAnalysisSignatureRef.current = singleAnalysisSignature;
    mutateAnalysis({
      year,
      event,
      session,
      chart_type: title.toLowerCase().replace(/\s+/g, '_'),
      chart_title: title,
      driver: selectedDriverInfo,
      lap: primaryLapInfo,
      chart_metrics: metrics,
    });
  };

  useEffect(() => {
    if (
      !isExpanded ||
      !metrics ||
      !activeCompareDriver ||
      !compareDriverObj ||
      !compareMetrics ||
      !comparisonLapInfo ||
      !comparisonAnalysisSignature ||
      lastAnalysisSignatureRef.current === comparisonAnalysisSignature
    ) {
      return;
    }

    lastAnalysisSignatureRef.current = comparisonAnalysisSignature;
    mutateAnalysis({
      year,
      event,
      session,
      chart_type: `comparison_${title.toLowerCase().replace(/\s+/g, '_')}`,
      chart_title: `${title} Comparison`,
      drivers: [
        selectedDriverInfo,
        {
          code: activeCompareDriver,
          name: compareDriverObj.name,
          team: compareDriverObj.team,
        },
      ],
      laps: [primaryLapInfo, comparisonLapInfo],
      chart_metrics: {
        max: metrics.max,
        min: metrics.min,
        avg: metrics.avg,
        trace_sample: metrics.trace_sample,
        extras: {
          ...(metrics.extras ?? {}),
          comparison_mode: true,
          primary_metrics: serializeMetrics(metrics),
          comparison_metrics: serializeMetrics(compareMetrics),
          comparison_trace_sample: compareMetrics.trace_sample ?? [],
        },
      },
    });
  }, [
    activeCompareDriver,
    activeCompareLap,
    comparisonAnalysisSignature,
    compareDriverObj,
    compareMetrics,
    event,
    isExpanded,
    metrics,
    comparisonLapInfo,
    primaryLapInfo,
    selectedDriverInfo,
    session,
    title,
    mutateAnalysis,
    year,
  ]);

  const handleClose = () => {
    setIsExpanded(false);
    lastAnalysisSignatureRef.current = '';
    analysisMutation.reset();
  };

  const hasAnalysis = !!computeMetrics && !!metrics;

  const showExplainBtn = !isExpanded && hasAnalysis && data && !isLoading && !error;

  const compareControls = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white">
        Compare with
      </span>

      <Select
        value={activeCompareDriver || '__none__'}
        onValueChange={(value) => {
          if (value === '__none__') {
            setCompareDriver('');
            setCompareLap('fastest');
            if (isExpanded && metrics) {
              lastAnalysisSignatureRef.current = singleAnalysisSignature;
              mutateAnalysis({
                year,
                event,
                session,
                chart_type: title.toLowerCase().replace(/\s+/g, '_'),
                chart_title: title,
                driver: selectedDriverInfo,
                lap: primaryLapInfo,
                chart_metrics: metrics,
              });
            }
            return;
          }

          setCompareDriver(value);
          setCompareLap('fastest');
          lastAnalysisSignatureRef.current = '';
        }}
        disabled={!filteredCompareDrivers.length}
      >
        <SelectTrigger className="h-9 w-[190px] rounded-md border border-white/[0.08] bg-transparent text-[13px] font-medium text-white focus:border-white/[0.12] focus:ring-0">
          <div className="flex items-center gap-2">
            {compareDriverObj ? (
              <>
                <img
                  src={getDriverImage(compareDriverObj.code, year)}
                  alt=""
                  className="size-5 shrink-0 rounded-full border border-white/[0.08] object-cover object-top"
                />
                <span className="truncate">{compareDriverObj.name || compareDriverObj.code}</span>
              </>
            ) : (
              <span className="truncate text-white">Select driver</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="min-w-[220px] rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl">
          <SelectGroup>
            <SelectLabel className="text-[11px] font-medium text-white">Driver</SelectLabel>
            <SelectItem
              value="__none__"
              className="text-[13px] font-medium focus:bg-white/[0.04] focus:text-white"
            >
              No comparison
            </SelectItem>
            {filteredCompareDrivers.map((driver) => (
              <SelectItem
                key={driver.code}
                value={driver.code}
                className="text-[13px] font-medium focus:bg-white/[0.04] focus:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={getDriverImage(driver.code, year)}
                    alt=""
                    className="size-5 shrink-0 rounded-full border border-white/[0.08] object-cover object-top"
                  />
                  <span>{driver.name || driver.code}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={activeCompareLap.toString()}
        onValueChange={(value) => {
          lastAnalysisSignatureRef.current = '';
          setCompareLap(value === 'fastest' ? 'fastest' : parseInt(value));
        }}
        disabled={
          !activeCompareDriver || isLoadingCompareLapTimes || compareLapOptions.length === 0
        }
      >
        <SelectTrigger className="h-9 w-[145px] rounded-md border border-white/[0.08] bg-transparent text-[13px] font-medium text-white focus:border-white/[0.12] focus:ring-0">
          <span>{activeCompareLap === 'fastest' ? 'Fastest Lap' : `Lap ${activeCompareLap}`}</span>
        </SelectTrigger>
        <SelectContent className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl max-h-[300px]">
          <SelectGroup>
            {compareLapOptions.map((lapOpt) => (
              <SelectItem
                key={lapOpt.toString()}
                value={lapOpt.toString()}
                className="text-[13px] font-medium focus:bg-white/[0.04] focus:text-white"
              >
                {lapOpt === 'fastest' ? 'Fastest Lap' : `Lap ${lapOpt}`}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );

  const explainBtn = showExplainBtn ? (
    <button
      ref={explainBtnRef}
      type="button"
      onClick={handleExplain}
      disabled={analysisMutation.isPending}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50"
    >
      {analysisMutation.isPending ? (
        <>
          <div className="size-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
          Analysing...
        </>
      ) : (
        'Explain'
      )}
    </button>
  ) : null;

  return (
    <div
      ref={(el) => {
        chartVisRef.current = el;
        exportRef.current = el;
        cardRef.current = el;
      }}
      className={cn(CARD_CONTAINER, 'relative overflow-hidden', className)}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold text-white">{title}</h3>
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title,
                subtitle: selectedDriver
                  ? `${selectedDriverObj?.name || selectedDriver} — ${selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}`
                  : undefined,
                year,
                event,
                session,
                drivers: selectedDriver ? [selectedDriver] : undefined,
              })
            }
            isExporting={isExporting}
          />
          <ChartSaveMenu
            chartType={title.toLowerCase().replace(/\s+/g, '_')}
            title={`${title} — ${selectedDriverObj?.name || selectedDriver || 'Driver'} — ${event} ${year}`}
            raceName={`${year} ${event}`}
            chartConfig={{ year, event, session, driver: selectedDriver, lap: selectedLap }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Driver selector */}
          <Select
            value={selectedDriver}
            onValueChange={(value) => {
              setInternalDriver(value);
              setInternalLap('fastest');
              trackSelection('telemetry_driver', value, { chart: title, year, event, session });
            }}
            disabled={isLoadingDrivers || !availableDrivers}
          >
            <SelectTrigger className="h-9 w-[200px] rounded-md border border-white/[0.06] bg-transparent text-[13px] font-medium text-white focus:ring-0 focus:border-white/[0.12]">
              <div className="flex items-center gap-2">
                {selectedDriver && (
                  <>
                    <img
                      src={getDriverImage(selectedDriver, year)}
                      alt=""
                      className="size-5 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                    />
                    <span className="truncate">{selectedDriverObj?.name || selectedDriver}</span>
                  </>
                )}
                {!selectedDriver && <span className="text-white/60">Select driver</span>}
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-[240px] rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl">
              <SelectGroup>
                <SelectLabel className="text-[11px] font-medium text-white/60">Driver</SelectLabel>
                {availableDrivers?.map((driver) => {
                  const driverHeadshot = getDriverImage(driver.code, year);
                  return (
                    <SelectItem
                      key={driver.code}
                      value={driver.code}
                      className="text-[13px] font-medium focus:bg-white/[0.04] focus:text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={driverHeadshot}
                          alt=""
                          className="size-5 shrink-0 rounded-full border border-white/[0.06] object-cover object-top"
                        />
                        <span>{driver.name || driver.code}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Lap selector */}
          <Select
            value={selectedLap.toString()}
            onValueChange={(value) => {
              setInternalLap(value === 'fastest' ? 'fastest' : parseInt(value));
              trackSelection('telemetry_lap', value, { chart: title, year, event, session });
            }}
            disabled={lapOptions.length <= 1}
          >
            <SelectTrigger
              className={cn(
                'h-9 w-[140px] rounded-md border border-white/[0.06] bg-transparent text-[13px] font-medium focus:ring-0 focus:border-white/[0.12]',
                selectedLap === 'fastest' ? 'text-purple-400' : 'text-white'
              )}
            >
              <span>{selectedLap === 'fastest' ? 'Fastest Lap' : `Lap ${selectedLap}`}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl max-h-[300px]">
              <SelectGroup>
                {lapOptions.map((lapOpt) => (
                  <SelectItem
                    key={lapOpt.toString()}
                    value={lapOpt.toString()}
                    className={cn(
                      'text-[13px] font-medium focus:bg-white/[0.04] focus:text-white',
                      lapOpt === 'fastest' ? 'text-purple-400' : ''
                    )}
                  >
                    {lapOpt === 'fastest' ? 'Fastest Lap' : `Lap ${lapOpt}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart content */}
      <div className="border-t border-white/[0.04] p-5">
        <TelemetryChartContent
          selectedDriver={selectedDriver}
          isLoading={isLoading}
          error={error}
          data={data}
          currentColor={currentColor}
          renderChart={renderChart}
          renderStats={renderStats}
          explainBtn={explainBtn}
        />
      </div>

      {/* Explain button — default placement (hidden when customExplainSlot is used) */}
      {!customExplainSlot && explainBtn && (
        <div className="border-t border-white/[0.04] px-5 py-3">{explainBtn}</div>
      )}

      {/* Analysis overlay — liquid fill animation */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ clipPath: `circle(0px at ${originPos.x}px ${originPos.y}px)` }}
            animate={{ clipPath: `circle(200% at ${originPos.x}px ${originPos.y}px)` }}
            exit={{ clipPath: `circle(0px at ${originPos.x}px ${originPos.y}px)` }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 z-20 rounded-lg bg-[#0a0a0c]"
          >
            <AiAnalysisCard
              data={
                analysisMutation.data ?? {
                  summary: '',
                  key_insights: [],
                  corner_analysis: [],
                  cached: false,
                }
              }
              isLoading={analysisMutation.isPending}
              onClose={handleClose}
              driverCode={selectedDriver}
              driverName={selectedDriverObj?.name}
              team={selectedDriverObj?.team}
              year={year}
              lapNumber={String(selectedLap)}
              lapTime={dataLapMeta?.time ?? lapMeta?.time}
              compound={dataLapMeta?.compound ?? lapMeta?.compound}
              compareDriverCode={activeCompareDriver || undefined}
              compareDriverName={compareDriverObj?.name}
              compareTeam={compareDriverObj?.team}
              compareLapTime={compareLapMeta?.time}
              compareCompound={compareLapMeta?.compound}
              headerActions={compareControls}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { TelemetryChartWrapper };

export default TelemetryChartWrapper;
