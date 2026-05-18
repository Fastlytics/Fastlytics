// knip-ignore
import { useEffect, useMemo, useReducer } from 'react';

import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon } from 'hugeicons-react';
import { useSearchParams } from 'react-router-dom';
import { m } from 'motion/react';

import { SEO } from '@/components/layout/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import { fetchTeamPaceEvent, fetchTeamPaceSummary } from '@/lib/api';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { useSeason } from '@/contexts/SeasonContext';

import { PaceEvolutionSection } from './team-pace-analysis/PaceEvolutionSection';
import { PaceGapSection } from './team-pace-analysis/PaceGapSection';
import { PeakVsConsistentSection } from './team-pace-analysis/PeakVsConsistentSection';
import {
  teamPaceAnalysisReducer,
  initialTeamPaceAnalysisState,
  createInitialState,
} from './team-pace-analysis/reducer';
import { TeamPaceHeader } from './team-pace-analysis/TeamPaceHeader';
import {
  getActiveTeams,
  getEventNameFromSlug,
  getEvolutionData,
  getLatestAvailableSession,
  getPaceGapData,
  getScatterData,
  getSelectedEventSlug,
  getTeamColorHex,
  sortSessions,
} from './team-pace-analysis/utils';

const TeamPaceAnalysis = () => {
  const { trackEvent, trackPageView } = useAnalytics();
  const [searchParams] = useSearchParams();
  const { selectedYear: seasonYear } = useSeason();
  const {
    chartRef: evolutionRef,
    exportChart: exportEvolution,
    isExporting: isExportingEvolution,
  } = useChartExport();
  const {
    chartRef: paceGapRef,
    exportChart: exportPaceGap,
    isExporting: isExportingPaceGap,
  } = useChartExport();
  const {
    chartRef: scatterRef,
    exportChart: exportScatter,
    isExporting: isExportingScatter,
  } = useChartExport();
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

  const isLoading = summaryQuery.isLoading || eventQuery.isLoading;
  const hasError = summaryQuery.isError || eventQuery.isError;
  const errorMessage =
    (summaryQuery.error as Error | null)?.message ||
    (eventQuery.error as Error | null)?.message ||
    'Could not load Team Pace analysis.';

  return (
    <>
      <SEO
        title="Team Pace"
        description={`Compare team pace across the ${state.selectedYear} season with weekend evolution, session gaps, and consistency trends.`}
        keywords={[
          'team pace',
          'race pace analysis',
          'telemetry analysis',
          'team performance data',
        ]}
      />

      <div className="space-y-5 text-white">
        <TeamPaceHeader
          selectedYear={state.selectedYear}
          selectedEventSlug={selectedEventSlug}
          summaryList={summaryQuery.data || []}
          onYearChange={(year) => {
            dispatch({ type: 'yearChanged', year });
            trackEvent('season_changed', { page: 'team_pace', year });
          }}
          onEventChange={(eventSlug) => {
            dispatch({ type: 'eventChanged', eventSlug });
            trackEvent('event_changed', {
              page: 'team_pace',
              event_slug: eventSlug,
              year: state.selectedYear,
            });
          }}
        />

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
            className="space-y-5"
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                onExport={(format) =>
                  exportPaceGap(format, {
                    title: 'Pace Gap',
                    subtitle: `Gap to leader — ${selectedSession}`,
                    year: state.selectedYear,
                    event: selectedEventName,
                    session: selectedSession,
                  })
                }
                isExporting={isExportingPaceGap}
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
              />
            </div>
          </m.div>
        ) : (
          <div className={`${CARD_CONTAINER} flex flex-col items-center justify-center py-20`}>
            <p className="text-[13px] text-white/50">Select an event to view analysis</p>
          </div>
        )}
      </div>
    </>
  );
};

export default TeamPaceAnalysis;
