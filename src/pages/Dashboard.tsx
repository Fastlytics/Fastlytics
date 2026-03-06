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
import QuickLinksWidget from '@/components/dashboard/QuickLinksWidget';
import { ArrowRight01Icon, Activity01Icon } from 'hugeicons-react';
import { getCountryCode } from '@/utils/countryUtils';
import { SEO } from '@/components/layout/SEO';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  MobileLayout,
  MobilePageHeader,
  MobileNextSessionCard,
  MobileChampionshipWidget,
  MobileRecentRaces,
  MobileFavoritesWidget,
} from '@/components/mobile';

const isTestingEvent = (event: ScheduleEvent): boolean =>
  event.EventFormat?.toLowerCase().includes('test') ?? false;

const getEventStartDate = (event: ScheduleEvent): Date =>
  new Date(event.Session1Date || event.EventDate);

const toRaceSlug = (eventName: string): string => eventName.toLowerCase().replace(/\s+/g, '-');

const parseLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Number.POSITIVE_INFINITY;
  const cleaned = timeStr.startsWith('+') ? timeStr.slice(1) : timeStr;
  const parts = cleaned.split(/[:.]/);
  if (parts.length === 3) {
    return Number(parts[0]) * 60 + Number(parts[1]) + Number(parts[2]) / 1000;
  }
  if (parts.length === 2) {
    return Number(parts[0]) + Number(parts[1]) / 1000;
  }
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
    if (schedule.length === 0) {
      return { nextSession: undefined, recentRaces: [], recentTestingEvents: [] };
    }

    const now = new Date();
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
        if (session.date && new Date(session.date) > now) {
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
      .filter((e) => getEventStartDate(e) < now)
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime())
      .slice(0, 4);

    const recentTesting = testingEvents
      .filter((e) => new Date(e.EventDate) < now)
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
      testingAvailableSessions.find((session) => session.type === testingSpotlightSession)?.name ??
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
    if (!testingSessionResults || testingSessionResults.length === 0) {
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
      .filter((result) => !!result.fastestLapTime)
      .sort((a, b) => {
        const lapDelta = parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime);
        if (lapDelta !== 0) return lapDelta;
        return (b.lapsCompleted ?? 0) - (a.lapsCompleted ?? 0);
      });

    const mileage = [...testingSessionResults].sort(
      (a, b) => (b.lapsCompleted ?? 0) - (a.lapsCompleted ?? 0)
    );
    const totalLaps = testingSessionResults.reduce(
      (sum, result) => sum + (result.lapsCompleted ?? result.laps ?? 0),
      0
    );
    const totalDistance = calculateDistance(totalLaps, circuitLength);
    const morningLaps = testingSessionResults.reduce(
      (sum, result) => sum + (result.morningLapsCompleted ?? 0),
      0
    );
    const afternoonLaps = testingSessionResults.reduce(
      (sum, result) => sum + (result.afternoonLapsCompleted ?? 0),
      0
    );

    const morningFastest =
      [...testingSessionResults]
        .filter((result) => !!result.morningFastestLapTime)
        .sort(
          (a, b) => parseLapTime(a.morningFastestLapTime) - parseLapTime(b.morningFastestLapTime)
        )[0] ?? null;
    const afternoonFastest =
      [...testingSessionResults]
        .filter((result) => !!result.afternoonFastestLapTime)
        .sort(
          (a, b) =>
            parseLapTime(a.afternoonFastestLapTime) - parseLapTime(b.afternoonFastestLapTime)
        )[0] ?? null;

    const leaderLaps = mileage[0]?.lapsCompleted ?? mileage[0]?.laps ?? 0;
    const leaderDistance = calculateDistance(leaderLaps, circuitLength);

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
      leaderDistance,
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

  if (isMobile) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-black text-white font-sans">
          <SEO
            title="F1 Dashboard - Telemetry & Standings"
            description="Real-time F1 dashboard with telemetry, driver standings, team standings, and race schedule. Stay updated with the latest Formula 1 data."
            keywords={['f1 dashboard', 'telemetry', 'f1 standings', 'f1 schedule', 'race results']}
          />

          <main className="pt-4 pb-6 px-4 space-y-6">
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
                <div className="bg-black border-2 border-white/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-red-500">
                    <Activity01Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Testing Mode
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Session
                      </div>
                      <div className="text-sm font-black uppercase text-white">
                        {testingSpotlightSessionName || 'Day Session'}
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Day Mileage
                      </div>
                      <div className="text-sm font-black uppercase text-white">
                        {testingInsights.totalLaps}
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Morning Laps
                      </div>
                      <div className="text-sm font-black uppercase text-white">
                        {testingInsights.morningLaps}
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Afternoon Laps
                      </div>
                      <div className="text-sm font-black uppercase text-white">
                        {testingInsights.afternoonLaps}
                      </div>
                    </div>
                  </div>

                  {testingInsights.fastest.length > 0 && (
                    <button
                      onClick={() =>
                        navigate(
                          `/race/${selectedYear}-${toRaceSlug(primaryTestingEvent?.EventName || '')}?session=${testingSpotlightSession}&view=analysis`
                        )
                      }
                      className="w-full text-left bg-zinc-900/40 border border-white/10 rounded-lg p-3 hover:border-red-600/50 transition-colors"
                    >
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Fastest Driver
                      </div>
                      <div className="text-sm font-black uppercase text-white">
                        {testingInsights.fastest[0].fullName}
                      </div>
                      <div className="text-xs font-sans text-red-500 mt-0.5">
                        {testingInsights.fastest[0].fastestLapTime || '-'}
                      </div>
                    </button>
                  )}

                  {(testingInsights.morningFastest || testingInsights.afternoonFastest) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-900/40 border border-white/10 rounded-lg p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                          Morning Fastest
                        </div>
                        <div className="text-xs font-black uppercase text-white mt-1">
                          {testingInsights.morningFastest?.driverCode || '-'}
                        </div>
                      </div>
                      <div className="bg-zinc-900/40 border border-white/10 rounded-lg p-3">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                          Afternoon Fastest
                        </div>
                        <div className="text-xs font-black uppercase text-white mt-1">
                          {testingInsights.afternoonFastest?.driverCode || '-'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <span className="w-2 h-6 bg-red-600 block"></span>
                    Recent <span className="text-gray-500">Testing</span>
                  </h3>
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
                        className="w-full flex items-center justify-between bg-black border-2 border-white/10 rounded-xl p-3"
                      >
                        <div className="text-left">
                          <div className="font-black uppercase italic text-white text-sm">
                            {event.EventName}
                          </div>
                          <div className="text-[10px] font-sans text-gray-500 uppercase">
                            {event.Location}
                          </div>
                        </div>
                        <ArrowRight01Icon className="w-4 h-4 text-gray-500" />
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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <SEO
        title="F1 Dashboard - Telemetry & Standings"
        description="Real-time F1 dashboard with telemetry, driver standings, team standings, and race schedule. Stay updated with the latest Formula 1 data."
        keywords={['f1 dashboard', 'telemetry', 'f1 standings', 'f1 schedule', 'race results']}
      />
      <DashboardNavbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <DashboardHeader
          selectedYear={selectedYear}
          nextSession={nextSession}
          favoriteDriverName={favoriteDriverName}
        />

        {user && (
          <FavoritesWidget
            profile={profile}
            drivers={driverStandings}
            teams={teamStandings}
            schedule={schedule}
            isLoading={isLoadingDrivers || isLoadingTeams || isLoadingSchedule}
          />
        )}

        {user && <QuickLinksWidget />}

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-3 space-y-12">
            <section>
              {isTestingMode ? (
                <div className="bg-black border-2 border-gray-800 p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                      <span className="w-1 h-8 bg-red-600 block"></span>
                      Testing <span className="text-gray-500">Command Center</span>
                    </h3>
                    {primaryTestingEvent && (
                      <button
                        onClick={() =>
                          navigate(
                            `/race/${selectedYear}-${toRaceSlug(primaryTestingEvent.EventName)}?session=${testingSpotlightSession}&view=analysis`
                          )
                        }
                        className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2"
                      >
                        Open Session Analysis <ArrowRight01Icon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-gray-900/40 border border-gray-800 p-4">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        Spotlight Session
                      </div>
                      <div className="text-2xl font-black uppercase tracking-tight mt-1">
                        {testingSpotlightSessionName || 'Day Session'}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 border border-gray-800 p-4">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        Full-Day Laps
                      </div>
                      <div className="text-2xl font-black uppercase tracking-tight mt-1">
                        {formatDistance(testingInsights.totalDistance)}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 border border-gray-800 p-4">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        Morning Laps
                      </div>
                      <div className="text-2xl font-black uppercase tracking-tight mt-1">
                        {testingInsights.morningLaps}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 border border-gray-800 p-4">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        Afternoon Laps
                      </div>
                      <div className="text-2xl font-black uppercase tracking-tight mt-1">
                        {testingInsights.afternoonLaps}
                      </div>
                    </div>
                  </div>

                  {(testingInsights.morningFastest || testingInsights.afternoonFastest) && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-900/30 border border-gray-800 p-4">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                          Morning Fastest
                        </div>
                        <div className="font-bold uppercase mt-1">
                          {testingInsights.morningFastest?.fullName || '-'}
                        </div>
                        <div className="text-sm font-sans text-red-500 mt-1">
                          {testingInsights.morningFastest?.morningFastestLapTime || '-'}
                        </div>
                      </div>
                      <div className="bg-gray-900/30 border border-gray-800 p-4">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                          Afternoon Fastest
                        </div>
                        <div className="font-bold uppercase mt-1">
                          {testingInsights.afternoonFastest?.fullName || '-'}
                        </div>
                        <div className="text-sm font-sans text-red-500 mt-1">
                          {testingInsights.afternoonFastest?.afternoonFastestLapTime || '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold uppercase tracking-widest text-gray-500">
                        Fastest First
                      </div>
                      <div className="text-xs font-sans text-gray-600">
                        Sorted by best lap, then mileage
                      </div>
                    </div>
                    <div className="space-y-2">
                      {testingInsights.fastest.slice(0, 5).map((driver, index) => {
                        const laps = driver.lapsCompleted ?? driver.laps ?? 0;
                        const distance = calculateDistance(laps, testingInsights.circuitLength);
                        const reliability =
                          testingInsights.leaderLaps > 0
                            ? Math.round((laps / testingInsights.leaderLaps) * 100)
                            : 0;

                        return (
                          <div
                            key={`${driver.driverCode}-${index}`}
                            className="flex items-center justify-between p-3 bg-gray-900/40 border border-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-sans text-gray-500 w-8">{index + 1}</div>
                              <div>
                                <div className="font-bold uppercase">{driver.fullName}</div>
                                <div className="text-xs font-sans text-gray-500">{driver.team}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-sans text-red-500 text-sm">
                                {driver.fastestLapTime || '-'}
                              </div>
                              <div className="text-xs font-sans text-gray-500">
                                {formatDistance(distance)} • {reliability}% reliability
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {testingInsights.fastest.length === 0 && (
                        <div className="text-center py-6 text-gray-500 font-sans text-sm">
                          No testing session data cached yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
            </section>

            <div className="bg-black border-2 border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <span className="w-1 h-8 bg-red-600 block"></span>
                  {isTestingMode ? (
                    <>
                      Recent <span className="text-gray-500">Testing</span>
                    </>
                  ) : (
                    <>
                      Recent <span className="text-gray-500">Races</span>
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    trackEvent('widget_clicked', {
                      widget: isTestingMode ? 'recent_testing' : 'recent_races',
                      action: 'view_calendar',
                    });
                    navigate('/calendar');
                  }}
                  className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  View Calendar <ArrowRight01Icon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {(isTestingMode ? recentTestingEvents : recentRaces).map((event) => (
                  <div
                    key={`${event.EventName}-${event.EventDate}`}
                    onClick={() => {
                      trackEvent('widget_clicked', {
                        widget: isTestingMode ? 'recent_testing' : 'recent_races',
                        action: 'click_event',
                        event: event.EventName,
                      });
                      navigate(
                        `/race/${selectedYear}-${toRaceSlug(event.EventName)}?view=analysis`
                      );
                    }}
                    className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 hover:border-red-600/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-7 bg-gray-800 rounded overflow-hidden shrink-0">
                        <img
                          src={`https://flagcdn.com/h40/${getCountryCode(event.Country || event.Location)}.png`}
                          alt={event.Country || event.Location}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-lg uppercase">{event.EventName}</div>
                        <div className="text-xs font-sans text-gray-500">{event.Location}</div>
                      </div>
                    </div>
                    <ArrowRight01Icon className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                  </div>
                ))}
                {(isTestingMode ? recentTestingEvents : recentRaces).length === 0 && (
                  <div className="text-center py-8 text-gray-500 font-sans text-sm">
                    {isTestingMode
                      ? 'No testing sessions completed yet this season.'
                      : 'No races completed yet this season.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export { Dashboard };
export default Dashboard;
