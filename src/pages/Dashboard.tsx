// knip-ignore
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  fetchTeamStandings,
  fetchDriverStandings,
  fetchSchedule,
  fetchRaceResults,
  fetchAvailableSessions,
  fetchSpecificRaceResults,
  fetchPitStats,
  fetchSeasonRecords,
  TeamStanding,
  DriverStanding,
  ScheduleEvent,
  RaceResult,
  AvailableSession,
  DetailedRaceResult,
  PitStopTeamStat,
  SeasonRecord,
  getCircuitLength,
  calculateDistance,
  formatDistance,
} from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import { useAuth } from '@/contexts/AuthContext';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import PageHeader from '@/components/dashboard/PageHeader';
import CircuitPreview from '@/components/dashboard/CircuitPreview';
import ForYouWidget from '@/components/dashboard/ForYouWidget';
import LastRaceSummary from '@/components/dashboard/LastRaceSummary';
import PitStopLeaderboard from '@/components/dashboard/PitStopLeaderboard';
import SeasonStats from '@/components/dashboard/SeasonStats';
import ChampionshipWidget from '@/components/dashboard/ChampionshipWidget';
import FavoritesWidget from '@/components/dashboard/FavoritesWidget';

import { getCountryCode } from '@/utils/countryUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { SEO } from '@/components/layout/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLastRaceDetails } from '@/hooks/useLastRaceDetails';
import { useCircuitWeather } from '@/hooks/useCircuitWeather';
import { getCircuitCoords } from '@/lib/circuit-coordinates';
import { m } from 'motion/react';
import {
  isTestingDashboardEvent,
  getDashboardEventStartDate,
  toDashboardRaceSlug,
  parseDashboardLapTime,
  getDashboardTestingSessionOrder,
  buildEmptyTestingInsights,
} from './Dashboard/dashboard-utils';

export {
  isTestingDashboardEvent,
  getDashboardEventStartDate,
  toDashboardRaceSlug,
  parseDashboardLapTime,
  getDashboardTestingSessionOrder,
  buildEmptyTestingInsights,
};

const isTestingEvent = isTestingDashboardEvent;
const getEventStartDate = getDashboardEventStartDate;
const toRaceSlug = toDashboardRaceSlug;
const parseLapTime = parseDashboardLapTime;
const getTestingSessionOrder = getDashboardTestingSessionOrder;

const getRecentRaceSessionOrder = (sessionType: string): number => {
  if (sessionType === 'FP1') return 10;
  if (sessionType === 'FP2') return 20;
  if (sessionType === 'FP3') return 30;
  if (sessionType === 'SQ') return 35;
  if (sessionType === 'SQ1') return 36;
  if (sessionType === 'SQ2') return 37;
  if (sessionType === 'SQ3') return 38;
  if (sessionType === 'Sprint') return 40;
  if (sessionType === 'Q') return 45;
  if (sessionType === 'Q1') return 46;
  if (sessionType === 'Q2') return 47;
  if (sessionType === 'Q3') return 48;
  if (sessionType === 'R') return 100;
  return -1;
};

