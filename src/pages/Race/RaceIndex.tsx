import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useRaceLayoutContext } from '@/pages/Race/race-layout-context';
import { ScheduleSidebar } from '@/pages/Race/ScheduleSidebar';

/**
 * Index element for `/race/:raceId`.
 * - If race data is available → redirect to `./overview`
 * - Otherwise → render the ScheduleSidebar (pre-race state)
 */
export default function RaceIndex() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { raceId } = useParams<{ raceId: string }>();
  const ctx = useRaceLayoutContext();

  const hasRaceData = ctx.isTestingEvent
    ? ctx.availableSessions.length > 0
    : ctx.availableSessions.some((s) => s.type === 'R');
  const wantsAnalysis = searchParams.get('view') === 'analysis' && ctx.availableSessions.length > 0;

  if (hasRaceData || wantsAnalysis) {
    // Ensure session param is included in the redirect if not already present
    let search = location.search;
    if (!searchParams.get('session') && ctx.availableSessions.length > 0) {
      const params = new URLSearchParams(search);
      let defaultSession: string;
      if (ctx.isTestingEvent) {
        defaultSession = ctx.availableSessions[0].type;
      } else if (ctx.availableSessions.some((s) => s.type === 'R')) {
        defaultSession = 'R';
      } else {
        defaultSession = ctx.availableSessions[ctx.availableSessions.length - 1].type;
      }
      params.set('session', defaultSession);
      search = `?${params.toString()}`;
    }
    return <Navigate to={{ pathname: `/race/${raceId}/overview`, search }} replace />;
  }

  // Pre-race: render schedule sidebar
  // Note: the tab strip is hidden by the layout when shouldShowSchedule is true
  return (
    <ScheduleSidebar
      sessionSchedule={ctx.sessionSchedule}
      is24Hour={ctx.is24Hour}
      setIs24Hour={ctx.toggle24Hour}
      trackInteraction={() => {}}
      now={ctx.now}
      availableSessions={ctx.availableSessions}
      setSelectedSession={ctx.setSelectedSession}
      setShowAnalysis={() => {}}
    />
  );
}
