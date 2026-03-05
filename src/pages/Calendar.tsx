import React, { useMemo, useRef, useState, useEffect } from 'react';
import { SEO } from '@/components/layout/SEO';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion, useInView } from 'framer-motion';
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  AlertCircleIcon,
  Clock01Icon,
  ChampionIcon,
  Location01Icon,
  FlashIcon,
  Time01Icon,
} from 'hugeicons-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { fetchRaceResults, RaceResult, fetchSchedule, ScheduleEvent } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getCountryCode } from '@/utils/countryUtils';
import RaceCard from '@/components/calendar/RaceCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCalendar } from '@/components/mobile';

// Countdown Component
const Countdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +targetDate - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className="flex gap-4 md:gap-8">
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-black text-white font-sans">
          {formatTime(timeLeft.days)}
        </div>
        <div className="text-[10px] md:text-xs font-bold uppercase text-gray-500 tracking-widest">
          Days
        </div>
      </div>
      <div className="text-3xl md:text-5xl font-black text-gray-700 font-sans">:</div>
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-black text-white font-sans">
          {formatTime(timeLeft.hours)}
        </div>
        <div className="text-[10px] md:text-xs font-bold uppercase text-gray-500 tracking-widest">
          Hrs
        </div>
      </div>
      <div className="text-3xl md:text-5xl font-black text-gray-700 font-sans">:</div>
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-black text-white font-sans">
          {formatTime(timeLeft.minutes)}
        </div>
        <div className="text-[10px] md:text-xs font-bold uppercase text-gray-500 tracking-widest">
          Mins
        </div>
      </div>
      <div className="text-3xl md:text-5xl font-black text-gray-700 font-sans">:</div>
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-black text-red-600 font-sans">
          {formatTime(timeLeft.seconds)}
        </div>
        <div className="text-[10px] md:text-xs font-bold uppercase text-gray-500 tracking-widest">
          Secs
        </div>
      </div>
    </div>
  );
};

const TESTING_LOCATION_HINTS: Record<string, { location: string; country: string }> = {
  bahrain: { location: 'Sakhir', country: 'Bahrain' },
  sakhir: { location: 'Sakhir', country: 'Bahrain' },
  barcelona: { location: 'Barcelona', country: 'Spain' },
  jerez: { location: 'Jerez', country: 'Spain' },
  abu_dhabi: { location: 'Yas Marina', country: 'United Arab Emirates' },
  yas_marina: { location: 'Yas Marina', country: 'United Arab Emirates' },
};

const isTestingEvent = (event: ScheduleEvent): boolean =>
  Boolean(
    event.EventFormat?.toLowerCase().includes('test') ||
    event.RoundNumber === 0 ||
    event.EventName?.toLowerCase().includes('testing')
  );

