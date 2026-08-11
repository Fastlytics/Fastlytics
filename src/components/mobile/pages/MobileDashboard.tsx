// knip-ignore
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { m } from 'motion/react';
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
  DetailedRaceResult,
  PitStopTeamStat,
  SeasonRecord,
  getCircuitLength,
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
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

import { getCountryCode } from '@/utils/countryUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { SEO } from '@/components/layout/SEO';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLastRaceDetails } from '@/hooks/useLastRaceDetails';
import { useCircuitWeather } from '@/hooks/useCircuitWeather';
import { getCircuitCoords } from '@/lib/circuit-coordinates';
import { Calendar03Icon, Location01Icon } from 'hugeicons-react';
import {
  isTestingDashboardEvent,
  getDashboardEventStartDate,
  toDashboardRaceSlug,
} from '@/pages/Dashboard/dashboard-utils';

const isTestingEvent = isTestingDashboardEvent;
const getEventStartDate = getDashboardEventStartDate;
const toRaceSlug = toDashboardRaceSlug;

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

const MobileDashboard = () => {
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
    let upcomingRace = undefined;
    const sortedSchedule = schedule.toSorted(
      (a, b) => new Date(a.EventDate).getTime() - new Date(b.EventDate).getTime()
    );
    for (const event of sortedSchedule) {
      if (isTestingEvent(event)) {
        continue;
      }

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
          upcomingRace = event;
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
      nextRace: upcomingRace,
      recentRaces: recentRaceEvents,
      recentTestingEvents: recentTesting,
    };
  }, [schedule, raceEvents, testingEvents]);

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

  // Most recent race (by round number)
  const lastRace = useMemo(() => {
    if (raceResults.length === 0) return null;
    return [...raceResults].sort((a, b) => (b.round ?? 0) - (a.round ?? 0))[0];
  }, [raceResults]);

  const lastRaceCountryCode = useMemo(() => {
    if (!lastRace) return undefined;
    const match = schedule.find(
      (e) => e.EventName === lastRace.event || e.RoundNumber === lastRace.round
    );
    const src = match?.Country || match?.Location || lastRace.location;
    return src ? getCountryCode(src) : undefined;
  }, [lastRace, schedule]);

  const { data: pitStats = [], isLoading: isLoadingPitStats } = useQuery<PitStopTeamStat[]>({
    queryKey: ['pitStats', selectedYear],
    queryFn: () => fetchPitStats(selectedYear),
    staleTime: 1000 * 60 * 30,
  });

  const { data: seasonStats = [], isLoading: isLoadingSeasonStats } = useQuery<SeasonRecord[]>({
    queryKey: ['seasonRecords', selectedYear],
    queryFn: () => fetchSeasonRecords(selectedYear),
    staleTime: 1000 * 60 * 60,
  });

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

      <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
        {/* Sticky header */}
        <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pt-3 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-center">
            <FastlyticsLogo size={22} />
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          {/* Page header */}
          <PageHeader
            title={greeting}
            titleClassName="text-[22px] font-bold"
            subtitle={`Season ${selectedYear} overview`}
            selectedYear={selectedYear}
            badge={headerBadge}
          />

          {/* Next session countdown hero */}
          <NextSessionHero
            nextSession={nextSession}
            onClick={() => {
              if (!nextSession) return;
              trackEvent('widget_clicked', {
                widget: 'next_session',
                event: nextSession.eventName,
              });
              navigate(`/race/${selectedYear}-${toRaceSlug(nextSession.eventName)}`);
            }}
          />

          {/* Last race + For You */}
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

          {/* Next race preview */}
          <CircuitPreview
            nextRace={nextRace}
            circuitLengthKm={nextRaceCircuitLength}
            countryCode={nextRaceCountryCode}
            lastYearPole={lastYearPole}
            lastYearWinner={lastYearWinner}
            lastYearFastestLap={null}
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

          {/* For you */}
          <ForYouWidget
            favoriteDriverName={favoriteDriverName}
            favoriteTeamName={favoriteTeamName}
          />

          {/* Pit stops + season stats */}
          <PitStopLeaderboard
            teamStats={pitStats}
            isLoading={isLoadingPitStats}
            selectedYear={selectedYear}
          />
          <SeasonStats stats={seasonStats} year={selectedYear} isLoading={isLoadingSeasonStats} />

          {/* Championship + favorites */}
          <ChampionshipWidget
            drivers={driverStandings}
            teams={teamStandings}
            schedule={schedule}
            raceResults={raceResults}
            isLoading={isLoadingCore}
            profile={profile}
          />
          {user && (
            <FavoritesWidget
              profile={profile}
              drivers={driverStandings}
              teams={teamStandings}
              schedule={schedule}
              isLoading={isLoadingCore}
            />
          )}

          {/* Recent races */}
          <RecentRacesList
            isTestingMode={isTestingMode}
            events={isTestingMode ? recentTestingEvents : recentRaces}
            selectedYear={selectedYear}
            navigate={navigate}
            trackEvent={trackEvent}
            hrefByEventName={recentRaceHrefByEventName}
          />
        </div>
      </div>
    </>
  );
};

