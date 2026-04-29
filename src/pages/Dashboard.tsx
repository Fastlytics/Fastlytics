import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTeamStandings,
  fetchDriverStandings,
  fetchSchedule,
  fetchRaceResults,
  fetchAvailableSessions,
  fetchSpecificRaceResults,
  TeamStanding,
  DriverStanding,
  ScheduleEvent,
  RaceResult,
  AvailableSession,
  DetailedRaceResult,
  getCircuitLength,
  calculateDistance,
  formatDistance,
} from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ChampionshipWidget from '@/components/dashboard/ChampionshipWidget';
import FavoritesWidget from '@/components/dashboard/FavoritesWidget';

import { getCountryCode } from '@/utils/countryUtils';
import { SEO } from '@/components/layout/SEO';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion } from 'motion/react';
import {
  MobileLayout,
  MobilePageHeader,
  MobileNextSessionCard,
  MobileChampionshipWidget,
  MobileRecentRaces,
  MobileFavoritesWidget,
} from '@/components/mobile';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const isTestingEvent = (event: ScheduleEvent): boolean =>
  event.EventFormat?.toLowerCase().includes('test') ?? false;

const getEventStartDate = (event: ScheduleEvent): Date =>
  new Date(event.Session1Date || event.EventDate);

const toRaceSlug = (eventName: string): string => eventName.toLowerCase().replace(/\s+/g, '-');

const parseLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Number.POSITIVE_INFINITY;
  const cleaned = timeStr.startsWith('+') ? timeStr.slice(1) : timeStr;
  const parts = cleaned.split(/[:.]/);
  if (parts.length === 3) return Number(parts[0]) * 60 + Number(parts[1]) + Number(parts[2]) / 1000;
  if (parts.length === 2) return Number(parts[0]) + Number(parts[1]) / 1000;
  return Number.POSITIVE_INFINITY;
};

const TESTING_SESSION_ALIAS_PATTERN = /^DAY([1-3])_(AM|PM)$/i;
const getTestingSessionOrder = (sessionType: string): number => {
  const match = sessionType.match(TESTING_SESSION_ALIAS_PATTERN);
  if (match) {
    const day = Number(match[1]);
    const halfScore = match[2].toUpperCase() === 'AM' ? 0 : 1;
    return day * 10 + halfScore;
  }
  if (sessionType === 'FP1') return 11;
  if (sessionType === 'FP2') return 21;
  if (sessionType === 'FP3') return 31;
  return -1;
};