const getEventStartDate = (event: ScheduleEvent): Date => {
  const dates = [
    event.Session1Date,
    event.Session2Date,
    event.Session3Date,
    event.Session4Date,
    event.Session5Date,
    event.EventDate,
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((value) => !Number.isNaN(value.getTime()));

  if (dates.length === 0) return new Date(event.EventDate);
  return dates.sort((a, b) => a.getTime() - b.getTime())[0];
};

const getTestingVenue = (event: ScheduleEvent): { location: string; country: string } | null => {
  const directLocation = (event.Location || '').trim();
  const directCountry = (event.Country || '').trim();
  if (directLocation && directCountry) {
    return { location: directLocation, country: directCountry };
  }

  const normalizedName = (event.EventName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  for (const [hint, venue] of Object.entries(TESTING_LOCATION_HINTS)) {
    if (normalizedName.includes(hint)) {
      return venue;
    }
  }

  if (normalizedName.includes('pre_season_testing')) {
    return TESTING_LOCATION_HINTS.bahrain;
  }

  if (directLocation || directCountry) {
    return {
      location: directLocation || directCountry,
      country: directCountry || directLocation,
    };
  }

  return null;
};

const Calendar = () => {
  const [now] = useState(() => Date.now());
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const { trackEvent, trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('calendar', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const racesRef = useRef(null);
  const isRacesInView = useInView(racesRef, { once: true, amount: 0.1 });

  // Fetch Full Schedule
  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
    error: scheduleError,
  } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

  const hasCompletedRaceEventsInSchedule = useMemo(
    () =>
      (scheduleData ?? []).some(
        (event) => !isTestingEvent(event) && new Date(event.EventDate).getTime() <= now
      ),
    [scheduleData, now]
  );

  // Fetch Race Results Summary
  const {
    data: resultsData,
    isLoading: isLoadingResults,
    error: resultsError,
  } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
    enabled: !isLoadingSchedule && hasCompletedRaceEventsInSchedule,
  });

  // Combine schedule and results data
  const { combinedRaceData, nextRace, nextSession } = useMemo(() => {
    if (!scheduleData) return { combinedRaceData: [], nextRace: null, nextSession: null };
    const resultsMap = new Map(resultsData?.map((res) => [res.event, res]));
    const now = new Date();
    const currentYear = now.getFullYear();

    // Find next race
    let nextRaceEvent = null;
    let nextSessionData = null;

    // Sort schedule by date to ensure we check in order
    const sortedSchedule = [...scheduleData].sort(
      (a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime()
    );

    for (const event of sortedSchedule) {
      if (isTestingEvent(event)) {
        continue; // Hero is race-only.
      }

      // Check all 5 possible sessions
      const sessions = [
        { name: event.Session1, date: event.Session1Date },
        { name: event.Session2, date: event.Session2Date },
        { name: event.Session3, date: event.Session3Date },
        { name: event.Session4, date: event.Session4Date },
        { name: event.Session5, date: event.Session5Date },
      ].filter((s) => s.name && s.date);

      // Sort sessions by date
      sessions.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

      // Find first session in future
      const upcomingSession = sessions.find((s) => new Date(s.date!) > now);

      if (upcomingSession) {
        const nextCountryCode = getCountryCode(event.Country || event.Location);
        nextRaceEvent = {
          ...event,
          displayDate: new Date(event.EventDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          countryCode: nextCountryCode !== 'xx' ? nextCountryCode : undefined,
        };
        nextSessionData = {
          name: upcomingSession.name!,
          date: new Date(upcomingSession.date!),
        };
        break; // Found the very first upcoming session/race
      }
    }

    const processedData = scheduleData
      .map((event) => {
        const testing = isTestingEvent(event);
        const testingVenue = testing ? getTestingVenue(event) : null;
        const displayLocation =
          testingVenue?.location || event.Location || event.Country || 'Testing Venue';
        const displayCountry = testingVenue?.country || event.Country || event.Location || '';
        const result = resultsMap.get(event.EventName);
        const eventDate = new Date(event.EventDate);
        const eventStartDate = getEventStartDate(event);

        // Determine if race is upcoming (strict check for any session in future)
        const sessions = [
          event.Session1Date,
          event.Session2Date,
          event.Session3Date,
          event.Session4Date,
          event.Session5Date,
        ]
          .filter((d) => d)
          .map((d) => new Date(d!));

        let isUpcoming = sessions.some((d) => d > now);
        if (testing && selectedYear < currentYear) {
          isUpcoming = false;
        }

        const computedCountryCode = getCountryCode(displayCountry || displayLocation);
        const countryCode = computedCountryCode !== 'xx' ? computedCountryCode : undefined;

        return {
          ...event,
          result,
          isUpcoming,
          isTesting: testing,
          isSprint: event.EventFormat && event.EventFormat.toLowerCase().includes('sprint'),
          displayDate: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          eventStartDate,
          displayLocation,
          displayCountry,
          countryCode,
        };
      })
      .sort((a, b) => {
        if (a.isTesting !== b.isTesting) {
          return a.isTesting ? -1 : 1;
        }
        if (!a.isTesting && !b.isTesting) {
          return a.RoundNumber - b.RoundNumber;
        }
        return a.eventStartDate.getTime() - b.eventStartDate.getTime();
      });

    return {
      combinedRaceData: processedData,
      nextRace: nextRaceEvent,
      nextSession: nextSessionData,
    };
  }, [scheduleData, resultsData, selectedYear]);

  // Render mobile version (after all hooks)
  if (isMobile) {
    return (
      <>
        <SEO
          title={`F1 Calendar ${selectedYear} - Race Schedule & Results`}
          description={`Full Formula 1 ${selectedYear} race calendar. Check race dates, times, and results for every Grand Prix.`}
          keywords={[
            'f1 calendar',
            'f1 schedule',
            'race dates',
            'f1 2024 calendar',
            `${selectedYear} f1 schedule`,
          ]}
        />
        <MobileCalendar />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <SEO
        title={`F1 Calendar ${selectedYear} - Race Schedule & Results`}
        description={`Full Formula 1 ${selectedYear} race calendar. Check race dates, times, and results for every Grand Prix.`}
        keywords={[
          'f1 calendar',
          'f1 schedule',
          'race dates',
          'f1 2024 calendar',
          `${selectedYear} f1 schedule`,
        ]}
      />
      <DashboardNavbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" ref={racesRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b-2 border-gray-800 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-white hover:bg-gray-800"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft01Icon className="h-6 w-6" />
              </Button>
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                Race <span className="text-red-600">Calendar</span>
              </h1>
            </div>
            <p className="text-gray-500 font-sans text-sm uppercase tracking-widest ml-14">
              {selectedYear} Season Overview
            </p>
          </div>

          {/* Season Selector */}
          <div className="relative">
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => {
                setSelectedYear(Number(value));
                trackEvent('season_changed', { page: 'calendar', year: Number(value) });
              }}
            >
              <SelectTrigger className="w-auto min-w-[180px] bg-black border-2 border-gray-800 text-white hover:border-red-600 rounded-none font-bold uppercase tracking-widest h-12 px-6">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <ChampionIcon className="w-4 h-4 text-red-600" />
                  <span>{selectedYear} Season</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-2 border-gray-800 text-white rounded-none">
                <SelectGroup>
                  <SelectLabel className="text-gray-500 text-xs uppercase tracking-wider px-2 py-2">
                    Select Season
                  </SelectLabel>
                  {availableYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={String(year)}
                      className="text-sm font-bold uppercase tracking-widest focus:bg-red-600 focus:text-white cursor-pointer rounded-none"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Next Race Highlight */}
        {nextRace && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-black z-0" />
            <div className="border-2 border-red-600 bg-black/50 p-8 md:p-12 relative z-10">
              <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-2 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <Time01Icon className="w-4 h-4" />
                Next Grand Prix
              </div>

              <div className="flex flex-col lg:flex-row gap-12 items-center">
                {/* Left: Race Info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className="w-16 h-10 bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden">
                      {nextRace.countryCode && (
                        <img
                          src={`https://flagcdn.com/h40/${nextRace.countryCode}.png`}
                          alt={nextRace.Country || nextRace.Location}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="text-red-500 font-sans text-sm uppercase tracking-widest">
                      Round {nextRace.RoundNumber}
                    </div>
                  </div>

                  <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white mb-6">
                    {nextRace.EventName}
                  </h2>

                  <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-gray-400 mb-8">
                    <div className="flex items-center gap-2">
                      <Calendar01Icon className="w-5 h-5 text-red-600" />
                      <span className="font-sans text-lg text-white">{nextRace.displayDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Location01Icon className="w-5 h-5 text-red-600" />
                      <span className="font-sans text-lg text-white">{nextRace.Location}</span>
                    </div>
                    {nextRace.EventFormat === 'sprint' && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500 text-yellow-500 rounded-full">
                        <FlashIcon className="w-4 h-4" />
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Sprint Weekend
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() =>
                      navigate(
                        `/race/${selectedYear}-${nextRace.EventName.toLowerCase().replace(/\s+/g, '-')}`
                      )
                    }
                    className="bg-white text-black hover:bg-red-600 hover:text-white font-bold uppercase tracking-widest rounded-none h-14 px-10 text-lg transition-all"
                  >
                    View Race Hub
                  </Button>
                </div>

                {/* Right: Countdown */}
                {nextSession && (
                  <div className="flex-1 w-full lg:w-auto flex flex-col items-center justify-center bg-gray-900/30 border border-gray-800 p-8 backdrop-blur-sm">
                    <div className="text-gray-500 font-sans text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Clock01Icon className="w-4 h-4 text-red-600" />
                      Upcoming Session:{' '}
                      <span className="text-white font-bold">{nextSession.name}</span>
                    </div>
                    <Countdown targetDate={nextSession.date} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid Layout */}
        <div className="w-full">
          {isLoadingSchedule || isLoadingResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-900/50 animate-pulse border-2 border-gray-800"
                ></div>
              ))}
            </div>
          ) : scheduleError || resultsError ? (
            <div className="text-center py-20 border-2 border-red-600/50 border-dashed bg-red-900/10">
              <AlertCircleIcon className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-xl font-bold uppercase mb-2">Data Unavailable</h3>
              <p className="text-gray-500 font-sans text-sm">
                Could not load race data for {selectedYear}.
              </p>
            </div>
          ) : combinedRaceData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combinedRaceData.map((race) => (
                <RaceCard
                  key={`${new Date(race.EventDate).getFullYear()}-${race.RoundNumber}-${race.EventName}-${race.EventDate}`}
                  event={race}
                  result={race.result}
                  isUpcoming={race.isUpcoming}
                  isTesting={race.isTesting}
                  isSprint={race.isSprint}
                  countryCode={race.countryCode}
                  displayLocation={race.displayLocation}
                  displayDate={race.displayDate}
                  selectedYear={selectedYear}
                  nextSession={nextSession}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-gray-800 border-dashed">
              <p className="text-gray-500 font-sans">No races found for {selectedYear}.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export { Calendar };
export default Calendar;
