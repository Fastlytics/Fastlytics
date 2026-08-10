import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar01Icon,
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
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

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

const HeroCountdown = ({ targetDate }: { targetDate: Date; sessionName: string }) => {
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
              className={`text-2xl font-semibold ${item.highlight ? 'text-[#ff0000]' : 'text-white'}`}
            >
              {pad(item.value)}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/40 font-medium">
              {item.label}
            </div>
          </div>
          {idx < 3 && <span className="text-xl font-bold text-white/20 -mt-3">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

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
          className="w-full max-w-md bg-[#0a0a0a] border-t border-white/[0.04] pb-24 rounded-t-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
            <h3 className="text-base font-semibold">Select Season</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              <Cancel01Icon className="w-5 h-5 text-white/50" />
            </button>
          </div>
          <div className="p-3 max-h-80 overflow-y-auto">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => {
                  onSelect(year);
                  onClose();
                }}
                className={`w-full p-3.5 text-left transition-all flex items-center justify-between mb-1.5 rounded-lg ${
                  selectedYear === year
                    ? 'bg-[#ff0000] text-white'
                    : 'hover:bg-white/[0.04] text-white/80 border border-white/[0.04]'
                }`}
              >
                <span className="text-sm font-medium">{year} Season</span>
                {selectedYear === year && <CheckmarkCircle02Icon className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

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
      className="relative overflow-hidden rounded-lg border border-[#ff0000]/30 cursor-pointer"
      onClick={() =>
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`)
      }
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff0000]" />
      <div className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#ff0000] rounded-full animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-[#ff0000]">
              Next Grand Prix
            </span>
          </div>
          <span className="text-[10px] text-white/40 uppercase">Round {event.RoundNumber}</span>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-10 overflow-hidden border border-white/[0.04] flex-shrink-0 rounded-md">
            {event.countryCode && (
              <img
                src={`https://flagcdn.com/h80/${event.countryCode}.png`}
                alt={event.Country || event.Location}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white leading-tight">
              {event.EventName.replace('Grand Prix', 'GP')}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-white/50 flex items-center gap-1">
                <Calendar01Icon className="w-3 h-3" />
                {event.displayDate}
              </span>
              {event.isSprint && (
                <span className="text-[9px] font-medium uppercase bg-[#ff0000]/10 text-[#ff0000] px-1.5 py-0.5 flex items-center gap-1 rounded">
                  <FlashIcon className="w-2.5 h-2.5" /> Sprint
                </span>
              )}
            </div>
          </div>
        </div>

        {nextSession && (
          <div className="bg-white/[0.02] p-3 border border-white/[0.04] rounded-lg">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Clock01Icon className="w-3 h-3 text-[#ff0000]" />
              <span className="text-[10px] uppercase tracking-wider text-white/50">
                Until <span className="text-white font-medium">{nextSession.name}</span>
              </span>
            </div>
            <HeroCountdown targetDate={nextSession.date} sessionName={nextSession.name} />
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[#ff0000]">
          <span className="text-[10px] font-medium uppercase tracking-wider">View Race Hub</span>
          <ArrowRight01Icon className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
};

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
}

const MobileRaceCard: React.FC<MobileRaceCardProps> = ({ event, selectedYear }) => {
  const navigate = useNavigate();
  const isCompleted = !!event.result;
  const isTesting = event.isTesting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden transition-all cursor-pointer rounded-lg border ${
        isTesting
          ? 'border-blue-600/30 hover:border-blue-500/50'
          : isCompleted
            ? 'border-white/[0.04] opacity-80 hover:opacity-100'
            : 'border-white/[0.04] hover:border-white/[0.08]'
      }`}
      onClick={() =>
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`)
      }
    >
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-md ${
              isTesting ? 'bg-blue-600/20' : isCompleted ? 'bg-white/[0.03]' : 'bg-white text-black'
            }`}
          >
            <span
              className={`text-[11px] font-semibold ${
                isTesting ? 'text-blue-300' : isCompleted ? 'text-white/40' : 'text-black'
              }`}
            >
              {isTesting ? 'T' : event.RoundNumber}
            </span>
          </div>

          <div className="w-9 h-6 overflow-hidden flex-shrink-0 border border-white/[0.04] rounded">
            {event.countryCode && (
              <img
                src={`https://flagcdn.com/h80/${event.countryCode}.png`}
                alt={event.Country || event.Location}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3
                className={`text-[13px] font-medium truncate ${isCompleted ? 'text-white/40' : 'text-white'}`}
              >
                {event.EventName.replace('Grand Prix', 'GP')}
              </h3>
              {!isTesting && event.isSprint && (
                <FlashIcon className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              )}
              {isTesting && (
                <span className="text-[8px] font-medium uppercase bg-blue-600/20 text-blue-300 px-1.5 py-0.5 rounded">
                  Testing
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] ${isCompleted ? 'text-white/20' : 'text-white/40'}`}>
                {event.displayDate}
              </span>
              <span className="text-white/10">·</span>
              <span
                className={`text-[11px] truncate ${isCompleted ? 'text-white/20' : 'text-white/40'}`}
              >
                {event.displayLocation}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            {isTesting ? (
              <span className="text-[9px] font-medium uppercase px-2 py-1 border border-blue-600/30 rounded bg-blue-900/20 text-blue-300">
                Data
              </span>
            ) : event.result ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <ChampionIcon className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium text-white">
                    {event.result.driver.split(' ').pop()}
                  </span>
                </div>
                <span className="text-[10px] text-white/30">
                  {event.result.team?.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span
                className={`text-[9px] font-medium uppercase px-2 py-1 border rounded ${
                  event.isUpcoming
                    ? 'border-blue-900/30 bg-blue-900/10 text-blue-400'
                    : 'border-white/[0.04] bg-white/[0.02] text-white/30'
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

  const { data: resultsData, isLoading: isLoadingResults } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
    enabled: !isLoadingSchedule && hasCompletedRaceEventsInSchedule,
  });

  const { combinedRaceData, nextRace, nextSession } = useMemo(() => {
    if (!scheduleData) return { combinedRaceData: [], nextRace: null, nextSession: null };
    const resultsMap = new Map(resultsData?.map((res) => [res.event, res]));
    const currentTime = new Date();
    const currentYear = currentTime.getFullYear();

    let nextRaceEvent:
      (ScheduleEvent & { countryCode?: string; displayDate: string; isSprint: boolean }) | null =
      null;
    let nextSessionData: { name: string; date: Date } | null = null;

    const sortedSchedule = [...scheduleData].sort(
      (a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime()
    );

    for (const event of sortedSchedule) {
      if (isTestingEvent(event)) continue;

      const sessions = [
        { name: event.Session1, date: event.Session1Date },
        { name: event.Session2, date: event.Session2Date },
        { name: event.Session3, date: event.Session3Date },
        { name: event.Session4, date: event.Session4Date },
        { name: event.Session5, date: event.Session5Date },
      ].filter((s) => s.name && s.date);

      sessions.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      const upcomingSession = sessions.find((s) => new Date(s.date!) > currentTime);

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
        if (testing && selectedYear < currentYear) isUpcoming = false;
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
        if (a.isTesting !== b.isTesting) return a.isTesting ? -1 : 1;
        if (!a.isTesting && !b.isTesting) return a.RoundNumber - b.RoundNumber;
        return a.eventStartDate.getTime() - b.eventStartDate.getTime();
      });

    return {
      combinedRaceData: processedData,
      nextRace: nextRaceEvent,
      nextSession: nextSessionData,
    };
  }, [scheduleData, resultsData, selectedYear, now]);

  const filteredRaces = useMemo(() => {
    let races = combinedRaceData;
    if (nextRace) races = races.filter((r) => r.EventName !== nextRace.EventName);
    if (filter === 'upcoming') return races.filter((r) => r.isUpcoming);
    if (filter === 'completed') return races.filter((r) => !r.isUpcoming);
    return races;
  }, [combinedRaceData, filter, nextRace]);

  const stats = useMemo(() => {
    const completed = combinedRaceData.filter((r) => !r.isUpcoming).length;
    const upcoming = combinedRaceData.filter((r) => r.isUpcoming).length;
    return { completed, upcoming, total: combinedRaceData.length };
  }, [combinedRaceData]);

  const isLoading = isLoadingSchedule || isLoadingResults;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowSeasonSelector(true)}
            className="flex items-center gap-2 border border-white/[0.04] px-3 py-2 text-sm font-medium active:scale-[0.98] transition-transform hover:bg-white/[0.04] rounded-lg"
          >
            <span className="whitespace-nowrap">{selectedYear} Season</span>
            <ArrowDown01Icon className="w-4 h-4 text-white/40 flex-shrink-0" />
          </button>
          <div className="text-[11px] text-white/40 bg-white/[0.03] px-2.5 py-1.5 border border-white/[0.04] rounded-lg">
            {stats.completed}/{stats.total} Complete
          </div>
        </div>

        <div className="flex gap-1 bg-white/[0.02] p-1 border border-white/[0.04] rounded-lg">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'upcoming', label: `Upcoming` },
              { key: 'completed', label: `Done` },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-all rounded-md ${
                filter === f.key ? 'bg-[#ff0000] text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {nextRace && filter !== 'completed' && (
        <div className="px-4 pb-3">
          <NextRaceHero event={nextRace} nextSession={nextSession} selectedYear={selectedYear} />
        </div>
      )}

      {filteredRaces.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/[0.04]" />
            <span className="text-[9px] font-medium uppercase tracking-widest text-white/30">
              {filter === 'completed'
                ? 'Completed'
                : filter === 'upcoming'
                  ? 'Upcoming'
                  : 'All Events'}
            </span>
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>
      )}

      <div className="px-4 pb-6 space-y-1.5">
        {isLoading ? (
          <div className="space-y-1.5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-white/[0.02] animate-pulse border border-white/[0.04] rounded-lg"
              />
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
          <div className="text-center py-16 border border-white/[0.04] rounded-lg">
            <div className="w-12 h-12 mx-auto mb-3 bg-white/[0.03] border border-white/[0.04] flex items-center justify-center rounded-lg">
              <Calendar01Icon className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-sm text-white/40">No races found</p>
            <p className="text-xs text-white/25 mt-1">Try a different filter</p>
          </div>
        )}
      </div>

      <SeasonSelector
        isOpen={showSeasonSelector}
        onClose={() => setShowSeasonSelector(false)}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onSelect={setSelectedYear}
      />
    </div>
  );
};

export { MobileCalendar };
export default MobileCalendar;