/* ─── Next Session Hero (countdown) ─── */
const NextSessionHero = ({
  nextSession,
  onClick,
}: {
  nextSession?: {
    eventName: string;
    sessionName: string;
    date: string;
    location: string;
    country: string;
  };
  onClick: () => void;
}) => {
  const calculateTimeLeft = () => {
    if (!nextSession) return null;
    const now = new Date().getTime();
    const targetDate = new Date(nextSession.date).getTime();
    const difference = targetDate - now;

    if (difference <= 0) return null;

    return {
      d: Math.floor(difference / (1000 * 60 * 60 * 24)),
      h: Math.floor((difference / (1000 * 60 * 60)) % 24),
      m: Math.floor((difference / 1000 / 60) % 60),
      s: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  useEffect(() => {
    if (!nextSession?.date) return;
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextSession]);

  if (!nextSession) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`${CARD_CONTAINER} cursor-pointer p-4 active:bg-white/[0.02]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-[#ff0000] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff0000]">
              Next Up
            </span>
          </div>
          <h2 className="mt-1 text-[18px] font-bold leading-tight text-white">
            {nextSession.eventName.replace('Grand Prix', 'GP')}
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/50">
            <Location01Icon className="size-3" />
            {nextSession.location}
          </div>
        </div>
        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border border-white/[0.06]">
          <img
            src={`https://flagcdn.com/h80/${getCountryCode(nextSession.country || nextSession.location)}.png`}
            alt={nextSession.country || nextSession.location}
            className="size-full object-cover"
          />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/[0.04] pt-3">
        <span className="rounded-md bg-[#ff0000]/10 px-2 py-1 text-[11px] font-semibold text-[#ff0000]">
          {nextSession.sessionName}
        </span>

        {timeLeft ? (
          <div className="flex items-center gap-1.5 font-mono text-right">
            {[
              { value: timeLeft.d, label: 'DAY' },
              { value: String(timeLeft.h).padStart(2, '0'), label: 'HR' },
              { value: String(timeLeft.m).padStart(2, '0'), label: 'MIN' },
              { value: String(timeLeft.s).padStart(2, '0'), label: 'SEC' },
            ].map((unit, i) => (
              <React.Fragment key={unit.label}>
                {i > 0 && <span className="text-white/20">:</span>}
                <div className="text-center">
                  <span className="block text-[16px] font-bold leading-none tabular-nums text-white">
                    {unit.value}
                  </span>
                  <span className="mt-0.5 block text-[8px] text-white/30">{unit.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-[#ff0000] px-2.5 py-1.5">
            <div className="size-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Live Now
            </span>
          </div>
        )}
      </div>
    </m.div>
  );
};

/* ─── Recent Races List ─── */
const RecentRacesList = ({
  isTestingMode,
  events,
  selectedYear,
  navigate,
  trackEvent,
  hrefByEventName,
}: {
  isTestingMode: boolean;
  events: ScheduleEvent[];
  selectedYear: number;
  navigate: ReturnType<typeof useNavigate>;
  trackEvent: (name: string, props: Record<string, unknown>) => void;
  hrefByEventName: Map<string, string>;
}) => (
  <div className={CARD_CONTAINER}>
    <div className="flex items-center justify-between px-4 pt-4 pb-3">
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

    {events.length === 0 ? (
      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
        <Calendar03Icon className="mb-2 size-6 text-white/20" />
        <p className="text-[13px] text-white/50">
          {isTestingMode
            ? 'No testing sessions completed yet.'
            : 'No races completed yet this season.'}
        </p>
      </div>
    ) : (
      <div className="space-y-1 px-2 pb-3">
        {events.map((event) => (
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
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 transition-colors active:bg-white/[0.02]"
          >
            <div className="h-11 w-16 shrink-0 overflow-hidden rounded border border-white/[0.06]">
              <img
                src={`https://flagcdn.com/${getCountryCode(event.Country || event.Location)}.svg`}
                alt={event.Country || event.Location}
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-white">{event.EventName}</div>
              <div className="text-[12px] text-white/50">{event.Location}</div>
            </div>
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              className="shrink-0 text-white/40"
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
        ))}
      </div>
    )}
  </div>
);

export default MobileDashboard;
