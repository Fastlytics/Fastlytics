import { ScheduleEvent } from '@/lib/api';

export const TESTING_LOCATION_HINTS: Record<string, { location: string; country: string }> = {
  bahrain: { location: 'Sakhir', country: 'Bahrain' },
  sakhir: { location: 'Sakhir', country: 'Bahrain' },
  barcelona: { location: 'Barcelona', country: 'Spain' },
  jerez: { location: 'Jerez', country: 'Spain' },
  abu_dhabi: { location: 'Yas Marina', country: 'United Arab Emirates' },
  yas_marina: { location: 'Yas Marina', country: 'United Arab Emirates' },
};

export const isTestingEvent = (event: ScheduleEvent): boolean =>
  Boolean(
    event.EventFormat?.toLowerCase().includes('test') ||
    event.RoundNumber === 0 ||
    event.EventName?.toLowerCase().includes('testing')
  );

export const getEventStartDate = (event: ScheduleEvent): Date => {
  let earliestDate: Date | null = null;

  for (const value of [
    event.Session1Date,
    event.Session2Date,
    event.Session3Date,
    event.Session4Date,
    event.Session5Date,
    event.EventDate,
  ]) {
    if (!value) {
      continue;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      continue;
    }

    if (!earliestDate || parsedDate.getTime() < earliestDate.getTime()) {
      earliestDate = parsedDate;
    }
  }

  return earliestDate ?? new Date(event.EventDate);
};

export const getTestingVenue = (
  event: ScheduleEvent
): { location: string; country: string } | null => {
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

export const toRaceSlug = (eventName: string): string =>
  eventName.toLowerCase().replace(/\s+/g, '-');

export interface ProcessedRaceEvent extends ScheduleEvent {
  result?: import('@/lib/api').RaceResult;
  isUpcoming: boolean;
  isTesting: boolean;
  isSprint: boolean;
  displayDate: string;
  eventStartDate: Date;
  displayLocation: string;
  displayCountry: string;
  countryCode?: string;
}

export interface NextRaceInfo extends ScheduleEvent {
  countryCode?: string;
  displayDate: string;
  isSprint: boolean;
}

export interface NextSessionInfo {
  name: string;
  date: Date;
}