const Dashboard = () => {
  const [now] = useState(() => Date.now());
  const { selectedYear } = useSeason();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { trackEvent, trackPageView } = useAnalytics();

  const greeting = useMemo(() => {
    const name =
      profile?.first_name?.trim() ||
      profile?.full_name?.trim()?.split(' ')[0] ||
      user?.email?.split('@')[0] ||
      '';
    if (!name) return 'Dashboard';

    const hour = new Date().getHours();

    const timeGreeting = (() => {
      if (hour >= 5 && hour < 12) return 'Good morning';
      if (hour >= 12 && hour < 17) return 'Good afternoon';
      if (hour >= 17 && hour < 21) return 'Good evening';
      return 'Good night';
    })();

    const casualGreetings = ['Howdy', 'Hey', 'Hello', 'Hi', 'Welcome back'];
    const day = new Date().getDate();

    const greetingWord =
      day % 4 === 0 ? casualGreetings[day % casualGreetings.length] : timeGreeting;

    return `${greetingWord}, ${name}`;
  }, [profile, user]);

  useEffect(() => {
    trackPageView('dashboard', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: schedule = [],
    isLoading: isLoadingSchedule,
    isError: isScheduleError,
  } = useQuery<ScheduleEvent[]>({
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

  const {
    data: teamStandings = [],
    isLoading: isLoadingTeams,
    isError: isTeamsError,
  } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
  });

  const {
    data: driverStandings = [],
    isLoading: isLoadingDrivers,
    isError: isDriversError,
  } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
  });

  const { nextSession, nextRace, recentRaces, recentTestingEvents } = useMemo(() => {
    if (schedule.length === 0)
      return {
        nextSession: undefined,
        nextRace: undefined,
        recentRaces: [],
        recentTestingEvents: [],
      };
    const nowDate = new Date();
    let upcomingSession = undefined;
    const sortedSchedule = schedule.toSorted(
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
    // Next race weekend = first non-testing event whose EventDate is in the future.
    const upcomingRace = raceEvents
      .toSorted((a, b) => new Date(a.EventDate).getTime() - new Date(b.EventDate).getTime())
      .find((e) => new Date(e.EventDate).getTime() >= nowDate.getTime());
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
      nextRace: upcomingRace,
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

  const recentRaceAvailableSessionQueries = useQueries({
    queries: recentRaces.map((event) => ({
      queryKey: ['recentRaceAvailableSessions', selectedYear, event.EventName],
      queryFn: () => fetchAvailableSessions(selectedYear, event.EventName),
      enabled: !!event.EventName,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const recentRaceHrefByEventName = useMemo(() => {
    const hrefByEventName = new Map<string, string>();

    recentRaces.forEach((event, index) => {
      const slug = `${selectedYear}-${toRaceSlug(event.EventName)}`;
      const availableSessions = recentRaceAvailableSessionQueries[index]?.data ?? [];

      if (availableSessions.some((session) => session.type === 'R')) {
        hrefByEventName.set(event.EventName, `/race/${slug}?view=analysis`);
        return;
      }

      const latestSession = availableSessions.toSorted(
        (a, b) => getRecentRaceSessionOrder(b.type) - getRecentRaceSessionOrder(a.type)
      )[0]?.type;

      hrefByEventName.set(
        event.EventName,
        latestSession ? `/race/${slug}?session=${latestSession}` : `/race/${slug}`
      );
    });

    return hrefByEventName;
  }, [recentRaces, recentRaceAvailableSessionQueries, selectedYear]);

  const { data: testingAvailableSessions = [] } = useQuery<AvailableSession[]>({
    queryKey: ['testingAvailableSessions', selectedYear, primaryTestingEvent?.EventName],
    queryFn: () => fetchAvailableSessions(selectedYear, primaryTestingEvent!.EventName),
    enabled: isTestingMode && !!primaryTestingEvent?.EventName,
  });

  const testingSpotlightSession = useMemo(() => {
    if (testingAvailableSessions.length === 0) return '';
    return (
      testingAvailableSessions.toSorted(
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
    const mileage = testingSessionResults.toSorted(
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
    const morningFastest = testingSessionResults.reduce<DetailedRaceResult | null>(
      (best, result) => {
        if (!result.morningFastestLapTime) return best;
        if (!best) return result;
        return parseLapTime(result.morningFastestLapTime) < parseLapTime(best.morningFastestLapTime)
          ? result
          : best;
      },
      null
    );
    const afternoonFastest = testingSessionResults.reduce<DetailedRaceResult | null>(
      (best, result) => {
        if (!result.afternoonFastestLapTime) return best;
        if (!best) return result;
        return parseLapTime(result.afternoonFastestLapTime) <
          parseLapTime(best.afternoonFastestLapTime)
          ? result
          : best;
      },
      null
    );
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
    return driver?.name.split(' ').pop();
  }, [profile, driverStandings]);

  const favoriteTeamName = useMemo(() => {
    if (!profile?.favorite_team || teamStandings.length === 0) return undefined;
    const team = teamStandings.find(
      (t) =>
        t.team === profile.favorite_team ||
        t.team.toLowerCase().includes(profile.favorite_team.toLowerCase())
    );
    return team?.team ?? profile.favorite_team;
  }, [profile, teamStandings]);

  /* ── Computed dashboard-level stats ───────────────────────────── */

  // Most recent race (by round number)
  const lastRace = useMemo(() => {
    if (raceResults.length === 0) return null;
    return [...raceResults].sort((a, b) => (b.round ?? 0) - (a.round ?? 0))[0];
  }, [raceResults]);

  const lastRaceCountryCode = useMemo(() => {
    if (!lastRace) return undefined;
    // RaceResult doesn't carry country directly — match against schedule
    const match = schedule.find(
      (e) => e.EventName === lastRace.event || e.RoundNumber === lastRace.round
    );
    const src = match?.Country || match?.Location || lastRace.location;
    return src ? getCountryCode(src) : undefined;
  }, [lastRace, schedule]);

  // Pit stop data from OpenF1
  const { data: pitStats = [], isLoading: isLoadingPitStats } = useQuery<PitStopTeamStat[]>({
    queryKey: ['pitStats', selectedYear],
    queryFn: () => fetchPitStats(selectedYear),
    staleTime: 1000 * 60 * 30, // 30 min
  });

  // Season records from Supabase (jolpica data)
  const { data: seasonStats = [], isLoading: isLoadingSeasonStats } = useQuery<SeasonRecord[]>({
    queryKey: ['seasonRecords', selectedYear],
    queryFn: () => fetchSeasonRecords(selectedYear),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Page header badge: show "LIVE NOW" if a session is in progress, else an info pill about next session.
  const headerBadge = useMemo(() => {
    if (!nextSession) return null;
    const diff = new Date(nextSession.date).getTime() - now;
    if (diff <= 0) {
      return { label: `LIVE NOW — ${nextSession.sessionName}`, tone: 'live' as const };
    }
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) {
      return {
        label: `${nextSession.sessionName} in ${Math.ceil(hours)}h`,
        tone: 'info' as const,
      };
    }
    return null;
  }, [nextSession, now]);

  const nextRaceCountryCode = useMemo(
    () => (nextRace ? getCountryCode(nextRace.Country || nextRace.Location) : undefined),
    [nextRace]
  );

  const nextRaceCircuitLength = useMemo(
    () => getCircuitLength(nextRace?.EventName, nextRace?.Location),
    [nextRace]
  );

  // Circuit coords + weather forecast for the next race (Open-Meteo)
  const nextRaceCoords = useMemo(
    () => (nextRace ? getCircuitCoords(nextRace.EventName, nextRace.Location) : null),
    [nextRace]
  );

  const raceSessionStartTime = useMemo(() => {
    if (!nextRace) return undefined;

    const sessions = [
      { name: nextRace.Session1, date: nextRace.Session1Date },
      { name: nextRace.Session2, date: nextRace.Session2Date },
      { name: nextRace.Session3, date: nextRace.Session3Date },
      { name: nextRace.Session4, date: nextRace.Session4Date },
      { name: nextRace.Session5, date: nextRace.Session5Date },
    ];

    const raceSession = sessions.find(
      (session) => session.name?.toLowerCase() === 'race' && session.date
    );
    return raceSession?.date ?? nextRace.EventDate;
  }, [nextRace]);

  const { data: nextRaceWeather, isLoading: isLoadingWeather } = useCircuitWeather(
    nextRaceCoords?.lat,
    nextRaceCoords?.lng,
    nextRace?.EventDate,
    nextRaceCoords?.timezone,
    raceSessionStartTime
  );

  // Rich details for the most recent race (podium gaps, pole, fastest lap, DNFs, biggest gainer)
  const { data: lastRaceDetails, isLoading: isLoadingLastRaceDetails } = useLastRaceDetails(
    selectedYear,
    lastRace?.event
  );

  const prevYear = selectedYear - 1;

  const { data: prevYearSchedule = [] } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', prevYear],
    queryFn: () => fetchSchedule(prevYear),
    enabled: !!nextRace && prevYear >= 1950,
  });

  const prevYearEvent = useMemo(() => {
    if (!nextRace || prevYearSchedule.length === 0) return undefined;
    const byName = prevYearSchedule.find(
      (e) => e.EventName === nextRace.EventName && !isTestingEvent(e)
    );
    if (byName) return byName;
    return prevYearSchedule.find(
      (e) => e.RoundNumber === nextRace.RoundNumber && !isTestingEvent(e)
    );
  }, [nextRace, prevYearSchedule]);

  const { data: prevYearRaceResults = [] } = useQuery<DetailedRaceResult[]>({
    queryKey: ['prevYearRaceResults', prevYear, prevYearEvent?.EventName],
    queryFn: () => fetchSpecificRaceResults(prevYear, toRaceSlug(prevYearEvent!.EventName), 'R'),
    enabled: !!prevYearEvent,
  });

  const lastYearPole = useMemo(() => {
    if (prevYearRaceResults.length === 0) return null;
    const poleSitter = prevYearRaceResults.find((r) => r.gridPosition === 1);
    if (!poleSitter) return null;
    return {
      driver: poleSitter.fullName,
      lapTime: poleSitter.poleLapTimeValue || '',
      headshotUrl: getDriverImage(poleSitter.driverCode, prevYear) || null,
    };
  }, [prevYearRaceResults, prevYear]);

  const lastYearWinner = useMemo(() => {
    if (prevYearRaceResults.length === 0) return null;
    const winner = prevYearRaceResults.find((r) => r.position === 1);
    if (!winner) return null;
    return {
      driver: winner.fullName,
      team: winner.team,
      headshotUrl: getDriverImage(winner.driverCode, prevYear) || null,
    };
  }, [prevYearRaceResults, prevYear]);

  const lastYearFastestLap = useMemo(() => {
    if (prevYearRaceResults.length === 0) return null;
    const fl = prevYearRaceResults.find((r) => r.isFastestLap);
    if (fl)
      return {
        driver: fl.fullName,
        lapTime: fl.fastestLapTimeValue || '',
        headshotUrl: getDriverImage(fl.driverCode, prevYear) || null,
      };
    const fastest = [...prevYearRaceResults]
      .filter((r) => r.fastestLapTimeValue)
      .sort((a, b) => parseLapTime(a.fastestLapTimeValue) - parseLapTime(b.fastestLapTimeValue));
    if (fastest.length === 0) return null;
    return {
      driver: fastest[0].fullName,
      lapTime: fastest[0].fastestLapTimeValue || '',
      headshotUrl: fastest[0].driverCode
        ? getDriverImage(fastest[0].driverCode, prevYear) || null
        : null,
    };
  }, [prevYearRaceResults, prevYear]);

  const hasCriticalDashboardError = isScheduleError || isTeamsError || isDriversError;
  const isLoadingCore = isLoadingDrivers || isLoadingTeams || isLoadingSchedule;

  if (hasCriticalDashboardError) {
    return (
      <>
        <SEO
          title="Dashboard"
          description="Follow the season from one live race desk with telemetry, standings, schedule updates, pace context, and recent event breakdowns."
          keywords={['f1 dashboard', 'f1 data', 'telemetry', 'driver standings', 'race results']}
        />
        <div className="flex min-h-[60vh] items-center justify-center text-center">
          <div className="space-y-2">
            <h1 className="text-[18px] font-medium text-white">Unable to load dashboard</h1>
            <p className="text-[13px] text-white/80">
              Critical data could not be loaded. Please try again shortly.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard"
        description="Follow the season from one live race desk with telemetry, standings, schedule updates, pace context, and recent event breakdowns."
        keywords={['f1 dashboard', 'f1 data', 'telemetry', 'driver standings', 'race results']}
      />

      <div className="space-y-5 text-white">
        {/* 1. Page header */}
        <PageHeader
          title={greeting}
          titleClassName="text-[22px] font-bold"
          subtitle={`Season ${selectedYear} overview`}
          selectedYear={selectedYear}
          badge={headerBadge}
        />

        {/* 2. Circuit preview + Last race + For You */}
        <div className="grid gap-5 lg:grid-cols-4">
          <div className="lg:col-span-2 h-full">
            <CircuitPreview
              nextRace={nextRace}
              circuitLengthKm={nextRaceCircuitLength}
              countryCode={nextRaceCountryCode}
              lastYearPole={lastYearPole}
              lastYearWinner={lastYearWinner}
              lastYearFastestLap={lastYearFastestLap}
              weather={nextRaceWeather}
              isLoadingWeather={isLoadingWeather}
              isLoading={isLoadingSchedule}
              driverStandings={driverStandings}
              teamStandings={teamStandings}
              onClick={() => {
                if (!nextRace) return;
                trackEvent('widget_clicked', {
                  widget: 'circuit_preview',
                  event: nextRace.EventName,
                });
                navigate(`/race/${selectedYear}-${toRaceSlug(nextRace.EventName)}`);
              }}
            />
          </div>
          <div className="h-full">
            <LastRaceSummary
              raceName={lastRace?.event ?? ''}
              roundNumber={lastRace?.round ?? 0}
              countryCode={lastRaceCountryCode}
              date={lastRace?.date ?? ''}
              podium={lastRaceDetails?.podium ?? []}
              pole={lastRaceDetails?.pole}
              fastestLap={lastRaceDetails?.fastestLap}
              biggestGainer={lastRaceDetails?.biggestGainer}
              dnfCount={lastRaceDetails?.dnfCount ?? 0}
              isLoading={(isLoadingSchedule && !lastRace) || isLoadingLastRaceDetails}
              onClick={() => {
                if (!lastRace?.event) return;
                trackEvent('widget_clicked', {
                  widget: 'last_race_summary',
                  event: lastRace.event,
                });
                navigate(`/race/${selectedYear}-${toRaceSlug(lastRace.event)}?view=analysis`);
              }}
            />
          </div>
          <div>
            <ForYouWidget
              favoriteDriverName={favoriteDriverName}
              favoriteTeamName={favoriteTeamName}
            />
          </div>
        </div>

        {/* 5. Pit stops + Season stats */}
        <div className="grid gap-5 lg:grid-cols-2">
          <PitStopLeaderboard
            teamStats={pitStats}
            isLoading={isLoadingPitStats}
            selectedYear={selectedYear}
          />
          <SeasonStats stats={seasonStats} year={selectedYear} isLoading={isLoadingSeasonStats} />
        </div>

        {/* 6. My Garage + Championship */}
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
          <div className={`grid gap-5 ${user ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {user && (
              <div className="h-full">
                <FavoritesWidget
                  profile={profile}
                  drivers={driverStandings}
                  teams={teamStandings}
                  schedule={schedule}
                  isLoading={isLoadingCore}
                />
              </div>
            )}
            <div className={`h-full ${user ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
              <ChampionshipWidget
                drivers={driverStandings}
                teams={teamStandings}
                schedule={schedule}
                raceResults={raceResults}
                isLoading={isLoadingCore}
                profile={profile}
              />
            </div>
            <div className="h-full">
              <RecentEventsSection
                isTestingMode={false}
                events={recentRaces}
                selectedYear={selectedYear}
                navigate={navigate}
                trackEvent={trackEvent}
                toRaceSlug={toRaceSlug}
                getCountryCode={getCountryCode}
                hrefByEventName={recentRaceHrefByEventName}
              />
            </div>
          </div>
        )}
      </div>
    </>
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
  <div className={CARD_CONTAINER}>
    {/* Header */}
    <div className="flex items-center justify-between px-5 pt-5 pb-4">
      <span className={CARD_LABEL}>Pre-Season Testing</span>
      {primaryTestingEvent && (
        <button
          onClick={() =>
            navigate(
              `/race/${selectedYear}-${toRaceSlug(primaryTestingEvent.EventName)}?session=${testingSpotlightSession}&view=analysis`
            )
          }
          className="flex items-center gap-1 text-[12px] font-medium text-white/80 transition-colors hover:text-white"
        >
          Open Analysis
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
    <div className="grid grid-cols-2 gap-px border-t border-white/[0.04] md:grid-cols-4">
      {[
        { label: 'Session', value: testingSpotlightSessionName || 'Day Session' },
        { label: 'Distance', value: formatDistance(testingInsights.totalDistance) },
        { label: 'AM Laps', value: String(testingInsights.morningLaps) },
        { label: 'PM Laps', value: String(testingInsights.afternoonLaps) },
      ].map((item) => (
        <div key={item.label} className="px-5 py-4">
          <div className={CARD_LABEL}>{item.label}</div>
          <div className="mt-1 font text-[20px] tabular-nums text-white">{item.value}</div>
        </div>
      ))}
    </div>

    {/* Session splits */}
    {(testingInsights.morningFastest || testingInsights.afternoonFastest) && (
      <div className="grid border-t border-white/[0.04] md:grid-cols-2">
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
          <div key={slot.label} className="px-5 py-4 border-r border-white/[0.04] last:border-r-0">
            <div className={CARD_LABEL}>{slot.label}</div>
            <div className="mt-1 text-[14px] font-medium text-white">
              {slot.result?.fullName || '—'}
            </div>
            <div className="font text-[13px] tabular-nums text-emerald-400">
              {slot.result?.[slot.timeKey] || '—'}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Fastest drivers table */}
    {testingInsights.fastest.length > 0 && (
      <div className="border-t border-white/[0.04] px-2 py-3">
        <div className="px-3 pb-2">
          <span className={CARD_LABEL}>Fastest — sorted by best lap, then mileage</span>
        </div>
        {testingInsights.fastest.slice(0, 5).map((driver, i) => {
          const laps = driver.lapsCompleted ?? driver.laps ?? 0;
          const distance = calculateDistance(laps, testingInsights.circuitLength);
          const reliability =
            testingInsights.leaderLaps > 0
              ? Math.round((laps / testingInsights.leaderLaps) * 100)
              : 0;
          return (
            <div
              key={driver.driverCode}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <span className="w-4 shrink-0 font text-[13px] tabular-nums text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-white">{driver.fullName}</div>
                <div className="text-[12px] text-white/80">{driver.team}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font text-[13px] tabular-nums text-emerald-400">
                  {driver.fastestLapTime || '—'}
                </div>
                <div className="font text-[11px] tabular-nums text-white/80">
                  {formatDistance(distance)} · {reliability}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

/* ─── Recent Events Section ─── */
const RecentEventsSection = ({
  isTestingMode,
  events,
  selectedYear,
  navigate,
  trackEvent,
  toRaceSlug,
  getCountryCode,
  hrefByEventName,
}: {
  isTestingMode: boolean;
  events: ScheduleEvent[];
  selectedYear: number;
  navigate: ReturnType<typeof useNavigate>;
  trackEvent: (name: string, props: Record<string, unknown>) => void;
  toRaceSlug: (name: string) => string;
  getCountryCode: (country: string) => string;
  hrefByEventName: Map<string, string>;
}) => (
  <div className={`h-full ${CARD_CONTAINER}`}>
    {/* Header */}
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <span className={CARD_LABEL}>{isTestingMode ? 'Recent Testing' : 'Recent Races'}</span>
      <button
        onClick={() => {
          trackEvent('widget_clicked', {
            widget: isTestingMode ? 'recent_testing' : 'recent_races',
            action: 'view_calendar',
          });
          navigate('/calendar');
        }}
        className="flex items-center gap-1 text-[12px] font-medium text-white/80 transition-colors hover:text-white"
      >
        View calendar
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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
    <div className="px-2 pb-3">
      {events.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-white/80">
          {isTestingMode
            ? 'No testing sessions completed yet.'
            : 'No races completed yet this season.'}
        </div>
      ) : (
        events.map((event) => (
          <m.div
            key={`${event.EventName}-${event.EventDate}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              trackEvent('widget_clicked', {
                widget: isTestingMode ? 'recent_testing' : 'recent_races',
                action: 'click_event',
                event: event.EventName,
              });
              navigate(
                hrefByEventName.get(event.EventName) ??
                  `/race/${selectedYear}-${toRaceSlug(event.EventName)}`
              );
            }}
            className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
          >
            {/* Flag */}
            <div className="h-12 w-18 shrink-0 overflow-hidden rounded border border-white/[0.06]">
              <img
                src={`https://flagcdn.com/${getCountryCode(event.Country || event.Location)}.svg`}
                alt={event.Country || event.Location}
                className="size-full object-cover"
              />
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-white transition-colors group-hover:text-white">
                {event.EventName}
              </div>
              <div className="text-[12px] text-white/80">{event.Location}</div>
            </div>

            {/* Arrow */}
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              className="shrink-0 text-white/50 transition-colors group-hover:text-white/80"
            >
              <path
                d="M1 6h10M7 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </m.div>
        ))
      )}
    </div>
  </div>
);

export default Dashboard;
