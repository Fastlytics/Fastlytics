// knip-ignore
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon } from 'hugeicons-react';
import { useSearchParams, Link } from 'react-router-dom';
import { m } from 'motion/react';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import { exportTeamPaceGapPng } from '@/lib/export-api';
import { fetchTeamPaceEvent, fetchTeamPaceSummary } from '@/lib/api';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { useSeason } from '@/contexts/SeasonContext';
import { GatedRoute } from '@/components/common/GatedRoute';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { ArrowLeft01Icon } from 'hugeicons-react';
import type { PngExportPreset } from '@/lib/premium-export';

import { PaceEvolutionSection } from '@/pages/team-pace-analysis/PaceEvolutionSection';
import { PaceGapSection } from '@/pages/team-pace-analysis/PaceGapSection';
import { PeakVsConsistentSection } from '@/pages/team-pace-analysis/PeakVsConsistentSection';
import { teamPaceAnalysisReducer, createInitialState } from '@/pages/team-pace-analysis/reducer';
import {
  AVAILABLE_YEARS,
  getActiveTeams,
  getEventNameFromSlug,
  getEvolutionData,
  getLatestAvailableSession,
  getPaceGapData,
  getScatterData,
  getSelectedEventSlug,
  getTeamColorHex,
  slugifyEventName,
  sortSessions,
} from '@/pages/team-pace-analysis/utils';

