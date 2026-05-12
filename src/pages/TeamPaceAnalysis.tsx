// knip-ignore
import { useEffect, useMemo, useReducer } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Activity01Icon, AlertCircleIcon } from 'hugeicons-react';
import { useSearchParams } from 'react-router-dom';

import { SEO } from '@/components/layout/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import { fetchTeamPaceEvent, fetchTeamPaceSummary } from '@/lib/api';

import { PaceEvolutionSection } from './team-pace-analysis/PaceEvolutionSection';
import { PaceGapSection } from './team-pace-analysis/PaceGapSection';
import { PeakVsConsistentSection } from './team-pace-analysis/PeakVsConsistentSection';
import {
  teamPaceAnalysisReducer,
  initialTeamPaceAnalysisState,
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
  const [state, dispatch] = useReducer(teamPaceAnalysisReducer, initialTeamPaceAnalysisState);

  // Accept ?race= query param from redirects (e.g. /race/:raceId/team-pace → /team-pace?race=slug)
  useEffect(() => {
    const raceParam = searchParams.get('race');
    if (raceParam) {
      // Strip leading year prefix (e.g. "2026-australian-grand-prix" → "australian-grand-prix")
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
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-white selection:bg-red-600 selection:text-white">
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

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pb-20 pt-32 sm:px-6 lg:px-8">
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
          <div className="relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
            <div
              className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent"
              style={{ backgroundSize: '200% 100%' }}
            />
            <div className="z-10 mb-4 size-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            <p className="z-10 animate-pulse font-mono text-sm uppercase tracking-widest text-zinc-500">
              Loading Pace Analysis…
            </p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.05] py-24 text-center">
            <AlertCircleIcon className="mb-4 size-12 text-red-400" />
            <p className="font-mono text-xs uppercase tracking-widest text-red-300">
              Team Pace data unavailable
            </p>
            <p className="mt-2 max-w-xl text-sm text-white/80">{errorMessage}</p>
          </div>
        ) : eventQuery.data ? (
          <div className="space-y-6">
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950 py-24">
            <Activity01Icon className="mb-4 size-16 text-zinc-700" />
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Select an event to view analysis
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeamPaceAnalysis;
