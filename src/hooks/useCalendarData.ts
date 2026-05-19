// knip-ignore
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchSchedule, fetchRaceResults, ScheduleEvent, RaceResult } from '@/lib/api';
import { getCountryCode } from '@/utils/countryUtils';
import {
  isTestingEvent,
  getEventStartDate,
  getTestingVenue,
  ProcessedRaceEvent,
  NextRaceInfo,
  NextSessionInfo,
} from '@/lib/calendarUtils';

export function useCalendarData() {
  const [now] = useState(() => Date.now());
  const { selectedYear } = useSeason();

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

  const {
    data: resultsData,
    isLoading: isLoadingResults,
    error: resultsError,
  } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
    enabled: !!scheduleData && hasCompletedRaceEventsInSchedule,
  });

  const { combinedRaceData, nextRace, nextSession } = useMemo(() => {
    if (!scheduleData)
      return {
        combinedRaceData: [] as ProcessedRaceEvent[],
        nextRace: null as NextRaceInfo | null,
        nextSession: null as NextSessionInfo | null,
      };

    const resultsMap = new Map(resultsData?.map((res) => [res.event, res]));
    const now = new Date();
    const currentYear = now.getFullYear();

    let nextRaceEvent: NextRaceInfo | null = null;
    let nextSessionData: NextSessionInfo | null = null;

    const sortedSchedule = scheduleData.toSorted(
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
      let upcomingSession = undefined;
      for (const s of sessions) {
        if (new Date(s.date!) > now) {
          upcomingSession = s;
          break;
        }
      }

      if (upcomingSession) {
        const nextCountryCode = getCountryCode(event.Country || event.Location);
        nextRaceEvent = {
          ...event,
          displayDate: new Date(event.EventDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          countryCode: nextCountryCode !== 'xx' ? nextCountryCode : undefined,
          isSprint: /sprint/i.test(event.EventFormat || ''),
        };
        nextSessionData = {
          name: upcomingSession.name!,
          date: new Date(upcomingSession.date!),
        };
        break;
      }
    }

    const processedData: ProcessedRaceEvent[] = scheduleData
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
        ].flatMap((d) => (d ? [new Date(d)] : []));

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
          isSprint: /sprint/i.test(event.EventFormat || ''),
          displayDate: eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
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
  }, [scheduleData, resultsData, selectedYear]);

  return {
    combinedRaceData,
    nextRace,
    nextSession,
    isLoading: isLoadingSchedule || isLoadingResults,
    error: scheduleError || resultsError,
    selectedYear,
  };
}