const MobileTeamPace = () => {
  const { trackEvent, trackPageView } = useAnalytics();
  const [searchParams] = useSearchParams();
  const { selectedYear: seasonYear } = useSeason();
  const isHistoricalSeason = seasonYear < getCurrentSeasonYear();
  const {
    chartRef: evolutionRef,
    exportChart: exportEvolution,
    isExporting: isExportingEvolution,
  } = useChartExport();
  const {
    chartRef: scatterRef,
    exportChart: exportScatter,
    isExporting: isExportingScatter,
  } = useChartExport();
  const paceGapRef = useRef<HTMLDivElement | null>(null);
  const [isExportingPaceGap, setIsExportingPaceGap] = useState(false);
  const [state, dispatch] = useReducer(teamPaceAnalysisReducer, seasonYear, createInitialState);

  useEffect(() => {
    const raceParam = searchParams.get('race');
    if (raceParam) {
      const slug = raceParam.replace(/^\d{4}-/, '');
      dispatch({ type: 'eventChanged', eventSlug: slug });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackPageView('team_pace_analysis', { year: state.selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryQuery = useQuery({
    queryKey: ['teamPaceSummary', state.selectedYear],
    queryFn: () => fetchTeamPaceSummary(state.selectedYear),
    staleTime: 1000 * 60 * 10,
  });

  const selectedEventSlug = useMemo(
    () => getSelectedEventSlug(summaryQuery.data || [], state.requestedEventSlug),
    [summaryQuery.data, state.requestedEventSlug]
  );

  const eventQuery = useQuery({
    queryKey: ['teamPaceEvent', state.selectedYear, selectedEventSlug],
    queryFn: () => fetchTeamPaceEvent(state.selectedYear, selectedEventSlug || ''),
    enabled: !!selectedEventSlug,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!eventQuery.data || !selectedEventSlug) return;

    dispatch({
      type: 'syncEvent',
      eventKey: `${state.selectedYear}:${selectedEventSlug}`,
      availableSessions: eventQuery.data.sessions,
    });
  }, [eventQuery.data, selectedEventSlug, state.selectedYear]);

  const selectedEventName = useMemo(
    () => getEventNameFromSlug(summaryQuery.data || [], selectedEventSlug),
    [summaryQuery.data, selectedEventSlug]
  );
  const availableSessions = useMemo(
    () => sortSessions(Object.keys(eventQuery.data?.sessions || {})),
    [eventQuery.data]
  );
  const selectedSession = availableSessions.includes(state.selectedSession)
    ? state.selectedSession
    : eventQuery.data
      ? getLatestAvailableSession(eventQuery.data.sessions)
      : state.selectedSession;

  const evolutionData = useMemo(() => getEvolutionData(eventQuery.data || null), [eventQuery.data]);
  const paceGapData = useMemo(
    () => getPaceGapData(eventQuery.data || null, selectedSession),
    [eventQuery.data, selectedSession]
  );
  const scatterData = useMemo(() => getScatterData(eventQuery.data || null), [eventQuery.data]);
  const activeTeams = useMemo(
    () => getActiveTeams(eventQuery.data || null, selectedSession),
    [eventQuery.data, selectedSession]
  );

  const handlePaceGapExport = useCallback(
    async (preset: PngExportPreset) => {
      if (!paceGapData.length) return;

      setIsExportingPaceGap(true);
      try {
        await exportTeamPaceGapPng({
          preset,
          meta: {
            title: 'Pace Gap',
            subtitle: `Gap to leader across ${selectedSession}`,
            year: state.selectedYear,
            event: selectedEventName,
            session: selectedSession,
          },
          rows: paceGapData.map((row) => ({
            teamName: row.teamName,
            medianTime: row.medianTime,
            gapToLeader: row.gapToLeader,
            rank: row.rank,
            teamColor: getTeamColorHex(row.teamName),
          })),
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Premium export failed. Please try again.'
        );
      } finally {
        setIsExportingPaceGap(false);
      }
    },
    [paceGapData, selectedEventName, selectedSession, state.selectedYear]
  );

  const isLoading = summaryQuery.isLoading || eventQuery.isLoading;
  const hasError = summaryQuery.isError || eventQuery.isError;
  const errorMessage =
    (summaryQuery.error as Error | null)?.message ||
    (eventQuery.error as Error | null)?.message ||
    'Could not load Team Pace analysis.';

  return (
    <GatedRoute
      featureName="Team Pace Analysis"
      description="Analyze team performance across race weekends with detailed pace comparisons, gap analysis, and consistency metrics."
      requiredTier={isHistoricalSeason ? 'pro' : undefined}
    >
      <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
        {/* Sticky header */}
        <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pt-3 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex size-8 items-center justify-center rounded-lg text-white/40 transition-colors active:bg-white/[0.04] active:text-white/70"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft01Icon className="size-4" />
            </Link>
            <FastlyticsLogo size={22} />
            <div className="size-8" />
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          {/* Title + pickers */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-white">
                Team Pace Analysis
              </h1>
              <p className="mt-0.5 text-[12px] text-white/60">
                Weekend performance evolution & race pace
              </p>
            </div>

            <div className="flex gap-2">
              <Select
                value={String(state.selectedYear)}
                onValueChange={(value) => {
                  dispatch({ type: 'yearChanged', year: Number(value) });
                  trackEvent('season_changed', { page: 'team_pace', year: Number(value) });
                }}
              >
                <SelectTrigger className="h-9 w-[100px] shrink-0 border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#141414] text-white">
                  <SelectGroup>
                    <SelectLabel className="px-2 py-1.5 text-[11px] text-white/50">
                      Season
                    </SelectLabel>
                    {AVAILABLE_YEARS.map((year) => (
                      <SelectItem
                        key={year}
                        value={String(year)}
                        className="cursor-pointer text-[13px] focus:bg-white/[0.04] focus:text-white"
                      >
                        {year}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={selectedEventSlug || ''}
                onValueChange={(eventSlug) => {
                  dispatch({ type: 'eventChanged', eventSlug });
                  trackEvent('event_changed', {
                    page: 'team_pace',
                    event_slug: eventSlug,
                    year: state.selectedYear,
                  });
                }}
                disabled={summaryQuery.data?.length === 0}
              >
                <SelectTrigger className="h-9 min-w-0 flex-1 border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-white">
                  <SelectValue
                    placeholder={summaryQuery.data?.length === 0 ? 'No Events' : 'Select Event'}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] border-white/[0.08] bg-[#141414] text-white">
                  <SelectGroup>
                    <SelectLabel className="px-2 py-1.5 text-[11px] text-white/50">
                      Race Weekend
                    </SelectLabel>
                    {(summaryQuery.data || []).map((event) => (
                      <SelectItem
                        key={event.round}
                        value={slugifyEventName(event.eventName)}
                        className="cursor-pointer text-[13px] focus:bg-white/[0.04] focus:text-white"
                      >
                        R{event.round} · {event.eventName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </m.div>

          {isLoading ? (
            <div className={`${CARD_CONTAINER} flex h-[400px] items-center justify-center`}>
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                <span className="text-[12px] text-white/50">Loading pace analysis…</span>
              </div>
            </div>
          ) : hasError ? (
            <div
              className={`${CARD_CONTAINER} flex flex-col items-center justify-center py-20 text-center`}
            >
              <AlertCircleIcon className="mb-3 size-10 text-white/20" />
              <h3 className="text-[15px] font-medium text-white">Data unavailable</h3>
              <p className="mt-1 max-w-md text-[13px] text-white/60">{errorMessage}</p>
            </div>
          ) : eventQuery.data ? (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <PaceEvolutionSection
                chartRef={evolutionRef}
                data={evolutionData}
                activeTeams={activeTeams}
                selectedYear={state.selectedYear}
                selectedEventName={selectedEventName}
                getTeamColor={getTeamColorHex}
                onExport={(format) =>
                  exportEvolution(format, {
                    title: 'Pace Evolution',
                    subtitle: 'Team rank per session across the weekend',
                    year: state.selectedYear,
                    event: selectedEventName,
                  })
                }
                isExporting={isExportingEvolution}
              />

              <PaceGapSection
                chartRef={paceGapRef}
                data={paceGapData}
                selectedSession={selectedSession}
                availableSessions={availableSessions}
                onSessionChange={(session) => {
                  dispatch({ type: 'sessionChanged', session });
                  trackEvent('session_changed', {
                    page: 'team_pace',
                    session,
                    event: selectedEventName,
                    year: state.selectedYear,
                  });
                }}
                getTeamColor={getTeamColorHex}
                onExport={handlePaceGapExport}
                isExporting={isExportingPaceGap}
                year={state.selectedYear}
                eventName={selectedEventName}
              />

              <PeakVsConsistentSection
                chartRef={scatterRef}
                data={scatterData}
                onExport={(format) =>
                  exportScatter(format, {
                    title: 'Peak vs Consistent',
                    subtitle: 'Fastest lap vs median pace',
                    year: state.selectedYear,
                    event: selectedEventName,
                  })
                }
                isExporting={isExportingScatter}
                year={state.selectedYear}
                eventName={selectedEventName}
              />
            </m.div>
          ) : (
            <div className={`${CARD_CONTAINER} flex flex-col items-center justify-center py-20`}>
              <p className="text-[13px] text-white/50">Select an event to view analysis</p>
            </div>
          )}
        </div>
      </div>
    </GatedRoute>
  );
};

export default MobileTeamPace;
