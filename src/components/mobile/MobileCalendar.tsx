import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar01Icon,
  Location01Icon,
  FlashIcon,
  ChampionIcon,
  ArrowDown01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
} from 'hugeicons-react';
import { getCountryCode } from '@/utils/countryUtils';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchRaceResults, RaceResult, fetchSchedule, ScheduleEvent } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';

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
    if (normalizedName.includes(hint)) return venue;
  }

  if (normalizedName.includes('pre_season_testing')) return TESTING_LOCATION_HINTS.bahrain;

  if (directLocation || directCountry) {
    return {
      location: directLocation || directCountry,
      country: directCountry || directLocation,
    };
  }

  return null;
};

// Hero Countdown Component for next race
const HeroCountdown = ({ targetDate, sessionName }: { targetDate: Date; sessionName: string }) => {
  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date();
    if (difference > 0) {
      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    }
    return { d: 0, h: 0, m: 0, s: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-2">
      {[
        { value: timeLeft.d, label: 'D' },
        { value: timeLeft.h, label: 'H' },
        { value: timeLeft.m, label: 'M' },
        { value: timeLeft.s, label: 'S', highlight: true },
      ].map((item, idx) => (
        <React.Fragment key={item.label}>
          <div className="flex flex-col items-center">
            <div
              className={`text-2xl font-black font-sans ${item.highlight ? 'text-red-500' : 'text-white'}`}
            >
              {pad(item.value)}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">
              {item.label}
            </div>
          </div>
          {idx < 3 && <span className="text-xl font-bold text-gray-700 -mt-3">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// Native Season Selector Modal
interface SeasonSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  availableYears: number[];
  onSelect: (year: number) => void;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  isOpen,
  onClose,
  selectedYear,
  availableYears,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-black border-t-2 border-white/10 pb-24 rounded-t-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-white/10">
            <h3 className="text-lg font-black uppercase italic tracking-tight">Select Season</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 transition-colors">
              <Cancel01Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Options */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => {
                  onSelect(year);
                  onClose();
                }}
                className={`w-full p-4 text-left border-2 transition-all flex items-center justify-between mb-2 rounded-xl ${
                  selectedYear === year
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-black hover:bg-zinc-900 text-gray-300 border-white/10'
                }`}
              >
                <span className="text-lg font-black uppercase italic">{year} Season</span>
                {selectedYear === year && <CheckmarkCircle02Icon className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Next Race Hero Card
interface NextRaceHeroProps {
  event: ScheduleEvent & {
    countryCode?: string;
    displayDate: string;
    isSprint: boolean;
  };
  nextSession: { name: string; date: Date } | null;
  selectedYear: number;
}

const NextRaceHero: React.FC<NextRaceHeroProps> = ({ event, nextSession, selectedYear }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-black border-2 border-red-600 rounded-xl"
      onClick={() => {
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`);
      }}
    >
      <div className="relative p-5">
        {/* Header with badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-red-500">
              Next Grand Prix
            </span>
          </div>
          <span className="text-xs font-sans text-gray-500 uppercase">
            Round {event.RoundNumber}
          </span>
        </div>

        {/* Flag and Event Name */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-11 overflow-hidden border-2 border-white/10 flex-shrink-0 rounded-md">
            {event.countryCode && (
              <img
                src={`https://flagcdn.com/h80/${event.countryCode}.png`}
                alt={event.Country || event.Location}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
              {event.EventName.replace('Grand Prix', 'GP')}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-sm text-gray-400 flex items-center gap-1 font-sans uppercase">
                <Calendar01Icon className="w-3.5 h-3.5" />
                {event.displayDate}
              </span>
              {event.isSprint && (
                <span className="text-[10px] font-black uppercase bg-yellow-500 text-black px-2 py-0.5 flex items-center gap-1 rounded-sm">
                  <FlashIcon className="w-3 h-3" /> Sprint
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Countdown */}
        {nextSession && (
          <div className="bg-zinc-900/50 p-4 border-2 border-white/10 rounded-md">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Clock01Icon className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs uppercase tracking-wider text-gray-400 font-sans">
                Until <span className="text-white font-bold">{nextSession.name}</span>
              </span>
            </div>
            <HeroCountdown targetDate={nextSession.date} sessionName={nextSession.name} />
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-center gap-2 text-red-500 hover:text-red-400 transition-colors">
          <span className="text-xs font-black uppercase tracking-wider">View Race Hub</span>
          <ArrowRight01Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};

// Compact Race Card for mobile
interface MobileRaceCardProps {
  event: ScheduleEvent & {
    result?: RaceResult;
    isUpcoming: boolean;
    isTesting: boolean;
    isSprint: boolean;
    countryCode?: string;
    displayDate: string;
    displayLocation: string;
  };
  selectedYear: number;
  isNextRace?: boolean;
}

const MobileRaceCard: React.FC<MobileRaceCardProps> = ({ event, selectedYear, isNextRace }) => {
  const navigate = useNavigate();
  const isCompleted = !!event.result;
  const isTesting = event.isTesting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden transition-all group cursor-pointer rounded-xl ${
        isTesting
          ? 'bg-blue-950/20 border-2 border-blue-600/50 hover:border-blue-500'
          : isCompleted
            ? 'bg-black border-2 border-white/5 opacity-80 hover:opacity-100'
            : 'bg-black border-2 border-white/10 hover:border-white/20'
      }`}
      onClick={() => {
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`);
      }}
    >
      <div className="p-3.5">
        <div className="flex items-center gap-3">
          {/* Round Number */}
          <div
            className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 rounded-md ${
              isTesting
                ? 'bg-blue-600/20 border-blue-600/50'
                : isCompleted
                  ? 'bg-zinc-900 border-white/5'
                  : 'bg-white text-black border-white'
            }`}
          >
            <span
              className={`text-xs font-black ${
                isTesting ? 'text-blue-300' : isCompleted ? 'text-gray-500' : 'text-black'
              }`}
            >
              {isTesting ? 'T' : event.RoundNumber}
            </span>
          </div>

          {/* Flag */}
          <div
            className={`w-10 h-7 overflow-hidden flex-shrink-0 border-2 rounded-md ${
              isTesting ? 'border-blue-600/40' : isCompleted ? 'border-white/5' : 'border-white/10'
            }`}
          >
            {event.countryCode && (
              <img
                src={`https://flagcdn.com/h80/${event.countryCode}.png`}
                alt={event.Country || event.Location}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3
                className={`font-black text-sm uppercase italic tracking-tight truncate ${
                  isCompleted ? 'text-gray-500' : 'text-white'
                }`}
              >
                {event.EventName.replace('Grand Prix', 'GP')}
              </h3>
              {!isTesting && event.isSprint && (
                <FlashIcon className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              )}
              {isTesting && (
                <span className="text-[9px] font-black uppercase bg-blue-600/20 text-blue-300 px-1.5 py-0.5 border border-blue-600/40 rounded-sm">
                  Testing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-sans uppercase ${isCompleted ? 'text-gray-600' : 'text-gray-500'}`}
              >
                {event.displayDate}
              </span>
              <span className="text-gray-700">•</span>
              <span
                className={`text-xs truncate font-sans uppercase ${isCompleted ? 'text-gray-600' : 'text-gray-500'}`}
              >
                {event.displayLocation}
              </span>
            </div>
          </div>

          {/* Status/Result */}
          <div className="flex-shrink-0 text-right">
            {isTesting ? (
              <span className="text-[10px] font-black uppercase px-2 py-1 border-2 rounded-md bg-blue-900/20 text-blue-300 border-blue-600/40">
                Session Data
              </span>
            ) : event.result ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <ChampionIcon className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-black uppercase text-white">
                    {event.result.driver.split(' ').pop()}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-sans uppercase">
                  {event.result.team?.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span
                className={`text-[10px] font-black uppercase px-2 py-1 border-2 rounded-md ${
                  event.isUpcoming
                    ? 'bg-blue-900/20 text-blue-400 border-blue-900/50'
                    : 'bg-zinc-900 text-gray-500 border-zinc-800'
                }`}
              >
                {event.isUpcoming ? 'TBD' : '-'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MobileCalendar: React.FC = () => {
  const [now] = useState(() => Date.now());
  const { selectedYear, setSelectedYear, availableYears } = useSeason();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);

  // Fetch Full Schedule
  const { data: scheduleData, isLoading: isLoadingSchedule } = useQuery<ScheduleEvent[]>({
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
  const { data: resultsData, isLoading: isLoadingResults } = useQuery<RaceResult[]>({
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

    let nextRaceEvent:
      | (ScheduleEvent & { countryCode?: string; displayDate: string; isSprint: boolean })
      | null = null;
    let nextSessionData: { name: string; date: Date } | null = null;

    const sortedSchedule = [...scheduleData].sort(
      (a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime()
    );

    for (const event of sortedSchedule) {
      if (isTestingEvent(event)) {
        continue; // Hero is race-only.
      }

      const sessions = [
        { name: event.Session1, date: event.Session1Date },
        { name: event.Session2, date: event.Session2Date },
        { name: event.Session3, date: event.Session3Date },
        { name: event.Session4, date: event.Session4Date },
        { name: event.Session5, date: event.Session5Date },
      ].filter((s) => s.name && s.date);

      sessions.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      const upcomingSession = sessions.find((s) => new Date(s.date!) > now);

      if (upcomingSession) {
        const eventDate = new Date(event.EventDate);
        const nextCountryCode = getCountryCode(event.Country || event.Location);
        nextRaceEvent = {
          ...event,
          countryCode: nextCountryCode !== 'xx' ? nextCountryCode : undefined,
          displayDate: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isSprint: event.EventFormat?.toLowerCase().includes('sprint') || false,
        };
        nextSessionData = {
          name: upcomingSession.name!,
          date: new Date(upcomingSession.date!),
        };
        break;
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
          isSprint: event.EventFormat?.toLowerCase().includes('sprint') || false,
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

  // Filter races excluding the next race (it's shown in hero)
  const filteredRaces = useMemo(() => {
    let races = combinedRaceData;

    // Exclude next race from list as it's shown in hero
    if (nextRace) {
      races = races.filter((r) => r.EventName !== nextRace.EventName);
    }

    if (filter === 'upcoming') return races.filter((r) => r.isUpcoming);
    if (filter === 'completed') return races.filter((r) => !r.isUpcoming);
    return races;
  }, [combinedRaceData, filter, nextRace]);

  // Stats for quick info
  const stats = useMemo(() => {
    const completed = combinedRaceData.filter((r) => !r.isUpcoming).length;
    const upcoming = combinedRaceData.filter((r) => r.isUpcoming).length;
    return { completed, upcoming, total: combinedRaceData.length };
  }, [combinedRaceData]);

  const isLoading = isLoadingSchedule || isLoadingResults;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-black text-white">
        <MobilePageHeader />

        {/* Season Selector & Stats */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            {/* Season Selector Button */}
            <button
              onClick={() => setShowSeasonSelector(true)}
              className="flex items-center gap-2 bg-black border-2 border-white/10 px-4 py-2.5 text-base font-black uppercase italic active:scale-95 transition-transform hover:bg-zinc-900 rounded-xl"
            >
              <span className="text-white whitespace-nowrap">{selectedYear} Season</span>
              <ArrowDown01Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            {/* Stats Badge */}
            <div className="text-xs text-gray-500 font-sans uppercase tracking-wider bg-zinc-900 px-3 py-2 border-2 border-white/10 rounded-xl">
              {stats.completed}/{stats.total} Complete
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 bg-black p-1.5 border-2 border-white/10 rounded-xl">
            {(
              [
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: `Upcoming (${stats.upcoming})` },
                { key: 'completed', label: `Done (${stats.completed})` },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 px-3 py-2 text-xs font-black uppercase italic transition-all rounded-lg ${
                  filter === f.key
                    ? 'bg-red-600 text-white'
                    : 'text-gray-500 hover:text-white bg-zinc-900'
                }`}
              >
                {f.key === 'all' ? 'All' : f.key === 'upcoming' ? 'Up' : 'Done'}
              </button>
            ))}
          </div>
        </div>

        {/* Next Race Hero Card */}
        {nextRace && filter !== 'completed' && (
          <div className="px-4 pb-4">
            <NextRaceHero event={nextRace} nextSession={nextSession} selectedYear={selectedYear} />
          </div>
        )}

        {/* Section Header */}
        {filteredRaces.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {filter === 'completed'
                  ? 'Completed Events'
                  : filter === 'upcoming'
                    ? 'Upcoming Events'
                    : 'All Events'}
              </span>
              <div className="h-0.5 flex-1 bg-white/10" />
            </div>
          </div>
        )}

        {/* Race List */}
        <div className="px-4 pb-6 space-y-2.5">
          {isLoading ? (
            <div className="space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900 animate-pulse border-2 border-white/5" />
              ))}
            </div>
          ) : filteredRaces.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredRaces.map((race, index) => (
                <motion.div
                  key={`${new Date(race.EventDate).getFullYear()}-${race.RoundNumber}-${race.EventName}-${race.EventDate}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <MobileRaceCard event={race} selectedYear={selectedYear} />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-16 border-2 border-white/10 bg-zinc-900/30">
              <div className="w-16 h-16 mx-auto mb-4 bg-black border-2 border-white/10 flex items-center justify-center">
                <Calendar01Icon className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-sm text-gray-500 font-sans uppercase">No races found</p>
              <p className="text-xs text-gray-600 mt-1 font-sans uppercase">
                Try a different filter
              </p>
            </div>
          )}
        </div>

        {/* Season Selector Modal */}
        <SeasonSelector
          isOpen={showSeasonSelector}
          onClose={() => setShowSeasonSelector(false)}
          selectedYear={selectedYear}
          availableYears={availableYears}
          onSelect={setSelectedYear}
        />
      </div>
    </MobileLayout>
  );
};

export { MobileCalendar };
export default MobileCalendar;
