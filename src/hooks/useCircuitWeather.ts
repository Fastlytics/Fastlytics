import { useQuery } from '@tanstack/react-query';

export interface CircuitWeather {
  /** Temperature in Celsius, rounded to integer */
  temperatureC: number;
  /** Precipitation probability 0-100 */
  precipitationProbability: number;
  /** WMO weather code */
  weatherCode: number;
  /** Human-readable weather description */
  description: string;
  /** Short icon identifier for our UI */
  icon: 'sun' | 'cloud' | 'partly-cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
  /** Whether race-day conditions are considered wet */
  isWet: boolean;
  /** Source date used (YYYY-MM-DD) */
  forecastDate: string;
}

interface CircuitWeatherRequest {
  lat: number | null | undefined;
  lng: number | null | undefined;
  eventDate: string | undefined;
  timezone?: string;
  startTime?: string | null | undefined;
  durationHours?: number;
}

/**
 * WMO weather code → simple icon + description.
 * Reference: https://open-meteo.com/en/docs (WMO code table)
 */
function mapWmoCode(code: number): { icon: CircuitWeather['icon']; description: string } {
  if (code === 0) return { icon: 'sun', description: 'Clear' };
  if (code === 1 || code === 2) return { icon: 'partly-cloudy', description: 'Partly cloudy' };
  if (code === 3) return { icon: 'cloud', description: 'Overcast' };
  if (code === 45 || code === 48) return { icon: 'fog', description: 'Fog' };
  if (code >= 51 && code <= 57) return { icon: 'rain', description: 'Drizzle' };
  if (code >= 61 && code <= 67) return { icon: 'rain', description: 'Rain' };
  if (code >= 71 && code <= 77) return { icon: 'snow', description: 'Snow' };
  if (code >= 80 && code <= 82) return { icon: 'rain', description: 'Rain showers' };
  if (code >= 85 && code <= 86) return { icon: 'snow', description: 'Snow showers' };
  if (code >= 95 && code <= 99) return { icon: 'storm', description: 'Thunderstorm' };
  return { icon: 'cloud', description: 'Cloudy' };
}

/**
 * Extract date/time parts in a specific IANA timezone.
 */
function getTimeZoneParts(value: string | Date, timeZone: string) {
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? null;

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');

  if (!year || !month || !day || !hour || !minute) return null;
  return { year, month, day, hour, minute };
}

function fallbackDateString(value: string): string | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
}

export function formatDateInTimeZone(value: string | Date, timeZone?: string): string | null {
  if (timeZone) {
    const parts = getTimeZoneParts(value, timeZone);
    if (parts) return `${parts.year}-${parts.month}-${parts.day}`;
  }

  if (typeof value === 'string') return fallbackDateString(value);

  return isNaN(value.getTime()) ? null : value.toISOString().split('T')[0];
}

export function formatDateTimeInTimeZone(value: string | Date, timeZone?: string): string | null {
  if (timeZone) {
    const parts = getTimeZoneParts(value, timeZone);
    if (parts) return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    if (match) return match[1];
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  return `${date.toISOString().split(':')[0]}:${date.toISOString().split(':')[1]}`;
}

function parseNaiveDateTime(value: string): number | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second = '0'] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function extractLocalDateTime(value: string): string | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match?.[1] ?? null;
}

function addHoursToLocalDateTime(dt: string, hoursToAdd: number): string | null {
  const match = dt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h) + hoursToAdd, Number(min));
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Find the hourly index closest to the given target time, using circuit-local wall-clock values.
 */
export function findClosestHourIndex(times: string[], targetLocalDateTime: string): number {
  const targetMs = parseNaiveDateTime(targetLocalDateTime);
  if (targetMs == null) return 0;

  let closest = 0;
  let minDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const timeMs = parseNaiveDateTime(times[i]);
    if (timeMs == null) continue;

    const diff = Math.abs(timeMs - targetMs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  return closest;
}

export function getSessionForecastDurationHours(sessionName: string): number {
  return sessionName.toLowerCase() === 'race' ? 3 : 1;
}

export async function fetchCircuitWeather({
  lat,
  lng,
  eventDate,
  timezone,
  startTime,
  durationHours = 3,
}: CircuitWeatherRequest): Promise<CircuitWeather | null> {
  if (lat == null || lng == null || !eventDate) return null;

  const forecastSource = startTime || eventDate;
  const date = new Date(forecastSource);
  if (isNaN(date.getTime())) return null;

  const daysFromNow = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysFromNow < -1 || daysFromNow > 16) return null;

  const dateStr = formatDateInTimeZone(forecastSource, timezone);
  if (!dateStr) return null;

  const useHourly = !!startTime;

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    timezone: timezone || 'auto',
  });

  if (useHourly) {
    const startHour = extractLocalDateTime(startTime);
    if (!startHour) return null;

    const endHour = addHoursToLocalDateTime(startHour, durationHours);
    if (!endHour) return null;

    params.set('start_hour', startHour);
    params.set('end_hour', endHour);
    params.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
  } else {
    params.set('start_date', dateStr);
    params.set('end_date', dateStr);
    params.set('daily', 'weather_code,temperature_2m_max,precipitation_probability_max');
  }

  const url = `/api/weather/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const data = await res.json();

  let code: number;
  let temp: number;
  let precipProb: number;

  if (useHourly && data?.hourly?.time?.length) {
    const targetLocalDateTime = extractLocalDateTime(startTime);
    const idx = targetLocalDateTime
      ? findClosestHourIndex(data.hourly.time, targetLocalDateTime)
      : 0;
    code = data.hourly.weather_code?.[idx] ?? 0;
    temp = data.hourly.temperature_2m?.[idx] ?? 0;
    precipProb = data.hourly.precipitation_probability?.[idx] ?? 0;
  } else {
    code = data?.daily?.weather_code?.[0] ?? 0;
    temp = data?.daily?.temperature_2m_max?.[0] ?? 0;
    precipProb = data?.daily?.precipitation_probability_max?.[0] ?? 0;
  }

  const { icon, description } = mapWmoCode(code);
  const isWet =
    precipProb > 50 ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99);

  return {
    temperatureC: Math.round(temp),
    precipitationProbability: Math.round(precipProb),
    weatherCode: code,
    description,
    icon,
    isWet,
    forecastDate: dateStr,
  };
}

/**
 * Fetch a weather forecast from Open-Meteo for a given circuit and race date.
 *
 * When `startTime` is provided (ISO datetime with time), the hook uses Open-Meteo's
 * hourly forecast and returns data for the hour closest to the race start time.
 * Otherwise it falls back to daily aggregates.
 *
 * Only returns data for dates within Open-Meteo's ~16-day forecast window.
 * No API key required.
 */
export function useCircuitWeather(
  lat: number | null | undefined,
  lng: number | null | undefined,
  eventDate: string | undefined,
  timezone?: string,
  startTime?: string | null | undefined,
  durationHours = 3
) {
  return useQuery<CircuitWeather | null>({
    queryKey: ['circuitWeather', lat, lng, eventDate, startTime, timezone, durationHours],
    enabled: lat != null && lng != null && !!eventDate,
    staleTime: 1000 * 60 * 30,
    queryFn: () => fetchCircuitWeather({ lat, lng, eventDate, timezone, startTime, durationHours }),
  });
}
