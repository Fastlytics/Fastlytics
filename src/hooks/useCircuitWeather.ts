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
 * Find the hourly index closest to the given target time.
 */
function findClosestHourIndex(times: string[], target: Date): number {
  const targetMs = target.getTime();
  let closest = 0;
  let minDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - targetMs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  return closest;
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
  startTime?: string | null | undefined
) {
  return useQuery<CircuitWeather | null>({
    queryKey: ['circuitWeather', lat, lng, startTime || eventDate],
    enabled: lat != null && lng != null && !!eventDate,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (lat == null || lng == null || !eventDate) return null;

      const date = new Date(eventDate);
      if (isNaN(date.getTime())) return null;

      const daysFromNow = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysFromNow < -1 || daysFromNow > 16) return null;

      const dateStr = date.toISOString().split('T')[0];
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        start_date: dateStr,
        end_date: dateStr,
        timezone: timezone || 'auto',
      });

      const useHourly = !!startTime;

      if (useHourly) {
        params.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
      } else {
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
        const targetTime = new Date(startTime);
        const idx = findClosestHourIndex(data.hourly.time, targetTime);
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
    },
  });
}