const Dashboard = () => {
  const [now] = useState(() => Date.now());
  const { selectedYear } = useSeason();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { trackEvent, trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('dashboard', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: schedule = [], isLoading: isLoadingSchedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

  const hasCompletedRaceEventsInSchedule = useMemo(
    () =>
      schedule.some((event) => !isTestingEvent(event) && getEventStartDate(event).getTime() <= now),
    [schedule, now]
  );

  const { data: raceResults = [] } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: async () => {
      try {
        return await fetchRaceResults(selectedYear);
      } catch {
        return [];
      }
    },
    enabled: !isLoadingSchedule && hasCompletedRaceEventsInSchedule,
  });

  const raceEvents = useMemo(() => schedule.filter((event) => !isTestingEvent(event)), [schedule]);
  const testingEvents = useMemo(() => schedule.filter(isTestingEvent), [schedule]);
  const hasRaceResults = raceResults.length > 0;
  const hasRaceWeekendStarted = useMemo(
    () => raceEvents.some((event) => getEventStartDate(event).getTime() <= now),
    [raceEvents, now]
  );
  const isTestingMode = !hasRaceResults && !hasRaceWeekendStarted && testingEvents.length > 0;

  const { data: teamStandings = [], isLoading: isLoadingTeams } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
  });

  const { data: driverStandings = [], isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
  });

  const { nextSession, recentRaces, recentTestingEvents } = useMemo(() => {
    if (schedule.length === 0)
      return { nextSession: undefined, recentRaces: [], recentTestingEvents: [] };
    const nowDate = new Date();
    let upcomingSession = undefined;
    const sortedSchedule = [...schedule].sort(
      (a, b) => new Date(a.EventDate).getTime() - new Date(b.EventDate).getTime()
    );
    for (const event of sortedSchedule) {
      const sessions = [
        { name: event.Session1, date: event.Session1Date },
        { name: event.Session2, date: event.Session2Date },
        { name: event.Session3, date: event.Session3Date },
        { name: event.Session4, date: event.Session4Date },
        { name: event.Session5, date: event.Session5Date },
      ].filter((s) => s.name && s.date);
      for (const session of sessions) {
        if (session.date && new Date(session.date) > nowDate) {
          upcomingSession = {
            eventName: event.EventName,
            sessionName: session.name!,
            date: session.date,
            location: event.Location,
            country: event.Country,
          };
          break;
        }
      }
      if (upcomingSession) break;
    }
    const recentRaceEvents = raceEvents
      .filter((e) => getEventStartDate(e) < nowDate)
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime())
      .slice(0, 4);
    const recentTesting = testingEvents
      .filter((e) => new Date(e.EventDate) < nowDate)
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime())
      .slice(0, 4);
    return {
      nextSession: upcomingSession,
      recentRaces: recentRaceEvents,
      recentTestingEvents: recentTesting,
    };
  }, [schedule, raceEvents, testingEvents]);

  const primaryTestingEvent = useMemo(() => {
    if (!isTestingMode || testingEvents.length === 0) return undefined;
    const completed = testingEvents
      .filter((event) => new Date(event.EventDate).getTime() <= now)
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime());
    return completed[0] ?? testingEvents[0];
  }, [isTestingMode, testingEvents, now]);

  const { data: testingAvailableSessions = [] } = useQuery<AvailableSession[]>({
    queryKey: ['testingAvailableSessions', selectedYear, primaryTestingEvent?.EventName],
    queryFn: () => fetchAvailableSessions(selectedYear, primaryTestingEvent!.EventName),
    enabled: isTestingMode && !!primaryTestingEvent?.EventName,
  });

  const testingSpotlightSession = useMemo(() => {
    if (testingAvailableSessions.length === 0) return '';
    return (
      [...testingAvailableSessions].sort(
        (a, b) => getTestingSessionOrder(b.type) - getTestingSessionOrder(a.type)
      )[0]?.type ?? ''
    );
  }, [testingAvailableSessions]);

  const testingSpotlightSessionName = useMemo(
    () =>
      testingAvailableSessions.find((s) => s.type === testingSpotlightSession)?.name ??
      testingSpotlightSession,
    [testingAvailableSessions, testingSpotlightSession]
  );

  const { data: testingSessionResults = [] } = useQuery<DetailedRaceResult[]>({
    queryKey: [
      'testingSpotlightResults',
      selectedYear,
      primaryTestingEvent?.EventName,
      testingSpotlightSession,
    ],
    queryFn: () =>
      fetchSpecificRaceResults(
        selectedYear,
        toRaceSlug(primaryTestingEvent!.EventName),
        testingSpotlightSession
      ),
    enabled: isTestingMode && !!primaryTestingEvent && !!testingSpotlightSession,
  });

  const testingInsights = useMemo(() => {
    if (!testingSessionResults?.length) {
      return {
        fastest: [] as DetailedRaceResult[],
        mileage: [] as DetailedRaceResult[],
        morningFastest: null as DetailedRaceResult | null,
        afternoonFastest: null as DetailedRaceResult | null,
        totalLaps: 0,
        totalDistance: 0,
        morningLaps: 0,
        afternoonLaps: 0,
        driverCount: 0,
        leaderLaps: 0,
        leaderDistance: 0,
        circuitLength: 5.0,
      };
    }
    const circuitLength = getCircuitLength(
      primaryTestingEvent?.EventName,
      primaryTestingEvent?.Location
    );
    const fastest = [...testingSessionResults]
      .filter((r) => !!r.fastestLapTime)
      .sort((a, b) => {
        const d = parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime);
        return d !== 0 ? d : (b.lapsCompleted ?? 0) - (a.lapsCompleted ?? 0);
      });
    const mileage = [...testingSessionResults].sort(
      (a, b) => (b.lapsCompleted ?? 0) - (a.lapsCompleted ?? 0)
    );
    const totalLaps = testingSessionResults.reduce(
      (s, r) => s + (r.lapsCompleted ?? r.laps ?? 0),
      0
    );
    const totalDistance = calculateDistance(totalLaps, circuitLength);
    const morningLaps = testingSessionResults.reduce(
      (s, r) => s + (r.morningLapsCompleted ?? 0),
      0
    );
    const afternoonLaps = testingSessionResults.reduce(
      (s, r) => s + (r.afternoonLapsCompleted ?? 0),
      0
    );
    const morningFastest =
      [...testingSessionResults]
        .filter((r) => !!r.morningFastestLapTime)
        .sort(
          (a, b) => parseLapTime(a.morningFastestLapTime) - parseLapTime(b.morningFastestLapTime)
        )[0] ?? null;
    const afternoonFastest =
      [...testingSessionResults]
        .filter((r) => !!r.afternoonFastestLapTime)
        .sort(
          (a, b) =>
            parseLapTime(a.afternoonFastestLapTime) - parseLapTime(b.afternoonFastestLapTime)
        )[0] ?? null;
    const leaderLaps = mileage[0]?.lapsCompleted ?? mileage[0]?.laps ?? 0;
    return {
      fastest,
      mileage,
      morningFastest,
      afternoonFastest,
      totalLaps,
      totalDistance,
      morningLaps,
      afternoonLaps,
      driverCount: testingSessionResults.length,
      leaderLaps,
      leaderDistance: calculateDistance(leaderLaps, circuitLength),
      circuitLength,
    };
  }, [testingSessionResults, primaryTestingEvent]);

  const favoriteDriverName = useMemo(() => {
    if (!profile?.favorite_driver || driverStandings.length === 0) return undefined;
    const driver = driverStandings.find(
      (d) =>
        d.code === profile.favorite_driver ||
        d.name.toLowerCase().includes(profile.favorite_driver.toLowerCase())
    );
    return driver?.name.split(' ').pop()?.toUpperCase();
  }, [profile, driverStandings]);

  const isMobile = useIsMobile();

  // ── Mobile view ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileLayout>
        <div style={inter} className="min-h-screen bg-[#09090b] text-white">
          <SEO
            title="F1 Dashboard — Fastlytics"
            description="Real-time F1 dashboard with telemetry, driver standings, team standings, and race schedule."
            keywords={['f1 dashboard', 'telemetry', 'f1 standings', 'f1 schedule', 'race results']}
          />
          <main className="space-y-5 px-4 pb-6 pt-4">
            <MobilePageHeader />
            <MobileNextSessionCard nextSession={nextSession} />

            {user && (
              <MobileFavoritesWidget
                profile={profile}
                drivers={driverStandings}
                teams={teamStandings}
                schedule={schedule}
                isLoading={isLoadingDrivers || isLoadingTeams || isLoadingSchedule}
              />
            )}

            {isTestingMode ? (
              <>
                {/* Testing mode mobile */}
                <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
                      Testing Mode
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Session', value: testingSpotlightSessionName || 'Day Session' },
                      { label: 'Total Laps', value: String(testingInsights.totalLaps) },
                      { label: 'Morning', value: String(testingInsights.morningLaps) },
                      { label: 'Afternoon', value: String(testingInsights.afternoonLaps) },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
                      >
                        <div className="text-[11px] font-medium text-white/30">{item.label}</div>
                        <div className="mt-0.5 text-[15px] font-semibold text-white">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {testingInsights.fastest.length > 0 && (
                    <button
                      onClick={() =>
                        navigate(
                          `/race/${selectedYear}-${toRaceSlug(primaryTestingEvent?.EventName || '')}?session=${testingSpotlightSession}&view=analysis`
                        )
                      }
                      className="mt-3 w-full rounded-lg border border-white/[0.06] p-3 text-left transition-colors hover:border-red-500/30"
                    >
                      <div className="text-[11px] font-medium text-white/30">Fastest Driver</div>
                      <div className="mt-0.5 text-[14px] font-semibold text-white">
                        {testingInsights.fastest[0].fullName}
                      </div>
                      <div className="text-[12px] font-medium text-red-400">
                        {testingInsights.fastest[0].fastestLapTime || '—'}
                      </div>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-[15px] font-semibold text-white">Recent Testing</h3>
                  {(recentTestingEvents.length > 0 ? recentTestingEvents : testingEvents)
                    .slice(0, 4)
                    .map((event) => (
                      <button
                        key={event.EventName}
                        onClick={() =>
                          navigate(
                            `/race/${selectedYear}-${toRaceSlug(event.EventName)}?view=analysis`
                          )
                        }
                        className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-3 text-left transition-colors hover:border-white/[0.1]"
                      >
                        <div>
                          <div className="text-[14px] font-semibold text-white">
                            {event.EventName}
                          </div>
                          <div className="text-[11px] text-white/30">{event.Location}</div>
                        </div>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="text-white/20"
                        >
                          <path
                            d="M1 6h10M7 2l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <>
                <MobileChampionshipWidget
                  drivers={driverStandings}
                  teams={teamStandings}
                  schedule={schedule}
                  raceResults={raceResults}
                  isLoading={isLoadingDrivers || isLoadingTeams || isLoadingSchedule}
                  profile={profile}
                />
                <MobileRecentRaces recentRaces={recentRaces} />
              </>
            )}
          </main>
        </div>
      </MobileLayout>
    );
  }

  // ── Desktop view ──────────────────────────────────────────────────────────
  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title="F1 Dashboard — Fastlytics"
        description="Real-time F1 dashboard with telemetry, driver standings, team standings, and race schedule."
        keywords={['f1 dashboard', 'telemetry', 'f1 standings', 'f1 schedule', 'race results']}
      />
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        <DashboardHeader
          selectedYear={selectedYear}
          nextSession={nextSession}
          favoriteDriverName={favoriteDriverName}
        />

        {/* Favorites widget (auth-gated) */}
        {user && (
          <FavoritesWidget
            profile={profile}
            drivers={driverStandings}
            teams={teamStandings}
            schedule={schedule}
            isLoading={isLoadingDrivers || isLoadingTeams || isLoadingSchedule}
          />
        )}

        {/* Championship or Testing Mode */}
        <div className="mb-8">
          {isTestingMode ? (
            <TestingCommandCenter
              testingSpotlightSessionName={testingSpotlightSessionName}
              testingSpotlightSession={testingSpotlightSession}
              testingInsights={testingInsights}
              primaryTestingEvent={primaryTestingEvent}
              selectedYear={selectedYear}
              navigate={navigate}
              toRaceSlug={toRaceSlug}
              calculateDistance={calculateDistance}
              formatDistance={formatDistance}
            />
          ) : (
            <ChampionshipWidget
              drivers={driverStandings}
              teams={teamStandings}
              schedule={schedule}
              raceResults={raceResults}
              isLoading={isLoadingDrivers || isLoadingTeams || isLoadingSchedule}
              profile={profile}
            />
          )}
        </div>

        {/* Recent Races / Testing */}
        <RecentEventsSection
          isTestingMode={isTestingMode}
          events={isTestingMode ? recentTestingEvents : recentRaces}
          selectedYear={selectedYear}
          navigate={navigate}
          trackEvent={trackEvent}
          toRaceSlug={toRaceSlug}
          getCountryCode={getCountryCode}
        />
      </main>
    </div>
  );
};

/* ─── Testing Command Center ─── */
const TestingCommandCenter = ({
  testingSpotlightSessionName,
  testingSpotlightSession,
  testingInsights,
  primaryTestingEvent,
  selectedYear,
  navigate,
  toRaceSlug,
  calculateDistance,
  formatDistance,
}: {
  testingSpotlightSessionName: string;
  testingSpotlightSession: string;
  testingInsights: ReturnType<typeof buildEmptyTestingInsights>;
  primaryTestingEvent?: ScheduleEvent;
  selectedYear: number;
  navigate: ReturnType<typeof useNavigate>;
  toRaceSlug: (name: string) => string;
  calculateDistance: (laps: number, circuitLength: number) => number;
  formatDistance: (dist: number) => string;
}) => (
  <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-white/40">
            Pre-season testing
          </p>
          <p className="mt-0.5 text-[18px] font-semibold text-white">Testing Command Center</p>
        </div>
      </div>
      {primaryTestingEvent && (
        <button
          onClick={() =>
            navigate(
              `/race/${selectedYear}-${toRaceSlug(primaryTestingEvent.EventName)}?session=${testingSpotlightSession}&view=analysis`
            )
          }
          className="flex items-center gap-1.5 text-[15px] font-medium text-white/55 transition-colors hover:text-white"
        >
          Open Analysis
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 6h10M7 2l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 gap-px bg-white/[0.04] p-px md:grid-cols-4">
      {[
        { label: 'Spotlight Session', value: testingSpotlightSessionName || 'Day Session' },
        { label: 'Full-Day Distance', value: formatDistance(testingInsights.totalDistance) },
        { label: 'Morning Laps', value: String(testingInsights.morningLaps) },
        { label: 'Afternoon Laps', value: String(testingInsights.afternoonLaps) },
      ].map((item) => (
        <div key={item.label} className="bg-[#0c0c0e] p-5">
          <div className="text-[13px] font-medium text-white/40">{item.label}</div>
          <div className="mt-1 text-[24px] font-bold tabular-nums text-white">{item.value}</div>
        </div>
      ))}
    </div>

    {/* Session splits */}
    {(testingInsights.morningFastest || testingInsights.afternoonFastest) && (
      <div className="grid gap-px bg-white/[0.04] p-px md:grid-cols-2">
        {[
          {
            label: 'Morning Fastest',
            result: testingInsights.morningFastest,
            timeKey: 'morningFastestLapTime' as const,
          },
          {
            label: 'Afternoon Fastest',
            result: testingInsights.afternoonFastest,
            timeKey: 'afternoonFastestLapTime' as const,
          },
        ].map((slot) => (
          <div key={slot.label} className="bg-[#0c0c0e] p-5">
            <div className="text-[13px] font-medium text-white/40">{slot.label}</div>
            <div className="mt-1 text-[17px] font-semibold text-white">
              {slot.result?.fullName || '—'}
            </div>
            <div className="text-[15px] font-medium text-red-400">
              {slot.result?.[slot.timeKey] || '—'}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Fastest drivers table */}
    {testingInsights.fastest.length > 0 && (
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-medium text-white/45">
            Fastest First — Sorted by best lap, then mileage
          </span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {testingInsights.fastest.slice(0, 5).map((driver, i) => {
            const laps = driver.lapsCompleted ?? driver.laps ?? 0;
            const distance = calculateDistance(laps, testingInsights.circuitLength);
            const reliability =
              testingInsights.leaderLaps > 0
                ? Math.round((laps / testingInsights.leaderLaps) * 100)
                : 0;
            return (
              <div key={`${driver.driverCode}-${i}`} className="flex items-center gap-4 py-3">
                <span className="w-5 shrink-0 text-[15px] tabular-nums text-white/40">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-semibold text-white">{driver.fullName}</div>
                  <div className="text-[13px] text-white/45">{driver.team}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[16px] font-semibold tabular-nums text-red-400">
                    {driver.fastestLapTime || '—'}
                  </div>
                  <div className="text-[13px] text-white/40">
                    {formatDistance(distance)} · {reliability}% rel.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

// Helper type so TestingCommandCenter can infer the shape
function buildEmptyTestingInsights() {
  return {
    fastest: [] as DetailedRaceResult[],
    mileage: [] as DetailedRaceResult[],
    morningFastest: null as DetailedRaceResult | null,
    afternoonFastest: null as DetailedRaceResult | null,
    totalLaps: 0,
    totalDistance: 0,
    morningLaps: 0,
    afternoonLaps: 0,
    driverCount: 0,
    leaderLaps: 0,
    leaderDistance: 0,
    circuitLength: 5.0,
  };
}

/* ─── Recent Events Section ─── */
const RecentEventsSection = ({
  isTestingMode,
  events,
  selectedYear,
  navigate,
  trackEvent,
  toRaceSlug,
  getCountryCode,
}: {
  isTestingMode: boolean;
  events: ScheduleEvent[];
  selectedYear: number;
  navigate: ReturnType<typeof useNavigate>;
  trackEvent: (name: string, props: Record<string, unknown>) => void;
  toRaceSlug: (name: string) => string;
  getCountryCode: (country: string) => string;
}) => (
  <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wider text-white/40">
          {isTestingMode ? 'Recent Testing' : 'Recent Races'}
        </p>
        <p className="mt-0.5 text-[18px] font-semibold uppercase italic text-white">
          {isTestingMode ? 'Pre-season sessions' : 'Last sessions'}
        </p>
      </div>
      <button
        onClick={() => {
          trackEvent('widget_clicked', {
            widget: isTestingMode ? 'recent_testing' : 'recent_races',
            action: 'view_calendar',
          });
          navigate('/calendar');
        }}
        className="flex items-center gap-1.5 text-[15px] font-bold uppercase text-white/45 transition-colors hover:text-white"
      >
        View calendar
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M1 6h10M7 2l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>

    {/* Event list */}
    <div className="divide-y divide-white/[0.04]">
      {events.length === 0 ? (
        <div className="py-10 text-center text-[15px] text-white/40">
          {isTestingMode
            ? 'No testing sessions completed yet.'
            : 'No races completed yet this season.'}
        </div>
      ) : (
        events.map((event, i) => (
          <motion.div
            key={`${event.EventName}-${event.EventDate}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            onClick={() => {
              trackEvent('widget_clicked', {
                widget: isTestingMode ? 'recent_testing' : 'recent_races',
                action: 'click_event',
                event: event.EventName,
              });
              navigate(`/race/${selectedYear}-${toRaceSlug(event.EventName)}?view=analysis`);
            }}
            className="group flex cursor-pointer items-center gap-4 px-6 py-5 transition-colors hover:bg-white/[0.02]"
          >
            {/* Flag */}
            <div className="h-8 w-12 shrink-0 overflow-hidden rounded border border-white/[0.06]">
              <img
                src={`https://flagcdn.com/h40/${getCountryCode(event.Country || event.Location)}.png`}
                alt={event.Country || event.Location}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                {event.EventName}
              </div>
              <div className="text-[13px] text-white/45">{event.Location}</div>
            </div>

            {/* Arrow */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="shrink-0 text-white/30 transition-colors group-hover:text-white/60"
            >
              <path
                d="M1 6h10M7 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        ))
      )}
    </div>
  </div>
);

export { Dashboard };
export default Dashboard;
